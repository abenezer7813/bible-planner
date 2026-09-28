export default function ProgressBar({
  value,
  max,
  color = "var(--green)",
  track = "var(--beige)",
  height = 8,
}: {
  value: number;
  max: number;
  color?: string;
  track?: string;
  height?: number;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ background: track, height }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}
