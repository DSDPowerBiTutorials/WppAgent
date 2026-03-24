"use client";

import { useRouter } from "next/navigation";
import AgentForm from "@/components/dashboard/agent-form";
import type { AgentFormData } from "@/components/dashboard/agent-form";
import { useAgentsContext } from "@/lib/agents-context";
import { useToast } from "@/components/ui/toast";

export default function NewAgentPage() {
  const router = useRouter();
  const { createAgent } = useAgentsContext();
  const { toast } = useToast();

  const handleSubmit = async (data: AgentFormData) => {
    const agent = await createAgent(data);
    toast("success", `Agente "${agent.name}" criado com sucesso!`);
    router.push("/agents");
  };

  return (
    <div className="py-2">
      <AgentForm onSubmit={handleSubmit} onCancel={() => router.push("/agents")} />
    </div>
  );
}
