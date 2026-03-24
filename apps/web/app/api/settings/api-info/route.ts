import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isAuthError } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (isAuthError(auth)) return auth;

  const host = request.headers.get("host") || "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || "http";
  const baseUrl = `${proto}://${host}`;

  const envVars = [
    { name: "SUPABASE_URL", description: "URL do projeto Supabase", configured: !!process.env.SUPABASE_URL },
    { name: "SUPABASE_SERVICE_ROLE_KEY", description: "Chave admin do Supabase", configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY },
    { name: "OPENAI_API_KEY", description: "Chave da API OpenAI", configured: !!process.env.OPENAI_API_KEY },
    { name: "OPENAI_MODEL", description: "Modelo de IA (ex: gpt-4.1)", configured: !!process.env.OPENAI_MODEL },
    { name: "OPENAI_BASE_URL", description: "URL base da OpenAI", configured: !!process.env.OPENAI_BASE_URL },
    { name: "WHATSAPP_ACCESS_TOKEN", description: "Token de acesso Meta", configured: !!process.env.WHATSAPP_ACCESS_TOKEN },
    { name: "WHATSAPP_VERIFY_TOKEN", description: "Token de verificação webhook", configured: !!process.env.WHATSAPP_VERIFY_TOKEN },
    { name: "WHATSAPP_PHONE_NUMBER_ID", description: "ID do número WhatsApp", configured: !!process.env.WHATSAPP_PHONE_NUMBER_ID },
    { name: "NEXTAUTH_SECRET", description: "Secret do NextAuth", configured: !!process.env.NEXTAUTH_SECRET },
  ];

  const endpoints = [
    { method: "GET", path: "/api/health", description: "Verificar status da API" },
    { method: "GET", path: "/api/agents", description: "Listar agentes" },
    { method: "POST", path: "/api/agents", description: "Criar agente" },
    { method: "GET", path: "/api/agents/:id", description: "Detalhes do agente" },
    { method: "PUT", path: "/api/agents/:id", description: "Atualizar agente" },
    { method: "DELETE", path: "/api/agents/:id", description: "Remover agente" },
    { method: "GET", path: "/api/conversations", description: "Listar conversas" },
    { method: "GET", path: "/api/conversations/:id", description: "Detalhes da conversa" },
    { method: "GET", path: "/api/conversations/:id/messages", description: "Mensagens da conversa" },
    { method: "POST", path: "/api/conversations/test", description: "Chat de teste com IA" },
    { method: "GET", path: "/api/analytics", description: "Dados analíticos" },
    { method: "GET", path: "/api/exams", description: "Catálogo de exames" },
    { method: "GET", path: "/api/appointments", description: "Listar agendamentos" },
    { method: "POST", path: "/api/appointments", description: "Criar agendamento" },
  ];

  return NextResponse.json({
    baseUrl,
    endpoints,
    webhooks: {
      whatsapp: `${baseUrl}/api/webhooks/whatsapp`,
      health: `${baseUrl}/api/health`,
    },
    config: {
      openaiModel: process.env.OPENAI_MODEL || null,
      openaiBaseUrl: process.env.OPENAI_BASE_URL || null,
    },
    envVars,
  });
}
