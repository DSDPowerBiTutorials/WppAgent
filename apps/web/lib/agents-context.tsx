"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { api } from "./api";

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

// ── API response type ──────────────────────────────────────────
interface ApiAgent {
  id: string;
  organization_id: string;
  name: string;
  avatar_url: string | null;
  system_prompt: string;
  voice_config: VoiceConfig;
  features: AgentFeature[];
  feature_config: Partial<FeatureConfig>;
  languages: string[];
  active: boolean;
  operating_hours: OperatingHours | null;
  created_at: string;
  updated_at: string;
}

function toAgent(a: ApiAgent): Agent {
  return {
    id: a.id,
    name: a.name,
    system_prompt: a.system_prompt,
    voice_config: a.voice_config ?? { tone: 50, speed: 50, accent: "neutral", personality: "friendly" },
    features: a.features ?? [],
    feature_config: a.feature_config ?? {},
    languages: a.languages ?? ["pt-BR"],
    active: a.active,
    operating_hours: a.operating_hours,
    avatar_url: a.avatar_url,
    conversations_today: 0,
    created_at: a.created_at,
    updated_at: a.updated_at,
  };
}

// ── Context ────────────────────────────────────────────────────
interface AgentsContextValue {
  agents: Agent[];
  loading: boolean;
  getAgent: (id: string) => Agent | undefined;
  fetchAgent: (id: string) => Promise<Agent | undefined>;
  createAgent: (data: Omit<Agent, "id" | "created_at" | "updated_at" | "avatar_url" | "conversations_today">) => Promise<Agent>;
  updateAgent: (id: string, data: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  toggleAgent: (id: string) => Promise<void>;
  duplicateAgent: (id: string) => Promise<Agent | undefined>;
}

const AgentsContext = createContext<AgentsContextValue | null>(null);

export function AgentsProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // Load agents on mount
  useEffect(() => {
    api
      .get<{ data: ApiAgent[] }>("/agents")
      .then((res) => setAgents(res.data.map(toAgent)))
      .catch((err) => console.error("Failed to load agents:", err))
      .finally(() => setLoading(false));
  }, []);

  const getAgent = useCallback(
    (id: string) => agents.find((a) => a.id === id),
    [agents]
  );

  const fetchAgent = useCallback(async (id: string) => {
    try {
      const res = await api.get<{ data: ApiAgent }>(`/agents/${id}`);
      const agent = toAgent(res.data);
      setAgents((prev) => {
        const exists = prev.find((a) => a.id === id);
        if (exists) return prev.map((a) => (a.id === id ? agent : a));
        return [agent, ...prev];
      });
      return agent;
    } catch {
      return undefined;
    }
  }, []);

  const createAgent = useCallback(
    async (data: Omit<Agent, "id" | "created_at" | "updated_at" | "avatar_url" | "conversations_today">) => {
      const res = await api.post<{ data: ApiAgent }>("/agents", {
        name: data.name,
        system_prompt: data.system_prompt,
        voice_config: data.voice_config,
        features: data.features,
        feature_config: data.feature_config,
        languages: data.languages,
        active: data.active,
        operating_hours: data.operating_hours,
      });
      const agent = toAgent(res.data);
      setAgents((prev) => [agent, ...prev]);
      return agent;
    },
    []
  );

  const updateAgent = useCallback(
    async (id: string, data: Partial<Agent>) => {
      const { conversations_today, avatar_url, created_at, updated_at, ...payload } = data as any;
      const res = await api.patch<{ data: ApiAgent }>(`/agents/${id}`, payload);
      const updated = toAgent(res.data);
      setAgents((prev) => prev.map((a) => (a.id === id ? updated : a)));
    },
    []
  );

  const deleteAgent = useCallback(async (id: string) => {
    await api.delete(`/agents/${id}`);
    setAgents((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const toggleAgent = useCallback(
    async (id: string) => {
      const current = agents.find((a) => a.id === id);
      if (!current) return;
      const res = await api.patch<{ data: ApiAgent }>(`/agents/${id}`, {
        active: !current.active,
      });
      const updated = toAgent(res.data);
      setAgents((prev) => prev.map((a) => (a.id === id ? updated : a)));
    },
    [agents]
  );

  const duplicateAgent = useCallback(
    async (id: string) => {
      const source = agents.find((a) => a.id === id);
      if (!source) return undefined;
      const res = await api.post<{ data: ApiAgent }>("/agents", {
        name: `${source.name} (cópia)`,
        system_prompt: source.system_prompt,
        voice_config: source.voice_config,
        features: source.features,
        feature_config: source.feature_config,
        languages: source.languages,
        active: false,
        operating_hours: source.operating_hours,
      });
      const agent = toAgent(res.data);
      setAgents((prev) => [agent, ...prev]);
      return agent;
    },
    [agents]
  );

  return (
    <AgentsContext.Provider
      value={{
        agents,
        loading,
        getAgent,
        fetchAgent,
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
