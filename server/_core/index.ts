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
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getCspExternalSources, isOriginAllowed } from "./originConfig";
import { registerLocalStorageRoutes } from "../storage";

function buildLogger() { const level = process.env.NODE_ENV === "production" ? "info" : "debug"; return pino({ level }); }
export const logger = buildLogger();
function isPortAvailable(port:number):Promise<boolean>{return new Promise(r=>{const s=net.createServer();s.listen(port,()=>s.close(()=>r(true)));s.on("error",()=>r(false));});}
async function findAvailablePort(startPort:number=3000){for(let p=startPort;p<startPort+20;p++){if(await isPortAvailable(p)) return p;} throw new Error("No available port found");}
function buildProductionCsp(){const configuredSources=getCspExternalSources();return {directives:{defaultSrc:["'self'"],scriptSrc:["'self'","https://fonts.googleapis.com",...configuredSources],styleSrc:["'self'","'unsafe-inline'","https://fonts.googleapis.com"],fontSrc:["'self'","https://fonts.gstatic.com"],imgSrc:["'self'","data:","blob:","https://*.cloudfront.net",...configuredSources],connectSrc:["'self'","https://hooks.zapier.com",...configuredSources],frameSrc:["'none'"],objectSrc:["'none'"]}};}
async function startServer(){const app=express();const server=createServer(app);app.use(helmet({contentSecurityPolicy:process.env.NODE_ENV==="production"?buildProductionCsp():false,crossOriginEmbedderPolicy:false}));app.use(cors({origin:(o,c)=>isOriginAllowed(o)?c(null,true):c(new Error("CORS blocked")),credentials:true}));const authLimiter=rateLimit({windowMs:15*60*1000,max:10});app.use("/api/oauth",authLimiter);app.use(express.json({limit:"1mb"}));app.use(express.urlencoded({limit:"1mb",extended:true}));registerLocalStorageRoutes(app);registerStorageProxy(app);registerLocalAuthRoutes(app);registerOAuthRoutes(app);app.use("/api/trpc",createExpressMiddleware({router:appRouter,createContext}));if(process.env.NODE_ENV==="development"){await setupVite(app,server);}else{serveStatic(app);}const port=await findAvailablePort(parseInt(process.env.PORT||"3000"));server.listen(port,()=>logger.info(`Server running on http://localhost:${port}/`));}
startServer().catch(err=>{logger.error(err);process.exit(1);});