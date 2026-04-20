import { useEffect, useRef, useState } from "react";
import { formatSlideDateShortFromIso, getCurrentKstSlideDateShort } from "@/lib/date";

export interface SlideData {
  brandName?: string;
  headerTitle?: string;
  headerLabelCode?: string;
  headerLabel?: string;
  category?: string;
  slideDate?: string;
  logoUrl?: string | null;
  chartImageUrl?: string | null;
  headline?: string;
  summaryLines?: string[];
  source?: string;
  topBarColor?: string;
  bottomBarColor?: string;
}

interface Props {
  data: SlideData;
  zoom: "fit" | "100";
  showGuides?: boolean;
  showOriginal?: boolean;
}

const W = 1440;
const H = 1800;
const ORIGINAL_PREVIEW_HEIGHT = 180;
const DEFAULT_TOP_BAR_COLOR = "#1A3C34";
const DEFAULT_BOTTOM_BAR_COLOR = "#1A3C34";
// Keep top and bottom bars visually unified with topBarColor.\r\n
const headlineSizeSteps = [132, 116, 102, 90, 78] as const;

const LAYOUT = {
  headerBand: { x: 0, y: 0, w: W, h: 118 },
  chartZone: { x: 24, y: 132, w: 1392, h: 760 },
  categoryTag: { x: 40, y: 934, h: 86 },
  headlineZone: { x: 40, y: 1038, w: 1360, h: 314 },
  summaryBadge: { x: 40, y: 1368, w: 196, h: 70 },
  summaryTextZone: { x: 40, y: 1452, w: 1360, h: 206 },
  footerBand: { x: 0, y: H - 122, w: W, h: 122 },
} as const;

function getHeadlineSize(value: string): number {
  const text = value.replace(/\s+/g, "");
  if (!text) return headlineSizeSteps[0];
  if (text.length <= 14) return headlineSizeSteps[0];
  if (text.length <= 22) return headlineSizeSteps[1];
  if (text.length <= 30) return headlineSizeSteps[2];
  if (text.length <= 38) return headlineSizeSteps[3];
  return headlineSizeSteps[4];
}

function getSummaryFontSize(lines: string[]): number {
  const longest = lines.reduce((max, line) => Math.max(max, line.replace(/\s+/g, "").length), 0);
  const lineCount = Math.max(lines.length, 1);

  if (lineCount >= 3) {
    if (longest <= 18) return 58;
    if (longest <= 24) return 54;
    return 50;
  }

  if (longest <= 18) return 63;
  if (longest <= 24) return 58;
  return 52;
}

function formatSlideDate(value?: string): string {
  if (!value) return getCurrentKstSlideDateShort();
  return formatSlideDateShortFromIso(value);
}

function normalizeBarColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const match = value.trim().match(/^#([0-9a-fA-F]{6})$/);
  return match ? `#${match[1].toUpperCase()}` : fallback;
}

export function PreviewCanvas({ data, zoom, showGuides, showOriginal = false }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    if (zoom === "100") {
      setScale(1);
      return;
    }

    const fit = () => {
      if (!wrapRef.current) return;
      const { clientWidth, clientHeight } = wrapRef.current;
      const s = Math.min(clientWidth / W, clientHeight / H);
      setScale(Math.max(0.1, s * 0.9));
    };

    fit();
    const ro = new ResizeObserver(fit);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [zoom]);

  const headline = data.headline || "";
  const headlineSize = getHeadlineSize(headline);
  const headerTitle = data.headerTitle || "부동산 이슈 한판승부";
  const headerLabel = data.headerLabel || "부동산 PICK";
  const headerLabelCode = (data.headerLabelCode || "").trim().toUpperCase();
  const isWallStLabel = headerLabelCode === "WALL_ST" || headerLabel.replace(/\s+/g, "").toUpperCase() === "WALLST";
  const footerDate = formatSlideDate(data.slideDate);
  const summaryLines = (data.summaryLines || []).map((line) => String(line ?? "").trim()).filter(Boolean);
  const summaryText = summaryLines.length > 0 ? summaryLines.slice(0, 3).join("\n") : "요약 텍스트";
  const summaryFontSize = getSummaryFontSize(summaryLines.slice(0, 3));
  const topBarColor = normalizeBarColor(data.topBarColor, DEFAULT_TOP_BAR_COLOR);
  const bottomBarColor = topBarColor;

  return (
    <div ref={wrapRef} className="w-full h-full overflow-auto bg-surface-muted p-3">
      <div className="mx-auto w-fit">
        <div
          className="relative shadow-lg bg-white overflow-hidden"
          data-export-slide-root="true"
          style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top center" }}
        >
          <div
            className="absolute left-0 top-0 flex items-center px-6"
            style={{
              left: LAYOUT.headerBand.x,
              top: LAYOUT.headerBand.y,
              width: LAYOUT.headerBand.w,
              height: LAYOUT.headerBand.h,
              background: topBarColor,
              color: "#FFFFFF",
            }}
          >
            <div className="flex items-center gap-3 min-w-0 z-10 max-w-[420px]">
              <div className="h-[64px] w-[64px] rounded-full overflow-hidden border border-white/45">
                <img src="/pangyo-compass.png" alt="판교불패 로고" className="h-full w-full object-cover" />
              </div>
              <span className="text-[42px] font-bold tracking-tight truncate">판교불패</span>
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <span className="text-[70px] font-extrabold tracking-[-0.02em] leading-none whitespace-nowrap">{headerTitle}</span>
            </div>

            <div
              className="ml-auto inline-flex items-center justify-center h-[78px] min-w-[252px] px-6 border-[3px] border-white/65 text-white text-[48px] font-extrabold leading-none tracking-tight"
              style={{ background: topBarColor }}
            >
              {isWallStLabel ? (
                <span className="inline-flex items-start leading-none">
                  <span className="text-[48px] tracking-tight">WALL</span>
                  <span className="ml-1 mt-[5px] text-[24px] tracking-[-0.02em]">ST</span>
                </span>
              ) : (
                headerLabel
              )}
            </div>
          </div>

          <div
            className="absolute bg-white border border-[#E5E7EB] overflow-hidden"
            style={{
              left: LAYOUT.chartZone.x,
              top: LAYOUT.chartZone.y,
              width: LAYOUT.chartZone.w,
              height: LAYOUT.chartZone.h,
            }}
          >
            {data.chartImageUrl ? (
              <img src={data.chartImageUrl} alt="차트 미리보기" className="w-full h-full object-fill" />
            ) : (
              <div className="w-full h-full grid place-items-center text-neutral-400 text-[32px]">차트 이미지 영역</div>
            )}
          </div>

          {data.source && (
            <div
              className="absolute text-[26px] font-extrabold text-[#111111] tracking-tight text-right w-full"
              style={{
                left: LAYOUT.chartZone.x,
                top: LAYOUT.chartZone.y + LAYOUT.chartZone.h + 8,
                width: LAYOUT.chartZone.w,
              }}
            >
              SOURCE: {data.source}
            </div>
          )}

          <div
            className="absolute flex items-center"
            style={{
              left: LAYOUT.categoryTag.x,
              top: LAYOUT.categoryTag.y,
              height: LAYOUT.categoryTag.h,
            }}
          >
            <span className="inline-flex items-center px-7 h-[86px] rounded-[18px] text-white text-[66px] font-extrabold tracking-[-0.02em]" style={{ background: "#C00000" }}>
              {data.category || "미국증시"}
            </span>
          </div>

          <div
            className="absolute overflow-hidden"
            style={{
              left: LAYOUT.headlineZone.x,
              top: LAYOUT.headlineZone.y,
              width: LAYOUT.headlineZone.w,
              height: LAYOUT.headlineZone.h,
            }}
          >
            <h2
              className="font-extrabold text-neutral-900 whitespace-pre-wrap"
              style={{ fontSize: headlineSize, lineHeight: 1.03, letterSpacing: "-0.02em", wordBreak: "keep-all" }}
            >
              {headline || "헤드라인을 입력하세요"}
            </h2>
          </div>

          <div
            className="absolute inline-flex items-center justify-center rounded-[10px] bg-[#111111] text-white font-extrabold"
            style={{
              left: LAYOUT.summaryBadge.x,
              top: LAYOUT.summaryBadge.y,
              width: LAYOUT.summaryBadge.w,
              height: LAYOUT.summaryBadge.h,
              fontSize: 44,
              letterSpacing: "-0.02em",
            }}
          >
            핵심요약
          </div>

          <div
            className="absolute"
            style={{
              left: LAYOUT.summaryTextZone.x,
              top: LAYOUT.summaryTextZone.y,
              width: LAYOUT.summaryTextZone.w,
              height: LAYOUT.summaryTextZone.h,
            }}
          >
            <div className="h-full">
              <p
                className="font-semibold text-neutral-900 leading-[1.14] whitespace-pre-wrap"
                style={{ fontSize: summaryFontSize, letterSpacing: "-0.01em", wordBreak: "keep-all" }}
              >
                {summaryText}
              </p>
            </div>
          </div>

          <div
            className="absolute left-0 flex items-center justify-between px-8 text-white"
            style={{
              top: LAYOUT.footerBand.y,
              width: LAYOUT.footerBand.w,
              height: LAYOUT.footerBand.h,
              background: bottomBarColor,
            }}
          >
            <div className="min-w-0">
              <div className="flex items-end gap-4">
                <img
                  src="/premium-contents-cutout.png"
                  alt="Premium Contents"
                  className="h-[64px] w-auto shrink-0 select-none pointer-events-none object-contain"
                  draggable={false}
                />
                <span className="text-[42px] font-semibold leading-none tracking-[-0.01em]">네이버프리미엄 콘텐츠 제공</span>
              </div>

            </div>
            <span className="num text-[54px] leading-none">{footerDate || "26.4.16"}</span>
          </div>

          {showOriginal && (
            <div
              className="absolute border border-white/20 bg-black/80 rounded-lg overflow-hidden"
              style={{ right: 32, top: 688, width: 430, height: ORIGINAL_PREVIEW_HEIGHT }}
            >
              <div className="h-full px-4 py-3 flex flex-col gap-2">
                <span className="text-white/80 text-[20px] font-medium leading-none">원본 비교</span>
                <div className="h-full rounded-sm bg-white/5 overflow-hidden grid place-items-center">
                  {data.chartImageUrl ? (
                    <img src={data.chartImageUrl} alt="원본 차트" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-white/70 text-[18px]">원본 이미지 없음</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {showGuides && (
            <>
              <div className="absolute inset-0 pointer-events-none" style={{ outline: "1px dashed rgba(192,0,0,.5)" }} />
              <div className="absolute pointer-events-none" style={{ left: LAYOUT.headerBand.x, top: LAYOUT.headerBand.y, width: LAYOUT.headerBand.w, height: LAYOUT.headerBand.h, outline: "1px dashed rgba(26,60,52,.6)" }} />
              <div className="absolute pointer-events-none" style={{ left: LAYOUT.chartZone.x, top: LAYOUT.chartZone.y, width: LAYOUT.chartZone.w, height: LAYOUT.chartZone.h, outline: "1px dashed rgba(26,60,52,.6)" }} />
              <div className="absolute pointer-events-none" style={{ left: LAYOUT.categoryTag.x, top: LAYOUT.categoryTag.y, width: 320, height: LAYOUT.categoryTag.h, outline: "1px dashed rgba(26,60,52,.6)" }} />
              <div className="absolute pointer-events-none" style={{ left: LAYOUT.headlineZone.x, top: LAYOUT.headlineZone.y, width: LAYOUT.headlineZone.w, height: LAYOUT.headlineZone.h, outline: "1px dashed rgba(26,60,52,.6)" }} />
              <div className="absolute pointer-events-none" style={{ left: LAYOUT.summaryBadge.x, top: LAYOUT.summaryBadge.y, width: LAYOUT.summaryBadge.w, height: LAYOUT.summaryBadge.h, outline: "1px dashed rgba(26,60,52,.6)" }} />
              <div className="absolute pointer-events-none" style={{ left: LAYOUT.summaryTextZone.x, top: LAYOUT.summaryTextZone.y, width: LAYOUT.summaryTextZone.w, height: LAYOUT.summaryTextZone.h, outline: "1px dashed rgba(26,60,52,.6)" }} />
              <div className="absolute pointer-events-none" style={{ left: LAYOUT.footerBand.x, top: LAYOUT.footerBand.y, width: LAYOUT.footerBand.w, height: LAYOUT.footerBand.h, outline: "1px dashed rgba(26,60,52,.6)" }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export const SLIDE_W = W;
export const SLIDE_H = H;


