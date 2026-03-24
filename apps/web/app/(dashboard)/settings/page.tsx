"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Globe,
  Bell,
  Shield,
  Users,
  MessageSquare,
  Save,
  Code2,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff,
  Key,
} from "lucide-react";
import clsx from "clsx";

const tabs = [
  { key: "general", label: "Geral", icon: Building2 },
  { key: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { key: "api", label: "API Settings", icon: Code2 },
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
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [apiInfo, setApiInfo] = useState<any>(null);
  const [loadingApiInfo, setLoadingApiInfo] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const copyToClipboard = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const toggleSecret = useCallback((field: string) => {
    setShowSecrets((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const fetchApiInfo = useCallback(async () => {
    setLoadingApiInfo(true);
    try {
      const res = await fetch("/api/settings/api-info");
      if (res.ok) {
        setApiInfo(await res.json());
      }
    } catch {
      // silent
    } finally {
      setLoadingApiInfo(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "api" && !apiInfo) {
      fetchApiInfo();
    }
  }, [activeTab, apiInfo, fetchApiInfo]);

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

            {activeTab === "api" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">API Settings</h3>
                  <button
                    onClick={fetchApiInfo}
                    disabled={loadingApiInfo}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={loadingApiInfo ? "animate-spin" : ""} />
                    Atualizar
                  </button>
                </div>

                {/* Base URL */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">URL Base da Aplicação</h4>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-center justify-between">
                      <code className="text-sm text-emerald-600 font-mono">
                        {apiInfo?.baseUrl || (typeof window !== "undefined" ? window.location.origin : "...")}
                      </code>
                      <button
                        onClick={() => copyToClipboard(apiInfo?.baseUrl || window.location.origin, "baseUrl")}
                        className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                      >
                        {copiedField === "baseUrl" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* API Endpoints */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Endpoints da API</h4>
                  <p className="text-xs text-gray-500 mb-3">
                    Todos os endpoints disponíveis para integração com sistemas externos.
                  </p>
                  <div className="space-y-2">
                    {(apiInfo?.endpoints || [
                      { method: "GET", path: "/api/health", description: "Verificar status da API" },
                      { method: "GET", path: "/api/agents", description: "Listar agentes" },
                      { method: "POST", path: "/api/agents", description: "Criar agente" },
                      { method: "GET", path: "/api/agents/:id", description: "Detalhes do agente" },
                      { method: "PUT", path: "/api/agents/:id", description: "Atualizar agente" },
                      { method: "DELETE", path: "/api/agents/:id", description: "Remover agente" },
                      { method: "GET", path: "/api/conversations", description: "Listar conversas" },
                      { method: "POST", path: "/api/conversations", description: "Criar conversa" },
                      { method: "GET", path: "/api/conversations/:id", description: "Detalhes da conversa" },
                      { method: "GET", path: "/api/conversations/:id/messages", description: "Mensagens da conversa" },
                      { method: "POST", path: "/api/conversations/:id/messages", description: "Enviar mensagem" },
                      { method: "POST", path: "/api/conversations/test", description: "Chat de teste com IA" },
                      { method: "GET", path: "/api/analytics", description: "Dados analíticos" },
                      { method: "GET", path: "/api/drive", description: "Listar arquivos" },
                      { method: "POST", path: "/api/drive", description: "Upload de arquivo" },
                      { method: "DELETE", path: "/api/drive/:id", description: "Remover arquivo" },
                      { method: "GET/POST", path: "/api/webhooks/whatsapp", description: "Webhook do WhatsApp (Meta)" },
                    ]).map((ep: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2">
                        <span className={clsx(
                          "inline-flex min-w-[72px] items-center justify-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          ep.method === "GET" && "bg-blue-50 text-blue-600",
                          ep.method === "POST" && "bg-green-50 text-green-600",
                          ep.method === "PUT" && "bg-amber-50 text-amber-600",
                          ep.method === "DELETE" && "bg-red-50 text-red-600",
                          ep.method === "GET/POST" && "bg-purple-50 text-purple-600",
                        )}>
                          {ep.method}
                        </span>
                        <code className="text-xs font-mono text-gray-700 flex-1">{ep.path}</code>
                        <span className="text-xs text-gray-400 hidden md:block">{ep.description}</span>
                        <button
                          onClick={() => copyToClipboard(ep.path, `ep-${i}`)}
                          className="p-1 text-gray-300 hover:text-gray-500"
                        >
                          {copiedField === `ep-${i}` ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Webhook URLs */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">URLs de Webhook</h4>
                  <p className="text-xs text-gray-500 mb-3">
                    Configure estas URLs em serviços externos para receber eventos.
                  </p>
                  <div className="space-y-3">
                    <div className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-gray-700">WhatsApp Webhook (Meta Business)</p>
                        <button
                          onClick={() => copyToClipboard(
                            `${apiInfo?.baseUrl || (typeof window !== "undefined" ? window.location.origin : "")}/api/webhooks/whatsapp`,
                            "webhook-whatsapp"
                          )}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          {copiedField === "webhook-whatsapp" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                      <code className="text-xs text-emerald-600 font-mono break-all">
                        {apiInfo?.webhooks?.whatsapp || `${typeof window !== "undefined" ? window.location.origin : "..."}/api/webhooks/whatsapp`}
                      </code>
                      <p className="mt-2 text-[10px] text-gray-400">
                        Use esta URL na configuração do webhook da Meta Cloud API → Webhook Callback URL
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-gray-700">Health Check</p>
                        <button
                          onClick={() => copyToClipboard(
                            `${apiInfo?.baseUrl || (typeof window !== "undefined" ? window.location.origin : "")}/api/health`,
                            "webhook-health"
                          )}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          {copiedField === "webhook-health" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                      <code className="text-xs text-emerald-600 font-mono break-all">
                        {apiInfo?.webhooks?.health || `${typeof window !== "undefined" ? window.location.origin : "..."}/api/health`}
                      </code>
                      <p className="mt-2 text-[10px] text-gray-400">
                        Endpoint para verificar se a API está ativa. Use em uptime monitors (UptimeRobot, Pingdom, etc.)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Configuration */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Configuração</h4>
                  <p className="text-xs text-gray-500 mb-3">
                    Configurações não-sensíveis do sistema.
                  </p>
                  <div className="space-y-3">
                    {[
                      { label: "OpenAI Model", value: apiInfo?.config?.openaiModel, field: "openai-model" },
                      { label: "OpenAI Base URL", value: apiInfo?.config?.openaiBaseUrl, field: "openai-base" },
                    ].map((item) => (
                      <div key={item.field} className="rounded-lg border border-gray-200 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-gray-700">{item.label}</p>
                          <button
                            onClick={() => item.value && copyToClipboard(item.value, item.field)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            {copiedField === item.field ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          </button>
                        </div>
                        <code className="mt-1 block text-xs font-mono text-gray-500 break-all">
                          {item.value || "—"}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Environment Variables */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Variáveis de Ambiente Necessárias</h4>
                  <p className="text-xs text-gray-500 mb-3">
                    Configure estas variáveis no servidor (Vercel, .env, etc.) para o funcionamento completo.
                  </p>
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Variável</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Descrição</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(apiInfo?.envVars || [
                          { name: "SUPABASE_URL", description: "URL do projeto Supabase", configured: false },
                          { name: "SUPABASE_SERVICE_ROLE_KEY", description: "Chave admin do Supabase", configured: false },
                          { name: "OPENAI_API_KEY", description: "Chave da API OpenAI", configured: false },
                          { name: "OPENAI_MODEL", description: "Modelo de IA (ex: gpt-4.1)", configured: false },
                          { name: "WHATSAPP_ACCESS_TOKEN", description: "Token de acesso Meta", configured: false },
                          { name: "WHATSAPP_VERIFY_TOKEN", description: "Token de verificação webhook", configured: false },
                          { name: "WHATSAPP_PHONE_NUMBER_ID", description: "ID do número WhatsApp", configured: false },
                          { name: "NEXT_PUBLIC_SUPABASE_URL", description: "URL pública Supabase", configured: false },
                          { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", description: "Chave pública Supabase", configured: false },
                        ]).map((env: any) => (
                          <tr key={env.name}>
                            <td className="px-3 py-2 font-mono text-gray-700">{env.name}</td>
                            <td className="px-3 py-2 text-gray-500">{env.description}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={clsx(
                                "inline-flex h-2 w-2 rounded-full",
                                env.configured ? "bg-emerald-400" : "bg-gray-300"
                              )} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Integration Guide */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Como Integrar</h4>
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-emerald-800 mb-1">1. Enviar mensagem de teste via API</p>
                      <div className="rounded bg-gray-900 p-3 relative">
                        <button
                          onClick={() => copyToClipboard(
                            `curl -X POST ${apiInfo?.baseUrl || (typeof window !== "undefined" ? window.location.origin : "YOUR_URL")}/api/conversations/test \\\n  -H "Content-Type: application/json" \\\n  -d '{"agentId": "AGENT_ID", "message": "Olá"}'`,
                            "curl-test"
                          )}
                          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-white"
                        >
                          {copiedField === "curl-test" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                        <pre className="text-[11px] text-emerald-300 font-mono whitespace-pre-wrap">
{`curl -X POST ${apiInfo?.baseUrl || "YOUR_URL"}/api/conversations/test \\
  -H "Content-Type: application/json" \\
  -d '{"agentId": "AGENT_ID", "message": "Olá"}'`}
                        </pre>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-emerald-800 mb-1">2. Listar agentes disponíveis</p>
                      <div className="rounded bg-gray-900 p-3 relative">
                        <button
                          onClick={() => copyToClipboard(
                            `curl ${apiInfo?.baseUrl || (typeof window !== "undefined" ? window.location.origin : "YOUR_URL")}/api/agents`,
                            "curl-agents"
                          )}
                          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-white"
                        >
                          {copiedField === "curl-agents" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                        <pre className="text-[11px] text-emerald-300 font-mono">
{`curl ${apiInfo?.baseUrl || "YOUR_URL"}/api/agents`}
                        </pre>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-emerald-800 mb-1">3. Configurar webhook no Meta Business</p>
                      <p className="text-xs text-emerald-700">
                        Acesse o <span className="font-medium">Meta for Developers → Seu App → WhatsApp → Configuração</span> e
                        adicione a URL de webhook listada acima. Use o Verify Token configurado na aba WhatsApp.
                      </p>
                    </div>
                  </div>
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
