import { memo } from "react";
import { RefreshCw } from "lucide-react";
import { Dropzone } from "@/components/Dropzone";
import { StatusChip } from "@/components/StatusChip";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCategoryDisplayLabelExact, ReportStatus } from "@/lib/constants";
import { AnalysisVariant, LOW_CONFIDENCE_THRESHOLD, ReviewDecision } from "@/lib/reportRules";

interface AnalysisFieldValue {
  value?: unknown;
  confidence?: number;
}

interface EditorLeftPanelProps {
  rowStatus: ReportStatus;
  chartImageUrl: string | null;
  analyzing: boolean;
  isEditLocked: boolean;
  pendingLowConfidenceFieldKeys: string[];
  analysisVariants: AnalysisVariant[];
  selectedVariantIndex: number | null;
  isCustomVariantSelection: boolean;
  analysisFields: Record<string, AnalysisFieldValue>;
  pendingLowConfidenceSet: Set<string>;
  reviewedFieldMap: Record<string, ReviewDecision>;
  reviewFields: readonly string[];
  reviewFieldLabels: Record<string, string>;
  onChartUpload: (file: File) => void | Promise<void>;
  onChartRemove: () => void | Promise<void>;
  onRegenerateSummary: () => void | Promise<void>;
  onApplyVariant: (index: number) => void;
  onReviewLowConfidenceField: (fieldKey: string, decision: ReviewDecision) => void;
}

export const EditorLeftPanel = memo(function EditorLeftPanel({
  rowStatus,
  chartImageUrl,
  analyzing,
  isEditLocked,
  pendingLowConfidenceFieldKeys,
  analysisVariants,
  selectedVariantIndex,
  isCustomVariantSelection,
  analysisFields,
  pendingLowConfidenceSet,
  reviewedFieldMap,
  reviewFields,
  reviewFieldLabels,
  onChartUpload,
  onChartRemove,
  onRegenerateSummary,
  onApplyVariant,
  onReviewLowConfidenceField,
}: EditorLeftPanelProps) {
  return (
    <aside className="flex min-h-0 flex-col border-r border-border bg-surface/95">
      <div className="border-b border-border px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">입력 패널</p>
        <h2 className="text-body font-bold">차트 업로드 및 요약 입력</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <section className="rounded-md border border-border p-3 space-y-3">
          <h3 className="text-caption uppercase tracking-wide text-muted-foreground font-bold">1. 차트 업로드</h3>
          <Dropzone
            onFile={onChartUpload}
            onRemove={onChartRemove}
            preview={chartImageUrl}
            disabled={analyzing || isEditLocked}
            className="h-[180px]"
          />
          {isEditLocked && (
            <p className="text-caption text-warning">현재 해상도에서는 업로드와 편집이 제한됩니다.</p>
          )}
        </section>

        <section className="rounded-md border border-border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-body font-bold">분석 상태</h3>
            <StatusChip status={rowStatus} />
          </div>
          {pendingLowConfidenceFieldKeys.length > 0 && (
            <p className="text-caption text-warning">
              저신뢰 {pendingLowConfidenceFieldKeys.length}개 항목 확인이 필요합니다.
            </p>
          )}
        </section>

        <section className="rounded-md border border-border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-body font-bold">AI 헤드라인 (3종)</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { void onRegenerateSummary(); }}
              disabled={!chartImageUrl || analyzing || isEditLocked}
              aria-label="헤드라인 재생성"
            >
              <RefreshCw className="w-3.5 h-3.5" /> 재생성
            </Button>
          </div>
          <div className="space-y-2">
            {analysisVariants.map((variant, index) => {
              const selected = selectedVariantIndex === index;
              return (
                <div
                  key={`variant-${index}`}
                  className={cn(
                    "rounded-md border p-2.5 space-y-2",
                    selected ? "border-brand bg-brand-soft/30" : "border-border",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-caption text-muted-foreground">
                      {selected ? `문안 ${index + 1} 선택됨` : `문안 ${index + 1}`}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      className="h-8"
                      onClick={() => onApplyVariant(index)}
                      disabled={isEditLocked}
                    >
                      적용
                    </Button>
                  </div>
                  <p className="text-body font-semibold leading-snug line-clamp-2">
                    {variant.headline || "헤드라인 초안"}
                  </p>
                </div>
              );
            })}
          </div>
          {isCustomVariantSelection && (
            <p className="text-caption text-muted-foreground">현재 적용안은 직접 편집 상태입니다.</p>
          )}
        </section>

        {Object.keys(analysisFields).length > 0 && (
          <section className="rounded-md border border-border p-3 space-y-2">
            <h3 className="text-body font-bold">AI 추출값 검토</h3>
            <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1">
              {reviewFields.map((key) => {
                const field = analysisFields[key];
                if (!field) return null;
                const confidence = typeof field.confidence === "number" ? field.confidence : 1;
                const isLowConfidence = confidence < LOW_CONFIDENCE_THRESHOLD;
                const needsReview = pendingLowConfidenceSet.has(key);
                const reviewed = isLowConfidence && !needsReview;
                const categoryValue = typeof field.value === "string" ? field.value : "";
                const displayValue = key === "category"
                  ? (getCategoryDisplayLabelExact(categoryValue) || categoryValue)
                  : String(field.value ?? "정보 없음");

                return (
                  <div
                    key={key}
                    className={cn(
                      "rounded-md border p-2.5 space-y-2",
                      isLowConfidence ? (needsReview ? "border-warning bg-warning/5" : "border-success/40 bg-success/5") : "border-border",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-caption text-muted-foreground">{reviewFieldLabels[key] || key}</p>
                        <p className="text-body truncate">{displayValue}</p>
                      </div>
                      <ConfidenceBadge value={confidence} />
                    </div>

                    {isLowConfidence && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant={reviewedFieldMap[key] === "keep" ? "default" : "outline"}
                          size="sm"
                          className="h-9"
                          onClick={() => onReviewLowConfidenceField(key, "keep")}
                          disabled={isEditLocked}
                        >
                          원문 유지
                        </Button>
                        <Button
                          type="button"
                          variant={reviewedFieldMap[key] === "edit" ? "default" : "outline"}
                          size="sm"
                          className="h-9"
                          onClick={() => onReviewLowConfidenceField(key, "edit")}
                          disabled={isEditLocked}
                        >
                          수정 완료
                        </Button>
                        {reviewed && <span className="text-caption text-success">검토 완료</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </aside>
  );
});
