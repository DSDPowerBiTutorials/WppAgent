import { getSupabaseClient } from "./supabase";
import { isClinicaConectaEnabled } from "./clinica-conecta";
import { CLINICA_CONECTA_TOOLS, executeClinicaConectaTool } from "./clinica-conecta/tools";

// ─── Context passed to every tool execution ──────────────────
export interface ToolContext {
  organizationId: string;
  patientId: string;
  conversationId: string;
}

// ─── OpenAI function-tool definitions ────────────────────────
export const AGENT_TOOLS = [
  {
    type: "function" as const,
    name: "get_patient_info",
    description:
      "Retorna informações do paciente atual: nome, telefone, e-mail, data de nascimento, CPF e anotações.",
    parameters: {
      type: "object" as const,
      properties: {},
      required: [] as string[],
    },
  },
  {
    type: "function" as const,
    name: "get_patient_appointments",
    description:
      "Lista as próximas consultas agendadas do paciente. Use para informar o paciente sobre suas consultas.",
    parameters: {
      type: "object" as const,
      properties: {
        include_past: {
          type: "boolean" as const,
          description: "Se true, inclui consultas passadas (últimos 30 dias). Padrão false.",
        },
      },
      required: [] as string[],
    },
  },
  {
    type: "function" as const,
    name: "check_availability",
    description:
      "Verifica horários disponíveis para agendamento em uma especialidade e data específica.",
    parameters: {
      type: "object" as const,
      properties: {
        specialty: {
          type: "string" as const,
          description: "Especialidade médica desejada (ex: Cardiologia, Ortopedia)",
        },
        date: {
          type: "string" as const,
          description: "Data desejada no formato YYYY-MM-DD",
        },
      },
      required: ["specialty", "date"] as string[],
    },
  },
  {
    type: "function" as const,
    name: "schedule_appointment",
    description:
      "Agenda uma nova consulta para o paciente. Confirme todos os dados com o paciente antes de agendar.",
    parameters: {
      type: "object" as const,
      properties: {
        specialty: { type: "string" as const, description: "Especialidade médica" },
        doctor_name: { type: "string" as const, description: "Nome do médico" },
        date: { type: "string" as const, description: "Data no formato YYYY-MM-DD" },
        time: { type: "string" as const, description: "Horário no formato HH:MM" },
        duration_minutes: {
          type: "number" as const,
          description: "Duração em minutos (padrão 30)",
        },
        notes: { type: "string" as const, description: "Observações adicionais" },
      },
      required: ["specialty", "doctor_name", "date", "time"] as string[],
    },
  },
  {
    type: "function" as const,
    name: "cancel_appointment",
    description:
      "Cancela uma consulta existente do paciente. Peça confirmação antes de cancelar.",
    parameters: {
      type: "object" as const,
      properties: {
        appointment_id: {
          type: "string" as const,
          description: "ID da consulta a cancelar",
        },
        reason: {
          type: "string" as const,
          description: "Motivo do cancelamento",
        },
      },
      required: ["appointment_id"] as string[],
    },
  },
  {
    type: "function" as const,
    name: "reschedule_appointment",
    description:
      "Remarca uma consulta existente para nova data/horário.",
    parameters: {
      type: "object" as const,
      properties: {
        appointment_id: {
          type: "string" as const,
          description: "ID da consulta a remarcar",
        },
        new_date: {
          type: "string" as const,
          description: "Nova data no formato YYYY-MM-DD",
        },
        new_time: {
          type: "string" as const,
          description: "Novo horário no formato HH:MM",
        },
      },
      required: ["appointment_id", "new_date", "new_time"] as string[],
    },
  },
  {
    type: "function" as const,
    name: "confirm_appointment",
    description:
      "Confirma a presença do paciente em uma consulta agendada.",
    parameters: {
      type: "object" as const,
      properties: {
        appointment_id: {
          type: "string" as const,
          description: "ID da consulta a confirmar",
        },
      },
      required: ["appointment_id"] as string[],
    },
  },
  {
    type: "function" as const,
    name: "transfer_to_human",
    description:
      "Transfere a conversa para um atendente humano. Use quando não puder resolver o pedido do paciente.",
    parameters: {
      type: "object" as const,
      properties: {
        reason: {
          type: "string" as const,
          description: "Motivo da transferência",
        },
      },
      required: ["reason"] as string[],
    },
  },
  {
    type: "function" as const,
    name: "search_exams",
    description:
      "Busca exames e procedimentos disponíveis na clínica pelo nome ou categoria. Use quando o paciente perguntar sobre exames, procedimentos ou serviços disponíveis.",
    parameters: {
      type: "object" as const,
      properties: {
        query: {
          type: "string" as const,
          description: "Nome ou parte do nome do exame (ex: 'ultrassonografia', 'hemograma', 'raio x')",
        },
        category: {
          type: "string" as const,
          description: "Categoria: 'coleta' (sangue/urina), 'imagem', 'ginecologicos', 'outros'",
          enum: ["coleta", "imagem", "ginecologicos", "outros"],
        },
      },
      required: [] as string[],
    },
  },
  {
    type: "function" as const,
    name: "get_exam_details",
    description:
      "Retorna detalhes completos de um exame: preparo necessário, se precisa de pedido médico, e observações. Use quando o paciente perguntar sobre preparo ou requisitos de um exame específico.",
    parameters: {
      type: "object" as const,
      properties: {
        exam_name: {
          type: "string" as const,
          description: "Nome exato ou aproximado do exame",
        },
      },
      required: ["exam_name"] as string[],
    },
  },
] as const;

// ─── Active tools (local + Clínica Conecta when configured) ──
export function getActiveTools() {
  if (isClinicaConectaEnabled()) {
    return [...AGENT_TOOLS, ...CLINICA_CONECTA_TOOLS];
  }
  return [...AGENT_TOOLS];
}

// ─── Tool executor ──────────────────────────────────────────
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<string> {
  // Delegate cc_* tools to Clínica Conecta executor, with automatic local fallback
  if (name.startsWith("cc_")) {
    try {
      const result = await executeClinicaConectaTool(name, args);
      // Check if the result is an error that should trigger local fallback
      const parsed = JSON.parse(result);
      if (parsed.error) {
        const localFallback = ccToLocalFallback(name, args, ctx);
        if (localFallback) {
          console.log(`[CC Fallback] ${name} failed, falling back to local tool`);
          return executeTool(localFallback.name, localFallback.args, ctx);
        }
      }
      return result;
    } catch {
      const localFallback = ccToLocalFallback(name, args, ctx);
      if (localFallback) {
        console.log(`[CC Fallback] ${name} threw, falling back to local tool`);
        return executeTool(localFallback.name, localFallback.args, ctx);
      }
      return JSON.stringify({ error: "Sistema externo indisponível" });
    }
  }

  const supabase = getSupabaseClient();

  switch (name) {
    // ── Patient info ──────────────────────────────────────
    case "get_patient_info": {
      const { data } = await supabase
        .from("patients")
        .select("name, phone, email, date_of_birth, cpf, notes")
        .eq("id", ctx.patientId)
        .single();

      if (!data) return JSON.stringify({ error: "Paciente não encontrado" });
      return JSON.stringify(data);
    }

    // ── Appointments list ─────────────────────────────────
    case "get_patient_appointments": {
      const includePast = args.include_past === true;
      const now = new Date().toISOString().split("T")[0];

      let query = supabase
        .from("appointments")
        .select("id, doctor_name, specialty, date, time, duration_minutes, status, notes")
        .eq("patient_id", ctx.patientId)
        .eq("organization_id", ctx.organizationId)
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      if (includePast) {
        const past = new Date();
        past.setDate(past.getDate() - 30);
        query = query.gte("date", past.toISOString().split("T")[0]);
      } else {
        query = query.gte("date", now).in("status", ["pending", "confirmed"]);
      }

      const { data } = await query.limit(10);
      if (!data || data.length === 0)
        return JSON.stringify({ message: "Nenhuma consulta encontrada" });
      return JSON.stringify(data);
    }

    // ── Check availability ────────────────────────────────
    case "check_availability": {
      const specialty = args.specialty as string;
      const date = args.date as string;

      // Get existing appointments for that specialty + date
      const { data: booked } = await supabase
        .from("appointments")
        .select("time, duration_minutes")
        .eq("organization_id", ctx.organizationId)
        .eq("specialty", specialty)
        .eq("date", date)
        .in("status", ["pending", "confirmed"]);

      const bookedTimes = new Set((booked || []).map((a) => a.time));

      // Generate available slots (08:00–18:00, 30 min intervals)
      const slots: string[] = [];
      for (let h = 8; h < 18; h++) {
        for (const m of ["00", "30"]) {
          const slot = `${String(h).padStart(2, "0")}:${m}`;
          if (!bookedTimes.has(slot)) slots.push(slot);
        }
      }

      return JSON.stringify({
        specialty,
        date,
        available_slots: slots,
        total_available: slots.length,
      });
    }

    // ── Schedule appointment ──────────────────────────────
    case "schedule_appointment": {
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          organization_id: ctx.organizationId,
          patient_id: ctx.patientId,
          conversation_id: ctx.conversationId,
          specialty: args.specialty as string,
          doctor_name: args.doctor_name as string,
          date: args.date as string,
          time: args.time as string,
          duration_minutes: (args.duration_minutes as number) || 30,
          status: "pending",
          notes: (args.notes as string) || null,
        })
        .select("id, specialty, doctor_name, date, time, status")
        .single();

      if (error)
        return JSON.stringify({ error: "Falha ao agendar: " + error.message });

      // Log analytics event
      await supabase.from("analytics_events").insert({
        organization_id: ctx.organizationId,
        event_type: "appointment_scheduled",
        payload: { appointment_id: data.id, patient_id: ctx.patientId },
      });

      return JSON.stringify({
        success: true,
        appointment: data,
        message: "Consulta agendada com sucesso",
      });
    }

    // ── Cancel appointment ────────────────────────────────
    case "cancel_appointment": {
      const appointmentId = args.appointment_id as string;

      // Verify appointment belongs to patient
      const { data: apt } = await supabase
        .from("appointments")
        .select("id, status, patient_id")
        .eq("id", appointmentId)
        .eq("patient_id", ctx.patientId)
        .single();

      if (!apt)
        return JSON.stringify({ error: "Consulta não encontrada para este paciente" });
      if (apt.status === "cancelled")
        return JSON.stringify({ error: "Consulta já está cancelada" });

      const { error } = await supabase
        .from("appointments")
        .update({
          status: "cancelled",
          notes: args.reason
            ? `Cancelado: ${args.reason}`
            : "Cancelado pelo paciente via WhatsApp",
        })
        .eq("id", appointmentId);

      if (error)
        return JSON.stringify({ error: "Falha ao cancelar: " + error.message });

      await supabase.from("analytics_events").insert({
        organization_id: ctx.organizationId,
        event_type: "appointment_cancelled",
        payload: { appointment_id: appointmentId, patient_id: ctx.patientId },
      });

      return JSON.stringify({ success: true, message: "Consulta cancelada" });
    }

    // ── Reschedule appointment ────────────────────────────
    case "reschedule_appointment": {
      const appointmentId = args.appointment_id as string;

      const { data: apt } = await supabase
        .from("appointments")
        .select("id, status, patient_id")
        .eq("id", appointmentId)
        .eq("patient_id", ctx.patientId)
        .single();

      if (!apt)
        return JSON.stringify({ error: "Consulta não encontrada para este paciente" });

      const { error } = await supabase
        .from("appointments")
        .update({
          date: args.new_date as string,
          time: args.new_time as string,
          status: "pending",
        })
        .eq("id", appointmentId);

      if (error)
        return JSON.stringify({ error: "Falha ao remarcar: " + error.message });

      await supabase.from("analytics_events").insert({
        organization_id: ctx.organizationId,
        event_type: "appointment_rescheduled",
        payload: { appointment_id: appointmentId, patient_id: ctx.patientId },
      });

      return JSON.stringify({
        success: true,
        message: `Consulta remarcada para ${args.new_date} às ${args.new_time}`,
      });
    }

    // ── Confirm appointment ───────────────────────────────
    case "confirm_appointment": {
      const appointmentId = args.appointment_id as string;

      const { data: apt } = await supabase
        .from("appointments")
        .select("id, status, patient_id")
        .eq("id", appointmentId)
        .eq("patient_id", ctx.patientId)
        .single();

      if (!apt)
        return JSON.stringify({ error: "Consulta não encontrada para este paciente" });

      const { error } = await supabase
        .from("appointments")
        .update({ status: "confirmed" })
        .eq("id", appointmentId);

      if (error)
        return JSON.stringify({ error: "Falha ao confirmar: " + error.message });

      await supabase.from("analytics_events").insert({
        organization_id: ctx.organizationId,
        event_type: "appointment_confirmed",
        payload: { appointment_id: appointmentId, patient_id: ctx.patientId },
      });

      return JSON.stringify({ success: true, message: "Presença confirmada" });
    }

    // ── Transfer to human ─────────────────────────────────
    case "transfer_to_human": {
      const { error } = await supabase
        .from("conversations")
        .update({ status: "waiting_human" })
        .eq("id", ctx.conversationId);

      if (error)
        return JSON.stringify({ error: "Falha ao transferir: " + error.message });

      await supabase.from("analytics_events").insert({
        organization_id: ctx.organizationId,
        event_type: "human_takeover",
        payload: {
          conversation_id: ctx.conversationId,
          reason: args.reason,
          patient_id: ctx.patientId,
        },
      });

      return JSON.stringify({
        success: true,
        message: "Conversa transferida para atendente humano",
      });
    }

    // ── Search exams catalog ──────────────────────────────
    case "search_exams": {
      const query = args.query as string | undefined;
      const category = args.category as string | undefined;

      let q = supabase
        .from("exams_catalog")
        .select("id, name, category, requires_medical_order")
        .eq("organization_id", ctx.organizationId)
        .eq("active", true)
        .order("name")
        .limit(15);

      if (query) {
        q = q.ilike("name", `%${query}%`);
      }
      if (category) {
        q = q.eq("category", category);
      }

      const { data, error } = await q;

      if (error)
        return JSON.stringify({ error: "Falha na busca: " + error.message });
      if (!data || data.length === 0)
        return JSON.stringify({ message: "Nenhum exame encontrado com esse critério" });

      return JSON.stringify({ results: data, total: data.length });
    }

    // ── Get exam details / preparation ────────────────────
    case "get_exam_details": {
      const examName = args.exam_name as string;

      const { data } = await supabase
        .from("exams_catalog")
        .select("name, category, preparation, requires_medical_order, medical_order_notes")
        .eq("organization_id", ctx.organizationId)
        .eq("active", true)
        .ilike("name", `%${examName}%`)
        .limit(5);

      if (!data || data.length === 0)
        return JSON.stringify({ error: "Exame não encontrado" });

      return JSON.stringify({ exams: data });
    }

    default:
      return JSON.stringify({ error: `Tool "${name}" não reconhecida` });
  }
}

// ─── CC → Local tool fallback mapping ────────────────────────
function ccToLocalFallback(
  ccName: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): { name: string; args: Record<string, unknown> } | null {
  switch (ccName) {
    case "cc_check_availability":
      return {
        name: "check_availability",
        args: { specialty: (args.specialty as string) || "Clínica Geral", date: args.date as string },
      };
    case "cc_create_appointment":
      return {
        name: "schedule_appointment",
        args: {
          specialty: (args.specialty as string) || "Clínica Geral",
          doctor_name: (args.professional_name as string) || (args.professional_id as string) || "Médico",
          date: args.date_key as string,
          time: args.time as string,
          notes: args.notes as string,
        },
      };
    case "cc_cancel_appointment":
      return { name: "cancel_appointment", args: { appointment_id: args.appointment_id as string, reason: args.cancelled_by as string } };
    case "cc_reschedule_appointment":
      return { name: "reschedule_appointment", args: { appointment_id: args.appointment_id as string, new_date: args.new_date as string, new_time: args.new_time as string } };
    case "cc_confirm_appointment":
      return { name: "confirm_appointment", args: { appointment_id: args.appointment_id as string } };
    case "cc_list_appointments":
      return { name: "get_patient_appointments", args: { include_past: false } };
    case "cc_get_patient":
    case "cc_search_patients":
      return { name: "get_patient_info", args: {} };
    default:
      return null;
  }
}
