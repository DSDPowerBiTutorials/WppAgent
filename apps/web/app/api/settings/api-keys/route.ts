import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { authenticateRequest, isAuthError } from "@/lib/server/auth";
import { getSupabaseClient } from "@/lib/server/supabase";

/** Generate a cryptographically secure API key with "wpp_" prefix */
function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const bytes = randomBytes(32);
  const raw = `wpp_${bytes.toString("base64url")}`;
  const hash = createHash("sha256").update(raw).digest("hex");
  const prefix = `wpp_${bytes.toString("base64url").slice(0, 8)}`;
  return { raw, hash, prefix };
}

// GET /api/settings/api-keys — list all API keys for the organization
export async function GET(request: Request) {
  const authResult = await authenticateRequest(request);
  if (isAuthError(authResult)) return authResult;

  const { organizationId, userRole } = authResult;
  if (userRole !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, permissions, last_used_at, expires_at, created_at, revoked_at")
    .eq("organization_id", organizationId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to load API keys" }, { status: 500 });
  }

  return NextResponse.json({ keys: data });
}

// POST /api/settings/api-keys — create a new API key
export async function POST(request: Request) {
  const authResult = await authenticateRequest(request);
  if (isAuthError(authResult)) return authResult;

  const { userId, organizationId, userRole } = authResult;
  if (userRole !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 100) {
    return NextResponse.json(
      { error: "Name is required (max 100 chars)" },
      { status: 400 }
    );
  }

  const permissions = Array.isArray(body.permissions) ? body.permissions : ["read", "write"];
  const expiresAt = body.expiresAt ? new Date(body.expiresAt).toISOString() : null;

  const { raw, hash, prefix } = generateApiKey();

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      organization_id: organizationId,
      name,
      key_hash: hash,
      key_prefix: prefix,
      permissions,
      expires_at: expiresAt,
      created_by: userId,
    })
    .select("id, name, key_prefix, permissions, expires_at, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
  }

  // Return the raw key ONLY at creation time — it cannot be retrieved later
  return NextResponse.json({ key: { ...data, rawKey: raw } }, { status: 201 });
}

// DELETE /api/settings/api-keys — revoke an API key
export async function DELETE(request: Request) {
  const authResult = await authenticateRequest(request);
  if (isAuthError(authResult)) return authResult;

  const { organizationId, userRole } = authResult;
  if (userRole !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const keyId = searchParams.get("id");
  if (!keyId) {
    return NextResponse.json({ error: "Missing key id" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("organization_id", organizationId)
    .is("revoked_at", null);

  if (error) {
    return NextResponse.json({ error: "Failed to revoke API key" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
