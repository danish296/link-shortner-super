import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPlan, isPlanId } from "@/lib/plans";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = { title: "Create account" };

function sanitizeUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; url?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/app/dashboard");
  const params = await searchParams;
  const planName = isPlanId(params.plan) ? getPlan(params.plan).name : null;
  const claimedUrl = sanitizeUrl(params.url);

  return (
    <>
      {claimedUrl ? (
        <div className="alert alert-info mb-4">
          Create an account and we&apos;ll open the link builder with your URL ready to shorten.
        </div>
      ) : null}
      <RegisterForm planName={planName} claimedUrl={claimedUrl} />
    </>
  );
}
