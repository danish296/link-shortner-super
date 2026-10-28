"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2, Lock, Mail, Save, ShieldCheck, Trash2, UserRound } from "@/components/icons";
import { Modal } from "@/components/modal";
import { PageHeader, SectionCard } from "@/components/ui";

export function SettingsView({
  user,
}: {
  user: { name: string; email: string; emailVerified: boolean; createdAt: number };
}) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setProfileBusy(true);
    setProfileError(null);
    setProfileSaved(false);
    setVerifyUrl(null);
    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; verifyUrl?: string | null };
      if (!response.ok) throw new Error(data.error || "Could not save your profile");
      setProfileSaved(true);
      if (data.verifyUrl) {
        setVerifyUrl(data.verifyUrl);
        setEmail(email.toLowerCase());
      }
      router.refresh();
    } catch (saveError) {
      setProfileError(saveError instanceof Error ? saveError.message : "Could not save your profile");
    } finally {
      setProfileBusy(false);
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);
    if (next !== confirm) {
      setPasswordError("The new passwords don't match");
      return;
    }
    setPasswordBusy(true);
    try {
      const response = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ current, next }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not update your password");
      setPasswordSaved(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (saveError) {
      setPasswordError(saveError instanceof Error ? saveError.message : "Could not update your password");
    } finally {
      setPasswordBusy(false);
    }
  }

  async function deleteAccount() {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not delete your account");
      router.push("/");
      router.refresh();
    } catch (deleteAccountError) {
      setDeleteError(deleteAccountError instanceof Error ? deleteAccountError.message : "Could not delete your account");
      setDeleteBusy(false);
    }
  }

  const profileDirty = name !== user.name || email !== user.email;

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your profile, password and account data."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <SectionCard title="Profile" subtitle="Your name and sign-in email">
            <form onSubmit={saveProfile}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="settings-name">
                    Full name
                  </label>
                  <div className="relative">
                    <UserRound size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      id="settings-name"
                      className="input pl-10"
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value);
                        setProfileSaved(false);
                      }}
                      minLength={2}
                      maxLength={80}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="settings-email">
                    Email
                  </label>
                  <div className="relative">
                    <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      id="settings-email"
                      type="email"
                      className="input pl-10"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setProfileSaved(false);
                      }}
                      required
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    {user.emailVerified ? (
                      <span className="flex items-center gap-1 text-ok">
                        <CheckCircle2 size={11} /> Verified
                      </span>
                    ) : (
                      <span className="text-warn">Not verified — check your inbox</span>
                    )}
                  </div>
                </div>
              </div>

              {verifyUrl ? (
                <div className="alert alert-info mt-3">
                  Email changed. In this local build, open the verification link directly:{" "}
                  <a href={verifyUrl} className="font-semibold underline">
                    verify now
                  </a>
                </div>
              ) : null}
              {profileError ? <div className="alert alert-error mt-3">{profileError}</div> : null}
              {profileSaved ? <div className="alert alert-ok mt-3">Profile saved.</div> : null}

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted">Member since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</p>
                <button type="submit" className="btn btn-primary btn-sm" disabled={profileBusy || !profileDirty}>
                  {profileBusy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save profile
                </button>
              </div>
            </form>
          </SectionCard>

          <SectionCard title="Password" subtitle="Use at least 8 characters">
            <form onSubmit={savePassword}>
              <div className="field">
                <label className="label" htmlFor="settings-current">
                  Current password
                </label>
                <div className="relative">
                  <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    id="settings-current"
                    type="password"
                    className="input pl-10"
                    value={current}
                    onChange={(event) => setCurrent(event.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="settings-next">
                    New password
                  </label>
                  <input
                    id="settings-next"
                    type="password"
                    className="input"
                    value={next}
                    onChange={(event) => setNext(event.target.value)}
                    minLength={8}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="settings-confirm">
                    Confirm new password
                  </label>
                  <input
                    id="settings-confirm"
                    type="password"
                    className="input"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    minLength={8}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>
              {passwordError ? <div className="alert alert-error mt-3">{passwordError}</div> : null}
              {passwordSaved ? <div className="alert alert-ok mt-3">Password updated.</div> : null}
              <div className="mt-4 flex justify-end">
                <button type="submit" className="btn btn-primary btn-sm" disabled={passwordBusy || !current || !next || !confirm}>
                  {passwordBusy ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Update password
                </button>
              </div>
            </form>
          </SectionCard>

          <div className="card border-bad/25 p-6">
            <div className="flex items-start gap-3">
              <span className="feature-icon h-9 w-9 !border-bad/25 !bg-bad/10 !text-bad">
                <AlertTriangle size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-sm font-semibold text-bad">Danger zone</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Deleting your account removes every link, click, QR code, campaign and bio page immediately. This cannot be undone.
                </p>
                <button type="button" className="btn btn-danger btn-sm mt-3" onClick={() => setDeleteOpen(true)}>
                  <Trash2 size={14} /> Delete account
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <SectionCard title="Session" subtitle="How you're signed in">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted">Method</span>
                <span>Email + password</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Cookie</span>
                <span className="font-mono text-xs">ls_session</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Duration</span>
                <span>30 days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Security</span>
                <span className="text-ok">HttpOnly · SameSite</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Developer access" subtitle="Programmatic API">
            <p className="text-xs leading-relaxed text-muted">
              Create and manage an API key, then call the REST API from your own tools.
            </p>
            <a href="/app/api" className="btn btn-outline btn-sm mt-3 w-full">
              Manage API keys
            </a>
          </SectionCard>
        </div>
      </div>

      <Modal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setConfirmText("");
          setDeleteError(null);
        }}
        title="Delete your account?"
        subtitle="This is permanent. All links, analytics and pages are erased."
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setDeleteOpen(false)} disabled={deleteBusy}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={deleteAccount} disabled={deleteBusy || confirmText !== "DELETE"}>
              {deleteBusy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Delete everything
            </button>
          </>
        }
      >
        <label className="label" htmlFor="confirm-delete">
          Type <span className="mono text-bad">DELETE</span> to confirm
        </label>
        <input
          id="confirm-delete"
          className="input"
          value={confirmText}
          onChange={(event) => setConfirmText(event.target.value)}
          placeholder="DELETE"
          autoComplete="off"
        />
        {deleteError ? <div className="alert alert-error mt-3">{deleteError}</div> : null}
      </Modal>
    </>
  );
}
