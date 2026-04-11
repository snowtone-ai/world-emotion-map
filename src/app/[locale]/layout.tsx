import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { PwaRegistration } from "@/components/PwaRegistration";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const WEM_URL = "https://worldemotionmap.com";
const OG_IMAGE = `${WEM_URL}/api/og`;

export const metadata: Metadata = {
  metadataBase: new URL(WEM_URL),
  title: "World Emotion Map — Feel What the World Feels",
  description:
    "Real-time interactive globe visualizing the emotional state of every country, powered by global news sentiment analysis.",
  openGraph: {
    type: "website",
    url: WEM_URL,
    siteName: "World Emotion Map",
    title: "World Emotion Map — Feel What the World Feels",
    description:
      "Real-time interactive globe visualizing the emotional state of every country, powered by global news sentiment analysis.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "World Emotion Map — Feel What the World Feels",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@WorldEmotionMap",
    title: "World Emotion Map — Feel What the World Feels",
    description:
      "Real-time interactive globe visualizing the emotional state of every country, powered by global news sentiment analysis.",
    images: [OG_IMAGE],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WEM",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#06060F" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--wem-void)]">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer />
        </NextIntlClientProvider>
        <PwaRegistration />
        <Analytics />
        <SpeedInsights />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
