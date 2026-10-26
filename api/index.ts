import { handleOrderBackend } from "../server/orderBackend";

/**
 * Vercel Serverless Function entry point.
 * Supports both standard Node.js runtime (req, res) and Edge/Web Fetch API (Request).
 */
export default async function handler(req: any, res?: any) {
  // 1. If called with web standard Request (e.g. Edge runtime or test runner)
  if (req instanceof Request || (req && typeof req.text === "function" && typeof req.json === "function" && !res)) {
    return handleOrderBackend(req);
  }

  // 2. Standard Vercel Serverless Node.js (req: IncomingMessage, res: ServerResponse)
  try {
    const protocol = req.headers?.["x-forwarded-proto"] || "https";
    const host = req.headers?.["x-forwarded-host"] || req.headers?.host || "localhost";
    const urlString = req.url?.startsWith("http") ? req.url : `${protocol}://${host}${req.url || "/"}`;
    const url = new URL(urlString);

    const headers = new Headers();
    if (req.headers) {
      for (const [key, val] of Object.entries(req.headers)) {
        if (val !== undefined && val !== null) {
          if (Array.isArray(val)) {
            val.forEach((v) => headers.append(key, v));
          } else {
            headers.set(key, String(val));
          }
        }
      }
    }

    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    let body: any = undefined;
    if (hasBody) {
      if (req.body && typeof req.body === "object") {
        body = JSON.stringify(req.body);
      } else if (typeof req.body === "string") {
        body = req.body;
      } else {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
        }
        if (chunks.length > 0) {
          body = Buffer.concat(chunks).toString("utf-8");
        }
      }
    }

    const request = new Request(url.toString(), {
      method: req.method || "GET",
      headers,
      body,
    });

    const response = await handleOrderBackend(request);

    if (res && typeof res.status === "function") {
      res.status(response.status);
    } else if (res) {
      res.statusCode = response.status;
    }

    if (res && typeof res.setHeader === "function") {
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
    }

    const data = await response.text();
    if (res && typeof res.send === "function") {
      res.send(data);
    } else if (res && typeof res.end === "function") {
      res.end(data);
    }
    return;
  } catch (error: any) {
    console.error("Vercel API handler error:", error);
    if (res && typeof res.status === "function") {
      res.status(500).json({ success: false, error: error?.message || "Internal server error" });
    } else if (res && typeof res.end === "function") {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: error?.message || "Internal server error" }));
    }
  }
}

// Attach .fetch for environments expecting { fetch } export
handler.fetch = (request: Request) => handleOrderBackend(request);
