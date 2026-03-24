import { getSupabaseClient } from "../../lib/supabase.js";
import { ConversationEngine } from "../../engine/conversation.js";

interface IncomingMessage {
  from: string;
  name: string;
  messageId: string;
  timestamp: string;
  type: string;
  text: string;
  phoneNumberId: string;
}

export class WhatsAppService {
  private static API_URL = "https://graph.facebook.com/v21.0";

  static async handleIncomingMessage(msg: IncomingMessage) {
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
      .select("id")
      .eq("organization_id", orgId)
      .eq("phone", msg.from)
      .single();

    if (!patient) {
      const { data: newPatient } = await supabase
        .from("patients")
        .insert({ organization_id: orgId, phone: msg.from, name: msg.name })
        .select("id")
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
      // Get default agent
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

    // If conversation is with human, don't auto-reply
    if (conversation.status === "waiting_human") return;

    // Process with AI engine
    const reply = await ConversationEngine.processMessage(
      conversation.id,
      conversation.agent_id,
      msg.text
    );

    if (reply) {
      // Store AI reply
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        role: "agent",
        content: reply,
      });

      // Send via WhatsApp
      await WhatsAppService.sendMessage(msg.phoneNumberId, msg.from, reply);
    }
  }

  static async sendMessage(
    phoneNumberId: string,
    to: string,
    text: string
  ) {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    if (!token) throw new Error("Missing WHATSAPP_ACCESS_TOKEN");

    const response = await fetch(
      `${this.API_URL}/${phoneNumberId}/messages`,
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
}
