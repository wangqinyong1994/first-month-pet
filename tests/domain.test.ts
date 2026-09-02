import assert from "node:assert/strict";
import test from "node:test";
import {
  hasPaidAccess,
  sanitizeConcernKeys,
  sortConcernKeys,
  taskUiState,
  visiblePlanNode
} from "../lib/domain";
import { verifyCreemWebhookSignature } from "../lib/creem";
import { createHmac } from "node:crypto";
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
  assert.equal(visible.when_to_seek_help, "");
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

test("Creem webhook signature requires the raw body and secret", () => {
  const body = '{"id":"evt_1"}';
  process.env.CREEM_ENVIRONMENT = "test";
  process.env.CREEM_TEST_WEBHOOK_SECRET = "test-secret";
  const signature = createHmac("sha256", "test-secret").update(body).digest("hex");
  assert.equal(verifyCreemWebhookSignature(body, signature), true);
  assert.equal(verifyCreemWebhookSignature(`${body} `, signature), false);
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
    priority_reason: "",
    source_notes: null
  };
}
