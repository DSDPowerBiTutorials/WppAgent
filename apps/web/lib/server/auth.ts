import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { getSupabaseClient } from "./supabase";

export interface AuthContext {
  userId: string;
  organizationId: string;
  userRole: string;
}

/**
 * Authenticate an API request. Supports two methods:
 * 1. NextAuth session (from browser cookies — dashboard users)
 * 2. Bearer token with Supabase JWT (from external API calls)
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

  // 2. Try Bearer token (external API / Supabase JWT)
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);
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
