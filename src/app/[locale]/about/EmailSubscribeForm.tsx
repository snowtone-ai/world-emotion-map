"use client";

import { useActionState } from "react";
import { subscribeEmail } from "./actions";

export function EmailSubscribeForm({
  placeholder,
  buttonLabel,
  successMessage,
}: {
  placeholder: string;
  buttonLabel: string;
  successMessage: string;
}) {
  const [state, formAction, pending] = useActionState(subscribeEmail, null);

  if (state?.success) {
    return (
      <p className="text-sm text-[var(--wem-accent)] font-medium py-2">
        {successMessage}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col sm:flex-row gap-2">
      <input
        type="email"
        name="email"
        required
        placeholder={placeholder}
        className="flex-1 px-4 py-2 rounded-lg text-sm bg-[var(--wem-surface-raised)]
                   border border-[var(--wem-border)] text-[var(--wem-text)]
                   placeholder:text-[var(--wem-text-muted)]
                   focus:outline-none focus:border-[var(--wem-accent)] transition-colors"
      />
      <button
        type="submit"
        disabled={pending}
        className="px-5 py-2 rounded-lg text-sm font-medium
                   bg-[var(--wem-accent)] text-white
                   hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {pending ? "…" : buttonLabel}
      </button>
      {state?.error && (
        <p className="text-xs text-red-400 sm:col-span-2 mt-1">
          {state.error}
        </p>
      )}
    </form>
  );
}
