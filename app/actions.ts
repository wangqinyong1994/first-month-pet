"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ADOPTION_SOURCES,
  AGE_STAGES,
  ARRIVAL_GROUP_SIZES,
  HEALTH_RECORD_STATUSES,
  isConcernAction,
  isCheckInStatus,
  dateForDay,
  sanitizeConcernKeys,
  shouldCreateTask,
  taskMutationValues
} from "@/lib/domain";
import {
  getUserOrRedirect,
  paidAccess,
  recordProductEvent,
  recordConcernAction,
  staticContent,
  unlockMilestone
} from "@/lib/app-data";
import { siteUrl } from "@/lib/env";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { createCreemCheckout, creemProductId } from "@/lib/creem";
import type {
  AdoptionSource,
  AgeStage,
  ArrivalGroupSize,
  CheckInStatus,
  ConcernAction,
  HealthRecordsStatus,
  PetProfile,
  PetType,
  TaskDefinition
} from "@/lib/types";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) redirect("/login?error=missing_email");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback`
    }
  });

  if (error) redirect("/login?error=send_failed");
  redirect("/login?sent=1");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createProfileAction(formData: FormData) {
  const user = await getUserOrRedirect();
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const concernKeys = sanitizeConcernKeys(formData.getAll("concerns").map(String));

  const profilePayload = { user_id: user.id, ...profileFormValues(formData, String(formData.get("pet_type"))) };

  const { data: profile, error: profileError } = await supabase
    .from("pet_profiles")
    .insert(profilePayload)
    .select("*")
    .single();

  if (profileError) throw profileError;

  if (concernKeys.length) {
    const { error } = await supabase.from("pet_concerns").insert(
      concernKeys.map((concernKey) => ({
        user_id: user.id,
        pet_profile_id: profile.id,
        concern_key: concernKey
      }))
    );
    if (error) throw error;
  }

  await syncTasks(admin, user.id, profile as PetProfile, concernKeys);
  const unlockedFirstDay = await unlockMilestone({
    userId: user.id,
    petProfileId: profile.id,
    milestoneId: "first_day_together"
  });
  await recordProductEvent({ userId: user.id, petProfileId: profile.id as string, eventName: "profile_created" });

  revalidatePath("/");
  redirect(unlockedFirstDay ? "/home?milestone=first_day_together" : "/home");
}

export type ProfileUpdateState =
  | { status: "idle" }
  | { status: "saved" }
  | { status: "error"; message: string };

export type TaskActionState = { status: "idle" } | { status: "error"; message: string };

export async function updateProfileAction(
  _previousState: ProfileUpdateState,
  formData: FormData
): Promise<ProfileUpdateState> {
  const user = await getUserOrRedirect();

  try {
    const profileId = String(formData.get("profile_id"));
    const concernKeys = sanitizeConcernKeys(formData.getAll("concerns").map(String));
    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();

    const { data: existingProfile, error: existingProfileError } = await supabase
      .from("pet_profiles")
      .select("pet_type")
      .eq("id", profileId)
      .eq("user_id", user.id)
      .single();
    if (existingProfileError) throw existingProfileError;

    const { error: profileError } = await supabase
      .from("pet_profiles")
      .update(profileFormValues(formData, existingProfile.pet_type))
      .eq("id", profileId)
      .eq("user_id", user.id);

    if (profileError) throw profileError;

    const { error: clearConcernsError } = await supabase
      .from("pet_concerns")
      .update({ cleared_at: new Date().toISOString() })
      .eq("pet_profile_id", profileId)
      .eq("user_id", user.id)
      .is("cleared_at", null);
    if (clearConcernsError) throw clearConcernsError;

    if (concernKeys.length) {
      const { error } = await supabase.from("pet_concerns").insert(
        concernKeys.map((concernKey) => ({
          user_id: user.id,
          pet_profile_id: profileId,
          concern_key: concernKey
        }))
      );
      if (error) throw error;
    }

    const { data: updatedProfile, error: updatedProfileError } = await supabase
      .from("pet_profiles")
      .select("*")
      .eq("id", profileId)
      .eq("user_id", user.id)
      .single();
    if (updatedProfileError) throw updatedProfileError;

    await syncTasks(admin, user.id, updatedProfile as PetProfile, concernKeys);

    revalidatePath("/home");
    revalidatePath("/plan");
    revalidatePath("/profile");
    return { status: "saved" };
  } catch {
    return { status: "error", message: "We couldn't save your changes. Please try again." };
  }
}

export async function markTaskDoneAction(
  _previousState: TaskActionState,
  formData: FormData
): Promise<TaskActionState> {
  return updateTaskAction("done", formData);
}

export async function undoTaskAction(
  _previousState: TaskActionState,
  formData: FormData
): Promise<TaskActionState> {
  return updateTaskAction("undo", formData);
}

async function updateTaskAction(operation: "done" | "undo", formData: FormData): Promise<TaskActionState> {
  const user = await getUserOrRedirect();
  const taskId = String(formData.get("task_id") ?? "");
  const returnTo = String(formData.get("return_to") ?? "");
  const nodeId = String(formData.get("node_id") ?? "");
  if (!taskId || (returnTo !== "/plan" && returnTo !== "/home")) {
    return { status: "error", message: "We couldn't update this task. Please try again." };
  }

  let redirectTo: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: task, error: taskError } = await supabase
      .from("pet_tasks")
      .select("*, task_definitions(*)")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();
    if (taskError || !task) throw taskError ?? new Error("Task not found");

    const definition = task.task_definitions as TaskDefinition | null;
    if (returnTo === "/plan" && (!nodeId || definition?.node_id !== nodeId)) {
      return { status: "error", message: "We couldn't update this task. Please refresh and try again." };
    }

    const { error: updateError } = await supabase
      .from("pet_tasks")
      .update(taskMutationValues(operation === "done" ? "done" : "undo"))
      .eq("id", taskId)
      .eq("user_id", user.id)
      .eq("is_active", true);
    if (updateError) throw updateError;

    const unlockedMilestones: string[] = [];
    if (operation === "done") {
      if (definition?.milestone_key) {
        const unlocked = await unlockMilestone({
          userId: user.id,
          petProfileId: task.pet_profile_id as string,
          milestoneId: definition.milestone_key,
          triggerTaskId: taskId
        });
        if (unlocked) unlockedMilestones.push(definition.milestone_key);
      }
      unlockedMilestones.push(...(await unlockDerivedMilestones(user.id, task.pet_profile_id as string, taskId, definition)));
      await recordProductEvent({
        userId: user.id,
        petProfileId: task.pet_profile_id as string,
        eventName: "task_completed",
        metadata: { task_definition_id: definition?.id ?? "unknown" }
      });
    }

    revalidatePath("/home");
    revalidatePath("/plan");
    revalidatePath("/profile");
    if (returnTo === "/home") {
      redirectTo = "/home";
    } else {
      const params = new URLSearchParams({ node: nodeId, task: taskId, task_action: operation === "done" ? "completed" : "undone" });
      const milestoneId = unlockedMilestones[0];
      if (milestoneId) params.set("milestone", milestoneId);
      redirectTo = `/plan?${params.toString()}#node-${nodeId}`;
    }
  } catch {
    return { status: "error", message: "We couldn't update this task. Please try again." };
  }
  if (!redirectTo) return { status: "error", message: "We couldn't update this task. Please try again." };
  redirect(redirectTo);
}

export async function submitCheckInAction(formData: FormData) {
  const user = await getUserOrRedirect();
  const petProfileId = String(formData.get("pet_profile_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!isCheckInStatus(status)) throw new Error("Invalid check-in status");

  const supabase = await createSupabaseServerClient();
  const { data: profile, error: profileError } = await supabase
    .from("pet_profiles")
    .select("id, adoption_date")
    .eq("id", petProfileId)
    .eq("user_id", user.id)
    .single();
  if (profileError) throw profileError;

  const checkInDate = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("pet_check_ins").upsert(
    {
      user_id: user.id,
      pet_profile_id: profile.id,
      check_in_date: checkInDate,
      status: status as CheckInStatus
    },
    { onConflict: "pet_profile_id,check_in_date" }
  );
  if (error) throw error;

  await recordProductEvent({
    userId: user.id,
    petProfileId: profile.id,
    eventName: "check_in_submitted",
    metadata: { status }
  });
  revalidatePath("/home");
}

export async function concernActionFormAction(formData: FormData) {
  const user = await getUserOrRedirect();
  const petProfileId = String(formData.get("pet_profile_id"));
  const concernKey = String(formData.get("concern_key"));
  const actionValue = String(formData.get("action") ?? "");
  if (!isConcernAction(actionValue)) throw new Error("Invalid concern action");
  const action = actionValue as ConcernAction;

  const unlocked = await recordConcernAction({ userId: user.id, petProfileId, concernKey, action });
  revalidatePath(`/concerns/${concernKey}`);
  revalidatePath("/profile");
  redirect(unlocked ? `/concerns/${concernKey}?milestone=concern_handled_thoughtfully` : `/concerns/${concernKey}`);
}

export async function createCheckoutSessionAction() {
  const user = await getUserOrRedirect();
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const productId = creemProductId();

  const { data: profile, error: profileError } = await supabase
    .from("pet_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profileError) throw profileError;

  const alreadyPaid = await paidAccess(user.id, profile.id as string);
  if (alreadyPaid) redirect("/home");

  const { data: purchase, error: purchaseError } = await admin
    .from("purchases")
    .insert({
      user_id: user.id,
      pet_profile_id: profile.id,
      status: "pending"
    })
    .select("id")
    .single();

  if (purchaseError) throw purchaseError;

  const checkout = await createCreemCheckout({
    productId,
    requestId: purchase.id as string,
    successUrl: `${siteUrl()}/checkout/return`,
    email: user.email,
    metadata: {
      user_id: user.id,
      pet_profile_id: profile.id as string,
      purchase_id: purchase.id as string
    }
  });

  const { error: sessionError } = await admin
    .from("purchases")
    .update({ creem_checkout_id: checkout.id })
    .eq("id", purchase.id);

  if (sessionError) throw sessionError;
  await recordProductEvent({ userId: user.id, petProfileId: profile.id as string, eventName: "checkout_started" });
  redirect(checkout.checkout_url);
}

async function syncTasks(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  profile: PetProfile,
  concernKeys: string[]
) {
  const { taskDefinitions } = await staticContent();
  const rows = taskDefinitions
    .filter((task) => shouldCreateTask(task, profile, concernKeys))
    .map((task) => ({
      user_id: userId,
      pet_profile_id: profile.id,
      task_definition_id: task.id,
      due_date: dateForDay(profile.adoption_date, task.due_day ?? 1),
      is_active: true
    }));

  if (rows.length) {
    const { error } = await admin
      .from("pet_tasks")
      .upsert(rows, { onConflict: "pet_profile_id,task_definition_id" });
    if (error) throw error;
  }

  const { data: existingTasks, error: existingTasksError } = await admin
    .from("pet_tasks")
    .select("task_definition_id")
    .eq("user_id", userId)
    .eq("pet_profile_id", profile.id);
  if (existingTasksError) throw existingTasksError;

  const activeIds = new Set(rows.map((task) => task.task_definition_id));
  const inactiveIds = (existingTasks ?? [])
    .map((task) => task.task_definition_id as string)
    .filter((taskDefinitionId) => !activeIds.has(taskDefinitionId));
  if (!inactiveIds.length) return;

  const { error: deactivateError } = await admin
    .from("pet_tasks")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("pet_profile_id", profile.id)
    .in("task_definition_id", inactiveIds);
  if (deactivateError) throw deactivateError;
}

function profileFormValues(formData: FormData, petType: string) {
  if (petType !== "cat" && petType !== "dog") throw new Error("Invalid pet type");
  const name = String(formData.get("name") ?? "").trim();
  const adoptionDate = String(formData.get("adoption_date") ?? "");
  const estimatedAgeStage = String(formData.get("estimated_age_stage") ?? "");
  const healthRecordsStatus = String(formData.get("health_records_status") ?? "");
  const adoptionSource = String(formData.get("adoption_source") ?? "");
  const arrivalGroupSize = String(formData.get("arrival_group_size") ?? "one");
  const hasResidentPets = formData.get("has_resident_pets") === "yes";

  if (!name) throw new Error("Pet name is required");
  if (!isPastOrToday(adoptionDate)) throw new Error("Adoption date must be today or earlier");
  if (!AGE_STAGES.includes(estimatedAgeStage as AgeStage)) throw new Error("Invalid age stage");
  if (!HEALTH_RECORD_STATUSES.includes(healthRecordsStatus as HealthRecordsStatus)) throw new Error("Invalid health records status");
  if (!ADOPTION_SOURCES.includes(adoptionSource as AdoptionSource)) throw new Error("Invalid adoption source");
  if (!ARRIVAL_GROUP_SIZES.includes(arrivalGroupSize as ArrivalGroupSize)) throw new Error("Invalid arrival group size");

  return {
    pet_type: petType as PetType,
    name,
    adoption_date: adoptionDate,
    estimated_age_stage: estimatedAgeStage as AgeStage,
    health_records_status: healthRecordsStatus as HealthRecordsStatus,
    adoption_source: adoptionSource as AdoptionSource,
    arrival_group_size: arrivalGroupSize as ArrivalGroupSize,
    has_resident_pets: hasResidentPets
  };
}

function isPastOrToday(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date && date <= new Date().toISOString().slice(0, 10);
}

async function unlockDerivedMilestones(
  userId: string,
  petProfileId: string,
  triggerTaskId: string,
  definition: TaskDefinition | null
): Promise<string[]> {
  const admin = createSupabaseAdminClient();
  const unlockedMilestones: string[] = [];

  if (definition?.node_id === "week_2" || definition?.node_id === "week_3") {
    if (await unlockMilestone({
      userId,
      petProfileId,
      milestoneId: "routine_taking_shape",
      triggerTaskId
    })) unlockedMilestones.push("routine_taking_shape");
  }

  if ((definition?.due_day ?? 0) >= 30 || definition?.node_id === "week_4") {
    if (await unlockMilestone({
      userId,
      petProfileId,
      milestoneId: "first_month_complete",
      triggerTaskId
    })) unlockedMilestones.push("first_month_complete");
  }

  const { data: firstWeekDone, error } = await admin
    .from("pet_tasks")
    .select("id, task_definitions!inner(due_day)")
    .eq("pet_profile_id", petProfileId)
    .eq("is_active", true)
    .eq("status", "done")
    .lte("task_definitions.due_day", 7);

  if (error) throw error;
  if ((firstWeekDone ?? []).length >= 3) {
    if (await unlockMilestone({
      userId,
      petProfileId,
      milestoneId: "settling_in_week_complete",
      triggerTaskId
    })) unlockedMilestones.push("settling_in_week_complete");
  }

  return unlockedMilestones;
}
