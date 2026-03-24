"use client";

import { useState, useCallback, useRef } from "react";
import {
  Bot,
  Save,
  ArrowLeft,
  Info,
  Zap,
  Clock,
  Globe,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  MessageSquare,
  Volume2,
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  Calendar,
  CreditCard,
  UserCheck,
  ClipboardList,
  HeartPulse,
  Shield,
  X,
} from "lucide-react";
import clsx from "clsx";
import type {
  AgentFeature,
  VoiceConfig,
  DaySchedule,
  OperatingHours,
  FeatureConfig,
  FaqEntry,
  SchedulingConfig,
} from "@/lib/agents-context";
import { DEFAULT_FEATURE_CONFIG } from "@/lib/agents-context";

// ── Form data type ─────────────────────────────────────────────
export interface AgentFormData {
  name: string;
  system_prompt: string;
  voice_config: VoiceConfig;
  features: AgentFeature[];
  feature_config: Partial<FeatureConfig>;
  languages: string[];
  active: boolean;
  operating_hours: OperatingHours | null;
}

interface AgentFormProps {
  initialData?: AgentFormData;
  onSubmit: (data: AgentFormData) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

// ── Constants ──────────────────────────────────────────────────
const FEATURE_OPTIONS: {
  key: AgentFeature;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  { key: "faq", label: "Dúvidas Frequentes", desc: "Responde perguntas comuns dos pacientes automaticamente", icon: <HelpCircle size={18} />, color: "blue" },
  { key: "scheduling", label: "Agendamento", desc: "Agenda, remarca e cancela consultas via WhatsApp", icon: <Calendar size={18} />, color: "emerald" },
  { key: "absence_management", label: "Gestão de Faltas", desc: "Confirma presença, envia lembretes e gerencia no-shows", icon: <UserCheck size={18} />, color: "amber" },
  { key: "payments", label: "Pagamentos", desc: "Auxilia com boletos, PIX e confirmação de pagamento", icon: <CreditCard size={18} />, color: "violet" },
  { key: "case_management", label: "Gestão de Casos", desc: "Acompanha casos específicos com follow-ups automáticos", icon: <ClipboardList size={18} />, color: "rose" },
  { key: "pre_post_op", label: "Pré e Pós Operatório", desc: "Orientações cirúrgicas e acompanhamento de recuperação", icon: <HeartPulse size={18} />, color: "red" },
  { key: "eligibility", label: "Elegibilidade", desc: "Verifica coberturas de planos e convênios de saúde", icon: <Shield size={18} />, color: "cyan" },
];

const DAYS = [
  { key: "seg", label: "Segunda-feira", short: "Seg" },
  { key: "ter", label: "Terça-feira", short: "Ter" },
  { key: "qua", label: "Quarta-feira", short: "Qua" },
  { key: "qui", label: "Quinta-feira", short: "Qui" },
  { key: "sex", label: "Sexta-feira", short: "Sex" },
  { key: "sab", label: "Sábado", short: "Sáb" },
  { key: "dom", label: "Domingo", short: "Dom" },
];

const PROMPT_TEMPLATES = [
  {
    name: "Clínica Geral",
    prompt: `Você é uma assistente virtual de atendimento de uma clínica médica. Seu papel é:

1. Cumprimentar o paciente de forma cordial e profissional
2. Entender a necessidade do paciente (agendar consulta, tirar dúvidas, remarcar, cancelar)
3. Coletar informações necessárias (nome, especialidade desejada, preferência de horário)
4. Verificar disponibilidade e sugerir horários
5. Confirmar o agendamento
6. Fornecer informações sobre preparo para consulta quando relevante

Regras:
- Sempre seja educado e empático
- Não forneça diagnósticos ou orientações médicas
- Se não souber responder algo, ofereça transferir para um atendente humano
- Confirme sempre os dados antes de finalizar um agendamento
- Use linguagem clara e acessível`,
  },
  {
    name: "Clínica Odontológica",
    prompt: `Você é a assistente virtual da Clínica Odontológica. Atenda pacientes via WhatsApp com cordialidade.

Funções:
1. Agendar consultas (limpeza, avaliação, tratamento)
2. Informar sobre procedimentos e valores
3. Enviar orientações pré e pós-procedimento
4. Remarcar e cancelar consultas

Regras:
- Seja simpática e profissional
- Não dê diagnósticos — sempre sugira uma avaliação presencial
- Confirme nome, telefone e horário antes de finalizar agendamento
- Informe sobre tempo médio de cada procedimento
- Lembre sobre documentos necessários (carteirinha do convênio, RG)`,
  },
  {
    name: "Laboratório",
    prompt: `Você é a assistente virtual do Laboratório de Análises Clínicas. Auxilie pacientes com:

1. Agendamento de exames
2. Informações sobre preparo (jejum, medicamentos)
3. Consulta de resultados (com verificação de identidade)
4. Dúvidas sobre convênios aceitos
5. Localização e horário de funcionamento

Regras:
- Sempre confirme a identidade antes de fornecer resultados
- Informe sobre preparo obrigatório de cada exame
- Não interprete resultados — oriente procurar o médico
- Seja ágil e direto nas respostas`,
  },
  {
    name: "Estética",
    prompt: `Você é a assistente virtual da Clínica de Estética. Atenda com elegância e profissionalismo.

Funções:
1. Apresentar os procedimentos disponíveis
2. Agendar avaliações e procedimentos
3. Informar sobre pré e pós-procedimento
4. Tirar dúvidas sobre valores e pacotes

Regras:
- Seja sofisticada e acolhedora
- Não prometa resultados — sempre sugira uma avaliação personalizada
- Informe sobre contraindicações gerais
- Envie o portfólio de antes/depois quando solicitado`,
  },
];

const PROMPT_VARIABLES = [
  { key: "{{nome_paciente}}", label: "Nome do Paciente", desc: "Nome completo do paciente" },
  { key: "{{nome_clinica}}", label: "Nome da Clínica", desc: "Nome da sua clínica" },
  { key: "{{especialidade}}", label: "Especialidade", desc: "Especialidade da consulta" },
  { key: "{{data_consulta}}", label: "Data da Consulta", desc: "Data/hora agendada" },
  { key: "{{nome_medico}}", label: "Nome do Médico", desc: "Médico responsável" },
];

const PERSONALITY_LABELS: Record<string, { label: string; desc: string }> = {
  formal: { label: "Formal", desc: "Linguagem culta e distante, sem emojis" },
  friendly: { label: "Amigável", desc: "Cordial e próxima, usa emojis com moderação" },
  empathetic: { label: "Empática", desc: "Acolhedora e compreensiva, foco no paciente" },
  professional: { label: "Profissional", desc: "Objetiva e eficiente, resposta direta" },
};

const TIMEZONES = [
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Recife",
  "America/Belem",
  "America/Fortaleza",
  "America/Cuiaba",
  "America/Porto_Velho",
  "America/Rio_Branco",
];

const DEFAULT_PROMPT = PROMPT_TEMPLATES[0].prompt;

const EMPTY_FORM: AgentFormData = {
  name: "",
  system_prompt: DEFAULT_PROMPT,
  voice_config: { tone: 50, speed: 50, accent: "neutral", personality: "friendly" },
  features: [],
  feature_config: {},
  languages: ["pt-BR"],
  active: true,
  operating_hours: null,
};

// ── Tabs ───────────────────────────────────────────────────────
type Tab = "geral" | "prompt" | "voz" | "funcionalidades" | "horarios";
const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "geral", label: "Geral", icon: <Info size={16} /> },
  { key: "prompt", label: "Prompt", icon: <MessageSquare size={16} /> },
  { key: "voz", label: "Voz", icon: <Volume2 size={16} /> },
  { key: "funcionalidades", label: "Funcionalidades", icon: <Zap size={16} /> },
  { key: "horarios", label: "Horários", icon: <Clock size={16} /> },
];

// ── Helpers ────────────────────────────────────────────────────
function getSampleMessages(personality: string, tone: number): string[] {
  if (personality === "formal") {
    return [
      "Prezado(a), bom dia. Em que posso ser útil?",
      "Sua consulta foi agendada com sucesso. Compareça 15 minutos antes do horário marcado.",
      "Informamos que o resultado do exame está disponível para retirada.",
    ];
  }
  if (personality === "empathetic") {
    return [
      "Olá! Espero que esteja bem. 💙 Como posso te ajudar hoje?",
      "Entendo sua preocupação, vou te ajudar com isso. Pode ficar tranquilo(a)!",
      "Sua consulta está marcada! Qualquer dúvida, estou aqui pra você. 😊",
    ];
  }
  if (personality === "professional") {
    return [
      "Olá. Sou a assistente virtual. Como posso ajudar?",
      "Consulta agendada: Dr. Silva, 15/01, 14h. Chegue 15min antes.",
      "Resultado disponível. Acesse pelo portal ou retire na recepção.",
    ];
  }
  // friendly
  if (tone > 60) {
    return [
      "Oi! 😊 Que bom te ver por aqui! Como posso te ajudar hoje?",
      "Tudo certo! Sua consulta tá marcada! 🎉 Qualquer coisa, me chama!",
      "Boa notícia! 🥳 Seu exame ficou pronto. Quer que eu explique como retirar?",
    ];
  }
  return [
    "Olá! 👋 Como posso ajudá-lo(a) hoje?",
    "Sua consulta foi agendada com sucesso! Te envio um lembrete antes. 📅",
    "Seu resultado está pronto. Você pode retirar na recepção da clínica.",
  ];
}

// ── Component ──────────────────────────────────────────────────
export default function AgentForm({ initialData, onSubmit, onCancel, isEdit }: AgentFormProps) {
  const [form, setForm] = useState<AgentFormData>(initialData ?? EMPTY_FORM);
  const [tab, setTab] = useState<Tab>("geral");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTemplates, setShowTemplates] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [expandedFeature, setExpandedFeature] = useState<AgentFeature | null>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  // ── Field helpers ──
  const set = useCallback(
    <K extends keyof AgentFormData>(key: K, value: AgentFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    []
  );

  const toggleFeature = useCallback((feat: AgentFeature) => {
    setForm((prev) => {
      const has = prev.features.includes(feat);
      const features = has ? prev.features.filter((f) => f !== feat) : [...prev.features, feat];
      const feature_config = { ...prev.feature_config };
      if (!has) {
        // Auto-populate default config when enabling
        feature_config[feat] = DEFAULT_FEATURE_CONFIG[feat] as any;
      }
      return { ...prev, features, feature_config };
    });
  }, []);

  const updateFeatureConfig = useCallback(
    <K extends AgentFeature>(feat: K, config: FeatureConfig[K]) => {
      setForm((prev) => ({
        ...prev,
        feature_config: { ...prev.feature_config, [feat]: config },
      }));
    },
    []
  );

  // ── Operating Hours helpers ──
  const enableHours = useCallback(() => {
    set("operating_hours", {
      timezone: "America/Sao_Paulo",
      outsideMessage: "Nosso horário de atendimento encerrou. Retornaremos sua mensagem assim que possível! 🕐",
      schedule: {
        seg: { start: "08:00", end: "18:00" },
        ter: { start: "08:00", end: "18:00" },
        qua: { start: "08:00", end: "18:00" },
        qui: { start: "08:00", end: "18:00" },
        sex: { start: "08:00", end: "17:00" },
        sab: null,
        dom: null,
      },
    });
  }, [set]);

  const toggleDay = useCallback(
    (day: string) => {
      if (!form.operating_hours) return;
      const current = form.operating_hours.schedule[day];
      const newSchedule = {
        ...form.operating_hours.schedule,
        [day]: current ? null : { start: "08:00", end: "18:00" },
      };
      set("operating_hours", { ...form.operating_hours, schedule: newSchedule });
    },
    [form.operating_hours, set]
  );

  const setDayTime = useCallback(
    (day: string, field: "start" | "end", value: string) => {
      if (!form.operating_hours) return;
      const current = form.operating_hours.schedule[day];
      if (!current) return;
      const newSchedule = {
        ...form.operating_hours.schedule,
        [day]: { ...current, [field]: value },
      };
      set("operating_hours", { ...form.operating_hours, schedule: newSchedule });
    },
    [form.operating_hours, set]
  );

  const copyToWeekdays = useCallback(() => {
    if (!form.operating_hours) return;
    const ref = form.operating_hours.schedule["seg"] ?? { start: "08:00", end: "18:00" };
    const newSchedule = { ...form.operating_hours.schedule };
    for (const d of ["seg", "ter", "qua", "qui", "sex"]) {
      newSchedule[d] = { ...ref };
    }
    set("operating_hours", { ...form.operating_hours, schedule: newSchedule });
  }, [form.operating_hours, set]);

  const copyToAll = useCallback(() => {
    if (!form.operating_hours) return;
    const ref = form.operating_hours.schedule["seg"] ?? { start: "08:00", end: "18:00" };
    const newSchedule: Record<string, DaySchedule | null> = {};
    for (const d of DAYS) newSchedule[d.key] = { ...ref };
    set("operating_hours", { ...form.operating_hours, schedule: newSchedule });
  }, [form.operating_hours, set]);

  // ── Prompt variable insertion ──
  const insertVariable = useCallback(
    (variable: string) => {
      const textarea = promptRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = form.system_prompt;
      const newText = text.substring(0, start) + variable + text.substring(end);
      set("system_prompt", newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    },
    [form.system_prompt, set]
  );

  // ── Validate ──
  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Nome é obrigatório";
    if (!form.system_prompt.trim()) e.system_prompt = "Prompt é obrigatório";
    if (form.features.length === 0) e.features = "Selecione ao menos uma funcionalidade";
    if (form.languages.length === 0) e.languages = "Selecione ao menos um idioma";
    setErrors(e);
    if (Object.keys(e).length > 0) {
      if (e.name || e.languages) setTab("geral");
      else if (e.system_prompt) setTab("prompt");
      else if (e.features) setTab("funcionalidades");
    }
    return Object.keys(e).length === 0;
  }, [form]);

  // ── Submit ──
  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  }, [form, onSubmit, validate]);

  const promptLen = form.system_prompt.length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onCancel}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
            <Bot size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {isEdit ? "Editar Agente" : "Novo Agente"}
            </h1>
            <p className="text-sm text-gray-500">
              {isEdit ? "Atualize as configurações do seu agente" : "Configure seu novo agente de atendimento"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-100 bg-gray-50 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              "flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {t.icon}
            {t.label}
            {((t.key === "geral" && (errors.name || errors.languages)) ||
              (t.key === "prompt" && errors.system_prompt) ||
              (t.key === "funcionalidades" && errors.features)) && (
              <span className="h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        {/* ═══════════════════════ GERAL ═══════════════════════ */}
        {tab === "geral" && (
          <div className="space-y-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nome do Agente <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Ex: Assistente de Agendamento"
                className={clsx(
                  "w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200",
                  errors.name ? "border-red-300 bg-red-50" : "border-gray-200"
                )}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Idiomas <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {["pt-BR", "en-US", "es-ES"].map((lang) => {
                  const selected = form.languages.includes(lang);
                  return (
                    <button
                      key={lang}
                      onClick={() =>
                        set(
                          "languages",
                          selected
                            ? form.languages.filter((l) => l !== lang)
                            : [...form.languages, lang]
                        )
                      }
                      className={clsx(
                        "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                        selected
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      )}
                    >
                      <Globe size={14} />
                      {lang}
                    </button>
                  );
                })}
              </div>
              {errors.languages && <p className="mt-1 text-xs text-red-500">{errors.languages}</p>}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Status do Agente</p>
                <p className="text-xs text-gray-500">
                  {form.active
                    ? "O agente está ativo e responderá mensagens"
                    : "O agente está inativo e não responderá mensagens"}
                </p>
              </div>
              <button onClick={() => set("active", !form.active)} className="flex items-center gap-2">
                {form.active ? (
                  <ToggleRight size={32} className="text-emerald-500" />
                ) : (
                  <ToggleLeft size={32} className="text-gray-400" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════ PROMPT ═══════════════════════ */}
        {tab === "prompt" && (
          <div className="space-y-4">
            {/* Template selector */}
            <div className="relative">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
              >
                <Sparkles size={16} className="text-emerald-500" />
                Usar Template
                {showTemplates ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showTemplates && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowTemplates(false)} />
                  <div className="absolute left-0 z-20 mt-2 w-80 rounded-xl border border-gray-100 bg-white p-2 shadow-xl">
                    {PROMPT_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.name}
                        onClick={() => {
                          set("system_prompt", tpl.prompt);
                          setShowTemplates(false);
                        }}
                        className="w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-emerald-50"
                      >
                        <p className="text-sm font-medium text-gray-800">{tpl.name}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{tpl.prompt.slice(0, 100)}...</p>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Prompt header */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  System Prompt <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500">Instruções que definem o comportamento do agente</p>
              </div>
              <span
                className={clsx(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  promptLen > 3000
                    ? "bg-red-100 text-red-600"
                    : promptLen > 2000
                      ? "bg-amber-100 text-amber-600"
                      : "bg-gray-100 text-gray-500"
                )}
              >
                {promptLen.toLocaleString()} caracteres
              </span>
            </div>

            {/* Variable insertion bar */}
            <div className="relative">
              <button
                onClick={() => setShowVariables(!showVariables)}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-emerald-400 hover:text-emerald-600"
              >
                <Plus size={12} />
                Inserir Variável
              </button>
              {showVariables && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowVariables(false)} />
                  <div className="absolute left-0 z-20 mt-1 w-72 rounded-xl border border-gray-100 bg-white p-2 shadow-xl">
                    {PROMPT_VARIABLES.map((v) => (
                      <button
                        key={v.key}
                        onClick={() => {
                          insertVariable(v.key);
                          setShowVariables(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-emerald-50"
                      >
                        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-emerald-700">{v.key}</code>
                        <div>
                          <p className="text-xs font-medium text-gray-700">{v.label}</p>
                          <p className="text-xs text-gray-400">{v.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Prompt textarea */}
            <textarea
              ref={promptRef}
              value={form.system_prompt}
              onChange={(e) => set("system_prompt", e.target.value)}
              rows={16}
              className={clsx(
                "w-full resize-y rounded-lg border px-4 py-3 font-mono text-sm leading-relaxed outline-none transition-colors focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200",
                errors.system_prompt ? "border-red-300 bg-red-50" : "border-gray-200"
              )}
            />
            {errors.system_prompt && <p className="text-xs text-red-500">{errors.system_prompt}</p>}

            {/* Tips */}
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3">
              <Sparkles size={16} className="mt-0.5 shrink-0 text-blue-500" />
              <div className="text-xs text-blue-700">
                <p className="font-medium">Dicas para um bom prompt:</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5">
                  <li>Inclua o nome da clínica e especialidades oferecidas</li>
                  <li>Defina o tom e a personalidade do atendimento</li>
                  <li>Liste regras claras (o que pode e não pode fazer)</li>
                  <li>Use variáveis para personalizar mensagens automaticamente</li>
                  <li>Defina procedimentos para situações de emergência</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════ VOZ ═══════════════════════ */}
        {tab === "voz" && (
          <div className="space-y-6">
            {/* Personality selection */}
            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700">Personalidade</label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(PERSONALITY_LABELS) as [string, { label: string; desc: string }][]).map(
                  ([key, { label, desc }]) => (
                    <button
                      key={key}
                      onClick={() => set("voice_config", { ...form.voice_config, personality: key as VoiceConfig["personality"] })}
                      className={clsx(
                        "rounded-xl border p-4 text-left transition-all",
                        form.voice_config.personality === key
                          ? "border-emerald-300 bg-emerald-50 ring-1 ring-emerald-200"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <p className={clsx("text-sm font-semibold", form.voice_config.personality === key ? "text-emerald-700" : "text-gray-700")}>
                        {label}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">{desc}</p>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Tone slider */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Tom de Voz</label>
              <div className="flex items-center gap-4">
                <span className="w-20 text-right text-xs text-gray-400">Suave</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form.voice_config.tone}
                  onChange={(e) => set("voice_config", { ...form.voice_config, tone: Number(e.target.value) })}
                  className="flex-1 accent-emerald-500"
                />
                <span className="w-20 text-xs text-gray-400">Energético</span>
                <span className="w-10 rounded bg-gray-100 px-2 py-1 text-center text-xs font-medium text-gray-700">
                  {form.voice_config.tone}
                </span>
              </div>
            </div>

            {/* Speed slider */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Velocidade</label>
              <div className="flex items-center gap-4">
                <span className="w-20 text-right text-xs text-gray-400">Devagar</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form.voice_config.speed}
                  onChange={(e) => set("voice_config", { ...form.voice_config, speed: Number(e.target.value) })}
                  className="flex-1 accent-emerald-500"
                />
                <span className="w-20 text-xs text-gray-400">Rápido</span>
                <span className="w-10 rounded bg-gray-100 px-2 py-1 text-center text-xs font-medium text-gray-700">
                  {form.voice_config.speed}
                </span>
              </div>
            </div>

            {/* Accent selector */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Sotaque</label>
              <div className="flex gap-3">
                {(["neutral", "local"] as const).map((accent) => (
                  <button
                    key={accent}
                    onClick={() => set("voice_config", { ...form.voice_config, accent })}
                    className={clsx(
                      "rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors",
                      form.voice_config.accent === accent
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    {accent === "neutral" ? "Neutro" : "Local / Regional"}
                  </button>
                ))}
              </div>
            </div>

            {/* Live preview */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pré-visualização de Mensagens</p>
              <p className="text-xs text-gray-400 mt-0.5">Exemplos de como o agente se comunicará</p>
              <div className="mt-4 space-y-3">
                {getSampleMessages(form.voice_config.personality, form.voice_config.tone).map((msg, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <Bot size={14} className="text-emerald-600" />
                    </div>
                    <div className="max-w-[340px] rounded-xl rounded-tl-sm bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm">
                      {msg}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-500 shadow-sm">
                  Personalidade: {PERSONALITY_LABELS[form.voice_config.personality]?.label}
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-500 shadow-sm">
                  Tom: {form.voice_config.tone < 40 ? "suave" : form.voice_config.tone > 60 ? "energético" : "neutro"}
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-500 shadow-sm">
                  Velocidade: {form.voice_config.speed < 40 ? "calma" : form.voice_config.speed > 60 ? "ágil" : "moderada"}
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-500 shadow-sm">
                  Sotaque: {form.voice_config.accent === "neutral" ? "neutro" : "local"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════ FUNCIONALIDADES ═══════════════════════ */}
        {tab === "funcionalidades" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Funcionalidades do Agente</p>
                <p className="text-xs text-gray-500">Ative e configure cada capacidade do seu agente</p>
              </div>
              <span className="text-xs text-gray-400">
                {form.features.length} de {FEATURE_OPTIONS.length} ativas
              </span>
            </div>
            {errors.features && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2">
                <AlertCircle size={14} className="text-red-500" />
                <p className="text-xs text-red-600">{errors.features}</p>
              </div>
            )}

            <div className="space-y-3">
              {FEATURE_OPTIONS.map((feat) => {
                const selected = form.features.includes(feat.key);
                const expanded = expandedFeature === feat.key && selected;
                return (
                  <div
                    key={feat.key}
                    className={clsx(
                      "rounded-xl border transition-all",
                      selected ? "border-emerald-200 bg-emerald-50/50" : "border-gray-200"
                    )}
                  >
                    {/* Feature header */}
                    <div className="flex items-center gap-4 p-4">
                      <button
                        onClick={() => toggleFeature(feat.key)}
                        className={clsx(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                          selected ? `bg-${feat.color}-100 text-${feat.color}-600` : "bg-gray-100 text-gray-400"
                        )}
                        style={selected ? { backgroundColor: `var(--color-${feat.color}-100, #d1fae5)`, color: `var(--color-${feat.color}-600, #059669)` } : undefined}
                      >
                        {feat.icon}
                      </button>
                      <div className="flex-1">
                        <p className={clsx("text-sm font-semibold", selected ? "text-gray-900" : "text-gray-700")}>
                          {feat.label}
                        </p>
                        <p className="text-xs text-gray-500">{feat.desc}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {selected && (
                          <button
                            onClick={() => setExpandedFeature(expanded ? null : feat.key)}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-100"
                          >
                            {expanded ? "Fechar" : "Configurar"}
                          </button>
                        )}
                        <button onClick={() => toggleFeature(feat.key)}>
                          {selected ? (
                            <ToggleRight size={28} className="text-emerald-500" />
                          ) : (
                            <ToggleLeft size={28} className="text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Feature config panel */}
                    {expanded && (
                      <div className="border-t border-emerald-100 p-4">
                        {feat.key === "faq" && <FaqConfig config={form.feature_config.faq ?? DEFAULT_FEATURE_CONFIG.faq} onChange={(c) => updateFeatureConfig("faq", c)} />}
                        {feat.key === "scheduling" && <SchedulingConfigPanel config={form.feature_config.scheduling ?? DEFAULT_FEATURE_CONFIG.scheduling} onChange={(c) => updateFeatureConfig("scheduling", c)} />}
                        {feat.key === "payments" && <PaymentsConfig config={form.feature_config.payments ?? DEFAULT_FEATURE_CONFIG.payments} onChange={(c) => updateFeatureConfig("payments", c)} />}
                        {feat.key === "absence_management" && <AbsenceConfig config={form.feature_config.absence_management ?? DEFAULT_FEATURE_CONFIG.absence_management} onChange={(c) => updateFeatureConfig("absence_management", c)} />}
                        {feat.key === "case_management" && <CaseConfig config={form.feature_config.case_management ?? DEFAULT_FEATURE_CONFIG.case_management} onChange={(c) => updateFeatureConfig("case_management", c)} />}
                        {feat.key === "pre_post_op" && <PrePostOpConfig config={form.feature_config.pre_post_op ?? DEFAULT_FEATURE_CONFIG.pre_post_op} onChange={(c) => updateFeatureConfig("pre_post_op", c)} />}
                        {feat.key === "eligibility" && <EligibilityConfig config={form.feature_config.eligibility ?? DEFAULT_FEATURE_CONFIG.eligibility} onChange={(c) => updateFeatureConfig("eligibility", c)} />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════ HORÁRIOS ═══════════════════════ */}
        {tab === "horarios" && (
          <div className="space-y-5">
            {!form.operating_hours ? (
              <div className="flex flex-col items-center gap-4 py-10">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <Clock size={32} className="text-gray-300" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">Atendimento 24/7</p>
                  <p className="mt-1 text-xs text-gray-500">
                    O agente responderá a qualquer momento. Configure horários para limitar o atendimento.
                  </p>
                </div>
                <button
                  onClick={enableHours}
                  className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  Configurar horários
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Horário de Funcionamento</p>
                    <p className="text-xs text-gray-500">Fora destes horários, o agente enviará a mensagem automática abaixo</p>
                  </div>
                  <button
                    onClick={() => set("operating_hours", null)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                  >
                    Remover (ficar 24/7)
                  </button>
                </div>

                {/* Timezone */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Fuso Horário</label>
                  <select
                    value={form.operating_hours.timezone}
                    onChange={(e) =>
                      set("operating_hours", { ...form.operating_hours!, timezone: e.target.value })
                    }
                    className="w-full max-w-xs rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz.replace("America/", "").replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>

                {/* Quick copy actions */}
                <div className="flex gap-2">
                  <button
                    onClick={copyToWeekdays}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    <Copy size={12} />
                    Copiar para dias úteis
                  </button>
                  <button
                    onClick={copyToAll}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    <Copy size={12} />
                    Copiar para todos
                  </button>
                </div>

                {/* Schedule grid */}
                <div className="space-y-2">
                  {DAYS.map((d) => {
                    const dayData = form.operating_hours!.schedule[d.key];
                    const isOpen = dayData !== null && dayData !== undefined;
                    return (
                      <div
                        key={d.key}
                        className={clsx(
                          "flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors",
                          isOpen ? "border-emerald-100 bg-emerald-50/30" : "border-gray-100"
                        )}
                      >
                        <button onClick={() => toggleDay(d.key)} className="flex items-center gap-2">
                          {isOpen ? (
                            <ToggleRight size={24} className="text-emerald-500" />
                          ) : (
                            <ToggleLeft size={24} className="text-gray-400" />
                          )}
                        </button>
                        <span className={clsx("w-28 text-sm font-medium", isOpen ? "text-gray-700" : "text-gray-400")}>
                          {d.label}
                        </span>
                        {isOpen && dayData ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={dayData.start}
                              onChange={(e) => setDayTime(d.key, "start", e.target.value)}
                              className="rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-emerald-400"
                            />
                            <span className="text-xs text-gray-400">até</span>
                            <input
                              type="time"
                              value={dayData.end}
                              onChange={(e) => setDayTime(d.key, "end", e.target.value)}
                              className="rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-emerald-400"
                            />
                            <span className="ml-2 text-xs text-gray-400">
                              {(() => {
                                const [sh, sm] = dayData.start.split(":").map(Number);
                                const [eh, em] = dayData.end.split(":").map(Number);
                                const mins = (eh * 60 + em) - (sh * 60 + sm);
                                const h = Math.floor(mins / 60);
                                const m = mins % 60;
                                return mins > 0 ? `${h}h${m > 0 ? `${m}min` : ""}` : "";
                              })()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Fechado</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Outside hours message */}
                <div className="mt-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Mensagem Fora do Horário
                  </label>
                  <p className="mb-2 text-xs text-gray-500">
                    Enviada automaticamente quando alguém entrar em contato fora do expediente
                  </p>
                  <textarea
                    value={form.operating_hours.outsideMessage}
                    onChange={(e) =>
                      set("operating_hours", { ...form.operating_hours!, outsideMessage: e.target.value })
                    }
                    rows={3}
                    placeholder="Ex: Nosso horário de atendimento é de segunda a sexta, das 8h às 18h..."
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
                  />
                </div>

                {/* Visual weekly summary */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Resumo Semanal</p>
                  <div className="flex gap-2">
                    {DAYS.map((d) => {
                      const dayData = form.operating_hours!.schedule[d.key];
                      const isOpen = dayData !== null && dayData !== undefined;
                      return (
                        <div
                          key={d.key}
                          className={clsx(
                            "flex flex-1 flex-col items-center rounded-lg py-2 text-center",
                            isOpen ? "bg-emerald-100" : "bg-gray-200"
                          )}
                        >
                          <span className={clsx("text-xs font-bold", isOpen ? "text-emerald-700" : "text-gray-400")}>
                            {d.short}
                          </span>
                          {isOpen && dayData ? (
                            <>
                              <span className="mt-1 text-[10px] text-emerald-600">{dayData.start}</span>
                              <span className="text-[10px] text-emerald-600">{dayData.end}</span>
                            </>
                          ) : (
                            <span className="mt-1 text-[10px] text-gray-400">—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-6 py-4 shadow-sm">
        <button
          onClick={onCancel}
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? "Salvando..." : isEdit ? "Salvar Alterações" : "Criar Agente"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Feature config sub-components
// ═══════════════════════════════════════════════════════════════

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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Base de Conhecimento</p>
        <span className="text-xs text-gray-400">{config.entries.length} perguntas</span>
      </div>
      {config.entries.map((entry, idx) => (
        <div key={idx} className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={entry.question}
                onChange={(e) => updateEntry(idx, "question", e.target.value)}
                placeholder="Pergunta do paciente..."
                className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-emerald-400"
              />
              <textarea
                value={entry.answer}
                onChange={(e) => updateEntry(idx, "answer", e.target.value)}
                placeholder="Resposta do agente..."
                rows={2}
                className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-emerald-400"
              />
            </div>
            <button
              onClick={() => removeEntry(idx)}
              className="mt-1 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={addEntry}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2.5 text-xs font-medium text-gray-500 transition-colors hover:border-emerald-400 hover:text-emerald-600"
      >
        <Plus size={14} />
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
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Configuração de Agendamento</p>

      {/* Specialties */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Especialidades Disponíveis</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {config.specialties.map((s) => (
            <span key={s} className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
              {s}
              <button onClick={() => removeSpecialty(s)} className="ml-0.5 hover:text-red-600">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSpec}
            onChange={(e) => setNewSpec(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSpecialty()}
            placeholder="Nova especialidade..."
            className="flex-1 rounded border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-emerald-400"
          />
          <button
            onClick={addSpecialty}
            className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
          >
            Adicionar
          </button>
        </div>
      </div>

      {/* Slot duration */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Duração da Consulta</label>
          <select
            value={config.slotDuration}
            onChange={(e) => onChange({ ...config, slotDuration: Number(e.target.value) })}
            className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-emerald-400"
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
            className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-emerald-400"
          >
            {[7, 14, 30, 60, 90].map((d) => (
              <option key={d} value={d}>{d} dias</option>
            ))}
          </select>
        </div>
      </div>

      {/* Weekend toggle */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
        <div>
          <p className="text-sm font-medium text-gray-700">Permitir agendamento nos fins de semana</p>
          <p className="text-xs text-gray-500">Pacientes poderão agendar em sábados e domingos</p>
        </div>
        <button onClick={() => onChange({ ...config, allowWeekends: !config.allowWeekends })}>
          {config.allowWeekends ? (
            <ToggleRight size={24} className="text-emerald-500" />
          ) : (
            <ToggleLeft size={24} className="text-gray-400" />
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
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Configuração de Pagamentos</p>

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
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
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
          placeholder="Ex: Para pagamento via PIX, utilize a chave..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
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
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Gestão de Faltas</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Lembrete (horas antes)</label>
          <select
            value={config.reminderHours}
            onChange={(e) => onChange({ ...config, reminderHours: Number(e.target.value) })}
            className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-emerald-400"
          >
            {[2, 4, 12, 24, 48].map((h) => (
              <option key={h} value={h}>{h}h antes</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Máx. Remarcações</label>
          <select
            value={config.maxReschedules}
            onChange={(e) => onChange({ ...config, maxReschedules: Number(e.target.value) })}
            className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-emerald-400"
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
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Gestão de Casos</p>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Follow-up automático a cada</label>
        <select
          value={config.autoFollowUpDays}
          onChange={(e) => onChange({ ...config, autoFollowUpDays: Number(e.target.value) })}
          className="w-full max-w-xs rounded border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-emerald-400"
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
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Pré e Pós Operatório</p>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Orientações pré-op</label>
          <select
            value={config.preOpDays}
            onChange={(e) => onChange({ ...config, preOpDays: Number(e.target.value) })}
            className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-emerald-400"
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
            className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-emerald-400"
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
            className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-emerald-400"
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
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Convênios Aceitos</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {config.insurers.map((s) => (
          <span key={s} className="flex items-center gap-1 rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-700">
            {s}
            <button onClick={() => removeInsurer(s)} className="ml-0.5 hover:text-red-600">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newInsurer}
          onChange={(e) => setNewInsurer(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addInsurer()}
          placeholder="Novo convênio..."
          className="flex-1 rounded border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-emerald-400"
        />
        <button
          onClick={addInsurer}
          className="rounded-lg bg-cyan-100 px-3 py-1.5 text-xs font-medium text-cyan-700 hover:bg-cyan-200"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
