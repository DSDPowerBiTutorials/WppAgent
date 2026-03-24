import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { getSupabaseClient } from "../lib/supabase.js";

const DEV_ORG_ID = "00000000-0000-0000-0000-000000000001";

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;

  // Dev bypass: no token + not production → use fixed org
  if (!authHeader?.startsWith("Bearer ") && process.env.NODE_ENV !== "production") {
    (request as any).userId = "dev";
    (request as any).organizationId = DEV_ORG_ID;
    (request as any).userRole = "admin";
    return;
  }

  if (!authHeader?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Missing or invalid token" });
  }

  const token = authHeader.slice(7);
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return reply.status(401).send({ error: "Invalid token" });
  }

  // Fetch user record with org
  const { data: dbUser } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) {
    return reply.status(403).send({ error: "User not found in system" });
  }

  (request as any).userId = dbUser.id;
  (request as any).organizationId = dbUser.organization_id;
  (request as any).userRole = dbUser.role;
}

export function registerAuth(app: FastifyInstance) {
  app.decorateRequest("userId", "");
  app.decorateRequest("organizationId", "");
  app.decorateRequest("userRole", "");
  app.addHook("preHandler", authMiddleware);
}
