"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  avatarUrl?: string | null;
  email?: string | null;
  favoritesLabel: string;
  signOutLabel: string;
};

export function UserMenu({ avatarUrl, email, favoritesLabel, signOutLabel }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.refresh();
  };

  const initials = email ? email[0].toUpperCase() : "?";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-8 h-8 rounded-full overflow-hidden border border-[var(--wem-border)] flex items-center justify-center bg-[var(--wem-surface)] hover:border-[var(--wem-accent)] transition-colors"
        aria-label="User menu"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="avatar" width={32} height={32} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-medium text-[var(--wem-text)]">{initials}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-44 glass rounded-lg shadow-lg py-1 z-50">
          <Link
            href="/favorites"
            className="block px-4 py-2 text-xs text-[var(--wem-text-secondary)] hover:text-[var(--wem-text)] hover:bg-[var(--wem-surface-raised)] transition-colors"
            onClick={() => setOpen(false)}
          >
            {favoritesLabel}
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2 text-xs text-[var(--wem-text-secondary)] hover:text-[var(--wem-text)] hover:bg-[var(--wem-surface-raised)] transition-colors"
          >
            {signOutLabel}
          </button>
        </div>
      )}
    </div>
  );
}
