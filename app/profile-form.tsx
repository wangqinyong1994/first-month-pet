"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Callout } from "@radix-ui/themes";
import { updateProfileAction, type ProfileUpdateState } from "./actions";

const initialState: ProfileUpdateState = { status: "idle" };

export function ProfileForm({ children }: { children: React.ReactNode }) {
  const [state, action] = useActionState(updateProfileAction, initialState);

  return (
    <form className="panel profile-form" action={action}>
      {children}
      {state.status === "saved" ? <Callout.Root className="notice" color="green" role="status"><Callout.Text>Profile saved.</Callout.Text></Callout.Root> : null}
      {state.status === "error" ? <Callout.Root className="notice notice-error" color="red" role="alert"><Callout.Text>{state.message}</Callout.Text></Callout.Root> : null}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving profile…" : "Save profile"}
    </Button>
  );
}
