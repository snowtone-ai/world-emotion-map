import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { EmailSubscribeForm } from "./EmailSubscribeForm";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("About");

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 w-full flex flex-col gap-10">
      {/* Hero */}
      <section>
        <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--wem-text-muted)] mb-1">
          {t("label")}
        </p>
        <h1 className="text-3xl font-bold text-[var(--wem-text)] mb-4">
          World Emotion Map
        </h1>
        <p className="text-sm text-[var(--wem-text-secondary)] leading-relaxed">
          {t("description")}
        </p>
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-base font-semibold text-[var(--wem-text)] mb-3">
          {t("howItWorksTitle")}
        </h2>
        <ol className="flex flex-col gap-2 text-sm text-[var(--wem-text-secondary)]">
          <li className="flex gap-3">
            <span className="font-mono text-[var(--wem-accent)] flex-shrink-0">01</span>
            <span>{t("step1")}</span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-[var(--wem-accent)] flex-shrink-0">02</span>
            <span>{t("step2")}</span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-[var(--wem-accent)] flex-shrink-0">03</span>
            <span>{t("step3")}</span>
          </li>
        </ol>
      </section>

      {/* Data source */}
      <section className="glass rounded-xl p-5 flex flex-col gap-2">
        <h2 className="text-base font-semibold text-[var(--wem-text)]">
          {t("dataSourceTitle")}
        </h2>
        <p className="text-sm text-[var(--wem-text-secondary)] leading-relaxed">
          {t("dataSourceBody")}
        </p>
        <p className="text-xs text-[var(--wem-text-muted)]">{t("dataDisclaimer")}</p>
      </section>

      {/* Email subscribe */}
      <section id="subscribe" className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-[var(--wem-text)]">
          {t("subscribeTitle")}
        </h2>
        <p className="text-sm text-[var(--wem-text-secondary)]">
          {t("subscribeBody")}
        </p>
        <EmailSubscribeForm
          placeholder={t("emailPlaceholder")}
          buttonLabel={t("subscribeButton")}
          successMessage={t("subscribeSuccess")}
        />
      </section>

      {/* Legal links */}
      <section className="flex gap-4 text-xs text-[var(--wem-text-muted)] pt-2 border-t border-[var(--wem-border)]">
        <Link
          href="/legal/privacy"
          className="hover:text-[var(--wem-text)] transition-colors"
        >
          Privacy Policy
        </Link>
        <Link
          href="/legal/terms"
          className="hover:text-[var(--wem-text)] transition-colors"
        >
          Terms of Service
        </Link>
      </section>
    </div>
  );
}
