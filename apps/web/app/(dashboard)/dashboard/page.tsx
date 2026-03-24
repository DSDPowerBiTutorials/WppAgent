"use client";

import {
  MessageSquare,
  CalendarCheck,
  TrendingUp,
  Clock,
} from "lucide-react";

const stats = [
  {
    label: "Conversas Hoje",
    value: "47",
    change: "+12%",
    icon: MessageSquare,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Agendamentos Hoje",
    value: "23",
    change: "+8%",
    icon: CalendarCheck,
    color: "bg-blue-50 text-blue-600",
  },
  {
    label: "Taxa de Confirmação",
    value: "89%",
    change: "+3%",
    icon: TrendingUp,
    color: "bg-purple-50 text-purple-600",
  },
  {
    label: "Tempo Economizado",
    value: "5.2h",
    change: "+15%",
    icon: Clock,
    color: "bg-orange-50 text-orange-600",
  },
];

const recentConversations = [
  {
    id: "1",
    patient: "Maria Silva",
    topic: "Agendamento - Cardiologia",
    status: "active",
    time: "2 min atrás",
  },
  {
    id: "2",
    patient: "João Santos",
    topic: "Reagendamento - Ortopedia",
    status: "closed",
    time: "15 min atrás",
  },
  {
    id: "3",
    patient: "Ana Oliveira",
    topic: "Dúvida - Exame de sangue",
    status: "active",
    time: "23 min atrás",
  },
  {
    id: "4",
    patient: "Carlos Mendes",
    topic: "Cancelamento - Dermatologia",
    status: "closed",
    time: "1h atrás",
  },
  {
    id: "5",
    patient: "Fernanda Costa",
    topic: "Agendamento - Pediatria",
    status: "waiting_human",
    time: "1h atrás",
  },
];

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  closed: "bg-gray-100 text-gray-600",
  waiting_human: "bg-amber-100 text-amber-700",
};

const statusLabels: Record<string, string> = {
  active: "Ativa",
  closed: "Encerrada",
  waiting_human: "Aguardando",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Visão geral do atendimento da sua clínica
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}
              >
                <stat.icon size={20} />
              </div>
              <span className="text-xs font-medium text-emerald-600">
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart placeholder + Recent conversations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Conversas nos últimos 30 dias
          </h3>
          <div className="mt-4 flex h-64 items-center justify-center rounded-lg bg-gray-50">
            <div className="flex items-end gap-1">
              {Array.from({ length: 30 }, (_, i) => (
                <div
                  key={i}
                  className="w-2 rounded-t bg-gradient-primary"
                  style={{
                    height: `${Math.random() * 180 + 20}px`,
                    opacity: 0.6 + Math.random() * 0.4,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Recent conversations */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">
            Conversas Recentes
          </h3>
          <div className="mt-4 space-y-4">
            {recentConversations.map((conv) => (
              <div
                key={conv.id}
                className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {conv.patient}
                  </p>
                  <p className="truncate text-xs text-gray-500">{conv.topic}</p>
                </div>
                <div className="ml-3 flex flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[conv.status]}`}
                  >
                    {statusLabels[conv.status]}
                  </span>
                  <span className="text-xs text-gray-400">{conv.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
