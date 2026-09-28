"use client";

import { useRef, useState } from "react";
import Link from "next/link";
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
    signOut,
  } = useBibleStore();
  const nameInput = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [accountMessage, setAccountMessage] = useState("");

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
                setAccountMessage(await signOut() ?? "");
              }}
              disabled={authBusy}
              className="self-start px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--ink)] disabled:opacity-50"
            >
              {authBusy ? "Please wait…" : "Sign out"}
            </button>
            {accountMessage && <p role="status" className="text-sm text-red-700">{accountMessage}</p>}
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-[var(--ink-soft)]">
              You&rsquo;re using a guest profile. Your reading progress stays in this browser until you sign in.
            </p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm font-semibold text-[var(--green-dark)]">
              <Link href="/login" className="underline underline-offset-2">Sign in</Link>
              <Link href="/signup" className="underline underline-offset-2">Create account</Link>
            </div>
          </div>
        )}
      </div>

      <div className="card p-5">
        <div className="font-semibold text-[var(--ink)] mb-3">Profile</div>
        <label htmlFor="display-name" className="text-xs uppercase tracking-wide text-[var(--ink-faint)]">Display name</label>
        <div className="flex gap-2 mt-1.5">
          <input
            id="display-name"
            key={state.userName}
            ref={nameInput}
            defaultValue={state.userName}
            className="flex-1 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm outline-none focus:border-[var(--green)]"
          />
          <button
            type="button"
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
          Clears every completed reading, streak, and stat for {userEmail ? "this account" : "this browser"}. This can&rsquo;t be undone.
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
