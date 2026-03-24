# WppAgent — IA que atende pacientes 24/7

Plataforma de agentes IA para atendimento de pacientes via WhatsApp. Agende, confirme e gerencie consultas automaticamente.

## Stack

- **Frontend:** Next.js 16 (App Router), Tailwind CSS v4, framer-motion
- **Backend:** Fastify + TypeScript
- **Database:** Supabase (PostgreSQL) com RLS
- **AI:** Anthropic Claude (claude-sonnet-4-20250514)
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

Execute a migração em `packages/supabase/migrations/001_initial.sql` no Supabase SQL Editor para criar as tabelas.

## Funcionalidades

- **Landing page** com hero, features, demo, analytics, integrações
- **Dashboard** com conversas, agentes, agendamentos, pacientes, analytics, integrações, configurações
- **API REST** com CRUD completo para agents, conversations, appointments, patients
- **Webhook WhatsApp** para receber e responder mensagens automaticamente
- **AI Engine** com Anthropic Claude para gerar respostas contextuais
- **Multi-tenant** com RLS por organização no Supabase
