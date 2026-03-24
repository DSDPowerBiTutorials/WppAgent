import OpenAI from "openai";
import { getSupabaseClient } from "./supabase";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

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
  private static openai: OpenAI | null = null;
  private static MODEL = process.env.OPENAI_MODEL || "gpt-4.1";

  private static getClient(): OpenAI {
    if (!this.openai) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
      this.openai = new OpenAI({
        apiKey,
        baseURL: process.env.OPENAI_BASE_URL || undefined,
        timeout: 20_000,
      });
    }
    return this.openai;
  }

  private static async getSystemPrompt(agentId: string): Promise<string> {
    const supabase = getSupabaseClient();
    const { data: agent } = await supabase
      .from("agents")
      .select("system_prompt")
      .eq("id", agentId)
      .single();

    return agent?.system_prompt || DEFAULT_SYSTEM_PROMPT;
  }

  private static toOpenAIMessages(
    history: ChatMessage[]
  ): OpenAI.Responses.ResponseInputItem[] {
    return history
      .filter((m) => m.content.trim().length > 0)
      .map((m) => ({
        type: "message" as const,
        role: m.role,
        content: [
          {
            type: m.role === "assistant" ? ("output_text" as const) : ("input_text" as const),
            text: m.content,
          },
        ],
      }));
  }

  private static async generateReply(
    systemPrompt: string,
    messages: OpenAI.Responses.ResponseInputItem[]
  ): Promise<string | null> {
    try {
      const client = this.getClient();
      const response = await client.responses.create({
        model: this.MODEL,
        instructions: systemPrompt,
        input: messages,
        max_output_tokens: 500,
      });
      return response.output_text || null;
    } catch (err) {
      console.error("OpenAI API error:", err);
      return "Desculpe, estou com uma dificuldade técnica no momento. Um atendente humano irá te ajudar em breve.";
    }
  }

  static async processTestChat(
    agentId: string,
    history: ChatMessage[],
    userMessage: string
  ): Promise<string | null> {
    const systemPrompt = await this.getSystemPrompt(agentId);
    const messages = this.toOpenAIMessages([
      ...history,
      { role: "user", content: userMessage },
    ]);
    return this.generateReply(systemPrompt, messages);
  }

  static async processMessage(
    conversationId: string,
    agentId: string,
    userMessage: string
  ): Promise<string | null> {
    const supabase = getSupabaseClient();

    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    const messages: ChatMessage[] = (history || []).map((msg: any) => ({
      role: msg.role === "patient" ? ("user" as const) : ("assistant" as const),
      content: msg.content,
    }));

    return this.processTestChat(agentId, messages, userMessage);
  }
}
