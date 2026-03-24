import { NextResponse } from "next/server";
import { getSupabaseClient } from "./supabase";

const DEV_ORG_ID = "00000000-0000-0000-0000-000000000001";

export interface AuthContext {
  userId: string;
  organizationId: string;
  userRole: string;
}

export async function authenticateRequest(
  request: Request
): Promise<AuthContext | NextResponse> {
  const authHeader = request.headers.get("authorization");

  // No token → use fixed org (auth system not yet implemented)
  // When login/auth is added, remove this bypass
  if (!authHeader?.startsWith("Bearer ")) {
    return { userId: "dev", organizationId: DEV_ORG_ID, userRole: "admin" };
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
