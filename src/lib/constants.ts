export const HEADLINE_MAX = 24;
export const SUMMARY_MAX = 38;
export const SUMMARY_MIN = 18;
export const SOURCE_MAX = 40;
export const BRAND_MAX = 16;

export const CATEGORY_OPTIONS = [
  {
    value: "US_MARKET",
    label: "미국증시",
    aliases: ["Markets", "Equities", "US Market", "US Markets", "미국 증시", "미국시장"],
  },
  {
    value: "FUTURES",
    label: "채권",
    aliases: ["Futures", "Fixed Income", "Bond", "채권시장"],
  },
  {
    value: "COMMODITIES",
    label: "원자재",
    aliases: ["Commodities", "Commodity", "원자재시장"],
  },
  {
    value: "FX",
    label: "환율",
    aliases: ["Foreign Exchange", "FX Market", "외환"],
  },
  {
    value: "TECH",
    label: "테크",
    aliases: ["Technology", "Earnings", "기술주"],
  },
  {
    value: "MACRO",
    label: "매크로",
    aliases: ["Macro", "거시경제"],
  },
  {
    value: "OTHER",
    label: "기타",
    aliases: ["Other", "Crypto"],
  },
] as const;

export type CategoryCode = (typeof CATEGORY_OPTIONS)[number]["value"];
export const DEFAULT_CATEGORY_CODE: CategoryCode = "US_MARKET";

export const HEADER_TITLE_OPTIONS = [
  {
    value: "REAL_ESTATE_ISSUES",
    label: "부동산 이슈 한눈에",
    aliases: ["부동산 이슈", "부동산"],
  },
  {
    value: "WALL_ST_ISSUES",
    label: "월가 이슈를 한눈에",
    aliases: ["월스트리트 이슈 한판승부", "월스트리트 이슈", "월스트리트"],
  },
] as const;

export type HeaderTitleCode = (typeof HEADER_TITLE_OPTIONS)[number]["value"];

export const HEADER_LABEL_OPTIONS = [
  { value: "REAL_ESTATE_PICK", label: "부동산 PICK", aliases: ["부동산픽"] },
  { value: "WALL_ST", label: "WALL ST", aliases: ["WALLST"] },
] as const;

export type HeaderLabelCode = (typeof HEADER_LABEL_OPTIONS)[number]["value"];

const normalizeOptionToken = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

const toAliasMap = <T extends string>(
  options: ReadonlyArray<{ value: T; label: string; aliases?: readonly string[] }>,
) =>
  options.reduce<Record<string, T>>((acc, option) => {
    acc[normalizeOptionToken(option.value)] = option.value;
    acc[normalizeOptionToken(option.label)] = option.value;
    option.aliases?.forEach((alias) => {
      acc[normalizeOptionToken(alias)] = option.value;
    });
    return acc;
  }, {});

const CATEGORY_ALIAS_TO_CODE = toAliasMap(CATEGORY_OPTIONS);
const HEADER_TITLE_ALIAS_TO_CODE = toAliasMap(HEADER_TITLE_OPTIONS);
const HEADER_LABEL_ALIAS_TO_CODE = toAliasMap(HEADER_LABEL_OPTIONS);

export const CATEGORY_LABELS = CATEGORY_OPTIONS.reduce<Record<CategoryCode, string>>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {} as Record<CategoryCode, string>);

export const HEADER_TITLE_LABELS = HEADER_TITLE_OPTIONS.reduce<Record<HeaderTitleCode, string>>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {} as Record<HeaderTitleCode, string>);

export const HEADER_LABEL_TEXT = HEADER_LABEL_OPTIONS.reduce<Record<HeaderLabelCode, string>>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {} as Record<HeaderLabelCode, string>);

const HEADER_LABEL_BY_TITLE: Record<HeaderTitleCode, HeaderLabelCode> = {
  REAL_ESTATE_ISSUES: "REAL_ESTATE_PICK",
  WALL_ST_ISSUES: "WALL_ST",
};

export const CATEGORIES = CATEGORY_OPTIONS.map((option) => option.value) as CategoryCode[];
export const HEADER_TITLES = HEADER_TITLE_OPTIONS.map((option) => option.value) as HeaderTitleCode[];
export const HEADER_LABELS = HEADER_LABEL_OPTIONS.map((option) => option.value) as HeaderLabelCode[];
const CATEGORY_CODE_SET = new Set<string>(CATEGORIES);

export function isCategoryCode(value: string): value is CategoryCode {
  return CATEGORY_CODE_SET.has(value);
}

export function normalizeCategoryValue(input?: string | null): string {
  if (!input) return "OTHER";
  const trimmed = input.trim();
  if (!trimmed) return "OTHER";
  return CATEGORY_ALIAS_TO_CODE[normalizeOptionToken(trimmed)] ?? trimmed;
}

export function getCategoryDisplayLabel(input?: string | null): string {
  const normalizedValue = normalizeCategoryValue(input);
  return isCategoryCode(normalizedValue) ? CATEGORY_LABELS[normalizedValue] : normalizedValue;
}

export function resolveCategoryCodeExact(input?: string | null): CategoryCode | null {
  if (!input) return null;
  const token = normalizeOptionToken(input);
  const matched = CATEGORY_OPTIONS.find((option) =>
    normalizeOptionToken(option.value) === token || normalizeOptionToken(option.label) === token,
  );
  return matched?.value ?? null;
}

export function getCategoryDisplayLabelExact(input?: string | null): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (!trimmed) return "";
  const code = resolveCategoryCodeExact(trimmed);
  return code ? CATEGORY_LABELS[code] : trimmed;
}

export function normalizeCategory(input?: string | null): CategoryCode {
  const normalizedValue = normalizeCategoryValue(input);
  return isCategoryCode(normalizedValue) ? normalizedValue : "OTHER";
}

export function getCategoryLabel(input?: string | null): string {
  return CATEGORY_LABELS[normalizeCategory(input)];
}

export function normalizeHeaderTitle(input?: string | null): HeaderTitleCode {
  if (!input) return "REAL_ESTATE_ISSUES";
  return HEADER_TITLE_ALIAS_TO_CODE[normalizeOptionToken(input)] ?? "REAL_ESTATE_ISSUES";
}

export function getHeaderTitleLabel(input?: string | null): string {
  return HEADER_TITLE_LABELS[normalizeHeaderTitle(input)];
}

export function getHeaderLabelCodeByTitle(input?: string | null): HeaderLabelCode {
  return HEADER_LABEL_BY_TITLE[normalizeHeaderTitle(input)];
}

export function normalizeHeaderLabel(input?: string | null): HeaderLabelCode {
  if (!input) return "REAL_ESTATE_PICK";
  return HEADER_LABEL_ALIAS_TO_CODE[normalizeOptionToken(input)] ?? "REAL_ESTATE_PICK";
}

export function getHeaderLabelText(input?: string | null): string {
  return HEADER_LABEL_TEXT[normalizeHeaderLabel(input)];
}

export const TEMPLATES = [
  {
    id: "finance-premium-01",
    name: "Finance Premium 01",
    description: "금융 카드뉴스 1장 템플릿",
  },
] as const;

export type ReportStatus = "draft" | "analyzing" | "review_required" | "ready" | "exporting" | "completed" | "failed";

export const STATUS_LABEL: Record<ReportStatus, string> = {
  draft: "초안",
  analyzing: "AI 분석 중",
  review_required: "검토 필요",
  ready: "준비 완료",
  exporting: "내보내기 중",
  completed: "완료",
  failed: "실패",
};
