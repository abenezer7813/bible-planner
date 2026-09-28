"use client";

import { useRef, useState } from "react";
import { useBibleStore } from "@/lib/store";

export default function SettingsPage() {
  const {
    state,
    setUserName,
    resetProgress,
    authEnabled,
    authBusy,
    userEmail,
    cloudError,
    signIn,
    signUp,
    signOut,
  } = useBibleStore();
  const nameInput = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [authMessage, setAuthMessage] = useState("");
  const [authMessageIsError, setAuthMessageIsError] = useState(false);

  async function submitAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage("");
    setAuthMessageIsError(false);

    if (authMode === "sign-in") {
      const error = await signIn(email.trim(), password);
      if (error) {
        setAuthMessage(error);
        setAuthMessageIsError(true);
      } else {
        setAuthMessage("Signed in. Your reading progress is syncing.");
      }
      return;
    }

    const result = await signUp(email.trim(), password);
    if (result.error) {
      setAuthMessage(result.error);
      setAuthMessageIsError(true);
    } else if (result.confirmationRequired) {
      setAuthMessage("Check your email to confirm your account, then sign in.");
      setAuthMode("sign-in");
    } else {
      setAuthMessage("Account created. Your reading progress is syncing.");
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <h1 className="text-2xl md:text-[28px] font-semibold text-[var(--ink)]">Settings</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">Manage your profile and reading data.</p>
      </div>

      <div className="card p-5">
        <div className="font-semibold text-[var(--ink)] mb-1">Account and sync</div>
        {!authEnabled ? (
          <p className="text-sm text-[var(--ink-soft)] mt-2">
            Cloud sync is not configured. Add your Supabase project URL and publishable key to the environment to enable accounts.
          </p>
        ) : userEmail ? (
          <div className="mt-3 flex flex-col gap-3">
            <div>
              <div className="text-sm text-[var(--ink)]">{userEmail}</div>
              <div className="text-xs text-[var(--green-dark)] mt-1">
                {cloudError ? "Sync issue" : "Reading progress syncs to your account"}
              </div>
              {cloudError && <p role="status" className="text-sm text-red-700 mt-2">{cloudError}</p>}
            </div>
            <button
              type="button"
              onClick={async () => {
                const error = await signOut();
                setAuthMessage(error ?? "Signed out.");
                setAuthMessageIsError(Boolean(error));
              }}
              disabled={authBusy}
              className="self-start px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--ink)] disabled:opacity-50"
            >
              {authBusy ? "Please wait…" : "Sign out"}
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-1 mt-3 border-b border-[var(--border)]" role="tablist" aria-label="Account access">
              <button
                type="button"
                role="tab"
                aria-selected={authMode === "sign-in"}
                onClick={() => { setAuthMode("sign-in"); setAuthMessage(""); }}
                className={`px-3 py-2 text-sm font-medium border-b-2 ${authMode === "sign-in" ? "border-[var(--green)] text-[var(--green-dark)]" : "border-transparent text-[var(--ink-soft)]"}`}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={authMode === "sign-up"}
                onClick={() => { setAuthMode("sign-up"); setAuthMessage(""); }}
                className={`px-3 py-2 text-sm font-medium border-b-2 ${authMode === "sign-up" ? "border-[var(--green)] text-[var(--green-dark)]" : "border-transparent text-[var(--ink-soft)]"}`}
              >
                Create account
              </button>
            </div>
            <form onSubmit={submitAuth} className="flex flex-col gap-3 mt-4">
              <label className="text-xs uppercase tracking-wide text-[var(--ink-faint)]" htmlFor="account-email">Email</label>
              <input
                id="account-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm outline-none focus:border-[var(--green)]"
              />
              <label className="text-xs uppercase tracking-wide text-[var(--ink-faint)]" htmlFor="account-password">Password</label>
              <input
                id="account-password"
                type="password"
                autoComplete={authMode === "sign-in" ? "current-password" : "new-password"}
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm outline-none focus:border-[var(--green)]"
              />
              <button
                type="submit"
                disabled={authBusy}
                className="self-start px-4 py-2 rounded-xl bg-[var(--green)] text-[#f6f2e9] text-sm font-semibold disabled:opacity-50"
              >
                {authBusy ? "Please wait…" : authMode === "sign-in" ? "Sign in" : "Create account"}
              </button>
            </form>
            {authMessage && (
              <p role="status" className={`text-sm mt-3 ${authMessageIsError ? "text-red-700" : "text-[var(--green-dark)]"}`}>
                {authMessage}
              </p>
            )}
            {cloudError && <p role="status" className="text-sm text-red-700 mt-2">{cloudError}</p>}
          </>
        )}
      </div>

      <div className="card p-5">
        <div className="font-semibold text-[var(--ink)] mb-3">Profile</div>
        <label className="text-xs uppercase tracking-wide text-[var(--ink-faint)]">Display name</label>
        <div className="flex gap-2 mt-1.5">
          <input
            id="display-name"
            key={state.userName}
            ref={nameInput}
            defaultValue={state.userName}
            className="flex-1 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm outline-none focus:border-[var(--green)]"
          />
          <button
            onClick={() => setUserName(nameInput.current?.value.trim() || "Reader")}
            className="px-4 py-2 rounded-xl bg-[var(--green)] text-[#f6f2e9] text-sm font-semibold"
          >
            Save
          </button>
        </div>
      </div>

      <div className="card p-5">
        <div className="font-semibold text-[var(--ink)] mb-1">Reset progress</div>
        <p className="text-sm text-[var(--ink-soft)] mb-3">
          Clears every completed reading, streak, and stat stored in this browser. This can&rsquo;t be undone.
        </p>
        {confirmReset ? (
          <div className="flex gap-2">
            <button
              onClick={() => {
                resetProgress();
                setConfirmReset(false);
              }}
              className="px-4 py-2 rounded-xl bg-red-700 text-white text-sm font-semibold"
            >
              Yes, reset everything
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--ink-soft)]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--ink)]"
          >
            Reset progress
          </button>
        )}
      </div>

      <div className="text-xs text-[var(--ink-faint)]">
        {userEmail ? "Your account data is synced to Supabase and cached in this browser." : "Without an account, data stays in this browser only."}
      </div>
    </div>
  );
}
