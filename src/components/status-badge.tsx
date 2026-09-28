import type { DayStatus } from "@/lib/store";
import { Check } from "lucide-react";

const CONFIG: Record<DayStatus, { label: string; bg: string; fg: string }> = {
  completed: { label: "Completed", bg: "var(--reading-complete)", fg: "var(--ink)" },
  partial: { label: "Partial", bg: "var(--reading-partial)", fg: "#ffffff" },
  missed: { label: "Missed", bg: "var(--surface-soft)", fg: "var(--ink-faint)" },
  today: { label: "Today", bg: "var(--green)", fg: "#f6f2e9" },
  upcoming: { label: "Upcoming", bg: "var(--surface-soft)", fg: "var(--ink-faint)" },
  rest: { label: "Rest day", bg: "var(--surface-soft)", fg: "var(--ink-soft)" },
};

export default function StatusBadge({ status }: { status: DayStatus }) {
  const c = CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
      style={{ background: c.bg, color: c.fg }}
    >
      {status === "completed" && <Check size={12} strokeWidth={2.5} />}
      {c.label}
    </span>
  );
}
