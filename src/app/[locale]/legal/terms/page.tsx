import { setRequestLocale } from "next-intl/server";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 w-full">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--wem-text-muted)] mb-1">
        Legal
      </p>
      <h1 className="text-2xl font-bold text-[var(--wem-text)] mb-2">
        Terms of Service
      </h1>
      <p className="text-xs text-[var(--wem-text-muted)] mb-8">
        Last updated: April 12, 2025
      </p>

      <div className="flex flex-col gap-7 text-sm text-[var(--wem-text-secondary)] leading-relaxed">
        <section>
          <h2 className="text-sm font-semibold text-[var(--wem-text)] mb-2">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using World Emotion Map (&ldquo;WEM&rdquo;, &ldquo;the Service&rdquo;),
            you agree to be bound by these Terms of Service. If you do not agree, please do not use
            the Service.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[var(--wem-text)] mb-2">
            2. Description of Service
          </h2>
          <p>
            WEM is an interactive visualization tool that displays emotion signals derived from global
            news media, powered by the GDELT Project. The Service is provided for informational and
            educational purposes only.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[var(--wem-text)] mb-2">
            3. Data Accuracy Disclaimer
          </h2>
          <p>
            Emotion data displayed on WEM is derived from automated analysis of news media articles
            and does not represent the actual emotional state of any country&apos;s population. The data
            reflects what news media <em>reports</em>, not what people <em>feel</em>. WEM data should
            not be used as the basis for financial, political, or investment decisions. We make no
            warranties regarding the accuracy, completeness, or timeliness of the data.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[var(--wem-text)] mb-2">
            4. Acceptable Use
          </h2>
          <p className="mb-2">You agree not to:</p>
          <ul className="flex flex-col gap-1.5 list-disc list-inside">
            <li>Use the Service for any unlawful purpose.</li>
            <li>Attempt to reverse engineer, scrape, or mirror the Service at scale.</li>
            <li>Use the Service to spread misinformation or manipulate public perception.</li>
            <li>Attempt to gain unauthorized access to our systems.</li>
          </ul>
          <p className="mt-2">
            Personal, non-commercial use of the Service is freely permitted, including sharing
            screenshots or linking to WEM for educational or journalistic purposes with attribution.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[var(--wem-text)] mb-2">
            5. User Accounts
          </h2>
          <p>
            You may create an account using Google OAuth. You are responsible for maintaining the
            security of your account. We reserve the right to suspend accounts that violate these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[var(--wem-text)] mb-2">
            6. Intellectual Property
          </h2>
          <p>
            The WEM application code, design, and branding are the property of the WEM project.
            Emotion data is derived from the GDELT Project, which is released into the public domain.
            Mapbox map tiles are subject to{" "}
            <a
              href="https://www.mapbox.com/legal/tos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--wem-accent)] hover:underline"
            >
              Mapbox&apos;s Terms of Service
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[var(--wem-text)] mb-2">
            7. Limitation of Liability
          </h2>
          <p>
            THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; WITHOUT WARRANTY OF ANY KIND. TO THE MAXIMUM
            EXTENT PERMITTED BY LAW, WEM DISCLAIMS ALL WARRANTIES AND SHALL NOT BE LIABLE FOR ANY
            INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[var(--wem-text)] mb-2">
            8. Service Availability
          </h2>
          <p>
            We do not guarantee uninterrupted availability of the Service. We may modify, suspend,
            or discontinue the Service at any time without notice.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[var(--wem-text)] mb-2">
            9. Changes to Terms
          </h2>
          <p>
            We may update these Terms at any time. Continued use of the Service after changes
            constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[var(--wem-text)] mb-2">
            10. Governing Law
          </h2>
          <p>
            These Terms are governed by the laws of Japan. Any disputes shall be resolved in the
            courts of Tokyo, Japan.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[var(--wem-text)] mb-2">
            11. Contact
          </h2>
          <p>
            For questions about these Terms, contact us at{" "}
            <strong className="text-[var(--wem-text)]">legal@worldemomap.com</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
