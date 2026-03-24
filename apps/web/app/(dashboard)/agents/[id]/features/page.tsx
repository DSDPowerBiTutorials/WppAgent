"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Save,
  Loader2,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
  Calendar,
  CreditCard,
  UserCheck,
  ClipboardList,
  HeartPulse,
  Shield,
  Plus,
  Trash2,
  X,
  Settings2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import {
  useAgentsContext,
  DEFAULT_FEATURE_CONFIG,
  type AgentFeature,
  type FeatureConfig,
  type FaqEntry,
  type SchedulingConfig,
} from "@/lib/agents-context";
import { useToast } from "@/components/ui/toast";

// ── Feature metadata ───────────────────────────────────────────
const FEATURE_OPTIONS: {
  key: AgentFeature;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}[] = [
  { key: "faq", label: "Dúvidas Frequentes", desc: "Responde perguntas comuns dos pacientes automaticamente", icon: <HelpCircle size={20} />, color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
  { key: "scheduling", label: "Agendamento", desc: "Agenda, remarca e cancela consultas via WhatsApp", icon: <Calendar size={20} />, color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" },
  { key: "absence_management", label: "Gestão de Faltas", desc: "Confirma presença, envia lembretes e gerencia no-shows", icon: <UserCheck size={20} />, color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-200" },
  { key: "payments", label: "Pagamentos", desc: "Auxilia com boletos, PIX e confirmação de pagamento", icon: <CreditCard size={20} />, color: "text-violet-600", bgColor: "bg-violet-50", borderColor: "border-violet-200" },
  { key: "case_management", label: "Gestão de Casos", desc: "Acompanha casos específicos com follow-ups automáticos", icon: <ClipboardList size={20} />, color: "text-rose-600", bgColor: "bg-rose-50", borderColor: "border-rose-200" },
  { key: "pre_post_op", label: "Pré e Pós Operatório", desc: "Orientações cirúrgicas e acompanhamento de recuperação", icon: <HeartPulse size={20} />, color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" },
  { key: "eligibility", label: "Elegibilidade", desc: "Verifica coberturas de planos e convênios de saúde", icon: <Shield size={20} />, color: "text-cyan-600", bgColor: "bg-cyan-50", borderColor: "border-cyan-200" },
];

// ════════════════════════════════════════════════════════════════
// Main Page
// ════════════════════════════════════════════════════════════════
export default function AgentFeaturesPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { getAgent, fetchAgent, updateAgent, loading } = useAgentsContext();
  const { toast } = useToast();

  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [features, setFeatures] = useState<AgentFeature[]>([]);
  const [featureConfig, setFeatureConfig] = useState<Partial<FeatureConfig>>({});
  const [expandedFeatures, setExpandedFeatures] = useState<Set<AgentFeature>>(new Set());
  const [initialized, setInitialized] = useState(false);

  const agent = getAgent(id);

  // Fetch agent if not in context
  useEffect(() => {
    if (!agent && !loading && !fetching) {
      setFetching(true);
      fetchAgent(id).finally(() => setFetching(false));
    }
  }, [agent, loading, fetching, fetchAgent, id]);

  // Initialize local state from agent data
  useEffect(() => {
    if (agent && !initialized) {
      setFeatures([...agent.features]);
      setFeatureConfig({ ...agent.feature_config });
      // Auto-expand enabled features
      setExpandedFeatures(new Set(agent.features));
      setInitialized(true);
    }
  }, [agent, initialized]);

  const toggleFeature = useCallback((feat: AgentFeature) => {
    setFeatures((prev) => {
      const has = prev.includes(feat);
      if (has) {
        setExpandedFeatures((exp) => {
          const next = new Set(exp);
          next.delete(feat);
          return next;
        });
        return prev.filter((f) => f !== feat);
      } else {
        // Auto-populate defaults
        setFeatureConfig((cfg) => ({
          ...cfg,
          [feat]: cfg[feat] ?? DEFAULT_FEATURE_CONFIG[feat],
        }));
        setExpandedFeatures((exp) => new Set(exp).add(feat));
        return [...prev, feat];
      }
    });
  }, []);

  const toggleExpanded = useCallback((feat: AgentFeature) => {
    setExpandedFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(feat)) next.delete(feat);
      else next.add(feat);
      return next;
    });
  }, []);

  const updateConfig = useCallback(<K extends AgentFeature>(feat: K, config: FeatureConfig[K]) => {
    setFeatureConfig((prev) => ({ ...prev, [feat]: config }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAgent(id, { features, feature_config: featureConfig });
      toast("success", "Funcionalidades salvas com sucesso!");
      router.push("/agents");
    } catch {
      toast("error", "Erro ao salvar funcionalidades");
    } finally {
      setSaving(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Bot size={48} className="text-gray-300" />
        <p className="mt-4 text-lg font-medium text-gray-700">Agente não encontrado</p>
        <button
          onClick={() => router.push("/agents")}
          className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Voltar para Agentes
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/agents"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Settings2 size={18} className="text-emerald-600" />
              <h1 className="text-xl font-bold text-gray-900">Funcionalidades</h1>
            </div>
            <p className="text-sm text-gray-500">
              Configure as funcionalidades de <span className="font-medium text-gray-700">{agent.name}</span>
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Salvar
        </button>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
          <Bot size={20} className="text-emerald-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">{agent.name}</p>
          <p className="text-xs text-gray-500">
            {features.length} de {FEATURE_OPTIONS.length} funcionalidades ativas
          </p>
        </div>
        <Link
          href={`/agents/${id}`}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          Editar Agente
        </Link>
      </div>

      {/* Feature cards */}
      <div className="space-y-4">
        {FEATURE_OPTIONS.map((feat) => {
          const enabled = features.includes(feat.key);
          const expanded = expandedFeatures.has(feat.key) && enabled;

          return (
            <div
              key={feat.key}
              className={clsx(
                "rounded-xl border bg-white shadow-sm transition-all",
                enabled ? feat.borderColor : "border-gray-100"
              )}
            >
              {/* Feature header */}
              <div className="flex items-center gap-4 p-5">
                <div
                  className={clsx(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                    enabled ? feat.bgColor : "bg-gray-100"
                  )}
                >
                  <span className={enabled ? feat.color : "text-gray-400"}>
                    {feat.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={clsx("text-sm font-semibold", enabled ? "text-gray-900" : "text-gray-600")}>
                    {feat.label}
                  </p>
                  <p className="text-xs text-gray-500">{feat.desc}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {enabled && (
                    <button
                      onClick={() => toggleExpanded(feat.key)}
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100"
                    >
                      {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      {expanded ? "Recolher" : "Configurar"}
                    </button>
                  )}
                  <button onClick={() => toggleFeature(feat.key)}>
                    {enabled ? (
                      <ToggleRight size={32} className="text-emerald-500" />
                    ) : (
                      <ToggleLeft size={32} className="text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Feature config */}
              {expanded && (
                <div className={clsx("border-t p-5", enabled ? "border-gray-100" : "")}>
                  {feat.key === "faq" && (
                    <FaqConfig
                      config={featureConfig.faq ?? DEFAULT_FEATURE_CONFIG.faq}
                      onChange={(c) => updateConfig("faq", c)}
                    />
                  )}
                  {feat.key === "scheduling" && (
                    <SchedulingConfigPanel
                      config={featureConfig.scheduling ?? DEFAULT_FEATURE_CONFIG.scheduling}
                      onChange={(c) => updateConfig("scheduling", c)}
                    />
                  )}
                  {feat.key === "payments" && (
                    <PaymentsConfig
                      config={featureConfig.payments ?? DEFAULT_FEATURE_CONFIG.payments}
                      onChange={(c) => updateConfig("payments", c)}
                    />
                  )}
                  {feat.key === "absence_management" && (
                    <AbsenceConfig
                      config={featureConfig.absence_management ?? DEFAULT_FEATURE_CONFIG.absence_management}
                      onChange={(c) => updateConfig("absence_management", c)}
                    />
                  )}
                  {feat.key === "case_management" && (
                    <CaseConfig
                      config={featureConfig.case_management ?? DEFAULT_FEATURE_CONFIG.case_management}
                      onChange={(c) => updateConfig("case_management", c)}
                    />
                  )}
                  {feat.key === "pre_post_op" && (
                    <PrePostOpConfig
                      config={featureConfig.pre_post_op ?? DEFAULT_FEATURE_CONFIG.pre_post_op}
                      onChange={(c) => updateConfig("pre_post_op", c)}
                    />
                  )}
                  {feat.key === "eligibility" && (
                    <EligibilityConfig
                      config={featureConfig.eligibility ?? DEFAULT_FEATURE_CONFIG.eligibility}
                      onChange={(c) => updateConfig("eligibility", c)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom save */}
      <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-500">
          {features.length} funcionalidade{features.length !== 1 ? "s" : ""} ativa{features.length !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/agents")}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar Funcionalidades
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Feature config sub-components
// ════════════════════════════════════════════════════════════════

function FaqConfig({ config, onChange }: { config: FeatureConfig["faq"]; onChange: (c: FeatureConfig["faq"]) => void }) {
  const addEntry = () => {
    onChange({ entries: [...config.entries, { question: "", answer: "" }] });
  };

  const removeEntry = (idx: number) => {
    onChange({ entries: config.entries.filter((_, i) => i !== idx) });
  };

  const updateEntry = (idx: number, field: "question" | "answer", value: string) => {
    const entries = config.entries.map((e, i) => (i === idx ? { ...e, [field]: value } : e));
    onChange({ entries });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-700">Base de Conhecimento</p>
          <p className="text-xs text-gray-500">Adicione perguntas e respostas frequentes para o agente utilizar</p>
        </div>
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          {config.entries.length} {config.entries.length === 1 ? "pergunta" : "perguntas"}
        </span>
      </div>

      <div className="space-y-3">
        {config.entries.map((entry, idx) => (
          <div key={idx} className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                {idx + 1}
              </span>
              <div className="flex-1 space-y-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Pergunta</label>
                  <input
                    type="text"
                    value={entry.question}
                    onChange={(e) => updateEntry(idx, "question", e.target.value)}
                    placeholder="Ex: Quais especialidades atendem?"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Resposta</label>
                  <textarea
                    value={entry.answer}
                    onChange={(e) => updateEntry(idx, "answer", e.target.value)}
                    placeholder="Ex: Atendemos clínica geral, cardiologia, dermatologia..."
                    rows={2}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  />
                </div>
              </div>
              <button
                onClick={() => removeEntry(idx)}
                className="mt-1 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addEntry}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-blue-300 hover:text-blue-600"
      >
        <Plus size={16} />
        Adicionar Pergunta
      </button>
    </div>
  );
}

function SchedulingConfigPanel({
  config,
  onChange,
}: {
  config: SchedulingConfig;
  onChange: (c: SchedulingConfig) => void;
}) {
  const [newSpec, setNewSpec] = useState("");

  const addSpecialty = () => {
    const val = newSpec.trim();
    if (!val || config.specialties.includes(val)) return;
    onChange({ ...config, specialties: [...config.specialties, val] });
    setNewSpec("");
  };

  const removeSpecialty = (s: string) => {
    onChange({ ...config, specialties: config.specialties.filter((x) => x !== s) });
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-gray-700">Configuração de Agendamento</p>
        <p className="text-xs text-gray-500">Defina especialidades, duração e regras de agendamento</p>
      </div>

      {/* Specialties */}
      <div>
        <label className="mb-2 block text-xs font-medium text-gray-600">Especialidades Disponíveis</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {config.specialties.map((s) => (
            <span key={s} className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700">
              {s}
              <button onClick={() => removeSpecialty(s)} className="hover:text-red-600">
                <X size={12} />
              </button>
            </span>
          ))}
          {config.specialties.length === 0 && (
            <span className="text-xs text-gray-400 italic">Nenhuma especialidade adicionada</span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSpec}
            onChange={(e) => setNewSpec(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialty())}
            placeholder="Ex: Cardiologia, Dermatologia..."
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
          />
          <button
            onClick={addSpecialty}
            className="rounded-lg bg-emerald-100 px-4 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
          >
            Adicionar
          </button>
        </div>
      </div>

      {/* Slot duration + advance */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Duração da Consulta</label>
          <select
            value={config.slotDuration}
            onChange={(e) => onChange({ ...config, slotDuration: Number(e.target.value) })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
          >
            {[15, 20, 30, 45, 60, 90].map((m) => (
              <option key={m} value={m}>{m} minutos</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Antecedência Máxima</label>
          <select
            value={config.advanceDays}
            onChange={(e) => onChange({ ...config, advanceDays: Number(e.target.value) })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
          >
            {[7, 14, 30, 60, 90].map((d) => (
              <option key={d} value={d}>{d} dias</option>
            ))}
          </select>
        </div>
      </div>

      {/* Weekend toggle */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Permitir agendamento nos fins de semana</p>
          <p className="text-xs text-gray-500">Pacientes poderão agendar em sábados e domingos</p>
        </div>
        <button onClick={() => onChange({ ...config, allowWeekends: !config.allowWeekends })}>
          {config.allowWeekends ? (
            <ToggleRight size={28} className="text-emerald-500" />
          ) : (
            <ToggleLeft size={28} className="text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
}

function PaymentsConfig({
  config,
  onChange,
}: {
  config: FeatureConfig["payments"];
  onChange: (c: FeatureConfig["payments"]) => void;
}) {
  const METHODS = ["PIX", "Cartão de Crédito", "Cartão de Débito", "Boleto", "Dinheiro"];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-gray-700">Configuração de Pagamentos</p>
        <p className="text-xs text-gray-500">Defina métodos aceitos e instruções de pagamento</p>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-gray-600">Formas de Pagamento Aceitas</label>
        <div className="flex flex-wrap gap-2">
          {METHODS.map((m) => {
            const selected = config.methods.includes(m);
            return (
              <button
                key={m}
                onClick={() =>
                  onChange({
                    ...config,
                    methods: selected ? config.methods.filter((x) => x !== m) : [...config.methods, m],
                  })
                }
                className={clsx(
                  "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                  selected
                    ? "border-violet-300 bg-violet-50 text-violet-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                )}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Instruções de Pagamento</label>
        <textarea
          value={config.instructions}
          onChange={(e) => onChange({ ...config, instructions: e.target.value })}
          rows={3}
          placeholder="Ex: Para pagamento via PIX, utilize a chave CNPJ da clínica..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100"
        />
      </div>
    </div>
  );
}

function AbsenceConfig({
  config,
  onChange,
}: {
  config: FeatureConfig["absence_management"];
  onChange: (c: FeatureConfig["absence_management"]) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-gray-700">Gestão de Faltas</p>
        <p className="text-xs text-gray-500">Configure lembretes e políticas de remarcação</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Enviar lembrete</label>
          <select
            value={config.reminderHours}
            onChange={(e) => onChange({ ...config, reminderHours: Number(e.target.value) })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
          >
            {[2, 4, 12, 24, 48].map((h) => (
              <option key={h} value={h}>{h}h antes da consulta</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Máximo de remarcações</label>
          <select
            value={config.maxReschedules}
            onChange={(e) => onChange({ ...config, maxReschedules: Number(e.target.value) })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
          >
            {[1, 2, 3, 5].map((n) => (
              <option key={n} value={n}>{n} vez{n > 1 ? "es" : ""}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function CaseConfig({
  config,
  onChange,
}: {
  config: FeatureConfig["case_management"];
  onChange: (c: FeatureConfig["case_management"]) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-gray-700">Gestão de Casos</p>
        <p className="text-xs text-gray-500">Configure o acompanhamento automático de casos</p>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Follow-up automático a cada</label>
        <select
          value={config.autoFollowUpDays}
          onChange={(e) => onChange({ ...config, autoFollowUpDays: Number(e.target.value) })}
          className="max-w-xs rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
        >
          {[1, 3, 5, 7, 14, 30].map((d) => (
            <option key={d} value={d}>{d} dia{d > 1 ? "s" : ""}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function PrePostOpConfig({
  config,
  onChange,
}: {
  config: FeatureConfig["pre_post_op"];
  onChange: (c: FeatureConfig["pre_post_op"]) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-gray-700">Pré e Pós Operatório</p>
        <p className="text-xs text-gray-500">Configure orientações e acompanhamento cirúrgico</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Orientações pré-op</label>
          <select
            value={config.preOpDays}
            onChange={(e) => onChange({ ...config, preOpDays: Number(e.target.value) })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400"
          >
            {[1, 2, 3, 5, 7].map((d) => (
              <option key={d} value={d}>{d} dia{d > 1 ? "s" : ""} antes</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Acompanhamento pós-op</label>
          <select
            value={config.postOpDays}
            onChange={(e) => onChange({ ...config, postOpDays: Number(e.target.value) })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400"
          >
            {[3, 5, 7, 14, 30].map((d) => (
              <option key={d} value={d}>{d} dia{d > 1 ? "s" : ""}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Check-in</label>
          <select
            value={config.checkInFrequency}
            onChange={(e) => onChange({ ...config, checkInFrequency: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400"
          >
            <option value="diário">Diário</option>
            <option value="a cada 2 dias">A cada 2 dias</option>
            <option value="semanal">Semanal</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function EligibilityConfig({
  config,
  onChange,
}: {
  config: FeatureConfig["eligibility"];
  onChange: (c: FeatureConfig["eligibility"]) => void;
}) {
  const [newInsurer, setNewInsurer] = useState("");

  const addInsurer = () => {
    const val = newInsurer.trim();
    if (!val || config.insurers.includes(val)) return;
    onChange({ insurers: [...config.insurers, val] });
    setNewInsurer("");
  };

  const removeInsurer = (s: string) => {
    onChange({ insurers: config.insurers.filter((x) => x !== s) });
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-gray-700">Convênios Aceitos</p>
        <p className="text-xs text-gray-500">Gerencie a lista de convênios e planos de saúde aceitos</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {config.insurers.map((s) => (
          <span key={s} className="flex items-center gap-1.5 rounded-full bg-cyan-100 px-3 py-1.5 text-xs font-medium text-cyan-700">
            {s}
            <button onClick={() => removeInsurer(s)} className="hover:text-red-600">
              <X size={12} />
            </button>
          </span>
        ))}
        {config.insurers.length === 0 && (
          <span className="text-xs text-gray-400 italic">Nenhum convênio adicionado</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newInsurer}
          onChange={(e) => setNewInsurer(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInsurer())}
          placeholder="Ex: Unimed, Bradesco Saúde..."
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-cyan-400"
        />
        <button
          onClick={addInsurer}
          className="rounded-lg bg-cyan-100 px-4 py-2 text-xs font-medium text-cyan-700 hover:bg-cyan-200"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
