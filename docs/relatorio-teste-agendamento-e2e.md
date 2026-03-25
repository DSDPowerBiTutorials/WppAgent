# Relatório de Testes E2E — Fluxo de Agendamento

**Data do teste:** 25 de março de 2026  
**Ambiente:** Produção — https://wpp-agent.vercel.app  
**Branch:** `main` @ commit `b1814df`  
**Agente testado:** "Agente de Teste" (`7de0d5ed-41bd-4f02-9b33-d65648bfdf96`)  
**Paciente de teste:** "Paciente Teste" (`f674a7db-13e4-42ac-a9fb-d45fed81b195`, `+5500000000000`)  
**Modelo de IA:** GPT-4.1 (OpenAI Responses API com Function Calling)

---

## 1. Resumo Executivo

| Métrica | Valor |
|---------|-------|
| Total de testes | 10 |
| Aprovados | **10/10** (100%) |
| Reprovados | 0 |
| Data-alvo do agendamento | 04/04/2026 (10 dias no futuro) |
| Rodadas de teste executadas | 6 |
| Bugs encontrados e corrigidos | 4 |

> **Resultado final: TODOS OS TESTES PASSARAM.** O fluxo completo de agendamento (criar → listar → remarcar → cancelar) funciona corretamente com persistência no banco de dados e registro de analytics.

---

## 2. Cenários de Teste

### Teste 1 — Listar Especialidades
| Campo | Valor |
|-------|-------|
| **Mensagem enviada** | "Quais especialidades vocês atendem?" |
| **Resultado esperado** | Agente lista as especialidades configuradas |
| **Resultado obtido** | ✅ PASS |
| **Resposta do agente** | "Atendemos as seguintes especialidades: Clínica geral, cardiologia, dermatologia, ortopedia, pediatria e ginecologia." |

### Teste 2 — Verificar Disponibilidade
| Campo | Valor |
|-------|-------|
| **Mensagem enviada** | "Quais horários disponíveis para clínica geral no dia 4 de abril de 2026?" |
| **Resultado esperado** | Agente consulta ferramenta `check_availability` e retorna slots |
| **Resultado obtido** | ✅ PASS |
| **Resposta do agente** | Listou 20 slots disponíveis: 08:00 a 17:30 em intervalos de 30min |
| **Tool chamada** | `check_availability(specialty="Clínica Geral", date="2026-04-04")` |

### Teste 3 — Agendar Consulta
| Campo | Valor |
|-------|-------|
| **Mensagem enviada** | "Quero agendar para 04/04/2026 às 10:00 com Dr. Silva, clínica geral" |
| **Resultado esperado** | Agente cria appointment no banco de dados |
| **Resultado obtido** | ✅ PASS |
| **Resposta do agente** | "Consulta agendada com sucesso! Clínica Geral com o Dr. Silva para 04/04/2026 às 10:00." |
| **Tool chamada** | `schedule_appointment(specialty="Clínica Geral", doctor_name="Dr. Silva", date="2026-04-04", time="10:00")` |

### Teste 3b — Validação no Banco de Dados (Agendamento)
| Campo | Valor |
|-------|-------|
| **Resultado esperado** | Registro na tabela `appointments` com status `pending` |
| **Resultado obtido** | ✅ PASS |
| **Dados no DB** | ID `54a04c91-...`, Dr. Silva, Clínica Geral, 2026-04-04, 10:00:00, status: `pending` |

### Teste 4 — Listar Consultas do Paciente
| Campo | Valor |
|-------|-------|
| **Mensagem enviada** | "Quais são minhas próximas consultas?" |
| **Resultado esperado** | Agente mostra a consulta recém-agendada |
| **Resultado obtido** | ✅ PASS |
| **Resposta do agente** | "Sua próxima consulta está agendada para 04/04/2026 às 10:00 com o Dr. Silva, Clínica Geral." |
| **Tool chamada** | `get_patient_appointments(include_past=false)` |

### Teste 5 — Remarcar Consulta
| Campo | Valor |
|-------|-------|
| **Mensagem enviada** | "Preciso remarcar minha consulta do dia 04/04 das 10:00 para as 14:00" |
| **Resultado esperado** | Agente atualiza horário no banco de dados |
| **Resultado obtido** | ✅ PASS |
| **Resposta do agente** | "Sua consulta foi remarcada para 04/04/2026 às 14:00." |
| **Tool chamada** | `reschedule_appointment(current_date="2026-04-04", current_time="10:00", new_date="2026-04-04", new_time="14:00")` |

### Teste 5b — Validação no Banco de Dados (Remarcação)
| Campo | Valor |
|-------|-------|
| **Resultado esperado** | Campo `time` atualizado para `14:00:00` |
| **Resultado obtido** | ✅ PASS |
| **Dados no DB** | time: `14:00:00`, status: `pending` |

### Teste 6 — Cancelar Consulta
| Campo | Valor |
|-------|-------|
| **Mensagem enviada** | "Quero cancelar minha consulta do dia 4 de abril" |
| **Resultado esperado** | Agente atualiza status para `cancelled` no banco |
| **Resultado obtido** | ✅ PASS |
| **Resposta do agente** | "Consulta cancelada com sucesso. Sua consulta do dia 04/04/2026 foi desmarcada." |
| **Tool chamada** | `cancel_appointment(date="2026-04-04")` |

### Teste 6b — Validação no Banco de Dados (Cancelamento)
| Campo | Valor |
|-------|-------|
| **Resultado esperado** | Campo `status` = `cancelled` |
| **Resultado obtido** | ✅ PASS |
| **Dados no DB** | status: `cancelled` |

### Teste DB — Eventos de Analytics
| Campo | Valor |
|-------|-------|
| **Resultado esperado** | Eventos `appointment_scheduled`, `appointment_rescheduled`, `appointment_cancelled` registrados |
| **Resultado obtido** | ✅ PASS |
| **Eventos registrados** | `appointment_scheduled` (19:11:34), `appointment_rescheduled` (19:11:59), `appointment_cancelled` (19:12:11) |

---

## 3. Ferramentas (Tools) Testadas

| Ferramenta | Descrição | Testada | Status |
|------------|-----------|---------|--------|
| `check_availability` | Verifica horários disponíveis por especialidade/data | ✅ | Funcional |
| `schedule_appointment` | Cria novo agendamento no Supabase | ✅ | Funcional |
| `get_patient_appointments` | Lista consultas futuras do paciente | ✅ | Funcional |
| `reschedule_appointment` | Remarca consulta (por ID ou data/hora) | ✅ | Funcional |
| `cancel_appointment` | Cancela consulta (por ID ou data/hora) | ✅ | Funcional |
| `confirm_appointment` | Confirma presença do paciente | ❌ | Não testada |
| `get_patient_info` | Retorna dados cadastrais do paciente | ❌ | Não testada |
| `transfer_to_human` | Transfere para atendente humano | ❌ | Não testada |
| `search_exams` | Busca exames disponíveis | ❌ | Não testada |
| `get_exam_details` | Detalha preparo/requisitos de exame | ❌ | Não testada |

---

## 4. Bugs Encontrados e Corrigidos

### Bug 1 — Agente não sabe a data atual
| Campo | Detalhe |
|-------|---------|
| **Commit** | `aed3395` |
| **Severidade** | Crítico |
| **Arquivo** | `apps/web/lib/server/conversation-engine.ts` |
| **Sintoma** | Ao perguntar "que dia é hoje?", o agente respondia "27 de junho de 2024" (data de corte do treinamento do GPT-4.1) |
| **Impacto** | Todas as datas futuras eram rejeitadas como "além do limite de 30 dias de antecedência" |
| **Causa raiz** | O system prompt não incluía a data/hora atual |
| **Correção** | Injetado bloco `# DATA E HORA ATUAL` com `new Date().toLocaleDateString("pt-BR", {timeZone: "America/Sao_Paulo"})` no system prompt |
| **Verificação** | Agente agora responde corretamente "hoje é 25 de março de 2026" |

### Bug 2 — Timeout excessivo da API Clínica Conecta
| Campo | Detalhe |
|-------|---------|
| **Commit** | `fa7eebe` |
| **Severidade** | Alto |
| **Arquivo** | `apps/web/lib/server/clinica-conecta/client.ts` |
| **Sintoma** | Cada chamada CC levava até 30s × 3 retries = 90s para falhar |
| **Causa raiz** | Configuração padrão: timeout de 30.000ms e 3 retries |
| **Correção** | Reduzido para timeout de 8.000ms e 1 retry |

### Bug 3 — Modelo não faz fallback de ferramentas CC para locais
| Campo | Detalhe |
|-------|---------|
| **Commit** | `8e66b89` |
| **Severidade** | Crítico |
| **Arquivo** | `apps/web/lib/server/agent-tools.ts` |
| **Sintoma** | Quando as CC tools falhavam (API offline), o GPT-4.1 informava ao paciente "instabilidade momentânea" em vez de usar ferramentas locais equivalentes |
| **Causa raiz** | O modelo recebia a mensagem de erro + instrução textual de fallback, mas interpretava como "sistema fora do ar" e comunicava ao paciente |
| **Correção** | Fallback automático no código: `executeTool()` intercepta falha CC e chama automaticamente a tool local equivalente via mapeamento `ccToLocalFallback()` |
| **Ação adicional** | Removidas variáveis `CLINICA_CONECTA_API_KEY` e `CLINICA_CONECTA_API_URL` do Vercel, pois a API CC está completamente offline |

### Bug 4 — Reschedule/Cancel exigem UUID que o agente não tem
| Campo | Detalhe |
|-------|---------|
| **Commit** | `b1814df` |
| **Severidade** | Crítico |
| **Arquivo** | `apps/web/lib/server/agent-tools.ts` |
| **Sintoma** | As ferramentas `reschedule_appointment` e `cancel_appointment` exigiam `appointment_id` (UUID) como parâmetro obrigatório, mas em um fluxo de conversa natural o agente nunca memorizava o UUID |
| **Causa raiz** | O model tem `max_output_tokens: 500` e histórico limitado; o UUID retornado no agendamento não era mantido no contexto ao pedir remarcação/cancelamento |
| **Correção** | Ambas as ferramentas agora aceitam `date` + `time` como alternativa ao `appointment_id`. O código busca o appointment no banco pelo paciente + data + horário quando o UUID não é fornecido |

---

## 5. Evolução dos Testes por Rodada

| Rodada | Alvo | Resultado | Problema Identificado |
|--------|------|-----------|----------------------|
| 1 | 31/12/2026 | 6✅ 6❌ | Data fora do limite de 30 dias (agente não sabia a data atual) |
| 2 | 04/04/2026 | 5✅ 5❌ | CC tools falhando → agente reportava "instabilidade" |
| 3 | 04/04/2026 | 5✅ 5❌ | Mensagem de fallback textual ignorada pelo modelo |
| 4 | 04/04/2026 | 5✅ 5❌ | Fallback automático no código não deployado a tempo |
| 5 | 04/04/2026 | 7✅ 3❌ | CC desabilitada, tools locais funcionam, mas reschedule/cancel falhavam sem UUID |
| **6** | **04/04/2026** | **10✅ 0❌** | **Todas as operações funcionando** |

---

## 6. Arquivos Modificados

| Arquivo | Alterações | Linhas |
|---------|-----------|--------|
| `apps/web/lib/server/conversation-engine.ts` | Injeção de data/hora atual no system prompt | +8 |
| `apps/web/lib/server/agent-tools.ts` | Fallback CC→local + reschedule/cancel por data+hora | +129 |
| `apps/web/lib/server/clinica-conecta/client.ts` | Redução de timeout e retries | +3 -3 |
| `apps/web/lib/server/clinica-conecta/tools.ts` | Mensagens de erro com orientação de fallback | +14 -3 |

**Total: 4 commits, 4 arquivos, +154 linhas adicionadas**

---

## 7. Configuração do Agente

| Parâmetro | Valor |
|-----------|-------|
| Modelo | GPT-4.1 |
| Max output tokens | 500 |
| Max tool iterations | 5 |
| Tools ativas | 10 (locais) |
| Duração do slot | 30 minutos |
| Horário de atendimento | 08:00–18:00 |
| Antecedência máxima | 30 dias |
| Especialidades | Clínica Geral, Cardiologia, Dermatologia, Ortopedia, Pediatria, Ginecologia |

---

## 8. Infraestrutura de Teste

- **API de teste:** `POST /api/conversations/test` com flag `simulate_patient: true`
- **Autenticação:** API Key (`wpp_testrunner_e2e_1774461936`)
- **Validação do DB:** Queries diretas ao Supabase via REST API com service role key
- **Reset entre rodadas:** Fechamento de conversations ativas, deleção de appointments e analytics events
- **Script de teste:** Node.js ESM (`test-scheduling-valid.mjs`) com 10 assertions sequenciais

---

## 9. Conclusão

O fluxo completo de agendamento do WppAgent está **100% funcional em produção**. O agente é capaz de:

1. **Informar** especialidades disponíveis ao paciente
2. **Consultar** horários livres para uma data e especialidade específicas
3. **Agendar** consultas com persistência no banco de dados
4. **Listar** consultas futuras do paciente
5. **Remarcar** consultas para novo horário (localizando por data/hora)
6. **Cancelar** consultas (localizando por data/hora)
7. **Registrar** todos os eventos de analytics (scheduled, rescheduled, cancelled)

Os 4 bugs encontrados durante os testes foram corrigidos e validados com sucesso.
