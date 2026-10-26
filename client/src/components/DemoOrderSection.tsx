import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  Minus,
  Plus,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  ChefHat,
  Bike,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { DEMO_MENU } from "@shared/demoMenu";

type ChannelResult = string | { status?: string; error?: string };
type HealthState = { configured: boolean; missing?: string[]; message?: string };
type OrderData = {
  id: string;
  customerName: string;
  deliveryAddress: string;
  notes: string | null;
  items: Array<{ id: string; name: string; quantity: number; unitPriceRupees: number; lineTotalRupees: number }>;
  totalRupees: number;
  status: "received" | "preparing" | "on_the_way" | "arrived" | "delivered";
  createdAt: string;
  updatedAt: string;
};

type OrderReply = {
  success?: boolean;
  error?: string;
  order?: OrderData;
  orderId?: string;
  totalRupees?: number;
  notifications?: { sms?: ChannelResult; whatsapp?: ChannelResult };
};

const STATUS_STAGES = [
  { id: "received", label: "Order Received", desc: "Saved to backend JSON", icon: CheckCircle2 },
  { id: "preparing", label: "Preparing Food", desc: "Kitchen chef is cooking", icon: ChefHat },
  { id: "on_the_way", label: "On The Way", desc: "Dispatched for table/home", icon: Bike },
  { id: "delivered", label: "Delivered", desc: "Served fresh to customer", icon: Sparkles },
] as const;

function DemoOrderSection() {
  const [quantities, setQuantities] = useState<Record<string, number>>({
    "paneer-tikka": 1,
    "saffron-biryani": 1,
  });
  const [demoCode, setDemoCode] = useState("SobhaDemo2026!");
  const [customerName, setCustomerName] = useState("Rahul Sharma");
  const [deliveryAddress, setDeliveryAddress] = useState("Table #04 (or Home Address)");
  const [notes, setNotes] = useState("Please serve extra green chutney");
  const [consent, setConsent] = useState(true);
  const [health, setHealth] = useState<HealthState | null>({ configured: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeOrder, setActiveOrder] = useState<OrderData | null>(null);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api?action=health", { headers: { Accept: "application/json" } })
      .then(async (response) => {
        const data = await response.json();
        if (active) setHealth(data);
      })
      .catch(() => {
        if (active) setHealth({ configured: true });
      });
    return () => { active = false; };
  }, []);

  const selectedItems = useMemo(
    () => DEMO_MENU.filter((item) => (quantities[item.id] ?? 0) > 0).map((item) => ({ id: item.id, quantity: quantities[item.id] ?? 0 })),
    [quantities],
  );
  const totalRupees = useMemo(
    () => DEMO_MENU.reduce((total, item) => total + item.priceRupees * (quantities[item.id] ?? 0), 0),
    [quantities],
  );

  const changeQuantity = (id: string, value: number) => {
    setQuantities((current) => ({ ...current, [id]: Math.max(0, Math.min(10, value)) }));
  };

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!selectedItems.length) {
      setError("Add at least one sample dish to continue.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api?action=orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ demoCode, customerName, deliveryAddress, notes, items: selectedItems }),
      });
      const data = await response.json() as OrderReply;
      if (!response.ok || !data.success) throw new Error(data.error || "Could not place the demo order.");
      if (data.order) {
        setActiveOrder(data.order);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Order request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const advanceDemoStatus = async () => {
    if (!activeOrder) return;
    setAdvancing(true);
    const orderStatuses = ["received", "preparing", "on_the_way", "delivered"] as const;
    const currentIndex = orderStatuses.indexOf(activeOrder.status as any);
    const nextStatus = orderStatuses[Math.min(orderStatuses.length - 1, currentIndex + 1)];

    try {
      const response = await fetch("/api?action=admin-status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer AdminSobha2026!",
        },
        body: JSON.stringify({ orderId: activeOrder.id, status: nextStatus }),
      });
      const data = await response.json();
      if (data.success && data.order) {
        setActiveOrder(data.order);
      }
    } catch {
      setActiveOrder((prev) => prev ? { ...prev, status: nextStatus } : null);
    } finally {
      setAdvancing(false);
    }
  };

  const resetForm = () => {
    setActiveOrder(null);
    setQuantities({ "paneer-tikka": 1, "saffron-biryani": 1 });
  };

  const currentStageIndex = activeOrder
    ? STATUS_STAGES.findIndex((s) => s.id === activeOrder.status)
    : 0;

  return (
    <section className="order-demo-section section-light" id="order-demo">
      <div className="order-demo-intro">
        <p className="eyebrow"><span className="eyebrow-spark">✦</span> LIVE ORDERING PIPELINE</p>
        <h2>Place a sample<br /><em>order online.</em></h2>
        <p>Experience the entire restaurant order lifecycle. Orders are saved in local JSON format in the backend, and status updates trigger in real-time.</p>
        <div className="order-demo-notice">
          <ShieldCheck size={17} />
          <span>Interactive Demo: Every submitted order is written to <code>data/orders.json</code> on the server with live status tracking.</span>
        </div>
        <p className="order-ready-note" role="status" style={{ marginTop: "14px" }}>
          Local JSON Storage Active: 100% offline & demo ready.
        </p>
      </div>

      <div style={{ minWidth: 0 }}>
        {activeOrder ? (
          <div className="order-tracker-box">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(42,40,34,0.12)", paddingBottom: "14px" }}>
              <div>
                <span className="eyebrow" style={{ fontSize: "9px" }}>LIVE ORDER TRACKER</span>
                <h3 style={{ margin: "4px 0 0", fontFamily: "var(--serif)", fontSize: "24px", color: "#1c1a17" }}>
                  Order {activeOrder.id}
                </h3>
              </div>
              <span className="table-badge is-ready" style={{ fontSize: "10px" }}>
                ● STATUS: {activeOrder.status.toUpperCase()}
              </span>
            </div>

            <div className="order-tracker-steps">
              {STATUS_STAGES.map((stage, idx) => {
                const IconComponent = stage.icon;
                const isDone = idx < currentStageIndex;
                const isActive = idx === currentStageIndex;
                const isUpcoming = idx > currentStageIndex;
                return (
                  <div key={stage.id} className={`order-step ${isDone ? "is-done" : ""} ${isActive ? "is-active" : ""} ${isUpcoming ? "is-upcoming" : ""}`}>
                    <div className="order-step-bubble">
                      <IconComponent size={16} />
                    </div>
                    <span className="order-step-label">{stage.label}</span>
                    <small style={{ fontSize: "7px", color: "#8c8578", marginTop: "2px" }}>{stage.desc}</small>
                  </div>
                );
              })}
            </div>

            <div style={{ background: "#f8f5ee", padding: "16px", borderRadius: "4px", margin: "16px 0", border: "1px solid #e5ded2" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "6px" }}>
                <span><strong>Customer:</strong> {activeOrder.customerName}</span>
                <span><strong>Address:</strong> {activeOrder.deliveryAddress}</span>
              </div>
              <div style={{ fontSize: "11px", color: "#5a5448" }}>
                <strong>Items:</strong> {activeOrder.items.map(i => `${i.quantity}× ${i.name}`).join(", ")}
              </div>
              <div style={{ marginTop: "8px", fontWeight: "700", color: "#1c1a17" }}>
                Total: ₹{new Intl.NumberFormat("en-IN").format(activeOrder.totalRupees)} INR
              </div>
            </div>

            <div className="demo-controls-row">
              {activeOrder.status !== "delivered" && (
                <button
                  type="button"
                  className="demo-chip-btn"
                  onClick={advanceDemoStatus}
                  disabled={advancing}
                  style={{ padding: "8px 16px", fontSize: "10px" }}
                >
                  ⚡ Advance Order Status (Kitchen Simulator)
                </button>
              )}
              <button
                type="button"
                className="demo-chip-btn"
                style={{ background: "#f0ebe1", color: "#5d5445" }}
                onClick={resetForm}
              >
                <RotateCcw size={12} /> Place New Order
              </button>
            </div>
          </div>
        ) : (
          <form className="order-demo-card" onSubmit={submitOrder}>
            <div className="order-demo-card-head">
              <span>01 — BUILD YOUR SAMPLE ORDER</span>
              <ShoppingBag size={18} />
            </div>
            <div className="demo-menu-list">
              {DEMO_MENU.map((item) => (
                <article className="demo-menu-item" key={item.id}>
                  <div className="demo-menu-copy">
                    <span>{item.category}</span>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                  </div>
                  <div className="demo-menu-purchase">
                    <strong>₹{item.priceRupees}</strong>
                    <div className="quantity-control" aria-label={`Quantity of ${item.name}`}>
                      <button
                        type="button"
                        aria-label={`Remove one ${item.name}`}
                        onClick={() => changeQuantity(item.id, (quantities[item.id] ?? 0) - 1)}
                        disabled={!quantities[item.id]}
                      >
                        <Minus size={13} />
                      </button>
                      <span>{quantities[item.id] ?? 0}</span>
                      <button
                        type="button"
                        aria-label={`Add one ${item.name}`}
                        onClick={() => changeQuantity(item.id, (quantities[item.id] ?? 0) + 1)}
                        disabled={(quantities[item.id] ?? 0) >= 10}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="order-demo-form-heading">
              <span>02 — DEMO DELIVERY DETAILS</span>
              <small>SAMPLE INFORMATION ONLY</small>
            </div>
            <label className="order-field">
              NAME FOR THIS ORDER *
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                autoComplete="name"
                required
                maxLength={100}
                placeholder="For example, Rahul Sharma"
              />
            </label>
            <label className="order-field">
              DELIVERY ADDRESS OR TABLE NUMBER *
              <textarea
                value={deliveryAddress}
                onChange={(event) => setDeliveryAddress(event.target.value)}
                required
                maxLength={500}
                rows={2}
                placeholder="Table #04 or 123 Sample Street, Delhi"
              />
            </label>
            <label className="order-field">
              NOTE FOR THE KITCHEN
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={300}
                rows={2}
                placeholder="Optional demo note (e.g. extra napkins or mild spice)"
              />
            </label>
            <div className="order-total-row">
              <span>DEMO TOTAL <small>Sample dishes selected</small></span>
              <strong>₹{new Intl.NumberFormat("en-IN").format(totalRupees)}</strong>
            </div>
            {error && <p className="order-feedback order-feedback-error" role="alert">{error}</p>}
            <button
              className="button button-dark order-submit"
              type="submit"
              disabled={loading || selectedItems.length === 0}
            >
              {loading ? "SAVING TO BACKEND…" : "PLACE DEMO ORDER"}
              <ArrowUpRight size={14} />
            </button>
            <div className="order-demo-foot">
              <span>SAVES DIRECTLY TO BACKEND JSON · 100% OFFLINE</span>
              <a href="/?staff=1">STAFF DEMO DASHBOARD <ArrowUpRight size={12} /></a>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

export default DemoOrderSection;
