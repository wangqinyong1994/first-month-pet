"use client";

import { useActionState } from "react";
import { createCheckoutSessionAction, type CheckoutState } from "./actions";
import { PendingButton } from "./pending-button";

const initialState: CheckoutState = { status: "idle" };

export function CheckoutForm() {
  const [state, action] = useActionState(createCheckoutSessionAction, initialState);

  return (
    <form action={action}>
      {state.status === "error" ? <p className="notice notice-error" role="alert">{state.message}</p> : null}
      <PendingButton className="button" type="submit" pendingLabel="Starting checkout…">
        Unlock my 30-day plan - $9.99
      </PendingButton>
    </form>
  );
}
