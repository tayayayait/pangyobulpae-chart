import { useNavigate } from "react-router-dom";
import { Copy, LayoutDashboard, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

export default function Unsupported() {
  const nav = useNavigate();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/reports`);
      toast.success("링크를 복사했습니다.");
    } catch {
      toast.error("링크 복사에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-8 bg-background text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-4 grid place-items-center w-14 h-14 rounded-md bg-secondary text-muted-foreground">
          <Monitor className="w-6 h-6" />
        </div>
        <h1 className="text-headline-md mb-2">모바일 환경에서는 편집이 제한됩니다</h1>
        <p className="text-muted-foreground text-body">
          C2I Automator 편집 기능은 1024px 이상의 화면에서 사용하도록 설계되었습니다. PC 또는 태블릿 가로 화면에서 다시 접속해 주세요.
        </p>
        <div className="mt-5 grid gap-2">
          <Button className="h-11" onClick={() => nav("/reports")}>
            <LayoutDashboard className="w-4 h-4" /> 대시보드로 이동
          </Button>
          <Button variant="outline" className="h-11" onClick={copyLink}>
            <Copy className="w-4 h-4" /> 링크 복사
          </Button>
        </div>
      </div>
    </div>
  );
}
