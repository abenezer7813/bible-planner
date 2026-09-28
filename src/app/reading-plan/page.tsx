"use client";

import { useMemo, useState } from "react";
import { useBibleStore, dayStatus } from "@/lib/store";
import {
  DEFAULT_CUSTOM_CHAPTERS,
  PLAN_OPTIONS,
  readingLabel,
  type CustomGoal,
  type PlanId,
} from "@/lib/bible-data";
import ProgressBar from "@/components/progress-bar";
import ConfirmationModal from "@/components/confirmation-modal";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

export default function ReadingPlanPage() {
  const store = useBibleStore();
  const { state } = store;
  const contentKey = [
    state.startDate,
    state.planId,
    state.customGoal,
    state.chaptersPerDay,
  ].join("-");
  return <ReadingPlanContent key={contentKey} store={store} />;
}

function ReadingPlanContent({ store }: { store: ReturnType<typeof useBibleStore> }) {
  const { state, stats, totals, dateForDay, startPlan } = store;
  const totalWeeks = Math.ceil(stats.planLength / 7);
  const currentWeek = Math.min(Math.ceil(stats.today / 7), totalWeeks);
  const [week, setWeek] = useState(currentWeek);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(state.planId);
  const [customGoal, setCustomGoal] = useState<CustomGoal>(state.customGoal);
  const [chaptersPerDay, setChaptersPerDay] = useState(state.chaptersPerDay);
  const [confirmStart, setConfirmStart] = useState(false);

  const days = useMemo(() => {
    const start = (week - 1) * 7 + 1;
    const end = Math.min(start + 6, stats.planLength);
    return stats.plan.slice(start - 1, end);
  }, [week, stats.plan, stats.planLength]);

  const startDate = dateForDay(1);
  const endDate = dateForDay(stats.planLength);
  const activePlan = PLAN_OPTIONS.find((option) => option.id === state.planId) ?? PLAN_OPTIONS[0];
  const hasCustomChanges =
    selectedPlan !== state.planId ||
    customGoal !== state.customGoal ||
    chaptersPerDay !== state.chaptersPerDay;

  function startSelectedPlan() {
    startPlan(
      selectedPlan,
      selectedPlan === "custom" ? customGoal : "chapters",
      selectedPlan === "custom" ? chaptersPerDay || DEFAULT_CUSTOM_CHAPTERS : chaptersPerDay
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl md:text-[28px] font-semibold text-[var(--ink)]">
          Reading Plans
        </h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">
          Choose a pace that works for you. Every plan starts on the day you start it.
        </p>
      </div>

      <section className="card p-5" aria-labelledby="choose-plan-heading">
        <h2 id="choose-plan-heading" className="font-semibold text-[var(--ink)] mb-3">
          Choose a plan
        </h2>
        <div className="grid gap-3">
          {PLAN_OPTIONS.map((option) => (
            <label
              key={option.id}
              className="flex gap-3 rounded-xl border p-3 cursor-pointer"
              style={{
                borderColor: selectedPlan === option.id ? "var(--green)" : "var(--border)",
                background: selectedPlan === option.id ? "var(--green-tint)" : "var(--surface)",
              }}
            >
              <input
                type="radio"
                name="reading-plan"
                value={option.id}
                checked={selectedPlan === option.id}
                onChange={() => setSelectedPlan(option.id)}
                className="mt-1 accent-[var(--green)]"
              />
              <span>
                <span className="block text-sm font-semibold text-[var(--ink)]">{option.name}</span>
                <span className="block text-xs text-[var(--ink-soft)] mt-0.5">{option.description}</span>
              </span>
            </label>
          ))}
        </div>

        {selectedPlan === "custom" && (
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <label className="text-sm text-[var(--ink-soft)]">
              Custom goal
              <select
                value={customGoal}
                onChange={(event) => setCustomGoal(event.target.value as CustomGoal)}
                className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)]"
              >
                <option value="chapters">Chapters per day</option>
                <option value="book-week">One book per week</option>
              </select>
            </label>
            {customGoal === "chapters" && (
              <label className="text-sm text-[var(--ink-soft)]">
                Chapters each day
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={chaptersPerDay}
                  onChange={(event) => setChaptersPerDay(Number(event.target.value))}
                  className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)]"
                />
              </label>
            )}
          </div>
        )}

        <p className="text-xs text-[var(--ink-faint)] mt-4">
          Starting or restarting a plan clears its reading checklist and sets its start date to today.
        </p>
        <button
          onClick={() => setConfirmStart(true)}
          className="mt-3 px-4 py-2.5 rounded-xl bg-[var(--green)] text-[#f6f2e9] text-sm font-semibold"
        >
          {hasCustomChanges ? "Start selected plan" : "Restart current plan"}
        </button>
      </section>

      <div>
        <h2 className="text-xl font-semibold text-[var(--ink)]">{activePlan.name}</h2>
        <p className="text-sm text-[var(--ink-soft)] mt-1">{activePlan.description}</p>
      </div>

      <div className="card p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
          <Summary label="Start date">
            {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </Summary>
          <Summary label="Completion date">
            {endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </Summary>
          <Summary label="Bible progress">{((stats.totalChapters / totals.bible) * 100).toFixed(1)}%</Summary>
          <Summary label="Current day">
            {stats.today > stats.planLength ? "Plan complete" : `Day ${stats.today} / ${stats.planLength}`}
          </Summary>
        </div>
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="font-medium text-[var(--ink)]">
            {stats.totalChapters} / {totals.bible} unique chapters completed
          </span>
        </div>
        <ProgressBar value={stats.totalChapters} max={totals.bible} height={10} />
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <button
            aria-label="Previous week"
            onClick={() => setWeek((value) => Math.max(1, value - 1))}
            disabled={week === 1}
            className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="text-center">
            <div className="font-semibold text-[var(--ink)]">Week {week}</div>
            {week === currentWeek && (
              <div className="text-xs text-[var(--green-dark)]">Current week</div>
            )}
          </div>
          <button
            aria-label="Next week"
            onClick={() => setWeek((value) => Math.min(totalWeeks, value + 1))}
            disabled={week === totalWeeks}
            className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {days.map((reading) => {
            const completion = state.completions[reading.day];
            const status = dayStatus(reading.day, stats.today, completion, reading);
            const isToday = reading.day === stats.today;
            return (
              <div
                key={reading.day}
                className="rounded-2xl p-4 border"
                style={{
                  background: isToday
                    && status !== "completed"
                    && status !== "partial"
                    ? "var(--green-tint)"
                    : status === "completed"
                      ? "var(--surface)"
                      : status === "partial"
                        ? "var(--green-soft)"
                      : "var(--surface-soft)",
                  borderColor: isToday ? "var(--green-soft)" : "var(--border)",
                  opacity: status === "upcoming" ? 0.65 : 1,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-[var(--ink)]">Day {reading.day}</span>
                  {isToday ? (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--green)] text-[#f6f2e9]">
                      Today
                    </span>
                  ) : status === "completed" ? (
                    <span className="text-xs font-medium flex items-center gap-1 text-[var(--green-dark)]">
                      <Check size={13} strokeWidth={2.5} /> Completed
                    </span>
                  ) : status === "partial" ? (
                    <span className="text-xs font-medium text-[var(--amber)]">Partial</span>
                  ) : status === "missed" ? (
                    <span className="text-xs font-medium text-[var(--ink-faint)]">Missed</span>
                  ) : status === "rest" ? (
                    <span className="text-xs font-medium text-[var(--ink-faint)]">Rest day</span>
                  ) : (
                    <span className="text-xs font-medium text-[var(--ink-faint)]">Upcoming</span>
                  )}
                </div>
                {reading.morning.length === 0 && reading.night.length === 0 ? (
                  <p className="text-sm text-[var(--ink-soft)]">Rest day — use this time to catch up.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    {reading.morning.length > 0 && (
                      <ReadingGroup label={state.customGoal === "book-week" && state.planId === "custom" ? "This week" : "New Testament"} value={readingLabel(reading.morning)} />
                    )}
                    {reading.night.length > 0 && (
                      <ReadingGroup
                        label={state.planId === "custom" ? "Reading" : "Old Testament"}
                        value={readingLabel(reading.night)}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmationModal
        open={confirmStart}
        title={hasCustomChanges ? "Start this reading plan?" : "Restart your reading plan?"}
        description="This resets your start date to today and clears every completed reading in your checklist. This can’t be undone."
        confirmLabel={hasCustomChanges ? "Start plan" : "Restart plan"}
        onConfirm={startSelectedPlan}
        onCancel={() => setConfirmStart(false)}
      />
    </div>
  );
}

function Summary({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[var(--ink-faint)] text-xs uppercase tracking-wide mb-1">{label}</div>
      <div className="font-medium text-[var(--ink)]">{children}</div>
    </div>
  );
}

function ReadingGroup({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">{label}</div>
      <div className="text-[var(--ink)] font-medium">{value}</div>
    </div>
  );
}
