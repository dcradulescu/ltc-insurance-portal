import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import pino from "pino";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerLocalAuthRoutes } from "./localAuth";
import { requireApiSession } from "./sessionGate";
import { requirePageSession } from "./pageGate";
import { validateStartupConfiguration } from "./startupValidation";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getCspExternalSources, isOriginAllowed } from "./originConfig";
import { registerLocalStorageRoutes } from "../storage";

function buildLogger() {
  const level = process.env.NODE_ENV === "production" ? "info" : "debug";
  return pino({ level });
}

export const logger = buildLogger();

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

function buildProductionCsp() {
  const configuredSources = getCspExternalSources();

  return {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://fonts.googleapis.com", ...configuredSources],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.cloudfront.net", ...configuredSources],
      connectSrc: ["'self'", "https://hooks.zapier.com", ...configuredSources],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  };
}

async function startServer() {
  validateStartupConfiguration();

  const app = express();
  const server = createServer(app);

  if (process.env.NODE_ENV !== "test") {
    app.use(
      pinoHttp({
        logger,
        autoLogging: {
          ignore: req =>
            req.url?.startsWith("/assets/") ||
            req.url === "/api/trpc/system.health",
        },
      })
    );
  }

  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === "production" ? buildProductionCsp() : false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
      },
      credentials: true,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    })
  );

  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again in 15 minutes." },
    skip: req => process.env.NODE_ENV === "development",
  });

  const heavyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Too many strategy or PDF requests. Please wait 15 minutes before trying again.",
    },
    skip: req => process.env.NODE_ENV === "development",
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many auth requests. Please try again later." },
    skip: req => process.env.NODE_ENV === "development",
  });

  app.use("/api/oauth", authLimiter);
  app.use("/api/auth/local", authLimiter);
  app.use("/api/trpc/strategy.generate", heavyLimiter);
  app.use("/api/trpc/email", heavyLimiter);
  app.use("/api/trpc", generalLimiter);

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));

  app.use("/api/trpc/email", express.json({ limit: "10mb" }));
  app.use("/api/trpc/pdfDelivery", express.json({ limit: "10mb" }));

  registerLocalStorageRoutes(app);
  registerStorageProxy(app);
  registerLocalAuthRoutes(app);
  registerOAuthRoutes(app);

  app.use("/api/trpc", requireApiSession);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ error, path }) {
        if (error.code === "INTERNAL_SERVER_ERROR") {
          logger.error({ path, err: error }, "tRPC internal error");
        }
      },
    })
  );

  app.use(requirePageSession);

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = Number.parseInt(process.env.PORT || "3000", 10);
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    logger.warn(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    logger.info(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(err => {
  logger.error(err, "Failed to start server");
  process.exit(1);
});
