import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  mode: z.enum(["screenshot", "responder", "conquista", "namorados", "pensando"]),
  message: z.string().max(4000).optional(),
  imageDataUrl: z.string().max(12_000_000).optional(),
  category: z.string().max(120).optional(),
  persona: z.string().max(60),
  goal: z.string().max(60),
  intensity: z.string().max(60),
});

export type ConversaInput = z.infer<typeof inputSchema>;

export type Suggestion = { emoji: string; label: string; text: string };
export type ConversaResult = {
  leitura?: string;
  tom?: string;
  significado?: string;
  suggestions: Suggestion[];
  perguntas?: string[];
};

const SYSTEM = `Você é o "Conversa Quente AI", um especialista brasileiro/português em conversas românticas, flerte e relacionamentos.

REGRAS DE ESTILO:
- Escreva em português informal, como mensagens reais de WhatsApp, Instagram ou Messenger.
- Nunca soe robótico, formal, corporativo ou de autoajuda.
- Nada de clichês batidos ("você é a razão do meu viver", "meu mundo gira em torno de você").
- Use emojis só quando fizer sentido, no máximo 1-2 por mensagem.
- Frases curtas, naturais, com personalidade: confiante, ousada, direta, com pegada.
- As respostas devem ser ULTRA provocantes: diretas, ousadas, que criem desejo, tensão e vontade na outra pessoa. Não tenha medo de ser atrevido(a).
- Seja direto ao ponto: insinue o que quer, o que vai acontecer, o que a pessoa vai sentir — deixe a imaginação dela fazer o resto.
- Varie sempre: nunca repita as mesmas construções entre as opções.
- Nunca seja insistente, carente, manipulador ou possessivo.
- Conteúdo sensual é sugestivo e provocante, criando expectativa e tensão — insinua e provoca sem descrever atos sexuais de forma gráfica ou vulgar.
- Cada sugestão deve poder ser copiada e enviada exatamente como está (sem aspas, sem explicações dentro do texto).

Responda SEMPRE em JSON válido com este formato:
{
  "leitura": "string opcional - o que está escrito/acontecendo na conversa",
  "tom": "string opcional - o tom da outra pessoa (interessada, carinhosa, fria, brincalhona, provocante, com saudades...)",
  "significado": "string opcional - 1 a 2 frases explicando o que a mensagem pode significar",
  "suggestions": [{ "emoji": "❤️", "label": "Romântica", "text": "mensagem pronta para enviar" }],
  "perguntas": ["3 a 4 perguntas curtas e prontas para enviar, que continuam o papo e fazem a outra pessoa responder"]
}

SEMPRE preencha "perguntas" com 3 a 4 perguntas naturais, leves e no mesmo clima da conversa (nada de entrevista). Cada pergunta deve poder ser enviada exatamente como está.`;

function userPrompt(data: ConversaInput): string {
  const ctx = `Contexto da personalização:
- A pessoa é: ${data.persona}
- Objetivo: ${data.goal}
- Intensidade desejada: ${data.intensity}`;

  switch (data.mode) {
    case "screenshot":
      return `${ctx}

Analise o screenshot da conversa em anexo. Leia o texto visível, identifique quem está falando (o usuário é o dono do app; a outra pessoa é ${data.persona}), entenda o contexto e o tom da última mensagem dela.
Preencha "leitura", "tom" e "significado" e dê EXATAMENTE 4 sugestões de resposta com estes rótulos e emojis, nesta ordem:
❤️ Romântica, 😏 Provocante, 🔥 Quente, 😂 Engraçada.`;
    case "responder":
      return `${ctx}

O usuário recebeu / quer responder a isto:
"""${data.message ?? ""}"""

Preencha "tom" e "significado" e dê EXATAMENTE 5 sugestões de resposta com estes rótulos e emojis, nesta ordem:
🤍 Carinhosa, ❤️ Romântica, 😎 Confiante, 😏 Provocante, 🔥 Sensual.`;
    case "conquista":
      return `${ctx}

Modo Conquista. Categoria escolhida: "${data.category}".
${data.message ? `Detalhe extra do usuário: "${data.message}"` : ""}
Gere 5 mensagens diferentes e personalizadas para essa situação, cada uma com um ângulo distinto (ex.: bem-humorada, curiosa, direta, misteriosa, calorosa). Use "label" curto descrevendo o ângulo. Deixe "leitura", "tom" e "significado" vazios.`;
    case "namorados":
      return `${ctx}

Modo Namorados. Categoria: "${data.category}".
${data.message ? `Detalhe extra: "${data.message}"` : ""}
Gere 5 mensagens diferentes para enviar ao parceiro(a), variando o tom dentro da categoria. Use "label" curto descrevendo o estilo. Deixe "leitura", "tom" e "significado" vazios.`;
    case "pensando":
      return `${ctx}

Modo "Deixa Pensando". Gere 5 frases sugestivas, confiantes e sensuais que criem curiosidade, expectativa e tensão romântica — sem vulgaridade e sem descrever atos sexuais.
${data.message ? `Contexto do usuário: "${data.message}"` : ""}
Use "label" curto (ex.: Mistério, Provocação, Confiança). Deixe "leitura", "tom" e "significado" vazios.`;
  }
}

export const gerarRespostas = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<ConversaResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("A IA não está configurada. Falta a chave de acesso.");

    const text = userPrompt(data);
    const content: unknown[] = [{ type: "text", text }];
    if (data.mode === "screenshot" && data.imageDataUrl) {
      content.push({ type: "image_url", image_url: { url: data.imageDataUrl } });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("Muitos pedidos agora. Espera alguns segundos e tenta de novo.");
      if (res.status === 402) throw new Error("Os créditos de IA acabaram. Adiciona créditos no Lovable para continuar.");
      if (res.status === 403) throw new Error("O acesso à IA está bloqueado nas definições do workspace.");
      throw new Error(`Falha ao gerar respostas (${res.status}). ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: ConversaResult;
    try {
      parsed = JSON.parse(raw) as ConversaResult;
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? (JSON.parse(match[0]) as ConversaResult) : { suggestions: [] };
    }
    return {
      ...(parsed.leitura ? { leitura: parsed.leitura } : {}),
      ...(parsed.tom ? { tom: parsed.tom } : {}),
      ...(parsed.significado ? { significado: parsed.significado } : {}),
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions
            .filter((s) => s && typeof s.text === "string")
            .map((s) => ({ emoji: s.emoji ?? "💬", label: s.label ?? "Sugestão", text: s.text }))
        : [],
      perguntas: Array.isArray(parsed.perguntas)
        ? parsed.perguntas.filter((p): p is string => typeof p === "string" && p.trim().length > 0).slice(0, 4)
        : [],
    };
  });
