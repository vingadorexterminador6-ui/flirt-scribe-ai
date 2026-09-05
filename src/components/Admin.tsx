import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Power, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export type AppStatus = { ativo: boolean; mensagem: string };

/** Descobre se o utilizador atual é administrador e o estado do aplicativo. */
export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    const [roles, st] = await Promise.all([
      uid
        ? supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("app_status").select("ativo, mensagem").maybeSingle(),
    ]);
    setIsAdmin(!!roles.data);
    setStatus(st.data ?? { ativo: true, mensagem: "" });
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  return { isAdmin, status, loading, refresh, setStatus };
}

export function ManutencaoScreen({ mensagem }: { mensagem: string }) {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-md place-items-center px-6 text-center">
      <div className="surface-card animate-rise space-y-4 p-8">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-secondary/60">
          <Power className="size-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Em atualização</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {mensagem || "Estamos a melhorar o aplicativo. Volta daqui a pouco!"}
        </p>
      </div>
    </main>
  );
}

export function AdminPanel({ onBack }: { onBack: () => void }) {
  const { isAdmin, status, loading, refresh } = useAdmin();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (status) setMsg(status.mensagem);
  }, [status]);

  const salvar = async (ativo: boolean) => {
    setSaving(true);
    setErro(null);
    const { error } = await supabase
      .from("app_status")
      .update({ ativo, mensagem: msg, updated_at: new Date().toISOString() })
      .eq("id", true);
    if (error) setErro("Não foi possível guardar. Tenta de novo.");
    else await refresh();
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="animate-rise space-y-4">
        <BackBar onBack={onBack} />
        <div className="surface-card p-6 text-center text-sm text-muted-foreground">
          Esta área é exclusiva do administrador.
        </div>
      </div>
    );
  }

  return (
    <div className="animate-rise space-y-5">
      <BackBar onBack={onBack} />

      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <ShieldCheck className="size-6 text-primary" /> Administrador
        </h1>
        <p className="text-sm text-muted-foreground">
          Liga ou desliga o aplicativo para todos os utilizadores.
        </p>
      </header>

      <div className="surface-card space-y-4 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold">Aplicativo {status?.ativo ? "ativo" : "desativado"}</p>
            <p className="text-xs text-muted-foreground">
              {status?.ativo ? "Todos conseguem usar." : "Só tu consegues entrar."}
            </p>
          </div>
          <span
            className={cn(
              "size-3 rounded-full",
              status?.ativo ? "bg-primary" : "bg-destructive",
            )}
          />
        </div>

        <label className="block space-y-2">
          <span className="text-xs text-muted-foreground">Mensagem mostrada em atualização</span>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="Estamos em atualização. Voltamos já!"
          />
        </label>

        {erro && (
          <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {erro}
          </p>
        )}

        <button
          type="button"
          disabled={saving}
          onClick={() => void salvar(!status?.ativo)}
          className="fusion-gradient heat-glow flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-5 animate-spin" /> : <Power className="size-5" />}
          {status?.ativo ? "Desativar aplicativo" : "Ativar aplicativo"}
        </button>
      </div>
    </div>
  );
}

function BackBar({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> Voltar
    </button>
  );
}
