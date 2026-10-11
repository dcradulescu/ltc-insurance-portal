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
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic } from "./vite";
import { registerBodyParsers } from "./bodyParsers";
import { registerRequestSecurity } from "./requestSecurity";

// Structured logger — replaces console.log in production
// pino-pretty is optional (dev only); fall back to plain JSON if unavailable
function buildLogger() {
  const level = process.env.NODE_ENV === "production" ? "info" : "debug";
  if (process.env.NODE_ENV !== "production") {
    try {
      require.resolve("pino-pretty");
      return pino({ level, transport: { target: "pino-pretty", options: { colorize: true } } });
    } catch {
      // pino-pretty not installed — use plain JSON output
    }
  }
  return pino({ level });
}
export const logger = buildLogger();

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen({ port, host: process.env.HOST }, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// Allowed origins for CORS. Configure production origins with CORS_ORIGINS.
const configuredOrigins = (process.env.CORS_ORIGINS || process.env.APP_PUBLIC_URL || "")
  .split(",")
  .map(value => value.trim().replace(/\/$/, ""))
  .filter(Boolean);

const ALLOWED_ORIGINS: Array<string | RegExp> = [
  ...configuredOrigins,
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
];

async function startServer() {
  const app = express();
  // Set only to the known reverse-proxy hop count, never blanket trust.
  if (process.env.TRUST_PROXY_HOPS) app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS));
  const server = createServer(app);

  // ── HTTP request logger ──────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "test") {
    app.use(
      pinoHttp({
        logger,
        serializers: { req: req => ({ method: req.method, url: req.url?.split("?")[0] }), res: res => ({ statusCode: res.statusCode }) },
        // Skip logging for static assets and health checks
        autoLogging: {
          ignore: req =>
            req.url?.startsWith("/assets/") ||
            req.url === "/api/trpc/system.health",
        },
      })
    );
  }

  // ── Security headers (Helmet) ────────────────────────────────────────────
  // NOTE: CSP scriptSrc is intentionally disabled because Vite's production
  // build injects inline bootstrap scripts that cannot be nonce/hash-whitelisted
  // without a custom Vite plugin. All other Helmet protections remain active.
  // HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy are all on.
  app.use(
    helmet({
      contentSecurityPolicy: false, // Vite inline scripts are incompatible with strict CSP without nonce plugin
      crossOriginEmbedderPolicy: false, // Required for CDN images
    })
  );

  // ── CORS ─────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (curl, mobile apps, same-origin)
        if (!origin) return callback(null, true);
        const allowed = ALLOWED_ORIGINS.some(pattern =>
          typeof pattern === "string"
            ? pattern === origin
            : pattern.test(origin)
        );
        if (allowed) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
      },
      credentials: true,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Cookie", "x-ltc-request"],
    })
  );

  // ── Rate limiting ─────────────────────────────────────────────────────────
  // General API rate limit: 200 req / 15 min per IP
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again in 15 minutes." },
    skip: req => process.env.NODE_ENV === "development",
  });

  app.use("/api/trpc", generalLimiter);

  // ── Body parsers ──────────────────────────────────────────────────────────
  // Default: 1 MB limit for most routes
  registerRequestSecurity(app);
  registerBodyParsers(app);

  // Simple hosting/load-balancer health check.
  app.get("/healthz", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  // ── Application routes ────────────────────────────────────────────────────
  // Stable application proxy for private S3 objects.
  registerStorageProxy(app);

  // tRPC API
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

  // ── Static / Vite ─────────────────────────────────────────────────────────
  if (process.env.NODE_ENV === "development") {
    const { setupVite } = await import("./devServer");
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    logger.warn(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen({ port, host: process.env.HOST }, () => {
    logger.info(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(err => {
  logger.error(err, "Failed to start server");
  process.exit(1);
});
