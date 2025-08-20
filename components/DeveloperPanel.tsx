import React from "react";

const CALL_HOURS = { start: 9, end: 17, tz: "Europe/London" };

export default function DeveloperPanel() {
  return (
    <details className="mx-auto mt-10 max-w-6xl px-4 pb-16 text-sm text-slate-600">
      <summary className="cursor-pointer select-none">
        Developer setup: /api endpoints + Twilio voice (Polly, 9–5 UK)
      </summary>
      <div className="mt-4 space-y-6">
        <div>
          <p className="font-semibold">
            1) Next.js App Router — <code>app/api/lead/route.ts</code>
          </p>
          <pre className="whitespace-pre-wrap rounded-xl border p-4 bg-white/70">{`import { NextResponse } from 'next/server';
export async function POST(req: Request) {
  const body = await req.json();
  // TODO: validate + store body, then fan-out to buyers (webhook/email)
  console.log('LEAD', body);
  return NextResponse.json({ ok: true });
}`}</pre>
        </div>
        <div>
          <p className="font-semibold">
            2) Next.js App Router — <code>app/api/chat/route.ts</code> (server LLM optional)
          </p>
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
          <p className="font-semibold">
            3) Twilio Voice — webhook (Express) with business hours + Polly voice
          </p>
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
    g.say({ voice: 'Polly.Amy' }, 'Hi, you\\'ve reached Credit Cleaners. We are an introducer, not a debt advice firm. I can take a few details and arrange a call with an FCA authorised adviser. Say okay to begin or agent to speak to a person.');
  }
  res.type('text/xml').send(vr.toString());
});
app.post('/route', (req, res) => {
  // TODO: attach Media Streams or gather more details then POST to /api/lead
});
app.listen(3001);`}</pre>
          <p className="mt-2">
            Buy a Twilio number → set Voice webhook to your server’s <code>/voice</code>. For real conversational AI, attach
            <strong>Media Streams</strong> and stream audio to your bot server; use <strong>Polly Neural</strong> or ElevenLabs for
            TTS.
          </p>
        </div>
      </div>
    </details>
  );
}
