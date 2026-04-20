import { cn } from "@/lib/utils";
import { getConfidenceMeta } from "@/lib/confidence";

export function ConfidenceBadge({ value, className }: { value: number; className?: string }) {
  const pct = Math.round(value * 100);
  const { label, tone } = getConfidenceMeta(value);
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 h-5 rounded-pill text-[11px] font-medium num", tone, className)}>
      <span>{label}</span>
      <span>{pct}%</span>
    </span>
  );
}
