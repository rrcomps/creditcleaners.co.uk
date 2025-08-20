import React, { useEffect, useRef, useState } from "react";
import {
  validateEmail,
  validateUKMobile,
  validatePostcode,
  validateFullName,
} from "./validation";
import styles from "./ChatWidget.module.css";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I’m the Credit Cleaners assistant. We’re an introducer (not a debt advice firm). I can take a few details and book a call with an FCA‑authorised adviser. Free help: MoneyHelper. Shall we start?",
    },
  ]);
  const [input, setInput] = useState("");
  const [slots, setSlots] = useState({
    fullName: "",
    email: "",
    phone: "",
    postcode: "",
    debtBand: "",
    consentContact: null as null | boolean,
    consentPrivacy: null as null | boolean,
    preferredTime: "",
  });
  const [phase, setPhase] = useState("idle");
  const [typing, setTyping] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const pendingSlotsRef = useRef<any>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      try {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      } catch {
        el.scrollTop = el.scrollHeight;
      }
    });
  }, [messages, typing, open]);

  useEffect(() => {
    try {
      if (!localStorage.getItem("chatNudged")) {
        const t = setTimeout(() => {
          setOpen(true);
          localStorage.setItem("chatNudged", "1");
        }, 1200);
        return () => clearTimeout(t);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!open || phase !== "idle") return;
    const t = setTimeout(() => {
      ask("name");
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase]);

  function pushUser(text: string) {
    setMessages((m) => [...m, { role: "user", content: text }]);
  }
  function assistantSay(text: string, delay = 220) {
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", content: text }]);
      setTyping(false);
    }, delay);
  }

  function ask(which: string) {
    const prompts: Record<string, string> = {
      name: "What’s your full name?",
      email: "Thanks. What’s the best email for a callback link?",
      phone: "Got it. What’s your UK mobile? (07… or +44 7…)",
      postcode: "Postcode? (optional, helps us route to the nearest adviser)",
      debt: "Roughly how much unsecured debt? e.g., £5k, £12k. (An estimate is fine)",
      consent1:
        "Can we contact you by phone/SMS/email about your enquiry and introduce you to an FCA‑authorised firm? (yes/no)",
      consent2: "Do you accept our Privacy Notice? (yes/no)",
      callback:
        "When’s best for the adviser to call? e.g., “today after 6pm” or “weekday mornings”",
    };
    setPhase(which);
    assistantSay(prompts[which], 260);
  }

  function yesLike(v: string) {
    return /^(y|yes|ok|okay|sure|please|go ahead)/i.test(v.trim());
  }
  function noLike(v: string) {
    return /^(n|no|stop|don’t|dont|nope)/i.test(v.trim());
  }

  async function submitLead(finalSlots: any) {
    if (!validateFullName(finalSlots.fullName)) {
      assistantSay(
        "Let’s correct your name — please type your full name (first and last).",
        0
      );
      setPhase("name");
      return;
    }
    if (!validateEmail(finalSlots.email)) {
      assistantSay(
        "That email still looks off (e.g., name@example.com). What’s the best email?",
        0
      );
      setPhase("email");
      return;
    }
    if (!validateUKMobile(finalSlots.phone)) {
      assistantSay(
        "That doesn’t look like a UK mobile. Use 07… or +44 7…",
        0
      );
      setPhase("phone");
      return;
    }
    if (finalSlots.postcode && !validatePostcode(finalSlots.postcode)) {
      assistantSay("Postcode format looks off (e.g., M1 1AA).", 0);
      setPhase("postcode");
      return;
    }

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
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Lead API error");
      assistantSay(
        "Thanks! We’ve submitted your details. An FCA‑authorised adviser will call at your chosen time. You’re under no obligation.",
        240
      );
      setPhase("done");
    } catch (e) {
      console.warn(e);
      assistantSay(
        "I couldn’t reach our server just now, but I’ve saved your details and a human will follow up shortly. If urgent, call us 9–5.",
        240
      );
      setPhase("done");
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    pushUser(text);
    setInput("");
    if (phase === "idle") {
      assistantSay("Please open the chat again to start.");
      return;
    }
    if (phase === "name") {
      setSlots((s) => ({ ...s, fullName: text }));
      ask("email");
    } else if (phase === "email") {
      setSlots((s) => ({ ...s, email: text }));
      ask("phone");
    } else if (phase === "phone") {
      setSlots((s) => ({ ...s, phone: text }));
      ask("postcode");
    } else if (phase === "postcode") {
      setSlots((s) => ({ ...s, postcode: text }));
      ask("debt");
    } else if (phase === "debt") {
      setSlots((s) => ({ ...s, debtBand: text }));
      ask("consent1");
    } else if (phase === "consent1") {
      const yes = yesLike(text);
      const no = noLike(text);
      if (!yes && !no) {
        assistantSay("Please answer yes or no");
        return;
      }
      setSlots((s) => ({ ...s, consentContact: yes }));
      if (!yes) {
        assistantSay("Okay, we won't contact you. Conversation ended.");
        setPhase("idle");
        return;
      }
      ask("consent2");
    } else if (phase === "consent2") {
      const yes = yesLike(text);
      const no = noLike(text);
      if (!yes && !no) {
        assistantSay("Please answer yes or no");
        return;
      }
      setSlots((s) => ({ ...s, consentPrivacy: yes }));
      if (!yes) {
        assistantSay("We need privacy consent to continue. Conversation ended.");
        setPhase("idle");
        return;
      }
      ask("callback");
    } else if (phase === "callback") {
      const finalSlots = { ...slots, preferredTime: text };
      setSlots(finalSlots);
      submitLead(finalSlots);
    } else {
      assistantSay("Thanks for the message!");
    }
  }

  return (
    <div className={`fixed right-4 ${styles.chatDock} z-40`}>
      {open && (
        <div className="glass-card rounded-2xl p-4 w-80 sm:w-96">
          <div
            ref={listRef}
            className={`space-y-2 h-64 overflow-y-auto ${styles.chatScroll} ${styles.noScrollbar}`}
          >
            {messages.map((m, i) => (
              <div key={i} className={`text-sm ${m.role === "user" ? "text-right" : ""}`}>
                <span
                  className={`inline-block px-3 py-2 rounded-xl ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200"
                  }`}
                >
                  {m.content}
                </span>
              </div>
            ))}
            {typing && <div className="text-sm text-slate-500">Typing…</div>}
          </div>
          <form onSubmit={handleSend} className="mt-2 flex gap-2">
            <input
              className="flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Type here…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button className="btn-cta text-sm px-3" type="submit">
              Send
            </button>
          </form>
          <p className="mt-2 text-[11px] text-slate-500">
            We’re an introducer (not a debt advice firm). Free help: MoneyHelper.
          </p>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`btn-cta ${styles.chatFab} shadow-lg`}
        aria-label="Open chat"
      >
        {open ? "Close chat" : "Live chat"}
      </button>
    </div>
  );
}
