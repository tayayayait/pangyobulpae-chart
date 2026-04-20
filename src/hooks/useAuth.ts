import { useEffect, useRef, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const ENABLE_ANONYMOUS_LOGIN = import.meta.env.VITE_ENABLE_ANONYMOUS_LOGIN === "true";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const guestAttemptedRef = useRef(false);

  useEffect(() => {
    let active = true;

    const applySession = (nextSession: Session | null) => {
      if (!active) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      applySession(s);
      setLoading(false);
    });

    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        applySession(data.session);
        setLoading(false);
        return;
      }

      if (ENABLE_ANONYMOUS_LOGIN && !guestAttemptedRef.current) {
        guestAttemptedRef.current = true;
        const { data: guestData } = await supabase.auth.signInAnonymously();
        if (guestData.session) {
          applySession(guestData.session);
        }
      }

      setLoading(false);
    };

    void bootstrap();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user, loading };
}
