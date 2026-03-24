import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isAuthError } from "@/lib/server/auth";
import { getSupabaseClient } from "@/lib/server/supabase";
import { randomUUID } from "crypto";

const BUCKET = "drive";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "text/markdown",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/json",
]);

let bucketReady = false;
async function ensureBucket() {
  if (bucketReady) return;
  const supabase = getSupabaseClient();
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (!data) {
    await supabase.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: [...ALLOWED_MIME_TYPES],
    });
  }
  bucketReady = true;
}

// List files
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (isAuthError(auth)) return auth;

  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const supabase = getSupabaseClient();

  let query = supabase
    .from("drive_files")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .order("created_at", { ascending: false });

  if (category && category !== "all") {
    query = query.eq("category", category);
  }
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// Upload file
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (isAuthError(auth)) return auth;

  await ensureBucket();

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const mimeType = file.type;
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return NextResponse.json(
      { error: `Tipo de arquivo não permitido: ${mimeType}` },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Arquivo excede o limite de 50MB" },
      { status: 400 }
    );
  }

  const originalName = file.name;
  const ext = originalName.includes(".")
    ? originalName.split(".").pop()
    : "";
  const fileId = randomUUID();
  const storagePath = `${auth.organizationId}/${fileId}${ext ? `.${ext}` : ""}`;

  const supabase = getSupabaseClient();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: mimeType, upsert: false });

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message },
      { status: 500 }
    );
  }

  const category = (formData.get("category") as string) || "general";
  const description = (formData.get("description") as string) || null;
  const tagsRaw = (formData.get("tags") as string) || "[]";
  let tags: string[] = [];
  try {
    tags = JSON.parse(tagsRaw);
  } catch {
    tags = [];
  }

  const { data: fileRecord, error: dbError } = await supabase
    .from("drive_files")
    .insert({
      id: fileId,
      organization_id: auth.organizationId,
      name: originalName.replace(/\.[^.]+$/, ""),
      original_name: originalName,
      mime_type: mimeType,
      size_bytes: buffer.length,
      storage_path: storagePath,
      category,
      description,
      tags,
      uploaded_by: auth.userId,
    })
    .select()
    .single();

  if (dbError) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ data: fileRecord }, { status: 201 });
}
