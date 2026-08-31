import { cn } from "@/lib/utils";

export const PERSONAS = [
  "Namorada",
  "Namorado",
  "Crush",
  "Esposa",
  "Marido",
  "Pessoa que estou conhecendo",
];

export const GOALS = [
  "Fazer rir",
  "Demonstrar carinho",
  "Criar conexão",
  "Flertar",
  "Criar mistério",
  "Pedir desculpas",
  "Criar clima",
  "Marcar encontro",
];

export const INTENSITIES = ["😊 Leve", "😉 Flertante", "😏 Provocante", "🔥 Muito provocante"];

export type Prefs = { persona: string; goal: string; intensity: string };

export const defaultPrefs: Prefs = {
  persona: PERSONAS[0]!,
  goal: GOALS[2]!,
  intensity: INTENSITIES[3]!,
};

function Row({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={cn(
              "rounded-full border px-3.5 py-2 text-sm transition-all duration-200 active:scale-95",
              value === o
                ? "heat-gradient heat-glow border-transparent text-primary-foreground"
                : "border-border bg-secondary/50 text-secondary-foreground hover:bg-secondary",
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Personalizacao({
  prefs,
  onChange,
}: {
  prefs: Prefs;
  onChange: (p: Prefs) => void;
}) {
  return (
    <div className="surface-card animate-rise space-y-4 p-4">
      <Row
        label="Quem é a pessoa?"
        options={PERSONAS}
        value={prefs.persona}
        onChange={(persona) => onChange({ ...prefs, persona })}
      />
      <Row
        label="Qual é o objetivo?"
        options={GOALS}
        value={prefs.goal}
        onChange={(goal) => onChange({ ...prefs, goal })}
      />
      <Row
        label="Intensidade"
        options={INTENSITIES}
        value={prefs.intensity}
        onChange={(intensity) => onChange({ ...prefs, intensity })}
      />
    </div>
  );
}
