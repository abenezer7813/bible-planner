"use client";

import { useBibleStore } from "@/lib/store";
import { readingLabel } from "@/lib/bible-data";
import ProgressBar from "@/components/progress-bar";
import { Check, Flame, Trophy, Clock } from "lucide-react";

export default function DashboardPage() {
  const { state, stats, toggleSlot, totals, dateForDay } = useBibleStore();
  const todayReading = stats.plan[stats.today - 1];
  const completion = state.completions[stats.today];
  const morningDone = completion?.morning ?? false;
  const nightDone = completion?.night ?? false;
  const morningRequired = (todayReading?.morning.length ?? 0) > 0;
  const nightRequired = (todayReading?.night.length ?? 0) > 0;
  const requiredCount = Number(morningRequired) + Number(nightRequired);
  const completedCount =
    Number(morningRequired && morningDone) + Number(nightRequired && nightDone);
  const catchUpReadings: {
    day: number;
    slot: "morning" | "night";
    title: string;
    label: string;
  }[] = [];

  for (let day = 1; day < stats.today; day++) {
    const reading = stats.plan[day - 1];
    const dayCompletion = state.completions[day];
    if (!reading) continue;

    if (reading.morning.length > 0 && !dayCompletion?.morning) {
      catchUpReadings.push({
        day,
        slot: "morning",
        title: readingLabel(reading.morning),
        label: state.planId === "custom" ? "Daily reading" : "Morning · New Testament",
      });
    }
    if (reading.night.length > 0 && !dayCompletion?.night) {
      catchUpReadings.push({
        day,
        slot: "night",
        title: readingLabel(reading.night),
        label: state.planId === "custom" && reading.morning.length === 0
          ? "Daily reading"
          : "Night · Old Testament",
      });
    }
  }
  const catchUpDayCount = new Set(catchUpReadings.map((reading) => reading.day)).size;

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const scheduledDaysThisWeek = stats.weekly.filter((day) => {
    const reading = stats.plan[day.day - 1];
    return (
      day.status !== "upcoming" &&
      day.status !== "rest" &&
      day.day < stats.today &&
      reading !== undefined &&
      reading.morning.length + reading.night.length > 0
    );
  });
  const completedDaysThisWeek = scheduledDaysThisWeek.filter(
    (day) => day.status === "completed" || day.status === "partial"
  ).length;
  const weeklyConsistency = scheduledDaysThisWeek.length
    ? Math.round((completedDaysThisWeek / scheduledDaysThisWeek.length) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs font-semibold tracking-wide text-[var(--ink-faint)] uppercase mb-1">
          {todayDate}
        </div>
        <h1 className="text-2xl md:text-[28px] font-semibold text-[var(--ink)]">
          Welcome back, {state.userName}
        </h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">Keep your daily rhythm alive.</p>
      </div>

      {catchUpReadings.length > 0 && (
        <section
          role="alert"
          className="rounded-xl border p-4"
          style={{ background: "#fff8e8", borderColor: "#ead7a5" }}
        >
          <h2 className="font-semibold text-ink">Catch up before moving on</h2>
          <p className="text-sm text-ink-soft mt-1">
            There is unfinished reading from {catchUpDayCount} previous day{catchUpDayCount === 1 ? "" : "s"}. Read these chapters before continuing with today&rsquo;s assignment.
          </p>
          <div className="mt-3 divide-y" style={{ borderColor: "#ead7a5" }}>
            {catchUpReadings.map((reading) => {
              const dateLabel = dateForDay(reading.day).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
              return (
                <div
                  key={`${reading.day}-${reading.slot}`}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-ink-faint">
                      {dateLabel} · {reading.label}
                    </div>
                    <div className="text-sm font-medium text-ink">{reading.title}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSlot(reading.day, reading.slot)}
                    aria-label={`Mark ${reading.title} from ${dateLabel} as complete`}
                    className="shrink-0 text-xs font-semibold px-3 py-2 rounded-full bg-green text-[#f6f2e9]"
                  >
                    Mark read
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[var(--ink)] flex items-center gap-2">
            Today&rsquo;s Assigned Reading
          </h2>
          {stats.today <= stats.planLength && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--green-soft)] text-[var(--green-dark)]">
              {completedCount} of {requiredCount} completed
            </span>
          )}
        </div>

        {stats.today > stats.planLength ? (
          <p className="card p-4 text-sm text-[var(--green-dark)]">You have completed this plan. Choose another plan to begin a new journey.</p>
        ) : todayReading && requiredCount > 0 ? (
          <div className="flex flex-col gap-3">
            {morningRequired && (
              <ReadingCard
                slotLabel={state.planId === "custom" ? "Daily reading" : "Morning · New Testament"}
                title={readingLabel(todayReading.morning)}
                meta={`${todayReading.morning.length} chapter${todayReading.morning.length === 1 ? "" : "s"}`}
                done={morningDone}
                timestamp={completion?.morningAt}
                onToggle={() => toggleSlot(stats.today, "morning")}
              />
            )}
            {nightRequired && (
              <ReadingCard
                slotLabel={
                  state.planId === "custom" && todayReading.morning.length === 0
                    ? "Daily reading"
                    : "Night · Old Testament"
                }
                title={readingLabel(todayReading.night)}
                meta={`${todayReading.night.length} chapter${todayReading.night.length === 1 ? "" : "s"}`}
                done={nightDone}
                timestamp={completion?.nightAt}
                onToggle={() => toggleSlot(stats.today, "night")}
              />
            )}
          </div>
        ) : (
          <p className="card p-4 text-sm text-[var(--ink-soft)]">Rest day — use this time to catch up.</p>
        )}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-[var(--ink)]">Overall Progress</span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--surface-soft)] text-[var(--ink-soft)]">
            {stats.today > stats.planLength
              ? "Plan complete"
              : `Day ${stats.today} of ${stats.planLength}`}
          </span>
        </div>
        <div className="flex items-end justify-between mb-2">
          <div>
            <span className="text-2xl font-semibold text-[var(--ink)]">
              {stats.totalChapters}
            </span>
            <span className="text-[var(--ink-faint)] text-sm"> / {totals.bible} chapters</span>
          </div>
          <span className="text-lg font-semibold text-[var(--green)]">
            {((stats.totalChapters / totals.bible) * 100).toFixed(1)}%
          </span>
        </div>
        <ProgressBar value={stats.totalChapters} max={totals.bible} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[var(--ink-faint)] text-xs font-medium uppercase tracking-wide">
            <Flame size={14} /> Current Streak
          </div>
          <div className="text-2xl font-semibold text-[var(--ink)]">
            {stats.currentStreak} <span className="text-sm font-normal text-[var(--ink-faint)]">days</span>
          </div>
          <div className="text-xs text-[var(--green-dark)]">Keep reading tomorrow!</div>
        </div>
        <div className="card p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[var(--ink-faint)] text-xs font-medium uppercase tracking-wide">
            <Trophy size={14} /> Longest Streak
          </div>
          <div className="text-2xl font-semibold text-[var(--ink)]">
            {stats.longestStreak} <span className="text-sm font-normal text-[var(--ink-faint)]">days</span>
          </div>
          <div className="text-xs text-[var(--ink-faint)]">Personal best</div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-[var(--ink)]">This Week</span>
          <span className="text-xs text-[var(--green-dark)] font-medium">
            {weeklyConsistency}% consistency
          </span>
        </div>
        <div className="flex justify-between">
          {stats.weekly.map((w) => (
            <div key={w.day} className="flex flex-col items-center gap-1.5">
              <span className="text-[11px] text-[var(--ink-faint)] font-medium">{w.label}</span>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{
                  background:
                    w.status === "completed"
                      ? "var(--reading-complete)"
                      : w.status === "partial"
                      ? "var(--reading-partial)"
                      : w.status === "today"
                      ? "var(--surface-soft)"
                      : "var(--surface-soft)",
                  color:
                    w.status === "completed"
                      ? "var(--ink)"
                      : w.status === "partial"
                      ? "#ffffff"
                      : "var(--ink-faint)",
                  border: w.status === "today" ? "2px solid var(--green)" : undefined,
                }}
              >
                {w.status === "completed" ? (
                  <Check size={15} strokeWidth={2.5} />
                ) : w.status === "missed" ? (
                  "—"
                ) : (
                  w.day
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReadingCard({
  slotLabel,
  title,
  meta,
  done,
  timestamp,
  onToggle,
}: {
  slotLabel: string;
  title: string;
  meta: string;
  done: boolean;
  timestamp?: string;
  onToggle: () => void;
}) {
  return (
    <div
      className="card p-4"
      style={done ? { background: "var(--green-tint)", borderColor: "var(--green-soft)" } : undefined}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium px-2 py-1 rounded-md bg-[var(--surface-soft)] text-[var(--ink-soft)]">
          {slotLabel}
        </span>
        {done && (
          <span className="w-6 h-6 rounded-full bg-[var(--green)] flex items-center justify-center shrink-0">
            <Check size={14} color="#f6f2e9" strokeWidth={2.5} />
          </span>
        )}
      </div>
      <h3
        className={`text-lg font-semibold ${done ? "line-through text-[var(--ink-soft)]" : "text-[var(--ink)]"}`}
      >
        {title}
      </h3>
      <p className="text-xs text-[var(--ink-faint)] mt-0.5">{meta}</p>
      <div className="flex items-center justify-between mt-3">
        {done ? (
          <span className="text-xs text-[var(--green-dark)] flex items-center gap-1">
            <Check size={12} strokeWidth={2.5} /> Completed{timestamp ? ` at ${timestamp}` : ""}
          </span>
        ) : (
          <span className="text-xs text-[var(--ink-faint)] flex items-center gap-1">
            <Clock size={12} /> Pending daily goal
          </span>
        )}
        <button
          onClick={onToggle}
          className={`text-xs font-semibold px-3.5 py-2 rounded-full transition-colors ${
            done
              ? "bg-transparent text-[var(--ink-faint)] underline underline-offset-2"
              : "bg-[var(--green)] text-[#f6f2e9]"
          }`}
        >
          {done ? "Undo" : "Mark as Complete"}
        </button>
      </div>
    </div>
  );
}
