"use client";

import { useState } from "react";
import {
  Building2,
  Globe,
  Bell,
  Shield,
  Users,
  MessageSquare,
  Save,
} from "lucide-react";
import clsx from "clsx";

const tabs = [
  { key: "general", label: "Geral", icon: Building2 },
  { key: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { key: "notifications", label: "Notificações", icon: Bell },
  { key: "team", label: "Equipe", icon: Users },
  { key: "security", label: "Segurança", icon: Shield },
];

const mockTeam = [
  { id: "1", name: "Dr. Ricardo Souza", email: "ricardo@clinica.com", role: "admin" },
  { id: "2", name: "Ana Oliveira", email: "ana@clinica.com", role: "manager" },
  { id: "3", name: "Paula Santos", email: "paula@clinica.com", role: "viewer" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500">Gerencie sua organização e preferências</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Tabs */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={clsx(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  activeTab === tab.key
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            {activeTab === "general" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Informações da Organização</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome da Clínica</label>
                    <input
                      type="text"
                      defaultValue="Clínica Saúde+"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CNPJ</label>
                    <input
                      type="text"
                      defaultValue="12.345.678/0001-90"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Telefone</label>
                    <input
                      type="text"
                      defaultValue="+55 11 3456-7890"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">E-mail</label>
                    <input
                      type="email"
                      defaultValue="contato@clinicasaude.com"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-300"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Endereço</label>
                    <input
                      type="text"
                      defaultValue="Av. Paulista, 1234 - São Paulo, SP"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fuso Horário</label>
                    <select className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-300">
                      <option>America/Sao_Paulo (GMT-3)</option>
                      <option>America/Manaus (GMT-4)</option>
                      <option>America/Fortaleza (GMT-3)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Idioma</label>
                    <select className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-300">
                      <option>Português (BR)</option>
                      <option>English</option>
                      <option>Español</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                    <Save size={14} />
                    Salvar
                  </button>
                </div>
              </div>
            )}

            {activeTab === "whatsapp" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Configuração WhatsApp</h3>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm text-amber-700">
                    Para conectar seu WhatsApp, é necessário ter uma conta no{" "}
                    <span className="font-medium">Meta Business Platform</span> e um número verificado.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number ID</label>
                    <input
                      type="text"
                      placeholder="Ex: 123456789012345"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Business Account ID</label>
                    <input
                      type="text"
                      placeholder="Ex: 987654321098765"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-300"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Access Token</label>
                    <input
                      type="password"
                      placeholder="Token de acesso permanente"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-300"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Webhook Verify Token</label>
                    <input
                      type="text"
                      defaultValue="wppagent_verify_abc123"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-300"
                    />
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-700">URL do Webhook (configure no Meta)</p>
                  <code className="mt-1 block text-xs text-emerald-600">https://api.wppagent.com/webhooks/whatsapp/org_xxx</code>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                    <Save size={14} />
                    Salvar Configuração
                  </button>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Preferências de Notificação</h3>
                {[
                  { label: "Nova conversa iniciada", desc: "Quando um paciente inicia o chat", default: true },
                  { label: "Solicitação de humano", desc: "Quando o paciente pede atendimento humano", default: true },
                  { label: "Novo agendamento", desc: "Quando uma consulta é agendada", default: true },
                  { label: "Cancelamento", desc: "Quando uma consulta é cancelada pelo paciente", default: true },
                  { label: "Erro na integração", desc: "Quando uma integração apresenta falha", default: false },
                  { label: "Relatório semanal", desc: "Resumo de métricas enviado por e-mail", default: true },
                ].map((notif, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{notif.label}</p>
                      <p className="text-xs text-gray-400">{notif.desc}</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" defaultChecked={notif.default} className="peer sr-only" />
                      <div className="h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-emerald-500 peer-focus:ring-2 peer-focus:ring-emerald-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full" />
                    </label>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "team" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Membros da Equipe</h3>
                  <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
                    Convidar
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {mockTeam.map((member) => (
                    <div key={member.id} className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-xs font-medium text-emerald-600">
                          {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-400">{member.email}</p>
                        </div>
                      </div>
                      <select
                        defaultValue={member.role}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 outline-none"
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Gerente</option>
                        <option value="viewer">Visualizador</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Segurança</h3>
                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Autenticação em Dois Fatores (2FA)</p>
                        <p className="text-xs text-gray-400">Adicione uma camada extra de segurança</p>
                      </div>
                      <button className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50">
                        Ativar
                      </button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Sessões Ativas</p>
                        <p className="text-xs text-gray-400">2 dispositivos conectados</p>
                      </div>
                      <button className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">
                        Encerrar Outras
                      </button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Alterar Senha</p>
                        <p className="text-xs text-gray-400">Última alteração: há 30 dias</p>
                      </div>
                      <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                        Alterar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
