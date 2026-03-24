import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { registerAuth } from "../middleware/auth.js";
import { getSupabaseClient } from "../lib/supabase.js";

export async function analyticsRoutes(app: FastifyInstance) {
  registerAuth(app);

  // Dashboard stats
  app.get("/stats", async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request as any).organizationId;
    const supabase = getSupabaseClient();

    const today = new Date().toISOString().split("T")[0];

    const [conversations, appointments, patients] = await Promise.all([
      supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .gte("created_at", `${today}T00:00:00`),
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .gte("scheduled_at", `${today}T00:00:00`)
        .lt("scheduled_at", `${today}T23:59:59`),
      supabase
        .from("patients")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId),
    ]);

    return {
      data: {
        conversations_today: conversations.count || 0,
        appointments_today: appointments.count || 0,
        total_patients: patients.count || 0,
      },
    };
  });

  // Analytics events
  app.get("/events", async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request as any).organizationId;
    const query = request.query as Record<string, string>;
    const days = Number(query.days) || 30;
    const supabase = getSupabaseClient();

    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await supabase
      .from("analytics_events")
      .select("*")
      .eq("organization_id", orgId)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false });

    if (error) return reply.status(500).send({ error: error.message });
    return { data };
  });

  // Track event
  app.post("/events", async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request as any).organizationId;
    const body = request.body as Record<string, unknown>;
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("analytics_events")
      .insert({ ...body, organization_id: orgId })
      .select()
      .single();

    if (error) return reply.status(400).send({ error: error.message });
    return reply.status(201).send({ data });
  });
}
