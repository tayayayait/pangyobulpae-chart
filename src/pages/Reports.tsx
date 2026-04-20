import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusChip } from "@/components/StatusChip";
import { EmptyState } from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { Plus, FileSearch, FileText, Loader2, Lock, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { CATEGORY_OPTIONS, CategoryCode, ReportStatus, STATUS_LABEL, getCategoryDisplayLabelExact, normalizeCategory } from "@/lib/constants";
import { useViewportWidth } from "@/hooks/useViewportWidth";

interface Row {
  id: string;
  status: ReportStatus;
  category: string | null;
  headline: string | null;
  summary_lines: string[] | null;
  source: string | null;
  slide_date: string | null;
  chart_image_url: string | null;
  export_status: string | null;
  updated_at: string;
}

type ExportStatus = "idle" | "queued" | "processing" | "ready" | "expired" | "failed";
type SortOrder = "updated_desc" | "updated_asc";

interface ReportQueryRow {
  id: string;
  status: ReportStatus;
  category: string | null;
  headline: string | null;
  summary_lines: unknown;
  source: string | null;
  slide_date: string | null;
  chart_image_url: string | null;
  export_status: string | null;
  updated_at: string;
}

const EXPORT_STATUS_UI: Record<ExportStatus, { label: string; className: string }> = {
  idle: { label: "대기", className: "bg-secondary text-muted-foreground" },
  queued: { label: "큐 대기", className: "bg-info/10 text-info" },
  processing: { label: "생성 중", className: "bg-info/10 text-info" },
  ready: { label: "준비 완료", className: "bg-success/10 text-success" },
  expired: { label: "만료", className: "bg-warning/10 text-warning" },
  failed: { label: "실패", className: "bg-critical/10 text-critical" },
};

const toSummaryLines = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((line) => String(line ?? ""));
};

const normalizeExportStatus = (value?: string | null): ExportStatus => {
  if (value === "completed") return "ready";
  if (value === "queued" || value === "processing" || value === "ready" || value === "expired" || value === "failed") {
    return value;
  }
  return "idle";
};

const formatCardDate = (value: string) => {
  const date = new Date(value);
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1);
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
};

export default function Reports() {
  const nav = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | CategoryCode>("all");
  const [sort, setSort] = useState<SortOrder>("updated_desc");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const viewportWidth = useViewportWidth();
  const isReadOnlyMobile = viewportWidth < 768;

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reports")
      .select("id,status,category,headline,summary_lines,source,slide_date,chart_image_url,export_status,updated_at")
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    else {
      const nextRows = ((data || []) as ReportQueryRow[]).map((item) => ({
        ...item,
        category: typeof item.category === "string" ? item.category : null,
        summary_lines: toSummaryLines(item.summary_lines),
      }));
      setRows(nextRows as Row[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let items = [...rows];
    if (statusFilter !== "all") items = items.filter((item) => item.status === statusFilter);
    if (categoryFilter !== "all") items = items.filter((item) => normalizeCategory(item.category) === categoryFilter);
    if (q.trim()) {
      const term = q.toLowerCase();
      items = items.filter((item) => (item.headline || "").toLowerCase().includes(term) || (item.source || "").toLowerCase().includes(term));
    }
    items.sort((a, b) => {
      const av = new Date(a.updated_at).getTime();
      const bv = new Date(b.updated_at).getTime();
      return sort === "updated_desc" ? bv - av : av - bv;
    });
    return items;
  }, [rows, q, statusFilter, categoryFilter, sort]);

  const create = async () => {
    if (isReadOnlyMobile) {
      toast.error("모바일 뷰에서는 새 리포트를 만들 수 없습니다.");
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("reports")
      .insert({
        user_id: user.id,
        status: "draft",
        template_id: "finance-premium-01",
        brand_name: "판교불패",
        logo_url: null,
      })
      .select("id")
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    nav(`/reports/${data.id}/edit`);
  };

  const requestRemove = (row: Row) => {
    if (isReadOnlyMobile) {
      toast.error("모바일 뷰에서는 삭제할 수 없습니다.");
      return;
    }
    setDeleteTarget(row);
  };

  const remove = async () => {
    if (!deleteTarget) return;
    if (isReadOnlyMobile) {
      toast.error("모바일 뷰에서는 삭제할 수 없습니다.");
      return;
    }
    setDeletingId(deleteTarget.id);
    const { error } = await supabase.from("reports").delete().eq("id", deleteTarget.id);
    if (error) {
      toast.error(error.message);
      setDeletingId(null);
      return;
    }
    toast.success("리포트를 삭제했습니다.");
    setRows((current) => current.filter((row) => row.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeletingId(null);
  };

  const renderCardBody = (row: Row) => {
    const exportStatus = normalizeExportStatus(row.export_status);
    const exportMeta = EXPORT_STATUS_UI[exportStatus];

    return (
      <div className="h-full flex flex-col">
        <div className="aspect-video bg-surface-muted overflow-hidden grid place-items-center">
          {row.chart_image_url ? (
            <img
              src={row.chart_image_url}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-full h-full object-contain"
            />
          ) : (
            <FileText className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <div className="p-4 flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <StatusChip status={row.status} />
            <span className="text-caption text-muted-foreground num">{formatCardDate(row.updated_at)}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-2.5 h-6 rounded-pill text-[11px] font-semibold bg-[#C00000] text-white">{getCategoryDisplayLabelExact(row.category)}</span>
            <span className={`inline-flex items-center px-2.5 h-6 rounded-pill text-[11px] font-semibold ${exportMeta.className}`}>{exportMeta.label}</span>
          </div>

          <h3 className="font-bold leading-snug line-clamp-2">{row.headline || "(제목 없음)"}</h3>
          <p className="text-caption text-muted-foreground line-clamp-1">{row.summary_lines?.[0] || "요약 없음"}</p>
          <p className="text-caption text-muted-foreground truncate mt-auto">{row.source || "출처 없음"}</p>
        </div>
      </div>
    );
  };

  return (
    <AppShell>
      <div className="max-w-[1280px] mx-auto px-6 py-8">
        {isReadOnlyMobile && (
          <div className="mb-4 rounded-md border border-warning/50 bg-warning/10 px-4 py-3 text-warning flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span className="text-body">모바일 뷰에서는 대시보드 조회만 지원됩니다.</span>
          </div>
        )}

        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-display-md">내 리포트</h1>
            <p className="text-muted-foreground mt-1">판교불패 대시보드</p>
          </div>
          {!isReadOnlyMobile && (
            <Button className="h-12 px-6" onClick={create}>
              <Plus className="w-4 h-4" /> 새 리포트
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <div className="relative flex-1 max-w-md">
            <FileSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="헤드라인 또는 출처 검색" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-11" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 상태</SelectItem>
              {(Object.keys(STATUS_LABEL) as ReportStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABEL[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(value: "all" | CategoryCode) => setCategoryFilter(value)}>
            <SelectTrigger className="w-[180px] h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 카테고리</SelectItem>
              {CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(value: SortOrder) => setSort(value)}>
            <SelectTrigger className="w-[180px] h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_desc">최신 수정 순</SelectItem>
              <SelectItem value="updated_asc">오래된 순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-muted-foreground py-16 text-center">로딩 중</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-5 h-5" />}
            title={rows.length === 0 ? "아직 리포트가 없습니다" : "검색 결과가 없습니다"}
            description={
              rows.length === 0
                ? "차트 이미지를 업로드해 첫 리포트를 만들어 보세요."
                : "다른 검색어나 필터를 시도해 보세요."
            }
            action={
              rows.length === 0 && !isReadOnlyMobile ? (
                <Button className="h-11" onClick={create}>
                  <Plus className="w-4 h-4" /> 새 리포트 만들기
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="grid grid-cols-1 min-[1024px]:grid-cols-2 min-[1280px]:grid-cols-3 min-[1440px]:grid-cols-4 gap-5">
            {filtered.map((row) => (
              <li
                key={row.id}
                className="group relative rounded-[20px] border border-border bg-surface shadow-sm hover:shadow-md transition-base overflow-hidden min-h-[312px]"
                style={{ contentVisibility: "auto", containIntrinsicSize: "312px" }}
              >
                {isReadOnlyMobile ? (
                  renderCardBody(row)
                ) : (
                  <>
                    <Link to={`/reports/${row.id}/edit`} className="block h-full">
                      {renderCardBody(row)}
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={`${row.headline || "(제목 없음)"} 삭제`}
                      className="absolute right-3 top-3 z-10 h-8 bg-surface/95 px-2 hover:bg-surface"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        requestRemove(row);
                      }}
                      disabled={deletingId === row.id}
                    >
                      {deletingId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      <span className="text-[11px]">{deletingId === row.id ? "삭제 중" : "삭제"}</span>
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deletingId) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>리포트를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제하면 복구할 수 없습니다. 대상: <span className="font-semibold text-foreground">{deleteTarget?.headline || "(제목 없음)"}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingId)}>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={Boolean(deletingId)}
              onClick={(event) => {
                event.preventDefault();
                void remove();
              }}
            >
              {deletingId ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  삭제 중...
                </>
              ) : (
                "삭제"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
