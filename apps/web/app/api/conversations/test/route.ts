import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isAuthError } from "@/lib/server/auth";
import { getSupabaseClient } from "@/lib/server/supabase";
import { testChatSchema } from "@repo/shared/schemas";
import { ConversationEngine } from "@/lib/server/conversation-engine";

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (isAuthError(auth)) return auth;

  const body = await request.json();
  const parsed = testChatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();
  const { data: agent, error } = await supabase
    .from("agents")
    .select("id, name")
    .eq("id", parsed.data.agent_id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (error || !agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const reply = await ConversationEngine.processTestChat(
    agent.id,
    parsed.data.history,
    parsed.data.message
  );

  if (!reply) {
    return NextResponse.json(
      { error: "No reply generated" },
      { status: 502 }
    );
  }

  return NextResponse.json({
    data: {
      agent_id: agent.id,
      agent_name: agent.name,
      reply,
    },
  });
}
