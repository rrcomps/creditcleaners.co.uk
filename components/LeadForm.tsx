import React, { useMemo, useState, forwardRef } from "react";
import {
  CheckCircle2,
  ShieldCheck,
  Lock,
  Award,
  ArrowRight,
  AlertTriangle,
  Info,
} from "./Icons";
import {
  validateEmail,
  validateUKMobile,
  validatePostcode,
  validateFullName,
} from "./validation";

interface LeadFormProps {
  isSingle: boolean;
  ctaText: string;
}

const LeadForm = forwardRef<HTMLDivElement, LeadFormProps>(function LeadForm(
  { isSingle, ctaText },
  ref
) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    postcode: "",
    debtAmount: 5000,
    debtTypes: [] as string[],
    consentContact: false,
    consentPrivacy: false,
    honey: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    phone: false,
    postcode: false,
  });
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const errors = useMemo(
    () => ({
      fullName: validateFullName(form.fullName)
        ? ""
        : "Please enter your full name",
      email: validateEmail(form.email) ? "" : "Enter a valid email address",
      phone: validateUKMobile(form.phone)
        ? ""
        : "Enter a valid UK mobile (07… or +44 7…)",
      postcode:
        form.postcode && !validatePostcode(form.postcode)
          ? "Enter a valid UK postcode (e.g., M1 1AA)"
          : "",
    }),
    [form]
  );

  const step1Valid = useMemo(
    () => !errors.fullName && !errors.email && !errors.phone,
    [errors]
  );
  const finalValidSingle = useMemo(
    () =>
      step1Valid && form.consentContact && form.consentPrivacy,
    [step1Valid, form.consentContact, form.consentPrivacy]
  );

  function toggleDebtType(type: string) {
    setForm((f) => ({
      ...f,
      debtTypes: f.debtTypes.includes(type)
        ? f.debtTypes.filter((t) => t !== type)
        : [...f.debtTypes, type],
    }));
  }

  function update(key: string, value: any) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAttemptedSubmit(true);
    if (form.honey) return;

    if (isSingle) {
      if (!finalValidSingle) return;
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
      const payload = {
        source: "form",
        timestamp: new Date().toISOString(),
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        postcode: form.postcode,
        debtAmount: form.debtAmount,
        debtTypes: form.debtTypes,
        consentContact: form.consentContact,
        consentPrivacy: form.consentPrivacy,
      };
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Lead API error");
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError(
        "Something went wrong sending your details. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      id="form"
      ref={ref}
      className="glass-card glass-morph rounded-2xl p-4 sm:p-6"
    >
      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              See if you <span className="hl">qualify</span>
            </h2>
            {!isSingle && (
              <div className="text-xs text-slate-500">Step {step} of 2</div>
            )}
          </div>

          {error && (
            <div
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700 flex gap-2"
              role="alert"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4" /> {error}
            </div>
          )}

          <input
            type="text"
            className="hidden"
            value={form.honey}
            onChange={(e) => update("honey", e.target.value)}
            tabIndex={-1}
            aria-hidden="true"
          />

          {(isSingle || step === 1) && (
            <>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium">
                  Full name
                </label>
                <input
                  id="fullName"
                  className={`mt-1 w-full rounded-xl border-2 px-3 py-2 focus:outline-none ${
                    (touched.fullName || attemptedSubmit) && errors.fullName
                      ? "border-red-500 focus:ring-2 focus:ring-red-200"
                      : "border-slate-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  }`}
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  onBlur={() =>
                    setTouched((t) => ({ ...t, fullName: true }))
                  }
                  aria-invalid={!!(
                    (touched.fullName || attemptedSubmit) && errors.fullName
                  )}
                  aria-describedby="name-error"
                  required
                />
                {(touched.fullName || attemptedSubmit) && errors.fullName && (
                  <p
                    id="name-error"
                    className="mt-1 text-xs text-red-600"
                    role="alert"
                  >
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`mt-1 w-full rounded-xl border-2 px-3 py-2 focus:outline-none ${
                      (touched.email || attemptedSubmit) && errors.email
                        ? "border-red-500 focus:ring-2 focus:ring-red-200"
                        : "border-slate-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    }`}
                    placeholder="you@email.com"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    onBlur={() =>
                      setTouched((t) => ({ ...t, email: true }))
                    }
                    aria-invalid={!!(
                      (touched.email || attemptedSubmit) && errors.email
                    )}
                    aria-describedby="email-error"
                    required
                  />
                  {(touched.email || attemptedSubmit) && errors.email && (
                    <p
                      id="email-error"
                      className="mt-1 text-xs text-red-600"
                      role="alert"
                    >
                      {errors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium">
                    Phone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    className={`mt-1 w-full rounded-xl border-2 px-3 py-2 focus:outline-none ${
                      (touched.phone || attemptedSubmit) && errors.phone
                        ? "border-red-500 focus:ring-2 focus:ring-red-200"
                        : "border-slate-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    }`}
                    placeholder="07… or +44 7…"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    onBlur={() =>
                      setTouched((t) => ({ ...t, phone: true }))
                    }
                    aria-invalid={!!(
                      (touched.phone || attemptedSubmit) && errors.phone
                    )}
                    aria-describedby="phone-error"
                    required
                  />
                  {(touched.phone || attemptedSubmit) && errors.phone && (
                    <p
                      id="phone-error"
                      className="mt-1 text-xs text-red-600"
                      role="alert"
                    >
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {(isSingle || step === 2) && (
            <>
              <div>
                <label className="block text-sm font-medium">
                  Approx. unsecured debt
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="range"
                    min={1000}
                    max={30000}
                    step={500}
                    value={form.debtAmount}
                    onChange={(e) =>
                      update("debtAmount", Number(e.target.value))
                    }
                    className="w-full accent-blue-600"
                  />
                  <div className="w-28 text-right font-semibold">
                    £{form.debtAmount.toLocaleString()}
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Typical partner minimum is around £5,000.
                </p>
              </div>

              <div>
                <span className="block text-sm font-medium">
                  Debt types (select all that apply)
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  {["Credit cards", "Loans", "Store cards", "Overdraft", "Catalogues", "Utility arrears"].map((t) => (
                    <label
                      key={t}
                      className={`flex items-center gap-2 rounded-xl border p-2 ${
                        form.debtTypes.includes(t)
                          ? "bg-teal-50 border-teal-300"
                          : "bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.debtTypes.includes(t)}
                        onChange={() => toggleDebtType(t)}
                      />
                      {t}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.consentContact}
                    onChange={(e) => update("consentContact", e.target.checked)}
                  />
                  <span>
                    I agree that you may contact me by phone, SMS, or email to
                    discuss my enquiry and introduce me to an FCA‑authorised
                    debt advice firm.
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.consentPrivacy}
                    onChange={(e) => update("consentPrivacy", e.target.checked)}
                  />
                  <span>
                    I have read and accept the <a href="#privacy" className="hlu">Privacy Notice</a> and understand that free and impartial debt help is available at <a className="hlu" href="https://www.moneyhelper.org.uk/en" target="_blank" rel="noreferrer">MoneyHelper</a>.
                  </span>
                </label>
              </div>
            </>
          )}

          {!isSingle && step === 1 && (
            <>
              <button
                type="submit"
                disabled={!step1Valid}
                className="btn-cta w-full"
              >
                Continue
              </button>
              <div className="trust-row text-xs text-slate-600">
                <div>
                  <Lock className="h-3.5 w-3.5" /> <span>Data <span className="hl">secure</span></span>
                </div>
                <div>
                  <ShieldCheck className="h-3.5 w-3.5" /> <span>We introduce <span className="hl">you</span> to <span className="hl">FCA‑authorised</span> advisers</span>
                </div>
                <div>
                  <Award className="h-3.5 w-3.5" /> <span>UK‑based</span>
                </div>
              </div>
            </>
          )}

          {(isSingle || step === 2) && (
            <div className="flex items-center justify-between gap-3">
              {!isSingle && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-ghost"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={
                  submitting ||
                  (isSingle
                    ? !finalValidSingle
                    : !(form.consentContact && form.consentPrivacy))
                }
                className="group inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold shadow-sm btn-cta"
                aria-disabled={
                  isSingle
                    ? !finalValidSingle
                    : !(form.consentContact && form.consentPrivacy)
                }
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
          <h3 className="text-2xl font-semibold">
            Thanks, {form.fullName.split(" ")[0] || "there"}!
          </h3>
          <p className="mt-2 text-slate-600">
            We’ve received your details. An FCA‑authorised advisor will be in
            touch shortly to talk through your options.
          </p>
          <a
            href="https://www.moneyhelper.org.uk/en"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm hover:bg-teal-50"
          >
            <Info className="h-4 w-4" /> Learn about free debt help (MoneyHelper)
          </a>
        </div>
      )}
    </div>
  );
});

export default LeadForm;
