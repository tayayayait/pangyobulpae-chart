import { cn } from "@/lib/utils";
import { ReportStatus, STATUS_LABEL } from "@/lib/constants";
import { CheckCircle2, AlertTriangle, Loader2, FileEdit, Download, XCircle, Eye } from "lucide-react";

const STYLES: Record<ReportStatus, string> = {
  draft: "bg-secondary text-muted-foreground",
  analyzing: "bg-info/10 text-info",
  review_required: "bg-warning/10 text-warning",
  ready: "bg-success/10 text-success",
  exporting: "bg-info/10 text-info",
  completed: "bg-success/10 text-success",
  failed: "bg-critical/10 text-critical",
};

const ICONS: Record<ReportStatus, React.ComponentType<{ className?: string }>> = {
  draft: FileEdit,
  analyzing: Loader2,
  review_required: Eye,
  ready: CheckCircle2,
  exporting: Download,
  completed: CheckCircle2,
  failed: XCircle,
};

export function StatusChip({ status, className }: { status: ReportStatus; className?: string }) {
  const Icon = ICONS[status] ?? AlertTriangle;
  const animate = status === "analyzing" || status === "exporting";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 h-7 rounded-pill text-caption font-medium",
        STYLES[status],
        className,
      )}
    >
      <Icon className={cn("w-3.5 h-3.5", animate && "animate-spin")} />
      {STATUS_LABEL[status]}
    </span>
  );
}
