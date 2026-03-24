import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { auth } from "@/lib/auth-config";
import { getSupabaseClient } from "./supabase";

export interface AuthContext {
  userId: string;
  organizationId: string;
  userRole: string;
}

/**
 * Authenticate an API request. Supports three methods (tried in order):
 * 1. NextAuth session (from browser cookies — dashboard users)
 * 2. WppAgent API key (Bearer wpp_... — external integrations)
 * 3. Supabase JWT (Bearer <jwt> — Supabase Auth users)
 */
export async function authenticateRequest(
  request: Request
): Promise<AuthContext | NextResponse> {
  // 1. Try NextAuth session first (browser/dashboard requests with cookies)
  try {
    const session = await auth();
    if (session?.user) {
      const user = session.user as any;
      if (user.id && user.organizationId) {
        return {
          userId: user.id,
          organizationId: user.organizationId,
          userRole: user.role || "operator",
        };
      }
    }
  } catch {
    // Session check failed — continue to Bearer token check
  }

  // 2. Try Bearer token
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);

  // 2a. WppAgent API key (starts with "wpp_")
  if (token.startsWith("wpp_")) {
    return authenticateApiKey(token);
  }

  // 2b. Supabase JWT
  return authenticateSupabaseJwt(token);
}

/** Authenticate using a WppAgent API key */
async function authenticateApiKey(
  rawKey: string
): Promise<AuthContext | NextResponse> {
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const supabase = getSupabaseClient();

  const { data: apiKey } = await supabase
    .from("api_keys")
    .select("id, organization_id, permissions, expires_at, revoked_at")
    .eq("key_hash", keyHash)
    .single();

  if (!apiKey) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  if (apiKey.revoked_at) {
    return NextResponse.json({ error: "API key has been revoked" }, { status: 401 });
  }

  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
    return NextResponse.json({ error: "API key has expired" }, { status: 401 });
  }

  // Update last_used_at in background (fire-and-forget)
  supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", apiKey.id)
    .then();

  return {
    userId: "api-key",
    organizationId: apiKey.organization_id,
    userRole: "api",
  };
}

/** Authenticate using a Supabase JWT */
async function authenticateSupabaseJwt(
  token: string
): Promise<AuthContext | NextResponse> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) {
    return NextResponse.json(
      { error: "User not found in system" },
      { status: 403 }
    );
  }

  return {
    userId: dbUser.id,
    organizationId: dbUser.organization_id,
    userRole: dbUser.role,
  };
}

/** Type guard — returns true when auth failed (response) */
export function isAuthError(
  result: AuthContext | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
