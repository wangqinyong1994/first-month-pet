"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";

type PendingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  pendingLabel?: string;
};

export function PendingButton({ children, pendingLabel = "Saving…", ...props }: PendingButtonProps) {
  const { pending } = useFormStatus();
  return <button {...props} disabled={pending || props.disabled}>{pending ? pendingLabel : children}</button>;
}
