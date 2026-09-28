import type { LucideIcon } from "lucide-react";

export default function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "var(--green)",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-[var(--ink-faint)] uppercase">
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "var(--green-soft)" }}
        >
          <Icon size={15} style={{ color: accent }} strokeWidth={2} />
        </div>
      </div>
      <div>
        <div className="text-2xl font-semibold text-[var(--ink)] leading-none">{value}</div>
        {sub && <div className="text-xs text-[var(--ink-faint)] mt-1.5">{sub}</div>}
      </div>
    </div>
  );
}
