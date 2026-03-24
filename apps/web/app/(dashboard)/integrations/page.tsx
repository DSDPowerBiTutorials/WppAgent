"use client";

import { useState } from "react";
import {
  Link2,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  Zap,
  Database,
  Calendar as CalendarIcon,
  CreditCard,
  FileText,
} from "lucide-react";
import clsx from "clsx";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: "ehr" | "payment" | "calendar" | "crm" | "other";
  icon: typeof Database;
  connected: boolean;
  last_sync?: string;
  status?: "healthy" | "error" | "syncing";
}

const mockIntegrations: Integration[] = [
  { id: "1", name: "iClinic", description: "Prontuário eletrônico e gestão de clínicas", category: "ehr", icon: Database, connected: true, last_sync: "2025-01-20T10:30:00", status: "healthy" },
  { id: "2", name: "Feegow", description: "Sistema de gestão para clínicas e consultórios", category: "ehr", icon: Database, connected: false },
  { id: "3", name: "Doctoralia", description: "Plataforma de agendamento online", category: "calendar", icon: CalendarIcon, connected: true, last_sync: "2025-01-20T09:15:00", status: "healthy" },
  { id: "4", name: "Google Calendar", description: "Sincronização de agenda com Google Calendar", category: "calendar", icon: CalendarIcon, connected: true, last_sync: "2025-01-20T10:45:00", status: "syncing" },
  { id: "5", name: "Stripe", description: "Processamento de pagamentos online", category: "payment", icon: CreditCard, connected: false },
  { id: "6", name: "Asaas", description: "Cobranças e gestão financeira", category: "payment", icon: CreditCard, connected: true, last_sync: "2025-01-19T23:00:00", status: "error" },
  { id: "7", name: "RD Station", description: "CRM e automação de marketing", category: "crm", icon: Zap, connected: false },
  { id: "8", name: "Zapier", description: "Conecte com +5000 apps", category: "other", icon: Zap, connected: false },
  { id: "9", name: "Google Sheets", description: "Exportação de relatórios para planilhas", category: "other", icon: FileText, connected: true, last_sync: "2025-01-20T08:00:00", status: "healthy" },
];

const categoryLabels: Record<string, string> = {
  ehr: "Prontuário (EHR)",
  payment: "Pagamentos",
  calendar: "Agenda",
  crm: "CRM",
  other: "Outros",
};

const statusBadge: Record<string, { label: string; color: string }> = {
  healthy: { label: "Conectado", color: "bg-emerald-50 text-emerald-600" },
  error: { label: "Erro", color: "bg-red-50 text-red-600" },
  syncing: { label: "Sincronizando", color: "bg-amber-50 text-amber-600" },
};

export default function IntegrationsPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filtered = categoryFilter === "all"
    ? mockIntegrations
    : mockIntegrations.filter((i) => i.category === categoryFilter);

  const connectedCount = mockIntegrations.filter((i) => i.connected).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrações</h1>
          <p className="text-sm text-gray-500">
            {connectedCount} de {mockIntegrations.length} integrações conectadas
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
          <RefreshCw size={14} />
          Sincronizar Tudo
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-1 flex-wrap">
        <button
          onClick={() => setCategoryFilter("all")}
          className={clsx(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            categoryFilter === "all" ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:bg-gray-100"
          )}
        >
          Todos
        </button>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setCategoryFilter(key)}
            className={clsx(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              categoryFilter === key ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:bg-gray-100"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Integration cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((integration) => (
          <div
            key={integration.id}
            className={clsx(
              "rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
              integration.connected ? "border-emerald-100" : "border-gray-100"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={clsx(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  integration.connected ? "bg-emerald-50" : "bg-gray-100"
                )}>
                  <integration.icon
                    size={20}
                    className={integration.connected ? "text-emerald-600" : "text-gray-400"}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{integration.name}</h3>
                  <span className="text-xs text-gray-400">{categoryLabels[integration.category]}</span>
                </div>
              </div>
              {integration.connected && integration.status && statusBadge[integration.status] && (
                <span className={clsx("rounded-full px-2 py-0.5 text-xs font-medium", statusBadge[integration.status]!.color)}>
                  {statusBadge[integration.status]!.label}
                </span>
              )}
            </div>

            <p className="mt-3 text-xs text-gray-500 leading-relaxed">{integration.description}</p>

            {integration.connected && integration.last_sync && (
              <p className="mt-2 text-[10px] text-gray-400">
                Última sync: {new Date(integration.last_sync).toLocaleString("pt-BR")}
              </p>
            )}

            <div className="mt-4 flex items-center gap-2">
              {integration.connected ? (
                <>
                  <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                    <ExternalLink size={12} />
                    Configurar
                  </button>
                  <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">
                    <X size={12} />
                    Desconectar
                  </button>
                </>
              ) : (
                <button className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
                  <Link2 size={12} />
                  Conectar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* API Key section */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900">API & Webhooks</h3>
        <p className="text-xs text-gray-400 mt-1">Conecte seu próprio sistema via API REST</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2">
            <code className="text-xs text-gray-500">wpp_live_sk_••••••••••••••••</code>
          </div>
          <button className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
            Copiar
          </button>
          <button className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
            Regenerar
          </button>
        </div>
        <div className="mt-3">
          <p className="text-xs text-gray-400">
            Webhook URL: <code className="text-emerald-600">https://api.wppagent.com/webhooks/org_xxx</code>
          </p>
        </div>
      </div>
    </div>
  );
}
