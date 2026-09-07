export type PetType = "cat" | "dog";
export type AgeStage = "kitten_puppy" | "adult" | "senior" | "unknown";
export type HealthRecordsStatus = "yes" | "no" | "not_sure";
export type AdoptionSource = "shelter" | "breeder" | "friend" | "stray" | "other";
export type ArrivalGroupSize = "one" | "two" | "three_plus";
export type PurchaseStatus = "pending" | "paid" | "refunded" | "failed" | "canceled";
export type ConcernAction = "observe" | "ask_a_vet" | "seek_urgent_care";
export type CheckInStatus = "better" | "same" | "worse";
export type ProductEventName =
  | "onboarding_viewed"
  | "profile_created"
  | "home_viewed"
  | "concern_opened"
  | "task_completed"
  | "check_in_submitted"
  | "paywall_viewed"
  | "checkout_started"
  | "purchase_completed"
  | "refund_created";

export type PetProfile = {
  id: string;
  user_id: string;
  pet_type: PetType;
  name: string;
  adoption_date: string;
  estimated_age_stage: AgeStage;
  health_records_status: HealthRecordsStatus;
  adoption_source: AdoptionSource;
  arrival_group_size: ArrivalGroupSize;
  has_resident_pets: boolean;
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
  is_active: boolean;
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

export type PetCheckIn = {
  id: string;
  user_id: string;
  pet_profile_id: string;
  check_in_date: string;
  status: CheckInStatus;
  created_at: string;
  updated_at: string;
};
