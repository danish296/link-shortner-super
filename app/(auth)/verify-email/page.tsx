import Link from "next/link";
import { ArrowRight, MailCheck } from "@/components/icons";

export const metadata = { title: "Verify email" };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  const token = params.token && /^[a-f0-9]{16,80}$/i.test(params.token) ? params.token : null;

  if (!token) {
    return (
      <div className="card card-pad text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warn/15 text-warn">
          <MailCheck size={24} />
        </span>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">Verification link missing</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          This page needs a token from a verification link. Open the banner in your dashboard to resend one, or sign in and verify from
          settings.
        </p>
        <Link href="/login" className="btn btn-primary btn-block mt-4">
          Go to sign in <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="card card-pad text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand/15 text-brand-ink">
        <MailCheck size={24} />
      </span>
      <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">Confirm your email</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        In production this link would arrive by email. In this demo, confirm it directly — verification unlocks the reminder banner in your
        dashboard.
      </p>
      <a href={`/api/auth/verify-email?token=${encodeURIComponent(token)}`} className="btn btn-primary btn-block mt-4">
        Verify my email <ArrowRight size={15} />
      </a>
      <p className="mt-3 text-xs text-muted">You can keep using LinkShort without verifying; the banner just stays visible.</p>
    </div>
  );
}
