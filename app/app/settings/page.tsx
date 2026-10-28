import { requireUser } from "@/lib/auth";
import { SettingsView } from "@/components/settings/settings-view";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <SettingsView
      user={{
        name: user.name,
        email: user.email,
        emailVerified: Boolean(user.email_verified),
        createdAt: user.created_at,
      }}
    />
  );
}
