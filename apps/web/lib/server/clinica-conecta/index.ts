import { ClinicaConectaClient } from "./client";

export * from "./types";
export { ClinicaConectaClient } from "./client";

// ─── Singleton ────────────────────────────────────────────────
let _client: ClinicaConectaClient | null = null;
let _tested = false;

/**
 * Returns a singleton ClinicaConectaClient instance.
 * Logs test-connection result on first call.
 */
export function getClinicaConectaClient(): ClinicaConectaClient {
  if (!_client) {
    _client = new ClinicaConectaClient();

    // Fire-and-forget connection test on first init
    if (!_tested) {
      _tested = true;
      _client
        .testConnection()
        .then((res) =>
          console.log("[Clínica Conecta] Conexão OK:", res.message || "success")
        )
        .catch((err) =>
          console.error("[Clínica Conecta] Falha na conexão:", err.message)
        );
    }
  }
  return _client;
}

/**
 * Check if the Clínica Conecta integration is configured.
 */
export function isClinicaConectaEnabled(): boolean {
  return !!(
    process.env.CLINICA_CONECTA_API_URL && process.env.CLINICA_CONECTA_API_KEY
  );
}
