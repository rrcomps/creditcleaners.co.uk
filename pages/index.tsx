import Head from "next/head";
import React, { useMemo, useState, useEffect, useRef } from "react";
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
} from "../components/Icons";
import CreditCheckCalculator from "../components/CreditCheckCalculator";
import ChatWidget from "../components/ChatWidget";
import LeadForm from "../components/LeadForm";
import DeveloperPanel from "../components/DeveloperPanel";
import styles from "../components/LandingStyles.module.css";

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

export default function DebtHelpLandingPage() {
  const [ctaText, setCtaText] = useState("Check eligibility now");
  const [showExitCall, setShowExitCall] = useState(false);
  const formRef = useRef(null);
  const [formInView, setFormInView] = useState(false);
  const [formMode, setFormMode] = useState("two"); // 'single' | 'two'
  const heroReview = useMemo(() => REVIEWS[Math.floor(Math.random() * REVIEWS.length)], []);

  useEffect(() => { try { setCtaText(chooseCtaVariant()); } catch (_) {} }, []);

  useEffect(() => {
    if (!formRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      const e = entries[0];
      setFormInView(e.isIntersecting);
    }, { threshold: 0.2 });
    observer.observe(formRef.current);
    return () => observer.disconnect();
  }, [formRef]);

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

  return (
    <>
      <Head>
        <meta
          name="description"
          content="Keyword-rich summary of Credit Cleaners’ service"
        />
      </Head>

      <div className={`relative min-h-screen text-slate-900 ${styles.page}`}>
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
          <div className="order-2 md:order-1">
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
            <div className="mt-6 flex items-start gap-3">
              <div className="flex text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4" />
                ))}
              </div>
              <p className="text-sm text-slate-600 italic">“{heroReview.text}” — {heroReview.name}, {heroReview.area}</p>
            </div>
          </div>

          {/* Form Card */}
          {/* Mobile title above the form */}
          <div className="sm:hidden px-4 mb-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Grow your <span className="hl">credit health</span> — fast <span className="hl">eligibility check</span>
            </h1>
          </div>

          <div className="order-1 md:order-2">
            <LeadForm ref={formRef} isSingle={isSingle} ctaText={ctaText} />
          </div>
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

        {/* Credit utilisation calculator */}
        <section className="mx-auto max-w-6xl px-4 pb-10">
          <h2 className="text-2xl font-semibold text-center mb-4">Check your credit utilisation</h2>
          <CreditCheckCalculator />
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
        <DeveloperPanel />
      </div>
    </>
  );
}
