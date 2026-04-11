"use client";

import { createClient } from "@/lib/supabase/client";

export function SignInButton({ label }: { label: string }) {
  const handleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <button
      onClick={handleSignIn}
      className="text-xs px-3 py-1.5 rounded-md border border-[var(--wem-border)] text-[var(--wem-text-secondary)] hover:text-[var(--wem-text)] hover:border-[var(--wem-accent)] transition-colors"
    >
      {label}
    </button>
  );
}
