import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  DEMO_MENU,
  ORDER_STATUSES,
  type OrderStatus,
} from "../shared/demoMenu";

const MAX_BODY_BYTES = 16 * 1024;
const MAX_ITEM_QUANTITY = 20;
const MAX_ORDER_TOTAL_RUPEES = 2_000_000;
const ORDER_STATUSES_LIST = ORDER_STATUSES.map(({ id }) => id) as OrderStatus[];

const DATA_DIR = path.resolve(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const BOOKINGS_FILE = path.join(DATA_DIR, "table_bookings.json");

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, "[]", "utf-8");
  }
  if (!fs.existsSync(BOOKINGS_FILE)) {
    fs.writeFileSync(BOOKINGS_FILE, "[]", "utf-8");
  }
}

type LineItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  unitPriceRupees: number;
  quantity: number;
  lineTotalRupees: number;
};

export type OrderRecord = {
  id: string;
  customerName: string;
  deliveryAddress: string;
  notes: string | null;
  items: LineItem[];
  totalRupees: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

export type TableBooking = {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  guests: number;
  date: string;
  time: string;
  occasion: string;
  message: string | null;
  tableNumber: string;
  estimatedWaitSeconds: number;
  createdAt: string;
  status: "waiting" | "ready" | "seated" | "cancelled";
};

function readOrders(): OrderRecord[] {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(ORDERS_FILE, "utf-8");
    return JSON.parse(raw) as OrderRecord[];
  } catch {
    return [];
  }
}

function saveOrders(orders: OrderRecord[]) {
  ensureDataFiles();
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
}

function readBookings(): TableBooking[] {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(BOOKINGS_FILE, "utf-8");
    return JSON.parse(raw) as TableBooking[];
  } catch {
    return [];
  }
}

function saveBookings(bookings: TableBooking[]) {
  ensureDataFiles();
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), "utf-8");
}

export function getHealth() {
  return {
    success: true,
    configured: true,
    storage: "local_json",
    missing: [],
    invalid: [],
  };
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

function parseJsonObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return null;
  return value as Record<string, unknown>;
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
  if (normalized.length < min || normalized.length > max) return null;
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
  if (!body) {
    return { ok: false, error: "Invalid JSON object." };
  }

  const demoCode = typeof body.demoCode === "string" ? body.demoCode.trim() : "";
  const customerName = normalizeText(body.customerName, 1, 100);
  const deliveryAddress = normalizeText(body.deliveryAddress, 2, 250);

  if (!customerName)
    return { ok: false, error: "customerName must be 1–100 characters." };
  if (!deliveryAddress)
    return { ok: false, error: "deliveryAddress must be 2–250 characters." };

  const notes = body.notes ? normalizeText(body.notes, 1, 300) : null;

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return { ok: false, error: "Order must contain at least one item." };
  }

  const items: LineItem[] = [];
  let totalRupees = 0;

  for (const raw of body.items) {
    const itemObj = parseJsonObject(raw);
    if (!itemObj || typeof itemObj.id !== "string") {
      return { ok: false, error: "Invalid item entry." };
    }
    const menuItem = DEMO_MENU.find(m => m.id === itemObj.id);
    if (!menuItem) {
      return { ok: false, error: `Unknown item: ${itemObj.id}` };
    }
    const quantity = Number(itemObj.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_ITEM_QUANTITY) {
      return { ok: false, error: `Invalid quantity for ${menuItem.name}` };
    }
    const lineTotalRupees = menuItem.priceRupees * quantity;
    totalRupees += lineTotalRupees;
    items.push({
      id: menuItem.id,
      name: menuItem.name,
      description: menuItem.description,
      category: menuItem.category,
      unitPriceRupees: menuItem.priceRupees,
      quantity,
      lineTotalRupees,
    });
  }

  if (totalRupees > MAX_ORDER_TOTAL_RUPEES) {
    return { ok: false, error: "Order total exceeds allowed limit." };
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
  const text = await request.text();
  try {
    return parseJsonObject(JSON.parse(text));
  } catch {
    return null;
  }
}

async function createOrder(request: Request): Promise<Response> {
  const body = await readRequestJson(request);
  if (!body) {
    return jsonResponse({ success: false, error: "Invalid JSON body" }, 400);
  }

  const validated = validateOrderInput(body);
  if (!validated.ok) {
    return jsonResponse({ success: false, error: validated.error }, 400);
  }

  const val = validated.value;
  const now = new Date().toISOString();
  const id = `ORD-${Date.now().toString().slice(-6)}`;

  const orderRecord: OrderRecord = {
    id,
    customerName: val.customerName,
    deliveryAddress: val.deliveryAddress,
    notes: val.notes,
    items: val.items,
    totalRupees: val.totalRupees,
    status: "received",
    createdAt: now,
    updatedAt: now,
  };

  const orders = readOrders();
  orders.unshift(orderRecord);
  saveOrders(orders);

  return jsonResponse(
    {
      success: true,
      order: orderRecord,
      orderId: id,
      totalRupees: val.totalRupees,
      notifications: {
        sms: { status: "sent", messageSid: "SIMULATED_SMS_" + id },
        whatsapp: { status: "sent", messageSid: "SIMULATED_WA_" + id },
      },
    },
    201
  );
}

function safeCredentialMatch(presented: string, expected: string): boolean {
  if (!presented || !expected) return false;
  return presented === expected;
}

function authorizeAdmin(request: Request): Response | null {
  const expectedPassword = process.env.ADMIN_PASSWORD?.trim() || "AdminSobha2026!";
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer ([^\s]{1,512})$/.exec(authorization);
  if (!match || !safeCredentialMatch(match[1], expectedPassword)) {
    return jsonResponse({ success: false, error: "Unauthorized." }, 401);
  }
  return null;
}

async function adminOrders(): Promise<Response> {
  const orders = readOrders();
  return jsonResponse({
    success: true,
    orders,
  });
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
    typeof body.orderId !== "string" ||
    !isOrderStatus(body.status)
  ) {
    return jsonResponse(
      {
        success: false,
        error: "Valid orderId and status required.",
      },
      400
    );
  }

  const orders = readOrders();
  const index = orders.findIndex(o => o.id === body.orderId);
  if (index === -1) {
    return jsonResponse({ success: false, error: "Order not found." }, 404);
  }

  orders[index].status = body.status;
  orders[index].updatedAt = new Date().toISOString();
  saveOrders(orders);

  return jsonResponse({
    success: true,
    order: orders[index],
    notifications: {
      sms: { status: "sent" },
      whatsapp: { status: "sent" },
    },
  });
}

async function createTableBooking(request: Request): Promise<Response> {
  const body = await readRequestJson(request);
  if (!body) {
    return jsonResponse({ success: false, error: "Invalid JSON." }, 400);
  }

  const customerName = normalizeText(body.name, 1, 100);
  const email = (normalizeText(body.email, 3, 150) || "guest@sobha.local").trim().toLowerCase();
  const rawPhone = normalizeText(body.phone, 5, 20) || "+91 8369994226";
  const cleanPhone = rawPhone.replace(/\D/g, "");
  const guests = Math.max(1, Math.min(20, Number(body.guests) || 2));
  const date = normalizeText(body.date, 4, 30) || new Date().toISOString().slice(0, 10);
  const time = normalizeText(body.time, 1, 30) || "08:00 PM";
  const occasion = normalizeText(body.occasion, 1, 50) || "Dinner";
  const message = body.message ? normalizeText(body.message, 1, 300) : null;

  if (!customerName) {
    return jsonResponse({ success: false, error: "Name is required." }, 400);
  }

  const bookings = readBookings();

  // Condition 1: Same user (same phone number or email) cannot book multiple tables at the exact same Date & Time!
  const userExistingBooking = bookings.find(b => {
    if (b.status === "cancelled") return false;
    const bCleanPhone = (b.phone || "").replace(/\D/g, "");
    const isSamePhone = cleanPhone.length >= 7 && bCleanPhone.length >= 7 && (cleanPhone === bCleanPhone || cleanPhone.endsWith(bCleanPhone) || bCleanPhone.endsWith(cleanPhone));
    const isSameEmail = email && b.email && b.email.trim().toLowerCase() === email;
    const isSameSlot = b.date === date && b.time === time;
    return (isSamePhone || isSameEmail) && isSameSlot;
  });

  if (userExistingBooking) {
    return jsonResponse(
      {
        success: false,
        error: `Aapne ${date} ko ${time} baje pehle se ${userExistingBooking.tableNumber} book ki hui hai (Booking ID: ${userExistingBooking.id}). Ek hi time par ek user doosri table book nahi kar sakta!`,
      },
      409
    );
  }

  // Condition 2: Prevent double booking of tables at the same Date & Time!
  const TOTAL_TABLES = [
    "Table #01", "Table #02", "Table #03", "Table #04", "Table #05",
    "Table #06", "Table #07", "Table #08", "Table #09", "Table #10"
  ];
  const bookedTablesAtSlot = new Set(
    bookings
      .filter(b => b.date === date && b.time === time && b.status !== "cancelled")
      .map(b => b.tableNumber)
  );

  const availableTables = TOTAL_TABLES.filter(t => !bookedTablesAtSlot.has(t));

  if (availableTables.length === 0) {
    return jsonResponse(
      {
        success: false,
        error: `Maaf kijiye, ${date} ko ${time} baje saari tables full hain. Kripya koi doosra time chunein!`,
      },
      409
    );
  }

  const assignedTable = availableTables[0];
  const estimatedWaitSeconds = 45;
  const now = new Date().toISOString();
  const id = `BK-${Date.now().toString().slice(-5)}`;

  const booking: TableBooking = {
    id,
    customerName,
    email,
    phone: rawPhone,
    guests,
    date,
    time,
    occasion,
    message,
    tableNumber: assignedTable,
    estimatedWaitSeconds,
    createdAt: now,
    status: "waiting",
  };

  bookings.unshift(booking);
  saveBookings(bookings);

  return jsonResponse(
    {
      success: true,
      booking,
    },
    201
  );
}

async function listTableBookings(): Promise<Response> {
  const bookings = readBookings();
  return jsonResponse({ success: true, bookings });
}

async function getOrderStatus(orderId: string): Promise<Response> {
  const orders = readOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) {
    return jsonResponse({ success: false, error: "Order not found" }, 404);
  }
  return jsonResponse({ success: true, order });
}

export async function handleOrderBackend(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    if (action === "health" && request.method === "GET") {
      return jsonResponse(getHealth());
    }

    if (action === "orders" && request.method === "POST") {
      return await createOrder(request);
    }

    if (action === "order-status" && request.method === "GET") {
      const orderId = url.searchParams.get("orderId");
      if (!orderId) return jsonResponse({ success: false, error: "Missing orderId" }, 400);
      return await getOrderStatus(orderId);
    }

    if (action === "admin-orders" && request.method === "GET") {
      const denied = authorizeAdmin(request);
      return denied ?? (await adminOrders());
    }

    if (action === "admin-status" && request.method === "PATCH") {
      const denied = authorizeAdmin(request);
      return denied ?? (await updateStatus(request));
    }

    if (action === "table-booking" && request.method === "POST") {
      return await createTableBooking(request);
    }

    if (action === "table-bookings" && request.method === "GET") {
      return await listTableBookings();
    }

    return jsonResponse(
      { success: false, error: "Unknown action or unsupported method." },
      404
    );
  } catch (err) {
    console.error("Backend error:", err);
    return jsonResponse(
      { success: false, error: "Unexpected backend error." },
      500
    );
  }
}
