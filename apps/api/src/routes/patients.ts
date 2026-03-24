import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { registerAuth } from "../middleware/auth.js";
import { getSupabaseClient } from "../lib/supabase.js";

export async function patientRoutes(app: FastifyInstance) {
  registerAuth(app);

  // List patients
  app.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request as any).organizationId;
    const query = request.query as Record<string, string>;
    const search = query.search;
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const supabase = getSupabaseClient();
    let q = supabase
      .from("patients")
      .select("*", { count: "exact" })
      .eq("organization_id", orgId)
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1);

    if (search) {
      q = q.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, count, error } = await q;
    if (error) return reply.status(500).send({ error: error.message });
    return { data, total: count, page, limit };
  });

  // Get single patient
  app.get("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request as any).organizationId;
    const { id } = request.params as { id: string };
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("id", id)
      .eq("organization_id", orgId)
      .single();

    if (error) return reply.status(404).send({ error: "Patient not found" });
    return { data };
  });

  // Create patient
  app.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request as any).organizationId;
    const body = request.body as Record<string, unknown>;
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("patients")
      .insert({ ...body, organization_id: orgId })
      .select()
      .single();

    if (error) return reply.status(400).send({ error: error.message });
    return reply.status(201).send({ data });
  });

  // Update patient
  app.patch("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request as any).organizationId;
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("patients")
      .update(body)
      .eq("id", id)
      .eq("organization_id", orgId)
      .select()
      .single();

    if (error) return reply.status(400).send({ error: error.message });
    return { data };
  });
}
