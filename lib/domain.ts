import type {
  CarePlanNode,
  ConcernGuidance,
  HealthRecordsStatus,
  PetProfile,
  PetTask,
  PetType,
  PurchaseStatus,
  TaskDefinition
} from "./types";

export const CONCERNS = [
  ["not_eating_or_drinking", "Not eating or drinking"],
  ["diarrhea_or_unusual_stool", "Diarrhea or unusual stool"],
  ["vomiting", "Vomiting"],
  ["hiding_or_fearful", "Hiding or fearful"],
  ["coughing_sneezing_or_nasal_discharge", "Coughing, sneezing, or nasal discharge"],
  ["low_energy_or_weakness", "Low energy or weakness"],
  ["scratching_fleas_or_skin_issue", "Scratching, fleas, or skin issue"],
  ["litter_box_or_potty_accidents", "Litter box / potty accidents"],
  ["no_concern_right_now", "No concern right now"]
] as const;

export const concernLabel = (key: string) =>
  CONCERNS.find(([value]) => value === key)?.[1] ?? key.replaceAll("_", " ");

export function dayNumber(adoptionDate: string, now = new Date()) {
  const adopted = new Date(`${adoptionDate}T00:00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(adopted.getFullYear(), adopted.getMonth(), adopted.getDate());
  return Math.max(1, Math.floor((today.getTime() - start.getTime()) / 86_400_000) + 1);
}

export function dateForDay(adoptionDate: string, day: number) {
  const date = new Date(`${adoptionDate}T00:00:00`);
  date.setDate(date.getDate() + day - 1);
  return date.toISOString().slice(0, 10);
}

export function nodeForDay(nodes: CarePlanNode[], day: number) {
  return nodes.find((node) => day >= node.day_start && day <= node.day_end) ?? nodes.at(-1) ?? null;
}

export function hasPaidAccess(statuses: PurchaseStatus[]) {
  return statuses.includes("paid");
}

export function taskUiState(task: Pick<PetTask, "status" | "done_at" | "due_date">, today = new Date()) {
  if (task.done_at || task.status === "done") return "done";
  const current = today.toISOString().slice(0, 10);
  return task.due_date < current ? "overdue" : "upcoming";
}

export function shouldCreateTask(
  task: Pick<TaskDefinition, "trigger_type" | "is_paid_feature">,
  profile: Pick<PetProfile, "pet_type" | "health_records_status">,
  concernKeys: string[],
  paid = true
) {
  if (task.is_paid_feature && !paid) return false;

  if (task.trigger_type === "always") return true;
  if (task.trigger_type === `pet_type_${profile.pet_type}`) return true;
  if (task.trigger_type === `health_records_${profile.health_records_status}`) return true;
  if (task.trigger_type.startsWith("concern_")) {
    return concernKeys.includes(task.trigger_type.replace("concern_", ""));
  }

  return false;
}

export function visiblePlanNode(node: CarePlanNode, paid: boolean) {
  if (paid || node.free_preview) return { ...node, locked: false };

  return {
    ...node,
    common_signs: "",
    what_to_do: "",
    when_to_seek_help: "",
    locked: true
  };
}

export function selectConcernGuidance(
  guidance: ConcernGuidance[],
  concernKey: string,
  petType: PetType
) {
  return (
    guidance.find((item) => item.concern_key === concernKey && item.pet_type === petType) ??
    guidance.find((item) => item.concern_key === concernKey && item.pet_type === null) ??
    null
  );
}

export function sortConcernKeys(concernKeys: string[], guidance: ConcernGuidance[], petType: PetType) {
  return [...concernKeys]
    .filter((key) => key !== "no_concern_right_now")
    .sort((a, b) => {
      const left = selectConcernGuidance(guidance, a, petType)?.priority_rank ?? 999;
      const right = selectConcernGuidance(guidance, b, petType)?.priority_rank ?? 999;
      return left - right;
    });
}

export function sanitizeConcernKeys(keys: string[]) {
  const unique = [...new Set(keys)];
  if (unique.includes("no_concern_right_now")) return ["no_concern_right_now"];
  return unique.filter((key) => CONCERNS.some(([value]) => value === key));
}

export const HEALTH_RECORD_STATUS_LABEL: Record<HealthRecordsStatus, string> = {
  yes: "Records available",
  no: "No records yet",
  not_sure: "Not sure"
};
