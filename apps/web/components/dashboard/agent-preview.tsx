"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, RotateCcw, X } from "lucide-react";
import clsx from "clsx";
import type { AgentFeature, VoiceConfig } from "@/lib/agents-context";

interface AgentPreviewProps {
  agentName: string;
  systemPrompt: string;
  voiceConfig?: VoiceConfig;
  features?: AgentFeature[];
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const FEATURE_RESPONSES: Partial<Record<AgentFeature, { keywords: string[]; reply: string }>> = {
  scheduling: {
    keywords: ["agendar", "consulta", "marcar", "horário disponível", "remarcar"],
    reply: "Claro! Para agendar uma consulta, preciso de algumas informações:\n\n1. Qual especialidade?\n2. Tem preferência de data/horário?\n3. Já é paciente da clínica?",
  },
  faq: {
    keywords: ["dúvida", "pergunta", "como funciona", "informação", "valor", "preço"],
    reply: "Posso ajudar com essa dúvida! Deixe-me verificar as informações na nossa base de conhecimento.",
  },
  payments: {
    keywords: ["pagar", "pagamento", "boleto", "pix", "cartão", "valor", "preço"],
    reply: "Sobre pagamentos: aceitamos PIX, cartão e boleto. Posso enviar os dados para pagamento. Qual forma você prefere?",
  },
  absence_management: {
    keywords: ["cancelar", "desmarcar", "falta", "não vou", "remarcar"],
    reply: "Entendi. Para cancelar ou remarcar, me informe o nome completo e a data da consulta, por favor.",
  },
  pre_post_op: {
    keywords: ["cirurgia", "operação", "pré-operatório", "pós-operatório", "recuperação"],
    reply: "Sobre seu procedimento: vou enviar as orientações necessárias. Você está no período pré ou pós-operatório?",
  },
  eligibility: {
    keywords: ["convênio", "plano", "cobertura", "seguro", "unimed", "amil"],
    reply: "Posso verificar a cobertura do seu convênio! Me informe o nome do plano e o número da carteirinha.",
  },
  case_management: {
    keywords: ["acompanhamento", "caso", "tratamento", "evolução"],
    reply: "Vou verificar o status do seu acompanhamento. Pode me informar seu nome completo?",
  },
};

function generateMockReply(
  input: string,
  agentName: string,
  voiceConfig: VoiceConfig,
  features: AgentFeature[]
): string {
  const lower = input.toLowerCase();
  const { tone, personality } = voiceConfig;

  const useEmoji = personality === "friendly" || personality === "empathetic";
  const greeting =
    personality === "formal"
      ? "Olá. Em que posso ser útil?"
      : personality === "empathetic"
        ? `Oi! 💙 Eu sou o ${agentName}. Como posso te ajudar hoje?`
        : personality === "professional"
          ? `Olá, sou o ${agentName}. Como posso ajudar?`
          : `Oi! ${useEmoji ? "😊 " : ""}Eu sou o ${agentName}. Como posso ajudá-lo(a) hoje?`;

  if (lower.match(/\b(oi|olá|ola|bom dia|boa tarde|boa noite|hey|eai)\b/)) {
    return greeting;
  }

  // Check feature-specific responses
  for (const feat of features) {
    const resp = FEATURE_RESPONSES[feat];
    if (resp && resp.keywords.some((kw) => lower.includes(kw))) {
      return resp.reply;
    }
  }

  if (lower.includes("horário") || lower.includes("funciona")) {
    return "Nosso horário de funcionamento é de segunda a sexta, das 8h às 18h. Aos sábados, das 8h às 12h.";
  }

  if (lower.includes("obrigad")) {
    return personality === "formal"
      ? "Disponha. Estou à disposição."
      : personality === "empathetic"
        ? "De nada! 💙 Fico feliz em ajudar. Qualquer coisa, estou aqui!"
        : `De nada!${useEmoji ? " 😊" : ""} Se precisar de mais alguma coisa, é só chamar.`;
  }

  if (lower.includes("humano") || lower.includes("atendente") || lower.includes("pessoa")) {
    return "Entendi, vou transferir você para um atendente humano. Aguarde um momento, por favor.";
  }

  return personality === "formal"
    ? "Compreendo. Permita-me verificar essa informação. Há mais algo que necessita?"
    : `Entendi sua mensagem.${useEmoji ? " 👍" : ""} Deixa eu verificar isso pra você. Em que mais posso ajudar?`;
}

let msgId = 0;

export default function AgentPreview({
  agentName,
  systemPrompt,
  voiceConfig = { tone: 50, speed: 50, accent: "neutral", personality: "friendly" },
  features = [],
  onClose,
}: AgentPreviewProps) {
  const featuresStr = features.length
    ? features.join(", ")
    : "nenhuma funcionalidade configurada";

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Olá! Eu sou o **${agentName || "Agente"}**. Teste o atendimento digitando mensagens abaixo.\n\n_Funcionalidades: ${featuresStr}_`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || typing) return;

    const userMsg: ChatMessage = {
      id: `msg-${++msgId}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    // Simulate typing delay
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 800));

    const reply = generateMockReply(text, agentName, voiceConfig, features);
    const botMsg: ChatMessage = {
      id: `msg-${++msgId}`,
      role: "assistant",
      content: reply,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMsg]);
    setTyping(false);
  };

  const resetChat = () => {
    const featuresStr = features.length ? features.join(", ") : "nenhuma funcionalidade configurada";
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Olá! Eu sou o **${agentName || "Agente"}**. Teste o atendimento digitando mensagens abaixo.\n\n_Funcionalidades: ${featuresStr}_`,
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="flex h-[500px] flex-col rounded-xl border border-gray-200 bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
            <Bot size={16} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{agentName || "Agente"}</p>
            <p className="text-xs text-emerald-500">Simulação</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={resetChat}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Reiniciar conversa"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={clsx("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            {msg.role === "assistant" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <Bot size={14} className="text-emerald-600" />
              </div>
            )}
            <div
              className={clsx(
                "max-w-[75%] rounded-xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                msg.role === "user"
                  ? "rounded-br-sm bg-emerald-500 text-white"
                  : "rounded-bl-sm bg-white text-gray-800 shadow-sm"
              )}
            >
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200">
                <User size={14} className="text-gray-600" />
              </div>
            )}
          </div>
        ))}
        {typing && (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <Bot size={14} className="text-emerald-600" />
            </div>
            <div className="rounded-xl rounded-bl-sm bg-white px-4 py-2.5 shadow-sm">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Digite uma mensagem..."
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-300"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || typing}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white transition-colors hover:bg-emerald-600 disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
