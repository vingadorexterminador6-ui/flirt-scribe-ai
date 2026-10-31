import { useEffect, useState } from "react";
import { Download, Share2, X, Plus } from "lucide-react";
import { isAppInstalado } from "@/lib/appMode";

type PromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Botão de instalar o aplicativo (canto superior direito).
 * - Android/Chrome: abre o pedido nativo de instalação.
 * - iPhone/iPad: mostra como "Adicionar ao Ecrã Principal".
 * - Some quando o app já está instalado.
 */
export function BotaoInstalar() {
  const [promptEvent, setPromptEvent] = useState<PromptEvent | null>(null);
  const [instalado, setInstalado] = useState(false);
  const [ajuda, setAjuda] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setInstalado(isAppInstalado());
    const ua = window.navigator.userAgent;
    setIos(/iphone|ipad|ipod/i.test(ua) && !/crios/i.test(ua));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as PromptEvent);
    };
    const onInstalled = () => {
      setInstalado(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (instalado) return null;

  const clicar = async () => {
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") setInstalado(true);
      setPromptEvent(null);
      return;
    }
    setAjuda(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void clicar()}
        className="cool-gradient cool-glow flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-azul-foreground shadow transition-all active:scale-[0.97]"
        aria-label="Baixar o aplicativo"
      >
        <Download className="size-4" />
        Baixar app
      </button>

      {ajuda && (
        <div
          className="fixed inset-0 z-50 grid place-items-end bg-background/80 backdrop-blur-sm"
          onClick={() => setAjuda(false)}
        >
          <div
            className="surface-card animate-rise w-full space-y-4 rounded-b-none p-6 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-bold">Instalar no teu telemóvel</h2>
              <button
                type="button"
                onClick={() => setAjuda(false)}
                className="grid size-9 place-items-center rounded-full border border-border bg-secondary/50"
                aria-label="Fechar"
              >
                <X className="size-4" />
              </button>
            </div>
            {ios ? (
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-azul/15 text-azul-foreground ring-1 ring-azul/40">
                    <Share2 className="size-4" />
                  </span>
                  Toca no botão <strong className="text-foreground">Partilhar</strong> (na barra de
                  baixo do Safari).
                </li>
                <li className="flex items-center gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-azul/15 text-azul-foreground ring-1 ring-azul/40">
                    <Plus className="size-4" />
                  </span>
                  Escolhe <strong className="text-foreground">Adicionar ao Ecrã Principal</strong>.
                </li>
                <li className="flex items-center gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/40">
                    <Download className="size-4" />
                  </span>
                  Toca em <strong className="text-foreground">Adicionar</strong> — o app fica no teu
                  ecrã.
                </li>
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">
                O teu navegador ainda não mostrou o pedido de instalação. Abre o menu do navegador
                (os três pontos no canto) e escolhe{" "}
                <strong className="text-foreground">Instalar aplicativo</strong> ou{" "}
                <strong className="text-foreground">Adicionar ao ecrã principal</strong>.
              </p>
            )}
            <button
              type="button"
              onClick={() => setAjuda(false)}
              className="fusion-gradient heat-glow w-full rounded-2xl py-3.5 text-base font-semibold text-primary-foreground transition-all active:scale-[0.98]"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
