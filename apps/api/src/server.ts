import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
const __dirname = fileURLToPath(new URL(".", import.meta.url));
config({ path: resolve(__dirname, "../../../.env") });

import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { healthRoutes } from "./routes/health.js";
import { webhookRoutes } from "./routes/webhooks.js";
import { agentRoutes } from "./routes/agents.js";
import { conversationRoutes } from "./routes/conversations.js";
import { appointmentRoutes } from "./routes/appointments.js";
import { patientRoutes } from "./routes/patients.js";
import { analyticsRoutes } from "./routes/analytics.js";

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || "0.0.0.0";

async function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || "info",
    },
  });

  // Plugins
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  });

  await app.register(helmet);

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  // Routes
  await app.register(healthRoutes, { prefix: "/api" });
  await app.register(webhookRoutes, { prefix: "/api/webhooks" });
  await app.register(agentRoutes, { prefix: "/api/agents" });
  await app.register(conversationRoutes, { prefix: "/api/conversations" });
  await app.register(appointmentRoutes, { prefix: "/api/appointments" });
  await app.register(patientRoutes, { prefix: "/api/patients" });
  await app.register(analyticsRoutes, { prefix: "/api/analytics" });

  return app;
}

buildServer()
  .then((app) => {
    app.listen({ port: PORT, host: HOST }, (err) => {
      if (err) {
        app.log.error(err);
        process.exit(1);
      }
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
