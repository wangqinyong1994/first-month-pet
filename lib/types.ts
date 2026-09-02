export type PetType = "cat" | "dog";
export type AgeStage = "kitten_puppy" | "adult" | "senior" | "unknown";
export type HealthRecordsStatus = "yes" | "no" | "not_sure";
export type AdoptionSource = "shelter" | "breeder" | "friend" | "stray" | "other";
export type PurchaseStatus = "pending" | "paid" | "refunded" | "failed" | "canceled";
export type ConcernAction = "observe" | "ask_a_vet" | "seek_urgent_care";

export type PetProfile = {
  id: string;
  user_id: string;
  pet_type: PetType;
  name: string;
  adoption_date: string;
  estimated_age_stage: AgeStage;
  health_records_status: HealthRecordsStatus;
  adoption_source: AdoptionSource;
};

export type CarePlanNode = {
  id: string;
  node_type: "day" | "week";
  day_start: number;
  day_end: number;
  title: string;
  common_signs: string;
  what_to_do: string;
  when_to_seek_help: string;
  free_preview: boolean;
  sort_order: number;
};

export type TaskDefinition = {
  id: string;
  node_id: string | null;
  title: string;
  description: string | null;
  trigger_type: string;
  due_day: number | null;
  is_paid_feature: boolean;
  milestone_key: string | null;
};

export type PetTask = {
  id: string;
  user_id: string;
  pet_profile_id: string;
  task_definition_id: string;
  due_date: string;
  status: "not_done" | "done";
  done_at: string | null;
  task_definitions?: TaskDefinition | null;
};

export type ConcernGuidance = {
  id: string;
  concern_key: string;
  pet_type: PetType | null;
  priority_rank: number;
  common_settling_in: string;
  ask_a_vet: string;
  seek_urgent_care: string;
  priority_reason: string;
  source_notes: string | null;
};

export type MilestoneDefinition = {
  id: string;
  title: string;
  value_copy: string;
  locked_hint: string;
  trigger_type: string;
  sort_order: number;
  is_paid_visible: boolean;
};

export type PetMilestone = {
  id: string;
  user_id: string;
  pet_profile_id: string;
  milestone_id: string;
  unlocked_at: string;
  trigger_task_id: string | null;
  trigger_concern_action_id: string | null;
};
