import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Camera,
  Clock,
  Flame,
  Heart,
  Loader2,
  LogOut,
  MessageCircleHeart,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import { canWorkOffline, gerarOffline } from "@/lib/offline";
import { gerarRespostas, type ConversaResult } from "@/lib/conversa.functions";
import { defaultPrefs, Personalizacao, type Prefs } from "@/components/Personalizacao";
import { PlataformaPicker, usePlatform } from "@/components/Plataforma";
import { CopyButton, Sugestoes } from "@/components/Sugestoes";
import { useHistory } from "@/lib/history";
import { AuthPanel } from "@/components/AuthPanel";
import { AdminPanel, ManutencaoScreen, useAdmin } from "@/components/Admin";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Conversa Quente AI — Nunca fique sem saber o que responder" },
      {
        name: "description",
        content:
          "Envie a mensagem ou o screenshot da conversa e a IA cria respostas românticas, provocantes e naturais para você copiar e enviar.",
      },
      { property: "og:title", content: "Conversa Quente AI" },
      {
        property: "og:description",
        content:
          "Assistente de conversas para flerte, namoro e paquera. Respostas prontas em segundos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

type Screen =
  | "home"
  | "screenshot"
  | "responder"
  | "conhecer"
  | "conquista"
  | "namorados"
  | "pensando"
  | "admin"
  | "historico";

const MENU: { id: Screen; emoji: string; title: string; subtitle: string; icon: typeof Camera }[] = [
  {
    id: "screenshot",
    emoji: "📸",
    title: "Analisar Screenshot",
    subtitle: "A IA lê a conversa e entende o contexto",
    icon: Camera,
  },
  {
    id: "responder",
    emoji: "💬",
    title: "O que Respondo?",
    subtitle: "Cole a mensagem dela(e) e receba opções",
    icon: MessageCircleHeart,
  },
  {
    id: "conhecer",
    emoji: "🥂",
    title: "Conheci Alguém Novo",
    subtitle: "Papos leves, engraçados e que chamam atenção",
    icon: Sparkles,
  },
  {
    id: "conquista",
    emoji: "💘",
    title: "Modo Conquista",
    subtitle: "Puxar assunto, criar mistério, convidar",
    icon: Sparkles,
  },
  {
    id: "namorados",
    emoji: "💑",
    title: "Modo Namorados",
    subtitle: "Bom dia, saudade, desculpas, elogios",
    icon: Users,
  },
  {
    id: "pensando",
    emoji: "😏",
    title: "Deixa Pensando",
    subtitle: "Frases que criam tensão e expectativa",
    icon: Flame,
  },
];

const CONHECER = [
  "Puxar papo do nada",
  "Diversão",
  "Papos leves",
  "Chamar muita atenção",
  "Quebrar o gelo com humor",
  "Zoeira e provocação",
  "Descobrir os gostos dela(e)",
  "Papo sensual",
  "Criar tensão no primeiro papo",
  "Depois do match",
  "Continuar o papo que morreu",
  "Chamar para sair",
];

const CONQUISTA = [
  "Iniciar uma conversa",
  "Chamar atenção",
  "Fazer sorrir",
  "Demonstrar interesse",
  "Criar mistério",
  "Aumentar a conexão emocional",
  "Responder depois de horas sem parecer desesperado",
  "Manter a conversa interessante",
  "Criar clima romântico",
  "Boa noite inesquecível",
  "Bom dia",
  "Demonstrar saudades",
  "Convite para um encontro",
];

const NAMORADOS = [
  "Bom dia",
  "Boa noite",
  "Saudade",
  "Amor",
  "Ciúmes",
  "Pedido de desculpas",
  "Reconciliação",
  "Elogios",
  "Surpresas",
  "Flertes",
  "Provocantes",
  "Deixar pensando em você",
];

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [session, setSession] = useState<boolean | null>(null);
  const { isAdmin, status, loading: adminLoading, refresh } = useAdmin();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(!!s);
      void refresh();
    });
    supabase.auth.getSession().then(({ data }) => setSession(!!data.session));
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (session === null || adminLoading) {
    return (
      <main className="grid min-h-screen place-items-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </main>
    );
  }

  if (!session) return <AuthPanel onEnter={() => setSession(true)} />;

  if (status && !status.ativo && !isAdmin) return <ManutencaoScreen mensagem={status.mensagem} />;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-6">
      {screen === "home" ? (
        <Home onOpen={setScreen} />
      ) : screen === "historico" ? (
        <Historico onBack={() => setScreen("home")} />
      ) : screen === "admin" ? (
        <AdminPanel onBack={() => setScreen("home")} />
      ) : (
        <Gerador key={screen} screen={screen} prefs={prefs} setPrefs={setPrefs} onBack={() => setScreen("home")} />
      )}

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-around px-4 py-3">
          <TabButton
            active={screen !== "historico" && screen !== "admin"}
            onClick={() => setScreen("home")}
            icon={<Heart className="size-5" />}
            label="Início"
          />
          <TabButton
            active={screen === "historico"}
            onClick={() => setScreen("historico")}
            icon={<Clock className="size-5" />}
            label="Histórico"
          />
          {isAdmin && (
            <TabButton
              active={screen === "admin"}
              onClick={() => setScreen("admin")}
              icon={<ShieldCheck className="size-5" />}
              label="Admin"
            />
          )}
        </div>
      </nav>
    </main>
  );
}


function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 text-xs font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Home({ onOpen }: { onOpen: (s: Screen) => void }) {
  return (
    <div className="animate-rise space-y-6">
      <header className="space-y-3 pt-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-muted-foreground shadow-sm">
          <Flame className="size-3.5 text-primary" /> Conversa Quente AI
          <span className="size-1 rounded-full bg-azul" />
          <span className="cool-text font-semibold">sincroniza com os teus apps</span>
        </span>
        <h1 className="text-[2rem] font-bold leading-tight tracking-tight">
          Nunca mais fique sem saber <span className="fusion-text">o que responder.</span>
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Envie a mensagem ou screenshot. A IA entende o contexto, adapta ao app que você usa e cria
          a resposta perfeita.
        </p>
      </header>


      <div className="space-y-3">
        {MENU.map((m, i) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onOpen(m.id)}
            className={cn(
              "surface-card animate-rise flex w-full items-center gap-4 p-4 text-left transition-all duration-200 active:scale-[0.98]",
              m.id === "screenshot" && "heat-gradient heat-glow border-transparent",
            )}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span
              className={cn(
                "grid size-12 shrink-0 place-items-center rounded-2xl text-xl",
                m.id === "screenshot" ? "bg-background/25" : "bg-secondary/70",
              )}
            >
              {m.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "block text-base font-semibold",
                  m.id === "screenshot" && "text-primary-foreground",
                )}
              >
                {m.title}
              </span>
              <span
                className={cn(
                  "block text-sm",
                  m.id === "screenshot" ? "text-primary-foreground/80" : "text-muted-foreground",
                )}
              >
                {m.subtitle}
              </span>
            </span>
          </button>
        ))}
      </div>

      <PrivacyNote />
    </div>
  );
}

function PrivacyNote() {
  return (
    <p className="flex items-start gap-2 rounded-2xl border border-border bg-secondary/30 p-3 text-xs leading-relaxed text-muted-foreground">
      <Shield className="mt-0.5 size-4 shrink-0 text-primary" />
      Screenshots de conversas são informações privadas. As imagens são usadas apenas para gerar a
      análise e não ficam guardadas — o histórico fica só no seu aparelho e você pode apagar tudo
      quando quiser.
    </p>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className="grid size-10 place-items-center rounded-full border border-border bg-secondary/50 transition-colors hover:bg-secondary"
        aria-label="Voltar"
      >
        <ArrowLeft className="size-5" />
      </button>
      <h1 className="text-xl font-bold">{title}</h1>
    </div>
  );
}

function Gerador({
  screen,
  prefs,
  setPrefs,
  onBack,
}: {
  screen: Exclude<Screen, "home" | "historico">;
  prefs: Prefs;
  setPrefs: (p: Prefs) => void;
  onBack: () => void;
}) {
  const call = useServerFn(gerarRespostas);
  const { add } = useHistory();
  const { platform, select } = usePlatform();
  const [message, setMessage] = useState("");

  const [image, setImage] = useState<string | null>(null);
  const [category, setCategory] = useState(
    screen === "conquista"
      ? CONQUISTA[0]!
      : screen === "namorados"
        ? NAMORADOS[0]!
        : screen === "conhecer"
          ? CONHECER[0]!
          : "",
  );
  const [result, setResult] = useState<ConversaResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const online = useOnline();
  const fileRef = useRef<HTMLInputElement>(null);

  const meta = MENU.find((m) => m.id === screen)!;
  const categories =
    screen === "conquista"
      ? CONQUISTA
      : screen === "namorados"
        ? NAMORADOS
        : screen === "conhecer"
          ? CONHECER
          : [];

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const offlineReady = canWorkOffline(screen);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(0);
    setElapsed(0);

    const started = Date.now();
    const tick = setInterval(() => {
      const secs = (Date.now() - started) / 1000;
      setElapsed(secs);
      // avança suavemente até 95% enquanto espera a resposta
      setProgress((p) => Math.min(95, p + Math.max(1, (95 - p) * 0.12)));
    }, 120);

    const finish = (res: ConversaResult, offline: boolean) => {
      setProgress(100);
      setElapsed((Date.now() - started) / 1000);
      setResult(res);
      if (res.suggestions.length) {
        add({
          mode: offline ? `${meta.title} (offline)` : meta.title,
          title: message.trim() || category || (image ? "Screenshot analisado" : meta.title),
          result: res,
        });
      }
    };

    try {
      if (!online && offlineReady) {
        finish(
          gerarOffline({
            mode: screen,
            persona: prefs.persona,
            ...(category ? { category } : {}),
            ...(message.trim() ? { message: message.trim() } : {}),
          }),
          true,
        );
      } else {
        const res = await call({
          data: {
            mode: screen,
            ...prefs,
            platform: platform.name,
            platformStyle: platform.style,
            ...(message.trim() ? { message: message.trim() } : {}),
            ...(image ? { imageDataUrl: image } : {}),
            ...(category ? { category } : {}),
          },
        });
        finish(res, false);
      }
    } catch (e) {
      if (offlineReady) {
        finish(
          gerarOffline({
            mode: screen,
            persona: prefs.persona,
            ...(category ? { category } : {}),
            ...(message.trim() ? { message: message.trim() } : {}),
          }),
          true,
        );
      } else {
        setError(e instanceof Error ? e.message : "Algo correu mal. Tenta de novo.");
      }
    } finally {
      clearInterval(tick);
      setLoading(false);
    }
  };

  const canRun =
    screen === "screenshot" ? !!image : screen === "responder" ? message.trim().length > 1 : true;
  const blockedOffline = !online && !offlineReady;

  return (
    <div className="space-y-4">
      <Header title={`${meta.emoji} ${meta.title}`} onBack={onBack} />

      {screen === "screenshot" && (
        <div className="space-y-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          {image ? (
            <div className="surface-card relative overflow-hidden p-2">
              <img src={image} alt="Screenshot da conversa" className="w-full rounded-xl" />
              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  setResult(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-background/80 backdrop-blur"
                aria-label="Apagar imagem"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="surface-card flex w-full flex-col items-center gap-2 border-dashed p-8 text-center transition-colors hover:bg-secondary/30"
            >
              <Camera className="size-7 text-primary" />
              <span className="font-semibold">Carregar screenshot</span>
              <span className="text-sm text-muted-foreground">
                Print do WhatsApp, Instagram ou Messenger
              </span>
            </button>
          )}
          <PrivacyNote />
        </div>
      )}

      {categories.length > 0 && (
        <div className="surface-card space-y-2 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Categoria
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-sm transition-all active:scale-95",
                  category === c
                    ? "heat-gradient heat-glow border-transparent text-primary-foreground"
                    : "border-border bg-secondary/50 hover:bg-secondary",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={screen === "responder" ? 4 : 2}
        placeholder={
          screen === "responder"
            ? 'Ex.: Ela disse: "estou com saudades de ti"'
            : screen === "screenshot"
              ? "Algum detalhe extra? (opcional)"
              : "Algo sobre a pessoa ou o momento? (opcional)"
        }
        className="w-full resize-none rounded-2xl border border-border bg-card p-4 text-[15px] outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
      />

      <Personalizacao prefs={prefs} onChange={setPrefs} />

      <PlataformaPicker platform={platform} onSelect={select} />

      {!online && (
        <p className="flex items-start gap-2 rounded-2xl border border-border bg-secondary/40 p-3 text-xs leading-relaxed text-muted-foreground">
          <WifiOff className="mt-0.5 size-4 shrink-0 text-primary" />
          {offlineReady
            ? "Estás sem internet. Este modo continua a funcionar com as frases guardadas no teu aparelho."
            : "Estás sem internet. Este modo precisa de ligação porque a IA tem de ler a tua conversa."}
        </p>
      )}

      <button
        type="button"
        disabled={!canRun || loading || blockedOffline}
        onClick={run}
        className="fusion-gradient heat-glow w-full rounded-2xl py-4 text-base font-semibold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50"
      >
        <span className="flex items-center justify-center gap-2">
          {loading ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
          Gerar
        </span>
      </button>

      {loading && (
        <div className="space-y-1.5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/60">
            <div
              className="fusion-gradient h-full rounded-full transition-[width] duration-150"
              style={{ width: `${Math.round(progress)}%` }}
            />
          </div>
          <p className="text-center text-xs font-medium text-muted-foreground">
            {Math.round(progress)}%
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground">
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-3">
          <Sugestoes result={result} platform={platform} />
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setImage(null);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3 text-sm text-muted-foreground transition-colors hover:bg-secondary"
          >
            <Trash2 className="size-4" /> Apagar esta análise agora
          </button>
        </div>
      )}
    </div>
  );
}

function Historico({ onBack }: { onBack: () => void }) {
  const { items, hydrated, remove, toggleFavorite, clear } = useHistory();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="animate-rise space-y-4">
      <Header title="Histórico" onBack={onBack} />

      {hydrated && items.length === 0 && (
        <div className="surface-card p-8 text-center text-sm text-muted-foreground">
          Ainda não há nada aqui. As tuas análises e respostas ficam guardadas neste aparelho.
        </div>
      )}

      {items.map((item) => (
        <div key={item.id} className="surface-card space-y-3 p-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{item.mode}</p>
              <p className="truncate text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleString("pt-PT")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleFavorite(item.id)}
              aria-label="Favoritar"
              className="grid size-9 place-items-center rounded-full bg-secondary/60"
            >
              <Star className={cn("size-4", item.favorite && "fill-primary text-primary")} />
            </button>
            <button
              type="button"
              onClick={() => remove(item.id)}
              aria-label="Apagar"
              className="grid size-9 place-items-center rounded-full bg-secondary/60"
            >
              <Trash2 className="size-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setOpenId(openId === item.id ? null : item.id)}
            className="text-sm font-medium text-primary"
          >
            {openId === item.id ? "Esconder respostas" : "Ver respostas"}
          </button>

          {openId === item.id && (
            <div className="space-y-3">
              {item.result.suggestions.map((s, i) => (
                <div key={i} className="rounded-2xl bg-secondary/40 p-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {s.emoji} {s.label}
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{s.text}</p>
                  <CopyButton text={s.text} className="mt-2" />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {items.length > 0 && (
        <button
          type="button"
          onClick={clear}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/40 py-3 text-sm text-destructive"
        >
          <Trash2 className="size-4" /> Apagar todo o histórico
        </button>
      )}
    </div>
  );
}
