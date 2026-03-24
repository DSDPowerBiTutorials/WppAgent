"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  MessageSquare,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import clsx from "clsx";

const periods = [
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "90d", label: "90 dias" },
];

const kpis = [
  { label: "Conversas", value: "1.247", change: "+12%", up: true, icon: MessageSquare },
  { label: "Agendamentos", value: "384", change: "+8%", up: true, icon: Calendar },
  { label: "Taxa de Confirmação", value: "87%", change: "+3%", up: true, icon: TrendingUp },
  { label: "Receita Estimada", value: "R$ 48.200", change: "+15%", up: true, icon: DollarSign },
  { label: "Tempo Médio Resposta", value: "1.2s", change: "-18%", up: true, icon: Clock },
  { label: "Faltas Evitadas", value: "63", change: "+22%", up: true, icon: BarChart3 },
];

const specialtyData = [
  { name: "Cardiologia", conversations: 245, appointments: 89, rate: 86 },
  { name: "Dermatologia", conversations: 198, appointments: 72, rate: 91 },
  { name: "Ortopedia", conversations: 167, appointments: 58, rate: 83 },
  { name: "Pediatria", conversations: 143, appointments: 54, rate: 88 },
  { name: "Neurologia", conversations: 112, appointments: 38, rate: 79 },
  { name: "Ginecologia", conversations: 98, appointments: 41, rate: 92 },
];

const dailyData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  conversations: Math.floor(Math.random() * 50) + 20,
  appointments: Math.floor(Math.random() * 25) + 5,
}));

const hourlyData = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  volume: i >= 8 && i <= 20 ? Math.floor(Math.random() * 30) + 10 : Math.floor(Math.random() * 5),
}));

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30d");

  const maxConv = Math.max(...dailyData.map((d) => d.conversations));
  const maxHourly = Math.max(...hourlyData.map((d) => d.volume));
  const maxSpecialty = Math.max(...specialtyData.map((d) => d.conversations));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500">Métricas de desempenho dos seus agentes</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={clsx(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                period === p.key ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <kpi.icon size={16} className="text-gray-400" />
              <span className={clsx("flex items-center gap-0.5 text-xs font-medium", kpi.up ? "text-emerald-600" : "text-red-500")}>
                {kpi.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {kpi.change}
              </span>
            </div>
            <p className="mt-2 text-lg font-bold text-gray-900">{kpi.value}</p>
            <p className="text-xs text-gray-400">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Daily chart */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Volume Diário</h3>
          <p className="text-xs text-gray-400">Conversas e agendamentos por dia</p>
          <div className="mt-4 flex items-end gap-1" style={{ height: 180 }}>
            {dailyData.map((d) => (
              <div key={d.day} className="group relative flex flex-1 flex-col items-center gap-0.5">
                <div className="absolute -top-8 hidden rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                  {d.conversations} conv
                </div>
                <div
                  className="w-full rounded-t bg-emerald-400 transition-all group-hover:bg-emerald-500"
                  style={{ height: `${(d.conversations / maxConv) * 140}px` }}
                />
                <div
                  className="w-full rounded-t bg-emerald-200"
                  style={{ height: `${(d.appointments / maxConv) * 140}px` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
              <span className="text-xs text-gray-400">Conversas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-200" />
              <span className="text-xs text-gray-400">Agendamentos</span>
            </div>
          </div>
        </div>

        {/* Hourly heatmap */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Distribuição por Hora</h3>
          <p className="text-xs text-gray-400">Horários de pico de atendimento</p>
          <div className="mt-4 flex items-end gap-1" style={{ height: 180 }}>
            {hourlyData.map((d) => (
              <div key={d.hour} className="group relative flex flex-1 flex-col items-center">
                <div className="absolute -top-8 hidden rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                  {d.hour}h: {d.volume}
                </div>
                <div
                  className={clsx(
                    "w-full rounded-t transition-all",
                    d.volume > maxHourly * 0.7 ? "bg-emerald-600 group-hover:bg-emerald-700" :
                    d.volume > maxHourly * 0.4 ? "bg-emerald-400 group-hover:bg-emerald-500" :
                    "bg-emerald-200 group-hover:bg-emerald-300"
                  )}
                  style={{ height: `${Math.max((d.volume / maxHourly) * 160, 4)}px` }}
                />
                {d.hour % 4 === 0 && (
                  <span className="mt-1 text-[10px] text-gray-400">{d.hour}h</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Specialty table */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900">Desempenho por Especialidade</h3>
        <p className="text-xs text-gray-400 mb-4">Comparativo de conversas, agendamentos e taxa de confirmação</p>
        <div className="space-y-3">
          {specialtyData.map((spec) => (
            <div key={spec.name} className="flex items-center gap-4">
              <span className="w-28 text-sm text-gray-700 shrink-0">{spec.name}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-3 rounded-full bg-gray-100 flex-1 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${(spec.conversations / maxSpecialty) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 text-xs text-gray-500 text-right">{spec.conversations}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{spec.appointments} agend.</span>
                <span className={clsx(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  spec.rate >= 90 ? "bg-emerald-50 text-emerald-600" :
                  spec.rate >= 80 ? "bg-amber-50 text-amber-600" :
                  "bg-red-50 text-red-600"
                )}>
                  {spec.rate}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
