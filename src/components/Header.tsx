import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { SignInButton } from "./SignInButton";
import { UserMenu } from "./UserMenu";
import { createClient } from "@/lib/supabase/server";

function ViewToggle({
  regionLabel,
  sectorLabel,
}: {
  regionLabel: string;
  sectorLabel: string;
}) {
  return (
    <div className="hidden sm:flex items-center glass rounded-lg p-0.5 text-xs">
      <span className="px-3 py-1 rounded-md bg-[var(--wem-accent)] text-white font-medium">
        {regionLabel}
      </span>
      <span className="px-3 py-1 text-[var(--wem-text-secondary)]">
        {sectorLabel}
      </span>
    </div>
  );
}

export async function Header() {
  const t = await getTranslations("Header");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="glass-light border-b border-[var(--wem-border)] px-4 h-14 flex items-center justify-between shrink-0 z-10">
      {/* Logo */}
      <div className="flex items-center gap-2">
        {/* Globe + heart logomark */}
        <svg
          viewBox="0 0 24 24"
          width="26"
          height="26"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          <circle cx="12" cy="12" r="9" stroke="var(--wem-accent)" strokeWidth="1.5" />
          <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="var(--wem-accent)" strokeWidth="1" opacity="0.5" />
          <line x1="3" y1="12" x2="21" y2="12" stroke="var(--wem-accent)" strokeWidth="1" opacity="0.5" />
          {/* Heart */}
          <path
            d="M 12 16.5 C 8 14 6.5 11.5 6.5 9.5 A 3 3 0 0 1 12 9.5 A 3 3 0 0 1 17.5 9.5 C 17.5 11.5 16 14 12 16.5 Z"
            fill="#F472B6"
            opacity="0.9"
          />
        </svg>
        <span className="font-bold text-base text-[var(--wem-accent)] tracking-tight">
          WEM
        </span>
        <span className="hidden md:block text-xs text-[var(--wem-text-secondary)]">
          World Emotion Map
        </span>
      </div>

      {/* Center: Region / Sector toggle (placeholder) */}
      <ViewToggle regionLabel={t("region")} sectorLabel={t("sector")} />

      {/* Right: locale switcher + auth */}
      <div className="flex items-center gap-3">
        <LocaleSwitcher />
        {user ? (
          <UserMenu
            avatarUrl={user.user_metadata?.avatar_url as string | null}
            email={user.email}
            favoritesLabel={t("favorites")}
            signOutLabel={t("signOut")}
          />
        ) : (
          <SignInButton label={t("signIn")} />
        )}
      </div>
    </header>
  );
}
