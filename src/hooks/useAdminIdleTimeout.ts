import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/** 30 minutos sem interação dentro do painel admin → sessão encerrada. */
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
/** Reagendar o timer no máximo 1x/seg — eventos como mousemove disparam em rajada. */
const ACTIVITY_THROTTLE_MS = 1000;

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

/**
 * Encerra a sessão automaticamente quando um administrador fica inativo
 * dentro do painel. Montado apenas nas rotas /admin/* (via AdminRoute) —
 * navegando no app normal o timer não existe, então usuários comuns e
 * admins fora do painel nunca são deslogados por isso.
 */
export function useAdminIdleTimeout(enabled: boolean) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastResetRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const expire = async () => {
      try {
        await supabase.rpc("log_user_activity", {
          p_user_id: (await supabase.auth.getUser()).data.user?.id ?? null,
          p_action_type: "admin_idle_timeout",
          p_details: { reason: `Sessão administrativa encerrada após ${IDLE_TIMEOUT_MS / 60000} min de inatividade` },
        } as never);
      } catch {
        // log é melhor esforço — nunca impedir o logout
      }
      await supabase.auth.signOut();
      toast({
        title: "Sessão encerrada por inatividade",
        description: "Por segurança, sessões administrativas expiram após 30 minutos sem uso. Entre novamente.",
      });
      navigate("/auth");
    };

    const schedule = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(expire, IDLE_TIMEOUT_MS);
    };

    const onActivity = () => {
      const now = Date.now();
      if (now - lastResetRef.current < ACTIVITY_THROTTLE_MS) return;
      lastResetRef.current = now;
      schedule();
    };

    schedule();
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, onActivity));
    };
  }, [enabled, navigate, toast]);
}
