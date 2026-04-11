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
