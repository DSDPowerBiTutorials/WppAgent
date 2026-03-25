# WppAgent — IA que atende pacientes 24/7

Plataforma de agentes IA para atendimento de pacientes via WhatsApp. Agende, confirme e gerencie consultas automaticamente.

## Stack

- **Frontend + API:** Next.js 16 (App Router), Route Handlers, Tailwind CSS v4
- **Database:** Supabase (PostgreSQL) com RLS
- **AI:** OpenAI GPT-4.1 com Function Calling (10 tools)
- **Auth:** NextAuth v5 + Supabase Auth + API Keys
- **WhatsApp:** Meta Cloud API (WhatsApp Business Platform)
- **Monorepo:** Turborepo com npm workspaces
- **Deploy:** Vercel (auto-deploy on push to main)

## Estrutura

```
apps/
  web/          # Next.js — Landing page + Dashboard + API Routes
packages/
  shared/       # Tipos, schemas Zod, constantes
  supabase/     # Migrações SQL (001-006)
  ui/           # Componentes compartilhados
```

## Desenvolvimento

```bash
npm install
cp .env.example .env   # preencher as variáveis
npm run dev             # http://localhost:3000
```

## Variáveis de Ambiente

### Obrigatórias

| Variável | Descrição |
|---|---|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role do Supabase |
| `OPENAI_API_KEY` | Chave da API OpenAI |
| `AUTH_SECRET` | Secret para NextAuth v5 (gere com `openssl rand -base64 32`) |
| `AUTH_TRUST_HOST` | `true` (necessário para deploy em Vercel) |

### WhatsApp (para produção)

| Variável | Descrição |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` | Token de acesso do Meta Business |
| `WHATSAPP_VERIFY_TOKEN` | Token de verificação do webhook |
| `WHATSAPP_PHONE_NUMBER_ID` | ID do número do WhatsApp Business |
| `WHATSAPP_APP_SECRET` | App Secret (para verificação HMAC-SHA256 do webhook) |

### Opcionais

| Variável | Descrição | Padrão |
|---|---|---|
| `OPENAI_MODEL` | Modelo OpenAI | `gpt-4.1` |
| `OPENAI_BASE_URL` | URL base do SDK OpenAI | `https://api.openai.com/v1` |
| `NEXTAUTH_URL` | URL da aplicação | `http://localhost:3000` |

## Banco de Dados

Execute as migrações no SQL Editor do Supabase, nesta ordem:

1. `packages/supabase/migrations/001_initial.sql` — tabelas base
2. `packages/supabase/migrations/002_add_feature_config.sql` — feature flags
3. `packages/supabase/migrations/003_drive_files.sql` — arquivos do Drive
4. `packages/supabase/migrations/004_exams_catalog.sql` — catálogo de exames (fuzzy search)
5. `packages/supabase/migrations/005_add_auth_id.sql` — auth_id na tabela users
6. `packages/supabase/migrations/006_api_keys.sql` — API keys para integração
7. `packages/supabase/seed.sql` — dados iniciais

## Autenticação

O sistema suporta 3 métodos de autenticação:

1. **NextAuth Session** — para o dashboard (login com email/senha)
2. **API Key** (`Bearer wpp_...`) — para integrações externas
3. **Supabase JWT** (`Bearer <jwt>`) — para clientes Supabase

### Login no Dashboard

- Acesse `/login` com as credenciais criadas no Supabase Auth
- Rotas protegidas por middleware (redirect para /login se não autenticado)

### API Keys para Integração

- Crie e gerencie no dashboard em **Settings → Segurança**
- As chaves são hasheadas com SHA-256 (a chave raw é exibida apenas na criação)
- Use no header: `Authorization: Bearer wpp_<key>`

## API Endpoints

### Públicos
- `GET /api/health` — health check

### Protegidos (requer auth)
- `GET/POST /api/agents` — CRUD de agentes
- `GET/POST /api/appointments` — CRUD de agendamentos
- `GET/POST /api/conversations` — conversas e mensagens
- `GET /api/exams` — catálogo de exames com busca
- `GET/POST /api/drive` — gerenciamento de arquivos
- `GET /api/analytics` — dados de analytics

### Admin (requer role admin)
- `GET/POST/DELETE /api/settings/api-keys` — gerenciar API keys
- `GET /api/settings/api-info` — informações da API

### Integração Externa
- `POST /api/v1/chat` — endpoint principal para sistemas externos

```bash
curl -X POST https://seu-dominio.vercel.app/api/v1/chat \
  -H "Authorization: Bearer wpp_sua_chave" \
  -H "Content-Type: application/json" \
  -d '{"message": "Quero agendar uma consulta", "patientPhone": "+5511999999999"}'
```

### Webhook WhatsApp
- `GET /api/webhooks/whatsapp` — verificação do webhook (Meta)
- `POST /api/webhooks/whatsapp` — recebe mensagens (HMAC-SHA256 verificado)

## AI Engine

O motor de IA usa OpenAI GPT-4.1 Responses API com Function Calling:

**Tools disponíveis:**
- `search_appointments` / `create_appointment` / `update_appointment` / `cancel_appointment`
- `search_patients` / `get_patient_info`
- `check_availability` / `get_business_hours`
- `search_exams` / `get_exam_details`

## Deploy na Vercel

O projeto faz deploy automático via push para `main`.

**Configuração da Vercel:**
- **Root Directory:** `apps/web`
- **Framework:** Next.js (auto-detect)

**Variáveis obrigatórias no painel Vercel (Settings → Environment Variables):**

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
OPENAI_API_KEY
AUTH_SECRET
AUTH_TRUST_HOST=true
WHATSAPP_ACCESS_TOKEN
WHATSAPP_VERIFY_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_APP_SECRET
```

## Funcionalidades

- **Landing page** com hero, features, demo, analytics, integrações
- **Dashboard** com conversas, agentes, agendamentos, drive, analytics, configurações
- **Sistema de login** com NextAuth v5 + Supabase Auth
- **API REST** com CRUD completo e 3 métodos de autenticação
- **API Keys** para integração segura com sistemas externos
- **Endpoint /api/v1/chat** para integração direta via API
- **Chat de teste** no dashboard para validar agentes com IA real
- **Webhook WhatsApp** com verificação HMAC-SHA256
- **AI Engine** com GPT-4.1 + Function Calling (10 tools)
- **Catálogo de exames** com busca fuzzy (pg_trgm)
- **Multi-tenant** com RLS por organização
