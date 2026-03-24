"use client";

import { useState, useCallback } from "react";

interface Agent {
  id: string;
  name: string;
  system_prompt: string;
  voice_config: { tone: number; speed: number; accent: "local" | "neutral" };
  features: string[];
  languages: string[];
  active: boolean;
  operating_hours: OperatingHoursData | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface OperatingHoursData {
  timezone: string;
  schedule: Record<string, { start: string; end: string } | null>;
}

// Mock data for local dev — will be replaced by API calls when backend is connected
const INITIAL_AGENTS: Agent[] = [
  {
    id: "1",
    name: "Assistente Principal",
    active: true,
    features: ["faq", "scheduling", "absence_management"],
    languages: ["pt-BR"],
    voice_config: { tone: 40, speed: 55, accent: "neutral" },
    system_prompt:
      "Você é uma assistente virtual de atendimento da Clínica Saúde+. Seu papel é cumprimentar pacientes, entender suas necessidades e ajudar com agendamentos, dúvidas frequentes e gestão de faltas. Seja cordial, empática e profissional. Respostas curtas e diretas (estilo WhatsApp). Use português brasileiro.",
    operating_hours: {
      timezone: "America/Sao_Paulo",
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
    created_at: "2025-01-01T10:00:00Z",
    updated_at: "2025-01-15T14:30:00Z",
  },
  {
    id: "2",
    name: "Agente de Pagamentos",
    active: true,
    features: ["payments"],
    languages: ["pt-BR"],
    voice_config: { tone: 30, speed: 50, accent: "local" },
    system_prompt:
      "Você é responsável por auxiliar pacientes com questões de pagamento da Clínica Saúde+. Ajude com boletos, confirmação de pagamento, extrato e pendências financeiras. Seja objetivo e claro.",
    operating_hours: null,
    avatar_url: null,
    created_at: "2025-01-05T09:00:00Z",
    updated_at: "2025-01-10T11:00:00Z",
  },
  {
    id: "3",
    name: "Agente Pré/Pós Op",
    active: false,
    features: ["pre_post_op", "case_management"],
    languages: ["pt-BR"],
    voice_config: { tone: 20, speed: 45, accent: "neutral" },
    system_prompt:
      "Você é responsável pelo acompanhamento de pacientes em pré e pós-operatório. Envie orientações, colete feedback sobre recuperação e encaminhe alertas para a equipe médica quando necessário.",
    operating_hours: null,
    avatar_url: null,
    created_at: "2025-01-08T15:00:00Z",
    updated_at: "2025-01-08T15:00:00Z",
  },
];

let nextId = 4;

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [loading, setLoading] = useState(false);

  const createAgent = useCallback(
    async (data: Omit<Agent, "id" | "created_at" | "updated_at" | "avatar_url">) => {
      setLoading(true);
      try {
        // Simulate API delay
        await new Promise((r) => setTimeout(r, 400));
        const now = new Date().toISOString();
        const newAgent: Agent = {
          ...data,
          id: String(nextId++),
          avatar_url: null,
          created_at: now,
          updated_at: now,
        };
        setAgents((prev) => [newAgent, ...prev]);
        return newAgent;
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

  const toggleAgent = useCallback(async (id: string) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, active: !a.active, updated_at: new Date().toISOString() } : a
      )
    );
  }, []);

  const duplicateAgent = useCallback(
    async (id: string) => {
      const source = agents.find((a) => a.id === id);
      if (!source) return;
      const now = new Date().toISOString();
      const dup: Agent = {
        ...source,
        id: String(nextId++),
        name: `${source.name} (cópia)`,
        active: false,
        created_at: now,
        updated_at: now,
      };
      setAgents((prev) => [dup, ...prev]);
      return dup;
    },
    [agents]
  );

  return {
    agents,
    loading,
    createAgent,
    updateAgent,
    deleteAgent,
    toggleAgent,
    duplicateAgent,
  };
}
