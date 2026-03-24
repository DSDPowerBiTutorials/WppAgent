# WppAgent — IA que atende pacientes 24/7

Plataforma de agentes IA para atendimento de pacientes via WhatsApp. Agende, confirme e gerencie consultas automaticamente.

## Stack

- **Frontend:** Next.js 16 (App Router), Tailwind CSS v4, framer-motion
- **Backend:** Fastify + TypeScript
- **Database:** Supabase (PostgreSQL) com RLS
- **AI:** OpenAI GPT-4.1
- **WhatsApp:** Meta Cloud API (WhatsApp Business Platform)
- **Monorepo:** Turborepo com npm workspaces

## Estrutura

```
apps/
  web/          # Next.js — Landing page + Dashboard
  api/          # Fastify — REST API + Webhooks
packages/
  shared/       # Tipos, schemas Zod, constantes
  supabase/     # Migrações SQL
```

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env

# Rodar tudo (frontend + backend)
npm run dev

# Ou individualmente
cd apps/web && npm run dev   # http://localhost:3000
cd apps/api && npm run dev   # http://localhost:3001
```

## Banco de Dados

O projeto usa Supabase Postgres com o backend acessando o banco via `SUPABASE_SERVICE_ROLE_KEY`.

### Setup completo do Supabase

1. Crie um projeto no Supabase.
2. Copie `.env.example` para `.env` e preencha pelo menos:

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

3. No SQL Editor do Supabase, execute nesta ordem:

- `packages/supabase/migrations/001_initial.sql`
- `packages/supabase/migrations/002_add_feature_config.sql`
- `packages/supabase/seed.sql`

4. Suba a API e o frontend com `npm run dev`.

### O que cada parte habilita

- `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`: obrigatórios para a API subir.
- `OPENAI_API_KEY`: obrigatória para respostas reais do agente, incluindo o chat de teste.
- `OPENAI_MODEL`: opcional. O padrão do projeto é `gpt-4.1`.
- `OPENAI_BASE_URL`: opcional. Use apenas se quiser apontar o SDK para um gateway compatível com a API da OpenAI.
- `WHATSAPP_*`: obrigatórias apenas para testar webhook e envio real via WhatsApp.
- `SUPABASE_ANON_KEY`: mantida no exemplo de ambiente, mas não é usada pelo backend atual.

### Seed e autenticação em desenvolvimento

O arquivo `packages/supabase/seed.sql` cria a organização fixa `00000000-0000-0000-0000-000000000001`.

Em desenvolvimento, se nenhuma credencial Bearer for enviada, a API aplica bypass de autenticação e usa essa organização fixa. Esse comportamento está em `apps/api/src/middleware/auth.ts` e permite testar as rotas locais sem login completo.

### Validação mínima do ambiente

Depois de rodar as migrações e o seed, valide:

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/agents
```

Se o chat de teste devolver erro relacionado à IA, o ponto pendente costuma ser `OPENAI_API_KEY` ausente ou inválida.

### Integração com GPT-4.1

O backend usa o SDK oficial da OpenAI e envia requests pelo Responses API.

- Modelo padrão: `gpt-4.1`
- Chave obrigatória: `OPENAI_API_KEY`
- Timeout configurado no backend: 20 segundos
- Override de modelo: `OPENAI_MODEL`
- Override de endpoint: `OPENAI_BASE_URL`

O fluxo atual do engine:

1. Busca o `system_prompt` do agente no Supabase.
2. Converte o histórico local da conversa para o formato esperado pela OpenAI.
3. Envia `instructions` com o prompt do agente e `input` com o histórico + mensagem atual.
4. Lê a resposta textual a partir de `output_text`.

Isso vale tanto para o fluxo persistente de conversa quanto para o chat de teste efêmero do dashboard.

### Observações importantes sobre RLS

As migrações do repositório habilitam Row Level Security nas tabelas, mas o backend atual usa `SUPABASE_SERVICE_ROLE_KEY`, que ignora RLS, e o isolamento por organização acontece hoje principalmente na camada da aplicação via `organization_id` + middleware.

Este repositório também não inclui scripts automatizados de `migrate` ou `seed`; o setup atual é manual pelo SQL Editor do Supabase.

## Funcionalidades

- **Landing page** com hero, features, demo, analytics, integrações
- **Dashboard** com conversas, agentes, agendamentos, pacientes, analytics, integrações, configurações
- **API REST** com CRUD completo para agents, conversations, appointments, patients
- **Chat de teste** no dashboard para validar um agente com IA real sem persistir mensagens no banco
- **Webhook WhatsApp** para receber e responder mensagens automaticamente
- **AI Engine** com OpenAI GPT-4.1 para gerar respostas contextuais
- **Multi-tenant** com RLS por organização no Supabase
