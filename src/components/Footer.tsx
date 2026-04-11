import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="glass-light border-t border-[var(--wem-border)] px-4 py-3 shrink-0">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* Nav links */}
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[var(--wem-text-secondary)]">
          <Link
            href="/about"
            className="hover:text-[var(--wem-text)] transition-colors"
          >
            {t("about")}
          </Link>
          <Link
            href="/legal/privacy"
            className="hover:text-[var(--wem-text)] transition-colors"
          >
            {t("privacy")}
          </Link>
          <Link
            href="/legal/terms"
            className="hover:text-[var(--wem-text)] transition-colors"
          >
            {t("terms")}
          </Link>
          <Link
            href="/about#subscribe"
            className="hover:text-[var(--wem-text)] transition-colors"
          >
            {t("subscribe")}
          </Link>
        </nav>

        {/* Right: data source + copyright */}
        <div className="flex items-center gap-3 text-xs text-[var(--wem-text-muted)]">
          <span>{t("dataSource")}</span>
          <span className="hidden sm:block">·</span>
          <span className="hidden sm:block">{t("copyright")}</span>
        </div>
      </div>
    </footer>
  );
}
