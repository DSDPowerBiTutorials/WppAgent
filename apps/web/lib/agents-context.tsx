"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

// ── Types ──────────────────────────────────────────────────────
export interface DaySchedule {
  start: string;
  end: string;
}

export interface OperatingHours {
  timezone: string;
  schedule: Record<string, DaySchedule | null>;
  outsideMessage: string;
}

export interface VoiceConfig {
  tone: number;
  speed: number;
  accent: "local" | "neutral";
  personality: "formal" | "friendly" | "empathetic" | "professional";
}

export type AgentFeature =
  | "faq"
  | "scheduling"
  | "absence_management"
  | "payments"
  | "case_management"
  | "pre_post_op"
  | "eligibility";

export interface FaqEntry {
  question: string;
  answer: string;
}

export interface SchedulingConfig {
  specialties: string[];
  slotDuration: number; // minutes
  advanceDays: number;
  allowWeekends: boolean;
}

export interface FeatureConfig {
  faq: { entries: FaqEntry[] };
  scheduling: SchedulingConfig;
  payments: { methods: string[]; instructions: string };
  absence_management: { reminderHours: number; maxReschedules: number };
  case_management: { autoFollowUpDays: number };
  pre_post_op: { preOpDays: number; postOpDays: number; checkInFrequency: string };
  eligibility: { insurers: string[] };
}

export interface Agent {
  id: string;
  name: string;
  system_prompt: string;
  voice_config: VoiceConfig;
  features: AgentFeature[];
  feature_config: Partial<FeatureConfig>;
  languages: string[];
  active: boolean;
  operating_hours: OperatingHours | null;
  avatar_url: string | null;
  conversations_today: number;
  created_at: string;
  updated_at: string;
}

// ── Default feature configs ────────────────────────────────────
export const DEFAULT_FEATURE_CONFIG: FeatureConfig = {
  faq: {
    entries: [
      { question: "Quais especialidades atendem?", answer: "Clínica geral, cardiologia, dermatologia, ortopedia e pediatria." },
      { question: "Aceitam convênio?", answer: "Sim, aceitamos os principais convênios. Informe o seu para verificarmos." },
    ],
  },
  scheduling: {
    specialties: ["Clínica Geral", "Cardiologia", "Dermatologia"],
    slotDuration: 30,
    advanceDays: 30,
    allowWeekends: false,
  },
  payments: {
    methods: ["PIX", "Cartão de Crédito", "Boleto"],
    instructions: "Para pagamento via PIX, utilize a chave CNPJ da clínica.",
  },
  absence_management: { reminderHours: 24, maxReschedules: 2 },
  case_management: { autoFollowUpDays: 7 },
  pre_post_op: { preOpDays: 3, postOpDays: 7, checkInFrequency: "diário" },
  eligibility: { insurers: ["Unimed", "Bradesco Saúde", "SulAmérica", "Amil"] },
};

// ── Seed data ──────────────────────────────────────────────────
const SEED_AGENTS: Agent[] = [
  {
    id: "1",
    name: "Assistente Principal",
    active: true,
    features: ["faq", "scheduling", "absence_management"],
    feature_config: {
      faq: DEFAULT_FEATURE_CONFIG.faq,
      scheduling: DEFAULT_FEATURE_CONFIG.scheduling,
      absence_management: DEFAULT_FEATURE_CONFIG.absence_management,
    },
    languages: ["pt-BR"],
    voice_config: { tone: 40, speed: 55, accent: "neutral", personality: "friendly" },
    system_prompt:
      "Você é uma assistente virtual de atendimento da Clínica Saúde+. Seu papel é cumprimentar pacientes, entender suas necessidades e ajudar com agendamentos, dúvidas frequentes e gestão de faltas. Seja cordial, empática e profissional. Respostas curtas e diretas (estilo WhatsApp). Use português brasileiro.",
    operating_hours: {
      timezone: "America/Sao_Paulo",
      outsideMessage: "Nosso horário de atendimento é de segunda a sexta, das 8h às 18h. Retornaremos sua mensagem assim que possível! 🕐",
      schedule: {
        seg: { start: "08:00", end: "18:00" },
        ter: { start: "08:00", end: "18:00" },
        qua: { start: "08:00", end: "18:00" },
        qui: { start: "08:00", end: "18:00" },
        sex: { start: "08:00", end: "17:00" },
        sab: null,
        dom: null,
      },
    },
    avatar_url: null,
    conversations_today: 34,
    created_at: "2025-01-01T10:00:00Z",
    updated_at: "2025-01-15T14:30:00Z",
  },
  {
    id: "2",
    name: "Agente de Pagamentos",
    active: true,
    features: ["payments"],
    feature_config: { payments: DEFAULT_FEATURE_CONFIG.payments },
    languages: ["pt-BR"],
    voice_config: { tone: 30, speed: 50, accent: "local", personality: "professional" },
    system_prompt:
      "Você é responsável por auxiliar pacientes com questões de pagamento da Clínica Saúde+. Ajude com boletos, confirmação de pagamento, extrato e pendências financeiras. Seja objetivo e claro.",
    operating_hours: null,
    avatar_url: null,
    conversations_today: 12,
    created_at: "2025-01-05T09:00:00Z",
    updated_at: "2025-01-10T11:00:00Z",
  },
  {
    id: "3",
    name: "Agente Pré/Pós Op",
    active: false,
    features: ["pre_post_op", "case_management"],
    feature_config: {
      pre_post_op: DEFAULT_FEATURE_CONFIG.pre_post_op,
      case_management: DEFAULT_FEATURE_CONFIG.case_management,
    },
    languages: ["pt-BR"],
    voice_config: { tone: 20, speed: 45, accent: "neutral", personality: "empathetic" },
    system_prompt:
      "Você é responsável pelo acompanhamento de pacientes em pré e pós-operatório. Envie orientações, colete feedback sobre recuperação e encaminhe alertas para a equipe médica quando necessário.",
    operating_hours: null,
    avatar_url: null,
    conversations_today: 0,
    created_at: "2025-01-08T15:00:00Z",
    updated_at: "2025-01-08T15:00:00Z",
  },
];

let nextId = 4;

// ── Context ────────────────────────────────────────────────────
interface AgentsContextValue {
  agents: Agent[];
  loading: boolean;
  getAgent: (id: string) => Agent | undefined;
  createAgent: (data: Omit<Agent, "id" | "created_at" | "updated_at" | "avatar_url" | "conversations_today">) => Promise<Agent>;
  updateAgent: (id: string, data: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  toggleAgent: (id: string) => void;
  duplicateAgent: (id: string) => Promise<Agent | undefined>;
}

const AgentsContext = createContext<AgentsContextValue | null>(null);

export function AgentsProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>(SEED_AGENTS);
  const [loading, setLoading] = useState(false);

  const getAgent = useCallback(
    (id: string) => agents.find((a) => a.id === id),
    [agents]
  );

  const createAgent = useCallback(
    async (data: Omit<Agent, "id" | "created_at" | "updated_at" | "avatar_url" | "conversations_today">) => {
      setLoading(true);
      try {
        await new Promise((r) => setTimeout(r, 400));
        const now = new Date().toISOString();
        const agent: Agent = {
          ...data,
          id: String(nextId++),
          avatar_url: null,
          conversations_today: 0,
          created_at: now,
          updated_at: now,
        };
        setAgents((prev) => [agent, ...prev]);
        return agent;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateAgent = useCallback(
    async (id: string, data: Partial<Agent>) => {
      setLoading(true);
      try {
        await new Promise((r) => setTimeout(r, 400));
        setAgents((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, ...data, updated_at: new Date().toISOString() } : a
          )
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteAgent = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 300));
      setAgents((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleAgent = useCallback((id: string) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, active: !a.active, updated_at: new Date().toISOString() } : a
      )
    );
  }, []);

  const duplicateAgent = useCallback(
    async (id: string) => {
      const source = agents.find((a) => a.id === id);
      if (!source) return undefined;
      const now = new Date().toISOString();
      const dup: Agent = {
        ...source,
        id: String(nextId++),
        name: `${source.name} (cópia)`,
        active: false,
        conversations_today: 0,
        created_at: now,
        updated_at: now,
      };
      setAgents((prev) => [dup, ...prev]);
      return dup;
    },
    [agents]
  );

  return (
    <AgentsContext.Provider
      value={{
        agents,
        loading,
        getAgent,
        createAgent,
        updateAgent,
        deleteAgent,
        toggleAgent,
        duplicateAgent,
      }}
    >
      {children}
    </AgentsContext.Provider>
  );
}

export function useAgentsContext() {
  const ctx = useContext(AgentsContext);
  if (!ctx) throw new Error("useAgentsContext must be used within AgentsProvider");
  return ctx;
}
