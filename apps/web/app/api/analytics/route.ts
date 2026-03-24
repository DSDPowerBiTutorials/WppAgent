import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isAuthError } from "@/lib/server/auth";
import { getSupabaseClient } from "@/lib/server/supabase";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (isAuthError(auth)) return auth;

  const { searchParams } = request.nextUrl;
  const endpoint = searchParams.get("endpoint") || "stats";

  if (endpoint === "events") {
    return getEvents(request, auth.organizationId);
  }

  // Default: stats
  return getStats(auth.organizationId);
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (isAuthError(auth)) return auth;

  const body = await request.json();
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("analytics_events")
    .insert({ ...body, organization_id: auth.organizationId })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}

async function getStats(orgId: string) {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  const [conversations, appointments, patients] = await Promise.all([
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .gte("created_at", `${today}T00:00:00`),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("date", today),
    supabase
      .from("patients")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
  ]);

  return NextResponse.json({
    data: {
      conversations_today: conversations.count || 0,
      appointments_today: appointments.count || 0,
      total_patients: patients.count || 0,
    },
  });
}

async function getEvents(request: NextRequest, orgId: string) {
  const days =
    Number(request.nextUrl.searchParams.get("days")) || 30;
  const supabase = getSupabaseClient();

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("analytics_events")
    .select("*")
    .eq("organization_id", orgId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
