import { useCallback, useRef, useState } from "react";
import { UploadCloud, ImageIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";

interface DropzoneProps {
  onFile: (file: File) => void;
  onRemove?: () => void;
  preview?: string | null;
  disabled?: boolean;
  className?: string;
}

const ACCEPT = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/bmp",
  "image/tiff",
];
const MAX_BYTES = 20 * 1024 * 1024;

export function Dropzone({ onFile, onRemove, preview, disabled, className }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  const validate = useCallback(async (file: File): Promise<boolean> => {
    if (!ACCEPT.includes(file.type)) {
      toast.error("지원하지 않는 파일 형식입니다. 이미지 파일을 업로드해 주세요.");
      return false;
    }
    if (file.size > MAX_BYTES) {
      toast.error("파일 크기는 20MB 이하여야 합니다.");
      return false;
    }

    const dim = await new Promise<{ w: number; h: number } | null>((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        resolve({ w: img.naturalWidth, h: img.naturalHeight });
        URL.revokeObjectURL(objectUrl);
      };
      img.onerror = () => {
        resolve(null);
        URL.revokeObjectURL(objectUrl);
      };
      img.src = objectUrl;
    });

    if (!dim) {
      toast.error("이미지를 읽을 수 없습니다.");
      return false;
    }
    if (Math.min(dim.w, dim.h) < 960) {
      toast.warning(`이미지 해상도가 낮아 분석 정확도가 떨어질 수 있습니다. (현재 ${dim.w}x${dim.h}, 권장 최소 960px+)`);
    }
    return true;
  }, []);

  const pick = (file?: File) => {
    if (!file) return;
    validate(file).then((ok) => ok && onFile(file));
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="차트 이미지 업로드"
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && !disabled) inputRef.current?.click();
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(event) => {
        event.preventDefault();
        setHover(false);
        pick(event.dataTransfer.files?.[0]);
      }}
      className={cn(
        "relative h-[220px] rounded-md border-2 border-dashed bg-surface-muted",
        "flex flex-col items-center justify-center gap-2 text-muted-foreground",
        "transition-base cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        hover && "border-brand bg-brand-soft text-brand",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      {preview ? (
        <img
          src={preview}
          alt="업로드한 차트 미리보기"
          className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] object-contain rounded-sm"
        />
      ) : (
        <>
          <UploadCloud className="w-8 h-8" aria-hidden />
          <p className="text-body font-medium">차트 이미지를 드래그하거나 클릭해서 업로드</p>
          <p className="text-caption">JPG, PNG, GIF 등 이미지 형식 | 최대 20MB | 권장 최소 960px+</p>
        </>
      )}

      {preview && (
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded-sm bg-foreground/70 text-background text-caption flex items-center gap-1">
          <ImageIcon className="w-3 h-3" />
          이미지 업로드됨
        </div>
      )}

      {preview && onRemove && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (!disabled) onRemove();
          }}
          onKeyDown={(event) => event.stopPropagation()}
          disabled={disabled}
          className="absolute top-2 right-2 px-2 py-1 rounded-sm bg-foreground/70 text-background text-caption flex items-center gap-1 hover:bg-foreground/90 transition-base disabled:opacity-60"
          aria-label="업로드한 차트 이미지 제거"
        >
          <Trash2 className="w-3 h-3" />
          제거
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT.join(",")}
        className="hidden"
        onChange={(event) => {
          pick(event.target.files?.[0] ?? undefined);
          event.currentTarget.value = "";
        }}
      />
    </div>
  );
}
