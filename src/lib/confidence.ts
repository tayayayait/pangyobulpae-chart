export interface ConfidenceMeta {
  label: string;
  tone: string;
}

export function getConfidenceMeta(value: number): ConfidenceMeta {
  if (value >= 0.85) return { label: "높음", tone: "bg-success/10 text-success" };
  if (value >= 0.75) return { label: "보통", tone: "bg-info/10 text-info" };
  if (value >= 0.55) return { label: "검토 필요", tone: "bg-warning/10 text-warning" };
  return { label: "수정 필요", tone: "bg-critical/10 text-critical" };
}
