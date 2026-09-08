import type { PetTask } from "./types";

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

export type MilestoneTrigger = {
  milestoneId: string;
  triggerTaskId: string;
};

export function completedMilestoneTriggers(tasks: PetTask[], userId?: string, petProfileId?: string): MilestoneTrigger[] {
  const triggers = new Map<string, string>();
  const completedTasks = tasks.filter((task) =>
    task.is_active &&
    task.status === "done" &&
    task.done_at &&
    (!userId || task.user_id === userId) &&
    (!petProfileId || task.pet_profile_id === petProfileId)
  );

  for (const task of completedTasks) {
    const definition = task.task_definitions;
    if (definition?.milestone_key && isMilestoneId(definition.milestone_key)) {
      triggers.set(definition.milestone_key, task.id);
    }

    if (definition?.node_id === "week_2" || definition?.node_id === "week_3") {
      triggers.set("routine_taking_shape", task.id);
    }

    if ((definition?.due_day ?? 0) >= 30 || definition?.node_id === "week_4") {
      triggers.set("first_month_complete", task.id);
    }
  }

  const firstWeekTasks = completedTasks.filter((task) => (task.task_definitions?.due_day ?? 0) <= 7);
  const firstWeekTrigger = firstWeekTasks[firstWeekTasks.length - 1];
  if (firstWeekTasks.length >= 3 && firstWeekTrigger) {
    triggers.set("settling_in_week_complete", firstWeekTrigger.id);
  }

  return [...triggers].map(([milestoneId, triggerTaskId]) => ({ milestoneId, triggerTaskId }));
}
