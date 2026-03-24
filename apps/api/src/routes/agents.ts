import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { registerAuth } from "../middleware/auth.js";
import { getSupabaseClient } from "../lib/supabase.js";
import { createAgentSchema, updateAgentSchema } from "@repo/shared/schemas";

export async function agentRoutes(app: FastifyInstance) {
  registerAuth(app);

  // List agents
  app.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request as any).organizationId;
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) return reply.status(500).send({ error: error.message });
    return { data };
  });

  // Get single agent
  app.get("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request as any).organizationId;
    const { id } = request.params as { id: string };
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("id", id)
      .eq("organization_id", orgId)
      .single();

    if (error) return reply.status(404).send({ error: "Agent not found" });
    return { data };
  });

  // Create agent
  app.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request as any).organizationId;
    const parsed = createAgentSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0]?.message ?? "Invalid data" });
    }
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("agents")
      .insert({ ...parsed.data, organization_id: orgId })
      .select()
      .single();

    if (error) return reply.status(400).send({ error: error.message });
    return reply.status(201).send({ data });
  });

  // Update agent
  app.patch("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request as any).organizationId;
    const { id } = request.params as { id: string };
    const parsed = updateAgentSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0]?.message ?? "Invalid data" });
    }
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("agents")
      .update(parsed.data)
      .eq("id", id)
      .eq("organization_id", orgId)
      .select()
      .single();

    if (error) return reply.status(400).send({ error: error.message });
    return { data };
  });

  // Delete agent
  app.delete("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request as any).organizationId;
    const { id } = request.params as { id: string };
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("agents")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgId);

    if (error) return reply.status(400).send({ error: error.message });
    return reply.status(204).send();
  });
}
