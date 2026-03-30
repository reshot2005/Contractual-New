import "dotenv/config"
import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(process.cwd(), "..", ".env") })
import { createServer } from "node:http"
import { parse } from "node:url"
import next from "next"
import jwt from "jsonwebtoken"
import { Server as SocketServer } from "socket.io"
import { setIo } from "./lib/socket-emitter"
import { prisma } from "./lib/prisma"

// @ts-ignore
const compression = require("compression")

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

  // BUG-007 Fix: Explicit CORS Origin
  const allowedOrigins = [process.env.NEXTAUTH_URL, "http://localhost:3000", "http://localhost:1166"].filter(Boolean) as string[]
  
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
