import type {
  CCPatient,
  CCCreatePatientInput,
  CCAppointment,
  CCAppointmentFilters,
  CCCreateAppointmentInput,
  CCAvailabilitySlots,
  CCAvailableDates,
  CCProfessional,
  CCProfessionalFilters,
  CCSpecialty,
  CCFinancialResponse,
  CCFinancialFilters,
  CCVidexResponse,
  CCVidexContract,
  CCKnowledgeResponse,
  CCTestConnectionResponse,
} from "./types";

// ─── Clínica Conecta HTTP Client ─────────────────────────────

const MAX_RETRIES = 1;
const BASE_DELAY_MS = 500;
const REQUEST_TIMEOUT_MS = 8_000;

export class ClinicaConectaClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    const url = process.env.CLINICA_CONECTA_API_URL;
    const key = process.env.CLINICA_CONECTA_API_KEY;

    if (!url || !key) {
      throw new Error(
        "Missing CLINICA_CONECTA_API_URL or CLINICA_CONECTA_API_KEY environment variables"
      );
    }

    // Remove trailing slash
    this.baseUrl = url.replace(/\/+$/, "");
    this.apiKey = key;
  }

  // ── Core request with retry + timeout ───────────────────
  private async request<T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    options?: { body?: unknown; params?: Record<string, string | undefined> }
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);

    // Append query params (skip undefined values)
    if (options?.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined) {
          url.searchParams.set(key, value);
        }
      }
    }

    const headers: Record<string, string> = {
      "X-Agent-Key": this.apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const res = await fetch(url.toString(), {
          method,
          headers,
          body: options?.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (res.ok) {
          return (await res.json()) as T;
        }

        // 4xx errors: don't retry, throw immediately
        if (res.status >= 400 && res.status < 500) {
          const errorBody = await res.text();
          let parsed: { error?: string; details?: string } = {};
          try {
            parsed = JSON.parse(errorBody);
          } catch {
            // not JSON
          }
          throw new Error(
            parsed.error || `Clínica Conecta API: ${res.status} – ${errorBody.slice(0, 200)}`
          );
        }

        // 5xx errors: retry with backoff
        lastError = new Error(`Clínica Conecta API: ${res.status}`);
      } catch (err: any) {
        clearTimeout(timeout);

        if (err.name === "AbortError") {
          lastError = new Error("Clínica Conecta API: request timeout (30s)");
        } else if (err.message?.startsWith("Clínica Conecta API:") && !err.message.includes("5")) {
          // 4xx already thrown above — don't retry
          throw err;
        } else {
          lastError = err;
        }
      }

      // Wait before retry (exponential backoff: 1s → 2s → 4s)
      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error("Clínica Conecta API: unknown error");
  }

  // ── Connection Test ─────────────────────────────────────
  async testConnection(): Promise<CCTestConnectionResponse> {
    return this.request<CCTestConnectionResponse>("GET", "/test-connection");
  }

  // ── Patients ────────────────────────────────────────────
  async searchPatients(q: string, limit?: number): Promise<CCPatient[]> {
    return this.request<CCPatient[]>("GET", "/patients", {
      params: { q, limit: limit?.toString() },
    });
  }

  async getPatient(id: string): Promise<CCPatient> {
    return this.request<CCPatient>("GET", `/patients/${encodeURIComponent(id)}`);
  }

  async createPatient(data: CCCreatePatientInput): Promise<CCPatient> {
    return this.request<CCPatient>("POST", "/patients", { body: data });
  }

  // ── Appointments ────────────────────────────────────────
  async getAppointments(filters?: CCAppointmentFilters): Promise<CCAppointment[]> {
    return this.request<CCAppointment[]>("GET", "/appointments", {
      params: filters as Record<string, string | undefined>,
    });
  }

  async createAppointment(data: CCCreateAppointmentInput): Promise<CCAppointment> {
    return this.request<CCAppointment>("POST", "/appointments", { body: data });
  }

  async confirmAppointment(id: string): Promise<CCAppointment> {
    return this.request<CCAppointment>(
      "PATCH",
      `/appointments/${encodeURIComponent(id)}/confirm`
    );
  }

  async cancelAppointment(id: string, cancelledBy?: string): Promise<CCAppointment> {
    return this.request<CCAppointment>(
      "PATCH",
      `/appointments/${encodeURIComponent(id)}/cancel`,
      { body: cancelledBy ? { cancelled_by: cancelledBy } : undefined }
    );
  }

  async rescheduleAppointment(
    id: string,
    newDate: string,
    newTime: string
  ): Promise<CCAppointment> {
    return this.request<CCAppointment>(
      "PATCH",
      `/appointments/${encodeURIComponent(id)}/reschedule`,
      { body: { new_date: newDate, new_time: newTime } }
    );
  }

  // ── Availability ────────────────────────────────────────
  async getAvailableSlots(professionalId: string, date: string): Promise<CCAvailabilitySlots> {
    return this.request<CCAvailabilitySlots>("GET", "/availability", {
      params: { professionalId, date },
    });
  }

  async getAvailableDates(professionalId: string, daysAhead?: number): Promise<CCAvailableDates> {
    return this.request<CCAvailableDates>("GET", "/availability", {
      params: {
        professionalId,
        type: "dates",
        days_ahead: daysAhead?.toString(),
      },
    });
  }

  // ── Financials ──────────────────────────────────────────
  async getFinancials(filters?: CCFinancialFilters): Promise<CCFinancialResponse> {
    return this.request<CCFinancialResponse>("GET", "/financials", {
      params: filters as Record<string, string | undefined>,
    });
  }

  // ── Health Plans (Videx) ────────────────────────────────
  async getVidexMemberships(patientId: string): Promise<CCVidexResponse> {
    return this.request<CCVidexResponse>("GET", "/videx", {
      params: { patientId },
    });
  }

  async getVidexContract(contractId: string): Promise<CCVidexContract> {
    return this.request<CCVidexContract>(
      "GET",
      `/videx/contracts/${encodeURIComponent(contractId)}`
    );
  }

  // ── Professionals ───────────────────────────────────────
  async getProfessionals(filters?: CCProfessionalFilters): Promise<CCProfessional[]> {
    return this.request<CCProfessional[]>("GET", "/professionals", {
      params: {
        specialtyId: filters?.specialty_id,
        active: filters?.active?.toString(),
      },
    });
  }

  // ── Specialties ─────────────────────────────────────────
  async getSpecialties(): Promise<CCSpecialty[]> {
    return this.request<CCSpecialty[]>("GET", "/specialties");
  }

  // ── Knowledge Base (RAG) ────────────────────────────────
  async queryKnowledge(query: string, topK?: number): Promise<CCKnowledgeResponse> {
    return this.request<CCKnowledgeResponse>("POST", "/knowledge", {
      body: { query, top_k: topK },
    });
  }
}
