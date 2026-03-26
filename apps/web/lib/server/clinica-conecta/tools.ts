import { getClinicaConectaClient } from "./index";
import { findRelatedSpecialtyIds } from "./specialty-aliases";

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
    description: "Lista APENAS as datas com disponibilidade. Para ver os horários livres de uma data, use cc_check_availability.",
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
        // CC API only supports 'date' param (not date_from/date_to)
        const dateFilter = (args.date_from as string | undefined) || (args.date_to as string | undefined);
        const raw = await client.getAppointments({
          date: dateFilter,
        });
        // CC API may ignore filters — apply client-side
        const result = raw.filter((a: any) => {
          const d = a.date_key || a.date;
          if (args.date_from && d < (args.date_from as string)) return false;
          if (args.date_to && d > (args.date_to as string)) return false;
          if (args.professional_id && a.professional_id !== args.professional_id) return false;
          if (args.patient_id && a.patient_id !== args.patient_id) return false;
          if (args.status && a.status !== args.status) return false;
          return true;
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
        const professionalId = args.professional_id as string;
        const date = args.date as string;

        // Fetch slots and existing appointments in parallel
        const [slotsRaw, appointments] = await Promise.all([
          client.getAvailableSlots(professionalId, date) as Promise<any>,
          client.getAppointments({ date }),
        ]);

        // API may return "availableSlots" or "slots" depending on version
        const allSlots: string[] = slotsRaw.availableSlots || slotsRaw.slots || [];

        // CC API ignores date/professional filters — filter client-side
        const bookedTimes = new Set(
          appointments
            .filter((a: any) =>
              a.status !== "cancelado" &&
              a.status !== "cancelled" &&
              (a.date_key || a.date) === date &&
              a.professional_id === professionalId
            )
            .map((a: any) => a.time?.slice(0, 5))
        );

        const filteredSlots = allSlots.filter(
          (slot: string) => !bookedTimes.has(slot)
        );

        return JSON.stringify({
          professionalId: slotsRaw.professionalId || professionalId,
          date: slotsRaw.date || date,
          availableSlots: filteredSlots,
          count: filteredSlots.length,
        });
      }

      case "cc_check_available_dates": {
        const result = await client.getAvailableDates(
          args.professional_id as string,
          args.days_ahead as number | undefined
        ) as any;
        // Remove todaySlots — it contains unfiltered slots that include booked times.
        // The model MUST use cc_check_availability to get accurate free slots for a specific date.
        const { todaySlots, ...safeResult } = result;
        return JSON.stringify(safeResult);
      }

      case "cc_list_professionals": {
        const specId = args.specialty_id as string | undefined;
        const result = await client.getProfessionals({
          specialty_id: specId,
        });

        // If we got results or no specialty filter, return as-is
        if (result.length > 0 || !specId) {
          return JSON.stringify(result);
        }

        // 0 results — try to find professionals in related specialties
        const allSpecialties = await client.getSpecialties();
        const relatedIds = findRelatedSpecialtyIds(specId, allSpecialties);

        if (relatedIds.length === 0) {
          return JSON.stringify(result);
        }

        const relatedProfessionals: any[] = [];
        const relatedSpecNames: string[] = [];
        for (const relId of relatedIds) {
          const profs = await client.getProfessionals({ specialty_id: relId });
          if (profs.length > 0) {
            const specName = allSpecialties.find((s) => s.id === relId)?.name;
            if (specName) relatedSpecNames.push(specName);
            relatedProfessionals.push(...profs);
          }
        }

        if (relatedProfessionals.length > 0) {
          const originalName = allSpecialties.find((s) => s.id === specId)?.name ?? specId;
          return JSON.stringify({
            nota: `Nenhum profissional encontrado para "${originalName}". Profissionais encontrados em especialidades relacionadas: ${relatedSpecNames.join(", ")}.`,
            professionals: relatedProfessionals,
          });
        }

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
    return JSON.stringify({
      error: err.message,
      instrucao: "O sistema Clínica Conecta está temporariamente indisponível. Informe ao paciente que não foi possível verificar a informação no momento e peça para tentar novamente em instantes. NÃO invente dados, horários ou disponibilidade."
    });
  }
}
