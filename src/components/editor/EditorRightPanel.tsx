import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { EditorActionButtons } from "@/components/editor/EditorActionButtons";

type PanelMode = "aside" | "drawer";

interface TemplateOption {
  id: string;
  name: string;
}

interface OptionItem {
  value: string;
  label: string;
}

interface HeaderTitleOption {
  value: string;
  label: string;
}

interface RightPanelRow {
  template_id: string;
  header_title: string | null;
  top_bar_color: string | null;
  headline: string | null;
  summary_lines: string[] | null;
  source: string | null;
}

interface EditorRightPanelProps {
  mode: PanelMode;
  row: RightPanelRow;
  isEditLocked: boolean;
  autoSlideDateLabel: string;
  categorySelectValue: string;
  categoryOptions: OptionItem[];
  categoryItems: OptionItem[];
  headerTitleOptions: HeaderTitleOption[];
  templates: TemplateOption[];
  newCategoryInput: string;
  headlineLen: number;
  headlineOver: boolean;
  summaryOver: boolean;
  sourceLen: number;
  sourceOver: boolean;
  headlineMax: number;
  summaryMax: number;
  sourceMax: number;
  defaultTopBarColor: string;
  exportDisabled: boolean;
  imageDownloadDisabled: boolean;
  onUpdateTemplate: (value: string) => void;
  onUpdateHeaderTitle: (value: string) => void;
  onUpdateTopBarColor: (value: string) => void;
  onUpdateCategory: (value: string) => void;
  onNewCategoryInputChange: (value: string) => void;
  onAddCustomCategory: () => void;
  onRemoveCategory: (value: string) => void;
  onHeadlineChange: (value: string) => void;
  onSummaryChange: (value: string) => void;
  onSourceChange: (value: string) => void;
  onSave: () => void;
  onImageDownload: () => void;
  onExport: () => void;
  normalizeHeaderTitle: (value: string | null | undefined) => string;
  normalizeBarColor: (value: unknown, fallback: string) => string;
}

export const EditorRightPanel = memo(function EditorRightPanel({
  mode,
  row,
  isEditLocked,
  autoSlideDateLabel,
  categorySelectValue,
  categoryOptions,
  categoryItems,
  headerTitleOptions,
  templates,
  newCategoryInput,
  headlineLen,
  headlineOver,
  summaryOver,
  sourceLen,
  sourceOver,
  headlineMax,
  summaryMax,
  sourceMax,
  defaultTopBarColor,
  exportDisabled,
  imageDownloadDisabled,
  onUpdateTemplate,
  onUpdateHeaderTitle,
  onUpdateTopBarColor,
  onUpdateCategory,
  onNewCategoryInputChange,
  onAddCustomCategory,
  onRemoveCategory,
  onHeadlineChange,
  onSummaryChange,
  onSourceChange,
  onSave,
  onImageDownload,
  onExport,
  normalizeHeaderTitle,
  normalizeBarColor,
}: EditorRightPanelProps) {
  const summaryLines = [0, 1, 2].map((index) => String(row.summary_lines?.[index] ?? ""));
  const summaryValue = summaryLines.join("\n").replace(/\n+$/, "");
  const summaryLineLengths = summaryLines.map((line) => line.length);

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className={cn("border-b border-border bg-surface/95 px-4 py-3", mode === "drawer" && "sticky top-0 z-10")}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">설정 패널</p>
        <h2 className="text-body font-bold">출력 설정</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <section className="rounded-md border border-border p-3 space-y-3">
          <div className="space-y-2">
            <Label>템플릿</Label>
            <Select value={row.template_id} onValueChange={onUpdateTemplate} disabled={isEditLocked}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={mode === "aside" ? "date-aside" : "date-drawer"}>슬라이드 날짜</Label>
            <Input id={mode === "aside" ? "date-aside" : "date-drawer"} value={autoSlideDateLabel} readOnly disabled />
            <p className="text-caption text-muted-foreground">PPTX 생성 시점의 KST 날짜가 자동 반영됩니다.</p>
          </div>
        </section>

        <section className="rounded-md border border-border p-3 space-y-3">
          <div className="space-y-2">
            <Label>헤더 타이틀</Label>
            <Select
              value={normalizeHeaderTitle(row.header_title)}
              onValueChange={onUpdateHeaderTitle}
              disabled={isEditLocked}
            >
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {headerTitleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>상단/하단 바 색상</Label>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={normalizeBarColor(row.top_bar_color, defaultTopBarColor)}
                  onChange={(event) => onUpdateTopBarColor(event.target.value)}
                  disabled={isEditLocked}
                  aria-label="Top and bottom bar color"
                  className="h-10 w-14 p-1"
                />
                <Input value={normalizeBarColor(row.top_bar_color, defaultTopBarColor)} readOnly className="h-10 font-mono text-[12px]" />
              </div>
            </div>
            <p className="text-caption text-muted-foreground">상단/하단 바 색상은 항상 동일하게 적용됩니다.</p>
          </div>
          <div className="space-y-2">
            <Label>카테고리</Label>
            <Select value={categorySelectValue} onValueChange={onUpdateCategory} disabled={isEditLocked}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input
                value={newCategoryInput}
                onChange={(event) => onNewCategoryInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    onAddCustomCategory();
                  }
                }}
                placeholder="직접 입력으로 항목 추가"
                disabled={isEditLocked}
              />
              <Button type="button" variant="outline" className="h-10 shrink-0" onClick={onAddCustomCategory} disabled={isEditLocked}>
                추가
              </Button>
            </div>
            <div className="space-y-1">
              <p className="text-caption text-muted-foreground">카테고리 항목</p>
              {categoryItems.map((option) => (
                <div key={`category-${option.value}`} className="flex items-center justify-between rounded-md border border-border bg-surface-muted px-3 py-2">
                  <span className="text-body truncate">{option.label}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-muted-foreground hover:text-critical"
                    onClick={() => onRemoveCategory(option.value)}
                    disabled={isEditLocked}
                  >
                    삭제
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-md border border-border p-3 space-y-3">
          <div className="space-y-2">
            <Label htmlFor={mode === "aside" ? "head-aside" : "head-drawer"}>헤드라인</Label>
            <Textarea
              id={mode === "aside" ? "head-aside" : "head-drawer"}
              rows={2}
              value={row.headline || ""}
              onChange={(event) => onHeadlineChange(event.target.value)}
              placeholder="핵심 메시지를 입력"
              disabled={isEditLocked}
              className={cn("resize-none", headlineOver && "border-critical")}
            />
            <div className={cn("text-caption text-right num", headlineOver ? "text-critical" : "text-muted-foreground")}>
              {headlineLen}/{headlineMax}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={mode === "aside" ? "summary-aside" : "summary-drawer"}>핵심요약</Label>
            <Textarea
              id={mode === "aside" ? "summary-aside" : "summary-drawer"}
              rows={3}
              value={summaryValue}
              onChange={(event) => onSummaryChange(event.target.value)}
              placeholder="줄바꿈으로 3줄 요약을 입력"
              disabled={isEditLocked}
              className={cn("resize-none", summaryOver && "border-critical")}
            />
            <div className={cn("text-caption text-right num", summaryOver ? "text-critical" : "text-muted-foreground")}>
              1행 {summaryLineLengths[0]}/{summaryMax} · 2행 {summaryLineLengths[1]}/{summaryMax} · 3행 {summaryLineLengths[2]}/{summaryMax}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={mode === "aside" ? "src-aside" : "src-drawer"}>SOURCE</Label>
            <Input
              id={mode === "aside" ? "src-aside" : "src-drawer"}
              value={row.source || ""}
              maxLength={sourceMax}
              onChange={(event) => onSourceChange(event.target.value)}
              placeholder="예: Bloomberg, 연합뉴스"
              disabled={isEditLocked}
              className={cn(sourceOver && "border-critical")}
            />
            <div className={cn("text-caption text-right num", sourceOver ? "text-critical" : "text-muted-foreground")}>
              {sourceLen}/{sourceMax}
            </div>
          </div>
        </section>
      </div>

      <div className={cn("border-t border-border bg-surface px-4 py-3", mode === "aside" && "sticky bottom-0 z-10 shadow-[0_-8px_20px_hsl(0_0%_0%/0.04)]")}>
        <div className="grid grid-cols-3 gap-2">
          <EditorActionButtons
            size="default"
            onSave={onSave}
            onImageDownload={onImageDownload}
            onExport={onExport}
            exportDisabled={exportDisabled}
            imageDownloadDisabled={imageDownloadDisabled}
          />
        </div>
      </div>
    </div>
  );
});
