import { memo } from "react";
import { AlertTriangle, PanelRightOpen } from "lucide-react";
import { StatusChip } from "@/components/StatusChip";
import { PreviewCanvas, SlideData } from "@/components/PreviewCanvas";
import { Button } from "@/components/ui/button";
import { ReportStatus } from "@/lib/constants";

interface EditorPreviewPanelProps {
  isTabletWarning: boolean;
  isDrawerMode: boolean;
  templateName: string;
  status: ReportStatus;
  zoom: "fit" | "100";
  onZoomFit: () => void;
  onOpenRightPanel: () => void;
  slide: SlideData;
  showGuides: boolean;
  showOriginal: boolean;
}

export const EditorPreviewPanel = memo(function EditorPreviewPanel({
  isTabletWarning,
  isDrawerMode,
  templateName,
  status,
  zoom,
  onZoomFit,
  onOpenRightPanel,
  slide,
  showGuides,
  showOriginal,
}: EditorPreviewPanelProps) {
  return (
    <section className="flex min-h-0 flex-col bg-surface">
      {(isTabletWarning || isDrawerMode) && (
        <div className="px-4 py-3 border-b border-border bg-warning/10 text-warning">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="text-body">
              {isTabletWarning
                ? "현재 해상도(1023px 이하)에서는 편집이 제한됩니다. 1024px 이상에서 작업해 주세요."
                : "현재 해상도에서는 오른쪽 설정 패널이 서랍 모드로 표시됩니다."}
            </p>
          </div>
        </div>
      )}

      <div className="border-b border-border bg-surface px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">미리보기 패널</p>
            <div className="flex items-center gap-2">
              <span className="truncate text-body font-bold">{templateName}</span>
              <StatusChip status={status} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant={zoom === "fit" ? "default" : "outline"} onClick={onZoomFit}>맞춤</Button>
            {isDrawerMode && (
              <Button size="sm" variant="outline" onClick={onOpenRightPanel}>
                <PanelRightOpen className="w-4 h-4" /> 설정 패널
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <PreviewCanvas data={slide} zoom={zoom} showGuides={showGuides} showOriginal={showOriginal} />
      </div>
    </section>
  );
});
