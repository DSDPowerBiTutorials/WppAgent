import Anthropic from "@anthropic-ai/sdk";
import type { TestChatMessage } from "@repo/shared/types";
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
  private static MODEL = "claude-sonnet-4-20250514";

  private static getClient(): Anthropic {
    if (!this.anthropic) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");
      this.anthropic = new Anthropic({ apiKey });
    }
    return this.anthropic;
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

  private static toAnthropicMessages(history: TestChatMessage[]): Anthropic.MessageParam[] {
    return history
      .filter((message) => message.content.trim().length > 0)
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));
  }

  private static async generateReply(
    systemPrompt: string,
    messages: Anthropic.MessageParam[]
  ): Promise<string | null> {
    try {
      const client = this.getClient();
      const response = await client.messages.create({
        model: this.MODEL,
        max_tokens: 500,
        system: systemPrompt,
        messages,
      });

      const textBlock = response.content.find((block) => block.type === "text");
      return textBlock?.text || null;
    } catch (err) {
      console.error("Anthropic API error:", err);
      return "Desculpe, estou com uma dificuldade técnica no momento. Um atendente humano irá te ajudar em breve.";
    }
  }

  static async processTestChat(
    agentId: string,
    history: TestChatMessage[],
    userMessage: string
  ): Promise<string | null> {
    const systemPrompt = await this.getSystemPrompt(agentId);
    const messages = this.toAnthropicMessages([
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

    // Get conversation history (last 20 messages for context)
    const { data: history } = await supabase
      .from("messages")
      .select("sender, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    const messages: TestChatMessage[] = (history || []).map((msg) => ({
      role: msg.sender === "patient" ? "user" : "assistant",
      content: msg.content,
    }));

    return this.processTestChat(agentId, messages, userMessage);
  }
}
