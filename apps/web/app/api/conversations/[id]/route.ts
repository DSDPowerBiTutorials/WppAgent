import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isAuthError } from "@/lib/server/auth";
import { getSupabaseClient } from "@/lib/server/supabase";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await authenticateRequest(request);
  if (isAuthError(auth)) return auth;

  const { id } = await params;
  const supabase = getSupabaseClient();

  const { data: conversation, error } = await supabase
    .from("conversations")
    .select("*, patient:patients(name, phone)")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (error)
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ data: { ...conversation, messages } });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await authenticateRequest(request);
  if (isAuthError(auth)) return auth;

  const { id } = await params;
  const body = await request.json();
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("conversations")
    .update(body)
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
