import { redirect } from "next/navigation";
import {
  dateForDay,
  dayNumber,
  defaultPlanNodeId,
  isAfterFirstMonth,
  nodeForDay,
  planNodeTimeState,
  selectConcernGuidance,
  sortConcernKeys,
  taskUiState,
  taskProgress,
  publicLandingPreview,
  visibleConcernGuidance,
  visiblePlanNode
} from "./domain";
import { completedMilestoneTriggers } from "./milestones";
import { createSupabaseAdminClient, createSupabaseServerClient } from "./supabase/server";
import type {
  CarePlanNode,
  ConcernAction,
  ConcernGuidance,
  MilestoneDefinition,
  PetMilestone,
  PetCheckIn,
  PetProfile,
  PetTask,
  ProductEventName,
  PurchaseStatus,
  TaskDefinition
} from "./types";

export async function getUserOrRedirect() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  return user;
}

export async function getProfile(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pet_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as PetProfile | null;
}

export async function requireProfile(userId: string) {
  const profile = await getProfile(userId);
  if (!profile) redirect("/onboarding");
  return profile;
}

export async function paidAccess(userId: string, petProfileId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("purchases")
    .select("status")
    .eq("user_id", userId)
    .eq("pet_profile_id", petProfileId);

  if (error) throw error;
  return (data ?? []).some((row) => row.status === "paid");
}

export async function staticContent() {
  const admin = createSupabaseAdminClient();
  const [nodes, tasks, guidance, milestones] = await Promise.all([
    admin.from("care_plan_nodes").select("*").order("sort_order"),
    admin.from("task_definitions").select("*").order("due_day"),
    admin.from("concern_guidance").select("*").order("priority_rank"),
    admin.from("milestone_definitions").select("*").order("sort_order")
  ]);

  for (const result of [nodes, tasks, guidance, milestones]) {
    if (result.error) throw result.error;
  }

  return {
    nodes: (nodes.data ?? []) as CarePlanNode[],
    taskDefinitions: (tasks.data ?? []) as TaskDefinition[],
    guidance: (guidance.data ?? []).map((item) => ({
      id: item.id,
      concern_key: item.concern_key,
      pet_type: item.pet_type,
      priority_rank: item.priority_rank,
      common_settling_in: item.common_settling_in,
      ask_a_vet: item.ask_a_vet,
      seek_urgent_care: item.seek_urgent_care,
      priority_reason: item.priority_reason
    })) as ConcernGuidance[],
    milestoneDefinitions: (milestones.data ?? []) as MilestoneDefinition[]
  };
}

export async function getPublicLandingData() {
  const admin = createSupabaseAdminClient();
  const { data: freeNode, error: freeNodeError } = await admin
    .from("care_plan_nodes")
    .select("*")
    .eq("free_preview", true)
    .order("sort_order")
    .maybeSingle();

  if (freeNodeError) throw freeNodeError;
  if (!freeNode) throw new Error("Free Day 1 preview is unavailable");

  const [lockedNodes, tasks] = await Promise.all([
    admin
      .from("care_plan_nodes")
      .select("id, title, day_start, day_end")
      .eq("free_preview", false)
      .order("sort_order"),
    admin
      .from("task_definitions")
      .select("title, description")
      .eq("node_id", freeNode.id)
      .eq("trigger_type", "always")
      .eq("is_paid_feature", false)
      .order("due_day")
  ]);

  if (lockedNodes.error) throw lockedNodes.error;
  if (tasks.error) throw tasks.error;

  const preview = publicLandingPreview(
    freeNode as CarePlanNode,
    (lockedNodes.data ?? []) as Array<Pick<CarePlanNode, "id" | "title" | "day_start" | "day_end">>
  );

  return {
    ...preview,
    tasks: (tasks.data ?? []).map(({ title, description }) => ({ title, description })) as Array<
      Pick<TaskDefinition, "title" | "description">
    >
  };
}

export async function userState(userId: string, profile: PetProfile) {
  const supabase = createSupabaseAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const [concerns, tasks, milestones, purchases, checkIn] = await Promise.all([
    supabase
      .from("pet_concerns")
      .select("concern_key")
      .eq("user_id", userId)
      .eq("pet_profile_id", profile.id)
      .is("cleared_at", null),
    supabase
      .from("pet_tasks")
      .select("*, task_definitions(*)")
      .eq("user_id", userId)
      .eq("pet_profile_id", profile.id)
      .eq("is_active", true)
      .order("due_date"),
    supabase
      .from("pet_milestones")
      .select("*")
      .eq("user_id", userId)
      .eq("pet_profile_id", profile.id)
      .order("unlocked_at", { ascending: false }),
    supabase
      .from("purchases")
      .select("status, creem_checkout_id")
      .eq("user_id", userId)
      .eq("pet_profile_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("pet_check_ins")
      .select("*")
      .eq("user_id", userId)
      .eq("pet_profile_id", profile.id)
      .eq("check_in_date", today)
      .maybeSingle()
  ]);

  for (const result of [concerns, tasks, milestones, purchases, checkIn]) {
    if (result.error) throw result.error;
  }

  let milestoneRows = (milestones.data ?? []) as PetMilestone[];
  const newlyUnlockedMilestones = await reconcileMilestones(
    userId,
    profile.id,
    (tasks.data ?? []) as PetTask[]
  );
  if (newlyUnlockedMilestones.length) {
    const refreshedMilestones = await supabase
      .from("pet_milestones")
      .select("*")
      .eq("user_id", userId)
      .eq("pet_profile_id", profile.id)
      .order("unlocked_at", { ascending: false });
    if (refreshedMilestones.error) throw refreshedMilestones.error;
    milestoneRows = (refreshedMilestones.data ?? []) as PetMilestone[];
  }

  const purchaseRows = (purchases.data ?? []) as {
    status: PurchaseStatus;
    creem_checkout_id: string | null;
  }[];

  return {
    concernKeys: (concerns.data ?? []).map((row) => row.concern_key as string),
    tasks: (tasks.data ?? []) as PetTask[],
    milestones: milestoneRows,
    purchases: purchaseRows,
    todayCheckIn: checkIn.data as PetCheckIn | null,
    paid: purchaseRows.some((row) => row.status === "paid")
  };
}

export async function getHomeData() {
  const user = await getUserOrRedirect();
  const profile = await requireProfile(user.id);
  const [{ nodes, guidance, milestoneDefinitions }, state] = await Promise.all([
    staticContent(),
    userState(user.id, profile)
  ]);

  const currentDay = dayNumber(profile.adoption_date);
  const afterFirstMonth = isAfterFirstMonth(currentDay);
  const currentNode = afterFirstMonth ? null : nodeForDay(nodes, currentDay);
  const visibleNode = currentNode ? visiblePlanNode(currentNode, state.paid) : null;
  const sortedConcerns = sortConcernKeys(state.concernKeys, guidance, profile.pet_type).map((key) => ({
    key,
    guidance: selectConcernGuidance(guidance, key, profile.pet_type)
  }));
  const visibleTasks = state.tasks.filter((task) => state.paid || !task.task_definitions?.is_paid_feature);
  const nextTask =
    visibleTasks.find((task) => taskUiState(task) === "overdue") ??
    visibleTasks.find((task) => taskUiState(task) === "upcoming") ??
    null;
  const recentMilestone = state.milestones[0] ?? null;

  await recordProductEvent({
    userId: user.id,
    petProfileId: profile.id,
    eventName: "home_viewed",
    metadata: { current_day: currentDay, paid: state.paid }
  });

  return {
    user,
    profile,
    paid: state.paid,
    currentDay,
    afterFirstMonth,
    currentNode: visibleNode,
    currentNodeDate: currentNode ? nodeDateLabel(profile.adoption_date, currentNode) : "",
    concerns: sortedConcerns,
    todayCheckIn: state.todayCheckIn,
    nextTask,
    hasOutstandingTasks: visibleTasks.some((task) => taskUiState(task) !== "done"),
    nextTaskState: nextTask ? taskUiState(nextTask) : null,
    recentMilestone,
    recentMilestoneDefinition: recentMilestone
      ? milestoneDefinitions.find((item) => item.id === recentMilestone.milestone_id) ?? null
      : null
  };
}

export async function getPlanData() {
  const user = await getUserOrRedirect();
  const profile = await requireProfile(user.id);
  const [{ nodes }, state] = await Promise.all([staticContent(), userState(user.id, profile)]);
  const currentDay = dayNumber(profile.adoption_date);
  const visibleTasks = state.paid
    ? state.tasks
    : state.tasks.filter((task) => !task.task_definitions?.is_paid_feature);

  const planNodes = nodes.map((node) => {
    const nodeTasks = visibleTasks
      .filter((task) => task.task_definitions?.node_id === node.id)
      .sort((left, right) => Number(taskUiState(left) === "done") - Number(taskUiState(right) === "done"));
    return {
      ...visiblePlanNode(node, state.paid),
      dateLabel: nodeDateLabel(profile.adoption_date, node),
      timeState: planNodeTimeState(node, currentDay),
      taskProgress: taskProgress(nodeTasks),
      tasks: nodeTasks
    };
  });
  const progress = taskProgress(visibleTasks);

  return {
    profile,
    paid: state.paid,
    currentDay,
    afterFirstMonth: isAfterFirstMonth(currentDay),
    currentStage: planNodes.find((node) => node.timeState === "today")?.title ?? null,
    progress,
    defaultOpenNodeId: defaultPlanNodeId(planNodes),
    nodes: planNodes
  };
}

export async function getProfileData() {
  const user = await getUserOrRedirect();
  const profile = await requireProfile(user.id);
  const [{ milestoneDefinitions }, state] = await Promise.all([
    staticContent(),
    userState(user.id, profile)
  ]);

  return {
    user,
    profile,
    paid: state.paid,
    concernKeys: state.concernKeys,
    purchases: state.purchases,
    milestones: milestoneDefinitions.map((definition) => ({
      definition,
      unlocked:
        state.milestones.find((milestone) => milestone.milestone_id === definition.id) ?? null
    }))
  };
}

export async function getConcernDetail(concernKey: string) {
  const user = await getUserOrRedirect();
  const profile = await requireProfile(user.id);
  const [{ guidance }, state] = await Promise.all([staticContent(), userState(user.id, profile)]);
  const admin = createSupabaseAdminClient();
  const { data: latestAction, error: latestActionError } = await admin
    .from("concern_actions")
    .select("action")
    .eq("user_id", user.id)
    .eq("pet_profile_id", profile.id)
    .eq("concern_key", concernKey)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestActionError) throw latestActionError;
  const detail = selectConcernGuidance(guidance, concernKey, profile.pet_type);
  if (!detail) return null;

  await recordProductEvent({
    userId: user.id,
    petProfileId: profile.id,
    eventName: "concern_opened",
    metadata: { concern_key: concernKey, paid: state.paid }
  });

  return {
    profile,
    concernKey,
    paid: state.paid,
    selectedAction: (latestAction?.action as ConcernAction | null) ?? null,
    detail: visibleConcernGuidance(detail, state.paid)
  };
}

export async function recordProductEvent(input: {
  userId: string;
  petProfileId?: string;
  eventName: ProductEventName;
  metadata?: Record<string, string | number | boolean>;
}) {
  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("product_events").insert({
      user_id: input.userId,
      pet_profile_id: input.petProfileId ?? null,
      event_name: input.eventName,
      metadata: input.metadata ?? {}
    });
    if (error) throw error;
  } catch {
    // Product-event collection must not block the visitor's primary action.
  }
}

export async function checkoutStatus(checkoutId: string) {
  const user = await getUserOrRedirect();
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("purchases")
    .select("status")
    .eq("user_id", user.id)
    .eq("creem_checkout_id", checkoutId)
    .maybeSingle();

  if (error) throw error;
  return (data?.status ?? "pending") as PurchaseStatus;
}

export async function unlockMilestone(input: {
  userId: string;
  petProfileId: string;
  milestoneId: string;
  triggerTaskId?: string;
  triggerConcernActionId?: string;
}) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("pet_milestones").upsert(
    {
      user_id: input.userId,
      pet_profile_id: input.petProfileId,
      milestone_id: input.milestoneId,
      trigger_task_id: input.triggerTaskId ?? null,
      trigger_concern_action_id: input.triggerConcernActionId ?? null
    },
    { onConflict: "pet_profile_id,milestone_id", ignoreDuplicates: true }
  ).select("milestone_id");

  if (error) throw error;
  return (data ?? []).length > 0;
}

export async function reconcileMilestones(
  userId: string,
  petProfileId: string,
  tasks?: PetTask[]
) {
  const admin = createSupabaseAdminClient();
  let completedTasks = tasks;

  if (!completedTasks) {
    const { data, error } = await admin
      .from("pet_tasks")
      .select("*, task_definitions(*)")
      .eq("user_id", userId)
      .eq("pet_profile_id", petProfileId)
      .eq("is_active", true)
      .eq("status", "done");
    if (error) throw error;
    completedTasks = (data ?? []) as PetTask[];
  }

  const triggers = completedMilestoneTriggers(completedTasks, userId, petProfileId);
  const inserted = await Promise.all(
    triggers.map((trigger) => unlockMilestone({
      userId,
      petProfileId,
      milestoneId: trigger.milestoneId,
      triggerTaskId: trigger.triggerTaskId
    }))
  );

  return triggers.filter((_trigger, index) => inserted[index]).map((trigger) => trigger.milestoneId);
}

export async function recordConcernAction(input: {
  userId: string;
  petProfileId: string;
  concernKey: string;
  action: ConcernAction;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: profile, error: profileError } = await supabase
    .from("pet_profiles")
    .select("id")
    .eq("id", input.petProfileId)
    .eq("user_id", input.userId)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) throw new Error("Pet profile not found");

  const { data, error } = await supabase
    .from("concern_actions")
    .insert({
      user_id: input.userId,
      pet_profile_id: input.petProfileId,
      concern_key: input.concernKey,
      action: input.action
    })
    .select("id")
    .single();

  if (error) throw error;
  return unlockMilestone({
    userId: input.userId,
    petProfileId: input.petProfileId,
    milestoneId: "concern_handled_thoughtfully",
    triggerConcernActionId: data.id as string
  });
}

export function nodeDateLabel(adoptionDate: string, node: Pick<CarePlanNode, "day_start" | "day_end">) {
  if (node.day_start === node.day_end) return dateForDay(adoptionDate, node.day_start);
  return `${dateForDay(adoptionDate, node.day_start)} to ${dateForDay(adoptionDate, node.day_end)}`;
}
