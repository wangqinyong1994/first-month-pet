"use client";

import { useActionState } from "react";
import { markTaskDoneAction, undoTaskAction, type TaskActionState } from "./actions";
import { PendingButton } from "./pending-button";

const initialState: TaskActionState = { status: "idle" };

type TaskActionFormProps = {
  taskId: string;
  returnTo: "/home" | "/plan";
  nodeId?: string;
  operation: "done" | "undo";
  buttonClassName: string;
};

export function TaskActionForm({ taskId, returnTo, nodeId, operation, buttonClassName }: TaskActionFormProps) {
  const [state, action] = useActionState(operation === "done" ? markTaskDoneAction : undoTaskAction, initialState);
  const isDone = operation === "done";

  return (
    <form action={action} className="task-action-form">
      <input name="task_id" type="hidden" value={taskId} />
      <input name="return_to" type="hidden" value={returnTo} />
      {nodeId ? <input name="node_id" type="hidden" value={nodeId} /> : null}
      {state.status === "error" ? <p className="notice notice-error task-action-error" role="alert">{state.message}</p> : null}
      <PendingButton className={buttonClassName} pendingLabel={isDone ? "Marking done…" : "Undoing…"} type="submit">
        {isDone ? "Mark done" : "Undo"}
      </PendingButton>
    </form>
  );
}
