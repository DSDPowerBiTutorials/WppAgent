/**
 * E2E Test Runner for WppAgent AI
 * Runs 16 interactions across 6 groups testing all agent capabilities
 */

const SB_URL = "https://ualgqndiwslrtzhinqho.supabase.co";
const SB_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhbGdxbmRpd3NscnR6aGlucWhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDMzNzcwNCwiZXhwIjoyMDg5OTEzNzA0fQ.DFOM-eDGfAChfJqeeVoD4KOkSkzvg3z86o46XAEB98g";
const SB_ANON = "sb_publishable_jEH37yP0c9jnQleb0wtr4w_zsAVh0PB";
const API_BASE = "https://wpp-agent.vercel.app";
const AGENT_ID = "7de0d5ed-41bd-4f02-9b33-d65648bfdf96";
const ORG_ID = "00000000-0000-0000-0000-000000000001";

import { createHash } from "crypto";

// ─── Helpers ─────────────────────────────────────────────
async function sbQuery(table, params = "") {
  const res = await fetch(`${SB_URL}/rest/v1/${table}${params}`, {
    headers: {
      apikey: SB_ANON,
      Authorization: `Bearer ${SB_SERVICE_KEY}`,
    },
  });
  return res.json();
}

async function sbInsert(table, data) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: SB_ANON,
      Authorization: `Bearer ${SB_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

// ─── Phase 0: Setup ─────────────────────────────────────
async function setup() {
  console.log("\n" + "=".repeat(60));
  console.log("FASE 0: SETUP");
  console.log("=".repeat(60));

  // 1. Create API key
  const rawKey = `wpp_e2etest_${Date.now()}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, 12);

  console.log(`\n[1] Creating API key: ${keyPrefix}...`);
  const keyResult = await sbInsert("api_keys", {
    name: "E2E Test Runner",
    key_hash: keyHash,
    key_prefix: keyPrefix,
    organization_id: ORG_ID,
    permissions: ["conversations:write", "conversations:read"],
  });

  if (keyResult.code || keyResult.message) {
    console.log(`   ⚠️ API key creation issue: ${JSON.stringify(keyResult)}`);
    console.log("   Trying to continue anyway...");
  } else {
    console.log(`   ✅ API key created: ${keyResult[0]?.id || "ok"}`);
  }

  // 2. Reset test environment
  console.log("\n[2] Resetting test environment...");
  try {
    const resetRes = await fetch(`${API_BASE}/api/conversations/test/reset`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${rawKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ agent_id: AGENT_ID }),
    });
    const resetData = await resetRes.json().catch(() => ({}));
    console.log(`   Status: ${resetRes.status} - ${JSON.stringify(resetData).slice(0, 200)}`);
  } catch (e) {
    console.log(`   ⚠️ Reset failed: ${e.message}`);
  }

  // 3. Check Clínica Conecta
  console.log("\n[3] Checking Clínica Conecta API...");
  try {
    const ccRes = await fetch("https://cl-nica-conecta.vercel.app/api/agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "Clinica@123",
      },
      body: JSON.stringify({ action: "list_specialties", data: {} }),
    });
    const ccData = await ccRes.json().catch(() => ({}));
    console.log(`   Status: ${ccRes.status}`);
    console.log(`   Response: ${JSON.stringify(ccData).slice(0, 300)}`);
    if (ccRes.ok) {
      console.log("   ✅ Clínica Conecta ONLINE");
    } else {
      console.log("   ⚠️ Clínica Conecta returned non-200");
    }
  } catch (e) {
    console.log(`   ❌ Clínica Conecta OFFLINE: ${e.message}`);
  }

  return rawKey;
}

// ─── Chat function ──────────────────────────────────────
async function sendMessage(apiKey, message, history = []) {
  const start = Date.now();
  try {
    const res = await fetch(`${API_BASE}/api/conversations/test`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_id: AGENT_ID,
        message,
        history,
        simulate_patient: true,
      }),
    });
    const elapsed = Date.now() - start;
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data, elapsed, error: null };
  } catch (e) {
    return { status: 0, data: null, elapsed: Date.now() - start, error: e.message };
  }
}

// ─── Test runner ────────────────────────────────────────
const results = [];

async function runTest(id, message, history, expectedTools, expectation) {
  console.log(`\n   [${id}] "${message}"`);
  const result = await sendMessage(globalApiKey, message, history);

  const reply = result.data?.data?.reply || result.data?.error || "(sem resposta)";
  const replySnippet = reply.slice(0, 250);

  console.log(`   ⏱️  ${result.elapsed}ms | Status: ${result.status}`);
  console.log(`   💬 ${replySnippet}`);

  // Heuristic analysis of the response
  let status = "❌";
  let toolEvidence = "Nenhuma";
  let realData = false;
  let notes = "";

  if (result.error) {
    status = "❌";
    notes = `Erro: ${result.error}`;
  } else if (result.status !== 200) {
    status = "❌";
    notes = `HTTP ${result.status}: ${JSON.stringify(result.data).slice(0, 150)}`;
  } else {
    // Analyze reply content vs expected tools
    const r = reply.toLowerCase();

    if (expectedTools.includes("nenhuma")) {
      // Greeting - just needs polite response
      status = r.length > 10 ? "✅" : "⚠️";
      notes = "Saudação";
    } else if (expectedTools.some(t => t.includes("specialt"))) {
      // Check for real specialties
      const hasSpecialties = ["clínic", "cardiolog", "dermatolog", "pediatr", "ortoped", "ginecolog"]
        .some(s => r.includes(s));
      realData = hasSpecialties;
      status = hasSpecialties ? "✅" : "⚠️";
      toolEvidence = hasSpecialties ? "Dados reais de especialidades" : "Resposta genérica";
      notes = hasSpecialties ? "Especialidades listadas" : "Sem lista de especialidades reais";
    } else if (expectedTools.some(t => t.includes("professional"))) {
      const hasDoctors = r.includes("dr") || r.includes("médic") || r.includes("profission");
      realData = hasDoctors;
      status = hasDoctors ? "✅" : "⚠️";
      toolEvidence = hasDoctors ? "Profissionais mencionados" : "Resposta genérica";
    } else if (expectedTools.some(t => t.includes("patient_info") || t.includes("get_patient"))) {
      const hasInfo = r.includes("paciente") || r.includes("test") || r.includes("nome") || r.includes("telefone") || r.includes("5500");
      realData = hasInfo;
      status = hasInfo ? "✅" : "⚠️";
      toolEvidence = hasInfo ? "Dados do paciente" : "Sem dados específicos";
    } else if (expectedTools.some(t => t.includes("appointment") && !t.includes("cancel") && !t.includes("reschedule") && !t.includes("confirm"))) {
      const hasAppt = r.includes("consult") || r.includes("agend") || r.includes("marcad") || r.includes("horári");
      status = hasAppt ? "✅" : "⚠️";
      toolEvidence = hasAppt ? "Menção a consultas/horários" : "Sem dados de agenda";
    } else if (expectedTools.some(t => t.includes("availability") || t.includes("available"))) {
      const hasSlots = r.includes("horári") || r.includes("disponív") || r.includes(":") || r.includes("manhã") || r.includes("tarde");
      realData = hasSlots;
      status = hasSlots ? "✅" : "⚠️";
      toolEvidence = hasSlots ? "Horários mostrados" : "Sem horários";
    } else if (expectedTools.some(t => t.includes("schedule") || t.includes("create_appointment"))) {
      const scheduled = r.includes("agend") || r.includes("marcad") || r.includes("confirm");
      realData = scheduled;
      status = scheduled ? "✅" : "⚠️";
      toolEvidence = scheduled ? "Agendamento mencionado" : "Sem confirmação";
    } else if (expectedTools.some(t => t.includes("confirm"))) {
      const confirmed = r.includes("confirm") || r.includes("presença");
      status = confirmed ? "✅" : "⚠️";
      toolEvidence = confirmed ? "Confirmação registrada" : "Sem evidência";
    } else if (expectedTools.some(t => t.includes("reschedule"))) {
      const rescheduled = r.includes("remarc") || r.includes("reagend") || r.includes("alter");
      status = rescheduled ? "✅" : "⚠️";
      toolEvidence = rescheduled ? "Remarcação mencionada" : "Sem evidência";
    } else if (expectedTools.some(t => t.includes("cancel"))) {
      const cancelled = r.includes("cancel") || r.includes("desmarc");
      status = cancelled ? "✅" : "⚠️";
      toolEvidence = cancelled ? "Cancelamento mencionado" : "Sem evidência";
    } else if (expectedTools.some(t => t.includes("exam"))) {
      const hasExam = r.includes("exam") || r.includes("hemograma") || r.includes("sangue") || r.includes("preparo") || r.includes("jejum");
      realData = hasExam;
      status = hasExam ? "✅" : "⚠️";
      toolEvidence = hasExam ? "Dados de exames" : "Sem dados";
    } else if (expectedTools.some(t => t.includes("financial"))) {
      const hasFin = r.includes("financ") || r.includes("pendênci") || r.includes("pagar") || r.includes("cobranç") || r.includes("não há") || r.includes("nenhuma");
      status = hasFin ? "✅" : "⚠️";
      toolEvidence = hasFin ? "Info financeira" : "Sem dados";
    } else if (expectedTools.some(t => t.includes("health_plan"))) {
      const hasPlans = r.includes("plano") || r.includes("convênio") || r.includes("saúde") || r.includes("aceitam");
      status = hasPlans ? "✅" : "⚠️";
      toolEvidence = hasPlans ? "Planos mencionados" : "Sem dados";
    } else if (expectedTools.some(t => t.includes("knowledge"))) {
      const hasKnowledge = r.includes("atendimento") || r.includes("funciona") || r.includes("horário") || r.includes("clínica");
      status = hasKnowledge ? "✅" : "⚠️";
      toolEvidence = hasKnowledge ? "Base de conhecimento" : "Sem dados";
    } else if (expectedTools.some(t => t.includes("transfer"))) {
      const transferred = r.includes("transfer") || r.includes("atendente") || r.includes("humano") || r.includes("encaminh");
      status = transferred ? "✅" : "⚠️";
      toolEvidence = transferred ? "Transferência mencionada" : "Sem evidência";
    }

    if (!notes) notes = replySnippet.slice(0, 100);
  }

  const entry = {
    id,
    message: message.slice(0, 50),
    expectedTools: expectedTools.join(", "),
    status,
    toolEvidence,
    realData,
    elapsed: result.elapsed,
    httpStatus: result.status,
    reply: replySnippet,
    notes,
  };

  results.push(entry);

  return { role: "assistant", content: reply };
}

// ─── Main ───────────────────────────────────────────────
let globalApiKey;

async function main() {
  globalApiKey = await setup();

  // ─── GROUP A: Information Queries ─────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("GRUPO A: INFORMAÇÕES E CONSULTAS");
  console.log("=".repeat(60));

  let historyA = [];

  const a1 = await runTest("A1", "Olá, boa tarde!", historyA, ["nenhuma"], "Saudação cordial");
  historyA.push({ role: "user", content: "Olá, boa tarde!" }, a1);

  const a2 = await runTest("A2", "Quais especialidades vocês atendem?", historyA, ["cc_list_specialties"], "Lista real de especialidades");
  historyA.push({ role: "user", content: "Quais especialidades vocês atendem?" }, a2);

  const a3 = await runTest("A3", "Quais médicos atendem na clínica?", historyA, ["cc_list_professionals"], "Nomes reais de profissionais");
  historyA.push({ role: "user", content: "Quais médicos atendem na clínica?" }, a3);

  const a4 = await runTest("A4", "Quero saber meus dados cadastrais", historyA, ["get_patient_info", "cc_get_patient"], "Dados do paciente teste");
  historyA.push({ role: "user", content: "Quero saber meus dados cadastrais" }, a4);

  const a5 = await runTest("A5", "Tenho alguma consulta marcada?", historyA, ["get_patient_appointments", "cc_list_appointments"], "Lista de agendamentos");
  historyA.push({ role: "user", content: "Tenho alguma consulta marcada?" }, a5);

  // ─── GROUP B: Scheduling ──────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("GRUPO B: AGENDAMENTO COMPLETO");
  console.log("=".repeat(60));

  let historyB = [];

  const b1 = await runTest("B1", "Quero marcar uma consulta de clínico geral", historyB, ["cc_list_specialties"], "Deve perguntar data/horário");
  historyB.push({ role: "user", content: "Quero marcar uma consulta de clínico geral" }, b1);

  const b2 = await runTest("B2", "Pode ser amanhã de manhã", historyB, ["check_availability", "cc_check_availability", "cc_check_available_dates"], "Horários disponíveis");
  historyB.push({ role: "user", content: "Pode ser amanhã de manhã" }, b2);

  const b3 = await runTest("B3", "Pode ser às 10:00", historyB, ["schedule_appointment", "cc_create_appointment"], "Confirmação do agendamento");
  historyB.push({ role: "user", content: "Pode ser às 10:00" }, b3);

  const b4 = await runTest("B4", "Quero confirmar minha presença nessa consulta", historyB, ["confirm_appointment", "cc_confirm_appointment"], "Presença confirmada");
  historyB.push({ role: "user", content: "Quero confirmar minha presença nessa consulta" }, b4);

  // ─── GROUP C: Modification ────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("GRUPO C: MODIFICAÇÃO DE AGENDAMENTO");
  console.log("=".repeat(60));

  // Use same history from B to have context of the appointment
  let historyC = [...historyB];

  const c1 = await runTest("C1", "Preciso remarcar essa consulta para depois de amanhã no mesmo horário", historyC, ["reschedule_appointment", "cc_reschedule_appointment"], "Remarcação efetiva");
  historyC.push({ role: "user", content: "Preciso remarcar essa consulta para depois de amanhã no mesmo horário" }, c1);

  const c2 = await runTest("C2", "Na verdade, preciso cancelar essa consulta", historyC, ["cancel_appointment", "cc_cancel_appointment"], "Cancelamento registrado");
  historyC.push({ role: "user", content: "Na verdade, preciso cancelar essa consulta" }, c2);

  // ─── GROUP D: Exams ───────────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("GRUPO D: EXAMES");
  console.log("=".repeat(60));

  let historyD = [];

  const d1 = await runTest("D1", "Quais exames de sangue vocês fazem?", historyD, ["search_exams"], "Lista de exames");
  historyD.push({ role: "user", content: "Quais exames de sangue vocês fazem?" }, d1);

  const d2 = await runTest("D2", "Preciso fazer um hemograma, como devo me preparar?", historyD, ["get_exam_details"], "Instruções de preparo");
  historyD.push({ role: "user", content: "Preciso fazer um hemograma, como devo me preparar?" }, d2);

  // ─── GROUP E: Financial ───────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("GRUPO E: FINANCEIRO E PLANOS");
  console.log("=".repeat(60));

  let historyE = [];

  const e1 = await runTest("E1", "Tenho alguma pendência financeira?", historyE, ["cc_query_financials"], "Dados financeiros");
  historyE.push({ role: "user", content: "Tenho alguma pendência financeira?" }, e1);

  const e2 = await runTest("E2", "Quais planos de saúde vocês aceitam?", historyE, ["cc_query_health_plans"], "Lista de convênios");
  historyE.push({ role: "user", content: "Quais planos de saúde vocês aceitam?" }, e2);

  // ─── GROUP F: Knowledge + Escalation ──────────────────
  console.log("\n" + "=".repeat(60));
  console.log("GRUPO F: BASE DE CONHECIMENTO + ESCALAÇÃO");
  console.log("=".repeat(60));

  let historyF = [];

  const f1 = await runTest("F1", "Como funciona o atendimento de vocês? Qual o horário?", historyF, ["cc_search_knowledge"], "Resposta da base de conhecimento");
  historyF.push({ role: "user", content: "Como funciona o atendimento de vocês? Qual o horário?" }, f1);

  const f2 = await runTest("F2", "Quero falar com um atendente humano, por favor", historyF, ["transfer_to_human"], "Transferência para humano");
  historyF.push({ role: "user", content: "Quero falar com um atendente humano, por favor" }, f2);

  // ─── Phase 2: Database Validation ─────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("FASE 2: VALIDAÇÃO NO BANCO DE DADOS");
  console.log("=".repeat(60));

  // Check analytics events
  console.log("\n[DB] Eventos de analytics:");
  const events = await sbQuery("analytics_events", `?organization_id=eq.${ORG_ID}&order=created_at.desc&limit=20&select=id,event_type,payload,created_at`);
  if (Array.isArray(events) && events.length > 0) {
    events.forEach((e) => {
      console.log(`   📊 ${e.event_type} @ ${e.created_at} | payload: ${JSON.stringify(e.payload).slice(0, 100)}`);
    });
  } else {
    console.log(`   ⚠️ Nenhum evento encontrado: ${JSON.stringify(events).slice(0, 200)}`);
  }

  // Check appointments for test patient
  console.log("\n[DB] Agendamentos do paciente teste:");
  const patients = await sbQuery("patients", `?phone=eq.%2B5500000000000&select=id,name,phone`);
  if (Array.isArray(patients) && patients.length > 0) {
    const patientId = patients[0].id;
    console.log(`   Paciente: ${patients[0].name} (${patients[0].id})`);
    const appts = await sbQuery("appointments", `?patient_id=eq.${patientId}&order=created_at.desc&limit=10&select=id,status,scheduled_at,specialty,created_at`);
    if (Array.isArray(appts) && appts.length > 0) {
      appts.forEach((a) => {
        console.log(`   📅 ${a.status} | ${a.specialty || "N/A"} | ${a.scheduled_at} | id: ${a.id}`);
      });
    } else {
      console.log(`   ⚠️ Nenhum agendamento: ${JSON.stringify(appts).slice(0, 200)}`);
    }
  } else {
    console.log(`   ⚠️ Paciente teste não encontrado: ${JSON.stringify(patients).slice(0, 200)}`);
  }

  // Check conversations/messages
  console.log("\n[DB] Conversas do paciente teste:");
  if (Array.isArray(patients) && patients.length > 0) {
    const convs = await sbQuery("conversations", `?patient_id=eq.${patients[0].id}&order=created_at.desc&limit=5&select=id,status,created_at`);
    if (Array.isArray(convs) && convs.length > 0) {
      for (const c of convs) {
        const msgs = await sbQuery("messages", `?conversation_id=eq.${c.id}&order=created_at.asc&select=role,content&limit=30`);
        const msgCount = Array.isArray(msgs) ? msgs.length : 0;
        console.log(`   💬 Conv ${c.id.slice(0, 8)}... | ${c.status} | ${msgCount} mensagens`);
      }
    } else {
      console.log(`   ⚠️ Nenhuma conversa: ${JSON.stringify(convs).slice(0, 200)}`);
    }
  }

  // ─── Phase 3: Final Report ────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("FASE 3: RELATÓRIO FINAL");
  console.log("=".repeat(60));

  console.log("\n┌──────┬────────────────────────────────────────┬────────┬───────────┬──────────────────────────────────────┐");
  console.log("│ ID   │ Mensagem                               │ Status │ Tempo(ms) │ Evidência de Tools                   │");
  console.log("├──────┼────────────────────────────────────────┼────────┼───────────┼──────────────────────────────────────┤");

  let passed = 0, partial = 0, failed = 0;
  for (const r of results) {
    const msg = r.message.padEnd(38).slice(0, 38);
    const ev = r.toolEvidence.padEnd(36).slice(0, 36);
    const time = String(r.elapsed).padStart(7);
    console.log(`│ ${r.id.padEnd(4)} │ ${msg} │ ${r.status.padEnd(6)} │ ${time}   │ ${ev} │`);
    if (r.status === "✅") passed++;
    else if (r.status === "⚠️") partial++;
    else failed++;
  }

  console.log("└──────┴────────────────────────────────────────┴────────┴───────────┴──────────────────────────────────────┘");

  console.log(`\n📊 RESUMO: ${passed} ✅ Passou | ${partial} ⚠️ Parcial | ${failed} ❌ Falhou | Total: ${results.length}`);

  // Detailed results as JSON
  console.log("\n" + "=".repeat(60));
  console.log("DETALHES COMPLETOS (JSON):");
  console.log("=".repeat(60));
  for (const r of results) {
    console.log(`\n--- ${r.id}: ${r.message} ---`);
    console.log(`Status: ${r.status} | HTTP: ${r.httpStatus} | Tempo: ${r.elapsed}ms`);
    console.log(`Tools esperadas: ${r.expectedTools}`);
    console.log(`Evidência: ${r.toolEvidence} | Dados reais: ${r.realData}`);
    console.log(`Resposta: ${r.reply}`);
    console.log(`Notas: ${r.notes}`);
  }

  // DB Events summary
  console.log("\n" + "=".repeat(60));
  console.log("EVENTOS NO SISTEMA (analytics_events):");
  console.log("=".repeat(60));
  if (Array.isArray(events) && events.length > 0) {
    const eventTypes = {};
    events.forEach(e => { eventTypes[e.event_type] = (eventTypes[e.event_type] || 0) + 1; });
    for (const [type, count] of Object.entries(eventTypes)) {
      console.log(`   ${type}: ${count}x`);
    }
    console.log(`\n   ✅ ${events.length} eventos registrados no sistema`);
  } else {
    console.log("   ⚠️ Nenhum evento de analytics registrado");
  }
}

main().catch(console.error);
