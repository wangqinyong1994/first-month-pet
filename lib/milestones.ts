export const MILESTONE_IDS = [
  "first_day_together",
  "safe_space_set_up",
  "first_meal_check",
  "vet_visit_planned",
  "records_checked",
  "settling_in_week_complete",
  "concern_handled_thoughtfully",
  "routine_taking_shape",
  "first_month_complete"
] as const;

export function isMilestoneId(value: string): value is (typeof MILESTONE_IDS)[number] {
  return MILESTONE_IDS.includes(value as (typeof MILESTONE_IDS)[number]);
}

export function milestoneImagePath(id: string) {
  return `/milestones/${id.replaceAll("_", "-")}.png`;
}
