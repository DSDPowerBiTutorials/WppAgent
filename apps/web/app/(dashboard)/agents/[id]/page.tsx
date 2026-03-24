"use client";

import { useRouter, useParams } from "next/navigation";
import AgentForm from "@/components/dashboard/agent-form";
import type { AgentFormData } from "@/components/dashboard/agent-form";
import { useAgentsContext } from "@/lib/agents-context";
import { useToast } from "@/components/ui/toast";
import { Bot, Loader2 } from "lucide-react";

export default function EditAgentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { getAgent, updateAgent } = useAgentsContext();
  const { toast } = useToast();

  const agent = getAgent(id);

  const handleSubmit = async (data: AgentFormData) => {
    await updateAgent(id, data);
    toast("success", `Agente "${data.name}" atualizado com sucesso!`);
    router.push("/agents");
  };

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

  const initialData: AgentFormData = {
    name: agent.name,
    system_prompt: agent.system_prompt,
    voice_config: agent.voice_config,
    features: agent.features,
    feature_config: agent.feature_config,
    languages: agent.languages,
    active: agent.active,
    operating_hours: agent.operating_hours,
  };

  return (
    <div className="py-2">
      <AgentForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/agents")}
        isEdit
      />
    </div>
  );
}
