"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

export default function SubmitButton({
  children,
  className,
  disabled,
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={
        className ??
        "flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-base font-bold text-white shadow-sm transition-opacity disabled:opacity-60"
      }
    >
      {pending && (
        <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {children}
    </button>
  );
}
