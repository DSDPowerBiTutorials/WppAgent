import { z } from "zod";

// ============================================================
// Organization
// ============================================================
export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

// ============================================================
// Agent
// ============================================================
export const voiceConfigSchema = z.object({
  tone: z.number().min(0).max(100),
  speed: z.number().min(0).max(100),
  accent: z.enum(["local", "neutral"]),
  personality: z.enum(["formal", "friendly", "empathetic", "professional"]).default("friendly"),
});

export const agentFeatures = [
  "faq",
  "scheduling",
  "absence_management",
  "payments",
  "case_management",
  "pre_post_op",
  "eligibility",
] as const;

export const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  system_prompt: z.string().min(10).max(10000),
  voice_config: voiceConfigSchema,
  features: z.array(z.enum(agentFeatures)),
  feature_config: z.record(z.unknown()).default({}),
  languages: z.array(z.string()).min(1),
  active: z.boolean().default(true),
  operating_hours: z
    .object({
      timezone: z.string(),
      schedule: z.record(
        z
          .object({
            start: z.string().regex(/^\d{2}:\d{2}$/),
            end: z.string().regex(/^\d{2}:\d{2}$/),
          })
          .nullable()
      ),
      outsideMessage: z.string().default(""),
    })
    .nullable()
    .optional(),
});

export const updateAgentSchema = createAgentSchema.partial();

// ============================================================
// Patient
// ============================================================
export const createPatientSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(10).max(20),
  email: z.string().email().optional(),
  date_of_birth: z.string().optional(),
  cpf: z.string().length(11).optional(),
  notes: z.string().max(5000).optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

// ============================================================
// Appointment
// ============================================================
export const createAppointmentSchema = z.object({
  patient_id: z.string().uuid(),
  doctor_name: z.string().min(1).max(200),
  specialty: z.string().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  duration_minutes: z.number().min(5).max(480).default(30),
  status: z
    .enum([
      "pending",
      "confirmed",
      "cancelled",
      "rescheduled",
      "completed",
      "no_show",
    ])
    .default("pending"),
  notes: z.string().max(2000).optional(),
});

export const updateAppointmentSchema = createAppointmentSchema.partial();

// ============================================================
// Message (incoming from WhatsApp)
// ============================================================
export const incomingMessageSchema = z.object({
  from: z.string(),
  message_id: z.string(),
  type: z.enum(["text", "image", "audio", "document"]),
  content: z.string(),
  timestamp: z.string(),
});

// ============================================================
// Pagination & Filters
// ============================================================
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  per_page: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

export const conversationFiltersSchema = paginationSchema.extend({
  status: z
    .enum(["active", "waiting_human", "human_takeover", "closed"])
    .optional(),
  patient_id: z.string().uuid().optional(),
  agent_id: z.string().uuid().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});

export const appointmentFiltersSchema = paginationSchema.extend({
  status: z
    .enum([
      "pending",
      "confirmed",
      "cancelled",
      "rescheduled",
      "completed",
      "no_show",
    ])
    .optional(),
  doctor_name: z.string().optional(),
  specialty: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});
