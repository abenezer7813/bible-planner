"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { useBibleStore } from "@/lib/store";

type AuthFormProps = {
  mode: "login" | "signup";
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { hydrated, authEnabled, authBusy, userEmail, signIn, signUp } = useBibleStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const isLogin = mode === "login";

  useEffect(() => {
    if (hydrated && userEmail) router.replace("/dashboard");
  }, [hydrated, userEmail, router]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);

    if (isLogin) {
      const error = await signIn(email.trim(), password);
      if (error) {
        setMessage(error);
        setIsError(true);
      } else {
        router.replace("/dashboard");
      }
      return;
    }

    const result = await signUp(email.trim(), password);
    if (result.error) {
      setMessage(result.error);
      setIsError(true);
    } else if (result.confirmationRequired) {
      setMessage("Check your inbox to confirm your email, then sign in.");
    } else {
      router.replace("/dashboard");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: "var(--bg)" }}>
      <section className="w-full max-w-md">
        <Link href="/dashboard" className="flex items-center justify-center gap-2 mb-8 text-[var(--ink)]">
          <span className="w-10 h-10 rounded-xl bg-[var(--green)] flex items-center justify-center">
            <BookOpen size={20} color="#f6f2e9" strokeWidth={2.2} />
          </span>
          <span className="font-semibold">Bible Tracker</span>
        </Link>

        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-semibold text-[var(--ink)]">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-[var(--ink-soft)] mt-2 mb-6">
            {isLogin
              ? "Sign in to access your reading progress across devices."
              : "Save your reading progress and continue on any device."}
          </p>

          {!hydrated ? (
            <p className="text-sm text-[var(--ink-soft)]">Loading account status…</p>
          ) : !authEnabled ? (
            <p role="status" className="text-sm text-red-700">
              Supabase isn’t configured. Add the project URL and publishable key to the environment, then restart the app.
            </p>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-3">
              <label htmlFor="auth-email" className="text-xs uppercase tracking-wide text-[var(--ink-faint)]">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm outline-none focus:border-[var(--green)]"
              />
              <label htmlFor="auth-password" className="text-xs uppercase tracking-wide text-[var(--ink-faint)] mt-1">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm outline-none focus:border-[var(--green)]"
              />
              {message && (
                <p role="status" className={`text-sm ${isError ? "text-red-700" : "text-[var(--green-dark)]"}`}>
                  {message}
                </p>
              )}
              <button
                type="submit"
                disabled={authBusy}
                className="mt-2 px-4 py-2.5 rounded-xl bg-[var(--green)] text-[#f6f2e9] text-sm font-semibold disabled:opacity-50"
              >
                {authBusy ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
              </button>
            </form>
          )}

          <p className="text-sm text-center text-[var(--ink-soft)] mt-6">
            {isLogin ? "New to Bible Tracker?" : "Already have an account?"}{" "}
            <Link href={isLogin ? "/signup" : "/login"} className="font-semibold text-[var(--green-dark)] underline underline-offset-2">
              {isLogin ? "Create an account" : "Sign in"}
            </Link>
          </p>
          <Link href="/dashboard" className="block text-xs text-center text-[var(--ink-faint)] mt-4 hover:text-[var(--ink-soft)]">
            Continue without an account
          </Link>
        </div>
      </section>
    </main>
  );
}
