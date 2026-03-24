import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
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
    { name: "NEXT_PUBLIC_SUPABASE_URL", description: "URL pública Supabase", configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
    { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", description: "Chave pública Supabase", configured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
  ];

  const endpoints = [
    { method: "GET", path: "/api/health", description: "Verificar status da API" },
    { method: "GET", path: "/api/agents", description: "Listar agentes" },
    { method: "POST", path: "/api/agents", description: "Criar agente" },
    { method: "GET", path: "/api/agents/:id", description: "Detalhes do agente" },
    { method: "PUT", path: "/api/agents/:id", description: "Atualizar agente" },
    { method: "DELETE", path: "/api/agents/:id", description: "Remover agente" },
    { method: "GET", path: "/api/conversations", description: "Listar conversas" },
    { method: "POST", path: "/api/conversations", description: "Criar conversa" },
    { method: "GET", path: "/api/conversations/:id", description: "Detalhes da conversa" },
    { method: "GET", path: "/api/conversations/:id/messages", description: "Mensagens da conversa" },
    { method: "POST", path: "/api/conversations/:id/messages", description: "Enviar mensagem" },
    { method: "POST", path: "/api/conversations/test", description: "Chat de teste com IA" },
    { method: "GET", path: "/api/analytics", description: "Dados analíticos" },
    { method: "GET", path: "/api/drive", description: "Listar arquivos" },
    { method: "POST", path: "/api/drive", description: "Upload de arquivo" },
    { method: "DELETE", path: "/api/drive/:id", description: "Remover arquivo" },
    { method: "GET/POST", path: "/api/webhooks/whatsapp", description: "Webhook do WhatsApp (Meta)" },
    { method: "GET", path: "/api/settings/api-info", description: "Informações da API (esta rota)" },
  ];

  // Only expose non-sensitive / public values
  const keys = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null,
    whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || null,
    openaiModel: process.env.OPENAI_MODEL || null,
    openaiBaseUrl: process.env.OPENAI_BASE_URL || null,
  };

  return NextResponse.json({
    baseUrl,
    endpoints,
    webhooks: {
      whatsapp: `${baseUrl}/api/webhooks/whatsapp`,
      health: `${baseUrl}/api/health`,
    },
    keys,
    envVars,
  });
}
