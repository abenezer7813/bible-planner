"use client";

import { useMemo } from "react";
import { useBibleStore, dayStatus } from "@/lib/store";
import StatCard from "@/components/stat-card";
import ProgressBar from "@/components/progress-bar";
import { BookOpen, CalendarCheck, Flame, Trophy, Award, Lock } from "lucide-react";

const MILESTONES = [
  { label: "7-Day Streak", desc: "Consistent habit established", type: "streak", threshold: 7 },
  { label: "30 Chapters", desc: "First major textual threshold", type: "chapters", threshold: 30 },
  { label: "50 Days Completed", desc: "Disciplined seasonal rhythm", type: "days", threshold: 50 },
  { label: "100 Chapters", desc: "Triple digit achievement", type: "chapters", threshold: 100 },
  { label: "250 Chapters", desc: "In progress — next major milestone", type: "chapters", threshold: 250 },
];

export default function ProgressPage() {
  const { state, stats, totals, dateForDay } = useBibleStore();

  const heatmapDays = useMemo(() => {
    // Days of the current calendar month, mapped to plan-day status.
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // 0=Mon
    const start = dateForDay(1);
    const cells: { day: number | null; status: string }[] = [];
    for (let i = 0; i < firstDow; i++) cells.push({ day: null, status: "" });
    for (let date = 1; date <= daysInMonth; date++) {
      const cellDate = new Date(year, month, date);
      const planDay =
        Math.round((cellDate.getTime() - new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()) / 86400000) + 1;
      if (planDay < 1 || planDay > stats.planLength) {
        cells.push({ day: date, status: "" });
        continue;
      }
      const status = dayStatus(
        planDay,
        stats.today,
        state.completions[planDay],
        stats.plan[planDay - 1]
      );
      cells.push({ day: date, status });
    }
    return cells;
  }, [dateForDay, state.completions, stats.plan, stats.planLength, stats.today]);

  const weeklyBars = useMemo(() => {
    const bars: { label: string; pct: number }[] = [];
    const totalWeeks = Math.ceil(Math.min(stats.today, stats.planLength) / 7);
    const startWeek = Math.max(1, totalWeeks - 5);
    for (let w = startWeek; w <= totalWeeks; w++) {
      const startDay = (w - 1) * 7 + 1;
      const endDay = Math.min(startDay + 6, stats.today - 1, stats.planLength);
      let doneSlots = 0;
      let totalSlots = 0;
      for (let d = startDay; d <= endDay; d++) {
        const c = state.completions[d];
        const reading = stats.plan[d - 1];
        const needsMorning = reading.morning.length > 0;
        const needsNight = reading.night.length > 0;
        totalSlots += Number(needsMorning) + Number(needsNight);
        doneSlots += Number(needsMorning && !!c?.morning) + Number(needsNight && !!c?.night);
      }
      bars.push({
        label: `W${w}`,
        pct: totalSlots > 0 ? Math.round((doneSlots / totalSlots) * 100) : 100,
      });
    }
    return bars;
  }, [state.completions, stats.plan, stats.planLength, stats.today]);

  const avgConsistency = Math.round(
    weeklyBars.reduce((s, b) => s + b.pct, 0) / (weeklyBars.length || 1)
  );

  const monthLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl md:text-[28px] font-semibold text-[var(--ink)]">Your Progress</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">
          See how consistent you&rsquo;ve been with your reading.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={BookOpen} label="Chapters Completed" value={`${stats.totalChapters}`} sub={`out of ${totals.bible}`} />
        <StatCard icon={CalendarCheck} label="Days Completed" value={`${stats.daysFullyCompleted}`} sub={`out of ${stats.planLength} plan days`} />
        <StatCard icon={Flame} label="Current Streak" value={`${stats.currentStreak} days`} />
        <StatCard icon={Trophy} label="Longest Streak" value={`${stats.longestStreak} days`} sub="Personal best" />
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-[var(--ink)]">Overall Completion</span>
          <span className="text-lg font-semibold text-[var(--green)]">
            {((stats.totalChapters / totals.bible) * 100).toFixed(1)}%
          </span>
        </div>
        <p className="text-sm text-[var(--ink-soft)] mb-3">
          {stats.totalChapters} of {totals.bible} chapters completed.
        </p>
        <ProgressBar value={stats.totalChapters} max={totals.bible} height={10} />
        <div className="flex items-center justify-between mt-3 text-xs text-[var(--ink-faint)]">
          <span>Old Testament: {stats.otCompleted} / {totals.ot}</span>
          <span>New Testament: {stats.ntCompleted} / {totals.nt}</span>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-[var(--ink)]">Reading Activity</span>
          <span className="text-xs text-[var(--ink-faint)] px-2.5 py-1 rounded-full bg-[var(--surface-soft)]">
            {monthLabel}
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {heatmapDays.map((c, i) => (
            <div
              key={i}
              className="aspect-square rounded-md flex items-center justify-center text-[10px]"
              style={{
                background:
                  c.status === "completed"
                    ? "var(--reading-complete)"
                    : c.status === "partial"
                    ? "var(--reading-partial)"
                    : c.status === "missed"
                    ? "var(--surface-soft)"
                    : "transparent",
                color:
                  c.status === "partial"
                    ? "#ffffff"
                    : c.status === "completed"
                      ? "var(--ink)"
                      : "var(--ink-faint)",
              }}
            >
              {c.day ?? ""}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-[var(--ink-faint)]">
          <LegendDot color="var(--surface-soft)" label="Missed" />
          <LegendDot color="var(--reading-partial)" label="Partial" />
          <LegendDot color="var(--reading-complete)" label="Completed" />
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-[var(--ink)]">Weekly Consistency</span>
          <span className="text-xs text-[var(--green-dark)] font-medium">{avgConsistency}% avg</span>
        </div>
        <div className="flex items-end justify-between gap-2 h-32">
          {weeklyBars.map((b) => (
            <div key={b.label} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
              <div
                className="w-full rounded-lg"
                style={{ height: `${Math.max(6, b.pct)}%`, background: "var(--green)" }}
              />
              <span className="text-[10px] text-[var(--ink-faint)]">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <span className="font-semibold text-[var(--ink)] block mb-4">Milestones</span>
        <div className="flex flex-col gap-3">
          {MILESTONES.map((m) => {
            const current =
              m.type === "streak"
                ? stats.longestStreak
                : m.type === "chapters"
                ? stats.totalChapters
                : stats.daysFullyCompleted;
            const unlocked = current >= m.threshold;
            return (
              <div key={m.label} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: unlocked ? "var(--green-soft)" : "var(--surface-soft)" }}
                >
                  {unlocked ? (
                    <Award size={17} className="text-[var(--green-dark)]" />
                  ) : (
                    <Lock size={15} className="text-[var(--ink-faint)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--ink)]">{m.label}</div>
                  <div className="text-xs text-[var(--ink-faint)]">{m.desc}</div>
                  {!unlocked && (
                    <div className="mt-1.5">
                      <ProgressBar value={current} max={m.threshold} height={4} />
                    </div>
                  )}
                </div>
                {unlocked && (
                  <span className="text-xs font-medium text-[var(--green-dark)] shrink-0">Unlocked</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: color }} />
      {label}
    </span>
  );
}
