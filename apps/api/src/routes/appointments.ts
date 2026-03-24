import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { registerAuth } from "../middleware/auth.js";
import { getSupabaseClient } from "../lib/supabase.js";

export async function appointmentRoutes(app: FastifyInstance) {
  registerAuth(app);

  // List appointments
  app.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request as any).organizationId;
    const query = request.query as Record<string, string>;
    const date = query.date;
    const status = query.status;
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const supabase = getSupabaseClient();
    let q = supabase
      .from("appointments")
      .select("*, patient:patients(name, phone)", { count: "exact" })
      .eq("organization_id", orgId)
      .order("scheduled_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (date) {
      q = q.gte("scheduled_at", `${date}T00:00:00`).lt("scheduled_at", `${date}T23:59:59`);
    }
    if (status) q = q.eq("status", status);

    const { data, count, error } = await q;
    if (error) return reply.status(500).send({ error: error.message });
    return { data, total: count, page, limit };
  });

  // Create appointment
  app.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request as any).organizationId;
    const body = request.body as Record<string, unknown>;
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("appointments")
      .insert({ ...body, organization_id: orgId })
      .select()
      .single();

    if (error) return reply.status(400).send({ error: error.message });
    return reply.status(201).send({ data });
  });

  // Update appointment
  app.patch("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request as any).organizationId;
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("appointments")
      .update(body)
      .eq("id", id)
      .eq("organization_id", orgId)
      .select()
      .single();

    if (error) return reply.status(400).send({ error: error.message });
    return { data };
  });

  // Cancel appointment
  app.delete("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request as any).organizationId;
    const { id } = request.params as { id: string };
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("organization_id", orgId);

    if (error) return reply.status(400).send({ error: error.message });
    return { message: "Appointment cancelled" };
  });
}
