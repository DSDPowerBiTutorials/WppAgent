"use client";

import { useState } from "react";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import clsx from "clsx";

const conversations = [
  {
    id: "1",
    patient: "Maria Silva",
    phone: "+55 11 99999-1234",
    topic: "Agendamento - Cardiologia",
    status: "active" as const,
    agent: "Assistente Principal",
    messages: 12,
    started: "2026-03-23 14:30",
    lastMessage: "Perfeito, confirmei sua consulta para amanhã às 10h.",
  },
  {
    id: "2",
    patient: "João Santos",
    phone: "+55 11 99999-5678",
    topic: "Reagendamento - Ortopedia",
    status: "closed" as const,
    agent: "Assistente Principal",
    messages: 8,
    started: "2026-03-23 13:15",
    lastMessage: "Consulta reagendada com sucesso. Até breve!",
  },
  {
    id: "3",
    patient: "Ana Oliveira",
    phone: "+55 11 99999-9012",
    topic: "Dúvida - Exame de sangue",
    status: "waiting_human" as const,
    agent: "Assistente Principal",
    messages: 6,
    started: "2026-03-23 12:45",
    lastMessage: "Vou transferir para um atendente humano.",
  },
  {
    id: "4",
    patient: "Carlos Mendes",
    phone: "+55 11 99999-3456",
    topic: "Cancelamento - Dermatologia",
    status: "closed" as const,
    agent: "Assistente Principal",
    messages: 5,
    started: "2026-03-23 11:00",
    lastMessage: "Consulta cancelada. Posso ajudar com mais algo?",
  },
  {
    id: "5",
    patient: "Fernanda Costa",
    phone: "+55 11 99999-7890",
    topic: "Agendamento - Pediatria",
    status: "human_takeover" as const,
    agent: "Assistente Principal",
    messages: 15,
    started: "2026-03-23 10:30",
    lastMessage: "Atendente humano assumiu a conversa.",
  },
];

const statusConfig = {
  active: { label: "Ativa", color: "bg-emerald-100 text-emerald-700" },
  closed: { label: "Encerrada", color: "bg-gray-100 text-gray-600" },
  waiting_human: {
    label: "Aguardando Humano",
    color: "bg-amber-100 text-amber-700",
  },
  human_takeover: {
    label: "Atendimento Humano",
    color: "bg-blue-100 text-blue-700",
  },
};

type StatusFilter = "all" | "active" | "closed" | "waiting_human" | "human_takeover";

export default function ConversationsPage() {
  const [selectedConv, setSelectedConv] = useState<string | null>("1");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search && !c.patient.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const selected = conversations.find((c) => c.id === selectedConv);

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-6">
      {/* Left panel — conversation list */}
      <div className="flex w-96 flex-col rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-4">
          <h1 className="text-lg font-bold text-gray-900">Conversas</h1>
          <div className="mt-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar paciente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-300"
              />
            </div>
            <button className="rounded-lg border border-gray-200 p-2 text-gray-400 hover:bg-gray-50">
              <Filter size={16} />
            </button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {(
              [
                ["all", "Todas"],
                ["active", "Ativas"],
                ["waiting_human", "Aguardando"],
                ["closed", "Encerradas"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={clsx(
                  "whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  statusFilter === value
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {filtered.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConv(conv.id)}
              className={clsx(
                "w-full border-b border-gray-50 p-4 text-left transition-colors hover:bg-gray-50",
                selectedConv === conv.id && "bg-emerald-50"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">
                  {conv.patient}
                </span>
                <span
                  className={clsx(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    statusConfig[conv.status].color
                  )}
                >
                  {statusConfig[conv.status].label}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-gray-500">
                {conv.topic}
              </p>
              <p className="mt-1 truncate text-xs text-gray-400">
                {conv.lastMessage}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Right panel — conversation detail */}
      <div className="flex flex-1 flex-col rounded-xl border border-gray-100 bg-white shadow-sm">
        {selected ? (
          <>
            <div className="flex items-center justify-between border-b border-gray-100 p-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selected.patient}
                </h2>
                <p className="text-sm text-gray-500">
                  {selected.phone} · {selected.topic}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    statusConfig[selected.status].color
                  )}
                >
                  {statusConfig[selected.status].label}
                </span>
                {selected.status === "active" && (
                  <button className="rounded-lg bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-200">
                    Assumir Conversa
                  </button>
                )}
              </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 space-y-4 overflow-auto bg-[#f0f0f0] p-6">
              <ChatMessage role="patient" time="14:30">
                Olá! Gostaria de agendar uma consulta com cardiologista.
              </ChatMessage>
              <ChatMessage role="agent" time="14:30">
                Olá Maria! Claro, posso ajudar com isso. Temos disponibilidade
                com Dr. Paulo amanhã (24/03) nos seguintes horários: 10h, 14h ou
                16h. Qual prefere?
              </ChatMessage>
              <ChatMessage role="patient" time="14:31">
                10h está ótimo!
              </ChatMessage>
              <ChatMessage role="agent" time="14:31">
                Perfeito! Confirmei sua consulta: {"\n"}📋 Dr. Paulo -
                Cardiologia{"\n"}📅 24/03/2026 às 10h{"\n"}📍 Clínica Saúde+
                {"\n\n"}Enviarei um lembrete amanhã cedo. Posso ajudar com mais
                alguma coisa?
              </ChatMessage>
            </div>

            {/* Input (placeholder for human takeover) */}
            <div className="border-t border-gray-100 p-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Digite uma mensagem (takeover humano)..."
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none focus:border-emerald-300"
                  disabled={selected.status !== "human_takeover"}
                />
                <button
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  disabled={selected.status !== "human_takeover"}
                >
                  Enviar
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-gray-400">
              Selecione uma conversa para visualizar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatMessage({
  role,
  time,
  children,
}: {
  role: "patient" | "agent";
  time: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        "flex",
        role === "patient" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={clsx(
          "max-w-[70%] rounded-lg px-4 py-2 text-sm whitespace-pre-line",
          role === "patient"
            ? "bg-emerald-100 text-gray-800"
            : "bg-white text-gray-800 shadow-sm"
        )}
      >
        <p>{children}</p>
        <p
          className={clsx(
            "mt-1 text-xs",
            role === "patient" ? "text-emerald-600" : "text-gray-400"
          )}
        >
          {time}
        </p>
      </div>
    </div>
  );
}
