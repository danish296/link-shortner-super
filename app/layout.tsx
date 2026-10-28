import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

const DESCRIPTION =
  "Branded short links, trackable QR codes and click analytics in one workspace. Free plan, no credit card.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: "LinkShort — short links, QR codes and analytics",
    template: "%s · LinkShort",
  },
  description: DESCRIPTION,
  applicationName: "LinkShort",
  openGraph: {
    type: "website",
    siteName: "LinkShort",
    title: "LinkShort — short links, QR codes and analytics",
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkShort — short links, QR codes and analytics",
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#050608" },
  ],
  width: "device-width",
  initialScale: 1,
};

const themeScript = `(function(){var el=document.documentElement;el.classList.add('js');try{var stored=localStorage.getItem('ls-theme');var pick=stored==='light'||stored==='dark'?stored:(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');el.dataset.theme=pick;if(!stored){var mq=window.matchMedia('(prefers-color-scheme: light)');var sync=function(e){if(!localStorage.getItem('ls-theme'))el.dataset.theme=e.matches?'light':'dark';};if(mq.addEventListener)mq.addEventListener('change',sync);else if(mq.addListener)mq.addListener(sync);}}catch(e){el.dataset.theme='dark';}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
