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
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

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
    server.listen(port, () => {
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

type OriginPattern = string | RegExp;

function parseCommaSeparatedEnv(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

function getConfiguredOrigins(): string[] {
  return [
    process.env.APP_PUBLIC_URL,
    ...parseCommaSeparatedEnv(process.env.ALLOWED_ORIGINS),
  ].filter((origin): origin is string => Boolean(origin));
}

function getAllowedOrigins(): OriginPattern[] {
  const configuredOrigins = getConfiguredOrigins();

  return [
    ...configuredOrigins,
    /^https?:\/\/localhost(:\d+)?$/,
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
    ...(process.env.ALLOW_MANUS_ORIGINS === "true"
      ? [
          "https://ltcportal.manus.space",
          "https://ltcportal-7pnqfuuw.manus.space",
          /^https:\/\/\d+-[a-z0-9]+-[a-z0-9]+\.us\d+\.manus\.computer$/,
        ]
      : []),
  ];
}

const ALLOWED_ORIGINS = getAllowedOrigins();
const CONFIGURED_CSP_ORIGINS = getConfiguredOrigins();

function cspExternalOrigins(): string[] {
  return CONFIGURED_CSP_ORIGINS.length > 0 ? CONFIGURED_CSP_ORIGINS : [];
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ── HTTP request logger ──────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "test") {
    app.use(
      pinoHttp({
        logger,
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
  app.use(
    helmet({
      // Allow inline scripts needed by Vite HMR in development
      contentSecurityPolicy:
        process.env.NODE_ENV === "production"
          ? {
              directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                  "'self'",
                  "https://fonts.googleapis.com",
                  ...cspExternalOrigins(),
                ],
                styleSrc: [
                  "'self'",
                  "'unsafe-inline'",
                  "https://fonts.googleapis.com",
                ],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                imgSrc: [
                  "'self'",
                  "data:",
                  "blob:",
                  "https://*.cloudfront.net",
                  ...cspExternalOrigins(),
                ],
                connectSrc: [
                  "'self'",
                  "https://hooks.zapier.com",
                  ...cspExternalOrigins(),
                ],
                frameSrc: ["'none'"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: [],
              },
            }
          : false, // Disable CSP in development to allow Vite HMR
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
      allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
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

  // Strict limit for LLM/PDF routes: 20 req / 15 min per IP
  const heavyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error:
        "Too many strategy or PDF requests. Please wait 15 minutes before trying again.",
    },
    skip: req => process.env.NODE_ENV === "development",
  });

  // OAuth endpoints: 10 req / 15 min per IP
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many auth requests. Please try again later." },
    skip: req => process.env.NODE_ENV === "development",
  });

  app.use("/api/oauth", authLimiter);
  app.use(
    "/api/trpc/strategy.generate",
    heavyLimiter
  );
  app.use("/api/trpc/email", heavyLimiter);
  app.use("/api/trpc", generalLimiter);

  // ── Body parsers ──────────────────────────────────────────────────────────
  // Default: 1 MB limit for most routes
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));

  // Override with larger limit only for PDF/email delivery routes
  app.use("/api/trpc/email", express.json({ limit: "10mb" }));
  app.use("/api/trpc/pdfDelivery", express.json({ limit: "10mb" }));

  // ── Application routes ────────────────────────────────────────────────────
  // Storage proxy for /manus-storage/* paths
  registerStorageProxy(app);

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

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
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
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
