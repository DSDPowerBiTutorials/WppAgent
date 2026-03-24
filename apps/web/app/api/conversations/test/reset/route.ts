import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isAuthError } from "@/lib/server/auth";
import { getSupabaseClient } from "@/lib/server/supabase";

/**
 * POST /api/conversations/test/reset
 * Closes any active test conversations and optionally cleans up test appointments.
 * This lets the user start a fresh simulation.
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (isAuthError(auth)) return auth;

  const supabase = getSupabaseClient();
  const TEST_PHONE = "+5500000000000";

  // Find test patient
  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("organization_id", auth.organizationId)
    .eq("phone", TEST_PHONE)
    .single();

  if (!patient) {
    return NextResponse.json({ data: { reset: true, message: "Nenhum paciente de teste encontrado" } });
  }

  // Close all active test conversations
  const { data: closed } = await supabase
    .from("conversations")
    .update({ status: "closed", ended_at: new Date().toISOString() })
    .eq("organization_id", auth.organizationId)
    .eq("patient_id", patient.id)
    .in("status", ["active", "waiting_human"])
    .select("id");

  // Cancel all pending/confirmed test appointments
  const { data: cancelled } = await supabase
    .from("appointments")
    .update({ status: "cancelled", notes: "Cancelado: reset de simulação" })
    .eq("organization_id", auth.organizationId)
    .eq("patient_id", patient.id)
    .in("status", ["pending", "confirmed"])
    .select("id");

  return NextResponse.json({
    data: {
      reset: true,
      conversations_closed: closed?.length || 0,
      appointments_cancelled: cancelled?.length || 0,
    },
  });
}
