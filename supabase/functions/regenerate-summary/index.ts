import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HEADLINE_TOTAL_MAX = 24;
const SUMMARY_SENTENCE_MAX = 38;
const SUMMARY_SENTENCE_MIN = 18;
const SUMMARY_LINE_COUNT = 3;
const VARIANT_COUNT = 3;
const CARD_COPY_HEADLINE_MIN_LINES = 2;
const CARD_COPY_HEADLINE_MAX_LINES = 2;
const DEFAULT_GOOGLE_OPENAI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";

const DEFAULT_HEADLINE_FALLBACK = ["핵심 변화 포착!", "시장 전환 신호"];
const DEFAULT_SUMMARY_FALLBACK: [string, string, string] = [
  "차트에 핵심 변화가 포착됨",
  "수급 방향이 한쪽으로 기울고 있음",
  "자금 이동과 섹터 반응 확인 필요함",
];
const SUMMARY_MIN_FILLERS = [
  "시장 해석이 필요함.",
  "자금 흐름 확인이 중요함.",
  "향후 변동성 점검 필요함.",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const normalizeWhitespace = (value: unknown): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const truncateToMax = (value: unknown, max: number): string => normalizeWhitespace(value).slice(0, max).trim();

const normalizeSourceText = (value: unknown): string =>
  normalizeWhitespace(value).replace(/^source\s*:\s*/i, "").trim();

const splitHeadlineText = (value: string): string[] => {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return [];

  const explicitLines = normalized
    .split(/\n+/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);
  if (explicitLines.length > 1) return explicitLines;

  const punctuationLines = normalized
    .split(/(?<=[!?！？])\s+/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);
  if (punctuationLines.length > 1) return punctuationLines;

  if (normalized.length <= 28) return [normalized];

  const midpoint = Math.min(28, Math.max(10, Math.floor(normalized.length / 2)));
  let splitPoint = normalized.lastIndexOf(" ", midpoint);
  if (splitPoint < 8) splitPoint = midpoint;

  const left = normalizeWhitespace(normalized.slice(0, splitPoint));
  const right = normalizeWhitespace(normalized.slice(splitPoint));
  return [left, right].filter(Boolean);
};

const totalTextLength = (lines: string[]) => lines.reduce((sum, line) => sum + line.length, 0);

const enforceHeadlineTotal = (lines: string[]): string[] => {
  const next = lines.map((line) => line.slice(0, HEADLINE_TOTAL_MAX).trim()).filter(Boolean);
  while (next.length > 0 && totalTextLength(next) > HEADLINE_TOTAL_MAX) {
    const longestIndex = next.reduce((bestIndex, line, index, arr) =>
      line.length > arr[bestIndex].length ? index : bestIndex, 0);
    next[longestIndex] = next[longestIndex].slice(0, -1).trimEnd();
    if (!next[longestIndex]) next.splice(longestIndex, 1);
  }
  return next;
};

const normalizeHeadlineLines = (value: unknown, fallback?: string[]): string[] => {
  const sourceLines = Array.isArray(value)
    ? value.flatMap((item) => splitHeadlineText(String(item ?? "")))
    : splitHeadlineText(String(value ?? ""));

  const fallbackLines = (fallback && fallback.length > 0 ? fallback : DEFAULT_HEADLINE_FALLBACK)
    .flatMap((line) => splitHeadlineText(line));

  const unique: string[] = [];
  [...sourceLines, ...fallbackLines].forEach((line) => {
    const normalizedLine = normalizeWhitespace(line);
    if (!normalizedLine) return;
    if (unique.includes(normalizedLine)) return;
    unique.push(normalizedLine);
  });

  let lines = enforceHeadlineTotal(unique.slice(0, CARD_COPY_HEADLINE_MAX_LINES));
  if (lines.length === 0) {
    lines = enforceHeadlineTotal([...DEFAULT_HEADLINE_FALLBACK]);
  }

  const fallbackQueue = [...fallbackLines, ...DEFAULT_HEADLINE_FALLBACK].map((line) => normalizeWhitespace(line)).filter(Boolean);
  while (lines.length < CARD_COPY_HEADLINE_MIN_LINES && fallbackQueue.length > 0) {
    const candidate = fallbackQueue.shift();
    if (!candidate || lines.includes(candidate)) continue;
    lines.push(candidate);
    lines = enforceHeadlineTotal(lines);
  }

  if (lines.length < CARD_COPY_HEADLINE_MIN_LINES) {
    lines = enforceHeadlineTotal([...DEFAULT_HEADLINE_FALLBACK]);
  }

  if (lines.length > CARD_COPY_HEADLINE_MAX_LINES) {
    lines = lines.slice(0, CARD_COPY_HEADLINE_MAX_LINES);
  }

  return lines;
};

const normalizeSummarySentence = (value: unknown, index: number, fallback: string): string => {
  let sentence = truncateToMax(value, SUMMARY_SENTENCE_MAX);
  const normalizedFallback = truncateToMax(fallback, SUMMARY_SENTENCE_MAX);

  if (!sentence) sentence = normalizedFallback;
  if (sentence.length < SUMMARY_SENTENCE_MIN) {
    const filler = SUMMARY_MIN_FILLERS[index % SUMMARY_MIN_FILLERS.length];
    sentence = truncateToMax(`${sentence} ${filler}`.trim(), SUMMARY_SENTENCE_MAX);
  }
  if (sentence.length < SUMMARY_SENTENCE_MIN && normalizedFallback.length >= SUMMARY_SENTENCE_MIN) {
    sentence = normalizedFallback;
  }

  return sentence;
};

const normalizeSummary = (value: unknown, fallback?: [string, string, string]): [string, string, string] => {
  const source = Array.isArray(value) ? value : [];
  const baseFallback = fallback ?? DEFAULT_SUMMARY_FALLBACK;
  const lines = Array.from({ length: SUMMARY_LINE_COUNT }, (_, index) =>
    normalizeSummarySentence(source[index], index, baseFallback[index]),
  );
  return [lines[0], lines[1], lines[2]];
};

const normalizeHeadlineText = (value: unknown, fallback = ""): string => {
  const raw = Array.isArray(value)
    ? value.map((item) => normalizeWhitespace(item)).filter(Boolean).join(" ")
    : normalizeWhitespace(value);
  const base = raw || normalizeWhitespace(fallback);
  return base.slice(0, HEADLINE_TOTAL_MAX).trim();
};

const normalizeVariant = (
  value: unknown,
  fallback?: { headline: string; summary: [string, string, string] },
) => {
  const record = isRecord(value) ? value : {};
  return {
    headline: normalizeHeadlineText(record.headline, fallback?.headline ?? ""),
    summary: normalizeSummary(record.summary ?? fallback?.summary ?? ["", "", ""]),
  };
};

const normalizeVariants = (
  value: unknown,
  fallback: { headline: string; summary: [string, string, string] },
) => {
  const source = Array.isArray(value) ? value : [];
  const variants = source.slice(0, VARIANT_COUNT).map((item, index) => normalizeVariant(item, index === 0 ? fallback : undefined));
  if (variants.length === 0) variants.push(normalizeVariant(undefined, fallback));
  while (variants.length < VARIANT_COUNT) variants.push(normalizeVariant(undefined));
  return variants;
};

const normalizeCardCopy = (
  value: unknown,
  fallback: { category: string; headline: string[]; summary: [string, string, string]; source: string },
) => {
  const record = isRecord(value) ? value : {};
  const category = normalizeWhitespace(record.category ?? fallback.category) || fallback.category;
  const headline = normalizeHeadlineLines(record.headline, fallback.headline);
  const summary = normalizeSummary(record.summary, fallback.summary);
  const source = normalizeSourceText(record.source ?? fallback.source);

  return {
    category,
    headline,
    summary,
    source,
  };
};

const resolveAiGatewayConfig = () => {
  const apiKey =
    Deno.env.get("AI_GATEWAY_API_KEY") ||
    Deno.env.get("GEMINI_API_KEY") ||
    Deno.env.get("GOOGLE_API_KEY");
  if (!apiKey) {
    throw new Error("AI gateway API key missing (AI_GATEWAY_API_KEY or GEMINI_API_KEY)");
  }

  const rawBaseUrl =
    Deno.env.get("AI_GATEWAY_BASE_URL") ||
    Deno.env.get("GEMINI_BASE_URL") ||
    DEFAULT_GOOGLE_OPENAI_BASE_URL;
  const baseUrl = trimTrailingSlash(rawBaseUrl);
  if (!baseUrl) {
    throw new Error("AI gateway base URL missing (AI_GATEWAY_BASE_URL)");
  }

  const isGoogleOpenAi = baseUrl.includes("generativelanguage.googleapis.com");
  const endpoint = isGoogleOpenAi ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;
  const model =
    Deno.env.get("AI_GATEWAY_MODEL") ||
    (isGoogleOpenAi ? (Deno.env.get("GEMINI_MODEL") || "gemini-3-flash-preview") : "google/gemini-3-flash-preview");

  return { apiKey, endpoint, model };
};

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
};

const fetchImageAsDataUrl = async (imageUrl: string): Promise<string> => {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`chart image fetch failed (${imageResponse.status})`);
  }

  const contentType = imageResponse.headers.get("content-type") || "image/png";
  const imageBytes = new Uint8Array(await imageResponse.arrayBuffer());
  const base64 = bytesToBase64(imageBytes);
  return `data:${contentType};base64,${base64}`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { reportId } = await req.json();
    if (!reportId) {
      return new Response(JSON.stringify({ error: "reportId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const auth = req.headers.get("Authorization") || "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: report, error } = await supabase
      .from("reports")
      .select("chart_image_url, headline, category, summary_lines, source")
      .eq("id", reportId)
      .maybeSingle();
    if (error || !report?.chart_image_url) throw new Error("Report not found.");

    const aiGateway = resolveAiGatewayConfig();

    const chartImageDataUrl = await fetchImageAsDataUrl(report.chart_image_url);

    const tool = {
      type: "function",
      function: {
        name: "generate_variants",
        parameters: {
          type: "object",
          properties: {
            variants: {
              type: "array",
              minItems: VARIANT_COUNT,
              maxItems: VARIANT_COUNT,
              items: {
                type: "object",
                properties: {
                  headline: { type: "string" },
                  summary: {
                    type: "array",
                    items: { type: "string" },
                    minItems: SUMMARY_LINE_COUNT,
                    maxItems: SUMMARY_LINE_COUNT,
                  },
                },
                required: ["headline", "summary"],
              },
            },
            summary: {
              type: "array",
              items: { type: "string" },
              minItems: SUMMARY_LINE_COUNT,
              maxItems: SUMMARY_LINE_COUNT,
            },
            card_copy: {
              type: "object",
              properties: {
                category: { type: "string" },
                headline: {
                  type: "array",
                  items: { type: "string" },
                  minItems: CARD_COPY_HEADLINE_MIN_LINES,
                  maxItems: CARD_COPY_HEADLINE_MAX_LINES,
                },
                summary: {
                  type: "array",
                  items: { type: "string" },
                  minItems: SUMMARY_LINE_COUNT,
                  maxItems: SUMMARY_LINE_COUNT,
                },
                source: { type: "string" },
              },
              required: ["category", "headline", "summary", "source"],
            },
          },
          required: ["variants", "summary", "card_copy"],
        },
      },
    };

    const resp = await fetch(aiGateway.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${aiGateway.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiGateway.model,
        messages: [
          {
            role: "system",
            content: "You are a senior financial markets analyst writing Korean card-news for the \"판교불패\" brand. Generate 3 variants plus card_copy.\n\nHeadline Rules: exactly 2 lines, each 7~12 chars, total <=24 chars. Use ! or ? ending. Numbers first.\nExamples: [\"8조달러 대기 중!\", \"증시 폭등 시작된다\"]\n\nSummary Rules: exactly 3 lines, each 15~28 chars. Use ~음/~짐/~임 endings (NOT ~다). Numbers/facts first. Compressed short sentences.\nExamples: \"머니마켓 펀드에 8.2조달러 역대급으로 쌓였음\"",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Current headline: ${report.headline ?? ""}\nCurrent category: ${report.category ?? ""}\nCurrent source: ${report.source ?? ""}\nCurrent summary: ${
                  Array.isArray(report.summary_lines) ? report.summary_lines.join(" / ") : ""
                }`,
              },
              { type: "image_url", image_url: { url: chartImageDataUrl } },
            ],
          },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "generate_variants" } },
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Too many requests. Please retry shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "AI usage limit exceeded." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      const detail = await resp.text();
      const briefDetail = detail.slice(0, 600);
      console.error("AI gateway error", resp.status, briefDetail);
      throw new Error(`AI variant generation failed (${resp.status}): ${briefDetail}`);
    }

    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) throw new Error("No tool call returned");

    const parsed = JSON.parse(call.function.arguments);
    const fallbackSummary = normalizeSummary(report.summary_lines);
    const fallbackHeadline = normalizeHeadlineText(report.headline);
    const variants = normalizeVariants(parsed?.variants, {
      headline: fallbackHeadline,
      summary: fallbackSummary,
    });
    const summary = normalizeSummary(parsed?.summary ?? variants[0]?.summary ?? fallbackSummary);

    const cardCopyFallback = {
      category: normalizeWhitespace(report.category) || "미국증시",
      headline: normalizeHeadlineLines(fallbackHeadline, DEFAULT_HEADLINE_FALLBACK),
      summary,
      source: normalizeSourceText(report.source),
    };
    const cardCopy = normalizeCardCopy(parsed?.card_copy, cardCopyFallback);

    const analysis = {
      variants,
      summary,
      card_copy: cardCopy,
      selectedVariantIndex: 0,
    };

    return new Response(JSON.stringify({ analysis, variants, summary, card_copy: cardCopy }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
