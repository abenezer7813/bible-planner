"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  buildPlan,
  BIBLE_TOTAL,
  NT_TOTAL,
  OT_TOTAL,
  DEFAULT_CUSTOM_CHAPTERS,
  type CustomGoal,
  type DayReading,
  type PlanId,
} from "./bible-data";
import { getSupabaseClient, supabaseConfigured } from "./supabase";

const STORAGE_KEY = "bible-tracker-state-v1";
const accountStorageKey = (userId: string) => `${STORAGE_KEY}-user-${userId}`;

export type Slot = "morning" | "night";

export type DayCompletion = {
  morning: boolean;
  night: boolean;
  morningAt?: string;
  nightAt?: string;
};

export type Completions = Record<number, DayCompletion>;

export type PersistedState = {
  startDate: string; // ISO date for day 1 of the plan
  userName: string;
  completions: Completions;
  planId: PlanId;
  customGoal: CustomGoal;
  chaptersPerDay: number;
};

const DEFAULT_START_DATE = "2026-07-03";

function todayISODate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;
}

function loadState(storageKey = STORAGE_KEY): PersistedState {
  if (typeof window === "undefined") {
    return {
      startDate: DEFAULT_START_DATE,
      userName: "Reader",
      completions: {},
      planId: "one-year",
      customGoal: "chapters",
      chaptersPerDay: DEFAULT_CUSTOM_CHAPTERS,
    };
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (parsed.startDate && parsed.completions) {
        return {
          startDate: parsed.startDate,
          userName: parsed.userName || "Reader",
          completions: parsed.completions,
          planId: parsed.planId ?? "one-year",
          customGoal: parsed.customGoal ?? "chapters",
          chaptersPerDay: parsed.chaptersPerDay ?? DEFAULT_CUSTOM_CHAPTERS,
        };
      }
    }
  } catch {
    // ignore corrupt storage
  }
  return {
    startDate: todayISODate(),
    userName: "Reader",
    completions: {},
    planId: "one-year",
    customGoal: "chapters",
    chaptersPerDay: DEFAULT_CUSTOM_CHAPTERS,
  };
}

function dateOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function currentDayNumber(startDate: string, planLength: number): number {
  const start = dateOnly(parseLocalDate(startDate));
  const today = dateOnly(new Date());
  const diffDays = Math.round((today.getTime() - start.getTime()) / 86400000) + 1;
  return Math.min(Math.max(diffDays, 1), planLength + 1);
}

function dateForDay(startDate: string, day: number): Date {
  const start = dateOnly(parseLocalDate(startDate));
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + day - 1);
}

export type DayStatus = "completed" | "partial" | "missed" | "today" | "upcoming" | "rest";

export function dayStatus(
  day: number,
  today: number,
  completion: DayCompletion | undefined,
  reading?: DayReading
): DayStatus {
  if (day > today) return "upcoming";
  const needsMorning = reading ? reading.morning.length > 0 : true;
  const needsNight = reading ? reading.night.length > 0 : true;
  if (!needsMorning && !needsNight) return "rest";
  const done = Number(needsMorning && !!completion?.morning) +
    Number(needsNight && !!completion?.night);
  const required = Number(needsMorning) + Number(needsNight);
  if (done === required) return "completed";
  if (done > 0) return "partial";
  if (day === today) return "today";
  return "missed";
}

type Stats = {
  today: number;
  plan: DayReading[];
  planLength: number;
  totalChapters: number;
  otCompleted: number;
  ntCompleted: number;
  daysFullyCompleted: number;
  daysWithAnyReading: number;
  currentStreak: number;
  longestStreak: number;
  weekly: { day: number; label: string; status: DayStatus }[];
  monthLabel: string;
};

function computeStats(state: PersistedState): Stats {
  const plan = buildPlan(state.planId, state.customGoal, state.chaptersPerDay);
  const planLength = plan.length;
  const today = currentDayNumber(state.startDate, planLength);
  const completedOT = new Set<string>();
  const completedNT = new Set<string>();
  let daysFullyCompleted = 0;
  let daysWithAnyReading = 0;

  for (let d = 1; d <= Math.min(today, planLength); d++) {
    const c = state.completions[d];
    const reading = plan[d - 1];
    if (c?.morning) reading.morning.forEach((ref) => completedNT.add(`${ref.book}:${ref.chapter}`));
    if (c?.night) reading.night.forEach((ref) => completedOT.add(`${ref.book}:${ref.chapter}`));
    const status = dayStatus(d, today, c, reading);
    if (d < today && status === "completed") daysFullyCompleted++;
    if (d < today && status !== "missed" && status !== "rest") daysWithAnyReading++;
  }
  const ntCompleted = completedNT.size;
  const otCompleted = completedOT.size;

  // Current streak: consecutive fully-completed days ending the day before today.
  let currentStreak = 0;
  for (let d = today - 1; d >= 1; d--) {
    const c = state.completions[d];
    const status = dayStatus(d, today, c, plan[d - 1]);
    if (status === "rest") continue;
    if (status === "completed") currentStreak++;
    else break;
  }

  // Longest streak across the whole history.
  let longestStreak = 0;
  let run = 0;
  for (let d = 1; d <= planLength; d++) {
    const c = state.completions[d];
    const status = dayStatus(d, today, c, plan[d - 1]);
    if (status === "rest") continue;
    if (status === "completed") {
      run++;
      longestStreak = Math.max(longestStreak, run);
    } else {
      run = 0;
    }
  }

  // Last 7 calendar days (Mon-Sun aligned around today).
  const weekly: Stats["weekly"] = [];
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  const todayDate = dateForDay(state.startDate, today);
  const dow = (todayDate.getDay() + 6) % 7; // 0=Mon
  for (let i = 0; i < 7; i++) {
    const dayNum = today - dow + i;
    if (dayNum < 1 || dayNum > planLength) {
      weekly.push({ day: dayNum, label: labels[i], status: "upcoming" });
      continue;
    }
    const c = state.completions[dayNum];
    weekly.push({
      day: dayNum,
      label: labels[i],
      status: dayStatus(dayNum, today, c, plan[dayNum - 1]),
    });
  }

  const monthLabel = todayDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return {
    today,
    plan,
    planLength,
    totalChapters: otCompleted + ntCompleted,
    otCompleted,
    ntCompleted,
    daysFullyCompleted,
    daysWithAnyReading,
    currentStreak,
    longestStreak,
    weekly,
    monthLabel,
  };
}

type Ctx = {
  state: PersistedState;
  stats: Stats;
  hydrated: boolean;
  authEnabled: boolean;
  authBusy: boolean;
  userEmail: string | null;
  cloudError: string | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<{ error: string | null; confirmationRequired: boolean }>;
  signOut: () => Promise<string | null>;
  toggleSlot: (day: number, slot: Slot) => void;
  setSlot: (day: number, slot: Slot, value: boolean) => void;
  resetProgress: () => void;
  setUserName: (name: string) => void;
  startPlan: (planId: PlanId, customGoal: CustomGoal, chaptersPerDay: number) => void;
  dateForDay: (day: number) => Date;
  totals: { bible: number; ot: number; nt: number };
};

const BibleStoreContext = createContext<Ctx | null>(null);

export function BibleStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => ({
    startDate: DEFAULT_START_DATE,
    userName: "Reader",
    completions: {},
    planId: "one-year",
    customGoal: "chapters",
    chaptersPerDay: DEFAULT_CUSTOM_CHAPTERS,
  }));
  const [hydrated, setHydrated] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountReady, setAccountReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);

  const loadAccount = useCallback(async (user: { id: string; email?: string }) => {
    const client = getSupabaseClient();
    if (!client) return;

    setAccountReady(false);
    setCloudError(null);
    setAccountId(user.id);
    setUserEmail(user.email ?? null);

    try {
      const { data, error } = await client
        .from("reading_progress")
        .select("state")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;

      let nextState: PersistedState;
      if (data?.state && typeof data.state === "object") {
        nextState = data.state as PersistedState;
      } else {
        const userKey = accountStorageKey(user.id);
        const sourceKey = window.localStorage.getItem(userKey)
          ? userKey
          : window.localStorage.getItem(STORAGE_KEY)
            ? STORAGE_KEY
            : userKey;
        nextState = loadState(sourceKey);
      }

      setState(nextState);
      setAccountReady(true);
    } catch (error) {
      setCloudError(error instanceof Error ? error.message : "Could not load cloud data.");
    }
  }, []);

  useEffect(() => {
    let active = true;
    const client = getSupabaseClient();

    const initialize = async () => {
      // localStorage is client-only; load after hydration to keep the SSR snapshot deterministic.
      setState(loadState());
      if (client) {
        const { data, error } = await client.auth.getSession();
        if (error) setCloudError(error.message);
        if (data.session?.user) await loadAccount(data.session.user);
      }
      if (active) setHydrated(true);
    };

    void initialize();
    if (!client) return () => { active = false; };

    const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setAccountId(null);
        setAccountReady(false);
        setUserEmail(null);
        setCloudError(null);
        setState(loadState());
      } else if (event === "SIGNED_IN" && session?.user) {
        window.setTimeout(() => void loadAccount(session.user), 0);
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [loadAccount]);

  useEffect(() => {
    if (!hydrated) return;
    if (accountId && !accountReady) return;
    try {
      const storageKey = accountId ? accountStorageKey(accountId) : STORAGE_KEY;
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // storage full or unavailable — ignore
    }
  }, [state, hydrated, accountId, accountReady]);

  useEffect(() => {
    if (!hydrated || !accountId || !accountReady) return;
    const client = getSupabaseClient();
    if (!client) return;

    const userId = accountId;
    const timeout = window.setTimeout(async () => {
      const { error } = await client.from("reading_progress").upsert({
        user_id: userId,
        state,
        updated_at: new Date().toISOString(),
      });
      setCloudError(error?.message ?? null);
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [state, hydrated, accountId, accountReady]);

  const signIn = useCallback(async (email: string, password: string) => {
    const client = getSupabaseClient();
    if (!client) return "Add your Supabase URL and publishable key to the environment.";
    setAuthBusy(true);
    try {
      const { error } = await client.auth.signInWithPassword({ email, password });
      return error?.message ?? null;
    } catch (error) {
      return error instanceof Error ? error.message : "Could not sign in.";
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const client = getSupabaseClient();
    if (!client) {
      return {
        error: "Add your Supabase URL and publishable key to the environment.",
        confirmationRequired: false,
      };
    }
    setAuthBusy(true);
    try {
      const { data, error } = await client.auth.signUp({ email, password });
      return {
        error: error?.message ?? null,
        confirmationRequired: !error && !data.session,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Could not create your account.",
        confirmationRequired: false,
      };
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) return null;
    setAuthBusy(true);
    try {
      const { error } = await client.auth.signOut();
      return error?.message ?? null;
    } catch (error) {
      return error instanceof Error ? error.message : "Could not sign out.";
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const setSlot = useCallback((day: number, slot: Slot, value: boolean) => {
    setState((prev) => {
      const existing = prev.completions[day] ?? { morning: false, night: false };
      const time = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      const next: DayCompletion = {
        ...existing,
        [slot]: value,
        ...(value ? { [`${slot}At`]: time } : {}),
      };
      if (!value) delete next[`${slot}At` as "morningAt" | "nightAt"];
      return {
        ...prev,
        completions: { ...prev.completions, [day]: next },
      };
    });
  }, []);

  const toggleSlot = useCallback(
    (day: number, slot: Slot) => {
      setSlot(day, slot, !(state.completions[day]?.[slot] ?? false));
    },
    [setSlot, state.completions]
  );

  const resetProgress = useCallback(() => {
    setState((prev) => ({ ...prev, completions: {} }));
  }, []);

  const setUserName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, userName: name }));
  }, []);

  const startPlan = useCallback(
    (planId: PlanId, customGoal: CustomGoal, chaptersPerDay: number) => {
      setState((prev) => ({
        ...prev,
        startDate: todayISODate(),
        completions: {},
        planId,
        customGoal,
        chaptersPerDay: Math.max(1, Math.min(20, Math.floor(chaptersPerDay))),
      }));
    },
    []
  );

  const stats = useMemo(() => computeStats(state), [state]);

  const value: Ctx = useMemo(
    () => ({
      state,
      stats,
      hydrated,
      authEnabled: supabaseConfigured,
      authBusy,
      userEmail,
      cloudError,
      signIn,
      signUp,
      signOut,
      toggleSlot,
      setSlot,
      resetProgress,
      setUserName,
      startPlan,
      dateForDay: (day: number) => dateForDay(state.startDate, day),
      totals: { bible: BIBLE_TOTAL, ot: OT_TOTAL, nt: NT_TOTAL },
    }),
    [
      state,
      stats,
      hydrated,
      authBusy,
      userEmail,
      cloudError,
      signIn,
      signUp,
      signOut,
      toggleSlot,
      setSlot,
      resetProgress,
      setUserName,
      startPlan,
    ]
  );

  return <BibleStoreContext.Provider value={value}>{children}</BibleStoreContext.Provider>;
}

export function useBibleStore() {
  const ctx = useContext(BibleStoreContext);
  if (!ctx) throw new Error("useBibleStore must be used within BibleStoreProvider");
  return ctx;
}
