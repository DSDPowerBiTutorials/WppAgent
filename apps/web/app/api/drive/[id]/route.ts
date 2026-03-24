import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isAuthError } from "@/lib/server/auth";
import { getSupabaseClient } from "@/lib/server/supabase";

type Params = { params: Promise<{ id: string }> };

// Get single file metadata (or download URL via ?download=true)
export async function GET(request: NextRequest, { params }: Params) {
  const auth = await authenticateRequest(request);
  if (isAuthError(auth)) return auth;

  const { id } = await params;
  const download = request.nextUrl.searchParams.get("download") === "true";
  const supabase = getSupabaseClient();

  if (download) {
    const { data: file } = await supabase
      .from("drive_files")
      .select("storage_path")
      .eq("id", id)
      .eq("organization_id", auth.organizationId)
      .single();

    if (!file)
      return NextResponse.json({ error: "File not found" }, { status: 404 });

    const { data: signed, error } = await supabase.storage
      .from("drive")
      .createSignedUrl(file.storage_path, 300);

    if (error || !signed)
      return NextResponse.json(
        { error: "Failed to generate download URL" },
        { status: 500 }
      );
    return NextResponse.json({ url: signed.signedUrl });
  }

  const { data, error } = await supabase
    .from("drive_files")
    .select("*")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (error)
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  return NextResponse.json({ data });
}

// Update file metadata
export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await authenticateRequest(request);
  if (isAuthError(auth)) return auth;

  const { id } = await params;
  const body = (await request.json()) as {
    name?: string;
    category?: string;
    description?: string | null;
    tags?: string[];
  };

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.category !== undefined) updates.category = body.category;
  if (body.description !== undefined) updates.description = body.description;
  if (body.tags !== undefined) updates.tags = body.tags;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("drive_files")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  return NextResponse.json({ data });
}

// Delete file
export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await authenticateRequest(request);
  if (isAuthError(auth)) return auth;

  const { id } = await params;
  const supabase = getSupabaseClient();

  const { data: file } = await supabase
    .from("drive_files")
    .select("storage_path")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (!file)
    return NextResponse.json({ error: "File not found" }, { status: 404 });

  await supabase.storage.from("drive").remove([file.storage_path]);

  const { error } = await supabase
    .from("drive_files")
    .delete()
    .eq("id", id)
    .eq("organization_id", auth.organizationId);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}