import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowUpRight, Minus, Plus, ShoppingBag, ShieldCheck } from "lucide-react";
import { DEMO_MENU } from "@shared/demoMenu";

type ChannelResult = string | { status?: string; error?: string };
type HealthState = { configured: boolean; missing?: string[]; message?: string };
type OrderReply = {
  success?: boolean;
  error?: string;
  order?: { id?: string; orderId?: string; totalRupees?: number; status?: string };
  orderId?: string;
  totalRupees?: number;
  notifications?: { sms?: ChannelResult; whatsapp?: ChannelResult };
};

function channelLabel(result?: ChannelResult) {
  const status = typeof result === "string" ? result : result?.status;
  if (status === "sent") return "Queued by provider";
  if (status === "failed") return "Failed — check setup";
  if (status === "not_configured") return "Not configured";
  return "Not sent";
}

function DemoOrderSection() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [demoCode, setDemoCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [health, setHealth] = useState<HealthState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<OrderReply | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api?action=health", { headers: { Accept: "application/json" } })
      .then(async (response) => {
        const data = await response.json();
        if (active) setHealth(data);
      })
      .catch(() => {
        if (active) setHealth({ configured: false, message: "The online order backend is not reachable." });
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
    setResult(null);
  };

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setResult(null);
    if (!selectedItems.length) {
      setError("Add at least one sample dish to continue.");
      return;
    }
    if (!health?.configured) {
      setError("Online demo ordering is not ready yet. Complete the Vercel, database and Twilio setup first.");
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
      if (!response.ok) throw new Error(data.error || "Could not place the demo order.");
      setResult(data);
      setQuantities({});
      setCustomerName("");
      setDeliveryAddress("");
      setNotes("");
      setConsent(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Order request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="order-demo-section section-light" id="order-demo">
      <div className="order-demo-intro">
        <p className="eyebrow"><span className="eyebrow-spark">✦</span> A CLASSROOM DEMO</p>
        <h2>Place a sample<br /><em>order online.</em></h2>
        <p>Try the order journey from menu to delivery updates. This is not a real restaurant order: no food is prepared or delivered, and no payment is taken.</p>
        <div className="order-demo-notice"><ShieldCheck size={17} /><span>Use sample details only. The order and each status update are sent by SMS and WhatsApp to the fixed test number configured privately in Vercel.</span></div>
        {health && !health.configured && <p className="order-setup-note" role="status">Messaging backend setup is incomplete. The owner must add the database and Twilio settings in Vercel before orders can be submitted.</p>}
        {health?.configured && <p className="order-ready-note" role="status">Demo backend is ready. Real provider charges or trial limits may apply.</p>}
      </div>

      <form className="order-demo-card" onSubmit={submitOrder}>
        <div className="order-demo-card-head"><span>01 — BUILD YOUR SAMPLE ORDER</span><ShoppingBag size={18} /></div>
        <div className="demo-menu-list">
          {DEMO_MENU.map((item) => (
            <article className="demo-menu-item" key={item.id}>
              <div className="demo-menu-copy"><span>{item.category}</span><h3>{item.name}</h3><p>{item.description}</p></div>
              <div className="demo-menu-purchase"><strong>₹{item.priceRupees}</strong><div className="quantity-control" aria-label={`Quantity of ${item.name}`}><button type="button" aria-label={`Remove one ${item.name}`} onClick={() => changeQuantity(item.id, (quantities[item.id] ?? 0) - 1)} disabled={!quantities[item.id]}><Minus size={13} /></button><span>{quantities[item.id] ?? 0}</span><button type="button" aria-label={`Add one ${item.name}`} onClick={() => changeQuantity(item.id, (quantities[item.id] ?? 0) + 1)} disabled={(quantities[item.id] ?? 0) >= 10}><Plus size={13} /></button></div></div>
            </article>
          ))}
        </div>
        <div className="order-demo-form-heading"><span>02 — DEMO DELIVERY DETAILS</span><small>SAMPLE INFORMATION ONLY</small></div>
        <label className="order-field">DEMO ACCESS CODE *<input value={demoCode} onChange={(event) => setDemoCode(event.target.value)} autoComplete="off" required maxLength={80} placeholder="Enter the code shared by the owner" /></label>
        <label className="order-field">NAME FOR THIS DEMO *<input value={customerName} onChange={(event) => setCustomerName(event.target.value)} autoComplete="off" required maxLength={100} placeholder="For example, Demo Guest" /></label>
        <label className="order-field">SAMPLE DELIVERY ADDRESS *<textarea value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} required maxLength={500} rows={2} placeholder="Use a fictional address for the class demo" /></label>
        <label className="order-field">NOTE FOR THE KITCHEN <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={300} rows={2} placeholder="Optional demo note" /></label>
        <label className="order-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required /><span>I understand this is only a demo; no real food delivery or payment will happen.</span></label>
        <div className="order-total-row"><span>DEMO TOTAL <small>Sample prices, not Sobha’s confirmed menu</small></span><strong>₹{new Intl.NumberFormat("en-IN").format(totalRupees)}</strong></div>
        {error && <p className="order-feedback order-feedback-error" role="alert">{error}</p>}
        {result && <div className="order-feedback order-feedback-success" role="status"><strong>Demo order {result.order?.id ?? result.order?.orderId ?? result.orderId ?? "created"} saved.</strong><span>SMS: {channelLabel(result.notifications?.sms)} · WhatsApp: {channelLabel(result.notifications?.whatsapp)}</span><span>Now open the staff dashboard to move it through the delivery statuses.</span></div>}
        <button className="button button-dark order-submit" type="submit" disabled={loading || !health?.configured || !consent || selectedItems.length === 0}>{loading ? "SENDING DEMO ORDER…" : "PLACE DEMO ORDER"}<ArrowUpRight size={14} /></button>
        <div className="order-demo-foot"><span>NO PAYMENT · SAMPLE DATA ONLY</span><a href="/?staff=1">STAFF DEMO DASHBOARD <ArrowUpRight size={12} /></a></div>
      </form>
    </section>
  );
}

export default DemoOrderSection;
