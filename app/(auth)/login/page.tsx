import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verify?: string; reset?: string; next?: string; email?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/app/dashboard");
  const params = await searchParams;

  return (
    <>
      {params.verify === "invalid" ? (
        <div className="alert alert-error mb-4">That verification link is invalid or has already been used.</div>
      ) : null}
      {params.reset === "1" ? (
        <div className="alert alert-ok mb-4">Password updated. Sign in with your new password.</div>
      ) : null}
      <LoginForm next={params.next} prefillEmail={params.email} />
    </>
  );
}
