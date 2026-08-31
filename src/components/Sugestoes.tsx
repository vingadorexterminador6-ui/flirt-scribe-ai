import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { ConversaResult } from "@/lib/conversa.functions";
import { cn } from "@/lib/utils";

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          /* clipboard indisponível */
        }
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-all active:scale-95 hover:bg-secondary",
        done && "border-transparent heat-gradient text-primary-foreground",
        className,
      )}
    >
      {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {done ? "Copiado" : "Copiar resposta"}
    </button>
  );
}

export function Sugestoes({ result }: { result: ConversaResult }) {
  return (
    <div className="space-y-3">
      {(result.leitura || result.tom || result.significado) && (
        <div className="surface-card animate-rise space-y-2 p-4">
          {result.tom && (
            <p className="text-sm">
              <span className="text-muted-foreground">Tom detectado: </span>
              <span className="font-semibold heat-text">{result.tom}</span>
            </p>
          )}
          {result.leitura && <p className="text-sm text-muted-foreground">{result.leitura}</p>}
          {result.significado && <p className="text-sm text-foreground/90">{result.significado}</p>}
        </div>
      )}

      {result.suggestions.map((s, i) => (
        <div
          key={`${s.label}-${i}`}
          className="surface-card animate-rise space-y-3 p-4"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {s.emoji} {s.label}
          </p>
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{s.text}</p>
          <CopyButton text={s.text} />
        </div>
      ))}

      {result.perguntas && result.perguntas.length > 0 && (
        <div
          className="surface-card animate-rise space-y-3 p-4"
          style={{ animationDelay: `${result.suggestions.length * 60}ms` }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            💬 Próximas perguntas
          </p>
          <div className="space-y-2.5">
            {result.perguntas.map((p, i) => (
              <div key={`${p}-${i}`} className="flex items-start justify-between gap-3">
                <p className="text-[15px] leading-relaxed">{p}</p>
                <CopyButton text={p} className="shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
