import OpenAI from "openai";
import { getSupabaseClient } from "./supabase";
import { AGENT_TOOLS, executeTool, getActiveTools, type ToolContext } from "./agent-tools";
import { isClinicaConectaEnabled } from "./clinica-conecta";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AgentData {
  system_prompt: string;
  features: string[];
  feature_config: Record<string, any>;
  name: string;
  voice_config: Record<string, any>;
  operating_hours: Record<string, any> | null;
}

/** Additional context about the patient for personalized conversations */
export interface PatientContext {
  patientId: string;
  patientName: string;
  organizationId: string;
  conversationId: string;
}

const MAX_TOOL_ITERATIONS = 10;

const FEATURE_LABELS: Record<string, string> = {
  faq: "Dúvidas Frequentes (FAQ)",
  scheduling: "Agendamento de Consultas",
  absence_management: "Gestão de Faltas e Presenças",
  payments: "Pagamentos e Cobranças",
  case_management: "Gestão de Casos / Acompanhamento",
  pre_post_op: "Orientações Pré e Pós-Operatórias",
  eligibility: "Verificação de Elegibilidade de Convênios",
};

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

function buildFeatureInstructions(features: string[], config: Record<string, any>): string {
  if (!features || features.length === 0) return "";

  const sections: string[] = [];

  for (const feature of features) {
    const label = FEATURE_LABELS[feature] || feature;
    const cfg = config?.[feature];

    switch (feature) {
      case "faq": {
        const entries = cfg?.entries as Array<{ question: string; answer: string }> | undefined;
        if (entries && entries.length > 0) {
          const qaPairs = entries
            .map((e, i) => `  ${i + 1}. P: "${e.question}"\n     R: "${e.answer}"`)
            .join("\n");
          sections.push(
            `## ${label}\nVocê DEVE usar as respostas abaixo quando o paciente perguntar algo similar. Use estas respostas como base, podendo adaptar o tom mas mantendo a informação:\n${qaPairs}`
          );
        } else {
          sections.push(`## ${label}\nResponda dúvidas frequentes sobre a clínica com base no seu conhecimento geral.`);
        }
        break;
      }
      case "scheduling": {
        const parts: string[] = [];
        if (cfg?.specialties?.length) {
          parts.push(`- Especialidades disponíveis: ${cfg.specialties.join(", ")}`);
        }
        if (cfg?.slotDuration) {
          parts.push(`- Duração padrão da consulta: ${cfg.slotDuration} minutos`);
        }
        if (cfg?.advanceDays) {
          const maxDate = new Date();
          maxDate.setDate(maxDate.getDate() + cfg.advanceDays);
          const maxDateStr = maxDate.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
          parts.push(`- Agendamento permitido até ${maxDateStr} (${cfg.advanceDays} dias a partir de hoje). Qualquer data até essa data limite é VÁLIDA e deve ser aceita.`);
        }
        parts.push(`- Atende finais de semana: ${cfg?.allowWeekends ? "Sim" : "Não"}`);
        sections.push(
          `## ${label}\nVocê pode agendar, reagendar e cancelar consultas. Use estas regras:\n${parts.join("\n")}\nPergunte ao paciente a especialidade desejada, data e horário de preferência.`
        );
        break;
      }
      case "payments": {
        const parts: string[] = [];
        if (cfg?.methods?.length) {
          parts.push(`- Formas de pagamento aceitas: ${cfg.methods.join(", ")}`);
        }
        if (cfg?.instructions) {
          parts.push(`- Instruções: ${cfg.instructions}`);
        }
        sections.push(
          `## ${label}\nAuxilie o paciente com questões de pagamento:\n${parts.join("\n")}`
        );
        break;
      }
      case "absence_management": {
        const parts: string[] = [];
        if (cfg?.reminderHours) {
          parts.push(`- Enviar lembrete ${cfg.reminderHours}h antes da consulta`);
        }
        if (cfg?.maxReschedules) {
          parts.push(`- Máximo de ${cfg.maxReschedules} remarcações por consulta`);
        }
        sections.push(
          `## ${label}\nGerencie presenças e faltas:\n${parts.join("\n")}\nConfirme presença do paciente e informe sobre política de faltas.`
        );
        break;
      }
      case "case_management": {
        const parts: string[] = [];
        if (cfg?.autoFollowUpDays) {
          parts.push(`- Follow-up automático a cada ${cfg.autoFollowUpDays} dias`);
        }
        sections.push(
          `## ${label}\nAcompanhe casos de pacientes em tratamento:\n${parts.join("\n")}\nPergunte como o paciente está se sentindo e se há novos sintomas.`
        );
        break;
      }
      case "pre_post_op": {
        const parts: string[] = [];
        if (cfg?.preOpDays) {
          parts.push(`- Orientações pré-operatórias: ${cfg.preOpDays} dias antes`);
        }
        if (cfg?.postOpDays) {
          parts.push(`- Acompanhamento pós-operatório: ${cfg.postOpDays} dias depois`);
        }
        if (cfg?.checkInFrequency) {
          parts.push(`- Frequência de check-in: ${cfg.checkInFrequency}`);
        }
        sections.push(
          `## ${label}\nForneça orientações para pacientes com cirurgias:\n${parts.join("\n")}\nInforme sobre jejum, medicações a suspender, cuidados com curativos, etc.`
        );
        break;
      }
      case "eligibility": {
        const parts: string[] = [];
        if (cfg?.insurers?.length) {
          parts.push(`- Convênios aceitos: ${cfg.insurers.join(", ")}`);
        }
        sections.push(
          `## ${label}\nVerifique elegibilidade de convênios:\n${parts.join("\n")}\nPergunte o plano do paciente e informe se é aceito. Para planos não listados, oriente o paciente a verificar diretamente.`
        );
        break;
      }
      default:
        sections.push(`## ${label}\nFuncionalidade habilitada.`);
    }
  }

  return `\n\n---\n# FUNCIONALIDADES ATIVAS\nAbaixo estão as funcionalidades que você tem habilitadas. Utilize-as para responder ao paciente de forma precisa:\n\n${sections.join("\n\n")}`;
}

function buildVoiceInstructions(voiceConfig: Record<string, any> | undefined): string {
  if (!voiceConfig) return "";

  const parts: string[] = [];

  if (voiceConfig.personality) {
    const personalities: Record<string, string> = {
      formal: "Use tom formal e respeitoso.",
      friendly: "Use tom amigável e acolhedor.",
      empathetic: "Use tom empático e compreensivo.",
      professional: "Use tom profissional e objetivo.",
    };
    parts.push(personalities[voiceConfig.personality] || "");
  }

  if (voiceConfig.tone !== undefined) {
    if (voiceConfig.tone < 30) parts.push("Seja mais sóbrio e direto nas respostas.");
    else if (voiceConfig.tone > 70) parts.push("Seja mais caloroso e expressivo nas respostas.");
  }

  if (voiceConfig.speed !== undefined) {
    if (voiceConfig.speed < 30) parts.push("Dê respostas mais detalhadas e elaboradas.");
    else if (voiceConfig.speed > 70) parts.push("Dê respostas mais curtas e objetivas.");
  }

  const validParts = parts.filter(Boolean);
  return validParts.length > 0
    ? `\n\n# TOM DE VOZ\n${validParts.join("\n")}`
    : "";
}

function buildOperatingHoursInstructions(hours: Record<string, any> | null): string {
  if (!hours?.schedule) return "";

  const dayNames: Record<string, string> = {
    monday: "Segunda", tuesday: "Terça", wednesday: "Quarta",
    thursday: "Quinta", friday: "Sexta", saturday: "Sábado", sunday: "Domingo",
  };

  const schedule = Object.entries(hours.schedule)
    .filter(([, v]) => v !== null)
    .map(([day, v]: [string, any]) => `- ${dayNames[day] || day}: ${v.start} às ${v.end}`)
    .join("\n");

  if (!schedule) return "";

  let text = `\n\n# HORÁRIO DE FUNCIONAMENTO\n${schedule}`;
  if (hours.timezone) {
    text += `\nFuso: ${hours.timezone}`;
  }
  if (hours.outsideMessage) {
    text += `\nMensagem fora do horário: "${hours.outsideMessage}"`;
  }
  return text;
}

function buildClinicaConectaInstructions(): string {
  if (!isClinicaConectaEnabled()) return "";

  return `\n\n---\n# INTEGRAÇÃO CLÍNICA CONECTA
Use ferramentas cc_* para dados reais. NUNCA invente horários ou nomes.
Confirme dados antes de executar ações. Guarde IDs (especialidade, profissional, paciente) mencionados na conversa para reutilizar nas chamadas seguintes.

## Fluxo de agendamento
cc_list_specialties → cc_list_professionals(specialty_id) → cc_check_available_dates(professional_id) → cc_check_availability(professional_id, date) → cc_create_appointment.

## Regras críticas
- NUNCA re-pergunte informações que o paciente já forneceu (especialidade, data, profissional). Extraia do contexto da conversa.
- Se o paciente já disse a especialidade, data ou profissional, AVANCE para o próximo passo da ferramenta sem perguntar novamente.
- Quando houver MÚLTIPLOS profissionais, apresente TODOS com numeração para o paciente escolher. Nunca omita profissionais.
- Se o paciente confirma com "sim", "ok", "pode ser", etc., prossiga com a ação — não reinicie o fluxo.
- Ao buscar especialidades, nomes são parecidos (ex: "Ortopedia" vs "Ortopedia e Traumatologia"). Se cc_list_professionals retornar vazio, tente especialidades com nomes similares antes de dizer que não há profissionais.
- Sempre chame a ferramenta junto com a mensagem — nunca diga "vou verificar" sem chamar.
- Quando precisar do ID de um profissional/especialidade já mencionado, use cc_list_professionals ou cc_list_specialties para obtê-lo novamente se necessário, sem perguntar ao paciente.`;
}

export class ConversationEngine {
  private static openai: OpenAI | null = null;
  private static MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  private static getClient(): OpenAI {
    if (!this.openai) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
      this.openai = new OpenAI({
        apiKey,
        baseURL: process.env.OPENAI_BASE_URL || undefined,
        timeout: 55_000,
      });
    }
    return this.openai;
  }

  private static async getSystemPrompt(agentId: string, patient?: PatientContext): Promise<string> {
    const supabase = getSupabaseClient();
    const { data: agent } = await supabase
      .from("agents")
      .select("system_prompt, features, feature_config, name, voice_config, operating_hours")
      .eq("id", agentId)
      .single();

    if (!agent) return DEFAULT_SYSTEM_PROMPT;

    const basePrompt = agent.system_prompt || DEFAULT_SYSTEM_PROMPT;
    const featureInstructions = buildFeatureInstructions(
      agent.features || [],
      agent.feature_config || {}
    );
    const voiceInstructions = buildVoiceInstructions(agent.voice_config);
    const hoursInstructions = buildOperatingHoursInstructions(agent.operating_hours);

    let patientInstructions = "";
    if (patient) {
      patientInstructions = `\n\n# CONTEXTO DO PACIENTE\nVocê está conversando com **${patient.patientName}**.\n- Chame o paciente pelo nome.\n- ID do paciente: ${patient.patientId}\n- Use as ferramentas disponíveis para consultar informações e executar ações no sistema (agendar, cancelar, remarcar consultas, etc.).\n- Sempre confirme os dados com o paciente antes de executar uma ação.`;
    }

    // Inject current date so the model knows "today"
    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "America/Sao_Paulo" });
    const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
    const currentDateInstruction = `\n\n# DATA E HORA ATUAL\nHoje é ${dateStr}, ${timeStr} (horário de Brasília).`;

    return `${basePrompt}${currentDateInstruction}${patientInstructions}${featureInstructions}${voiceInstructions}${hoursInstructions}${buildClinicaConectaInstructions()}`;
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
    messages: OpenAI.Responses.ResponseInputItem[],
    toolCtx?: ToolContext
  ): Promise<string | null> {
    try {
      const client = this.getClient();
      const useTools = !!toolCtx;

      const activeTools = getActiveTools();
      console.log(`[ConversationEngine] Starting reply. useTools=${useTools}, toolCount=${activeTools.length}, model=${this.MODEL}`);
      let input = [...messages];

      for (let i = 0; i < (useTools ? MAX_TOOL_ITERATIONS : 1); i++) {
        console.log(`[ConversationEngine] Iteration ${i + 1}/${useTools ? MAX_TOOL_ITERATIONS : 1}, input items: ${input.length}`);

        // Call OpenAI with retry on 429 rate limit
        let response: any = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            response = await client.responses.create({
              model: this.MODEL,
              instructions: systemPrompt,
              input,
              max_output_tokens: 1024,
              ...(useTools ? { tools: activeTools as any } : {}),
            });
            break;
          } catch (apiErr: any) {
            if (apiErr?.status === 429 && attempt < 2) {
              const retryAfter = parseFloat(apiErr?.headers?.["retry-after"]) || (5 * (attempt + 1));
              console.log(`[ConversationEngine] Rate limited (429). Retrying in ${retryAfter}s...`);
              await new Promise(r => setTimeout(r, retryAfter * 1000));
              continue;
            }
            throw apiErr;
          }
        }
        if (!response) throw new Error("OpenAI API failed after 3 retries");

        console.log(`[ConversationEngine] OpenAI responded. output items: ${response.output.length}`);

        // Check if model wants to call tools
        const toolCalls = response.output.filter(
          (item: any) => item.type === "function_call"
        );

        if (toolCalls.length === 0) {
          // No tool calls → return text
          console.log(`[ConversationEngine] No tool calls, returning text (${(response.output_text || '').length} chars)`);
          return response.output_text || null;
        }

        // Execute all tool calls and feed results back
        console.log(`[ConversationEngine] ${toolCalls.length} tool call(s): ${toolCalls.map((c: any) => c.name).join(', ')}`);
        const toolOutputs: OpenAI.Responses.ResponseInputItem[] = [];
        for (const call of toolCalls) {
          const fc = call as any;
          const args = JSON.parse(fc.arguments || "{}");

          console.log(`[Tool] ${fc.name}(${JSON.stringify(args).slice(0, 200)})`);
          const result = await executeTool(fc.name, args, toolCtx!);
          console.log(`[Tool] ${fc.name} → ${result.slice(0, 200)}`);

          toolOutputs.push({
            type: "function_call_output" as const,
            call_id: fc.call_id,
            output: result,
          });
        }

        // Append response output + all tool results once
        input = [
          ...input,
          ...(response.output as any),
          ...toolOutputs,
        ];
      }

      // If we exhausted iterations, return last known text or fallback
      console.log(`[ConversationEngine] Exhausted ${MAX_TOOL_ITERATIONS} iterations`);
      return "Desculpe, estou com dificuldade para processar sua solicitação. Um atendente irá te ajudar.";
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const errCode = err?.code || err?.status || "unknown";
      const errType = err?.constructor?.name || "Error";
      console.error(`[ConversationEngine] Error (type=${errType}, code=${errCode}): ${errMsg}`);
      if (err?.stack) console.error(err.stack);
      // Include error details in response for debugging (will remove later)
      return `Desculpe, estou com uma dificuldade técnica no momento. Um atendente humano irá te ajudar em breve.`;
    }
  }

  static async processTestChat(
    agentId: string,
    history: ChatMessage[],
    userMessage: string
  ): Promise<string | null> {
    let systemPrompt = await this.getSystemPrompt(agentId);
    // Strip CC integration instructions since tools are not available in test mode
    systemPrompt = systemPrompt.replace(/\n\n---\n# INTEGRAÇÃO CLÍNICA CONECTA[\s\S]*$/, "");
    const messages = this.toOpenAIMessages([
      ...history,
      { role: "user", content: userMessage },
    ]);
    return this.generateReply(systemPrompt, messages);
  }

  static async processMessage(
    conversationId: string,
    agentId: string,
    userMessage: string,
    patient?: PatientContext
  ): Promise<string | null> {
    const supabase = getSupabaseClient();

    // Load the most recent 20 messages (descending) then reverse to chronological order
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(20);

    const messages: ChatMessage[] = (history || []).reverse().map((msg: any) => ({
      role: msg.role === "patient" ? ("user" as const) : ("assistant" as const),
      content: msg.content,
    }));

    // The user message is already stored in the DB by the caller,
    // so it's included in the loaded history. Don't append it again.
    const systemPrompt = await this.getSystemPrompt(agentId, patient);
    const openaiMessages = this.toOpenAIMessages(messages);

    // Use tools only when we have patient context (real WhatsApp conversation)
    const toolCtx = patient
      ? {
          organizationId: patient.organizationId,
          patientId: patient.patientId,
          conversationId,
        }
      : undefined;

    return this.generateReply(systemPrompt, openaiMessages, toolCtx);
  }
}
