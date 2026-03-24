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
import { analyticsRoutes } from "./routes/analytics.js";
import { driveRoutes } from "./routes/drive.js";
import multipart from "@fastify/multipart";

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || "0.0.0.0";

async function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || "info",
    },
  });

  // Plugins
  const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim());
  await app.register(cors, {
    origin: corsOrigins,
    credentials: true,
  });

  await app.register(helmet);

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  await app.register(multipart, {
    limits: { fileSize: 50 * 1024 * 1024 },
  });

  // Routes
  await app.register(healthRoutes, { prefix: "/api" });
  await app.register(webhookRoutes, { prefix: "/api/webhooks" });
  await app.register(agentRoutes, { prefix: "/api/agents" });
  await app.register(conversationRoutes, { prefix: "/api/conversations" });
  await app.register(analyticsRoutes, { prefix: "/api/analytics" });
  await app.register(driveRoutes, { prefix: "/api/drive" });

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
