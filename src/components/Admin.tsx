import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, KeyRound, Loader2, Power, Rocket, ShieldCheck, Users } from "lucide-react";
import {
  confirmarUtilizador,
  definirEstadoApp,
  entrarAdmin,
  definirPalavraPasse,
  listarUtilizadores,
  type AdminUser,
} from "@/lib/admin.functions";
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

/** Pede o código de administrador antes de abrir o painel. Não exige conta. */
export function AdminGate({
  onBack,
  onEntrarApp,
}: {
  onBack: () => void;
  onEntrarApp?: (codigo: string) => void;
}) {
  const entrar = useServerFn(entrarAdmin);
  const [codigo, setCodigo] = useState("");
  const [ok, setOk] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (ok) return <AdminPanel codigo={ok} onBack={onBack} onEntrarApp={onEntrarApp} />;

  const validar = async () => {
    setBusy(true);
    setErro(null);
    try {
      await entrar({ data: { codigo } });
      setOk(codigo);
    } catch {
      setErro("Código incorreto.");
    }
    setBusy(false);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <div className="surface-card animate-rise space-y-5 p-7">
        <div className="space-y-1 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-secondary/60">
            <ShieldCheck className="size-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Área de administrador</h1>
          <p className="text-sm text-muted-foreground">
            Introduz o código de administrador para entrar. Não é preciso conta.
          </p>
        </div>

        <input
          type="password"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && codigo && void validar()}
          placeholder="Código de administrador"
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />

        {erro && (
          <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {erro}
          </p>
        )}

        <button
          type="button"
          disabled={!codigo || busy}
          onClick={() => void validar()}
          className="fusion-gradient heat-glow flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : <ShieldCheck className="size-5" />}
          Entrar
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Voltar
        </button>
      </div>
    </main>
  );
}

export function AdminPanel({
  onBack,
  codigo,
  onEntrarApp,
}: {
  onBack: () => void;
  codigo: string;
  onEntrarApp?: (codigo: string) => void;
}) {
  const { isAdmin, status, loading, refresh } = useAdmin();
  const guardarEstado = useServerFn(definirEstadoApp);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (status) setMsg(status.mensagem);
  }, [status]);

  const salvar = async (ativo: boolean) => {
    setSaving(true);
    setErro(null);
    try {
      await guardarEstado({ data: { codigo, ativo, mensagem: msg } });
      await refresh();
    } catch {
      setErro("Não foi possível guardar. Tenta de novo.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!codigo && !isAdmin) {
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

      {onEntrarApp && (
        <button
          type="button"
          onClick={() => onEntrarApp(codigo)}
          className="fusion-gradient heat-glow flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-primary-foreground transition-all active:scale-[0.98]"
        >
          <Rocket className="size-5" /> Entrar no aplicativo sem conta
        </button>
      )}



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

      <Utilizadores codigo={codigo} />
    </div>
  );
}

function Utilizadores({ codigo }: { codigo: string }) {
  const listar = useServerFn(listarUtilizadores);
  const confirmar = useServerFn(confirmarUtilizador);
  const definir = useServerFn(definirPalavraPasse);

  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [nova, setNova] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);

  const carregar = async () => {
    setErro(null);
    try {
      setUsers(await listar({ data: { codigo } }));
    } catch {
      setErro("Não foi possível carregar as contas.");
      setUsers([]);
    }
  };

  useEffect(() => {
    void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const acao = async (id: string, fn: () => Promise<unknown>, msg: string) => {
    setBusy(id);
    setAviso(null);
    setErro(null);
    try {
      await fn();
      setAviso(msg);
      await carregar();
    } catch {
      setErro("Não foi possível concluir. Tenta de novo.");
    }
    setBusy(null);
  };

  return (
    <div className="surface-card space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <Users className="size-4 text-primary" /> Contas criadas
        </h2>
        <span className="text-xs text-muted-foreground">{users?.length ?? 0}</span>
      </div>

      {aviso && (
        <p className="rounded-2xl border border-border bg-secondary/40 p-3 text-sm">{aviso}</p>
      )}
      {erro && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {erro}
        </p>
      )}

      {users === null ? (
        <div className="grid place-items-center py-6">
          <Loader2 className="size-5 animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ainda não há contas.</p>
      ) : (
        <ul className="space-y-3">
          {users.map((u) => (
            <li key={u.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{u.nome || u.email}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Criada em {new Date(u.criadoEm).toLocaleDateString("pt-PT")}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold",
                    u.verificado
                      ? "bg-secondary/60 text-primary"
                      : "bg-destructive/10 text-destructive",
                  )}
                >
                  {u.verificado ? "Verificada" : "Por verificar"}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {!u.verificado && (
                  <button
                    type="button"
                    disabled={busy === u.id}
                    onClick={() =>
                      void acao(u.id, () => confirmar({ data: { codigo, userId: u.id } }), "Conta verificada.")
                    }
                    className="rounded-xl border border-border bg-secondary/40 px-3 py-2 text-xs font-semibold disabled:opacity-50"
                  >
                    Verificar agora
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(openId === u.id ? null : u.id);
                    setNova("");
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-xs font-semibold"
                >
                  <KeyRound className="size-3.5" /> Nova palavra-passe
                </button>
              </div>

              {openId === u.id && (
                <div className="mt-3 flex gap-2">
                  <input
                    value={nova}
                    onChange={(e) => setNova(e.target.value)}
                    placeholder="mínimo 6 caracteres"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    disabled={nova.length < 6 || busy === u.id}
                    onClick={() =>
                      void acao(
                        u.id,
                        () => definir({ data: { codigo, userId: u.id, password: nova } }),
                        "Palavra-passe alterada. Partilha-a com a pessoa.",
                      ).then(() => setOpenId(null))
                    }
                    className="fusion-gradient shrink-0 rounded-xl px-4 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    Guardar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
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
