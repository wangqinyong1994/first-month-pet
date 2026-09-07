import assert from "node:assert/strict";
import test from "node:test";
import {
  hasPaidAccess,
  defaultPlanNodeId,
  isAfterFirstMonth,
  isCheckInStatus,
  planNodeTimeState,
  sanitizeConcernKeys,
  selectConcernGuidance,
  shouldCreateTask,
  sortConcernKeys,
  taskMutationValues,
  taskProgress,
  taskUiState,
  publicLandingPreview,
  visibleConcernGuidance,
  visiblePlanNode
} from "../lib/domain";
import { verifyCreemWebhookSignature } from "../lib/creem";
import { createHmac } from "node:crypto";
import { isMilestoneId, milestoneImagePath } from "../lib/milestones";
import type { CarePlanNode, ConcernGuidance } from "../lib/types";

const paidNode: CarePlanNode = {
  id: "day_2",
  node_type: "day",
  day_start: 2,
  day_end: 2,
  title: "Day 2",
  common_signs: "paid common",
  what_to_do: "paid action",
  when_to_seek_help: "paid help",
  free_preview: false,
  sort_order: 2
};

test("free users only receive locked node metadata for paid nodes", () => {
  const visible = visiblePlanNode(paidNode, false);
  assert.equal(visible.locked, true);
  assert.equal(visible.title, "Day 2");
  assert.equal(visible.common_signs, "");
  assert.equal(visible.what_to_do, "");
  assert.equal(visible.when_to_seek_help, "paid help");
});

test("public landing keeps paid timeline copy out of its projection", () => {
  const preview = publicLandingPreview(
    { ...paidNode, id: "day_1", title: "Day 1", free_preview: true, common_signs: "Free signs", what_to_do: "Free actions" },
    [paidNode]
  );

  assert.deepEqual(preview.lockedNodes, [{ id: "day_2", title: "Day 2", day_start: 2, day_end: 2 }]);
  assert.equal(preview.dayOne.common_signs, "Free signs");
  assert.equal("what_to_do" in preview.lockedNodes[0], false);
  assert.equal("when_to_seek_help" in preview.lockedNodes[0], false);
});

test("free concern guidance keeps the vet and urgent-care thresholds without provenance", () => {
  const visible = visibleConcernGuidance(
    {
      ...guidanceRow("vomiting", 1),
      ask_a_vet: "Ask a vet",
      seek_urgent_care: "Urgent care",
      priority_reason: "Paid context"
    },
    false
  );
  assert.equal(visible.ask_a_vet, "Ask a vet");
  assert.equal(visible.seek_urgent_care, "Urgent care");
  assert.equal(visible.priority_reason, "");
});

test("check-in statuses and first-month cutoff are constrained", () => {
  assert.equal(isCheckInStatus("worse"), true);
  assert.equal(isCheckInStatus("urgent"), false);
  assert.equal(isAfterFirstMonth(30), false);
  assert.equal(isAfterFirstMonth(31), true);
});

test("multi-pet context only activates its matching task", () => {
  const profile = {
    pet_type: "cat" as const,
    health_records_status: "yes" as const,
    arrival_group_size: "two" as const,
    has_resident_pets: false
  };
  assert.equal(shouldCreateTask({ trigger_type: "arrival_group_multiple", is_paid_feature: false }, profile, []), true);
  assert.equal(shouldCreateTask({ trigger_type: "resident_pets_yes", is_paid_feature: false }, profile, []), false);
});

test("paid and refunded purchase states do not both grant access", () => {
  assert.equal(hasPaidAccess(["pending", "refunded"]), false);
  assert.equal(hasPaidAccess(["paid"]), true);
});

test("task UI state is derived from due date and done_at", () => {
  assert.equal(
    taskUiState({ status: "not_done", done_at: null, due_date: "2026-08-31" }, new Date("2026-09-02")),
    "overdue"
  );
  assert.equal(
    taskUiState({ status: "not_done", done_at: null, due_date: "2026-09-02" }, new Date("2026-09-02")),
    "upcoming"
  );
  assert.equal(
    taskUiState({ status: "done", done_at: "2026-09-02T00:00:00Z", due_date: "2026-08-31" }, new Date("2026-09-02")),
    "done"
  );
});

test("plan time and task progress remain independent", () => {
  assert.equal(planNodeTimeState({ day_start: 1, day_end: 1 }, 31), "ended");
  assert.equal(planNodeTimeState({ day_start: 2, day_end: 5 }, 3), "today");
  assert.equal(planNodeTimeState({ day_start: 4, day_end: 5 }, 3), "upcoming");
  assert.deepEqual(
    taskProgress([{ status: "not_done", done_at: null, due_date: "2026-09-01" }, { status: "done", done_at: "2026-09-01T00:00:00Z", due_date: "2026-09-01" }], new Date("2026-09-02")),
    { total: 2, completed: 1, outstanding: 1, overdue: 1 }
  );
});

test("default plan expansion prefers overdue, then current, then unfinished work", () => {
  const noTasks = { total: 0, completed: 0, outstanding: 0, overdue: 0 };
  assert.equal(defaultPlanNodeId([
    { id: "current", timeState: "today" as const, taskProgress: noTasks },
    { id: "overdue", timeState: "ended" as const, taskProgress: { total: 1, completed: 0, outstanding: 1, overdue: 1 } }
  ]), "overdue");
  assert.equal(defaultPlanNodeId([
    { id: "current", timeState: "today" as const, taskProgress: noTasks },
    { id: "later", timeState: "upcoming" as const, taskProgress: { total: 1, completed: 0, outstanding: 1, overdue: 0 } }
  ]), "current");
  assert.equal(defaultPlanNodeId([{ id: "done", timeState: "ended" as const, taskProgress: { total: 1, completed: 1, outstanding: 0, overdue: 0 } }]), null);
});

test("task completion and undo values preserve the status invariant", () => {
  const now = new Date("2026-09-02T10:00:00Z");
  assert.deepEqual(taskMutationValues("done", now), { status: "done", done_at: "2026-09-02T10:00:00.000Z" });
  assert.deepEqual(taskMutationValues("undo", now), { status: "not_done", done_at: null });
});

test("no concern right now is exclusive", () => {
  assert.deepEqual(
    sanitizeConcernKeys(["vomiting", "no_concern_right_now", "vomiting"]),
    ["no_concern_right_now"]
  );
});

test("selected concerns sort by risk rank", () => {
  const guidance = [
    guidanceRow("vomiting", 2),
    guidanceRow("hiding_or_fearful", 6)
  ];

  assert.deepEqual(sortConcernKeys(["hiding_or_fearful", "vomiting"], guidance, "dog"), [
    "vomiting",
    "hiding_or_fearful"
  ]);
});

test("species-specific concern guidance wins over shared guidance", () => {
  const guidance = [
    { ...guidanceRow("vomiting", 1), id: "vomiting_shared", common_settling_in: "Shared" },
    { ...guidanceRow("vomiting", 1), id: "vomiting_cat", pet_type: "cat" as const, common_settling_in: "Cat" },
    { ...guidanceRow("vomiting", 1), id: "vomiting_dog", pet_type: "dog" as const, common_settling_in: "Dog" }
  ];

  assert.equal(selectConcernGuidance(guidance, "vomiting", "cat")?.common_settling_in, "Cat");
  assert.equal(selectConcernGuidance(guidance, "vomiting", "dog")?.common_settling_in, "Dog");
});

test("Creem webhook signature requires the raw body and secret", () => {
  const body = '{"id":"evt_1"}';
  process.env.CREEM_ENVIRONMENT = "test";
  process.env.CREEM_TEST_WEBHOOK_SECRET = "test-secret";
  const signature = createHmac("sha256", "test-secret").update(body).digest("hex");
  assert.equal(verifyCreemWebhookSignature(body, signature), true);
  assert.equal(verifyCreemWebhookSignature(`${body} `, signature), false);
});

test("milestone feedback only accepts known milestone artwork", () => {
  assert.equal(isMilestoneId("first_month_complete"), true);
  assert.equal(isMilestoneId("not-a-milestone"), false);
  assert.equal(milestoneImagePath("first_month_complete"), "/milestones/first-month-complete.png");
});

function guidanceRow(concern_key: string, priority_rank: number): ConcernGuidance {
  return {
    id: concern_key,
    concern_key,
    pet_type: null,
    priority_rank,
    common_settling_in: "",
    ask_a_vet: "",
    seek_urgent_care: "",
    priority_reason: ""
  };
}
