import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  rightSlot?: ReactNode;
  saveStatus?: "dirty" | "saved" | "saving" | "error" | null;
}

export function AppShell({ children, rightSlot, saveStatus }: AppShellProps) {
  const nav = useNavigate();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    nav("/auth");
  };

  const saveStateMeta = saveStatus
    ? {
        dirty: { text: "변경 사항 있음", dot: "bg-muted-foreground", pulse: false, tone: "bg-secondary text-muted-foreground" },
        saving: { text: "저장 중", dot: "bg-info", pulse: true, tone: "bg-info/10 text-info" },
        saved: { text: "모든 변경 사항이 저장되었습니다", dot: "bg-success", pulse: false, tone: "bg-success/10 text-success" },
        error: { text: "저장 실패, 재시도 필요", dot: "bg-critical", pulse: false, tone: "bg-critical/10 text-critical" },
      }[saveStatus]
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-y-auto">
      <header className="sticky top-0 z-40 h-[72px] border-b border-border bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/70">
        <div className="h-full px-6 flex items-center justify-between">
          <Link to="/reports" className="flex items-center gap-2 group">
            <span className="grid place-items-center w-8 h-8 rounded-md bg-brand text-brand-foreground">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-headline-md tracking-tight">C2I Automator</span>
          </Link>
          <div className="flex items-center gap-3">
            {saveStateMeta && (
              <span
                aria-live="polite"
                className={cn("inline-flex items-center gap-2 text-caption px-3 py-1 rounded-pill", saveStateMeta.tone)}
              >
                <span className={cn("w-2 h-2 rounded-pill", saveStateMeta.dot, saveStateMeta.pulse && "animate-pulse")} />
                {saveStateMeta.text}
              </span>
            )}
            {rightSlot}
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="로그아웃">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
    </div>
  );
}
