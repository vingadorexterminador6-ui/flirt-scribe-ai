import type { ConversaResult, Suggestion } from "@/lib/conversa.functions";

/**
 * Banco de frases guardado no próprio aparelho.
 * Serve para o app continuar a funcionar sem internet nos modos de criação
 * (Conheci Alguém Novo, Conquista, Namorados e Deixa Pensando).
 */

type Bank = { emoji: string; label: string; make: (p: Ctx) => string }[];
type Ctx = { pessoa: string; categoria: string; detalhe: string };

const withDetail = (base: string, d: string) => (d ? `${base} ${d ? "" : ""}`.trim() : base);

const DIVERTIDO: Bank = [
  {
    emoji: "😂",
    label: "Engraçada",
    make: () =>
      "Tenho uma teoria: tu respondes rápido demais pra quem diz que tá ocupada. Vou fingir que não reparei 😂",
  },
  {
    emoji: "🙃",
    label: "Papo leve",
    make: () =>
      "Decisão importante do dia: pizza ou sushi? A tua resposta vai definir o futuro da nossa amizade.",
  },
  {
    emoji: "✨",
    label: "Chama atenção",
    make: () =>
      "Preciso de uma opinião sincera e não posso perguntar a mais ninguém. Tens dois minutos?",
  },
  {
    emoji: "😏",
    label: "Provocante",
    make: () => "Aviso já: eu não sou o tipo de papo que se responde com 'kk'. Vem com tudo.",
  },
  {
    emoji: "🔥",
    label: "Sensual",
    make: () =>
      "Fiquei a pensar numa coisa que tu disseste. E não foi de forma inocente, admito.",
  },
];

const CONQUISTA_BANK: Bank = [
  { emoji: "💬", label: "Direta", make: (p) => `Oi ${p.pessoa.toLowerCase()}... confessa: pensaste em mim hoje?` },
  { emoji: "😎", label: "Confiante", make: () => "Não vou fingir que isto é coincidência: queria mesmo falar contigo." },
  { emoji: "🤔", label: "Curiosa", make: () => "Tenho uma pergunta perigosa pra te fazer. Posso?" },
  { emoji: "😏", label: "Misteriosa", make: () => "Descobri uma coisa sobre ti hoje. Não vou contar já." },
  { emoji: "🔥", label: "Quente", make: () => "Se eu te disser o que me passou pela cabeça agora, tu coravas." },
];

const NAMORADOS_BANK: Bank = [
  { emoji: "🤍", label: "Carinho", make: (p) => `Acordei e a primeira coisa boa do dia foste tu, ${p.pessoa.toLowerCase()}.` },
  { emoji: "❤️", label: "Romântica", make: () => "Só queria dizer que a minha parte preferida do dia é quando te vejo." },
  { emoji: "😊", label: "Saudade", make: () => "A casa tá bem mais chata sem ti aqui. Vem depressa." },
  { emoji: "😏", label: "Provocante", make: () => "Tô a contar as horas. E não é pra conversar, só pra avisar." },
  { emoji: "🔥", label: "Quente", make: () => "Guarda energia pra logo. Vais precisar." },
];

const PENSANDO_BANK: Bank = [
  { emoji: "😏", label: "Mistério", make: () => "Depois te conto o que andei a pensar. Ou talvez te mostre." },
  { emoji: "🔥", label: "Provocação", make: () => "Fica aí a imaginar. É exatamente esse o plano." },
  { emoji: "😎", label: "Confiança", make: () => "Eu sei o efeito que causo em ti. E gosto." },
  { emoji: "💭", label: "Tensão", make: () => "Aposto que vais ler isto outra vez daqui a pouco." },
  { emoji: "🌙", label: "Boa noite", make: () => "Dorme bem. Se conseguires depois desta mensagem." },
];

const PERGUNTAS = [
  "Qual foi a melhor parte do teu dia?",
  "Confessa: o que te faz perder a paciência num papo?",
  "Se eu te chamasse agora pra sair, dizias sim?",
  "O que é que ninguém sabe sobre ti?",
];

const BANKS: Record<string, Bank> = {
  conhecer: DIVERTIDO,
  conquista: CONQUISTA_BANK,
  namorados: NAMORADOS_BANK,
  pensando: PENSANDO_BANK,
};

export const OFFLINE_MODES = Object.keys(BANKS);

export function canWorkOffline(mode: string) {
  return mode in BANKS;
}

export function gerarOffline(input: {
  mode: string;
  persona: string;
  category?: string;
  message?: string;
}): ConversaResult {
  const bank = BANKS[input.mode] ?? DIVERTIDO;
  const ctx: Ctx = {
    pessoa: input.persona,
    categoria: input.category ?? "",
    detalhe: input.message ?? "",
  };
  const suggestions: Suggestion[] = bank.map((b) => ({
    emoji: b.emoji,
    label: b.label,
    text: withDetail(b.make(ctx), ctx.detalhe),
  }));
  return {
    suggestions,
    perguntas: PERGUNTAS,
    ...(input.category ? { tom: `Modo offline · ${input.category}` } : { tom: "Modo offline" }),
  };
}
