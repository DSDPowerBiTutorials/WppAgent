import { NextResponse } from "next/server";
import { authenticateRequest, isAuthError } from "@/lib/server/auth";
import { getSupabaseClient } from "@/lib/server/supabase";
import { ConversationEngine, type PatientContext } from "@/lib/server/conversation-engine";

// Allow up to 60s for multi-tool scheduling flows (OpenAI + CC API calls)
export const maxDuration = 60;

/**
 * POST /api/v1/chat
 *
 * Public API endpoint for external systems to send messages and get AI responses.
 * Requires authentication via API key (Bearer wpp_...) or Supabase JWT.
 *
 * Body:
 *  - message: string (required) — the user/patient message
 *  - agentId: string (optional) — specific agent to use; defaults to first active agent
 *  - patientPhone: string (optional) — patient phone for context continuity
 *  - patientName: string (optional) — patient name (used if creating new patient)
 *  - conversationId: string (optional) — continue an existing conversation
 */
export async function POST(request: Request) {
  const authResult = await authenticateRequest(request);
  if (isAuthError(authResult)) return authResult;

  const { organizationId } = authResult;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json(
      { error: "message is required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();

  // Resolve agent
  let agentId = body.agentId;
  if (!agentId) {
    const { data: agent } = await supabase
      .from("agents")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (!agent) {
      return NextResponse.json(
        { error: "No active agent found for this organization" },
        { status: 404 }
      );
    }
    agentId = agent.id;
  }

  // Resolve or create patient (optional — enables context continuity)
  let patientId: string | undefined;
  let patientName: string | undefined;
  const patientPhone = typeof body.patientPhone === "string" ? body.patientPhone.trim() : null;

  if (patientPhone) {
    let { data: patient } = await supabase
      .from("patients")
      .select("id, name")
      .eq("organization_id", organizationId)
      .eq("phone", patientPhone)
      .single();

    if (!patient) {
      const newName = typeof body.patientName === "string" ? body.patientName.trim() : "API User";
      const { data: newPatient } = await supabase
        .from("patients")
        .insert({
          organization_id: organizationId,
          phone: patientPhone,
          name: newName,
        })
        .select("id, name")
        .single();
      patient = newPatient;
    }

    if (patient) {
      patientId = patient.id;
      patientName = patient.name;
    }
  }

  // Resolve or create conversation
  let conversationId = body.conversationId;

  if (conversationId) {
    // Validate ownership
    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("organization_id", organizationId)
      .single();

    if (!conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
  } else if (patientId) {
    // Try to find an existing active conversation
    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("patient_id", patientId)
      .in("status", ["active"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (conv) {
      conversationId = conv.id;
    } else {
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({
          organization_id: organizationId,
          patient_id: patientId,
          agent_id: agentId,
          status: "active",
        })
        .select("id")
        .single();
      conversationId = newConv?.id;
    }
  }

  // Store incoming message if we have a conversation
  if (conversationId) {
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "patient",
      content: message,
      metadata: { source: "api" },
    });
  }

  // Build patient context for tools (only if patient is known)
  const patientCtx: PatientContext | undefined =
    patientId && patientName && conversationId
      ? {
          patientId,
          patientName,
          organizationId,
          conversationId,
        }
      : undefined;

  // Process with AI
  const reply = await ConversationEngine.processMessage(
    conversationId || "ephemeral",
    agentId,
    message,
    patientCtx
  );

  // Store AI reply
  if (conversationId && reply) {
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "agent",
      content: reply,
    });
  }

  return NextResponse.json({
    reply: reply || "Desculpe, não consegui processar sua mensagem.",
    conversationId: conversationId || null,
    agentId,
  });
}
