"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ADOPTION_SOURCES,
  AGE_STAGES,
  ARRIVAL_GROUP_SIZES,
  HEALTH_RECORD_STATUSES,
  dayNumber,
  isAfterFirstMonth,
  isPastOrToday,
  isConcernAction,
  isCheckInStatus,
  sanitizeConcernKeys,
  taskMutationValues
} from "@/lib/domain";
import {
  getUserOrRedirect,
  paidAccess,
  recordProductEvent,
  recordConcernAction,
  reconcileMilestones,
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

export type ProfileCreateState = { status: "idle" } | { status: "error"; message: string };
export type CheckoutState = { status: "idle" } | { status: "error"; message: string };
type PendingPurchase = {
  id: string;
  creem_checkout_id: string | null;
  creem_checkout_url: string | null;
  checkout_claimed: boolean;
  checkout_claimed_at: string | null;
};

export async function createProfileAction(
  _previousState: ProfileCreateState,
  formData: FormData
): Promise<ProfileCreateState> {
  const user = await getUserOrRedirect();
  let unlockedFirstDay = false;
  try {
    const supabase = await createSupabaseServerClient();
    const concernKeys = sanitizeConcernKeys(formData.getAll("concerns").map(String));
    const profileValues = profileFormValues(formData, String(formData.get("pet_type")));
    const profileId = await syncProfile(supabase, null, profileValues, concernKeys);
    unlockedFirstDay = await unlockMilestone({
      userId: user.id,
      petProfileId: profileId,
      milestoneId: "first_day_together"
    });
    await recordProductEvent({ userId: user.id, petProfileId: profileId, eventName: "profile_created" });

    revalidatePath("/");
  } catch {
    return { status: "error", message: "We couldn't create this profile. Check the details and try again." };
  }
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

    const { data: existingProfile, error: existingProfileError } = await supabase
      .from("pet_profiles")
      .select("pet_type")
      .eq("id", profileId)
      .eq("user_id", user.id)
      .single();
    if (existingProfileError) throw existingProfileError;

    await syncProfile(
      supabase,
      profileId,
      profileFormValues(formData, existingProfile.pet_type),
      concernKeys
    );

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

    const { data: profile, error: profileError } = await supabase
      .from("pet_profiles")
      .select("adoption_date")
      .eq("id", task.pet_profile_id)
      .eq("user_id", user.id)
      .single();
    if (profileError) throw profileError;
    if (isAfterFirstMonth(dayNumber(profile.adoption_date))) {
      return { status: "error", message: "The first-month plan is now read-only." };
    }

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
      unlockedMilestones.push(...(await reconcileMilestones(user.id, task.pet_profile_id as string)));
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
  if (isAfterFirstMonth(dayNumber(profile.adoption_date))) return;

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

export async function createCheckoutSessionAction(
  _previousState: CheckoutState,
  _formData: FormData
): Promise<CheckoutState> {
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

  const checkoutClaimToken = randomUUID();
  const { data: purchaseData, error: purchaseError } = await admin.rpc("acquire_pending_purchase", {
    p_user_id: user.id,
    p_pet_profile_id: profile.id,
    p_claim_token: checkoutClaimToken
  }).single();
  if (purchaseError) throw purchaseError;
  const purchase = purchaseData as PendingPurchase | null;
  if (!purchase) throw new Error("Could not create a pending purchase");

  if (purchase.creem_checkout_url) redirect(purchase.creem_checkout_url);
  if (!purchase.checkout_claimed) return { status: "error", message: "Checkout is already starting. Please try again in a moment." };

  let checkout: Awaited<ReturnType<typeof createCreemCheckout>>;
  try {
    checkout = await createCreemCheckout({
      productId,
      requestId: purchase.id,
      successUrl: `${siteUrl()}/checkout/return`,
      email: user.email,
      metadata: {
        user_id: user.id,
        pet_profile_id: profile.id,
        purchase_id: purchase.id
      }
    });
  } catch {
    const { error } = await admin
      .from("purchases")
      .update({ status: "failed" })
      .eq("id", purchase.id)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .eq("checkout_claim_token", checkoutClaimToken)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    return { status: "error", message: "We couldn't start checkout. Please try again." };
  }

  const { data: savedPurchase, error: sessionError } = await admin
    .from("purchases")
    .update({
      creem_checkout_id: checkout.id,
      creem_checkout_url: checkout.checkout_url,
      checkout_claimed_at: null,
      checkout_claim_token: null
    })
    .eq("id", purchase.id)
    .eq("checkout_claim_token", checkoutClaimToken)
    .select("id")
    .maybeSingle();

  if (sessionError || !savedPurchase) throw sessionError ?? new Error("Could not save checkout session");
  await recordProductEvent({ userId: user.id, petProfileId: profile.id, eventName: "checkout_started" });
  redirect(checkout.checkout_url);
}

async function syncProfile(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profileId: string | null,
  profileValues: ReturnType<typeof profileFormValues>,
  concernKeys: string[]
) {
  const { data, error } = await supabase.rpc("sync_pet_profile", {
    p_profile_id: profileId,
    p_pet_type: profileValues.pet_type,
    p_name: profileValues.name,
    p_adoption_date: profileValues.adoption_date,
    p_estimated_age_stage: profileValues.estimated_age_stage,
    p_health_records_status: profileValues.health_records_status,
    p_adoption_source: profileValues.adoption_source,
    p_arrival_group_size: profileValues.arrival_group_size,
    p_has_resident_pets: profileValues.has_resident_pets,
    p_concern_keys: concernKeys
  });
  if (error) throw error;
  if (typeof data !== "string") throw new Error("Profile sync did not return a profile id");
  return data;
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
