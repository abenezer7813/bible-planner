"use client";

import { useMemo, useState } from "react";
import { useBibleStore, dayStatus } from "@/lib/store";
import { readingLabel } from "@/lib/bible-data";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

export default function CalendarPage() {
  const store = useBibleStore();
  const { state } = store;
  const calendarKey = [
    state.startDate,
    state.planId,
    state.customGoal,
    state.chaptersPerDay,
  ].join("-");
  return <CalendarContent key={calendarKey} store={store} />;
}

function CalendarContent({ store }: { store: ReturnType<typeof useBibleStore> }) {
  const { state, stats, dateForDay } = store;
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<number>(stats.today);

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
    const startDate = dateForDay(1);
    const startDateOnly = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate()
    );
    const out: { date: Date | null; planDay: number | null }[] = [];
    for (let i = 0; i < firstDow; i++) out.push({ date: null, planDay: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const planDay = Math.round((date.getTime() - startDateOnly.getTime()) / 86400000) + 1;
      out.push({ date, planDay: planDay >= 1 && planDay <= stats.planLength ? planDay : null });
    }
    return out;
  }, [cursor, dateForDay, stats.planLength]);

  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const monthStats = useMemo(() => {
    let completed = 0,
      partial = 0,
      missed = 0,
      pastDays = 0;
    for (const c of cells) {
      if (!c.planDay) continue;
      const status = dayStatus(
        c.planDay,
        stats.today,
        state.completions[c.planDay],
        stats.plan[c.planDay - 1]
      );
      if (c.planDay >= stats.today || status === "upcoming" || status === "rest") continue;
      pastDays++;
      if (status === "completed") completed++;
      else if (status === "partial") partial++;
      else missed++;
    }
    const consistency = pastDays > 0 ? Math.round((completed / pastDays) * 100) : 0;
    return { completed, partial, missed, consistency };
  }, [cells, state.completions, stats.today, stats.plan]);

  const selectedReading = stats.plan[selectedDay - 1];
  const selectedCompletion = state.completions[selectedDay];
  const selectedDate = dateForDay(Math.min(selectedDay, stats.planLength));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl md:text-[28px] font-semibold text-[var(--ink)]">
          Reading Calendar
        </h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">Your reading history at a glance.</p>
      </div>

      <div className="grid md:grid-cols-[1.4fr_1fr] gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
              className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-semibold text-[var(--ink)]">{monthLabel}</span>
            <button
              onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
              className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {WEEKDAYS.map((w, i) => (
              <div key={i} className="text-center text-[11px] text-[var(--ink-faint)] font-medium py-1">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((c, i) => {
              if (!c.date) return <div key={i} />;
              const status = c.planDay
                ? dayStatus(
                    c.planDay,
                    stats.today,
                    state.completions[c.planDay],
                    stats.plan[c.planDay - 1]
                  )
                : "";
              const isSelected = c.planDay === selectedDay;
              return (
                <button
                  key={i}
                  disabled={!c.planDay}
                  onClick={() => c.planDay && setSelectedDay(c.planDay)}
                  aria-label={`${c.date.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}: ${status || "outside the plan"}`}
                  title={status || "Outside the plan"}
                  className="aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium relative disabled:opacity-30"
                  style={{
                    background:
                      status === "completed"
                        ? "var(--reading-complete)"
                        : status === "today"
                        ? "var(--green-tint)"
                        : status === "partial"
                        ? "var(--reading-partial)"
                        : "var(--surface-soft)",
                    color:
                      status === "partial"
                        ? "#ffffff"
                        : status === "completed"
                          ? "var(--ink)"
                          : "var(--ink)",
                    outline: isSelected ? "2px solid var(--green)" : undefined,
                    outlineOffset: isSelected ? "1px" : undefined,
                  }}
                >
                  {status === "completed" ? (
                    <Check size={13} strokeWidth={2.5} />
                  ) : status === "partial" ? (
                    <span className="text-[13px] leading-none">◐</span>
                  ) : status === "missed" ? (
                    <span>{c.date.getDate()}</span>
                  ) : (
                    <span>{c.date.getDate()}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-4 text-xs text-[var(--ink-faint)] flex-wrap">
            <span className="inline-flex items-center gap-1.5">
              <Check size={12} className="text-[var(--green-dark)]" /> Fully completed
            </span>
            <span className="inline-flex items-center gap-1.5">◐ Partially completed</span>
            <span className="inline-flex items-center gap-1.5">— Missed</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="card p-5">
            <div className="font-semibold text-[var(--ink)] mb-3">
              {selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </div>
            {selectedReading ? (
              <div className="flex flex-col gap-3">
                {selectedReading.morning.length > 0 && (
                  <ReadingRow
                    label="Morning Reading"
                    testament={state.planId === "custom" ? "Daily goal" : "New Testament"}
                    title={readingLabel(selectedReading.morning)}
                    done={!!selectedCompletion?.morning}
                  />
                )}
                {selectedReading.night.length > 0 && (
                  <ReadingRow
                    label="Night Reading"
                    testament={state.planId === "custom" ? "Daily goal" : "Old Testament"}
                    title={readingLabel(selectedReading.night)}
                    done={!!selectedCompletion?.night}
                  />
                )}
                {selectedReading.morning.length === 0 && selectedReading.night.length === 0 && (
                  <p className="text-sm text-[var(--ink-soft)]">Rest day — use this time to catch up.</p>
                )}
                {selectedReading.morning.length + selectedReading.night.length > 0 && (
                <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
                  <span className="text-xs text-[var(--ink-faint)] uppercase tracking-wide">
                    Daily Progress
                  </span>
                  <span className="text-sm font-semibold text-[var(--ink)]">
                    {(selectedCompletion?.morning && selectedReading.morning.length > 0 ? 1 : 0) +
                      (selectedCompletion?.night && selectedReading.night.length > 0 ? 1 : 0)} /{" "}
                    {Number(selectedReading.morning.length > 0) + Number(selectedReading.night.length > 0)} completed
                  </span>
                </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--ink-faint)]">Outside the plan range.</p>
            )}
          </div>

          <div className="card p-5">
            <div className="font-semibold text-[var(--ink)] mb-3">Monthly Summary</div>
            <div className="flex flex-col gap-2 text-sm">
              <SummaryRow label="Completed days" value={monthStats.completed} />
              <SummaryRow label="Partially completed" value={monthStats.partial} />
              <SummaryRow label="Missed" value={monthStats.missed} />
              <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
                <span className="text-[var(--ink-soft)]">Consistency</span>
                <span className="font-semibold text-[var(--green-dark)]">
                  {monthStats.consistency}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadingRow({
  label,
  testament,
  title,
  done,
}: {
  label: string;
  testament: string;
  title: string;
  done: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">
          {label} · {testament}
        </div>
        <div className="text-sm font-medium text-[var(--ink)]">{title}</div>
      </div>
      {done ? (
        <span className="w-6 h-6 rounded-full bg-[var(--green)] flex items-center justify-center shrink-0">
          <Check size={13} color="#f6f2e9" strokeWidth={2.5} />
        </span>
      ) : (
        <span className="text-xs text-[var(--ink-faint)]">Pending</span>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--ink-soft)]">{label}</span>
      <span className="font-medium text-[var(--ink)]">{value}</span>
    </div>
  );
}
