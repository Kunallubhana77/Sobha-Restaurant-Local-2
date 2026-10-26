import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowUpRight, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";
import { DEMO_MENU, ORDER_STATUSES, type DemoOrderStatus } from "@shared/demoMenu";

type ChannelResult = string | { status?: string; error?: string };
type DemoOrder = {
  id: string;
  customerName: string;
  deliveryAddress: string;
  notes?: string;
  items: Array<{ id: string; name?: string; quantity: number; priceRupees?: number }>;
  totalRupees: number;
  status: DemoOrderStatus;
  createdAt?: string;
  notifications?: { sms?: ChannelResult; whatsapp?: ChannelResult };
};

function channelLabel(result?: ChannelResult) {
  const status = typeof result === "string" ? result : result?.status;
  if (status === "sent") return "Accepted by provider";
  if (status === "failed") return "Failed";
  if (status === "not_configured") return "Not configured";
  return "No result recorded";
}

function StaffDashboard() {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [orders, setOrders] = useState<DemoOrder[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(false);

  const loadOrders = useCallback(async (auth: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api?action=admin-orders", { headers: { Authorization: `Bearer ${auth}`, Accept: "application/json" }, cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load orders.");
      setOrders(data.orders ?? []);
      setToken(auth);
      sessionStorage.setItem("sobha-demo-admin", auth);
    } catch (caught) {
      setToken("");
      sessionStorage.removeItem("sobha-demo-admin");
      setError(caught instanceof Error ? caught.message : "Dashboard request failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("sobha-demo-admin");
    if (saved) void loadOrders(saved);
  }, [loadOrders]);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("");
    await loadOrders(password);
    setPassword("");
  };

  const updateStatus = async (order: DemoOrder, status: DemoOrderStatus) => {
    setBusyId(order.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api?action=admin-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, Accept: "application/json" },
        body: JSON.stringify({ orderId: order.id, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update this status.");
      const sms = channelLabel(data.notifications?.sms);
      const whatsapp = channelLabel(data.notifications?.whatsapp);
      setNotice(`${order.id}: status saved. SMS: ${sms}. WhatsApp: ${whatsapp}.`);
      await loadOrders(token);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Status update failed.");
    } finally {
      setBusyId("");
    }
  };

  const signOut = () => {
    setToken("");
    setOrders([]);
    sessionStorage.removeItem("sobha-demo-admin");
    setNotice("Signed out.");
  };

  if (!token) {
    return (
      <main className="staff-shell">
        <header className="staff-header"><a className="staff-back" href="/"><ArrowLeft size={15} /> SOBHA RESTAURANT</a><span>PRIVATE DEMO DASHBOARD</span></header>
        <section className="staff-login-card">
          <p className="eyebrow"><span className="eyebrow-spark">✦</span> STAFF ACCESS</p>
          <h1>Demo order<br /><em>dashboard.</em></h1>
          <p>Sign in with the staff password stored privately in the Vercel environment settings. This dashboard only manages sample orders.</p>
          <form onSubmit={signIn}>
            <label className="order-field">
              STAFF PASSWORD <small style={{ color: "#aa8a55", marginLeft: "6px" }}>(Demo password: AdminSobha2026!)</small>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="AdminSobha2026!" autoComplete="current-password" required />
            </label>
            {error && <p className="order-feedback order-feedback-error" role="alert">{error}</p>}
            <button className="button button-dark" type="submit" disabled={loading}><LockKeyhole size={14} />{loading ? "CHECKING…" : "OPEN DASHBOARD"}<ArrowUpRight size={14} /></button>
          </form>
          <a className="staff-back-link" href="/"><ArrowLeft size={14} /> Back to the restaurant site</a>
        </section>
      </main>
    );
  }

  return (
    <main className="staff-shell">
      <header className="staff-header"><a className="staff-back" href="/"><ArrowLeft size={15} /> SOBHA RESTAURANT</a><div className="staff-header-actions"><span><ShieldCheck size={14} /> PRIVATE STAFF VIEW</span><button type="button" onClick={() => void loadOrders(token)} aria-label="Refresh orders"><RefreshCw size={14} /></button><button type="button" onClick={signOut}>SIGN OUT</button></div></header>
      <section className="staff-content">
        <div className="staff-title-row"><div><p className="eyebrow"><span className="eyebrow-spark">✦</span> CLASSROOM DEMO</p><h1>Order <em>updates.</em></h1><p>Advance each order one step at a time. Every update attempts SMS and WhatsApp to the fixed test number configured in Vercel.</p></div><span className="staff-count">{orders.length.toString().padStart(2, "0")} ORDERS</span></div>
        {error && <p className="order-feedback order-feedback-error" role="alert">{error}</p>}
        {notice && <p className="order-feedback order-feedback-success" role="status">{notice}</p>}
        {loading && <p className="staff-empty">Loading demo orders…</p>}
        {!loading && orders.length === 0 && <div className="staff-empty"><span>NO ORDERS YET</span><p>Place a sample order from the restaurant page to see it here.</p><a className="text-link" href="/#order-demo">PLACE A DEMO ORDER <ArrowUpRight size={13} /></a></div>}
        <div className="staff-orders-list">
          {orders.map((order) => {
            const statusIndex = ORDER_STATUSES.findIndex((entry) => entry.id === order.status);
            const current = ORDER_STATUSES[statusIndex] ?? ORDER_STATUSES[0];
            const next = ORDER_STATUSES[statusIndex + 1];
            return (
              <article className="staff-order-card" key={order.id}>
                <div className="staff-order-top"><div><span className="staff-order-id">ORDER {order.id.slice(0, 8).toUpperCase()}</span><span className="staff-order-date">{order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : "Just now"}</span></div><span className="staff-status-pill">{current.label}</span></div>
                <div className="staff-order-details"><div><small>DEMO CUSTOMER</small><strong>{order.customerName}</strong></div><div><small>SAMPLE DELIVERY ADDRESS</small><span>{order.deliveryAddress}</span></div></div>
                <div className="staff-order-items"><small>ORDER ITEMS</small>{order.items.map((item, index) => { const menuItem = DEMO_MENU.find((menu) => menu.id === item.id); return <span key={`${item.id}-${index}`}>{item.quantity} × {item.name || menuItem?.name || item.id}</span>; })}</div>
                {order.notes && <p className="staff-order-note"><small>NOTE</small> {order.notes}</p>}
                <div className="staff-order-total"><span>DEMO TOTAL</span><strong>₹{new Intl.NumberFormat("en-IN").format(order.totalRupees)}</strong></div>
                <div className="staff-order-progress">{ORDER_STATUSES.map((status, index) => <span className={index <= statusIndex ? "is-current" : ""} key={status.id}>{status.label}</span>)}</div>
                {next ? <button className="button button-dark staff-advance" type="button" disabled={busyId === order.id} onClick={() => void updateStatus(order, next.id as DemoOrderStatus)}>{busyId === order.id ? "SAVING & NOTIFYING…" : `MARK: ${next.label.toUpperCase()}`}<ArrowUpRight size={14} /></button> : <p className="staff-delivered"><ShieldCheck size={15} /> Order marked delivered.</p>}
              </article>
            );
          })}
        </div>
        <p className="staff-disclaimer">DEMO ONLY — no food will be made or delivered and no payment is taken. “Accepted by provider” means Twilio accepted the request; it does not prove the phone displayed the message.</p>
      </section>
    </main>
  );
}

export default StaffDashboard;
