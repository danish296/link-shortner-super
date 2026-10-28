import { LegalDoc } from "@/components/marketing/legal-doc";

export const metadata = { title: "Cookie policy" };

export default function CookiesPage() {
  return (
    <LegalDoc
      title="Cookie policy"
      updated="October 1, 2026"
      intro="LinkShort uses the smallest set of cookies that lets the product work. There are no advertising or analytics cookies from third parties in this build."
      sections={[
        {
          heading: "Essential cookies",
          body: ["These are required for authentication and link behaviour and cannot be turned off."],
          bullets: [
            "ls_session — HttpOnly session cookie that keeps you signed in. Expires after 30 days or on sign-out.",
            "ls_unlock_<code> — signed cookie that remembers you entered the password for a protected link. Expires after 1 hour.",
          ],
        },
        {
          heading: "Preference storage",
          body: [
            "Your dark or light theme choice is saved in browser local storage under the key ls-theme. It never leaves your device and is not linked to your account.",
          ],
        },
        {
          heading: "What we do not use",
          body: [
            "No advertising cookies, no cross-site trackers and no analytics scripts from third parties. Click analytics are computed on our own server from request headers.",
          ],
        },
        {
          heading: "Managing cookies",
          body: [
            "You can clear cookies from your browser settings at any time. Clearing ls_session signs you out; clearing ls_unlock cookies means protected links ask for their password again.",
          ],
        },
      ]}
    />
  );
}
