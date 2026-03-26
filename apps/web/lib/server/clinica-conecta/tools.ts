import { getClinicaConectaClient } from "./index";

// ─── Clínica Conecta Tool Definitions (OpenAI function calling) ──

export const CLINICA_CONECTA_TOOLS = [
  {
    type: "function" as const,
    name: "cc_search_patients",
    description: "Busca pacientes por nome, CPF ou telefone.",
    parameters: {
      type: "object" as const,
      properties: {
        q: {
          type: "string" as const,
          description: "Termo de busca (nome, CPF ou telefone do paciente)",
        },
        limit: {
          type: "number" as const,
          description: "Número máximo de resultados (padrão 10)",
        },
      },
      required: ["q"] as string[],
    },
  },
  {
    type: "function" as const,
    name: "cc_get_patient",
    description: "Retorna detalhes do paciente pelo ID.",
    parameters: {
      type: "object" as const,
      properties: {
        patient_id: {
          type: "string" as const,
          description: "ID do paciente no sistema",
        },
      },
      required: ["patient_id"] as string[],
    },
  },
  {
    type: "function" as const,
    name: "cc_create_patient",
    description: "Cadastra novo paciente. Confirme dados antes.",
    parameters: {
      type: "object" as const,
      properties: {
        name: { type: "string" as const, description: "Nome completo do paciente" },
        cpf: { type: "string" as const, description: "CPF do paciente" },
        phone: { type: "string" as const, description: "Telefone com DDD" },
        email: { type: "string" as const, description: "E-mail do paciente" },
        date_of_birth: { type: "string" as const, description: "Data de nascimento YYYY-MM-DD" },
        gender: { type: "string" as const, description: "Sexo: masculino, feminino, outro" },
      },
      required: ["name"] as string[],
    },
  },
  {
    type: "function" as const,
    name: "cc_list_appointments",
    description: "Lista agendamentos com filtros de data, profissional, paciente e status.",
    parameters: {
      type: "object" as const,
      properties: {
        date_from: { type: "string" as const, description: "Data início (YYYY-MM-DD)" },
        date_to: { type: "string" as const, description: "Data fim (YYYY-MM-DD)" },
        professional_id: { type: "string" as const, description: "ID do profissional" },
        patient_id: { type: "string" as const, description: "ID do paciente" },
        status: {
          type: "string" as const,
          description: "Status do agendamento (ex: pending, confirmed, cancelled)",
        },
      },
      required: [] as string[],
    },
  },
  {
    type: "function" as const,
    name: "cc_create_appointment",
    description: "Agenda consulta. Confirme dados antes.",
    parameters: {
      type: "object" as const,
      properties: {
        patient_id: { type: "string" as const, description: "ID do paciente" },
        professional_id: { type: "string" as const, description: "ID do profissional" },
        date_key: { type: "string" as const, description: "Data da consulta (YYYY-MM-DD)" },
        time: { type: "string" as const, description: "Horário (HH:MM)" },
        notes: { type: "string" as const, description: "Observações adicionais" },
      },
      required: ["patient_id", "professional_id", "date_key", "time"] as string[],
    },
  },
  {
    type: "function" as const,
    name: "cc_confirm_appointment",
    description: "Confirma presença em agendamento.",
    parameters: {
      type: "object" as const,
      properties: {
        appointment_id: {
          type: "string" as const,
          description: "ID do agendamento",
        },
      },
      required: ["appointment_id"] as string[],
    },
  },
  {
    type: "function" as const,
    name: "cc_cancel_appointment",
    description: "Cancela agendamento. Confirme antes.",
    parameters: {
      type: "object" as const,
      properties: {
        appointment_id: {
          type: "string" as const,
          description: "ID do agendamento",
        },
        cancelled_by: {
          type: "string" as const,
          description: "Quem cancelou (ex: paciente, clínica)",
        },
      },
      required: ["appointment_id"] as string[],
    },
  },
  {
    type: "function" as const,
    name: "cc_reschedule_appointment",
    description: "Remarca agendamento para nova data/hora.",
    parameters: {
      type: "object" as const,
      properties: {
        appointment_id: {
          type: "string" as const,
          description: "ID do agendamento",
        },
        new_date: {
          type: "string" as const,
          description: "Nova data (YYYY-MM-DD)",
        },
        new_time: {
          type: "string" as const,
          description: "Novo horário (HH:MM)",
        },
      },
      required: ["appointment_id", "new_date", "new_time"] as string[],
    },
  },
  {
    type: "function" as const,
    name: "cc_check_availability",
    description: "Verifica horários livres do profissional na data.",
    parameters: {
      type: "object" as const,
      properties: {
        professional_id: {
          type: "string" as const,
          description: "ID do profissional",
        },
        date: {
          type: "string" as const,
          description: "Data desejada (YYYY-MM-DD)",
        },
      },
      required: ["professional_id", "date"] as string[],
    },
  },
  {
    type: "function" as const,
    name: "cc_check_available_dates",
    description: "Lista datas disponíveis do profissional nos próximos N dias.",
    parameters: {
      type: "object" as const,
      properties: {
        professional_id: {
          type: "string" as const,
          description: "ID do profissional",
        },
        days_ahead: {
          type: "number" as const,
          description: "Quantos dias à frente verificar (padrão 30)",
        },
      },
      required: ["professional_id"] as string[],
    },
  },
  {
    type: "function" as const,
    name: "cc_list_professionals",
    description: "Lista profissionais, filtrando por especialidade.",
    parameters: {
      type: "object" as const,
      properties: {
        specialty_id: {
          type: "string" as const,
          description: "ID da especialidade para filtrar",
        },
      },
      required: [] as string[],
    },
  },
  {
    type: "function" as const,
    name: "cc_list_specialties",
    description: "Lista especialidades disponíveis.",
    parameters: {
      type: "object" as const,
      properties: {},
      required: [] as string[],
    },
  },
  {
    type: "function" as const,
    name: "cc_get_financials",
    description: "Consulta faturas. Filtra por paciente, status e período.",
    parameters: {
      type: "object" as const,
      properties: {
        patient_id: { type: "string" as const, description: "ID do paciente" },
        status: {
          type: "string" as const,
          description: "Status: pending, paid, overdue",
        },
        date_from: { type: "string" as const, description: "Data início (YYYY-MM-DD)" },
        date_to: { type: "string" as const, description: "Data fim (YYYY-MM-DD)" },
      },
      required: [] as string[],
    },
  },
  {
    type: "function" as const,
    name: "cc_get_patient_health_plan",
    description: "Consulta planos de saúde do paciente.",
    parameters: {
      type: "object" as const,
      properties: {
        patient_id: {
          type: "string" as const,
          description: "ID do paciente",
        },
      },
      required: ["patient_id"] as string[],
    },
  },
  {
    type: "function" as const,
    name: "cc_query_knowledge",
    description: "Busca na base de conhecimento da clínica (procedimentos, preparos, políticas).",
    parameters: {
      type: "object" as const,
      properties: {
        query: {
          type: "string" as const,
          description: "Pergunta ou termos de busca",
        },
        top_k: {
          type: "number" as const,
          description: "Número máximo de resultados (padrão 5)",
        },
      },
      required: ["query"] as string[],
    },
  },
] as const;

// ─── Tool Executor ────────────────────────────────────────────
export async function executeClinicaConectaTool(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  try {
    const client = getClinicaConectaClient();

    switch (name) {
      case "cc_search_patients": {
        const result = await client.searchPatients(
          args.q as string,
          args.limit as number | undefined
        );
        return JSON.stringify(result);
      }

      case "cc_get_patient": {
        const result = await client.getPatient(args.patient_id as string);
        return JSON.stringify(result);
      }

      case "cc_create_patient": {
        const result = await client.createPatient({
          name: args.name as string,
          cpf: args.cpf as string | undefined,
          phone: args.phone as string | undefined,
          email: args.email as string | undefined,
          date_of_birth: args.date_of_birth as string | undefined,
          gender: args.gender as string | undefined,
        });
        return JSON.stringify(result);
      }

      case "cc_list_appointments": {
        const result = await client.getAppointments({
          date_from: args.date_from as string | undefined,
          date_to: args.date_to as string | undefined,
          professional_id: args.professional_id as string | undefined,
          patient_id: args.patient_id as string | undefined,
          status: args.status as string | undefined,
        });
        return JSON.stringify(result);
      }

      case "cc_create_appointment": {
        const result = await client.createAppointment({
          patient_id: args.patient_id as string,
          professional_id: args.professional_id as string,
          date_key: args.date_key as string,
          time: args.time as string,
          notes: args.notes as string | undefined,
        });
        return JSON.stringify(result);
      }

      case "cc_confirm_appointment": {
        const result = await client.confirmAppointment(args.appointment_id as string);
        return JSON.stringify(result);
      }

      case "cc_cancel_appointment": {
        const result = await client.cancelAppointment(
          args.appointment_id as string,
          args.cancelled_by as string | undefined
        );
        return JSON.stringify(result);
      }

      case "cc_reschedule_appointment": {
        const result = await client.rescheduleAppointment(
          args.appointment_id as string,
          args.new_date as string,
          args.new_time as string
        );
        return JSON.stringify(result);
      }

      case "cc_check_availability": {
        const result = await client.getAvailableSlots(
          args.professional_id as string,
          args.date as string
        );
        return JSON.stringify(result);
      }

      case "cc_check_available_dates": {
        const result = await client.getAvailableDates(
          args.professional_id as string,
          args.days_ahead as number | undefined
        );
        return JSON.stringify(result);
      }

      case "cc_list_professionals": {
        const result = await client.getProfessionals({
          specialty_id: args.specialty_id as string | undefined,
        });
        return JSON.stringify(result);
      }

      case "cc_list_specialties": {
        const result = await client.getSpecialties();
        return JSON.stringify(result);
      }

      case "cc_get_financials": {
        const result = await client.getFinancials({
          patient_id: args.patient_id as string | undefined,
          status: args.status as string | undefined,
          date_from: args.date_from as string | undefined,
          date_to: args.date_to as string | undefined,
        });
        return JSON.stringify(result);
      }

      case "cc_get_patient_health_plan": {
        const result = await client.getVidexMemberships(args.patient_id as string);
        return JSON.stringify(result);
      }

      case "cc_query_knowledge": {
        const result = await client.queryKnowledge(
          args.query as string,
          args.top_k as number | undefined
        );
        return JSON.stringify(result);
      }

      default:
        return JSON.stringify({ error: `Tool CC "${name}" não reconhecida` });
    }
  } catch (err: any) {
    console.error(`[Clínica Conecta Tool] ${name} error:`, err.message);
    // Guide the model to fall back to local tools when CC is unavailable
    const localEquivalent: Record<string, string> = {
      cc_check_availability: "check_availability",
      cc_create_appointment: "schedule_appointment",
      cc_cancel_appointment: "cancel_appointment",
      cc_reschedule_appointment: "reschedule_appointment",
      cc_confirm_appointment: "confirm_appointment",
      cc_list_appointments: "get_patient_appointments",
      cc_search_patients: "get_patient_info",
      cc_get_patient: "get_patient_info",
    };
    const fallback = localEquivalent[name];
    const fallbackMsg = fallback
      ? ` O sistema Clínica Conecta está indisponível. Use a ferramenta local "${fallback}" para realizar esta operação.`
      : " O sistema Clínica Conecta está temporariamente indisponível. Tente usar as ferramentas locais disponíveis.";
    return JSON.stringify({ error: err.message + fallbackMsg });
  }
}
