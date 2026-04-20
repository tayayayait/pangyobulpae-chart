import { memo } from "react";
import { Download, ImageDown, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EditorActionButtonSize = "default" | "compact";

interface EditorActionButtonsProps {
  size?: EditorActionButtonSize;
  onSave: () => void;
  onExport: () => void;
  onImageDownload: () => void;
  exportDisabled: boolean;
  imageDownloadDisabled?: boolean;
}

export const EditorActionButtons = memo(function EditorActionButtons({
  size = "default",
  onSave,
  onExport,
  onImageDownload,
  exportDisabled,
  imageDownloadDisabled = false,
}: EditorActionButtonsProps) {
  return (
    <>
      <Button
        variant="outline"
        className={cn("w-full", size === "compact" ? "h-11" : "h-12")}
        onClick={onSave}
      >
        <Save className="w-4 h-4" /> 저장
      </Button>
      <Button
        variant="outline"
        className={cn("w-full", size === "compact" ? "h-11" : "h-12")}
        onClick={onImageDownload}
        disabled={imageDownloadDisabled}
      >
        <ImageDown className="w-4 h-4" /> 이미지 다운로드
      </Button>
      <Button
        className={cn("w-full", size === "compact" ? "h-11" : "h-12")}
        onClick={onExport}
        disabled={exportDisabled}
      >
        <Download className="w-4 h-4" /> PPTX 내보내기
      </Button>
    </>
  );
});
