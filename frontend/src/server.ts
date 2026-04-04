process.env.NEXT_RUNTIME = 'nodejs';
import "dotenv/config"
import path from "path"
import dotenv from "dotenv"
// Monorepo root .env (local dev), then frontend/.env.local — Render injects env; files optional
dotenv.config({ path: path.join(process.cwd(), "..", ".env") })
dotenv.config({ path: path.join(process.cwd(), ".env.local") })
import { createServer } from "node:http"
import type { IncomingMessage } from "node:http"
import { parse } from "node:url"
import next from "next"
import jwt from "jsonwebtoken"
import { Server as SocketServer } from "socket.io"
import { setIo } from "./lib/socket-emitter"
import { prisma } from "./lib/prisma"
import { handleMobileLogin } from "./lib/mobile-auth-login"

// @ts-ignore
const compression = require("compression")

function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on("data", (c) => chunks.push(c as Buffer))
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
    req.on("error", reject)
  })
}

const dev = process.env.NODE_ENV !== "production"
const hostname = process.env.HOSTNAME ?? "localhost"
const port = Number(process.env.PORT ?? 3000)

const app = next({ dev })
const handle = app.getRequestHandler()
// @ts-ignore
const compress = compression()

void app.prepare().then(() => {
  const server = createServer((req, res) => {
    try {
      if ((req.url ?? "").startsWith("/socket.io")) {
        const parsedUrl = parse(req.url ?? "/", true)
        void handle(req, res, parsedUrl)
        return
      }
      const early = parse(req.url ?? "/", true)
      const pathOnly = (early.pathname ?? "").replace(/\/$/, "") || "/"
      
      // DEBUG: Log all API requests to help diagnose 404s
      if (pathOnly.includes("/api/")) {
        console.log(`[Server] Incoming ${req.method} request to: ${pathOnly}`);
      }

      const isLoginPath = pathOnly === "/api/app-mobile-login" || 
                          pathOnly === "/api/mobile/login" || 
                          pathOnly === "/api/auth/mobile";

      if (req.method === "POST" && isLoginPath) {
        void (async () => {
          try {
            console.log(`[Server] Handling MOBILE LOGIN for path: ${pathOnly}`);
            const raw = await readRequestBody(req)
            const host = req.headers.host ?? `localhost:${port}`
            // Always use HTTPS for the internal request if we're on Render
            const protocol = req.headers['x-forwarded-proto'] || 'http';
            const webReq = new Request(`${protocol}://${host}${pathOnly}`, {
              method: "POST",
              headers: { "content-type": req.headers["content-type"] ?? "application/json" },
              body: raw,
            })
            const response = await handleMobileLogin(webReq)
            res.statusCode = response.status
            response.headers.forEach((value, key) => {
              const k = key.toLowerCase()
              if (k === "transfer-encoding" || k === "connection") return
              res.setHeader(key, value)
            })
            res.end(await response.text())
          } catch (e) {
            console.error("[POST /api/app/mobile-login]", e)
            res.statusCode = 500
            res.setHeader("content-type", "application/json; charset=utf-8")
            res.end(JSON.stringify({ success: false, message: "Internal server error", error: "Internal server error" }))
          }
        })()
        return
      }
      // @ts-ignore
      compress(req, res, () => {
        const parsedUrl = parse(req.url ?? "/", true)
        void handle(req, res, parsedUrl)
      })
    } catch (e) {
      console.error("Error handling request", e)
      res.statusCode = 500
      res.end("internal server error")
    }
  })

  // BUG-007 Fix: CORS — include public app URL + socket URL (must match Render env, not localhost)
  const allowedOrigins = Array.from(
    new Set(
      [
        process.env.NEXTAUTH_URL,
        process.env.NEXT_PUBLIC_APP_URL,
        process.env.NEXT_PUBLIC_SOCKET_URL,
        process.env.RENDER_EXTERNAL_URL,
        "http://localhost:3000",
        "http://localhost:1166",
      ].filter(Boolean) as string[]
    )
  )
  
  const io = new SocketServer(server, {
    path: "/socket.io",
    cors: { 
      origin: allowedOrigins.length > 0 ? allowedOrigins : false, 
      credentials: true 
    },
  })

  io.use((socket, next) => {
    // ... (rest of middleware remains same)
    const token = socket.handshake.auth?.token as string | undefined
    if (!token) {
      next(new Error("Unauthorized"))
      return
    }
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      next(new Error("Server misconfiguration"))
      return
    }
    try {
      const payload = jwt.verify(token, secret) as { sub?: string; id?: string }
      const uid = payload.sub ?? payload.id
      if (!uid) {
        next(new Error("Unauthorized"))
        return
      }
      socket.data.userId = uid
      next()
    } catch {
      next(new Error("Unauthorized"))
    }
  })

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string
    void socket.join(`user:${userId}`)

    // BUG-017 Fix: Contract Room Authorization
    socket.on("join:contract", async (contractId: string) => {
      if (typeof contractId !== "string") return
      
      try {
        const contract = await prisma.contract.findUnique({
          where: { id: contractId },
          select: { freelancerId: true, businessId: true }
        })
        
        if (contract && (contract.freelancerId === userId || contract.businessId === userId)) {
          void socket.join(`contract:${contractId}`)
        }
      } catch (e) {
        console.error("[Socket.IO join:contract] Authorization error", e)
      }
    })

    socket.on("leave:contract", (contractId: string) => {
      if (typeof contractId === "string") void socket.leave(`contract:${contractId}`)
    })
  })

  setIo(io)

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
