import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ShieldCheck } from "lucide-react";
import { validateEmail, validateUKMobile, validatePostcode, validateFullName } from "../utils/validation";

export default function ChatWidget() {
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
    consentContact: null,
    consentPrivacy: null,
    preferredTime: "",
  });
  const [phase, setPhase] = useState("idle");
  const [typing, setTyping] = useState(false);
  const listRef = useRef(null);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      try { el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); }
      catch { el.scrollTop = el.scrollHeight; }
    });
  }, [messages, typing, open]);
  const pendingSlotsRef = useRef(null);

  useEffect(() => {
    try {
      if (!localStorage.getItem("chatNudged")) {
        const t = setTimeout(() => { setOpen(true); localStorage.setItem("chatNudged", "1"); }, 1200);
        return () => clearTimeout(t);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!open || phase !== "idle") return;
    const t = setTimeout(() => { ask("name"); }, 350);
    return () => clearTimeout(t);
  }, [open, phase, ask]);

  function pushUser(text) { setMessages((m) => [...m, { role: "user", content: text }]); }
  function assistantSay(text, delay = 220) {
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", content: text }]);
      setTyping(false);
    }, delay);
  }

  const ask = useCallback((which) => {
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
  }, []);

  function yesLike(v) { return /^(y|yes|ok|okay|sure|please|go ahead)/i.test(v.trim()); }
  function noLike(v) { return /^(n|no|stop|don’t|dont|nope)/i.test(v.trim()); }

  async function submitLead(finalSlots) {
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
    if (val < 15000) return "£10k–£15k";
    if (val < 20000) return "£15k–£20k";
    if (val < 30000) return "£20k–£30k";
    if (val < 40000) return "£30k–£40k";
    if (val < 50000) return "£40k–£50k";
    return "£50k+";
  }

  const chips = useMemo(() => {
    if (phase === "consent1" || phase === "consent2" || phase === "confirm") return ["Yes", "No"];
    if (phase === "callback") return ["Today", "Tomorrow", "Morning", "Evening"];
    if (phase === "debt") return ["£5k", "£12k", "£25k", "£50k"];
    if (phase === "postcode") return ["Skip"];
    return [];
  }, [phase]);

  async function handleTextFlow(text) {
    if (phase === "idle") { ask("name"); return; }

    if (phase === "name") {
      if (!validateFullName(text)) { assistantSay("Please enter your full name (first and last).", 0 ); return; }
      setSlots((s) => ({ ...s, fullName: text }));
      ask("email");
      return;
    }
    if (phase === "email") {
      if (!validateEmail(text)) { assistantSay("That email doesn’t look right — e.g., name@example.com. Could you check it?", 0 ); return; }
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
      pendingSlotsRef.current = s;
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
      <button onClick={() => setOpen((o) => !o)} className="btn-cta chat-fab shadow-lg" aria-label="Open chat">{open ? "Close chat" : "Live chat"}</button>
    </div>
  );
}
