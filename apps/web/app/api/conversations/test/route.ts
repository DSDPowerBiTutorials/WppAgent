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

  // If simulate_patient flag is set, use full tool-enabled mode
  const simulatePatient = (body as any).simulate_patient === true;
  let reply: string | null;

  if (simulatePatient) {
    // Ensure a test patient + conversation exist for this org
    const ctx = await ensureTestPatient(auth.organizationId);

    // Store the user message in the test conversation
    await supabase.from("messages").insert({
      conversation_id: ctx.conversationId,
      role: "patient",
      content: parsed.data.message,
    });

    reply = await ConversationEngine.processMessage(
      ctx.conversationId,
      agent.id,
      parsed.data.message,
      {
        patientId: ctx.patientId,
        patientName: ctx.patientName,
        organizationId: auth.organizationId,
        conversationId: ctx.conversationId,
      }
    );

    // Store the agent reply
    if (reply) {
      await supabase.from("messages").insert({
        conversation_id: ctx.conversationId,
        role: "agent",
        content: reply,
      });
    }
  } else {
    reply = await ConversationEngine.processTestChat(
      agent.id,
      parsed.data.history,
      parsed.data.message
    );
  }

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

/**
 * Ensures a test patient and an active test conversation exist.
 * Reuses existing ones if they're still active.
 */
async function ensureTestPatient(organizationId: string) {
  const supabase = getSupabaseClient();
  const TEST_PHONE = "+5500000000000";

  // Find or create the test patient
  let { data: patient } = await supabase
    .from("patients")
    .select("id, name")
    .eq("organization_id", organizationId)
    .eq("phone", TEST_PHONE)
    .single();

  if (!patient) {
    const { data: newPatient } = await supabase
      .from("patients")
      .insert({
        organization_id: organizationId,
        phone: TEST_PHONE,
        name: "Paciente Teste",
        email: "teste@clinica.com",
        notes: "Paciente de teste para simulação do chat",
      })
      .select("id, name")
      .single();
    patient = newPatient;
  }

  if (!patient) throw new Error("Failed to create test patient");

  // Find or create active test conversation
  let { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("patient_id", patient.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!conversation) {
    // Get first active agent for the conversation record
    const { data: agent } = await supabase
      .from("agents")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("active", true)
      .limit(1)
      .single();

    const { data: newConv } = await supabase
      .from("conversations")
      .insert({
        organization_id: organizationId,
        patient_id: patient.id,
        agent_id: agent?.id || "00000000-0000-0000-0000-000000000000",
        status: "active",
        topic: "Simulação de teste",
      })
      .select("id")
      .single();
    conversation = newConv;
  }

  if (!conversation) throw new Error("Failed to create test conversation");

  return {
    patientId: patient.id,
    patientName: patient.name,
    conversationId: conversation.id,
  };
}
