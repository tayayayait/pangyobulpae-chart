import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { SlideData, SLIDE_H, SLIDE_W } from "@/components/PreviewCanvas";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { EditorActionButtons } from "@/components/editor/EditorActionButtons";
import { EditorLeftPanel } from "@/components/editor/EditorLeftPanel";
import { EditorPreviewPanel } from "@/components/editor/EditorPreviewPanel";
import { supabase } from "@/integrations/supabase/client";
import { TablesUpdate } from "@/integrations/supabase/types";
import { FunctionsHttpError } from "@supabase/supabase-js";
import {
  CATEGORY_OPTIONS,
  DEFAULT_CATEGORY_CODE,
  HEADER_TITLE_OPTIONS,
  HEADLINE_MAX,
  ReportStatus,
  SOURCE_MAX,
  SUMMARY_MIN,
  SUMMARY_MAX,
  TEMPLATES,
  getCategoryDisplayLabel,
  getCategoryDisplayLabelExact,
  getHeaderLabelCodeByTitle,
  getHeaderLabelText,
  getHeaderTitleLabel,
  normalizeCategoryValue,
  normalizeHeaderTitle,
} from "@/lib/constants";
import {
  applyAnalysisVariantSelection,
  AnalysisVariant,
  CardCopyPayload,
  getAnalysisSelectedVariantIndex,
  getAnalysisVariants,
  ReportAnalysis,
  ReviewDecision,
  LOW_CONFIDENCE_THRESHOLD,
  getConfirmedReviewMap,
  getPendingLowConfidenceFieldKeys,
  isExportDisabled,
  markAnalysisAsCustomSelection,
  markAnalysisFieldReviewed,
  normalizeReportAnalysis,
} from "@/lib/reportRules";
import { toast } from "@/components/ui/sonner";
import { ArrowLeft } from "lucide-react";
import { formatSlideDateShortFromIso, getCurrentKstDateIso } from "@/lib/date";
import { useViewportWidth } from "@/hooks/useViewportWidth";

const LazyEditorRightPanel = lazy(() =>
  import("@/components/editor/EditorRightPanel").then((module) => ({ default: module.EditorRightPanel })),
);
const LazyExportModal = lazy(() =>
  import("@/components/ExportModal").then((module) => ({ default: module.ExportModal })),
);
type ExportStep = "preparing" | "generating" | "uploading" | "done" | "error";

interface ReportRow {
  id: string;
  user_id: string;
  status: ReportStatus;
  template_id: string;
  brand_name: string | null;
  header_title: string | null;
  header_label: string | null;
  category: string | null;
  headline: string | null;
  summary_lines: string[] | null;
  source: string | null;
  slide_date: string | null;
  chart_image_url: string | null;
  logo_url: string | null;
  export_status: string | null;
  top_bar_color: string | null;
  bottom_bar_color: string | null;
  analysis: ReportAnalysis | null;
}

interface UpdateOptions {
  markDirty?: boolean;
}

const REVIEW_FIELDS = ["headline", "category", "source", "lastValue", "trend"] as const;
const FIXED_BRAND_NAME = "?먭탳遺덊뙣";
const DEFAULT_TOP_BAR_COLOR = "#1A3C34";
const DEFAULT_BOTTOM_BAR_COLOR = "#1A3C34";
const REVIEW_FIELD_LABELS: Record<(typeof REVIEW_FIELDS)[number], string> = {
  headline: "헤드라인",
  category: "카테고리",
  source: "SOURCE",
  lastValue: "최종값",
  trend: "추세",
};

const normalizeBarColor = (value: unknown, fallback: string): string => {
  if (typeof value !== "string") return fallback;
  const match = value.trim().match(/^#([0-9a-fA-F]{6})$/);
  return match ? `#${match[1].toUpperCase()}` : fallback;
};

const CARD_COPY_HEADLINE_MIN_LINES = 2;
const CARD_COPY_HEADLINE_MAX_LINES = 2;
const DEFAULT_CARD_COPY_HEADLINE = ["요약 제목"];
const DEFAULT_CARD_COPY_SUMMARY: [string, string, string] = [
  "차트의 핵심 변화가 나타났습니다.",
  "섹터 방향은 주요 지표와 함께 움직입니다.",
  "자금 흐름과 단기 반응을 추가 확인하세요.",
];

const normalizeCopyText = (value: unknown, max: number): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .trim();

const normalizeSourceText = (value: unknown): string =>
  normalizeCopyText(value, SOURCE_MAX + 32).replace(/^source\s*:\s*/i, "").trim();

const splitHeadlineLines = (value: unknown): string[] => {
  const text = normalizeCopyText(value, HEADLINE_MAX * CARD_COPY_HEADLINE_MAX_LINES);
  if (!text) return [];

  const explicit = text
    .split(/\n+/)
    .map((line) => normalizeCopyText(line, HEADLINE_MAX))
    .filter(Boolean);
  if (explicit.length > 1) return explicit;

  const punctuated = text
    .split(/(?<=[!?竊곻폕])\s+/)
    .map((line) => normalizeCopyText(line, HEADLINE_MAX))
    .filter(Boolean);
  if (punctuated.length > 1) return punctuated;

  if (text.length <= 28) return [text];
  const midpoint = Math.min(28, Math.max(10, Math.floor(text.length / 2)));
  let splitPoint = text.lastIndexOf(" ", midpoint);
  if (splitPoint < 8) splitPoint = midpoint;

  const left = normalizeCopyText(text.slice(0, splitPoint), HEADLINE_MAX);
  const right = normalizeCopyText(text.slice(splitPoint), HEADLINE_MAX);
  return [left, right].filter(Boolean);
};

const totalHeadlineLength = (lines: string[]) => lines.reduce((total, line) => total + line.length, 0);

const ensureHeadlineLines = (value: unknown, fallback?: unknown): string[] => {
  const candidates = Array.isArray(value)
    ? value.flatMap((line) => splitHeadlineLines(line))
    : splitHeadlineLines(value);
  const fallbackLines = Array.isArray(fallback)
    ? fallback.flatMap((line) => splitHeadlineLines(line))
    : splitHeadlineLines(fallback);

  const unique: string[] = [];
  [...candidates, ...fallbackLines, ...DEFAULT_CARD_COPY_HEADLINE].forEach((line) => {
    const normalized = normalizeCopyText(line, HEADLINE_MAX);
    if (!normalized || unique.includes(normalized)) return;
    unique.push(normalized);
  });

  let lines = unique.slice(0, CARD_COPY_HEADLINE_MAX_LINES);
  while (lines.length > 0 && totalHeadlineLength(lines) > HEADLINE_MAX) {
    const longestIndex = lines.reduce((bestIndex, line, index, arr) =>
      line.length > arr[bestIndex].length ? index : bestIndex, 0);
    lines[longestIndex] = lines[longestIndex].slice(0, -1).trimEnd();
    if (!lines[longestIndex]) lines.splice(longestIndex, 1);
  }

  const fallbackQueue = [...fallbackLines, ...DEFAULT_CARD_COPY_HEADLINE].map((line) => normalizeCopyText(line, HEADLINE_MAX)).filter(Boolean);
  while (lines.length < CARD_COPY_HEADLINE_MIN_LINES && fallbackQueue.length > 0) {
    const candidate = fallbackQueue.shift();
    if (!candidate || lines.includes(candidate)) continue;
    lines.push(candidate);
    while (totalHeadlineLength(lines) > HEADLINE_MAX) {
      const longestIndex = lines.reduce((bestIndex, line, index, arr) =>
        line.length > arr[bestIndex].length ? index : bestIndex, 0);
      lines[longestIndex] = lines[longestIndex].slice(0, -1).trimEnd();
      if (!lines[longestIndex]) lines.splice(longestIndex, 1);
    }
  }

  if (lines.length < CARD_COPY_HEADLINE_MIN_LINES) {
    lines = [...DEFAULT_CARD_COPY_HEADLINE];
  }

  return lines.slice(0, CARD_COPY_HEADLINE_MAX_LINES);
};

const toHeadlineText = (lines: string[]): string => {
  let headlineText = lines
    .map((line) => normalizeCopyText(line, HEADLINE_MAX))
    .filter(Boolean)
    .join("\n")
    .trim();

  while (headlineText.replace(/\n/g, "").length > HEADLINE_MAX && headlineText.length > 0) {
    headlineText = headlineText.slice(0, -1).trimEnd();
  }

  return headlineText;
};

const ensureSummaryLines = (
  value: unknown,
  fallback?: unknown,
  options?: { enforceMin?: boolean },
): [string, string, string] => {
  const source = Array.isArray(value) ? value : [];
  const fallbackLines = Array.isArray(fallback) ? fallback : ["", "", ""];
  const enforceMin = options?.enforceMin ?? false;
  const next = [0, 1, 2].map((index) => {
    const candidate = normalizeCopyText(source[index], SUMMARY_MAX);
    const fallbackText = normalizeCopyText(fallbackLines[index], SUMMARY_MAX);
    const selected = candidate || fallbackText;
    if (!selected) return "";
    if (!enforceMin || selected.length >= SUMMARY_MIN) return selected;
    const expanded = normalizeCopyText(`${selected} ${DEFAULT_CARD_COPY_SUMMARY[index]}`, SUMMARY_MAX);
    return expanded.length >= SUMMARY_MIN ? expanded : selected;
  });
  return [next[0], next[1], next[2]];
};

const parseSummaryText = (value: string): [string, string, string] => {
  const lines = value.replace(/\r\n/g, "\n").split("\n");
  const next = [0, 1, 2].map((index) => normalizeCopyText(lines[index], SUMMARY_MAX));
  return [next[0], next[1], next[2]];
};

const extractCardCopyPayload = (
  analysis: ReportAnalysis | null | undefined,
  fallback: { category: string; source: string; headline: unknown; summary: unknown },
): CardCopyPayload => {
  const raw = analysis && typeof analysis === "object" && !Array.isArray(analysis)
    ? (analysis as Record<string, unknown>).card_copy
    : null;
  const cardCopy = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};

  const headlineLines = ensureHeadlineLines(cardCopy.headline, fallback.headline);
  const summaryLines = ensureSummaryLines(cardCopy.summary, fallback.summary, { enforceMin: true });
  const category = normalizeCopyText(cardCopy.category ?? fallback.category, 24) || fallback.category;
  const source = normalizeSourceText(cardCopy.source ?? fallback.source);

  return {
    category,
    headline: headlineLines,
    summary: summaryLines,
    source,
  };
};

const toAnalysis = (value: unknown): ReportAnalysis | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as ReportAnalysis;
};

const normalizeAnalysisWithFallback = (
  analysis: ReportAnalysis | null | undefined,
  fallback: { headline?: unknown; summaryLines?: unknown },
): ReportAnalysis => normalizeReportAnalysis(analysis, fallback);

const ACCESS_TOKEN_MIN_TTL_SECONDS = 60;
const JWT_TOKEN_PATTERN = /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/;

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

  try {
    const decoded = atob(padded);
    const parsed = JSON.parse(decoded);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
};

const sanitizeAccessToken = (value: string | null | undefined): string | null => {
  if (typeof value !== "string") return null;
  const token = value.trim();
  if (!JWT_TOKEN_PATTERN.test(token)) return null;

  const payload = decodeJwtPayload(token);
  const subject = payload?.sub;
  if (typeof subject !== "string" || subject.trim().length === 0) return null;

  return token;
};

const readEdgeFunctionErrorMessage = async (response: Response | undefined): Promise<string | null> => {
  if (!response) return null;

  try {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const payload = await response.clone().json() as Record<string, unknown>;
      const errorMessage = payload.error;
      const message = payload.message;
      const code = payload.code;
      const first =
        (typeof errorMessage === "string" && errorMessage.trim())
        || (typeof message === "string" && message.trim())
        || (typeof code === "string" && code.trim());
      if (first) return first;
    }

    const text = (await response.clone().text()).trim();
    return text || null;
  } catch {
    return null;
  }
};

/**
 * Edge Function ?몄텧 吏곸쟾??access token??寃利앺븯怨??꾩슂 ??媛깆떊?⑸땲??
 * ?몄뀡 媛앹껜 議댁옱留뚯쑝濡쒕뒗 異⑸텇?섏? ?딆쑝誘濡?留뚮즺/臾댄슚 ?좏겙??諛⑹??⑸땲??
 */
const getValidAccessToken = async (
  { forceRefresh = false }: { forceRefresh?: boolean } = {},
): Promise<string | null> => {
  if (!forceRefresh) {
    const now = Math.floor(Date.now() / 1000);
    const { data: { session } } = await supabase.auth.getSession();
    const sessionToken = sanitizeAccessToken(session?.access_token);
    const sessionExpiresAt = session?.expires_at ?? 0;

    if (sessionToken && sessionExpiresAt - now > ACCESS_TOKEN_MIN_TTL_SECONDS) {
      const { error: tokenValidationError } = await supabase.auth.getUser(sessionToken);
      if (!tokenValidationError) return sessionToken;
    }
  }

  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
  const refreshedToken = sanitizeAccessToken(refreshed.session?.access_token);
  if (refreshError || !refreshedToken) {
    toast.error("?몄쬆 ?몄뀡???좏슚?섏? ?딆뒿?덈떎. ?섏씠吏瑜??덈줈怨좎묠??二쇱꽭??");
    return null;
  }

  const { error: refreshedTokenValidationError } = await supabase.auth.getUser(refreshedToken);
  if (refreshedTokenValidationError) {
    toast.error("?몄쬆 ?몄뀡 寃利앹뿉 ?ㅽ뙣?덉뒿?덈떎. ?ㅼ떆 濡쒓렇?명빐 二쇱꽭??");
    return null;
  }

  return refreshedToken;
};

const empty: Partial<ReportRow> = {
  status: "draft",
  template_id: "finance-premium-01",
  brand_name: FIXED_BRAND_NAME,
  logo_url: null,
  header_title: "REAL_ESTATE_ISSUES",
  header_label: "REAL_ESTATE_PICK",
  category: "US_MARKET",
  headline: "",
  summary_lines: ["", "", ""],
  source: "",
  slide_date: getCurrentKstDateIso(),
  export_status: "idle",
  top_bar_color: DEFAULT_TOP_BAR_COLOR,
  bottom_bar_color: DEFAULT_BOTTOM_BAR_COLOR,
};

const FULL_ASIDE_BREAKPOINT = 1320;
const DRAWER_LEFT_COLUMN = "minmax(320px, 1fr)";
const LEFT_PANEL_COLUMN = "minmax(320px, 1fr)";
const CENTER_PANEL_COLUMN = "minmax(640px, 1.9fr)";
const RIGHT_PANEL_COLUMN = "minmax(320px, 1fr)";

const normalizeCustomCategoryToken = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
const DEFAULT_CATEGORY_LABEL = CATEGORY_OPTIONS.find((option) => option.value === DEFAULT_CATEGORY_CODE)?.label || "誘멸뎅利앹떆";
const DEFAULT_CATEGORY_ITEMS = CATEGORY_OPTIONS.map((option) => option.label);

const dedupeCategoryItems = (items: string[]) => {
  const seen = new Set<string>();
  const next: string[] = [];
  items.forEach((item) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    const token = normalizeCustomCategoryToken(trimmed);
    if (seen.has(token)) return;
    seen.add(token);
    next.push(trimmed);
  });
  return next;
};

const EXPECTED_SCHEMA_COLUMNS = ["header_title", "header_label", "top_bar_color", "bottom_bar_color"] as const;
const CHART_IMAGES_BUCKET = "chart-images";
const CHART_SIGNED_URL_PATH_PREFIX = "/storage/v1/object/sign/chart-images/";
const CHART_PUBLIC_URL_PATH_PREFIX = "/storage/v1/object/public/chart-images/";
const EXPORT_SLIDE_SELECTOR = "[data-export-slide-root='true']";
const INVALID_FILE_NAME_CHARACTERS = /[\\/:*?"<>|]+/g;
const MULTIPLE_UNDERSCORES = /_+/g;
const VITE_DEPS_METADATA_PATH = "/node_modules/.vite/deps/_metadata.json";
const VITE_HTML_TO_IMAGE_DEP_PATH = "/node_modules/.vite/deps/html-to-image.js";

const detectReportColumns = (value: unknown): Set<string> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return new Set<string>();
  return new Set(Object.keys(value as Record<string, unknown>));
};

const sanitizeUpdatePayload = (
  patch: Partial<ReportRow>,
  reportColumns: Set<string> | null,
): TablesUpdate<"reports"> => {
  const payload = {
    ...patch,
    updated_at: new Date().toISOString(),
  } as Record<string, unknown>;

  delete payload.id;
  delete payload.user_id;

  if (reportColumns) {
    Object.keys(payload).forEach((key) => {
      if (!reportColumns.has(key)) delete payload[key];
    });
  }

  return payload as TablesUpdate<"reports">;
};

const getMissingExpectedColumns = (reportColumns: Set<string>) =>
  EXPECTED_SCHEMA_COLUMNS.filter((column) => !reportColumns.has(column));

const extractChartImageStoragePath = (chartImageUrl: string): string | null => {
  try {
    const { pathname } = new URL(chartImageUrl);
    const signedPrefixIndex = pathname.indexOf(CHART_SIGNED_URL_PATH_PREFIX);
    if (signedPrefixIndex >= 0) {
      return decodeURIComponent(pathname.slice(signedPrefixIndex + CHART_SIGNED_URL_PATH_PREFIX.length));
    }
    const publicPrefixIndex = pathname.indexOf(CHART_PUBLIC_URL_PATH_PREFIX);
    if (publicPrefixIndex >= 0) {
      return decodeURIComponent(pathname.slice(publicPrefixIndex + CHART_PUBLIC_URL_PATH_PREFIX.length));
    }
    return null;
  } catch {
    return null;
  }
};

const sanitizeFileNameSegment = (value: string | null | undefined): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(INVALID_FILE_NAME_CHARACTERS, "")
    .replace(/\s+/g, "_")
    .replace(MULTIPLE_UNDERSCORES, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 36);

const toDateToken = (value: string | null | undefined): string => {
  const match = String(value ?? "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "nodate";
  return `${match[1]}${match[2]}${match[3]}`;
};

const buildExportImageFileName = ({
  reportId,
  headline,
  slideDateIso,
}: {
  reportId: string | null | undefined;
  headline: string | null | undefined;
  slideDateIso: string | null | undefined;
}): string => {
  const dateToken = toDateToken(slideDateIso);
  const headlineToken = sanitizeFileNameSegment(headline);
  const fallbackToken = sanitizeFileNameSegment(reportId) || "slide";
  return `C2I_${dateToken}_${headlineToken || fallbackToken}.png`;
};

interface HtmlToImageModule {
  toPng: (
    node: HTMLElement,
    options?: {
      cacheBust?: boolean;
      pixelRatio?: number;
      width?: number;
      height?: number;
      canvasWidth?: number;
      canvasHeight?: number;
      style?: Record<string, string>;
    },
  ) => Promise<string>;
}

const loadHtmlToImageModule = async (): Promise<HtmlToImageModule> => {
  try {
    return await import("html-to-image");
  } catch (primaryError) {
    try {
      const metadataResponse = await fetch(`${VITE_DEPS_METADATA_PATH}?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!metadataResponse.ok) throw primaryError;
      const metadata = await metadataResponse.json() as { browserHash?: string };
      if (!metadata.browserHash) throw primaryError;
      return await import(
        /* @vite-ignore */
        `${VITE_HTML_TO_IMAGE_DEP_PATH}?v=${metadata.browserHash}`
      ) as HtmlToImageModule;
    } catch {
      try {
        return await import(
          /* @vite-ignore */
          `${VITE_HTML_TO_IMAGE_DEP_PATH}?t=${Date.now()}`
        ) as HtmlToImageModule;
      } catch {
        throw primaryError;
      }
    }
  }
};

export default function Editor() {
  const { id } = useParams();
  const nav = useNavigate();
  const [row, setRow] = useState<ReportRow | null>(null);
  const [reportColumns, setReportColumns] = useState<Set<string> | null>(null);
  const [zoom, setZoom] = useState<"fit" | "100">("fit");
  const [showGuides, setShowGuides] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [saveState, setSaveState] = useState<"dirty" | "saved" | "saving" | "error" | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportStep, setExportStep] = useState<ExportStep>("preparing");
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [imageExporting, setImageExporting] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const viewportWidth = useViewportWidth();
  const [categoryItems, setCategoryItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("risk_guard_categories");
      if (saved) return JSON.parse(saved) as string[];
    } catch (e) { }
    return DEFAULT_CATEGORY_ITEMS;
  });

  useEffect(() => {
    localStorage.setItem("risk_guard_categories", JSON.stringify(categoryItems));
  }, [categoryItems]);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const saveTimer = useRef<number | null>(null);
  const schemaWarningShown = useRef(false);
  const autoSlideDateIso = getCurrentKstDateIso();
  const autoSlideDateLabel = formatSlideDateShortFromIso(autoSlideDateIso);

  const isDrawerMode = viewportWidth >= 1024 && viewportWidth < FULL_ASIDE_BREAKPOINT;
  const isTabletWarning = viewportWidth < 1024;
  const isEditLocked = viewportWidth < 1024;
  const showLeftPanel = viewportWidth >= 1024;
  const showRightAside = viewportWidth >= FULL_ASIDE_BREAKPOINT;
  const showFloatingActionBar = !showRightAside;
  const gridTemplateColumns = !showLeftPanel
    ? "1fr"
    : isDrawerMode
      ? `${DRAWER_LEFT_COLUMN} ${CENTER_PANEL_COLUMN}`
      : `${LEFT_PANEL_COLUMN} ${CENTER_PANEL_COLUMN} ${RIGHT_PANEL_COLUMN}`;

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase.from("reports").select("*").eq("id", id).maybeSingle();
      if (error) {
        toast.error(error.message);
        return;
      }
      if (!data) {
        toast.error("由ы룷?몃? 李얠쓣 ???놁뒿?덈떎.");
        nav("/reports");
        return;
      }
      const columns = detectReportColumns(data);
      setReportColumns(columns);
      const missingColumns = getMissingExpectedColumns(columns);
      if (missingColumns.length > 0 && !schemaWarningShown.current) {
        schemaWarningShown.current = true;
        toast.error(`Supabase schema mismatch: missing columns (${missingColumns.join(", ")}). Apply latest migrations.`);
      }

      const merged = { ...empty, ...data };
      merged.brand_name = FIXED_BRAND_NAME;
      merged.logo_url = null;
      const normalizedHeaderTitle = normalizeHeaderTitle(typeof merged.header_title === "string" ? merged.header_title : null);
      merged.header_title = normalizedHeaderTitle;
      merged.header_label = getHeaderLabelCodeByTitle(normalizedHeaderTitle);
      const mergedCategory = typeof merged.category === "string" ? merged.category.trim() : "";
      merged.category = getCategoryDisplayLabelExact(mergedCategory) || mergedCategory || DEFAULT_CATEGORY_LABEL;
      merged.summary_lines = ensureSummaryLines(merged.summary_lines);
      merged.source = normalizeSourceText(merged.source);
      const unifiedBarColor = normalizeBarColor(
        typeof merged.top_bar_color === "string" && merged.top_bar_color.trim()
          ? merged.top_bar_color
          : merged.bottom_bar_color,
        DEFAULT_TOP_BAR_COLOR,
      );
      merged.top_bar_color = unifiedBarColor;
      merged.bottom_bar_color = unifiedBarColor;
      const mergedAnalysis = normalizeAnalysisWithFallback(toAnalysis(merged.analysis), {
        headline: merged.headline || "",
        summaryLines: merged.summary_lines,
      });
      const loadedCardCopy = extractCardCopyPayload(mergedAnalysis, {
        category: merged.category || DEFAULT_CATEGORY_LABEL,
        source: merged.source || "",
        headline: splitHeadlineLines(merged.headline || ""),
        summary: merged.summary_lines,
      });
      merged.analysis = {
        ...mergedAnalysis,
        card_copy: loadedCardCopy,
      };
      merged.category = getCategoryDisplayLabelExact(loadedCardCopy.category) || loadedCardCopy.category || merged.category || DEFAULT_CATEGORY_LABEL;
      merged.headline = toHeadlineText(loadedCardCopy.headline);
      merged.summary_lines = ensureSummaryLines(loadedCardCopy.summary);
      merged.source = loadedCardCopy.source;
      setRow(merged as ReportRow);
      // setCategoryItems((current) => dedupeCategoryItems([...current, merged.category as string]));

      const supportsTopBarColor = columns.has("top_bar_color");
      const supportsBottomBarColor = columns.has("bottom_bar_color");
      const needsBarColorSync =
        supportsTopBarColor &&
        supportsBottomBarColor &&
        (data.top_bar_color !== merged.top_bar_color || data.bottom_bar_color !== merged.bottom_bar_color);

      if (data.brand_name !== FIXED_BRAND_NAME || data.logo_url || needsBarColorSync) {
        const patch: Partial<ReportRow> = {
          brand_name: FIXED_BRAND_NAME,
          logo_url: null,
        };
        if (supportsTopBarColor && supportsBottomBarColor) {
          patch.top_bar_color = merged.top_bar_color;
          patch.bottom_bar_color = merged.bottom_bar_color;
        }
        const payload = sanitizeUpdatePayload(patch, columns);
        const { error: fixError } = await supabase.from("reports").update(payload).eq("id", id);
        if (fixError) toast.error(fixError.message);
      }
    })();
  }, [id, nav]);

  const scheduleSave = useCallback((next: Partial<ReportRow>) => {
    if (!id) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      setSaveState("saving");
      const payload = sanitizeUpdatePayload(next, reportColumns);
      if (Object.keys(payload as Record<string, unknown>).length === 0) {
        setSaveState("saved");
        return;
      }
      const { error } = await supabase.from("reports").update(payload).eq("id", id);
      if (error) {
        setSaveState("error");
        toast.error(error.message);
      } else {
        setSaveState("saved");
      }
    }, 800);
  }, [id, reportColumns]);

  const update = useCallback((patch: Partial<ReportRow>, options?: UpdateOptions) => {
    setRow((current) => {
      if (!current) return current;
      const normalizedPatch = { ...patch };
      if (typeof normalizedPatch.header_title === "string") {
        const normalizedHeaderTitle = normalizeHeaderTitle(normalizedPatch.header_title);
        normalizedPatch.header_title = normalizedHeaderTitle;
        normalizedPatch.header_label = getHeaderLabelCodeByTitle(normalizedHeaderTitle);
      } else if (typeof normalizedPatch.header_label === "string") {
        normalizedPatch.header_label = getHeaderLabelCodeByTitle(current.header_title);
      }
      if (typeof normalizedPatch.category === "string") {
        const trimmedCategory = normalizedPatch.category.trim();
        normalizedPatch.category = getCategoryDisplayLabelExact(trimmedCategory) || trimmedCategory || DEFAULT_CATEGORY_LABEL;
      }
      if ("brand_name" in normalizedPatch) {
        normalizedPatch.brand_name = FIXED_BRAND_NAME;
      }
      if ("logo_url" in normalizedPatch) {
        normalizedPatch.logo_url = null;
      }
      if ("top_bar_color" in normalizedPatch || "bottom_bar_color" in normalizedPatch) {
        const sourceColor = "top_bar_color" in normalizedPatch
          ? normalizedPatch.top_bar_color
          : normalizedPatch.bottom_bar_color;
        const unifiedBarColor = normalizeBarColor(
          sourceColor,
          normalizeBarColor(current.top_bar_color, DEFAULT_TOP_BAR_COLOR),
        );
        normalizedPatch.top_bar_color = unifiedBarColor;
        normalizedPatch.bottom_bar_color = unifiedBarColor;
      }
      if (options?.markDirty !== false) setSaveState("dirty");
      const next = { ...current, ...normalizedPatch };
      scheduleSave(normalizedPatch);
      return next;
    });
  }, [scheduleSave]);

  const handleHeadlineManualEdit = useCallback((value: string) => {
    if (!row || isEditLocked) return;
    if ((row.headline || "") === value) return;
    const nextAnalysis = markAnalysisAsCustomSelection(row.analysis, {
      headline: value,
      summaryLines: row.summary_lines || ["", "", ""],
    });
    update({
      headline: value,
      analysis: nextAnalysis,
    });
  }, [isEditLocked, row, update]);

  const handleSummaryManualEdit = useCallback((value: string) => {
    if (!row || isEditLocked) return;
    const nextSummaryLines = parseSummaryText(value);
    const currentSummaryLines = ensureSummaryLines(row.summary_lines);
    const isSame = nextSummaryLines.every((line, index) => line === currentSummaryLines[index]);
    if (isSame) return;
    const nextAnalysis = markAnalysisAsCustomSelection(row.analysis, {
      headline: row.headline || "",
      summaryLines: nextSummaryLines,
    });
    update({
      summary_lines: nextSummaryLines,
      analysis: nextAnalysis,
    });
  }, [isEditLocked, row, update]);

  const applyVariantCandidate = useCallback((index: number) => {
    if (!row || isEditLocked) return;

    let nextAnalysis = applyAnalysisVariantSelection(row.analysis, index, {
      headline: row.headline || "",
      summaryLines: row.summary_lines || ["", "", ""],
    });
    const variants = getAnalysisVariants(nextAnalysis, {
      headline: row.headline || "",
      summaryLines: row.summary_lines || ["", "", ""],
    });
    const selectedVariant = variants[index];
    if (!selectedVariant) return;

    const needsHeadlineReview = getPendingLowConfidenceFieldKeys(row.analysis).includes("headline");
    if (needsHeadlineReview) {
      nextAnalysis = markAnalysisFieldReviewed(nextAnalysis, "headline", "edit");
    }

    const pending = getPendingLowConfidenceFieldKeys(nextAnalysis);
    const variantCardCopy = extractCardCopyPayload(nextAnalysis, {
      category: row.category || DEFAULT_CATEGORY_LABEL,
      source: row.source || "",
      headline: ensureHeadlineLines(selectedVariant.headline, splitHeadlineLines(row.headline || "")),
      summary: selectedVariant.summary,
    });
    update({
      analysis: {
        ...nextAnalysis,
        card_copy: variantCardCopy,
      },
      category: getCategoryDisplayLabelExact(variantCardCopy.category) || variantCardCopy.category,
      headline: toHeadlineText(variantCardCopy.headline),
      summary_lines: ensureSummaryLines(selectedVariant.summary, selectedVariant.summary, { enforceMin: true }),
      source: variantCardCopy.source,
      status: pending.length === 0 && row.status === "review_required" ? "ready" : row.status,
    });
  }, [isEditLocked, row, update]);

  const handleChartUpload = async (file: File) => {
    if (!row) return;
    if (isEditLocked) {
      toast.error("?꾩옱 ?댁긽?꾩뿉?쒕뒗 ?몄쭛???쒗븳?⑸땲?? 1024px ?댁긽?먯꽌 ?ㅼ떆 ?쒕룄??二쇱꽭??");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${row.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(CHART_IMAGES_BUCKET).upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      toast.error(error.message);
      return;
    }

    const { data: signed } = await supabase.storage.from(CHART_IMAGES_BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
    const url = signed?.signedUrl;
    if (!url) return;

    update({ chart_image_url: url, status: "analyzing" });
    await analyze(url);
  };

  const handleChartRemove = useCallback(async () => {
    if (!row) return;
    if (isEditLocked) {
      toast.error("?꾩옱 ?댁긽?꾩뿉?쒕뒗 ?몄쭛???쒗븳?⑸땲?? 1024px ?댁긽?먯꽌 ?ㅼ떆 ?쒕룄??二쇱꽭??");
      return;
    }
    if (!row.chart_image_url) return;

    const storagePath = extractChartImageStoragePath(row.chart_image_url);
    if (storagePath) {
      const { error } = await supabase.storage.from(CHART_IMAGES_BUCKET).remove([storagePath]);
      if (error) {
        toast.warning("?ㅽ넗由ъ? ?뚯씪 ??젣???ㅽ뙣?덉?留??낅줈???대?吏???쒓굅?덉뒿?덈떎.");
      }
    }

    update({
      chart_image_url: null,
      analysis: null,
      category: DEFAULT_CATEGORY_LABEL,
      headline: "",
      summary_lines: ["", "", ""],
      source: "",
      status: "draft",
      export_status: "idle",
    });
    toast.success("?낅줈?쒗븳 李⑦듃瑜??쒓굅?덉뒿?덈떎.");
  }, [isEditLocked, row, update]);

  const analyze = useCallback(async (chartUrl: string) => {
    if (!row) return;
    setAnalyzing(true);
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        update({ status: "failed" });
        return;
      }
      const { data, error } = await supabase.functions.invoke("analyze-chart", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: { reportId: row.id, chartImageUrl: chartUrl },
      });
      if (error) throw error;

      const rawAnalysis = toAnalysis(data?.analysis) || toAnalysis({
        card_copy: data?.card_copy,
        variants: data?.variants,
        summary: data?.summary,
      });
      const fields = (rawAnalysis?.fields || {}) as Record<string, { value?: unknown; confidence?: number }>;
      const confidenceValues = Object.values(fields)
        .map((field) => (typeof field?.confidence === "number" ? field.confidence : 1));
      const minConf = confidenceValues.length ? Math.min(...confidenceValues) : 1;
      const status: ReportStatus = minConf < LOW_CONFIDENCE_THRESHOLD ? "review_required" : "ready";

      const nextCategoryValue = typeof fields.category?.value === "string"
        ? fields.category.value
        : row.category || DEFAULT_CATEGORY_LABEL;
      const normalizedAnalysisCategory = normalizeCategoryValue(nextCategoryValue);
      const analysisCategory =
        getCategoryDisplayLabelExact(nextCategoryValue) ||
        getCategoryDisplayLabel(normalizedAnalysisCategory) ||
        DEFAULT_CATEGORY_LABEL;
      const fallbackHeadline = typeof fields.headline?.value === "string" ? fields.headline.value : row.headline || "";
      const fallbackSummary = ensureSummaryLines(rawAnalysis?.summary ?? row.summary_lines, row.summary_lines, { enforceMin: true });
      const analysis = normalizeAnalysisWithFallback(rawAnalysis, {
        headline: fallbackHeadline,
        summaryLines: fallbackSummary,
      });
      const variants = getAnalysisVariants(analysis, {
        headline: fallbackHeadline,
        summaryLines: fallbackSummary,
      });
      const selectedVariantIndex = getAnalysisSelectedVariantIndex(analysis);
      const selectedVariant = variants[selectedVariantIndex ?? 0] || variants[0];
      const sourceCandidate = normalizeSourceText(
        typeof fields.source?.value === "string" ? fields.source.value : row.source || "",
      );
      const cardCopy = extractCardCopyPayload(analysis, {
        category: analysisCategory,
        source: sourceCandidate,
        headline: ensureHeadlineLines(selectedVariant?.headline || fallbackHeadline, splitHeadlineLines(fallbackHeadline)),
        summary: selectedVariant?.summary || fallbackSummary,
      });

      update({
        analysis: {
          ...analysis,
          card_copy: cardCopy,
        },
        status,
        category: getCategoryDisplayLabelExact(cardCopy.category) || cardCopy.category || analysisCategory,
        headline: toHeadlineText(cardCopy.headline),
        source: cardCopy.source || sourceCandidate,
        summary_lines: ensureSummaryLines(cardCopy.summary, selectedVariant?.summary || fallbackSummary, { enforceMin: true }),
      });
      toast.success(status === "review_required" ? "遺꾩꽍 ?꾨즺. ?쇰? ??ぉ 寃?좉? ?꾩슂?⑸땲??" : "遺꾩꽍???꾨즺?섏뿀?듬땲??");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "遺꾩꽍 ?ㅽ뙣");
      update({ status: "failed" });
    } finally {
      setAnalyzing(false);
    }
  }, [row, update]);

  const regenerateSummary = useCallback(async () => {
    if (!row || isEditLocked) return;
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) return;
      const { data, error } = await supabase.functions.invoke("regenerate-summary", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: { reportId: row.id },
      });
      if (error) throw error;
      const responseAnalysis = toAnalysis(data?.analysis) || toAnalysis({
        variants: data?.variants,
        summary: data?.summary,
        card_copy: data?.card_copy,
      });
      const mergedAnalysis = responseAnalysis
        ? ({ ...(row.analysis || {}), ...responseAnalysis } as ReportAnalysis)
        : row.analysis;
      const fallbackSummary = ensureSummaryLines(data?.summary ?? row.summary_lines, row.summary_lines, { enforceMin: true });
      let nextAnalysis = normalizeAnalysisWithFallback(mergedAnalysis, {
        headline: row.headline || "",
        summaryLines: fallbackSummary,
      });
      nextAnalysis = applyAnalysisVariantSelection(nextAnalysis, 0, {
        headline: row.headline || "",
        summaryLines: fallbackSummary,
      });
      const variants = getAnalysisVariants(nextAnalysis, {
        headline: row.headline || "",
        summaryLines: fallbackSummary,
      });
      const selectedVariant = variants[0];
      const fallbackCardCopy = extractCardCopyPayload(nextAnalysis, {
        category: row.category || DEFAULT_CATEGORY_LABEL,
        source: row.source || "",
        headline: ensureHeadlineLines(selectedVariant?.headline || row.headline || "", splitHeadlineLines(row.headline || "")),
        summary: selectedVariant?.summary || fallbackSummary,
      });
      update({
        analysis: {
          ...nextAnalysis,
          card_copy: fallbackCardCopy,
        },
        category: getCategoryDisplayLabelExact(fallbackCardCopy.category) || fallbackCardCopy.category,
        headline: toHeadlineText(fallbackCardCopy.headline),
        summary_lines: ensureSummaryLines(fallbackCardCopy.summary, selectedVariant?.summary || fallbackSummary, { enforceMin: true }),
        source: fallbackCardCopy.source || row.source || "",
      });
      toast.success("?붿빟???ъ깮?깊뻽?듬땲??");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "?붿빟 ?ъ깮???ㅽ뙣");
    }
  }, [isEditLocked, row, update]);

  const reviewLowConfidenceField = useCallback((fieldKey: string, decision: ReviewDecision) => {
    if (!row || isEditLocked) return;
    const nextAnalysis = markAnalysisFieldReviewed(row.analysis, fieldKey, decision);
    const pending = getPendingLowConfidenceFieldKeys(nextAnalysis);
    update({
      analysis: nextAnalysis,
      status: pending.length === 0 && row.status === "review_required" ? "ready" : row.status,
    });
  }, [isEditLocked, row, update]);

  const handleExport = useCallback(async () => {
    if (!row) return;
    setExportOpen(true);
    setExportStep("preparing");
    setExportUrl(null);
    setExportError(null);
    setImageExporting(false);
    try {
      const ensureAuthenticatedSession = async (): Promise<boolean> => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (!error && user) return true;

        const refreshedToken = await getValidAccessToken({ forceRefresh: true });
        if (!refreshedToken) return false;

        const { data: refreshedData, error: refreshedError } = await supabase.auth.getUser(refreshedToken);
        return !refreshedError && Boolean(refreshedData.user);
      };

      const invokeExport = () => supabase.functions.invoke("export-pptx", {
        body: { reportId: row.id },
      });

      const hasAuthenticatedSession = await ensureAuthenticatedSession();
      if (!hasAuthenticatedSession) {
        setExportStep("error");
        setExportError("?몄쬆 ?몄뀡??留뚮즺?섏뿀?듬땲??");
        return;
      }

      update({ status: "exporting", export_status: "queued" }, { markDirty: false });
      setExportStep("generating");
      update({ export_status: "processing" }, { markDirty: false });
      let result = await invokeExport();
      if (result.error instanceof FunctionsHttpError && result.response?.status === 401) {
        const hasRefreshedSession = await ensureAuthenticatedSession();
        if (!hasRefreshedSession) {
          throw new Error("?몄쬆 ?몄뀡??留뚮즺?섏뿀?듬땲??");
        }
        result = await invokeExport();
      }
      if (result.error) {
        const detail = await readEdgeFunctionErrorMessage(
          result.error instanceof FunctionsHttpError ? result.response : undefined,
        );
        if (detail) throw new Error(detail);
        if (result.error instanceof FunctionsHttpError && result.response?.status === 401) {
          throw new Error("인증이 필요합니다. 다시 로그인해 주세요.");
        }
        throw result.error;
      }
      setExportStep("uploading");
      await new Promise((resolve) => setTimeout(resolve, 250));
      setExportStep("done");
      setExportUrl(result.data.fileUrl);
      update({ status: "completed", export_status: "ready" }, { markDirty: false });
    } catch (e: unknown) {
      setExportStep("error");
      setExportError(e instanceof Error ? e.message : "?대낫?닿린 ?ㅽ뙣");
      update({ status: "failed", export_status: "failed" }, { markDirty: false });
    }
  }, [row, update]);

  const headlineLen = (row?.headline || "").replace(/\n/g, "").length;
  const headlineOver = headlineLen > HEADLINE_MAX;
  const summaryLinesForValidation = ensureSummaryLines(row?.summary_lines);
  const summaryOver = summaryLinesForValidation.some((line) => line.length > SUMMARY_MAX)
    || summaryLinesForValidation.some((line) => line.trim().length > 0 && line.trim().length < SUMMARY_MIN)
    || summaryLinesForValidation.filter((line) => line.trim().length > 0).length < 3;
  const sourceOver = (row?.source || "").length > SOURCE_MAX;

  const pendingLowConfidenceFieldKeys = useMemo(() => getPendingLowConfidenceFieldKeys(row?.analysis), [row?.analysis]);
  const pendingLowConfidenceSet = useMemo(() => new Set(pendingLowConfidenceFieldKeys), [pendingLowConfidenceFieldKeys]);
  const reviewedFieldMap = useMemo(() => getConfirmedReviewMap(row?.analysis), [row?.analysis]);
  const analysisVariants = useMemo(
    () => getAnalysisVariants(row?.analysis, {
      headline: row?.headline || "",
      summaryLines: row?.summary_lines || ["", "", ""],
    }),
    [row?.analysis, row?.headline, row?.summary_lines],
  );
  const selectedVariantIndex = useMemo(
    () => getAnalysisSelectedVariantIndex(row?.analysis),
    [row?.analysis],
  );
  const isCustomVariantSelection = selectedVariantIndex === null;

  const exportDisabled = !row || isExportDisabled({
    status: row.status,
    exportStatus: row.export_status,
    headlineOver,
    summaryOver,
    sourceOver,
    hasChartImage: Boolean(row.chart_image_url),
    analysis: row.analysis,
  });
  const imageDownloadDisabled = !row || !row.chart_image_url || imageExporting;
  const templateName = TEMPLATES.find((template) => template.id === row?.template_id)?.name || "Unknown template";

  const handleSaveClick = useCallback(() => {
    setSaveState("saving");
    scheduleSave({});
  }, [scheduleSave]);

  const slide: SlideData = useMemo(() => {
    const headerTitleCode = normalizeHeaderTitle(row?.header_title);
    const headerLabelCode = getHeaderLabelCodeByTitle(headerTitleCode);

    return {
      brandName: FIXED_BRAND_NAME,
      headerTitle: getHeaderTitleLabel(headerTitleCode),
      headerLabel: getHeaderLabelText(headerLabelCode),
      headerLabelCode,
      category: row?.category ? getCategoryDisplayLabelExact(row.category) : undefined,
      slideDate: autoSlideDateIso,
      logoUrl: null,
      chartImageUrl: row?.chart_image_url,
      headline: row?.headline || "",
      summaryLines: row?.summary_lines || ["", "", ""],
      source: row?.source || "",
      topBarColor: normalizeBarColor(row?.top_bar_color, DEFAULT_TOP_BAR_COLOR),
      bottomBarColor: normalizeBarColor(row?.top_bar_color, DEFAULT_TOP_BAR_COLOR),
    };
  }, [row, autoSlideDateIso]);

  const analysisFields = useMemo(() => {
    const value = row?.analysis?.fields;
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return value as Record<string, { value?: unknown; confidence?: number }>;
  }, [row?.analysis]);

  const categorySelectValue = useMemo(() => {
    const rawValue = typeof row?.category === "string" ? row.category.trim() : "";
    return rawValue || DEFAULT_CATEGORY_LABEL;
  }, [row?.category]);
  const categoryOptions = useMemo(
    () => dedupeCategoryItems([...categoryItems, categorySelectValue]).map((value) => ({ value, label: value })),
    [categoryItems, categorySelectValue],
  );
  const categoryListItems = useMemo(
    () => dedupeCategoryItems(categoryItems).map((value) => ({ value, label: value })),
    [categoryItems],
  );

  const addCustomCategory = useCallback(() => {
    if (!row || isEditLocked) return;
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;

    const token = normalizeCustomCategoryToken(trimmed);
    const alreadyExists = categoryListItems.some((option) => normalizeCustomCategoryToken(option.value) === token);
    if (alreadyExists) {
      toast.error("?대? 異붽???移댄뀒怨좊━?낅땲??");
      return;
    }

    setCategoryItems((current) => dedupeCategoryItems([...current, trimmed]));
    setNewCategoryInput("");
    update({ category: trimmed });
  }, [categoryListItems, isEditLocked, newCategoryInput, row, update]);

  const removeCategory = useCallback((target: string) => {
    if (!row || isEditLocked) return;
    const token = normalizeCustomCategoryToken(target);
    const nextItems = categoryListItems
      .map((option) => option.value)
      .filter((value) => normalizeCustomCategoryToken(value) !== token);
    const sanitizedNextItems = nextItems.length ? dedupeCategoryItems(nextItems) : [DEFAULT_CATEGORY_LABEL];
    setCategoryItems(sanitizedNextItems);

    if (normalizeCustomCategoryToken(categorySelectValue) === token) {
      update({ category: sanitizedNextItems[0] });
    }
  }, [categoryListItems, categorySelectValue, isEditLocked, row, update]);

  const updateTemplate = useCallback((value: string) => update({ template_id: value }), [update]);
  const updateHeaderTitle = useCallback((value: string) => update({ header_title: normalizeHeaderTitle(value) }), [update]);
  const updateTopBarColor = useCallback((value: string) => update({ top_bar_color: value }), [update]);
  const updateCategory = useCallback((value: string) => update({ category: value }), [update]);
  const updateSource = useCallback((value: string) => update({ source: normalizeSourceText(value) }), [update]);
  const handleImageDownload = useCallback(async () => {
    if (!row) return;

    const slideElement = document.querySelector<HTMLElement>(EXPORT_SLIDE_SELECTOR);
    if (!slideElement) {
      toast.error("미리보기 슬라이드를 찾을 수 없습니다.");
      return;
    }

    setImageExporting(true);
    try {
      const { toPng } = await loadHtmlToImageModule();
      const dataUrl = await toPng(slideElement, {
        cacheBust: true,
        pixelRatio: 2,
        width: SLIDE_W,
        height: SLIDE_H,
        canvasWidth: SLIDE_W,
        canvasHeight: SLIDE_H,
        style: {
          transform: "none",
          transformOrigin: "top left",
        },
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = buildExportImageFileName({
        reportId: row.id,
        headline: row.headline,
        slideDateIso: autoSlideDateIso,
      });
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("이미지 다운로드를 시작했습니다.");
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("Outdated Optimize Dep")) {
        toast.error("Vite 의존성 캐시가 오래되었습니다. 페이지 새로고침(Ctrl+F5) 후 다시 시도해 주세요.");
        return;
      }
      toast.error(error instanceof Error ? error.message : "이미지 내보내기에 실패했습니다.");
    } finally {
      setImageExporting(false);
    }
  }, [autoSlideDateIso, row]);

  const openRightPanel = useCallback(() => setRightPanelOpen(true), []);
  const closeExportModal = useCallback((open: boolean) => setExportOpen(open), []);
  const navigateReports = useCallback(() => nav("/reports"), [nav]);
  const rightPanelRow = useMemo(() => ({
    template_id: row?.template_id || "finance-premium-01",
    header_title: row?.header_title || null,
    top_bar_color: row?.top_bar_color || null,
    headline: row?.headline || "",
    summary_lines: row?.summary_lines || ["", "", ""],
    source: row?.source || "",
  }), [row?.header_title, row?.headline, row?.source, row?.summary_lines, row?.template_id, row?.top_bar_color]);

  if (!row) return <div className="min-h-screen grid place-items-center text-muted-foreground">로딩 중...</div>;

  return (
    <AppShell
      saveStatus={saveState}
      rightSlot={
        <Button variant="ghost" size="sm" onClick={navigateReports}>
          <ArrowLeft className="w-4 h-4" /> 리포트 목록
        </Button>
      }
    >
      <div className="mx-auto h-[calc(100vh-72px)] w-full max-w-[2320px] px-3 py-3 xl:px-4">
        <div
          className="grid h-full overflow-hidden rounded-[18px] border border-border/70 bg-surface shadow-token-sm"
          style={{ gridTemplateColumns }}
        >
          {showLeftPanel && (
            <EditorLeftPanel
              rowStatus={row.status}
              chartImageUrl={row.chart_image_url}
              analyzing={analyzing}
              isEditLocked={isEditLocked}
              pendingLowConfidenceFieldKeys={pendingLowConfidenceFieldKeys}
              analysisVariants={analysisVariants as AnalysisVariant[]}
              selectedVariantIndex={selectedVariantIndex}
              isCustomVariantSelection={isCustomVariantSelection}
              analysisFields={analysisFields}
              pendingLowConfidenceSet={pendingLowConfidenceSet}
              reviewedFieldMap={reviewedFieldMap}
              reviewFields={REVIEW_FIELDS}
              reviewFieldLabels={REVIEW_FIELD_LABELS}
              onChartUpload={handleChartUpload}
              onChartRemove={handleChartRemove}
              onRegenerateSummary={regenerateSummary}
              onApplyVariant={applyVariantCandidate}
              onReviewLowConfidenceField={reviewLowConfidenceField}
            />
          )}

          <EditorPreviewPanel
            isTabletWarning={isTabletWarning}
            isDrawerMode={isDrawerMode}
            templateName={templateName}
            status={row.status}
            zoom={zoom}
            onZoomFit={() => setZoom("fit")}
            onOpenRightPanel={openRightPanel}
            slide={slide}
            showGuides={showGuides}
            showOriginal={showOriginal}
          />

          {showRightAside && (
            <aside className="min-h-0 border-l border-border bg-surface/95 overflow-hidden">
              <Suspense fallback={<div className="h-full grid place-items-center text-muted-foreground">로딩 중...</div>}>
                <LazyEditorRightPanel
                  mode="aside"
                  row={rightPanelRow}
                  isEditLocked={isEditLocked}
                  autoSlideDateLabel={autoSlideDateLabel}
                  categorySelectValue={categorySelectValue}
                  categoryOptions={categoryOptions}
                  categoryItems={categoryListItems}
                  headerTitleOptions={HEADER_TITLE_OPTIONS}
                  templates={TEMPLATES}
                  newCategoryInput={newCategoryInput}
                  headlineLen={headlineLen}
                  headlineOver={headlineOver}
                  summaryOver={summaryOver}
                  sourceLen={(row.source || "").length}
                  sourceOver={sourceOver}
                  headlineMax={HEADLINE_MAX}
                  summaryMax={SUMMARY_MAX}
                  sourceMax={SOURCE_MAX}
                  defaultTopBarColor={DEFAULT_TOP_BAR_COLOR}
                  exportDisabled={exportDisabled}
                  imageDownloadDisabled={imageDownloadDisabled}
                  onUpdateTemplate={updateTemplate}
                  onUpdateHeaderTitle={updateHeaderTitle}
                  onUpdateTopBarColor={updateTopBarColor}
                  onUpdateCategory={updateCategory}
                  onNewCategoryInputChange={setNewCategoryInput}
                  onAddCustomCategory={addCustomCategory}
                  onRemoveCategory={removeCategory}
                  onHeadlineChange={handleHeadlineManualEdit}
                  onSummaryChange={handleSummaryManualEdit}
                  onSourceChange={updateSource}
                  onSave={handleSaveClick}
                  onImageDownload={handleImageDownload}
                  onExport={handleExport}
                  normalizeHeaderTitle={normalizeHeaderTitle}
                  normalizeBarColor={normalizeBarColor}
                />
              </Suspense>
            </aside>
          )}
        </div>
      </div>

      {showFloatingActionBar && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-40 w-[min(680px,calc(100vw-1rem))] -translate-x-1/2 px-1">
          <div className="pointer-events-auto rounded-xl border border-border bg-surface/95 p-2 shadow-token-md backdrop-blur">
            <div className="grid grid-cols-3 gap-2">
              <EditorActionButtons
                size="compact"
                onSave={handleSaveClick}
                onImageDownload={handleImageDownload}
                onExport={handleExport}
                exportDisabled={exportDisabled}
                imageDownloadDisabled={imageDownloadDisabled}
              />
            </div>
          </div>
        </div>
      )}

      {isDrawerMode && (
        <Sheet open={rightPanelOpen} onOpenChange={setRightPanelOpen}>
          <SheetContent side="right" className="w-[420px] sm:max-w-[420px] p-0">
            <Suspense fallback={<div className="h-full grid place-items-center text-muted-foreground">로딩 중...</div>}>
              <LazyEditorRightPanel
                mode="drawer"
                row={rightPanelRow}
                isEditLocked={isEditLocked}
                autoSlideDateLabel={autoSlideDateLabel}
                categorySelectValue={categorySelectValue}
                categoryOptions={categoryOptions}
                categoryItems={categoryListItems}
                headerTitleOptions={HEADER_TITLE_OPTIONS}
                templates={TEMPLATES}
                newCategoryInput={newCategoryInput}
                headlineLen={headlineLen}
                headlineOver={headlineOver}
                summaryOver={summaryOver}
                sourceLen={(row.source || "").length}
                sourceOver={sourceOver}
                headlineMax={HEADLINE_MAX}
                summaryMax={SUMMARY_MAX}
                sourceMax={SOURCE_MAX}
                defaultTopBarColor={DEFAULT_TOP_BAR_COLOR}
                exportDisabled={exportDisabled}
                imageDownloadDisabled={imageDownloadDisabled}
                onUpdateTemplate={updateTemplate}
                onUpdateHeaderTitle={updateHeaderTitle}
                onUpdateTopBarColor={updateTopBarColor}
                onUpdateCategory={updateCategory}
                onNewCategoryInputChange={setNewCategoryInput}
                onAddCustomCategory={addCustomCategory}
                onRemoveCategory={removeCategory}
                onHeadlineChange={handleHeadlineManualEdit}
                onSummaryChange={handleSummaryManualEdit}
                onSourceChange={updateSource}
                onSave={handleSaveClick}
                onImageDownload={handleImageDownload}
                onExport={handleExport}
                normalizeHeaderTitle={normalizeHeaderTitle}
                normalizeBarColor={normalizeBarColor}
              />
            </Suspense>
          </SheetContent>
        </Sheet>
      )}

      {exportOpen && (
        <Suspense fallback={null}>
          <LazyExportModal
            open={exportOpen}
            onOpenChange={closeExportModal}
            step={exportStep}
            fileUrl={exportUrl}
            error={exportError}
            onImageDownload={handleImageDownload}
            imageDownloading={imageExporting}
          />
        </Suspense>
      )}
    </AppShell>
  );
}


