import { redirect } from "next/navigation";
import {
  dateForDay,
  dayNumber,
  nodeForDay,
  selectConcernGuidance,
  sortConcernKeys,
  taskUiState,
  visiblePlanNode
} from "./domain";
import { createSupabaseAdminClient, createSupabaseServerClient } from "./supabase/server";
import type {
  CarePlanNode,
  ConcernAction,
  ConcernGuidance,
  MilestoneDefinition,
  PetMilestone,
  PetProfile,
  PetTask,
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
    guidance: (guidance.data ?? []) as ConcernGuidance[],
    milestoneDefinitions: (milestones.data ?? []) as MilestoneDefinition[]
  };
}

export async function userState(userId: string, profile: PetProfile) {
  const supabase = createSupabaseAdminClient();
  const [concerns, tasks, milestones, purchases] = await Promise.all([
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
      .order("created_at", { ascending: false })
  ]);

  for (const result of [concerns, tasks, milestones, purchases]) {
    if (result.error) throw result.error;
  }

  const purchaseRows = (purchases.data ?? []) as {
    status: PurchaseStatus;
    creem_checkout_id: string | null;
  }[];

  return {
    concernKeys: (concerns.data ?? []).map((row) => row.concern_key as string),
    tasks: (tasks.data ?? []) as PetTask[],
    milestones: (milestones.data ?? []) as PetMilestone[],
    purchases: purchaseRows,
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
  const currentNode = nodeForDay(nodes, currentDay);
  const visibleNode = currentNode ? visiblePlanNode(currentNode, state.paid) : null;
  const sortedConcerns = sortConcernKeys(state.concernKeys, guidance, profile.pet_type).map((key) => ({
    key,
    guidance: selectConcernGuidance(guidance, key, profile.pet_type)
  }));
  const visibleTasks = state.tasks.filter((task) => state.paid || !task.task_definitions?.is_paid_feature);
  const nextTask =
    visibleTasks.find((task) => taskUiState(task) === "overdue") ??
    visibleTasks.find((task) => taskUiState(task) === "upcoming") ??
    visibleTasks.find((task) => taskUiState(task) === "done") ??
    null;
  const recentMilestone = state.milestones[0] ?? null;

  return {
    user,
    profile,
    paid: state.paid,
    currentDay,
    currentNode: visibleNode,
    currentNodeDate: currentNode ? nodeDateLabel(profile.adoption_date, currentNode) : "",
    concerns: sortedConcerns,
    nextTask,
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

  return {
    profile,
    paid: state.paid,
    tasks: visibleTasks,
    nodes: nodes.map((node) => ({
      ...visiblePlanNode(node, state.paid),
      dateLabel: nodeDateLabel(profile.adoption_date, node),
      status: node.day_end < currentDay ? "completed" : node.day_start <= currentDay ? "current" : "upcoming",
      tasks: visibleTasks.filter((task) => task.task_definitions?.node_id === node.id)
    }))
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
  const detail = selectConcernGuidance(guidance, concernKey, profile.pet_type);
  if (!detail) return null;

  return {
    profile,
    concernKey,
    paid: state.paid,
    detail: state.paid
      ? detail
      : {
          ...detail,
          ask_a_vet: "",
          seek_urgent_care: "",
          source_notes: null
        }
  };
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
  const { error } = await admin.from("pet_milestones").upsert(
    {
      user_id: input.userId,
      pet_profile_id: input.petProfileId,
      milestone_id: input.milestoneId,
      trigger_task_id: input.triggerTaskId ?? null,
      trigger_concern_action_id: input.triggerConcernActionId ?? null
    },
    { onConflict: "pet_profile_id,milestone_id", ignoreDuplicates: true }
  );

  if (error) throw error;
}

export async function recordConcernAction(input: {
  userId: string;
  petProfileId: string;
  concernKey: string;
  action: ConcernAction;
}) {
  const supabase = await createSupabaseServerClient();
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
  await unlockMilestone({
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
