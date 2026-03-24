import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/server/supabase";
import { authenticateRequest, isAuthError } from "@/lib/server/auth";

// GET /api/appointments — list appointments with filters
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (isAuthError(auth)) return auth;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const date = searchParams.get("date");
  const patientId = searchParams.get("patient_id");
  const page = Number(searchParams.get("page") || "1");
  const limit = Math.min(Number(searchParams.get("limit") || "20"), 100);
  const offset = (page - 1) * limit;

  const supabase = getSupabaseClient();

  let query = supabase
    .from("appointments")
    .select(
      "id, patient_id, conversation_id, doctor_name, specialty, date, time, duration_minutes, status, notes, created_at, patients(name, phone)",
      { count: "exact" }
    )
    .eq("organization_id", auth.organizationId)
    .order("date", { ascending: true })
    .order("time", { ascending: true })
    .range(offset, offset + limit - 1);

  if (status && status !== "all") query = query.eq("status", status);
  if (date) query = query.eq("date", date);
  if (patientId) query = query.eq("patient_id", patientId);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data || [],
    pagination: { page, limit, total: count || 0 },
  });
}

// POST /api/appointments — create appointment (from dashboard)
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (isAuthError(auth)) return auth;

  const body = await request.json();
  const {
    patient_id,
    doctor_name,
    specialty,
    date,
    time,
    duration_minutes = 30,
    notes,
  } = body;

  if (!patient_id || !doctor_name || !specialty || !date || !time) {
    return NextResponse.json(
      { error: "Campos obrigatórios: patient_id, doctor_name, specialty, date, time" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      organization_id: auth.organizationId,
      patient_id,
      doctor_name,
      specialty,
      date,
      time,
      duration_minutes,
      status: "pending",
      notes: notes || null,
    })
    .select("id, patient_id, doctor_name, specialty, date, time, duration_minutes, status, notes, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("analytics_events").insert({
    organization_id: auth.organizationId,
    event_type: "appointment_scheduled",
    payload: { appointment_id: data.id, patient_id, source: "dashboard" },
  });

  return NextResponse.json({ data }, { status: 201 });
}
