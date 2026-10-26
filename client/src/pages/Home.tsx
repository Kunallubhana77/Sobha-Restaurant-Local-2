import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  Instagram,
  MapPin,
  Menu as MenuIcon,
  Phone,
  X,
} from "lucide-react";
import { RestaurantMap } from "@/components/RestaurantMap";
import { restaurant, menuDraft, signaturePlates, foodCategories } from "@/siteContent";
import DemoOrderSection from "@/components/DemoOrderSection";

const heroImage = "/images/hero.webp";
const roomImage = "/images/dining-room.webp";
const tandoorImage = "/images/tandoor.webp";
const biryaniImage = "/images/biryani.webp";
const vegetarianImage = "/images/vegetarian.webp";

const gallery = [
  { src: tandoorImage, alt: "A charcoal-fired tandoor sharing platter", title: "From the fire", detail: "Tandoor · spice · smoke" },
  { src: roomImage, alt: "An intimate, warmly lit restaurant interior", title: "The room", detail: "Warm light · long evenings" },
  { src: biryaniImage, alt: "Saffron basmati biryani in a copper handi", title: "The slow craft", detail: "Basmati · herbs · time" },
  { src: vegetarianImage, alt: "A colourful vegetarian Indian feast", title: "The sharing table", detail: "Seasonal · generous · together" },
];

const timeOptions = ["12:00", "12:30", "13:00", "13:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"];

function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <a className={`brand-lockup${light ? " brand-lockup-light" : ""}`} href="#top" aria-label="Sobha Restaurant, back to top">
      <svg className="brand-symbol" viewBox="0 0 42 42" aria-hidden="true">
        <path d="M21 3.5 24.3 15l11.2-4.3-7.2 9.5 10.1 6.3-12 .2L25 38l-4-10.6L9.7 33l6.6-10-10.2-5.7 12-.9z" />
        <circle cx="21" cy="21" r="3.1" />
      </svg>
      <span className="brand-word">sobha<span className="brand-period">.</span></span>
      <span className="brand-caption">RESTAURANT</span>
    </a>
  );
}

function SectionLabel({ children, light = false }: { children: string; light?: boolean }) {
  return <p className={`eyebrow${light ? " eyebrow-light" : ""}`}><span className="eyebrow-spark">✦</span>{children}</p>;
}

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [legalPanel, setLegalPanel] = useState<"privacy" | "terms" | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateHeader = () => setScrolled(window.scrollY > 40);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    const revealNodes = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      revealNodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealNodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!legalPanel) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setLegalPanel(null); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [legalPanel]);

  const scrollGallery = (direction: -1 | 1) => {
    if (!galleryRef.current) return;
    galleryRef.current.scrollBy({ left: direction * Math.min(galleryRef.current.clientWidth * 0.72, 680), behavior: "smooth" });
  };

  const closeMenu = () => setMenuOpen(false);
  const submitReservation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="site-shell" id="top">
      <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
        <button className="menu-trigger" type="button" aria-expanded={menuOpen} aria-controls="site-navigation" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={18} strokeWidth={1.5} /> : <MenuIcon size={18} strokeWidth={1.5} />}
          <span>{menuOpen ? "CLOSE" : "MENU"}</span>
        </button>
        <BrandMark light />
        <div className="header-actions">
          <a className="header-order" href="#order-demo">ORDER <ArrowUpRight size={12} /></a>
          <a className="header-reserve" href="#reserve">RESERVE <ArrowUpRight size={12} /></a>
        </div>
      </header>

      <nav className={`nav-drawer${menuOpen ? " nav-drawer-open" : ""}`} id="site-navigation" aria-hidden={!menuOpen}>
        <div className="nav-drawer-inner">
          <SectionLabel light>TAKE A SEAT</SectionLabel>
          <a href="#story" onClick={closeMenu}>Our story <span>01</span></a>
          <a href="#signatures" onClick={closeMenu}>The signatures <span>02</span></a>
          <a href="#menu" onClick={closeMenu}>The menu <span>03</span></a>
          <a href="#order-demo" onClick={closeMenu}>Try a demo order <span>04</span></a>
          <a href="#gather" onClick={closeMenu}>Gather together <span>05</span></a>
          <a href="#visit" onClick={closeMenu}>Visit Sobha <span>06</span></a>
          <a className="drawer-booking" href="#reserve" onClick={closeMenu}>Reserve a table <ArrowUpRight size={16} /></a>
          <div className="drawer-bottom">A GOOD EVENING BEGINS AT THE TABLE.</div>
        </div>
      </nav>

      <section className="hero" aria-label="Sobha Restaurant introduction" style={{ backgroundImage: `linear-gradient(180deg, rgba(7, 10, 20, .25) 0%, rgba(8, 11, 21, .28) 28%, rgba(8, 11, 21, .72) 100%), url('${heroImage}')` }}>
        <div className="hero-grain" aria-hidden="true" />
        <div className="hero-side-note">AN EVENING WOVEN WITH SPICE & STORY</div>
        <div className="hero-content">
          <p className="hero-kicker"><span /> CONTEMPORARY INDIAN DINING <span /></p>
          <h1>Sobha</h1>
          <p className="hero-subtitle">A table full of stories.<br className="mobile-break" /> A little more warmth in every gathering.</p>
          <div className="hero-actions">
            <a className="button button-gold" href="#menu">EXPLORE THE MENU <ArrowUpRight size={14} /></a>
            <a className="button button-outline-light" href="#reserve">RESERVE A TABLE <ArrowUpRight size={14} /></a>
          </div>
        </div>
        <a className="scroll-cue" href="#story"><span>BEGIN THE STORY</span><ArrowDown size={15} strokeWidth={1.5} /></a>
        <div className="hero-index"><span>01</span><i /> A TALE OF FLAVOUR</div>
      </section>

      <div className="word-ribbon" aria-label="Origin, spice, aroma, texture, taste, craft, gathering, celebration">
        <div className="word-ribbon-track" aria-hidden="true">
          {[0, 1, 2, 3].map((repeat) => <span className="word-ribbon-set" key={repeat}>ORIGIN <b>✦</b> SPICE <b>✦</b> AROMA <b>✦</b> TEXTURE <b>✦</b> TASTE <b>✦</b> CRAFT <b>✦</b> GATHERING <b>✦</b> CELEBRATION <b>✦</b></span>)}
        </div>
      </div>

      <section className="story-section section-light" id="story">
        <div className="story-image-wrap" data-reveal>
          <img src={roomImage} alt="Warm, intimate dining room details at Sobha" loading="lazy" />
          <div className="image-corner-note">THE SOBHA ROOM <span>✦</span></div>
          <div className="story-seal" aria-label="Made for gathering"><span>MADE FOR</span><svg viewBox="0 0 42 42" aria-hidden="true"><path d="M21 3 25 15l12-5-8 10 10 6-12 1-2 12-5-11-11 6 6-11-10-6 12-1z" /></svg><span>GATHERING</span></div>
        </div>
        <div className="story-copy" data-reveal>
          <SectionLabel>THE SOBHA STORY</SectionLabel>
          <h2>Good food has<br />a way of <em>bringing<br />us closer.</em></h2>
          <div className="story-rule" />
          <p className="lead-copy">At Sobha, every meal begins with the things that matter most: honest ingredients, generous cooking and the pleasure of sharing a table.</p>
          <p>Inspired by India’s many kitchens and shaped for long, easy evenings, our restaurant is a place to celebrate, reconnect and discover something delicious together.</p>
          <a className="text-link" href="#gather">A PLACE TO GATHER <ArrowUpRight size={14} /></a>
        </div>
        <div className="story-side-mark" aria-hidden="true">S</div>
      </section>

      <section className="masterpieces-section section-ink" id="signatures">
        <div className="section-topline" data-reveal>
          <div><SectionLabel light>THE MASTERPIECES</SectionLabel><h2>Plates with<br /><em>a point of view.</em></h2></div>
          <div className="gallery-controls">
            <p>A little fire. A lot of feeling.<br />Made to linger over.</p>
            <button type="button" aria-label="Scroll gallery left" onClick={() => scrollGallery(-1)}><ArrowLeft size={17} /></button>
            <button type="button" aria-label="Scroll gallery right" onClick={() => scrollGallery(1)}><ArrowRight size={17} /></button>
          </div>
        </div>
        <div className="masterpieces-track" ref={galleryRef}>
          {gallery.map((item, index) => <article className="masterpiece-card" data-reveal key={item.title}>
            <div className="masterpiece-image"><img src={item.src} alt={item.alt} loading="lazy" /><span className="image-number">0{index + 1}</span><span className="image-plus">✦</span></div>
            <div className="masterpiece-caption"><div><h3>{item.title}</h3><p>{item.detail}</p></div><ArrowUpRight size={18} strokeWidth={1.2} /></div>
          </article>)}
        </div>
        <div className="gallery-foot"><span>THE SOBHA TABLE</span><a href="#menu">DISCOVER THE MENU <ArrowUpRight size={12} /></a></div>
      </section>

      <section className="cuisine-section section-light" id="menu">
        <div className="cuisine-intro" data-reveal>
          <SectionLabel>THE CUISINE</SectionLabel>
          <h2>Explore the menu,<br /><em>course by course.</em></h2>
          <p>From the first bright bite to something slow-cooked and comforting, each plate has its own place in the evening.</p>
          <div className="menu-note"><span>✦</span>{menuDraft ? "A SAMPLE MENU — dishes and prices will be replaced with Sobha’s confirmed menu." : "A taste of the Sobha table."}</div>
          <a className="text-link" href="#reserve">ASK ABOUT THE MENU <ArrowUpRight size={14} /></a>
        </div>
        <div className="category-grid">
          {foodCategories.map((category, index) => <article className={`category-card category-card-${index + 1}`} data-reveal key={category.title}>
            <a href="#menu-list" className="category-image-link" aria-label={`View ${category.title}`}>
              <img src={category.image} alt={category.alt} loading="lazy" />
              <span className="category-arrow"><ArrowUpRight size={17} /></span>
            </a>
            <div className="category-meta"><span>0{index + 1} / {foodCategories.length.toString().padStart(2, "0")}</span><span>{category.tag}</span></div>
            <h3>{category.title}</h3>
            <p>{category.description}</p>
          </article>)}
        </div>
      </section>

      <section className="menu-list-section" id="menu-list">
        <div className="menu-list-heading" data-reveal>
          <SectionLabel light>FROM THE KITCHEN</SectionLabel>
          <h2>Something<br /><em>to remember.</em></h2>
          <p>Our current menu is being shaped with care. These sample plates are here to show the spirit of the table; final names and prices are awaiting Sobha’s details.</p>
        </div>
        <div className="menu-list-grid">
          {signaturePlates.map((plate, index) => <article className="menu-item" data-reveal key={plate.name}>
            <span className="menu-item-index">0{index + 1}</span>
            <div><p className="menu-item-type">{plate.category}</p><h3>{plate.name}</h3><p className="menu-item-description">{plate.description}</p></div>
            <span className="menu-item-price">{plate.price || "₹—"}</span>
          </article>)}
        </div>
        <div className="menu-downloads"><span>MORE TO COME FROM OUR KITCHEN</span><a href="#visit">MENU DETAILS <ArrowUpRight size={13} /></a></div>
      </section>

      <DemoOrderSection />

      <section className="feast-banner" style={{ backgroundImage: `linear-gradient(90deg, rgba(9, 12, 20, .86), rgba(9, 12, 20, .38) 58%, rgba(9, 12, 20, .12)), url('${vegetarianImage}')` }}>
        <div className="feast-content" data-reveal>
          <SectionLabel light>FROM OUR KITCHEN</SectionLabel>
          <h2>A feast worth<br /><em>gathering for.</em></h2>
          <p>Shared plates, familiar favourites and the kind of hospitality that invites you to stay for one more.</p>
          <a className="button button-gold" href="#reserve">JOIN US AT THE TABLE <ArrowUpRight size={14} /></a>
        </div>
        <span className="feast-caption">THE JOY IS IN THE SHARING</span>
      </section>

      <section className="gather-section section-light" id="gather">
        <div className="gather-mark" data-reveal><span className="gather-mark-top">✦ &nbsp; THE SOBHA PROMISE &nbsp; ✦</span><div>Gather<br /><em>well.</em></div><span className="gather-mark-bottom">GOOD THINGS TASTE BETTER TOGETHER</span></div>
        <div className="gather-copy" data-reveal>
          <SectionLabel>THE ROOM</SectionLabel>
          <h2>Come as you are.<br /><em>Stay a little longer.</em></h2>
          <p>For the quick catch-up that becomes dinner, a family celebration that fills the room, or a table for two that deserves the whole evening.</p>
          <a className="text-link" href="#reserve">MAKE AN EVENING OF IT <ArrowUpRight size={14} /></a>
        </div>
        <div className="gather-orbit" aria-hidden="true"><span>ORIGIN</span><b>✦</b><span>CRAFT</span><b>✦</b><span>GATHER</span></div>
      </section>

      <section className="private-section section-ink" id="private-dining">
        <div className="private-ornament" aria-hidden="true">✦</div>
        <div className="private-content" data-reveal>
          <SectionLabel light>PRIVATE DINING & CELEBRATIONS</SectionLabel>
          <h2>Let the story begin<br /><em>— together.</em></h2>
          <p>Birthdays, gatherings, business dinners or a table that calls for a little extra care. Tell us what you’re celebrating and we’ll help shape the evening.</p>
          <a className="button button-gold" href="#reserve">ENQUIRE ABOUT YOUR OCCASION <ArrowUpRight size={14} /></a>
        </div>
        <div className="private-side-note">AN OCCASION, MADE YOURS</div>
      </section>

      <section className="reservation-section section-light" id="reserve">
        <div className="reservation-heading" data-reveal>
          <SectionLabel>YOUR TABLE AWAITS</SectionLabel>
          <h2>Make room for<br /><em>a good evening.</em></h2>
          <p>Share a few details and we’ll help you plan a visit to Sobha.</p>
          <div className="booking-reminder"><CalendarDays size={16} /><span>For now, this form is a preview only. It does not send or confirm a reservation.</span></div>
        </div>
        <form className="reservation-form" onSubmit={submitReservation} data-reveal>
          <div className="form-heading"><span>01 — YOUR VISIT</span><span>ALL FIELDS MARKED * ARE REQUIRED</span></div>
          <div className="form-row form-row-three">
            <label>DATE *<input name="date" type="date" min={new Date().toISOString().slice(0, 10)} required /></label>
            <label>TIME *<select name="time" defaultValue="" required><option value="" disabled>Select a time</option>{timeOptions.map((time) => <option key={time} value={time}>{time}</option>)}</select></label>
            <label>GUESTS *<select name="guests" defaultValue="2" required>{[1, 2, 3, 4, 5, 6, 7, 8].map((count) => <option key={count} value={count}>{count} {count === 1 ? "guest" : "guests"}{count === 8 ? "+" : ""}</option>)}</select></label>
          </div>
          <div className="form-row form-row-two">
            <label>YOUR NAME *<input name="name" type="text" placeholder="Name for the table" autoComplete="name" required /></label>
            <label>EMAIL ADDRESS *<input name="email" type="email" placeholder="you@example.com" autoComplete="email" required /></label>
          </div>
          <div className="form-row form-row-two">
            <label>PHONE NUMBER<input name="phone" type="tel" placeholder="Your best contact number" autoComplete="tel" /></label>
            <label>OCCASION<select name="occasion" defaultValue=""><option value="">Just a lovely evening</option><option>Birthday</option><option>Anniversary</option><option>Family gathering</option><option>Business dinner</option><option>Other celebration</option></select></label>
          </div>
          <label className="message-label">A NOTE FOR US<textarea name="message" rows={3} placeholder="Dietary needs, a special occasion, or anything else we should know." /></label>
          <div className="form-submit-row">
            <button className="button button-dark" type="submit">PREPARE MY REQUEST <ArrowUpRight size={14} /></button>
            <span>NO PAYMENT REQUIRED</span>
          </div>
          {submitted && <p className="form-feedback" role="status"><Check size={16} /> Your details are ready. No booking has been sent or confirmed; please contact Sobha directly once the visit details are added.</p>}
        </form>
      </section>

      <section className="visit-section section-ink" id="visit">
        <div className="visit-intro" data-reveal>
          <SectionLabel light>COME FIND US</SectionLabel>
          <h2>There’s a seat<br /><em>with your name on it.</em></h2>
          <p>We’re getting the finishing details ready. Sobha’s address, hours and contact information will appear here as soon as they’re confirmed.</p>
          <div className="visit-facts">
            <div className="visit-fact"><MapPin size={17} /><div><span>ADDRESS</span><p>{restaurant.address || "Address to be confirmed"}</p></div></div>
            <div className="visit-fact"><Clock3 size={17} /><div><span>OPENING HOURS</span><p>{restaurant.openingHours.length ? "See schedule below" : "Hours to be confirmed"}</p></div></div>
            <div className="visit-fact"><Phone size={17} /><div><span>CONTACT</span><p>{restaurant.phone || "Phone & email to be confirmed"}</p></div></div>
          </div>
          <div className="hours-list">
            {(restaurant.openingHours.length ? restaurant.openingHours : [{ days: "OPENING HOURS", hours: "Details coming soon" }]).map((line) => <div className="hours-row" key={line.days}><span>{line.days}</span><span>{line.hours}</span></div>)}
          </div>
          {restaurant.phone && <a className="visit-contact-link" href={`tel:${restaurant.phone.replace(/[^+\d]/g, "")}`}><Phone size={14} /> CALL SOBHA</a>}
          {restaurant.email && <a className="visit-contact-link" href={`mailto:${restaurant.email}`}><ArrowUpRight size={14} /> EMAIL SOBHA</a>}
        </div>
        <div className="visit-map-wrap" data-reveal>
          <RestaurantMap address={restaurant.address} />
          <div className="map-caption"><span>THE SOBHA NEIGHBOURHOOD</span>{restaurant.address ? <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(restaurant.address)}`} target="_blank" rel="noreferrer">GET DIRECTIONS <ArrowUpRight size={12} /></a> : <span>EXACT LOCATION PENDING</span>}</div>
        </div>
      </section>

      <section className="last-word section-light">
        <span className="last-word-mark">✦</span>
        <p>Good food. Good company.<br /><em>That’s the whole story.</em></p>
        <a className="text-link" href="#top">BACK TO THE BEGINNING <ArrowUpRight size={14} /></a>
      </section>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand"><BrandMark /><p>A table for stories, spice<br />and the pleasure of being together.</p><div className="footer-socials">{restaurant.socialLinks.length ? restaurant.socialLinks.map((social) => <a key={social.label} href={social.url} target="_blank" rel="noreferrer" aria-label={social.label}><Instagram size={16} /></a>) : <span className="social-pending"><Instagram size={15} /> SOCIAL LINKS TO COME</span>}</div></div>
          <div className="footer-col"><span>EXPLORE</span><a href="#story">Our story</a><a href="#menu">The menu</a><a href="#signatures">Gallery</a><a href="#private-dining">Private dining</a><a href="#visit">Visit & contact</a></div>
          <div className="footer-col"><span>YOUR TABLE</span><a href="#reserve">Reserve a table</a><a href="#order-demo">Order online — demo</a><a href="#visit">Opening hours</a><a href="#visit">Find Sobha</a></div>
          <div className="footer-col footer-contact"><span>CONTACT & FOLLOW</span><p>{restaurant.address || "Address details coming soon"}</p><p>{restaurant.phone || "Phone details coming soon"}</p><p>{restaurant.email || "Email details coming soon"}</p></div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} SOBHA RESTAURANT. ALL RIGHTS RESERVED.</span><div><button type="button" onClick={() => setLegalPanel("privacy")}>PRIVACY</button><button type="button" onClick={() => setLegalPanel("terms")}>TERMS</button><a href="#top">BACK TO TOP ↑</a></div><span>MADE FOR GATHERING <b>✦</b></span></div>
      </footer>

      {legalPanel && <div className="legal-backdrop" role="presentation" onClick={() => setLegalPanel(null)}><section className="legal-panel" role="dialog" aria-modal="true" aria-labelledby="legal-title" onClick={(event) => event.stopPropagation()}><button className="legal-close" type="button" aria-label="Close" onClick={() => setLegalPanel(null)}><X size={18} /></button><SectionLabel>{legalPanel === "privacy" ? "YOUR PRIVACY" : "THE SMALL PRINT"}</SectionLabel><h2 id="legal-title">{legalPanel === "privacy" ? "Privacy notice" : "Terms of use"}</h2><p>{legalPanel === "privacy" ? "This website is a visual preview. The reservation form does not transmit or store the information you enter. A final privacy notice should be supplied by Sobha before the site is published." : "This website is a preview of Sobha Restaurant’s online presence. Menu, price, booking, contact and location details remain subject to confirmation by the restaurant."}</p><button className="text-link legal-done" type="button" onClick={() => setLegalPanel(null)}>CLOSE <X size={13} /></button></section></div>}
    </main>
  );
}

export default Home;
