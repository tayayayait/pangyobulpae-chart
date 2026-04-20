import { HEADLINE_MAX, ReportStatus, SUMMARY_MAX } from "./constants";
import { Json } from "@/integrations/supabase/types";

export const LOW_CONFIDENCE_THRESHOLD = 0.75;
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const ANALYSIS_VARIANT_COUNT = 3;
export type ReviewDecision = "keep" | "edit";

export interface AnalysisField {
  value: Json;
  confidence: number;
  [key: string]: Json | undefined;
}

export interface AnalysisVariant {
  headline: string;
  summary: [string, string, string];
}

export interface CardCopyPayload {
  category: string;
  headline: string[];
  summary: [string, string, string];
  source: string;
}

export interface ReportAnalysis {
  fields?: Record<string, AnalysisField>;
  summary?: string[];
  variants?: AnalysisVariant[];
  card_copy?: CardCopyPayload;
  selectedVariantIndex?: number | null;
  review?: {
    confirmed?: Record<string, ReviewDecision>;
  };
  [key: string]: Json | undefined;
}

export interface LogoFileLike {
  name: string;
  type: string;
  size: number;
}

const LOGO_ALLOWED_TYPES = new Set(["image/png", "image/svg+xml"]);
const LOGO_ALLOWED_EXTENSIONS = new Set(["png", "svg"]);
const BLOCKED_EXPORT_STATUSES = new Set<ReportStatus>(["analyzing", "failed", "exporting"]);
const BLOCKED_JOB_STATUSES = new Set(["queued", "processing"]);
const SUMMARY_PLACEHOLDER: [string, string, string] = ["", "", ""];

const truncateToMax = (value: unknown, max: number): string => String(value ?? "").trim().slice(0, max);

const normalizeVariantSummary = (value: unknown): [string, string, string] => {
  const base = Array.isArray(value) ? value : [];
  const next = [0, 1, 2].map((index) => truncateToMax(base[index], SUMMARY_MAX));
  return [next[0], next[1], next[2]];
};

const normalizeVariant = (
  value: unknown,
  fallback?: { headline?: unknown; summary?: unknown },
): AnalysisVariant => {
  const record = isRecord(value) ? value : {};
  const headline = truncateToMax(record.headline ?? fallback?.headline ?? "", HEADLINE_MAX);
  const summary = normalizeVariantSummary(record.summary ?? fallback?.summary ?? SUMMARY_PLACEHOLDER);
  return {
    headline,
    summary,
  };
};

const toVariantFallback = (fallback?: { headline?: unknown; summaryLines?: unknown }) => ({
  headline: fallback?.headline ?? "",
  summary: fallback?.summaryLines ?? SUMMARY_PLACEHOLDER,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function getFieldConfidence(value: unknown): number | null {
  if (!isRecord(value)) return null;
  const confidence = value.confidence;
  if (typeof confidence !== "number" || Number.isNaN(confidence)) return null;
  return confidence;
}

export function getAnalysisVariants(
  analysis: ReportAnalysis | null | undefined,
  fallback?: { headline?: unknown; summaryLines?: unknown },
): AnalysisVariant[] {
  const source = Array.isArray(analysis?.variants) ? analysis.variants : [];
  const fallbackVariant = toVariantFallback(fallback);
  const normalized = source
    .slice(0, ANALYSIS_VARIANT_COUNT)
    .map((variant, index) => normalizeVariant(variant, index === 0 ? fallbackVariant : undefined));

  if (normalized.length === 0) {
    normalized.push(normalizeVariant(undefined, fallbackVariant));
  }

  while (normalized.length < ANALYSIS_VARIANT_COUNT) {
    normalized.push(normalizeVariant(undefined));
  }

  return normalized;
}

export function getAnalysisSelectedVariantIndex(
  analysis: ReportAnalysis | null | undefined,
): number | null {
  if (!isRecord(analysis)) return 0;
  const hasSelection = Object.prototype.hasOwnProperty.call(analysis, "selectedVariantIndex");
  if (!hasSelection) return 0;

  const selected = analysis.selectedVariantIndex;
  if (selected === null) return null;
  if (typeof selected === "number" && Number.isInteger(selected) && selected >= 0 && selected < ANALYSIS_VARIANT_COUNT) {
    return selected;
  }
  return 0;
}

export function normalizeReportAnalysis(
  analysis: ReportAnalysis | null | undefined,
  fallback?: { headline?: unknown; summaryLines?: unknown },
): ReportAnalysis {
  const base = isRecord(analysis) ? analysis : {};
  return {
    ...base,
    variants: getAnalysisVariants(analysis, fallback),
    selectedVariantIndex: getAnalysisSelectedVariantIndex(analysis),
  } as ReportAnalysis;
}

export function applyAnalysisVariantSelection(
  analysis: ReportAnalysis | null | undefined,
  index: number,
  fallback?: { headline?: unknown; summaryLines?: unknown },
): ReportAnalysis {
  const normalized = normalizeReportAnalysis(analysis, fallback);
  const boundedIndex = Math.max(0, Math.min(ANALYSIS_VARIANT_COUNT - 1, index));
  return {
    ...normalized,
    selectedVariantIndex: boundedIndex,
  };
}

export function markAnalysisAsCustomSelection(
  analysis: ReportAnalysis | null | undefined,
  fallback?: { headline?: unknown; summaryLines?: unknown },
): ReportAnalysis | null {
  if (!analysis) return null;
  const normalized = normalizeReportAnalysis(analysis, fallback);
  return {
    ...normalized,
    selectedVariantIndex: null,
  };
}

export function validateLogoFile(file: LogoFileLike): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const mime = file.type.toLowerCase();
  const isAllowed = LOGO_ALLOWED_TYPES.has(mime) || LOGO_ALLOWED_EXTENSIONS.has(ext);
  if (!isAllowed) return "로고 파일은 PNG 또는 SVG만 업로드할 수 있습니다.";
  if (file.size > LOGO_MAX_BYTES) return "로고 파일 크기는 2MB 이하여야 합니다.";
  return null;
}

export function getLowConfidenceFieldKeys(
  analysis: ReportAnalysis | null | undefined,
  threshold = LOW_CONFIDENCE_THRESHOLD,
): string[] {
  if (!isRecord(analysis) || !isRecord(analysis.fields)) return [];

  return Object.entries(analysis.fields)
    .filter(([, field]) => {
      const confidence = getFieldConfidence(field);
      return confidence !== null && confidence < threshold;
    })
    .map(([key]) => key);
}

export function getConfirmedReviewMap(
  analysis: ReportAnalysis | null | undefined,
): Record<string, ReviewDecision> {
  if (!isRecord(analysis) || !isRecord(analysis.review) || !isRecord(analysis.review.confirmed)) {
    return {};
  }

  return Object.entries(analysis.review.confirmed).reduce<Record<string, ReviewDecision>>((acc, [key, value]) => {
    if (value === "keep" || value === "edit") acc[key] = value;
    return acc;
  }, {});
}

export function getPendingLowConfidenceFieldKeys(
  analysis: ReportAnalysis | null | undefined,
  threshold = LOW_CONFIDENCE_THRESHOLD,
): string[] {
  const lowConfidence = getLowConfidenceFieldKeys(analysis, threshold);
  const confirmed = getConfirmedReviewMap(analysis);
  return lowConfidence.filter((key) => !confirmed[key]);
}

export function hasPendingLowConfidenceReviews(
  analysis: ReportAnalysis | null | undefined,
  threshold = LOW_CONFIDENCE_THRESHOLD,
): boolean {
  return getPendingLowConfidenceFieldKeys(analysis, threshold).length > 0;
}

export function markAnalysisFieldReviewed(
  analysis: ReportAnalysis | null | undefined,
  fieldKey: string,
  decision: ReviewDecision,
): ReportAnalysis {
  const base = isRecord(analysis) ? analysis : {};
  const review = isRecord(base.review) ? base.review : {};
  const confirmed = isRecord(review.confirmed) ? review.confirmed : {};

  return {
    ...base,
    review: {
      ...review,
      confirmed: {
        ...confirmed,
        [fieldKey]: decision,
      },
    },
  } as ReportAnalysis;
}

export function isExportDisabled(params: {
  status: ReportStatus;
  exportStatus?: string | null;
  headlineOver: boolean;
  summaryOver: boolean;
  sourceOver: boolean;
  hasChartImage: boolean;
  analysis?: ReportAnalysis | null;
}): boolean {
  const { status, exportStatus, headlineOver, summaryOver, sourceOver, hasChartImage, analysis } = params;
  if (!hasChartImage || headlineOver || summaryOver || sourceOver) return true;
  if (BLOCKED_EXPORT_STATUSES.has(status)) return true;
  if (exportStatus && BLOCKED_JOB_STATUSES.has(exportStatus)) return true;
  if (hasPendingLowConfidenceReviews(analysis)) return true;
  return false;
}

