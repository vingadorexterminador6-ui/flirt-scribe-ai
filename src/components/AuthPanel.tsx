import { useState } from "react";
import { Flame, Loader2, Lock, Mail, ArrowRight, CheckCircle2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup";

export function AuthPanel({ onEnter }: { onEnter: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<null | { hasSession: boolean }>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nome: name.trim() },
          },
        });
        if (error) throw error;
        setCreated({ hasSession: !!data.session });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        onEnter();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Algo correu mal.";
      setError(
        /not confirmed|confirm/i.test(msg)
          ? "Espera uns segundos e toca em entrar outra vez."
          : /invalid login/i.test(msg)
            ? "E-mail ou palavra-passe incorretos."
            : /already registered|already exists/i.test(msg)
              ? "Esta conta já existe. Entra em vez de criar."
              : /password/i.test(msg)
                ? "A palavra-passe precisa de pelo menos 6 caracteres."
                : msg,
      );
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Não foi possível entrar com o Google. Tenta de novo.");
      return;
    }
    if (result.redirected) return;
    onEnter();
  };

  if (created) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
        <div className="surface-card animate-rise space-y-5 p-7 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-secondary/60">
            <CheckCircle2 className="size-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Conta criada! 🎉</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {created.hasSession
                ? "Está tudo pronto. Toca em próximo para começar a conversar melhor."
                : "Confirma o teu e-mail e depois toca em próximo para entrar."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (created.hasSession) onEnter();
              else {
                setCreated(null);
                setMode("login");
              }
            }}
            className="fusion-gradient heat-glow flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-primary-foreground transition-all active:scale-[0.98]"
          >
            Próximo <ArrowRight className="size-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="animate-rise space-y-6">
        <header className="space-y-3 text-center">
          <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-muted-foreground shadow-sm">
            <Flame className="size-3.5 text-primary" /> Conversa Quente AI
          </span>
          <h1 className="text-[1.9rem] font-bold leading-tight tracking-tight">
            {mode === "login" ? (
              <>
                Bem-vindo de <span className="fusion-text">volta.</span>
              </>
            ) : (
              <>
                Cria a tua <span className="fusion-text">conta.</span>
              </>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            Respostas prontas, no teu estilo, em segundos.
          </p>
        </header>

        <div className="surface-card space-y-4 p-5">
          <div className="flex rounded-2xl bg-secondary/50 p-1">
            {(["login", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={cn(
                  "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all",
                  mode === m
                    ? "fusion-gradient text-primary-foreground shadow"
                    : "text-muted-foreground",
                )}
              >
                {m === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          {mode === "signup" && (
            <Field icon={<User className="size-4" />}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como te chamas?"
                className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
              />
            </Field>
          )}

          <Field icon={<Mail className="size-4" />}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              placeholder="o teu e-mail"
              className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            />
          </Field>

          <Field icon={<Lock className="size-4" />}>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="palavra-passe"
              className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            />
          </Field>

          {error && (
            <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={loading || !email.trim() || password.length < 6}
            onClick={submit}
            className="fusion-gradient heat-glow flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading && <Loader2 className="size-5 animate-spin" />}
            {mode === "login" ? "Entrar" : "Criar conta"}
          </button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={google}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-secondary/40 py-3.5 text-sm font-semibold transition-colors hover:bg-secondary"
          >
            <GoogleIcon /> Continuar com Google
          </button>
        </div>

        <p className="px-2 text-center text-xs leading-relaxed text-muted-foreground">
          As tuas conversas são privadas. Nada do que envias fica guardado nos nossos servidores.
        </p>
      </div>
    </div>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 transition-shadow focus-within:ring-2 focus-within:ring-ring">
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
