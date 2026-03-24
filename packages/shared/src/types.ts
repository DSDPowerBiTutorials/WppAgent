// ============================================================
// Organization
// ============================================================
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// User
// ============================================================
export type UserRole = "admin" | "operator";

export interface User {
  id: string;
  organization_id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Agent
// ============================================================
export type AgentFeature =
  | "faq"
  | "scheduling"
  | "absence_management"
  | "payments"
  | "case_management"
  | "pre_post_op"
  | "eligibility";

export interface AgentVoiceConfig {
  tone: number; // 0 (suave) to 100 (energético)
  speed: number; // 0 (devagar) to 100 (rápido)
  accent: "local" | "neutral";
}

export interface Agent {
  id: string;
  organization_id: string;
  name: string;
  avatar_url: string | null;
  system_prompt: string;
  voice_config: AgentVoiceConfig;
  features: AgentFeature[];
  languages: string[];
  active: boolean;
  operating_hours: OperatingHours | null;
  created_at: string;
  updated_at: string;
}

export interface OperatingHours {
  timezone: string;
  schedule: {
    [day: string]: { start: string; end: string } | null; // null = closed
  };
}

// ============================================================
// Patient
// ============================================================
export interface Patient {
  id: string;
  organization_id: string;
  name: string;
  phone: string;
  email: string | null;
  date_of_birth: string | null;
  cpf: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Conversation
// ============================================================
export type ConversationStatus =
  | "active"
  | "waiting_human"
  | "human_takeover"
  | "closed";

export interface Conversation {
  id: string;
  organization_id: string;
  patient_id: string;
  agent_id: string;
  whatsapp_chat_id: string;
  status: ConversationStatus;
  topic: string | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Message
// ============================================================
export type MessageRole = "patient" | "agent" | "system" | "human_operator";
export type MessageType = "text" | "image" | "audio" | "document" | "template";

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  type: MessageType;
  content: string;
  metadata: Record<string, unknown> | null;
  whatsapp_message_id: string | null;
  created_at: string;
}

// ============================================================
// Appointment
// ============================================================
export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "rescheduled"
  | "completed"
  | "no_show";

export interface Appointment {
  id: string;
  organization_id: string;
  patient_id: string;
  conversation_id: string | null;
  doctor_name: string;
  specialty: string;
  date: string;
  time: string;
  duration_minutes: number;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Analytics Event
// ============================================================
export type AnalyticsEventType =
  | "conversation_started"
  | "conversation_ended"
  | "appointment_scheduled"
  | "appointment_confirmed"
  | "appointment_cancelled"
  | "appointment_rescheduled"
  | "appointment_no_show"
  | "human_takeover"
  | "payment_sent"
  | "faq_answered";

export interface AnalyticsEvent {
  id: string;
  organization_id: string;
  event_type: AnalyticsEventType;
  payload: Record<string, unknown>;
  created_at: string;
}

// ============================================================
// Integration
// ============================================================
export type IntegrationType =
  | "whatsapp"
  | "iclinic"
  | "feegow"
  | "clinicorp"
  | "clinica_nas_nuvens"
  | "stenci"
  | "custom_webhook";

export type IntegrationStatus = "connected" | "disconnected" | "error";

export interface Integration {
  id: string;
  organization_id: string;
  type: IntegrationType;
  status: IntegrationStatus;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Dashboard Analytics
// ============================================================
export interface DashboardStats {
  conversations_today: number;
  appointments_today: number;
  confirmation_rate: number;
  time_saved_hours: number;
  conversations_trend: { date: string; count: number }[];
  top_specialties: { name: string; count: number; percentage: number }[];
  recent_conversations: Conversation[];
}

// ============================================================
// API Response
// ============================================================
export interface ApiResponse<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
