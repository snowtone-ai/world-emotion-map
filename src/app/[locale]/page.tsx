import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations("Home");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <div className="glass rounded-xl px-8 py-10 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--wem-text)]">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-[var(--wem-text-secondary)]">
          {t("tagline")}
        </p>
        <div className="mt-6 h-px w-24 mx-auto bg-[var(--wem-border)]" />
        <p className="mt-6 text-xs text-[var(--wem-text-muted)]">
          {t("comingSoon")}
        </p>
        <div className="mt-4">
          <LocaleSwitcher />
        </div>
      </div>
    </div>
  );
}
