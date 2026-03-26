// ─── Clínica Conecta API – TypeScript Interfaces ─────────────

// ── Patients ──────────────────────────────────────────────────
export interface CCPatient {
  id: string;
  name: string;
  cpf?: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CCCreatePatientInput {
  name: string;
  cpf?: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  notes?: string;
}

// ── Appointments ──────────────────────────────────────────────
export interface CCAppointment {
  id: string;
  patient_id: string;
  professional_id: string;
  date: string;
  date_key?: string;
  time: string;
  status: string;
  specialty?: string;
  notes?: string;
  patient_name?: string;
  professional_name?: string;
  patient?: { id: string; name: string; cpf?: string; phone?: string; cellphone?: string };
  professional?: { id: string; name: string; crm?: string };
  created_at?: string;
  updated_at?: string;
}

export interface CCAppointmentFilters {
  date?: string;
  date_from?: string;
  date_to?: string;
  professional_id?: string;
  patient_id?: string;
  status?: string;
}

export interface CCCreateAppointmentInput {
  patient_id: string;
  professional_id: string;
  date_key: string;
  time: string;
  notes?: string;
}

// ── Availability ──────────────────────────────────────────────
export interface CCAvailabilitySlots {
  professional_id: string;
  date: string;
  slots: string[];
}

export interface CCAvailableDates {
  professional_id: string;
  dates: string[];
  days_ahead: number;
}

// ── Professionals ─────────────────────────────────────────────
export interface CCProfessional {
  id: string;
  name: string;
  specialty?: string;
  specialty_id?: string;
  crm?: string;
  phone?: string;
  email?: string;
  active?: boolean;
}

export interface CCProfessionalFilters {
  specialty_id?: string;
  active?: boolean;
}

// ── Specialties ───────────────────────────────────────────────
export interface CCSpecialty {
  id: string;
  name: string;
  description?: string;
}

// ── Financials ────────────────────────────────────────────────
export interface CCFinancialRecord {
  id: string;
  patient_id: string;
  description: string;
  amount: number;
  status: string;
  due_date?: string;
  paid_at?: string;
  payment_method?: string;
  notes?: string;
  created_at?: string;
}

export interface CCFinancialSummary {
  total_pending: number;
  total_paid: number;
  total_overdue: number;
}

export interface CCFinancialResponse {
  records: CCFinancialRecord[];
  summary: CCFinancialSummary;
}

export interface CCFinancialFilters {
  patient_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

// ── Health Plans (Videx) ──────────────────────────────────────
export interface CCVidexMembership {
  id: string;
  patient_id: string;
  plan_name: string;
  card_number?: string;
  status: string;
  valid_until?: string;
}

export interface CCVidexContract {
  id: string;
  membership_id: string;
  plan_details: string;
  coverage?: string;
  copay?: number;
  status: string;
  start_date?: string;
  end_date?: string;
}

export interface CCVidexResponse {
  memberships: CCVidexMembership[];
}

// ── Knowledge Base (RAG) ──────────────────────────────────────
export interface CCKnowledgeSnippet {
  content: string;
  source?: string;
  score?: number;
}

export interface CCKnowledgeResponse {
  results: CCKnowledgeSnippet[];
  query: string;
}

// ── Connection Test ───────────────────────────────────────────
export interface CCTestConnectionResponse {
  success: boolean;
  message?: string;
  version?: string;
}

// ── Generic API Error ─────────────────────────────────────────
export interface CCApiError {
  error: string;
  details?: string;
  status?: number;
}
