import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "./LocaleSwitcher";

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

export function Header() {
  const t = useTranslations("Header");

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

      {/* Right: locale switcher + sign in */}
      <div className="flex items-center gap-3">
        <LocaleSwitcher />
        <button className="text-xs px-3 py-1.5 rounded-md border border-[var(--wem-border)] text-[var(--wem-text-secondary)] hover:text-[var(--wem-text)] hover:border-[var(--wem-accent)] transition-colors">
          {t("signIn")}
        </button>
      </div>
    </header>
  );
}
