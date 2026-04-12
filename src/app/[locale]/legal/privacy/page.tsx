import { setRequestLocale } from "next-intl/server";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 w-full prose prose-invert prose-sm">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--wem-text-muted)] not-prose mb-1">
        Legal
      </p>
      <h1 className="text-2xl font-bold text-[var(--wem-text)] not-prose mb-2">
        Privacy Policy
      </h1>
      <p className="text-xs text-[var(--wem-text-muted)] not-prose mb-8">
        Last updated: April 12, 2025
      </p>

      <div className="flex flex-col gap-7 text-sm text-[var(--wem-text-secondary)] leading-relaxed">
        <section>
          <h2 className="text-sm font-semibold text-[var(--wem-text)] mb-2">
            1. Who We Are
          </h2>
          <p>
            World Emotion Map (&ldquo;WEM&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is an independent project
            that visualizes global news sentiment on an interactive map.
            This policy describes how we collect, use, and protect your personal data.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[var(--wem-text)] mb-2">
            2. Data We Collect
          </h2>
          <ul className="flex flex-col gap-1.5 list-disc list-inside">
            <li>
              <strong className="text-[var(--wem-text)]">Email address</strong> — if you voluntarily subscribe
              via our newsletter form. We store your email and the date of subscription.
            </li>
            <li>
              <strong className="text-[var(--wem-text)]">Google account data</strong> — if you sign in with
              Google, we receive your email address, display name, and profile picture via OAuth 2.0.
              We do not receive or store your Google password.
            </li>
            <li>
              <strong className="text-[var(--wem-text)]">Usage data</strong> — we may collect anonymized
              analytics (page views, session duration) in the future via Google Analytics or Vercel Analytics.
              No personally identifiable information is included.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[var(--wem-text)] mb-2">
            3. How We Use Your Data
          </h2>
          <ul className="flex flex-col gap-1.5 list-disc list-inside">
            <li>To provide and maintain the WEM service.</li>
            <li>To send product updates and news (email subscribers only, when we launch the newsletter).</li>
            <li>To allow you to save favorite countries (registered users only).</li>
            <li>We do not sell or share your personal data with third parties for marketing purposes.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[var(--wem-text)] mb-2">
            4. Third-Party Services
          </h2>
          <ul className="flex flex-col gap-1.5 list-disc list-inside">
            <li>
              <strong className="text-[var(--wem-text)]">Supabase</strong> — our database and authentication provider.
              Data is stored in Supabase infrastructure (EU region). See{" "}
              <a
                href="https://supabase.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--wem-accent)] hover:underline"
              >
                Supabase Privacy Policy
              </a>.
            </li>
            <li>
              <strong className="text-[var(--wem-text)]">Google OAuth</strong> — used for sign-in.
              See{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--wem-accent)] hover:underline"
              >
                Google Privacy Policy
              </a>.
            </li>
            <li>
              <strong className="text-[var(--wem-text)]">Mapbox</strong> — map rendering.
              Map tiles are loaded from Mapbox servers. Your IP address may be logged by Mapbox.
            </li>
            <li>
              <strong className="text-[var(--wem-text)]">GDELT Project</strong> — public news data source.
              No personal data is involved.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[var(--wem-text)] mb-2">
            5. Data Retention
          </h2>
          <p>
            We retain your account data for as long as your account is active.
            Email subscriber data is retained until you request deletion.
            You may request account or subscriber deletion at any time (see Section 6).
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[var(--wem-text)] mb-2">
            6. Your Rights (GDPR)
          </h2>
          <p className="mb-2">
            If you are in the European Economic Area (EEA), you have the right to:
          </p>
          <ul className="flex flex-col gap-1.5 list-disc list-inside">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your data (&ldquo;right to be forgotten&rdquo;).</li>
            <li>Object to or restrict our processing of your data.</li>
            <li>Receive your data in a portable format.</li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, email us at{" "}
            <strong className="text-[var(--wem-text)]">privacy@worldemomap.com</strong>.
            We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[var(--wem-text)] mb-2">
            7. Cookies
          </h2>
          <p>
            We use a session cookie to keep you signed in (via Supabase Auth).
            No third-party tracking cookies are set at this time.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[var(--wem-text)] mb-2">
            8. Changes to This Policy
          </h2>
          <p>
            We may update this policy periodically. Material changes will be noted by updating the
            &ldquo;Last updated&rdquo; date above. Continued use of the service after changes constitutes
            acceptance of the updated policy.
          </p>
        </section>
      </div>
    </div>
  );
}
