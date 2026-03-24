import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseClient } from "../lib/supabase.js";

const DEFAULT_SYSTEM_PROMPT = `Você é uma assistente virtual de atendimento de uma clínica de saúde via WhatsApp.

Suas responsabilidades:
- Responder dúvidas frequentes (horários, especialidades, convênios)
- Agendar, reagendar e cancelar consultas
- Confirmar presença em consultas agendadas
- Fornecer orientações pré e pós-consulta
- Encaminhar para atendimento humano quando necessário

Regras:
- Seja cordial, empática e profissional
- Respostas curtas e diretas (estilo WhatsApp)
- Use português brasileiro
- Se não souber algo, diga que vai verificar
- Nunca invente informações médicas
- Para emergências, oriente o paciente a ligar 192 (SAMU)`;

export class ConversationEngine {
  private static anthropic: Anthropic | null = null;

  private static getClient(): Anthropic {
    if (!this.anthropic) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");
      this.anthropic = new Anthropic({ apiKey });
    }
    return this.anthropic;
  }

  static async processMessage(
    conversationId: string,
    agentId: string,
    userMessage: string
  ): Promise<string | null> {
    const supabase = getSupabaseClient();

    // Get agent config
    const { data: agent } = await supabase
      .from("agents")
      .select("system_prompt, voice_config, features, languages")
      .eq("id", agentId)
      .single();

    const systemPrompt = agent?.system_prompt || DEFAULT_SYSTEM_PROMPT;

    // Get conversation history (last 20 messages for context)
    const { data: history } = await supabase
      .from("messages")
      .select("sender, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    // Build messages array for Anthropic
    const messages: Anthropic.MessageParam[] = (history || []).map((msg) => ({
      role: msg.sender === "patient" ? ("user" as const) : ("assistant" as const),
      content: msg.content,
    }));

    // Add the current message
    messages.push({ role: "user", content: userMessage });

    try {
      const client = this.getClient();
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: systemPrompt,
        messages,
      });

      const textBlock = response.content.find((b) => b.type === "text");
      return textBlock?.text || null;
    } catch (err) {
      console.error("Anthropic API error:", err);
      return "Desculpe, estou com uma dificuldade técnica no momento. Um atendente humano irá te ajudar em breve.";
    }
  }
}
