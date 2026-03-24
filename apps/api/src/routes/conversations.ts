import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { registerAuth } from "../middleware/auth.js";
import { getSupabaseClient } from "../lib/supabase.js";

export async function conversationRoutes(app: FastifyInstance) {
  registerAuth(app);

  // List conversations
  app.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request as any).organizationId;
    const query = request.query as Record<string, string>;
    const status = query.status;
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const supabase = getSupabaseClient();
    let q = supabase
      .from("conversations")
      .select("*, patient:patients(name, phone)", { count: "exact" })
      .eq("organization_id", orgId)
      .order("last_message_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) q = q.eq("status", status);

    const { data, count, error } = await q;
    if (error) return reply.status(500).send({ error: error.message });
    return { data, total: count, page, limit };
  });

  // Get conversation with messages
  app.get("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request as any).organizationId;
    const { id } = request.params as { id: string };
    const supabase = getSupabaseClient();

    const { data: conversation, error } = await supabase
      .from("conversations")
      .select("*, patient:patients(name, phone)")
      .eq("id", id)
      .eq("organization_id", orgId)
      .single();

    if (error) return reply.status(404).send({ error: "Conversation not found" });

    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    return { data: { ...conversation, messages } };
  });

  // Update conversation (e.g. assign, close, transfer)
  app.patch("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request as any).organizationId;
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("conversations")
      .update(body)
      .eq("id", id)
      .eq("organization_id", orgId)
      .select()
      .single();

    if (error) return reply.status(400).send({ error: error.message });
    return { data };
  });
}
