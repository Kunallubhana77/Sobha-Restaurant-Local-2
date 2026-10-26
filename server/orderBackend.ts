import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import {
  DEMO_MENU,
  ORDER_STATUSES,
  type OrderStatus,
} from "../shared/demoMenu";

const REQUIRED_ENV = [
  "DATABASE_URL",
  "ADMIN_PASSWORD",
  "DEMO_ORDER_CODE",
  "DEMO_RECIPIENT",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_API_KEY",
  "TWILIO_API_SECRET",
  "TWILIO_SMS_FROM",
  "TWILIO_WHATSAPP_FROM",
] as const;

type EnvironmentName = (typeof REQUIRED_ENV)[number];
type NotificationStatus = "sent" | "failed" | "not_configured";
type NotificationResult = {
  status: NotificationStatus;
  messageSid?: string;
  reason?: string;
};
type NotificationChannels = {
  sms: NotificationResult;
  whatsapp: NotificationResult;
};
type LineItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  unitPriceRupees: number;
  quantity: number;
  lineTotalRupees: number;
};
type OrderRecord = {
  id: string;
  customerName: string;
  deliveryAddress: string;
  notes: string | null;
  items: LineItem[] | string;
  totalRupees: number;
  status: OrderStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
};
type MessageRecord = {
  id: string;
  orderId: string;
  eventType: "order_created" | "status_update";
  channel: "sms" | "whatsapp";
  status: NotificationStatus;
  providerSid: string | null;
  errorCode: string | null;
  messageBody: string;
  createdAt: string | Date;
};
type NeonQuery = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<unknown[]>;

const MAX_BODY_BYTES = 16_384;
const MAX_ORDER_ITEMS = DEMO_MENU.length;
const MAX_ITEM_QUANTITY = 20;
const MAX_ORDER_TOTAL_RUPEES = 2_000_000;
const ORDER_STATUSES_LIST = ORDER_STATUSES.map(({ id }) => id) as OrderStatus[];
const submissionAttempts = new Map<
  string,
  { count: number; windowStartedAt: number }
>();
let cachedDatabase: { url: string; query: NeonQuery } | undefined;

function readConfiguration() {
  const missing = REQUIRED_ENV.filter(name => !process.env[name]?.trim());
  const invalid = REQUIRED_ENV.filter(name => {
    const value = process.env[name]?.trim();
    if (!value) return false;
    switch (name) {
      case "DATABASE_URL":
        return !/^postgres(?:ql)?:\/\//i.test(value);
      case "DEMO_ORDER_CODE":
      case "ADMIN_PASSWORD":
      case "TWILIO_API_SECRET":
        return value.length < 8;
      case "DEMO_RECIPIENT":
        return !/^\+91[6-9]\d{9}$/.test(value);
      case "TWILIO_ACCOUNT_SID":
        return !/^AC[a-f\d]{32}$/i.test(value);
      case "TWILIO_API_KEY":
        return !/^(?:SK|AC)[a-f\d]{32}$/i.test(value);
      case "TWILIO_SMS_FROM":
        return !(
          /^\+[1-9]\d{7,14}$/.test(value) || /^[A-Za-z0-9 ]{1,11}$/.test(value)
        );
      case "TWILIO_WHATSAPP_FROM": {
        const sender = value.startsWith("whatsapp:")
          ? value.slice("whatsapp:".length)
          : value;
        return !/^\+[1-9]\d{7,14}$/.test(sender);
      }
      default:
        return false;
    }
  });
  return { missing: [...missing], invalid: [...invalid] };
}

export function getHealth() {
  const config = readConfiguration();
  return {
    success: true,
    configured: config.missing.length === 0 && config.invalid.length === 0,
    missing: config.missing,
    invalid: config.invalid,
  };
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function parseJsonObject(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  allowed: readonly string[]
) {
  return Object.keys(value).every(key => allowed.includes(key));
}

function normalizeText(
  value: unknown,
  min: number,
  max: number
): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (
    normalized.length < min ||
    normalized.length > max ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(normalized)
  ) {
    return null;
  }
  return normalized;
}

export function validateOrderInput(value: unknown):
  | {
      ok: true;
      value: {
        demoCode: string;
        customerName: string;
        deliveryAddress: string;
        notes: string | null;
        items: LineItem[];
        totalRupees: number;
      };
    }
  | { ok: false; error: string } {
  const body = parseJsonObject(value);
  if (
    !body ||
    !hasOnlyKeys(body, [
      "demoCode",
      "customerName",
      "deliveryAddress",
      "notes",
      "items",
    ])
  ) {
    return {
      ok: false,
      error: "Request must contain only the documented order fields.",
    };
  }
  const demoCode =
    typeof body.demoCode === "string" &&
    body.demoCode.length >= 1 &&
    body.demoCode.length <= 256 &&
    !/[\u0000-\u001f\u007f]/.test(body.demoCode)
      ? body.demoCode
      : null;
  const customerName = normalizeText(body.customerName, 1, 100);
  const deliveryAddress = normalizeText(body.deliveryAddress, 5, 250);
  if (!demoCode) return { ok: false, error: "demoCode is required." };
  if (!customerName)
    return { ok: false, error: "customerName must be 1–100 characters." };
  if (!deliveryAddress)
    return { ok: false, error: "deliveryAddress must be 5–250 characters." };
  if (
    body.notes !== undefined &&
    body.notes !== null &&
    body.notes !== "" &&
    !normalizeText(body.notes, 1, 300)
  ) {
    return { ok: false, error: "notes must be at most 300 characters." };
  }
  const notes =
    body.notes === undefined || body.notes === null || body.notes === ""
      ? null
      : normalizeText(body.notes, 1, 300);
  if (
    !Array.isArray(body.items) ||
    body.items.length < 1 ||
    body.items.length > MAX_ORDER_ITEMS
  ) {
    return {
      ok: false,
      error: `items must contain between 1 and ${MAX_ORDER_ITEMS} entries.`,
    };
  }

  const catalog = new Map(DEMO_MENU.map(item => [item.id, item]));
  const seen = new Set<string>();
  const items: LineItem[] = [];
  let totalRupees = 0;
  for (const rawItem of body.items) {
    const item = parseJsonObject(rawItem);
    if (
      !item ||
      !hasOnlyKeys(item, ["id", "quantity"]) ||
      typeof item.id !== "string" ||
      !Number.isSafeInteger(item.quantity)
    ) {
      return {
        ok: false,
        error: "Each item must contain a catalog id and integer quantity only.",
      };
    }
    const product = catalog.get(item.id);
    if (!product) return { ok: false, error: `Unknown menu item: ${item.id}.` };
    if (seen.has(item.id))
      return { ok: false, error: "Duplicate menu item ids are not allowed." };
    if (
      (item.quantity as number) < 1 ||
      (item.quantity as number) > MAX_ITEM_QUANTITY
    ) {
      return {
        ok: false,
        error: `Each quantity must be between 1 and ${MAX_ITEM_QUANTITY}.`,
      };
    }
    seen.add(item.id);
    const quantity = item.quantity as number;
    const lineTotalRupees = product.priceRupees * quantity;
    totalRupees += lineTotalRupees;
    items.push({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      unitPriceRupees: product.priceRupees,
      quantity,
      lineTotalRupees,
    });
  }
  if (
    !Number.isSafeInteger(totalRupees) ||
    totalRupees > MAX_ORDER_TOTAL_RUPEES
  ) {
    return {
      ok: false,
      error: "Order total is outside the permitted demo limit.",
    };
  }
  return {
    ok: true,
    value: {
      demoCode,
      customerName,
      deliveryAddress,
      notes,
      items,
      totalRupees,
    },
  };
}

async function readRequestJson(
  request: Request
): Promise<Record<string, unknown> | null> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES)
    return null;
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) return null;
  try {
    return parseJsonObject(JSON.parse(text));
  } catch {
    return null;
  }
}

function enforceSubmissionLimit(request: Request): boolean {
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")
    .map(part => part.trim());
  const ip =
    request.headers.get("x-real-ip")?.trim() || forwarded?.[0] || "unknown";
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  for (const [key, value] of submissionAttempts) {
    if (now - value.windowStartedAt >= windowMs) submissionAttempts.delete(key);
  }
  if (submissionAttempts.size > 10_000) submissionAttempts.clear();
  const existing = submissionAttempts.get(ip);
  if (!existing || now - existing.windowStartedAt >= windowMs) {
    submissionAttempts.set(ip, { count: 1, windowStartedAt: now });
    return true;
  }
  if (existing.count >= 8) return false;
  existing.count += 1;
  return true;
}

async function getDatabase(): Promise<NeonQuery> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url || !/^postgres(?:ql)?:\/\//i.test(url))
    throw new Error("database_not_configured");
  if (cachedDatabase?.url === url) return cachedDatabase.query;
  const query = neon(url) as unknown as NeonQuery;
  cachedDatabase = { url, query };
  return query;
}

function toOrder(row: OrderRecord) {
  return {
    id: row.id,
    customerName: row.customerName,
    deliveryAddress: row.deliveryAddress,
    notes: row.notes,
    items:
      typeof row.items === "string"
        ? (JSON.parse(row.items) as LineItem[])
        : row.items,
    totalRupees: row.totalRupees,
    currency: "INR",
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function getOrder(
  db: NeonQuery,
  orderId: string
): Promise<OrderRecord | undefined> {
  const rows = (await db`
    SELECT id, customer_name AS "customerName", delivery_address AS "deliveryAddress",
           notes, items, total_rupees AS "totalRupees", status,
           created_at AS "createdAt", updated_at AS "updatedAt"
    FROM demo_orders WHERE id = ${orderId}::uuid LIMIT 1
  `) as unknown as OrderRecord[];
  return rows[0];
}

function fixedRecipient(): string | null {
  const recipient = process.env.DEMO_RECIPIENT?.trim();
  return recipient && /^\+91[6-9]\d{9}$/.test(recipient) ? recipient : null;
}

function notificationConfiguration(channel: "sms" | "whatsapp"):
  | {
      ok: true;
      accountSid: string;
      apiKey: string;
      apiSecret: string;
      sender: string;
      recipient: string;
    }
  | { ok: false; reason: string } {
  const config = readConfiguration();
  const relevantNames = [
    "DEMO_RECIPIENT",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_API_KEY",
    "TWILIO_API_SECRET",
    channel === "sms" ? "TWILIO_SMS_FROM" : "TWILIO_WHATSAPP_FROM",
  ];
  if (config.missing.some(name => relevantNames.includes(name)))
    return { ok: false, reason: "missing_configuration" };
  if (config.invalid.some(name => relevantNames.includes(name)))
    return { ok: false, reason: "invalid_configuration" };
  const accountSid = process.env.TWILIO_ACCOUNT_SID!.trim();
  const apiKey = process.env.TWILIO_API_KEY!.trim();
  const apiSecret = process.env.TWILIO_API_SECRET!.trim();
  const recipient = fixedRecipient();
  if (!recipient) return { ok: false, reason: "invalid_configuration" };
  const sender =
    channel === "sms"
      ? process.env.TWILIO_SMS_FROM!.trim()
      : `whatsapp:${process.env.TWILIO_WHATSAPP_FROM!.trim().replace(/^whatsapp:/, "")}`;
  return { ok: true, accountSid, apiKey, apiSecret, sender, recipient };
}

async function sendTwilioMessage(
  channel: "sms" | "whatsapp",
  body: string
): Promise<NotificationResult> {
  const config = notificationConfiguration(channel);
  if (!config.ok) return { status: "not_configured", reason: config.reason };
  if (body.length > 1_500)
    return { status: "failed", reason: "message_too_long" };
  const auth = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString(
    "base64"
  );
  const form = new URLSearchParams({
    To:
      channel === "whatsapp"
        ? `whatsapp:${config.recipient}`
        : config.recipient,
    From: config.sender,
    Body: body,
  });
  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(config.accountSid)}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      }
    );
    let messageSid: string | undefined;
    if (response.ok) {
      try {
        const responseBody = (await response.json()) as { sid?: unknown };
        if (typeof responseBody.sid === "string") messageSid = responseBody.sid;
      } catch {
        // Twilio accepted the request even if its optional response body was unreadable.
      }
      return { status: "sent", ...(messageSid ? { messageSid } : {}) };
    }
    return { status: "failed", reason: `provider_http_${response.status}` };
  } catch {
    return { status: "failed", reason: "provider_network_error" };
  }
}

function formatOrderSummary(order: ReturnType<typeof toOrder>): string {
  const items = order.items
    .map(item => `• ${item.quantity} × ${item.name} — ₹${item.lineTotalRupees}`)
    .join("\n");
  return [
    "SOBHA DEMO ORDER — SCHOOL DEMO ONLY; NO FULFILMENT OR PAYMENT",
    `Order: ${order.id}`,
    `Customer: ${order.customerName}`,
    `Delivery address (demo): ${order.deliveryAddress}`,
    `Items:\n${items}`,
    `Demo total: ₹${order.totalRupees} INR`,
    order.notes ? `Notes: ${order.notes}` : "",
    "This is a demonstration only.",
  ]
    .filter(Boolean)
    .join("\n");
}

function formatStatusMessage(
  order: ReturnType<typeof toOrder>,
  status: OrderStatus
): string {
  const label =
    ORDER_STATUSES.find(item => item.id === status)?.label ?? status;
  return `SOBHA DEMO ORDER UPDATE — SCHOOL DEMO ONLY; NO FULFILMENT OR PAYMENT\nOrder: ${order.id}\nCustomer: ${order.customerName}\nStatus: ${label}\nDemo total: ₹${order.totalRupees} INR`;
}

async function recordNotifications(
  db: NeonQuery,
  orderId: string,
  eventType: "order_created" | "status_update",
  messageBody: string,
  notifications: NotificationChannels
) {
  await Promise.all(
    (
      Object.entries(notifications) as [
        "sms" | "whatsapp",
        NotificationResult,
      ][]
    ).map(async ([channel, result]) => {
      await db`
      INSERT INTO demo_order_messages (order_id, event_type, channel, status, provider_sid, error_code, message_body)
      VALUES (
        ${orderId}::uuid, ${eventType}, ${channel}, ${result.status},
        ${result.messageSid ?? null}, ${result.reason ?? null}, ${messageBody}
      )
    `;
    })
  );
}

function makeNotifications(
  results: PromiseSettledResult<NotificationResult>[]
): NotificationChannels {
  const fallback: NotificationResult = {
    status: "failed",
    reason: "notification_error",
  };
  return {
    sms: results[0].status === "fulfilled" ? results[0].value : fallback,
    whatsapp: results[1].status === "fulfilled" ? results[1].value : fallback,
  };
}

async function createOrder(request: Request): Promise<Response> {
  if (!enforceSubmissionLimit(request))
    return jsonResponse(
      {
        success: false,
        error: "Too many demo order attempts; try again later.",
      },
      429
    );
  const config = readConfiguration();
  if (
    !process.env.DEMO_ORDER_CODE?.trim() ||
    config.invalid.includes("DEMO_ORDER_CODE")
  ) {
    return jsonResponse(
      {
        success: false,
        error: "Order creation is not configured.",
        missing: ["DEMO_ORDER_CODE"],
      },
      503
    );
  }
  const body = await readRequestJson(request);
  if (!body)
    return jsonResponse(
      {
        success: false,
        error: "Request body must be a JSON object no larger than 16 KB.",
      },
      400
    );
  const validated = validateOrderInput(body);
  if (!validated.ok)
    return jsonResponse({ success: false, error: validated.error }, 400);
  if (validated.value.demoCode !== process.env.DEMO_ORDER_CODE) {
    return jsonResponse({ success: false, error: "Invalid demo code." }, 403);
  }
  if (
    config.invalid.includes("DATABASE_URL") ||
    config.missing.includes("DATABASE_URL")
  ) {
    return jsonResponse(
      {
        success: false,
        error: "Order storage is not configured.",
        notifications: {
          sms: { status: "not_configured", reason: "database_not_configured" },
          whatsapp: {
            status: "not_configured",
            reason: "database_not_configured",
          },
        },
      },
      503
    );
  }

  let db: NeonQuery;
  try {
    db = await getDatabase();
  } catch {
    return jsonResponse(
      {
        success: false,
        error:
          "Order storage is unavailable. Confirm the Neon driver and database configuration.",
      },
      503
    );
  }
  const id = randomUUID();
  const value = validated.value;
  let row: OrderRecord;
  try {
    const inserted = (await db`
      INSERT INTO demo_orders (id, customer_name, delivery_address, notes, items, total_rupees, status)
      VALUES (${id}::uuid, ${value.customerName}, ${value.deliveryAddress}, ${value.notes}, ${JSON.stringify(value.items)}::jsonb, ${value.totalRupees}, 'received')
      RETURNING id, customer_name AS "customerName", delivery_address AS "deliveryAddress",
                notes, items, total_rupees AS "totalRupees", status,
                created_at AS "createdAt", updated_at AS "updatedAt"
    `) as unknown as OrderRecord[];
    row = inserted[0];
  } catch {
    return jsonResponse(
      {
        success: false,
        error:
          "Could not save the demo order. Confirm the database schema is installed.",
      },
      503
    );
  }

  const order = toOrder(row);
  const summary = formatOrderSummary(order);
  const notifications = makeNotifications(
    await Promise.allSettled([
      sendTwilioMessage("sms", summary),
      sendTwilioMessage("whatsapp", summary),
    ])
  );
  let notificationAuditRecorded = true;
  try {
    await recordNotifications(
      db,
      order.id,
      "order_created",
      summary,
      notifications
    );
  } catch {
    notificationAuditRecorded = false;
  }
  return jsonResponse(
    { success: true, order, notifications, notificationAuditRecorded },
    201
  );
}

function safeCredentialMatch(presented: string, expected: string): boolean {
  const presentedDigest = createHash("sha256").update(presented).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();
  return timingSafeEqual(presentedDigest, expectedDigest);
}

function authorizeAdmin(request: Request): Response | null {
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password || password.length < 8) {
    return jsonResponse(
      { success: false, error: "Admin access is not configured." },
      503
    );
  }
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer ([^\s]{1,512})$/.exec(authorization);
  if (!match || !safeCredentialMatch(match[1], password)) {
    return jsonResponse({ success: false, error: "Unauthorized." }, 401);
  }
  return null;
}

async function adminOrders(): Promise<Response> {
  let db: NeonQuery;
  try {
    db = await getDatabase();
  } catch {
    return jsonResponse(
      { success: false, error: "Order storage is unavailable." },
      503
    );
  }
  try {
    const rows = (await db`
      SELECT id, customer_name AS "customerName", delivery_address AS "deliveryAddress",
             notes, items, total_rupees AS "totalRupees", status,
             created_at AS "createdAt", updated_at AS "updatedAt"
      FROM demo_orders ORDER BY created_at DESC LIMIT 100
    `) as unknown as OrderRecord[];
    const ids = rows.map(row => row.id);
    let messages: MessageRecord[] = [];
    if (ids.length) {
      messages = (await db`
        SELECT id, order_id AS "orderId", event_type AS "eventType", channel, status,
               provider_sid AS "providerSid", error_code AS "errorCode",
               message_body AS "messageBody", created_at AS "createdAt"
        FROM demo_order_messages
        WHERE order_id = ANY(${ids}::uuid[])
        ORDER BY created_at DESC
      `) as unknown as MessageRecord[];
    }
    const grouped = new Map<string, MessageRecord[]>();
    for (const message of messages)
      grouped.set(message.orderId, [
        ...(grouped.get(message.orderId) ?? []),
        message,
      ]);
    return jsonResponse({
      success: true,
      orders: rows.map(row => ({
        ...toOrder(row),
        messages: grouped.get(row.id) ?? [],
      })),
    });
  } catch {
    return jsonResponse(
      {
        success: false,
        error:
          "Could not load orders. Confirm the database schema is installed.",
      },
      503
    );
  }
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" &&
    ORDER_STATUSES_LIST.includes(value as OrderStatus)
  );
}

async function updateStatus(request: Request): Promise<Response> {
  const body = await readRequestJson(request);
  if (
    !body ||
    !hasOnlyKeys(body, ["orderId", "status"]) ||
    typeof body.orderId !== "string" ||
    !isOrderStatus(body.status) ||
    body.status === "received"
  ) {
    return jsonResponse(
      {
        success: false,
        error:
          "Body must contain a valid orderId and next status (preparing, on_the_way, arrived, or delivered).",
      },
      400
    );
  }
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      body.orderId
    )
  ) {
    return jsonResponse(
      { success: false, error: "orderId must be a valid UUID." },
      400
    );
  }
  let db: NeonQuery;
  try {
    db = await getDatabase();
  } catch {
    return jsonResponse(
      { success: false, error: "Order storage is unavailable." },
      503
    );
  }
  try {
    const current = await getOrder(db, body.orderId);
    if (!current)
      return jsonResponse({ success: false, error: "Order not found." }, 404);
    const currentIndex = ORDER_STATUSES_LIST.indexOf(current.status);
    const nextStatus = ORDER_STATUSES_LIST[currentIndex + 1];
    if (body.status !== nextStatus) {
      return jsonResponse(
        {
          success: false,
          error: `Only the next status in sequence is allowed. Current status: ${current.status}.`,
          currentStatus: current.status,
          expectedStatus: nextStatus ?? null,
        },
        409
      );
    }
    const updatedRows = (await db`
      UPDATE demo_orders SET status = ${body.status}, updated_at = now()
      WHERE id = ${body.orderId}::uuid AND status = ${current.status}
      RETURNING id, customer_name AS "customerName", delivery_address AS "deliveryAddress",
                notes, items, total_rupees AS "totalRupees", status,
                created_at AS "createdAt", updated_at AS "updatedAt"
    `) as unknown as OrderRecord[];
    if (!updatedRows[0])
      return jsonResponse(
        {
          success: false,
          error: "Order status changed concurrently; reload and try again.",
        },
        409
      );
    const order = toOrder(updatedRows[0]);
    const message = formatStatusMessage(order, body.status);
    const notifications = makeNotifications(
      await Promise.allSettled([
        sendTwilioMessage("sms", message),
        sendTwilioMessage("whatsapp", message),
      ])
    );
    let notificationAuditRecorded = true;
    try {
      await recordNotifications(
        db,
        order.id,
        "status_update",
        message,
        notifications
      );
    } catch {
      notificationAuditRecorded = false;
    }
    return jsonResponse({
      success: true,
      order,
      notifications,
      notificationAuditRecorded,
    });
  } catch {
    return jsonResponse(
      {
        success: false,
        error:
          "Could not update the order status. Confirm the database schema is installed.",
      },
      503
    );
  }
}

export async function handleOrderBackend(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    if (request.method === "OPTIONS")
      return new Response(null, {
        status: 204,
        headers: { "Cache-Control": "no-store" },
      });
    if (action === "health" && request.method === "GET")
      return jsonResponse(getHealth());
    if (action === "orders" && request.method === "POST")
      return await createOrder(request);
    if (action === "admin-orders" && request.method === "GET") {
      const denied = authorizeAdmin(request);
      return denied ?? (await adminOrders());
    }
    if (action === "admin-status" && request.method === "PATCH") {
      const denied = authorizeAdmin(request);
      return denied ?? (await updateStatus(request));
    }
    return jsonResponse(
      { success: false, error: "Unknown action or unsupported method." },
      404
    );
  } catch {
    // Do not emit request data, credentials, phone numbers or provider details to logs.
    return jsonResponse(
      { success: false, error: "Unexpected backend error." },
      500
    );
  }
}
