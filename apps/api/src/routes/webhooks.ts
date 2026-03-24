import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { WhatsAppService } from "../integrations/whatsapp/service.js";

export async function webhookRoutes(app: FastifyInstance) {
  // WhatsApp webhook verification (GET)
  app.get(
    "/whatsapp",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as Record<string, string>;
      const mode = query["hub.mode"];
      const token = query["hub.verify_token"];
      const challenge = query["hub.challenge"];

      const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

      if (mode === "subscribe" && token === verifyToken) {
        app.log.info("WhatsApp webhook verified");
        return reply.status(200).send(challenge);
      }

      return reply.status(403).send("Forbidden");
    }
  );

  // WhatsApp webhook messages (POST)
  app.post(
    "/whatsapp",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as any;

      // Return 200 immediately as per Meta requirements
      reply.status(200).send("EVENT_RECEIVED");

      try {
        const entry = body?.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        if (!value?.messages?.[0]) return;

        const message = value.messages[0];
        const contact = value.contacts?.[0];
        const phoneNumberId = value.metadata?.phone_number_id;

        await WhatsAppService.handleIncomingMessage({
          from: message.from,
          name: contact?.profile?.name || "Desconhecido",
          messageId: message.id,
          timestamp: message.timestamp,
          type: message.type,
          text: message.text?.body || "",
          phoneNumberId,
        });
      } catch (err) {
        app.log.error(err, "Error processing WhatsApp webhook");
      }
    }
  );
}
