import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/server/supabase";
import { authenticateRequest, isAuthError } from "@/lib/server/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/appointments/:id
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await authenticateRequest(request);
  if (isAuthError(auth)) return auth;
  const { id } = await params;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, patient_id, conversation_id, doctor_name, specialty, date, time, duration_minutes, status, notes, created_at, updated_at, patients(name, phone, email)"
    )
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Consulta não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ data });
}

// PATCH /api/appointments/:id — update appointment
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await authenticateRequest(request);
  if (isAuthError(auth)) return auth;
  const { id } = await params;

  const body = await request.json();
  const allowed = ["doctor_name", "specialty", "date", "time", "duration_minutes", "status", "notes"];
  const updates: Record<string, unknown> = {};

  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("appointments")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .select("id, patient_id, doctor_name, specialty, date, time, duration_minutes, status, notes, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Falha ao atualizar consulta" }, { status: 500 });
  }

  // Log status change events
  if (updates.status) {
    const eventMap: Record<string, string> = {
      confirmed: "appointment_confirmed",
      cancelled: "appointment_cancelled",
      rescheduled: "appointment_rescheduled",
      no_show: "appointment_no_show",
    };
    const eventType = eventMap[updates.status as string];
    if (eventType) {
      await supabase.from("analytics_events").insert({
        organization_id: auth.organizationId,
        event_type: eventType,
        payload: { appointment_id: id, source: "dashboard" },
      });
    }
  }

  return NextResponse.json({ data });
}

// DELETE /api/appointments/:id
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await authenticateRequest(request);
  if (isAuthError(auth)) return auth;
  const { id } = await params;

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id)
    .eq("organization_id", auth.organizationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
