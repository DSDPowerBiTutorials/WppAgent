import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/server/supabase";
import { ConversationEngine, type PatientContext } from "@/lib/server/conversation-engine";
import { createHmac, timingSafeEqual } from "crypto";

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";

/**
 * Verify X-Hub-Signature-256 from Meta webhook.
 * Returns true if the signature is valid or if no app secret is configured (dev mode).
 */
function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    // In dev without app secret, allow requests but log a warning
    console.warn("WHATSAPP_APP_SECRET not configured — webhook signature verification skipped");
    return true;
  }

  if (!signatureHeader) return false;

  const [algorithm, signature] = signatureHeader.split("=");
  if (algorithm !== "sha256" || !signature) return false;

  const expectedSignature = createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch {
    return false;
  }
}

// Meta webhook verification (GET)
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json("Forbidden", { status: 403 });
}

// Receive messages (POST)
export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // Verify Meta webhook signature
  const signature = request.headers.get("x-hub-signature-256");
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const body = JSON.parse(rawBody);

  const entry = body?.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;

  if (!value?.messages?.[0]) {
    return NextResponse.json("EVENT_RECEIVED", { status: 200 });
  }

  const message = value.messages[0];
  const contact = value.contacts?.[0];
  const phoneNumberId = value.metadata?.phone_number_id;

  // Process in background after returning 200
  const processing = handleIncomingMessage({
    from: message.from,
    name: contact?.profile?.name || "Desconhecido",
    messageId: message.id,
    timestamp: message.timestamp,
    type: message.type,
    text: message.text?.body || "",
    phoneNumberId,
  });

  // Use waitUntil if available (Vercel Edge), otherwise just fire
  if (typeof globalThis !== "undefined" && "waitUntil" in globalThis) {
    (globalThis as any).waitUntil(processing);
  } else {
    processing.catch((err: unknown) =>
      console.error("Error processing WhatsApp webhook:", err)
    );
  }

  return NextResponse.json("EVENT_RECEIVED", { status: 200 });
}

interface IncomingMessage {
  from: string;
  name: string;
  messageId: string;
  timestamp: string;
  type: string;
  text: string;
  phoneNumberId: string;
}

async function handleIncomingMessage(msg: IncomingMessage) {
  const supabase = getSupabaseClient();

  // Find organization by phone number ID
  const { data: integration } = await supabase
    .from("integrations")
    .select("organization_id")
    .eq("type", "whatsapp")
    .eq("config->>phone_number_id", msg.phoneNumberId)
    .eq("status", "connected")
    .single();

  if (!integration) {
    console.error(`No org found for phone_number_id: ${msg.phoneNumberId}`);
    return;
  }

  const orgId = integration.organization_id;

  // Find or create patient
  let { data: patient } = await supabase
    .from("patients")
    .select("id, name")
    .eq("organization_id", orgId)
    .eq("phone", msg.from)
    .single();

  if (!patient) {
    const { data: newPatient } = await supabase
      .from("patients")
      .insert({ organization_id: orgId, phone: msg.from, name: msg.name })
      .select("id, name")
      .single();
    patient = newPatient;
  }

  if (!patient) return;

  // Find or create conversation
  let { data: conversation } = await supabase
    .from("conversations")
    .select("id, agent_id, status")
    .eq("organization_id", orgId)
    .eq("patient_id", patient.id)
    .in("status", ["active", "waiting_human"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!conversation) {
    const { data: agent } = await supabase
      .from("agents")
      .select("id")
      .eq("organization_id", orgId)
      .eq("active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (!agent) return;

    const { data: newConv } = await supabase
      .from("conversations")
      .insert({
        organization_id: orgId,
        patient_id: patient.id,
        agent_id: agent.id,
        status: "active",
      })
      .select("id, agent_id, status")
      .single();
    conversation = newConv;
  }

  if (!conversation) return;

  // Store incoming message
  await supabase.from("messages").insert({
    conversation_id: conversation.id,
    role: "patient",
    content: msg.text,
    metadata: { whatsapp_id: msg.messageId, type: msg.type },
  });

  // If waiting for human, don't auto-reply
  if (conversation.status === "waiting_human") return;

  // Build patient context for personalized AI + tool access
  const patientCtx: PatientContext = {
    patientId: patient.id,
    patientName: patient.name,
    organizationId: orgId,
    conversationId: conversation.id,
  };

  // Process with AI (with function calling for scheduling, etc.)
  const reply = await ConversationEngine.processMessage(
    conversation.id,
    conversation.agent_id,
    msg.text,
    patientCtx
  );

  if (reply) {
    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      role: "agent",
      content: reply,
    });

    await sendWhatsAppMessage(msg.phoneNumberId, msg.from, reply);
  }
}

async function sendWhatsAppMessage(
  phoneNumberId: string,
  to: string,
  text: string
) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) throw new Error("Missing WHATSAPP_ACCESS_TOKEN");

  const response = await fetch(
    `${WHATSAPP_API_URL}/${encodeURIComponent(phoneNumberId)}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("WhatsApp API error:", err);
    throw new Error(`WhatsApp send failed: ${response.status}`);
  }

  return response.json();
}
