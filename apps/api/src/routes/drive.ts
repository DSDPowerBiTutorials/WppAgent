import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { registerAuth } from "../middleware/auth.js";
import { getSupabaseClient } from "../lib/supabase.js";
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

// Ensure the storage bucket exists (idempotent)
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

export async function driveRoutes(app: FastifyInstance) {
  registerAuth(app);

  // List files
  app.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request as any).organizationId;
    const { category, search } = request.query as { category?: string; search?: string };
    const supabase = getSupabaseClient();

    let query = supabase
      .from("drive_files")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (category && category !== "all") {
      query = query.eq("category", category);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) return reply.status(500).send({ error: error.message });
    return { data };
  });

  // Get single file metadata
  app.get("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request as any).organizationId;
    const { id } = request.params as { id: string };
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("drive_files")
      .select("*")
      .eq("id", id)
      .eq("organization_id", orgId)
      .single();

    if (error) return reply.status(404).send({ error: "File not found" });
    return { data };
  });

  // Download file (signed URL)
  app.get("/:id/download", async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request as any).organizationId;
    const { id } = request.params as { id: string };
    const supabase = getSupabaseClient();

    const { data: file } = await supabase
      .from("drive_files")
      .select("storage_path")
      .eq("id", id)
      .eq("organization_id", orgId)
      .single();

    if (!file) return reply.status(404).send({ error: "File not found" });

    const { data: signed, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(file.storage_path, 300); // 5 min

    if (error || !signed) return reply.status(500).send({ error: "Failed to generate download URL" });
    return { url: signed.signedUrl };
  });

  // Upload file
  app.post("/upload", async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request as any).organizationId;

    await ensureBucket();

    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: "No file provided" });
    }

    const mimeType = data.mimetype;
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return reply.status(400).send({
        error: `Tipo de arquivo não permitido: ${mimeType}`,
      });
    }

    const buffer = await data.toBuffer();
    if (buffer.length > MAX_FILE_SIZE) {
      return reply.status(400).send({ error: "Arquivo excede o limite de 50MB" });
    }

    const originalName = data.filename;
    const ext = originalName.includes(".") ? originalName.split(".").pop() : "";
    const fileId = randomUUID();
    const storagePath = `${orgId}/${fileId}${ext ? `.${ext}` : ""}`;

    const supabase = getSupabaseClient();

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      return reply.status(500).send({ error: uploadError.message });
    }

    // Parse optional fields from multipart
    const fields = data.fields as Record<string, any>;
    const category = fields?.category?.value || "general";
    const description = fields?.description?.value || null;
    const tagsRaw = fields?.tags?.value || "[]";
    let tags: string[] = [];
    try {
      tags = JSON.parse(tagsRaw);
    } catch {
      tags = [];
    }

    // Save metadata
    const { data: fileRecord, error: dbError } = await supabase
      .from("drive_files")
      .insert({
        id: fileId,
        organization_id: orgId,
        name: originalName.replace(/\.[^.]+$/, ""),
        original_name: originalName,
        mime_type: mimeType,
        size_bytes: buffer.length,
        storage_path: storagePath,
        category,
        description,
        tags,
        uploaded_by: (request as any).userId || "system",
      })
      .select()
      .single();

    if (dbError) {
      // Rollback storage upload
      await supabase.storage.from(BUCKET).remove([storagePath]);
      return reply.status(500).send({ error: dbError.message });
    }

    return reply.status(201).send({ data: fileRecord });
  });

  // Update file metadata
  app.patch("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request as any).organizationId;
    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string;
      category?: string;
      description?: string | null;
      tags?: string[];
    };
    const supabase = getSupabaseClient();

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.category !== undefined) updates.category = body.category;
    if (body.description !== undefined) updates.description = body.description;
    if (body.tags !== undefined) updates.tags = body.tags;

    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({ error: "No fields to update" });
    }

    const { data, error } = await supabase
      .from("drive_files")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", orgId)
      .select()
      .single();

    if (error) return reply.status(404).send({ error: "File not found" });
    return { data };
  });

  // Delete file
  app.delete("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request as any).organizationId;
    const { id } = request.params as { id: string };
    const supabase = getSupabaseClient();

    // Get storage path before delete
    const { data: file } = await supabase
      .from("drive_files")
      .select("storage_path")
      .eq("id", id)
      .eq("organization_id", orgId)
      .single();

    if (!file) return reply.status(404).send({ error: "File not found" });

    // Delete from storage
    await supabase.storage.from(BUCKET).remove([file.storage_path]);

    // Delete metadata
    const { error } = await supabase
      .from("drive_files")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgId);

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(204).send();
  });
}
