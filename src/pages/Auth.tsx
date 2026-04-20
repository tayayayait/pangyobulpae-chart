import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

const ENABLE_ANONYMOUS_LOGIN = import.meta.env.VITE_ENABLE_ANONYMOUS_LOGIN === "true";
const DEFAULT_LOGIN_EMAIL = "dbcdkwo629@naver.com";
const DEFAULT_LOGIN_PASSWORD = "12341234";

export default function Auth() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState(DEFAULT_LOGIN_EMAIL);
  const [password, setPassword] = useState(DEFAULT_LOGIN_PASSWORD);
  const [loading, setLoading] = useState(false);
  const [autoEntering, setAutoEntering] = useState(true);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        nav("/reports", { replace: true });
        return;
      }

      if (ENABLE_ANONYMOUS_LOGIN) {
        const { data: guestData, error } = await supabase.auth.signInAnonymously();
        if (!error && guestData.session) {
          nav("/reports", { replace: true });
          return;
        }

        if (error) {
          toast.error(`게스트 로그인 실패: ${error.message}`);
        }
      }

      if (active) setAutoEntering(false);
    };

    void bootstrap();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) nav("/reports", { replace: true });
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [nav]);

  if (autoEntering) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <p className="text-muted-foreground">게스트 로그인 중...</p>
      </div>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/reports` },
        });
        if (error) throw error;
        toast.success("회원가입 완료. 이메일을 확인해 주세요.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err?.message || "인증에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="w-full max-w-md bg-surface rounded-lg shadow-md p-8 border border-border animate-fade-in">
        <div className="flex items-center gap-2 mb-6">
          <span className="grid place-items-center w-9 h-9 rounded-md bg-brand text-brand-foreground">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <h1 className="text-headline-md leading-tight">C2I Automator</h1>
            <p className="text-caption text-muted-foreground">차트 한 장으로 임원 보고용 슬라이드를 생성합니다.</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="최소 8자" />
          </div>
          <Button type="submit" className="w-full h-12" disabled={loading}>
            {loading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
          </Button>
        </form>
        <button
          className="mt-4 w-full text-caption text-muted-foreground hover:text-foreground transition-base"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? "계정이 없나요? 회원가입" : "이미 계정이 있나요? 로그인"}
        </button>
      </div>
    </div>
  );
}
