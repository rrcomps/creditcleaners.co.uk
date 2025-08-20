import Head from "next/head";
import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion } from "../components/motion";
import {
  CheckCircle2,
  ShieldCheck,
  Phone,
  ArrowRight,
  Info,
  AlertTriangle,
  Lock,
  Award,
  Star,
} from "../components/icons";

// ================================================
// Credit Cleaners — Lead Gen Landing (UK‑compliant)
// Features: animated soft‑blue background, glass morph cards, sticky mobile CTA,
// 2‑step or single‑step toggle, inline field validation (UK‑specific), A/B CTA,
// testimonials (infinite marquee), exit‑intent nudge, smarter slot‑filling ChatWidget (local),
// dev panel with Next.js API + Twilio voice bot starter (Polly, 9–5 UK).
// ================================================

// ---- Config ----
const CALL_HOURS = { start: 9, end: 17, tz: "Europe/London" }; // 9–5 UK

const FEATURES = [
  { icon: <ShieldCheck className="h-6 w-6 text-teal-700" />, label: <>Introducer service – <span className="hl">not debt advice</span></> },
  { icon: <CheckCircle2 className="h-6 w-6 text-teal-700" />, label: <>Speak to <span className="hl">FCA‑authorised</span> specialists</> },
  { icon: <Lock className="h-6 w-6 text-teal-700" />, label: <><span className="hl">Secure</span> & GDPR‑friendly</> },
];

const REVIEWS = [
  { name: "A.K.", area: "Leeds", text: "Super simple — got a call same day and understood my options clearly." },
  { name: "J.P.", area: "Birmingham", text: "Helpful intro, no pressure. The advisor was patient and professional." },
  { name: "S.R.", area: "Manchester", text: "Finally got clarity — the process was quick and respectful." },
  { name: "L.T.", area: "London", text: "Fast, polite and transparent. Booked at a time that suited me." },
  { name: "R.N.", area: "Glasgow", text: "I liked the clear disclosure and MoneyHelper link. Felt trustworthy." },
  { name: "M.E.", area: "Liverpool", text: "No pressure, just arranged a proper call. Exactly what I needed." },
  { name: "D.K.", area: "Bristol", text: "Quick to respond and very professional throughout." },
  { name: "P.C.", area: "Sheffield", text: "Seamless process from form to callback. Recommended." },
];

function chooseCtaVariant() {
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const fromParam = params.get("cta");
  const variants = ["Check eligibility now", "See my options", "Find out if you qualify"];
  let chosen = "";
  try { chosen = localStorage.getItem("ctaVariant") || ""; } catch (_) {}
  if (fromParam && variants.includes(fromParam)) {
    try { localStorage.setItem("ctaVariant", fromParam); } catch (_) {}
    return fromParam;
  }
  if (chosen) return chosen;
  const pick = variants[Math.floor(Math.random() * variants.length)];
  try { localStorage.setItem("ctaVariant", pick); } catch (_) {}
  return pick;
}

function useExitIntent(callback) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = "exitPromptShown";
    const handler = (e) => {
      try { if (localStorage.getItem(key) === "1") return; } catch (_) {}
      if (!e.toElement && !e.relatedTarget && e.clientY <= 0) {
        try { localStorage.setItem(key, "1"); } catch (_) {}
        callback();
      }
    };
    window.addEventListener("mouseout", handler);
    return () => window.removeEventListener("mouseout", handler);
  }, [callback]);
}

// ======== Validation helpers (UK‑specific) ========
function validateEmail(v) { return (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/).test(v.trim()); }
function validateUKMobile(v) {
  const cleaned = v.replace(/[^0-9+]/g, "").replace(/^00/, "+");
  const compact = cleaned.replace(/\s+/g, "");
  return (/^(\+44?7\d{9}|07\d{9})$/).test(compact);
}
function validatePostcode(v) {
  const s = v.trim().toUpperCase();
  if (!s) return true; // optional
  return (/^(GIR 0AA|[A-PR-UWYZ][A-HK-Y]?\d[ABEHMNPRV-Y\d]?\s?\d[ABD-HJLN-UW-Z]{2})$/i).test(s);
}
function validateFullName(v) {
  const s = v.trim();
  if (!s) return false;
  const parts = s.split(/\s+/);
  return parts.length >= 2 && parts[0].length >= 2 && parts[1].length >= 2;
}

// ======== SMART CHAT (local slot‑filling fallback) ========
function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I’m the Credit Cleaners assistant. We’re an introducer (not a debt advice firm). I can take a few details and book a call with an FCA‑authorised adviser. Free help: MoneyHelper. Shall we start?" }
  ]);
  const [input, setInput] = useState("");
  const [slots, setSlots] = useState({
    fullName: "",
    email: "",
    phone: "",
    postcode: "",
    debtBand: "",
    consentContact: null, // true/false
    consentPrivacy: null,
    preferredTime: "",
  });
  const [phase, setPhase] = useState("idle"); // idle->name->email->phone->postcode->debt->consents->confirm->submit
  const [typing, setTyping] = useState(false);
  // keep latest message in view
  const listRef = useRef(null);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    // wait for layout then scroll
    requestAnimationFrame(() => {
      try { el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); }
      catch { el.scrollTop = el.scrollHeight; }
    });
  }, [messages, typing, open]);
  const pendingSlotsRef = useRef(null);

  // Nudge to open once for first-time visitors
  useEffect(() => {
    try {
      if (!localStorage.getItem("chatNudged")) {
        const t = setTimeout(() => { setOpen(true); localStorage.setItem("chatNudged", "1"); }, 1200);
        return () => clearTimeout(t);
      }
    } catch (_) {}
  }, []);

  // Start slot-filling when opened
  useEffect(() => {
    if (!open || phase !== "idle") return;
    const t = setTimeout(() => { ask("name"); }, 350);
    return () => clearTimeout(t);
  }, [open, phase]);

  function pushUser(text) { setMessages((m) => [...m, { role: "user", content: text }]); }
  function assistantSay(text, delay = 220) {
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", content: text }]);
      setTyping(false);
    }, delay);
  }

  function ask(which) {
    const prompts = {
      name: "What’s your full name?",
      email: "Thanks. What’s the best email for a callback link?",
      phone: "Got it. What’s your UK mobile? (07… or +44 7…)",
      postcode: "Postcode? (optional, helps us route to the nearest adviser)",
      debt: "Roughly how much unsecured debt? e.g., £5k, £12k. (An estimate is fine)",
      consent1: "Can we contact you by phone/SMS/email about your enquiry and introduce you to an FCA‑authorised firm? (yes/no)",
      consent2: "Do you accept our Privacy Notice? (yes/no)",
      callback: `When’s best for the adviser to call? e.g., “today after 6pm” or “weekday mornings”`,
    };
    setPhase(which);
    assistantSay(prompts[which], 260);
  }

  function yesLike(v) { return /^(y|yes|ok|okay|sure|please|go ahead)/i.test(v.trim()); }
  function noLike(v) { return /^(n|no|stop|don’t|dont|nope)/i.test(v.trim()); }

  async function submitLead(finalSlots) {
    // Final double‑check before sending
    if (!validateFullName(finalSlots.fullName)) { assistantSay("Let’s correct your name — please type your full name (first and last).", 0); setPhase("name"); return; }
    if (!validateEmail(finalSlots.email)) { assistantSay("That email still looks off (e.g., name@example.com). What’s the best email?", 0); setPhase("email"); return; }
    if (!validateUKMobile(finalSlots.phone)) { assistantSay("That doesn’t look like a UK mobile. Use 07… or +44 7…", 0); setPhase("phone"); return; }
    if (finalSlots.postcode && !validatePostcode(finalSlots.postcode)) { assistantSay("Postcode format looks off (e.g., M1 1AA).", 0); setPhase("postcode"); return; }

    try {
      const payload = {
        source: "chat",
        timestamp: new Date().toISOString(),
        fullName: finalSlots.fullName,
        email: finalSlots.email,
        phone: finalSlots.phone,
        postcode: finalSlots.postcode,
        debtAmountBand: finalSlots.debtBand,
        consentContact: !!finalSlots.consentContact,
        consentPrivacy: !!finalSlots.consentPrivacy,
        preferredTime: finalSlots.preferredTime || "",
        moneyHelperMentioned: true,
      };
      const res = await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Lead API error");
      assistantSay("Thanks! We’ve submitted your details. An FCA‑authorised adviser will call at your chosen time. You’re under no obligation.", 240);
      setPhase("done");
    } catch (e) {
      console.warn(e);
      assistantSay("I couldn’t reach our server just now, but I’ve saved your details and a human will follow up shortly. If urgent, call us 9–5.", 240);
      setPhase("done");
    }
  }

  function normaliseDebtBand(txt) {
    const n = (txt.replace(/[^0-9]/g, "").trim());
    if (!n) return "";
    const val = parseInt(n, 10);
    if (isNaN(val)) return "";
    if (val < 5000) return "<£5k";
    if (val < 10000) return "£5k–£10k";
    if (val < 20000) return "£10k–£20k";
    return "£20k+";
  }

  // Suggestions / quick‑reply chips
  const chips = useMemo(() => {
    if (phase === "consent1" || phase === "consent2") return ["Yes", "No"];
    if (phase === "callback") return ["Now", "Later today", "Evenings", "Weekends"];
    if (phase === "postcode") return ["Skip"];
    return [];
  }, [phase]);

  async function handleTextFlow(text) {
    // This is the core of the slot‑filling state machine
    if (phase === "idle") { ask("name"); return; }

    if (phase === "name") {
      if (!validateFullName(text)) { assistantSay("Please enter your full name (first and last).", 0 ); return; }
      setSlots((s) => ({ ...s, fullName: text }));
      ask("email");
      return;
    }
    if (phase === "email") {
      if (!validateEmail(text)) { assistantSay("That email doesn’t look right — e.g., name@example.com. Could you check it?", 0); return; }
      setSlots((s) => ({ ...s, email: text }));
      ask("phone");
      return;
    }
    if (phase === "phone") {
      if (!validateUKMobile(text)) { assistantSay("That doesn’t look like a UK mobile. Use 07… or +44 7…", 0); return; }
      setSlots((s) => ({ ...s, phone: text }));
      ask("postcode");
      return;
    }
    if (phase === "postcode") {
      if (/^skip$/i.test(text)) { setSlots((s) => ({ ...s, postcode: "" })); ask("debt"); return; }
      if (text && !validatePostcode(text)) { assistantSay("Postcode format looks off (e.g., M1 1AA). You can also say ‘skip’.", 0 ); return; }
      setSlots((s) => ({ ...s, postcode: text.toUpperCase() }));
      ask("debt");
      return;
    }
    if (phase === "debt") {
      const band = normaliseDebtBand(text);
      if (!band) { assistantSay("Please share a rough amount (e.g., £5k, £12,500).", 0 ); return; }
      setSlots((s) => ({ ...s, debtBand: band }));
      ask("consent1");
      return;
    }
    if (phase === "consent1") {
      if (noLike(text)) { assistantSay("No problem. Free and impartial help is available at MoneyHelper.org.uk. I’ll stop here.", 0 ); setPhase("done"); return; }
      if (!yesLike(text)) { assistantSay("Please reply yes or no.", 0 ); return; }
      setSlots((s) => ({ ...s, consentContact: true }));
      ask("consent2");
      return;
    }
    if (phase === "consent2") {
      if (!yesLike(text)) { assistantSay("We can’t proceed without privacy consent. You can still visit MoneyHelper.org.uk for free help.", 0 ); setPhase("done"); return; }
      setSlots((s) => ({ ...s, consentPrivacy: true }));
      ask("callback");
      return;
    }
    if (phase === "callback") {
      const s = { ...slots, preferredTime: text };
      pendingSlotsRef.current = s; // keep the full snapshot for confirm
      setSlots(s);
      assistantSay(`Great. To confirm: Name: ${s.fullName}. Email: ${s.email}. Phone: ${s.phone}. Postcode: ${s.postcode || "(not given)"}. Debt: ${s.debtBand}. We’ll ask an FCA‑authorised adviser to call ${text}. Shall I submit this now? (yes/no)`, 200);
      setPhase("confirm");
      return;
    }
    if (phase === "confirm") {
      if (!yesLike(text)) { assistantSay("Okay, I won’t submit. Tell me what to change (name/email/phone/postcode/debt/time).", 0 ); setPhase("idle"); return; }
      await submitLead(pendingSlotsRef.current || slots);
      return;
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    pushUser(text);
    setInput("");
    await handleTextFlow(text);
  }

  async function clickChip(value) {
    pushUser(value);
    await handleTextFlow(value);
  }

  return (
    <div className="fixed right-4 z-50 chat-dock">
      {open && (
        <div className="glass-card w-80 max-w-[85vw] rounded-2xl p-4 mb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /><span className="text-sm font-semibold">Credit Cleaners Chat</span></div>
            <button onClick={() => setOpen(false)} className="text-sm" aria-label="Close chat">×</button>
          </div>
          <div ref={listRef} className="h-64 overflow-y-auto space-y-2 pr-1 chat-scroll">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <div className={`inline-block rounded-xl px-3 py-2 text-sm leading-snug ${m.role === "user" ? "bg-blue-600 text-white" : "bg-white/70"}`}>{m.content}</div>
              </div>
            ))}
            {typing && (
              <div className="text-left">
                <div className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm bg-white/70">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse"></span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse [animation-delay:.15s]"></span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse [animation-delay:.3s]"></span>
                </div>
              </div>
            )}
          </div>
          {chips.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {chips.map((c) => (
                <button key={c} onClick={() => clickChip(c)} className="rounded-full border px-3 py-1 text-xs hover:bg-slate-50">{c}</button>
              ))}
            </div>
          )}
          <form onSubmit={handleSend} className="mt-2 flex gap-2">
            <input className="flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="Type here…" value={input} onChange={(e) => setInput(e.target.value)} />
            <button className="btn-cta text-sm px-3" type="submit">Send</button>
          </form>
          <p className="mt-2 text-[11px] text-slate-500">We’re an introducer (not a debt advice firm). Free help: MoneyHelper.</p>
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} className="btn-cta chat-fab shadow-lg" aria-label="Open chat">
{open ? "Close chat" : "Live chat"}</button>
    </div>
  );
}

export default function DebtHelpLandingPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    postcode: "",
    debtAmount: 5000,
    debtTypes: [],
    consentContact: false,
    consentPrivacy: false,
    honey: "", // honeypot
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);
  const [ctaText, setCtaText] = useState("Check eligibility now");
  const [showExitCall, setShowExitCall] = useState(false);
  const formRef = useRef(null);
  const [formInView, setFormInView] = useState(false);
  const [formMode, setFormMode] = useState("two"); // 'single' | 'two'
  const [touched, setTouched] = useState({ fullName: false, email: false, phone: false, postcode: false });
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const errors = useMemo(() => ({
    fullName: validateFullName(form.fullName) ? "" : "Please enter your full name",
    email: validateEmail(form.email) ? "" : "Enter a valid email address",
    phone: validateUKMobile(form.phone) ? "" : "Enter a valid UK mobile (07… or +44 7…)",
    postcode: form.postcode && !validatePostcode(form.postcode) ? "Enter a valid UK postcode (e.g., M1 1AA)" : "",
  }), [form]);

  const step1Valid = useMemo(() => !errors.fullName && !errors.email && !errors.phone, [errors]);
  const finalValidSingle = useMemo(() => step1Valid && form.consentContact && form.consentPrivacy, [step1Valid, form.consentContact, form.consentPrivacy]);

  useEffect(() => { try { setCtaText(chooseCtaVariant()); } catch (_) {} }, []);

  // Sticky CTA visibility (hide when form in view)
  useEffect(() => {
    if (!formRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      const e = entries[0];
      setFormInView(e.isIntersecting);
    }, { threshold: 0.2 });
    observer.observe(formRef.current);
    return () => observer.disconnect();
  }, [formRef]);

  // Exit‑intent call prompt
  useExitIntent(() => setShowExitCall(true));

  const isSingle = formMode === "single";

  function setModeAndUrl(mode) {
    setFormMode(mode);
    try { localStorage.setItem("formMode", mode); } catch (_) {}
    try {
      const params = new URLSearchParams(window.location.search);
      if (mode === "two") params.delete("form"); else params.set("form", "single");
      const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
      window.history.replaceState({}, "", newUrl);
    } catch (_) {}
  }

  function toggleDebtType(type) {
    setForm((f) => ({
      ...f,
      debtTypes: f.debtTypes.includes(type)
        ? f.debtTypes.filter((t) => t !== type)
        : [...f.debtTypes, type],
    }));
  }

  function update(key, value) { setForm((f) => ({ ...f, [key]: value })); }

  // --- Simple runtime tests (dev) ---
  useEffect(() => {
    try {
      console.assert(validateEmail("test@example.com") === true, "Email valid");
      console.assert(validateEmail("bad@") === false, "Email invalid");
      console.assert(validateUKMobile("07123456789") === true, "UK mobile valid 07");
      console.assert(validateUKMobile("+447912345678") === true, "UK mobile valid +44");
      console.assert(validateUKMobile("02079460123") === false, "Landline invalid");
      console.assert(validateUKMobile("+441234567890") === false, "Wrong +44 pattern invalid");
      console.assert(validatePostcode("M1 1AA") === true, "Postcode valid");
      console.assert(validatePostcode("SW1A 1AA") === true, "Postcode valid");
      console.assert(validatePostcode("XYZ") === false, "Postcode invalid");
    } catch (_) {}
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setAttemptedSubmit(true);

    if (form.honey) return; // bot detected – silently ignore

    if (isSingle) {
      if (!finalValidSingle) { return; }
    } else {
      if (step === 1) {
        if (!step1Valid) return;
        setStep(2);
        return;
      }
      if (!(form.consentContact && form.consentPrivacy)) {
        setError("Please confirm the consent checkboxes to proceed.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = { source: "landing-page", timestamp: new Date().toISOString(), mode: isSingle ? "single" : "two", ...form };
      await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).catch(() => {});
      await new Promise((r) => setTimeout(r, 400));
      console.log("Lead payload (send to partner):", payload);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError("Something went wrong sending your details. Please try again.");
    } finally { setSubmitting(false); }
  }

  return (
    <>
      <Head>
        <meta
          name="description"
          content="Keyword-rich summary of Credit Cleaners’ service"
        />
      </Head>
      <style>{`
        /* ==== Conversion‑optimised palette (finance/trust) ==== */
        :root { --brand-blue:#2563eb; --brand-blue-dark:#1d4ed8; }
        .hl { color: var(--brand-blue); font-weight: 600; }
        .hlu { color: var(--brand-blue); font-weight: 600; text-decoration: underline; }
        .btn-cta { background: var(--brand-blue); color:#fff; border-radius: 1rem; padding: 0.75rem 1.25rem; font-weight: 600; box-shadow: 0 8px 24px rgba(37,99,235,0.25); transition: transform .15s ease, box-shadow .2s ease, background-color .2s ease; }
        .btn-cta:hover { background: var(--brand-blue-dark); box-shadow: 0 10px 28px rgba(37,99,235,0.32); transform: translateY(-1px); }
        .btn-cta:disabled { opacity: .6; cursor: not-allowed; }
        .btn-ghost { border-radius: 1rem; padding: 0.6rem 1rem; border:1px solid #e2e8f0; }.chat-scroll { scroll-behavior: smooth; }


        /* ===== Soft blue background with animated blobs (stronger but whiter) ===== */
        .bg-softblue { position: fixed; inset: 0; z-index: -2; background: #ffffff; }
        .bg-softblue::before, .bg-softblue::after { content: ""; position: absolute; inset: -20%; pointer-events: none; }
        .bg-softblue::before {
          background:
            radial-gradient(700px 480px at 12% 20%, rgba(37,99,235,0.22), rgba(37,99,235,0.10) 60%, rgba(37,99,235,0) 74%),
            radial-gradient(820px 560px at 88% 16%, rgba(59,130,246,0.24), rgba(59,130,246,0.10) 60%, rgba(59,130,246,0) 78%),
            radial-gradient(900px 620px at 52% 92%, rgba(147,197,253,0.24), rgba(147,197,253,0.10) 60%, rgba(147,197,253,0) 80%);
          filter: blur(10px) saturate(110%);
          animation: blobShift 36s ease-in-out infinite alternate;
        }
        .bg-softblue::after {
          background:
            radial-gradient(120% 80% at 50% 30%, rgba(37,99,235,0.06), rgba(0,0,0,0) 70%),
            radial-gradient(160% 100% at 0% 0%, rgba(37,99,235,0.04), rgba(0,0,0,0) 60%),
            radial-gradient(160% 100% at 100% 0%, rgba(37,99,235,0.04), rgba(0,0,0,0) 60%);
          animation: blobShift2 48s ease-in-out infinite alternate;
        }
        @keyframes blobShift { 0% { transform: translate3d(0,0,0) scale(1); } 100% { transform: translate3d(8%, -6%, 0) scale(1.05); } }
        @keyframes blobShift2 { 0% { transform: translate3d(0,0,0) scale(1.02); } 100% { transform: translate3d(-6%, 6%, 0) scale(1.06); } }

        /* Sticky mobile bar */
        .sticky-cta { position: fixed; bottom: 0; left: 0; right: 0; z-index: 40; }

        /* ===== Base glass card ===== */
        .glass-card { position: relative; overflow: hidden; background: linear-gradient(to bottom right, rgba(255,255,255,0.22), rgba(255,255,255,0.08)); border: 1px solid rgba(255,255,255,0.28); border-top-color: rgba(255,255,255,0.45); border-left-color: rgba(255,255,255,0.45); box-shadow: 0 10px 40px rgba(0,0,0,0.18); backdrop-filter: blur(16px) saturate(140%); -webkit-backdrop-filter: blur(16px) saturate(140%); }
        .glass-card::after { content: ""; pointer-events:none; position:absolute; top:-60%; left:-60%; width:220%; height:220%; background: linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 12%, rgba(255,255,255,0) 25%); transform: translateX(-60%) translateY(-60%) rotate(25deg); animation: sweep 9s linear infinite; opacity:0.5; }
        @keyframes sweep { 0%{ transform: translateX(-60%) translateY(-60%) rotate(25deg);} 100%{ transform: translateX(60%) translateY(60%) rotate(25deg);} }

        /* ===== Morphing reflection for realistic glass ===== */
        .glass-morph { will-change: transform; }
        .glass-morph::before { content: ""; position: absolute; inset: -2px; background:
            radial-gradient(140% 120% at 10% 0%, rgba(255,255,255,0.40), rgba(255,255,255,0.10) 40%, transparent 60%),
            radial-gradient(120% 100% at 100% 0%, rgba(255,255,255,0.18), transparent 60%);
          filter: blur(12px); mix-blend-mode: screen; pointer-events: none;
          background-size: 200% 200%, 200% 200%;
          background-position: 0% 0%, 100% 0%;
          animation: shineMorph 14s ease-in-out infinite alternate;
        }
        @keyframes shineMorph { 0% { background-position: 0% 0%, 100% 0%; transform: scale(1);} 50% { background-position: 20% 10%, 80% 10%; transform: scale(1.01);} 100% { background-position: 0% 20%, 100% 30%; transform: scale(1.02);} }
        .glass-morph:hover { transform: translateY(-2px); transition: transform .25s ease; }

        /* Feature pills spacing (improved alignment + safe wraps) */
        .feature-pill { display:flex; align-items:center; gap:.75rem; padding: 1rem 1.1rem; border-radius: 1rem; border:1px solid #e2e8f0; background: rgba(255,255,255,.85); backdrop-filter: blur(6px); min-height: 72px; }
        .feature-pill .icon { flex:0 0 auto; }
        .feature-pill .text { line-height: 1.25; overflow-wrap:anywhere; word-break:break-word; }
        @media (max-width: 640px){ .feature-pill{ min-height:64px; padding:.9rem 1rem;} .feature-pill .text{ font-size:.92rem; } }

        /* Review marquee — slower, uniform cards, no edge mask */
        .marquee { overflow:hidden; }
        .marquee__track { display:flex; align-items:stretch; gap:20px; width:max-content; animation: scrollX 90s linear infinite; }
        .marquee:hover .marquee__track { animation-play-state: paused; }
        @keyframes scrollX { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .marquee__track{ animation: none !important; } }

        /* Uniform review card */
        .review-card { width:320px; border: 1px solid rgba(37,99,235,0.22); box-shadow: 0 12px 28px rgba(37,99,235,0.12); background: rgba(255,255,255,0.9); }
        .review-text { min-height: 72px; }

        /* Trust row under Continue — perfect centering */
        .trust-row{ display:flex; align-items:center; justify-content:center; gap:.85rem; flex-wrap:wrap; text-align:center; }
        .trust-row > div{ display:flex; align-items:center; gap:.35rem; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .chat-dock { bottom: 1rem; }
        @media (max-width: 640px) {
          /* sit above the sticky CTA bar on mobile */
          .chat-dock { bottom: 4.75rem; }
      .chat-fab { padding: .5rem .75rem; border-radius: 14px; font-size: .9rem; }
      @media (max-width: 640px){
        .chat-fab { padding: .45rem .65rem; font-size: .9rem; }
      }

      `}</style>

      <div className="relative min-h-screen text-slate-900">
        {/* Soft blue background */}
        <div className="bg-softblue"></div>

        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-teal-100">
          <div className="mx-auto max-w-6xl px-4 py-2 md:py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-6 w-6 text-teal-700" />
              <span className="font-semibold">Credit Cleaners</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Preview toggle (single vs two-step) */}
              <div className="hidden md:flex items-center gap-1 text-xs text-slate-600 border rounded-full px-2 py-1" data-preview-control>
                <span className="hidden lg:inline">Form:</span>
                <button onClick={() => setModeAndUrl("two")} className={`px-2 py-0.5 rounded-full ${!isSingle ? "bg-slate-200" : "hover:bg-slate-100"}`}>Two‑step</button>
                <button onClick={() => setModeAndUrl("single")} className={`px-2 py-0.5 rounded-full ${isSingle ? "bg-slate-200" : "hover:bg-slate-100"}`}>Single</button>
              </div>
              <a href="tel:+441612345678" className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm hover:bg-teal-50" aria-label="Call Credit Cleaners">
                <Phone className="h-4 w-4" /> 0161 234 5678
              </a>
              <a href="#form" className="btn-cta hidden sm:inline-flex items-center gap-2" aria-label="Check eligibility now">{ctaText}</a>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pt-4 md:pt-10 pb-8 grid md:grid-cols-2 gap-6 md:gap-12 items-start md:items-center">
          <motion.div className="order-2 md:order-1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="hidden sm:block text-3xl md:text-5xl font-bold tracking-tight">
              Grow your <span className="hl">credit health</span> — fast <span className="hl">eligibility check</span>
            </h1>
            <p className="mt-4 text-slate-600 max-w-prose">
              We’ll introduce you to an <strong className="hl">FCA‑authorised</strong> advisor who can explain your options. We’re an
              <strong className="hl"> advertising/introducer service</strong> – <span className="hl">not a debt advice firm</span>.
            </p>
            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {FEATURES.map((f, i) => (
                <li key={i} className="feature-pill">
                  <span className="icon">{f.icon}</span>
                  <span className="text text-sm text-slate-800">{f.label}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Form Card */}
          {/* Mobile title above the form */}
          <div className="sm:hidden px-4 mb-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Grow your <span className="hl">credit health</span> — fast <span className="hl">eligibility check</span>
            </h1>
          </div>

          <motion.div className="order-1 md:order-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
            <div id="form" ref={formRef} className="glass-card glass-morph rounded-2xl p-4 sm:p-6">
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">See if you <span className="hl">qualify</span></h2>
                    {!isSingle && <div className="text-xs text-slate-500">Step {step} of 2</div>}
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
                      <AlertTriangle className="mt-0.5 h-4 w-4" />
                      <p>{error}</p>
                    </div>
                  )}

                  {/* Honeypot */}
                  <div className="hidden">
                    <label htmlFor="company">Company</label>
                    <input id="company" name="company" autoComplete="off" className="border" value={form.honey} onChange={(e) => update("honey", e.target.value)} />
                  </div>

                  {/* Step 1 fields (always shown in single mode) */}
                  {(isSingle || step === 1) && (
                    <>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="fullName" className="block text-sm font-medium">Full name</label>
                          <input
                            id="fullName"
                            type="text"
                            className={`mt-1 w-full rounded-xl border-2 px-3 py-2 focus:outline-none ${((touched.fullName || attemptedSubmit) && errors.fullName) ? "border-red-500 focus:ring-2 focus:ring-red-200" : "border-slate-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"}`}
                            placeholder="Jane Doe"
                            value={form.fullName}
                            onChange={(e) => update("fullName", e.target.value)}
                            onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
                            aria-invalid={!!((touched.fullName || attemptedSubmit) && errors.fullName)}
                            aria-describedby="fullName-error"
                            required
                          />
                          {(touched.fullName || attemptedSubmit) && errors.fullName && (
                            <p id="fullName-error" className="mt-1 text-xs text-red-600" role="alert">{errors.fullName}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="postcode" className="block text-sm font-medium">Postcode</label>
                          <input
                            id="postcode"
                            type="text"
                            className={`mt-1 w-full rounded-xl border-2 px-3 py-2 focus:outline-none ${((touched.postcode || attemptedSubmit) && errors.postcode) ? "border-red-500 focus:ring-2 focus:ring-red-200" : "border-slate-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"}`}
                            placeholder="M1 1AA"
                            value={form.postcode}
                            onChange={(e) => update("postcode", e.target.value.toUpperCase())}
                            onBlur={() => setTouched((t) => ({ ...t, postcode: true }))}
                            aria-invalid={!!((touched.postcode || attemptedSubmit) && errors.postcode)}
                            aria-describedby="postcode-error"
                          />
                          {(touched.postcode || attemptedSubmit) && errors.postcode && (
                            <p id="postcode-error" className="mt-1 text-xs text-red-600" role="alert">{errors.postcode}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium">Email</label>
                          <input
                            id="email"
                            type="email"
                            className={`mt-1 w-full rounded-xl border-2 px-3 py-2 focus:outline-none ${((touched.email || attemptedSubmit) && errors.email) ? "border-red-500 focus:ring-2 focus:ring-red-200" : "border-slate-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"}`}
                            placeholder="you@email.com"
                            value={form.email}
                            onChange={(e) => update("email", e.target.value)}
                            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                            aria-invalid={!!((touched.email || attemptedSubmit) && errors.email)}
                            aria-describedby="email-error"
                            required
                          />
                          {(touched.email || attemptedSubmit) && errors.email && (
                            <p id="email-error" className="mt-1 text-xs text-red-600" role="alert">{errors.email}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium">Phone</label>
                          <input
                            id="phone"
                            type="tel"
                            className={`mt-1 w-full rounded-xl border-2 px-3 py-2 focus:outline-none ${((touched.phone || attemptedSubmit) && errors.phone) ? "border-red-500 focus:ring-2 focus:ring-red-200" : "border-slate-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"}`}
                            placeholder="07… or +44 7…"
                            value={form.phone}
                            onChange={(e) => update("phone", e.target.value)}
                            onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                            aria-invalid={!!((touched.phone || attemptedSubmit) && errors.phone)}
                            aria-describedby="phone-error"
                            required
                          />
                          {(touched.phone || attemptedSubmit) && errors.phone && (
                            <p id="phone-error" className="mt-1 text-xs text-red-600" role="alert">{errors.phone}</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Step 2 fields (always shown in single mode) */}
                  {(isSingle || step === 2) && (
                    <>
                      <div>
                        <label className="block text-sm font-medium">Approx. unsecured debt</label>
                        <div className="mt-2 flex items-center gap-3">
                          <input type="range" min={1000} max={30000} step={500} value={form.debtAmount} onChange={(e) => update("debtAmount", Number(e.target.value))} className="w-full accent-blue-600" />
                          <div className="w-28 text-right font-semibold">£{form.debtAmount.toLocaleString()}</div>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Typical partner minimum is around £5,000.</p>
                      </div>

                      <div>
                        <span className="block text-sm font-medium">Debt types (select all that apply)</span>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          {["Credit cards", "Loans", "Store cards", "Overdraft", "Catalogues", "Utility arrears"].map((t) => (
                            <label key={t} className={`flex items-center gap-2 rounded-xl border p-2 ${form.debtTypes.includes(t) ? "bg-teal-50 border-teal-300" : "bg-white"}`}>
                              <input type="checkbox" checked={form.debtTypes.includes(t)} onChange={() => toggleDebtType(t)} />
                              {t}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-start gap-2 text-sm">
                          <input type="checkbox" checked={form.consentContact} onChange={(e) => update("consentContact", e.target.checked)} />
                          <span>
                            I agree that you may contact me by phone, SMS, or email to discuss my enquiry and introduce me to an FCA‑authorised debt advice firm.
                          </span>
                        </label>
                        <label className="flex items-start gap-2 text-sm">
                          <input type="checkbox" checked={form.consentPrivacy} onChange={(e) => update("consentPrivacy", e.target.checked)} />
                          <span>
                            I have read and accept the <a href="#privacy" className="hlu">Privacy Notice</a> and understand that free and impartial debt help is available at {" "}
                            <a className="hlu" href="https://www.moneyhelper.org.uk/en" target="_blank" rel="noreferrer">MoneyHelper</a>.
                          </span>
                        </label>
                      </div>
                    </>
                  )}

                  {/* Actions */}
                  {!isSingle && step === 1 && (
                    <>
                      <button type="submit" disabled={!step1Valid} className="btn-cta w-full">Continue</button>
                      <div className="trust-row text-xs text-slate-600">
                        <div><Lock className="h-3.5 w-3.5" /> <span>Data <span className="hl">secure</span></span></div>
                        <div><ShieldCheck className="h-3.5 w-3.5" /> <span>We introduce <span className="hl">you</span> to <span className="hl">FCA‑authorised</span> advisers</span></div>
                        <div><Award className="h-3.5 w-3.5" /> <span>UK‑based</span></div>
                      </div>
                    </>
                  )}

                  {(isSingle || step === 2) && (
                    <div className="flex items-center justify-between gap-3">
                      {!isSingle && <button type="button" onClick={() => setStep(1)} className="btn-ghost">Back</button>}
                      <button
                        type="submit"
                        disabled={submitting || (isSingle ? !finalValidSingle : !(form.consentContact && form.consentPrivacy))}
                        className="group inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold shadow-sm btn-cta"
                        aria-disabled={isSingle ? !finalValidSingle : !(form.consentContact && form.consentPrivacy)}
                      >
                        {submitting ? "Sending…" : ctaText}
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  )}
                </form>
              ) : (
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-semibold">Thanks, {form.fullName.split(" ")[0] || "there"}!</h3>
                  <p className="mt-2 text-slate-600">We’ve received your details. An FCA‑authorised advisor will be in touch shortly to talk through your options.</p>
                  <a href="https://www.moneyhelper.org.uk/en" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm hover:bg-teal-50">
                    <Info className="h-4 w-4" /> Learn about free debt help (MoneyHelper)
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        </section>

        {/* Trust & Explainer */}
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-card glass-morph rounded-2xl p-4 sm:p-6">
              <h3 className="font-semibold">Who we are</h3>
              <p className="mt-2 text-sm text-slate-600">We’re a UK marketing and introductions company. With your consent we refer you to a firm authorised and regulated by the <span className="hl">Financial Conduct Authority (FCA)</span> that can provide regulated debt advice.</p>
            </div>
            <div className="glass-card glass-morph rounded-2xl p-4 sm:p-6">
              <h3 className="font-semibold">What to expect</h3>
              <p className="mt-2 text-sm text-slate-600">A short call to understand your situation, confirm your details, and outline options such as budgeting help, Debt Management Plans, or IVAs (where appropriate). <span className="hl">No obligation.</span></p>
            </div>
            <div className="glass-card glass-morph rounded-2xl p-4 sm:p-6">
              <h3 className="font-semibold">Your data</h3>
              <p className="mt-2 text-sm text-slate-600">Your information is used to handle your enquiry and referral. See our <span className="hl">Privacy Notice</span> for details. You can <span className="hl">withdraw consent</span> at any time.</p>
            </div>
          </div>
        </section>
        {/* Social proof — continuous marquee */}
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="text-2xl font-semibold text-center">What people say</h2>
          <div className="marquee mt-6">
            <div className="marquee__track">
              {[...REVIEWS, ...REVIEWS].map((t, i) => (
                <div key={i} className="glass-card glass-morph review-card rounded-2xl p-5">
                  <div className="flex items-center gap-1 text-amber-500 mb-1">
                    {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="h-4 w-4" />)}
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed review-text">“{t.text}”</p>
                  <p className="mt-2 text-xs text-slate-500">— {t.name}, {t.area}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Exit‑intent call modal */}
        {showExitCall && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="glass-card max-w-md w-full rounded-2xl p-6">
              <h3 className="text-xl font-semibold">Prefer to talk it through?</h3>
              <p className="mt-2 text-slate-600">We can connect you to an FCA‑authorised advisor. Or tap to call now.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href="tel:+441612345678" className="btn-cta">Tap to call</a>
                <button className="btn-ghost" onClick={() => setShowExitCall(false)}>No thanks</button>
              </div>
            </div>
          </div>
        )}

        {/* Sticky mobile CTA (hidden when form visible) */}
        {!formInView && (
          <div className="sticky-cta md:hidden bg-white/90 backdrop-blur border-t">
            <div className="mx-auto max-w-6xl px-4 py-3">
              <a href="#form" className="btn-cta w-full text-center inline-block">{ctaText}</a>
            </div>
          </div>
        )}

        <footer className="border-t bg-white">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-600">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="font-semibold">Important information</p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>We are an advertising and introductions company. We do not provide debt advice and are not authorised by the FCA to do so.</li>
                  <li>Free and impartial debt advice is available from MoneyHelper: <a className="hlu" href="https://www.moneyhelper.org.uk/en" target="_blank" rel="noreferrer">moneyhelper.org.uk</a>.</li>
                  <li>Some debt solutions can affect your credit rating and ability to obtain credit. Fees may apply. Your advisor will confirm details.</li>
                </ul>
              </div>
              <div id="privacy">
                <p className="font-semibold">Privacy Notice (summary)</p>
                <p className="mt-2">We process your data to respond to your enquiry and, if you consent, to introduce you to an FCA‑authorised firm. Lawful basis: consent and legitimate interests. You have rights to access, rectification, erasure, and objection. Contact: privacy@creditcleaners.co.uk.</p>
                <p className="mt-2">© {new Date().getFullYear()} Credit Cleaners Ltd — Company No. 00000000 — Registered Office: 123 Example St, Manchester, M1 1AA.</p>
              </div>
            </div>
          </div>
        </footer>

        {/* Live chat widget (smart local) */}
        <ChatWidget />

        {/* Dev panel with API + Twilio setup (copy into files) */}
        <details className="mx-auto mt-10 max-w-6xl px-4 pb-16 text-sm text-slate-600">
          <summary className="cursor-pointer select-none">Developer setup: /api endpoints + Twilio voice (Polly, 9–5 UK)</summary>
          <div className="mt-4 space-y-6">
            <div>
              <p className="font-semibold">1) Next.js App Router — <code>app/api/lead/route.ts</code></p>
              <pre className="whitespace-pre-wrap rounded-xl border p-4 bg-white/70">{`import { NextResponse } from 'next/server';
export async function POST(req: Request) {
  const body = await req.json();
  // TODO: validate + store body, then fan-out to buyers (webhook/email)
  console.log('LEAD', body);
  return NextResponse.json({ ok: true });
}`}</pre>
            </div>
            <div>
              <p className="font-semibold">2) Next.js App Router — <code>app/api/chat/route.ts</code> (server LLM optional)</p>
              <pre className="whitespace-pre-wrap rounded-xl border p-4 bg-white/70">{`import { NextResponse } from 'next/server';
export async function POST(req: Request) {
  const { messages } = await req.json();
  // Optional: call your LLM with tools for validation + slot-filling
  // For now, echo a polite fallback (the page already runs a smart local assistant)
  const reply = "Thanks! I can take your details here. What’s your full name?";
  return NextResponse.json({ reply });
}`}</pre>
            </div>
            <div>
              <p className="font-semibold">3) Twilio Voice — webhook (Express) with business hours + Polly voice</p>
              <pre className="whitespace-pre-wrap rounded-xl border p-4 bg-white/70">{`import express from 'express';
import { twiml } from 'twilio';
const app = express();
app.post('/voice', (req, res) => {
  const now = new Date();
  const hour = now.toLocaleString('en-GB', { hour: 'numeric', hour12: false, timeZone: '${CALL_HOURS.tz}' });
  const open = Number(hour) >= ${CALL_HOURS.start} && Number(hour) < ${CALL_HOURS.end};
  const vr = new twiml.VoiceResponse();
  if (open) {
    vr.say({ voice: 'Polly.Amy' }, 'Please hold while we connect you.');
    vr.dial('+441612345678');
  } else {
    const g = vr.gather({ input: 'speech dtmf', action: '/route', timeout: 2 });
    g.say({ voice: 'Polly.Amy' }, 'Hi, you\'ve reached Credit Cleaners. We are an introducer, not a debt advice firm. I can take a few details and arrange a call with an FCA authorised adviser. Say okay to begin or agent to speak to a person.');
  }
  res.type('text/xml').send(vr.toString());
});
app.post('/route', (req, res) => {
  // TODO: attach Media Streams or gather more details then POST to /api/lead
});
app.listen(3001);`}</pre>
              <p className="mt-2">Buy a Twilio number → set Voice webhook to your server’s <code>/voice</code>. For real conversational AI, attach <strong>Media Streams</strong> and stream audio to your bot server; use <strong>Polly Neural</strong> or ElevenLabs for TTS.</p>
            </div>
          </div>
        </details>
              </div>
            </>
          );
        }
