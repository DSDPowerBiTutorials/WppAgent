"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Bot,
  Power,
  PowerOff,
  Pencil,
  Copy,
  Trash2,
  MessageCircle,
  MoreVertical,
  Eye,
  Search,
} from "lucide-react";
import clsx from "clsx";
import AgentPreview from "@/components/dashboard/agent-preview";
import { useAgentsContext, type Agent } from "@/lib/agents-context";
import { useToast } from "@/components/ui/toast";

const featureLabels: Record<string, string> = {
  faq: "Dúvidas",
  scheduling: "Agendamento",
  absence_management: "Gestão de Faltas",
  payments: "Pagamentos",
  case_management: "Gestão de Casos",
  pre_post_op: "Pré/Pós Op",
  eligibility: "Elegibilidade",
};

export default function AgentsPage() {
  const { agents, toggleAgent, duplicateAgent, deleteAgent } = useAgentsContext();
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [previewAgent, setPreviewAgent] = useState<Agent | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");

  const filtered = agents.filter((a) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterActive === "active" && !a.active) return false;
    if (filterActive === "inactive" && a.active) return false;
    return true;
  });

  const handleToggle = (id: string) => {
    toggleAgent(id);
    const agent = agents.find((a) => a.id === id);
    toast("success", agent?.active ? "Agente desativado" : "Agente ativado");
  };

  const handleDuplicate = async (id: string) => {
    const dup = await duplicateAgent(id);
    if (dup) toast("success", `"${dup.name}" criado`);
    setMenuOpen(null);
  };

  const handleDelete = async (id: string) => {
    const agent = agents.find((a) => a.id === id);
    await deleteAgent(id);
    toast("success", `"${agent?.name}" excluído`);
    setDeleteConfirm(null);
    setMenuOpen(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agentes IA</h1>
          <p className="text-sm text-gray-500">
            Configure e gerencie seus agentes de atendimento
          </p>
        </div>
        <Link
          href="/agents/new"
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          <Plus size={16} />
          Novo Agente
        </Link>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase">Total</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{agents.length}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase">Ativos</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {agents.filter((a) => a.active).length}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase">Conversas Hoje</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {agents.reduce((sum, a) => sum + a.conversations_today, 0)}
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar agente..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-emerald-400"
          />
        </div>
        <div className="flex rounded-lg border border-gray-200">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterActive(f)}
              className={clsx(
                "px-3 py-2 text-xs font-medium transition-colors",
                filterActive === f ? "bg-emerald-50 text-emerald-700" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {f === "all" ? "Todos" : f === "active" ? "Ativos" : "Inativos"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Agent cards */}
        <div className={clsx("grid flex-1 grid-cols-1 gap-5", previewAgent ? "lg:grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3")}>
          {filtered.map((agent) => (
            <div
              key={agent.id}
              className={clsx(
                "relative rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md",
                agent.active ? "border-gray-100" : "border-gray-100 opacity-75"
              )}
            >
              {/* Card header */}
              <div className="flex items-start justify-between">
                <Link href={`/agents/${agent.id}`} className="flex items-center gap-3 group">
                  <div
                    className={clsx(
                      "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                      agent.active ? "bg-emerald-50 group-hover:bg-emerald-100" : "bg-gray-100"
                    )}
                  >
                    <Bot
                      size={20}
                      className={agent.active ? "text-emerald-600" : "text-gray-400"}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700">
                      {agent.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      {agent.active ? (
                        <Power size={12} className="text-emerald-500" />
                      ) : (
                        <PowerOff size={12} className="text-gray-400" />
                      )}
                      <span
                        className={clsx(
                          "text-xs",
                          agent.active ? "text-emerald-600" : "text-gray-400"
                        )}
                      >
                        {agent.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Action menu */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === agent.id ? null : agent.id)}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {menuOpen === agent.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpen(null)}
                      />
                      <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
                        <Link
                          href={`/agents/${agent.id}`}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setMenuOpen(null)}
                        >
                          <Pencil size={14} /> Editar
                        </Link>
                        <button
                          onClick={() => setPreviewAgent(agent)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Eye size={14} /> Testar
                        </button>
                        <button
                          onClick={() => handleDuplicate(agent.id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Copy size={14} /> Duplicar
                        </button>
                        <button
                          onClick={() => handleToggle(agent.id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          {agent.active ? <PowerOff size={14} /> : <Power size={14} />}
                          {agent.active ? "Desativar" : "Ativar"}
                        </button>
                        <hr className="my-1 border-gray-100" />
                        {deleteConfirm === agent.id ? (
                          <div className="px-3 py-2">
                            <p className="text-xs text-red-600">Tem certeza?</p>
                            <div className="mt-1 flex gap-2">
                              <button
                                onClick={() => handleDelete(agent.id)}
                                className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                              >
                                Sim
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
                              >
                                Não
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(agent.id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} /> Excluir
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="mt-4">
                <div className="flex flex-wrap gap-1">
                  {agent.features.map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                    >
                      {featureLabels[f] || f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <MessageCircle size={12} />
                  {agent.conversations_today} hoje
                </div>
                <span className="text-xs text-gray-400">{agent.languages.join(", ")}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Preview panel */}
        {previewAgent && (
          <div className="hidden w-[380px] shrink-0 lg:block">
            <AgentPreview
              agentName={previewAgent.name}
              systemPrompt={previewAgent.system_prompt}
              voiceConfig={previewAgent.voice_config}
              features={previewAgent.features}
              onClose={() => setPreviewAgent(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
