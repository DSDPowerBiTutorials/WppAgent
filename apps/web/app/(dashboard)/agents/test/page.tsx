"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Bot, Loader2, RotateCcw, Send, Sparkles, User } from "lucide-react";
import clsx from "clsx";
import type { TestChatMessage, TestChatResult } from "@repo/shared/types";
import { useToast } from "@/components/ui/toast";
import { useAgentsContext } from "@/lib/agents-context";
import { api } from "@/lib/api";

type ChatMessage = TestChatMessage & { id: string };

function buildWelcomeMessage(agentName: string): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    content: `Olá! Eu sou o ${agentName}. Este é um chat de teste com IA real. As mensagens desta sessão não são salvas no banco.`,
  };
}

let nextMessageId = 0;

export default function AgentTestPage() {
  const { agents, loading } = useAgentsContext();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialAgentId = searchParams.get("agentId");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    if (loading || agents.length === 0 || selectedAgentId) return;

    const queryAgent = initialAgentId
      ? agents.find((agent) => agent.id === initialAgentId)
      : undefined;

    setSelectedAgentId(queryAgent?.id || agents[0]?.id || "");
  }, [agents, initialAgentId, loading, selectedAgentId]);

  useEffect(() => {
    if (!selectedAgent) return;
    setMessages([buildWelcomeMessage(selectedAgent.name)]);
    setInput("");
  }, [selectedAgent?.id]);

  const handleReset = () => {
    if (!selectedAgent) return;
    setMessages([buildWelcomeMessage(selectedAgent.name)]);
    setInput("");
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!selectedAgentId || !text || sending) return;

    const userMessage: ChatMessage = {
      id: `msg-${++nextMessageId}`,
      role: "user",
      content: text,
    };

    const history = messages
      .filter((message) => message.id !== "welcome")
      .map<TestChatMessage>(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const response = await api.post<{ data: TestChatResult }>("/conversations/test", {
        agent_id: selectedAgentId,
        history,
        message: text,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${++nextMessageId}`,
          role: "assistant",
          content: response.data.reply,
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao gerar resposta";
      toast("error", message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-emerald-600" />
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
        <Bot size={36} className="mx-auto text-gray-300" />
        <h1 className="mt-4 text-xl font-semibold text-gray-900">Nenhum agente disponível</h1>
        <p className="mt-2 text-sm text-gray-500">
          Crie um agente antes de iniciar um chat de teste com IA real.
        </p>
        <Link
          href="/agents/new"
          className="mt-6 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Criar agente
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
              Teste do agente
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">Chat de teste</h1>
          </div>
          <Link
            href="/agents"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Voltar
          </Link>
        </div>

        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
          Este ambiente usa a IA real, mas mantém o histórico apenas nesta página. Nada é salvo em
          conversations, messages ou patients.
        </div>

        <label className="block text-sm font-medium text-gray-700">
          Agente
          <select
            value={selectedAgentId}
            onChange={(event) => setSelectedAgentId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-400"
          >
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </label>

        {selectedAgent && (
          <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Perfil
              </p>
              <p className="mt-2 text-sm font-medium text-gray-900">{selectedAgent.name}</p>
              <p className="mt-1 text-sm text-gray-600">
                {selectedAgent.features.length
                  ? selectedAgent.features.join(", ")
                  : "Sem funcionalidades configuradas"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Prompt atual
              </p>
              <p className="mt-2 line-clamp-6 text-sm leading-6 text-gray-600">
                {selectedAgent.system_prompt}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
              <div className="rounded-lg bg-white p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-400">Tom</p>
                <p className="mt-1 font-medium text-gray-900">{selectedAgent.voice_config.tone}</p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-400">Personalidade</p>
                <p className="mt-1 font-medium capitalize text-gray-900">
                  {selectedAgent.voice_config.personality}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <Sparkles size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {selectedAgent?.name || "Selecione um agente"}
              </p>
              <p className="text-xs text-gray-500">Sessão efêmera com IA real</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            disabled={!selectedAgent || sending}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw size={14} />
            Reiniciar
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-5">
          {messages.map((message) => (
            <div
              key={message.id}
              className={clsx("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
            >
              {message.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <Bot size={16} className="text-emerald-600" />
                </div>
              )}

              <div
                className={clsx(
                  "max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
                  message.role === "user"
                    ? "rounded-br-sm bg-emerald-500 text-white"
                    : "rounded-bl-sm bg-white text-gray-800"
                )}
              >
                {message.content}
              </div>

              {message.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200">
                  <User size={16} className="text-gray-600" />
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <Bot size={16} className="text-emerald-600" />
              </div>
              <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm">
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

        <div className="border-t border-gray-100 p-4">
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              rows={3}
              placeholder="Digite a mensagem que você quer testar..."
              className="min-h-[88px] flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-400"
            />
            <button
              onClick={() => void handleSend()}
              disabled={!selectedAgentId || !input.trim() || sending}
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}