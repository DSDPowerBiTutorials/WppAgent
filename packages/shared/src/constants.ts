export const APP_NAME = "WppAgent";
export const APP_DESCRIPTION =
  "Plataforma de agentes IA para atendimento de pacientes via WhatsApp";

export const SPECIALTIES = [
  "Cardiologia",
  "Ortopedia",
  "Dermatologia",
  "Ginecologia",
  "Pediatria",
  "Neurologia",
  "Oftalmologia",
  "Urologia",
  "Endocrinologia",
  "Psiquiatria",
  "Otorrinolaringologia",
  "Gastroenterologia",
  "Clínica Geral",
] as const;

export const DEFAULT_AGENT_PROMPT = `Você é uma assistente virtual de atendimento de uma clínica médica. Seu papel é:

1. Cumprimentar o paciente de forma cordial e profissional
2. Entender a necessidade do paciente (agendar consulta, tirar dúvidas, remarcar, cancelar)
3. Coletar informações necessárias (nome, especialidade desejada, preferência de horário)
4. Verificar disponibilidade e sugerir horários
5. Confirmar o agendamento
6. Fornecer informações sobre preparo para consulta quando relevante

Regras:
- Sempre seja educado e empático
- Não forneça diagnósticos ou orientações médicas
- Se não souber responder algo, ofereça transferir para um atendente humano
- Confirme sempre os dados antes de finalizar um agendamento
- Use linguagem clara e acessível`;

export const AGENT_FEATURES_LABELS: Record<string, string> = {
  faq: "Dúvidas",
  scheduling: "Agendamento",
  absence_management: "Gestão de Faltas",
  payments: "Pagamentos",
  case_management: "Gestão de Casos",
  pre_post_op: "Pré e Pós Operatório",
  eligibility: "Eligibilidade",
};

export const CONVERSATION_STATUS_LABELS: Record<string, string> = {
  active: "Ativa",
  waiting_human: "Aguardando Humano",
  human_takeover: "Atendimento Humano",
  closed: "Encerrada",
};

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  rescheduled: "Reagendada",
  completed: "Realizada",
  no_show: "Não Compareceu",
};
