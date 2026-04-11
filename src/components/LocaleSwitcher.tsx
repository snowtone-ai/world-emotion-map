"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const nextLocale =
    routing.locales.find((l) => l !== locale) ?? routing.defaultLocale;

  const handleSwitch = () => {
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <button
      onClick={handleSwitch}
      className="text-xs text-[var(--wem-text-secondary)] hover:text-[var(--wem-text)] transition-colors underline underline-offset-2"
    >
      {t("switchTo")}
    </button>
  );
}
