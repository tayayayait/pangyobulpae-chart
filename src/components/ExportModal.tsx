import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, Loader2, Download, ImageDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ExportStep = "preparing" | "generating" | "uploading" | "done" | "error";

const STEPS: { id: ExportStep; label: string }[] = [
  { id: "preparing", label: "데이터 준비" },
  { id: "generating", label: "PPTX 생성" },
  { id: "uploading", label: "파일 업로드" },
  { id: "done", label: "완료" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  step: ExportStep;
  fileUrl?: string | null;
  error?: string | null;
  onImageDownload?: () => void;
  imageDownloading?: boolean;
}

export function ExportModal({
  open,
  onOpenChange,
  step,
  fileUrl,
  error,
  onImageDownload,
  imageDownloading = false,
}: Props) {
  const idx = STEPS.findIndex((s) => s.id === step);
  const [showSlowNotice, setShowSlowNotice] = useState(false);

  useEffect(() => {
    if (!open || step === "done" || step === "error") {
      setShowSlowNotice(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowSlowNotice(true);
    }, 30_000);
    return () => window.clearTimeout(timer);
  }, [open, step]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle>PPTX 내보내기</DialogTitle>
          <DialogDescription className="sr-only">
            리포트 데이터를 기반으로 PPTX를 생성하고 파일 업로드 상태를 표시합니다.
          </DialogDescription>
        </DialogHeader>
        <ol className="space-y-3 py-4" aria-live="polite">
          {STEPS.map((s, i) => {
            const state =
              step === "error" && i === idx
                ? "error"
                : i < idx || step === "done"
                  ? "done"
                  : i === idx
                    ? "active"
                    : "todo";
            return (
              <li key={s.id} className="flex items-center gap-3">
                <span
                  className={
                    "w-7 h-7 rounded-pill grid place-items-center " +
                    (state === "done"
                      ? "bg-success text-success-foreground"
                      : state === "active"
                        ? "bg-info text-info-foreground"
                        : state === "error"
                          ? "bg-critical text-critical-foreground"
                          : "bg-secondary text-muted-foreground")
                  }
                >
                  {state === "active" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : state === "done" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span className="text-caption num">{i + 1}</span>
                  )}
                </span>
                <span className="text-body">{s.label}</span>
              </li>
            );
          })}
        </ol>
        {step === "done" && (
          <div className="flex flex-wrap justify-end gap-2">
            {fileUrl && (
              <Button asChild className="h-11">
                <a href={fileUrl} download>
                  <Download className="w-4 h-4" /> PPTX 다운로드
                </a>
              </Button>
            )}
            <Button
              type="button"
              variant={fileUrl ? "outline" : "default"}
              className="h-11"
              onClick={onImageDownload}
              disabled={!onImageDownload || imageDownloading}
            >
              {imageDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageDown className="w-4 h-4" />}
              이미지 다운로드
            </Button>
          </div>
        )}
        {showSlowNotice && step !== "done" && step !== "error" && (
          <p className="text-warning text-body">예상보다 오래 걸리고 있습니다. 잠시만 기다려 주세요.</p>
        )}
        {step === "error" && (
          <p className="text-critical text-body">{error || "내보내기에 실패했습니다. 다시 시도해 주세요."}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
