import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { handleOrderBackend } from "../orderBackend";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });

  app.all("/api", async (req, res) => {
    try {
      const url = new URL(req.originalUrl || req.url, `http://${req.headers.host || "localhost:3000"}`);
      const headers = new Headers();
      for (const [key, val] of Object.entries(req.headers)) {
        if (val) {
          if (Array.isArray(val)) {
            val.forEach(v => headers.append(key, v));
          } else {
            headers.set(key, val);
          }
        }
      }
      const hasBody = req.method !== "GET" && req.method !== "HEAD";
      const request = new Request(url.toString(), {
        method: req.method,
        headers,
        body: hasBody ? JSON.stringify(req.body) : undefined,
      });
      const response = await handleOrderBackend(request);
      res.status(response.status);
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      const data = await response.text();
      res.send(data);
    } catch (err) {
      console.error("Order backend error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV !== "production") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  server.listen(port, "0.0.0.0", () => {
    console.log(`\n========================================================`);
    console.log(`🍽️  Sobha Restaurant Server Running on Port ${port}!`);
    console.log(`--------------------------------------------------------`);
    console.log(`👉 Consumer / Customer Link : http://localhost:${port}/`);
    console.log(`👉 Admin / Staff Dashboard   : http://localhost:${port}/staff`);
    console.log(`   (Admin Password: AdminSobha2026!)`);
    console.log(`   (Food Order Code: SobhaDemo2026!)`);
    console.log(`========================================================\n`);
  });
}

startServer().catch(error => { console.error(error); process.exit(1); });
