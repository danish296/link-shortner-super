import { LegalDoc } from "@/components/marketing/legal-doc";

export const metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <LegalDoc
      title="Terms of service"
      updated="October 1, 2026"
      intro="These terms describe how you may use LinkShort, a URL shortening, QR code and link analytics product. By creating an account you agree to them. This build is a demonstration application, not a commercial service."
      sections={[
        {
          heading: "Your account",
          body: [
            "You need a valid email address and a password of at least eight characters to register. You are responsible for activity performed with your credentials and API keys, and for keeping them confidential.",
            "You must be at least 16 years old (or the minimum age in your jurisdiction) to use the service.",
          ],
        },
        {
          heading: "Acceptable use",
          body: ["Short links are a trust mechanism. Do not use LinkShort to:"],
          bullets: [
            "Distribute malware, phishing pages or deceptive redirects.",
            "Impersonate another person, brand or government entity.",
            "Send unsolicited bulk messages or evade platform spam controls.",
            "Publish content that is illegal in your jurisdiction or that infringes intellectual property.",
            "Probe, overload or attempt to bypass plan limits, rate limits or authentication.",
          ],
        },
        {
          heading: "Links and destinations",
          body: [
            "You keep ownership of every link you create and the destination it points to. We may disable links that violate these terms or that we are legally required to block, and we will explain the reason where we can.",
            "Destination URLs are fetched by visitors' browsers, not by our servers. We do not review destination content in advance.",
          ],
        },
        {
          heading: "Plans and billing",
          body: [
            "Free, Basic, Pro and Growth plans differ in link volume, QR codes, campaigns, bio pages, custom domains and analytics retention. Current limits are listed on the pricing page.",
            "This build processes upgrades through a simulator: selecting a plan updates your account immediately and no card is charged. A production deployment would use a payment processor and clearly display renewal terms before checkout.",
          ],
        },
        {
          heading: "Analytics data",
          body: [
            "Click analytics are aggregated per link and include coarse location, device, browser and referrer information. Bot traffic is flagged and excluded from reported totals. Retention depends on your plan; upgrading makes older data visible again.",
          ],
        },
        {
          heading: "Availability and changes",
          body: [
            "The service is provided on an as-is basis without uptime guarantees. We may change features, limits or these terms; material changes will be announced in the dashboard before they take effect.",
          ],
        },
        {
          heading: "Termination",
          body: [
            "You can delete your account at any time from Settings. Deleting your account removes your links, campaigns, QR codes, bio pages and click history from the active database.",
            "We may suspend accounts that repeatedly violate these terms, with notice where practical.",
          ],
        },
        {
          heading: "Liability",
          body: [
            "To the maximum extent permitted by law, LinkShort is not liable for indirect or consequential damages arising from your use of the service, including lost revenue caused by destination sites, network failures or platform policies run by third parties.",
          ],
        },
      ]}
    />
  );
}
