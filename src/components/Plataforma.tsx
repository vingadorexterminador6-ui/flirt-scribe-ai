import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type Platform = {
  id: string;
  name: string;
  emoji: string;
  /** Estilo da plataforma para orientar a IA */
  style: string;
  /** Link para abrir o app já com o texto (quando suportado) */
  share?: (text: string) => string;
  /** Link para abrir o app (sem texto) */
  open: string;
};

export const PLATFORMS: Platform[] = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    emoji: "🟢",
    style: "mensagens diretas de WhatsApp, curtas, com áudio-vibe e emojis pontuais",
    share: (t) => `https://wa.me/?text=${encodeURIComponent(t)}`,
    open: "https://web.whatsapp.com/",
  },
  {
    id: "instagram",
    name: "Instagram",
    emoji: "📸",
    style: "DM de Instagram: leve, reagindo a stories e fotos, tom descontraído",
    open: "https://www.instagram.com/direct/inbox/",
  },
  {
    id: "telegram",
    name: "Telegram",
    emoji: "✈️",
    style: "Telegram: mensagens diretas e espirituosas",
    share: (t) => `https://t.me/share/url?url=&text=${encodeURIComponent(t)}`,
    open: "https://web.telegram.org/",
  },
  {
    id: "messenger",
    name: "Messenger",
    emoji: "💬",
    style: "Messenger: conversa próxima e informal",
    open: "https://www.messenger.com/",
  },
  {
    id: "tinder",
    name: "Tinder",
    emoji: "🔥",
    style: "match recente no Tinder: quebra-gelo ousado, sem intimidade que ainda não existe",
    open: "https://tinder.com/app/recs",
  },
  {
    id: "sms",
    name: "SMS",
    emoji: "📱",
    style: "SMS: frases curtas e diretas, poucos emojis",
    share: (t) => `sms:?&body=${encodeURIComponent(t)}`,
    open: "sms:",
  },
];

const KEY = "conversa-quente-plataforma";

export function usePlatform() {
  const [platformId, setPlatformId] = useState<string>(PLATFORMS[0]!.id);

  useEffect(() => {
    const saved = window.localStorage.getItem(KEY);
    if (saved && PLATFORMS.some((p) => p.id === saved)) setPlatformId(saved);
  }, []);

  const select = useCallback((id: string) => {
    setPlatformId(id);
    try {
      window.localStorage.setItem(KEY, id);
    } catch {
      /* storage indisponível */
    }
  }, []);

  const platform = PLATFORMS.find((p) => p.id === platformId) ?? PLATFORMS[0]!;
  return { platform, select };
}

export function PlataformaPicker({
  platform,
  onSelect,
}: {
  platform: Platform;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="surface-card animate-rise space-y-3 p-4">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Sincronizar com o app de conversas
        </p>
        <p className="text-xs text-muted-foreground/80">
          Escolhe a plataforma: o estilo adapta-se automaticamente e envias a resposta direto no app.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className={cn(
              "rounded-full border px-3.5 py-2 text-sm transition-all duration-200 active:scale-95",
              platform.id === p.id
                ? "cool-gradient cool-glow border-transparent text-primary-foreground"
                : "border-border bg-secondary/50 text-secondary-foreground hover:bg-secondary",
            )}
          >
            <span className="mr-1.5">{p.emoji}</span>
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
