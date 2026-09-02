"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { dateForDay, sanitizeConcernKeys, shouldCreateTask } from "@/lib/domain";
import {
  getUserOrRedirect,
  paidAccess,
  recordConcernAction,
  staticContent,
  unlockMilestone
} from "@/lib/app-data";
import { siteUrl } from "@/lib/env";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { createCreemCheckout, creemProductId } from "@/lib/creem";
import type { ConcernAction, PetProfile, TaskDefinition } from "@/lib/types";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) redirect("/login?error=missing_email");

  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? siteUrl();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`
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

  const profilePayload = {
    user_id: user.id,
    pet_type: String(formData.get("pet_type")),
    name: String(formData.get("name") ?? "").trim(),
    adoption_date: String(formData.get("adoption_date")),
    estimated_age_stage: String(formData.get("estimated_age_stage")),
    health_records_status: String(formData.get("health_records_status")),
    adoption_source: String(formData.get("adoption_source"))
  };

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

  await materializeTasks(admin, user.id, profile as PetProfile, concernKeys);
  await unlockMilestone({
    userId: user.id,
    petProfileId: profile.id,
    milestoneId: "first_day_together"
  });

  revalidatePath("/");
  redirect("/home");
}

export async function updateProfileAction(formData: FormData) {
  const user = await getUserOrRedirect();
  const profileId = String(formData.get("profile_id"));
  const concernKeys = sanitizeConcernKeys(formData.getAll("concerns").map(String));
  const supabase = await createSupabaseServerClient();

  const { error: profileError } = await supabase
    .from("pet_profiles")
    .update({
      name: String(formData.get("name") ?? "").trim(),
      adoption_date: String(formData.get("adoption_date")),
      estimated_age_stage: String(formData.get("estimated_age_stage")),
      health_records_status: String(formData.get("health_records_status")),
      adoption_source: String(formData.get("adoption_source"))
    })
    .eq("id", profileId)
    .eq("user_id", user.id);

  if (profileError) throw profileError;

  await supabase
    .from("pet_concerns")
    .update({ cleared_at: new Date().toISOString() })
    .eq("pet_profile_id", profileId)
    .eq("user_id", user.id)
    .is("cleared_at", null);

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

  revalidatePath("/profile");
  redirect("/profile");
}

export async function markTaskDoneAction(formData: FormData) {
  const user = await getUserOrRedirect();
  const taskId = String(formData.get("task_id"));
  const supabase = await createSupabaseServerClient();

  const { data: task, error: taskError } = await supabase
    .from("pet_tasks")
    .select("*, task_definitions(*)")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  if (taskError) throw taskError;

  const { error: updateError } = await supabase
    .from("pet_tasks")
    .update({ status: "done", done_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (updateError) throw updateError;

  const definition = task.task_definitions as TaskDefinition | null;
  if (definition?.milestone_key) {
    await unlockMilestone({
      userId: user.id,
      petProfileId: task.pet_profile_id as string,
      milestoneId: definition.milestone_key,
      triggerTaskId: taskId
    });
  }

  await unlockDerivedMilestones(user.id, task.pet_profile_id as string, taskId, definition);
  revalidatePath("/home");
  revalidatePath("/plan");
  revalidatePath("/profile");
}

export async function concernActionFormAction(formData: FormData) {
  const user = await getUserOrRedirect();
  const petProfileId = String(formData.get("pet_profile_id"));
  const concernKey = String(formData.get("concern_key"));
  const action = String(formData.get("action")) as ConcernAction;

  await recordConcernAction({ userId: user.id, petProfileId, concernKey, action });
  revalidatePath(`/concerns/${concernKey}`);
  revalidatePath("/profile");
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
  redirect(checkout.checkout_url);
}

async function materializeTasks(
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
      due_date: dateForDay(profile.adoption_date, task.due_day ?? 1)
    }));

  if (!rows.length) return;

  const { error } = await admin
    .from("pet_tasks")
    .upsert(rows, { onConflict: "pet_profile_id,task_definition_id" });
  if (error) throw error;
}

async function unlockDerivedMilestones(
  userId: string,
  petProfileId: string,
  triggerTaskId: string,
  definition: TaskDefinition | null
) {
  const admin = createSupabaseAdminClient();

  if (definition?.node_id === "week_2" || definition?.node_id === "week_3") {
    await unlockMilestone({
      userId,
      petProfileId,
      milestoneId: "routine_taking_shape",
      triggerTaskId
    });
  }

  if ((definition?.due_day ?? 0) >= 30 || definition?.node_id === "week_4") {
    await unlockMilestone({
      userId,
      petProfileId,
      milestoneId: "first_month_complete",
      triggerTaskId
    });
  }

  const { data: firstWeekDone, error } = await admin
    .from("pet_tasks")
    .select("id, task_definitions!inner(due_day)")
    .eq("pet_profile_id", petProfileId)
    .eq("status", "done")
    .lte("task_definitions.due_day", 7);

  if (error) throw error;
  if ((firstWeekDone ?? []).length >= 3) {
    await unlockMilestone({
      userId,
      petProfileId,
      milestoneId: "settling_in_week_complete",
      triggerTaskId
    });
  }
}
