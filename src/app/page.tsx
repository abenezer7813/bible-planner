"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBibleStore } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const { hydrated, userEmail } = useBibleStore();

  useEffect(() => {
    if (hydrated) router.replace(userEmail ? "/dashboard" : "/login");
  }, [hydrated, userEmail, router]);

  return (
    <main className="min-h-screen flex items-center justify-center text-sm text-[var(--ink-soft)]">
      Loading your reading space…
    </main>
  );
}
