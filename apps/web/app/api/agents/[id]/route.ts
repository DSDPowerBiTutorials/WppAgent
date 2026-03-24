import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isAuthError } from "@/lib/server/auth";
import { getSupabaseClient } from "@/lib/server/supabase";
import { updateAgentSchema } from "@repo/shared/schemas";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await authenticateRequest(request);
  if (isAuthError(auth)) return auth;

  const { id } = await params;
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (error)
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await authenticateRequest(request);
  if (isAuthError(auth)) return auth;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateAgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("agents")
    .update(parsed.data)
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await authenticateRequest(request);
  if (isAuthError(auth)) return auth;

  const { id } = await params;
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("agents")
    .delete()
    .eq("id", id)
    .eq("organization_id", auth.organizationId);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}