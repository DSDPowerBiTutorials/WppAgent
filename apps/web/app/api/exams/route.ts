import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/server/supabase";
import { authenticateRequest, isAuthError } from "@/lib/server/auth";

// GET /api/exams — list exams catalog with search/filter
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (isAuthError(auth)) return auth;

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search");
  const category = searchParams.get("category");
  const page = Number(searchParams.get("page") || "1");
  const limit = Math.min(Number(searchParams.get("limit") || "50"), 200);
  const offset = (page - 1) * limit;

  const supabase = getSupabaseClient();

  let query = supabase
    .from("exams_catalog")
    .select(
      "id, name, category, preparation, requires_medical_order, medical_order_notes, active",
      { count: "exact" }
    )
    .eq("organization_id", auth.organizationId)
    .order("name")
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }
  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data || [],
    pagination: { page, limit, total: count || 0 },
  });
}
