// cognis.group platform worker — forms, double opt-in, lead log, AI concierge,
// and lead-enrichment workflow. All email via Cloudflare Email Sending; all
// storage in D1 (cognis-leads).
//
// Routes (cognis.group/api/*):
//   POST /api/form     — contact + newsletter submissions (HTML form posts)
//   GET  /api/confirm  — newsletter double-opt-in confirmation link
//   POST /api/ask      — "Ask Cognis" site concierge (JSON: question, history, page, sid)
//   POST /api/ask/handoff — visitor leaves an email from the chat; becomes a lead
//   cron  Monday 07:00 UTC — weekly Ask Cognis digest to the team

import { WorkflowEntrypoint } from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";

const TO = "info@cognis.group";
const FROM_FORMS = { email: "forms@cognis.group", name: "Cognis Group Website" };
const FROM_NOREPLY = { email: "noreply@cognis.group", name: "Cognis Group" };
const FALLBACK_REDIRECT = "https://cognis.group/thanks/";
const CONFIRM_LANDING = "https://cognis.group/thanks-subscribe/";
const CHECK_INBOX = "https://cognis.group/confirm-subscription/";
const TURNSTILE_VERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const ASK_MAX_HISTORY = 8;
const HANDOFF_INTENT = /\b(human|person|someone|real people|an agent|call me|phone|speak (?:to|with)|talk (?:to|with)|meeting|book|schedule|quote|quotation|proposal|pricing|price|cost|how much|budget|demo|urgent|complain|complaint)\b/i;
const FREE_MAIL = new Set(["gmail.com","yahoo.com","outlook.com","hotmail.com","icloud.com","aol.com","proton.me","protonmail.com","live.com","msn.com","yandex.com","mail.com","gmx.com"]);

// Compact fact sheet — fallback context for /api/ask until AI Search indexing is live.
const FACTS = `Cognis Group helps organisations use AI to improve everyday work: we set strategy, train teams, and build safe AI tools. Founded in 2024, registered in Lagos, Nigeria, with offices in Cheyenne (USA), Ontario (Canada), and Oniru, Victoria Island, Lagos (Nigeria). Motto: Quod Tango Muto — what we touch, we change. Three practices: AI Strategy & Advisory (readiness assessment, use cases, executable roadmaps), AI Training & Workforce Development (AI literacy from executives to operators), and AI Agent & Automation Engineering (custom agents and automation deployed to production). Cognis builds and runs four products: Cognis AI (AI workforce, cognis.group/products), MarketSage (autonomous marketing and sales intelligence, marketsage.africa), Migratio (data migration and reconciliation for banks and regulated enterprises, migratio.cognis.group), and SPOG (single pane of glass enterprise observability, spog.cognis.group). Clients include banks, ministries, and enterprises across Africa, Europe, and the Americas. Governance expertise: NDPA, EU AI Act, ISO 42001, NIST AI RMF. Contact: info@cognis.group, +1 (512) 743-7322 (US), +2349080001101 (NG). Site sections: /our-services/, /products/, /case-studies/, /how-we-work/, /why-cognis/, /faq/, /careers/, /contact/.`;

function safeRedirect(url) {
  try {
    const u = new URL(url);
    if (u.protocol === "https:" && (u.hostname === "cognis.group" || u.hostname.endsWith(".cognis.group"))) return u.toString();
  } catch (e) {}
  return FALLBACK_REDIRECT;
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// The one system prompt for Ask Cognis. Every fact here is on the website.
const ASK_SYSTEM = `You are Ask Cognis, the AI assistant on cognis.group. You speak for Cognis Group ("we", "our"): warm, plain-spoken, confident, brief. Answer from the website content you are given plus the facts below.

VERIFIED FACTS: Cognis Group Limited was founded in 2024 by Supreme Oyewumi and Kola Olatunde and is registered in Nigeria; offices in Cheyenne (USA), Ontario (Canada) and Oniru, Victoria Island, Lagos (Nigeria). Email info@cognis.group; phones +1 (512) 743-7322 (US) and +234 908 000 1101 (Nigeria). Three practices: AI strategy and advisory; AI training and workforce development; AI agent and automation engineering. Products we build and run: Cognis AI (ready-made AI workers for support, sales and operations; demos on request, not self-serve), MarketSage (marketing and sales AI, marketsage.africa), Migratio (safe data migration and checking for banks and regulated companies), SPOG (one dashboard for everything happening across a company's systems). How engagements work: fixed-fee, agreed up front; the first conversation is free and confidential; a senior team member replies within two business days.

RULES:
1. Answer the actual question in your first sentence. Under 90 words. Everyday words, no jargon. Lists only if the visitor asks for options.
2. Only state what the website content or the facts above support. Never invent prices, timelines, client names, team size, certifications or partnerships. Never call us "leading", "best" or "number one", and never rank us against other firms.
3. If you cannot answer a genuine business question from what you have, say so plainly and offer the team: "I can have a senior team member reply within two business days — leave your email below."
4. If the visitor asks for a person, a call, a meeting, a quote, a proposal, a demo, or pricing beyond what the website states, do not stall: say you will connect them with the team and invite them to leave their email below.
5. If asked whether they are talking to a bot or an AI: say yes, you are Cognis Group's AI assistant answering from our website, and offer a person.
6. Never mention documents, sources, search results or "according to". Never paste URLs; the chat shows links itself.
7. Greetings and small talk: reply briefly and warmly, then offer help. Nonsense: ask what they would like to know about us. Requests unrelated to our business, or harmful: decline in one sentence and steer back to how we can help with AI.
8. Trust questions ("is this a scam?"): stay calm; point to what can be checked (a registered company, named founders, public offices, products people can try) and invite them to talk to us directly.
9. Reply in the visitor's language when they write in one other than English; for Nigerian Pidgin reply in simple English. For yes/no questions open with a plain yes or no, then explain.`;

// ---------- Lead enrichment workflow ----------
export class LeadEnrichment extends WorkflowEntrypoint {
  async run(event, step) {
    const { leadId, name, email, message, page } = event.payload;
    const domain = (email.split("@")[1] || "").toLowerCase();
    const isCompany = domain && !FREE_MAIL.has(domain);

    let siteText = "";
    if (isCompany) {
      siteText = await step.do("fetch company site", { retries: { limit: 2, delay: "10 seconds", backoff: "exponential" }, timeout: "1 minute" }, async () => {
        try {
          const r = await fetch(`https://${domain}`, { headers: { "user-agent": "Mozilla/5.0 (compatible; CognisLeadBot/1.0)" }, redirect: "follow" });
          if (!r.ok) return "";
          const html = await r.text();
          return html
            .replace(/<script[\s\S]*?<\/script>/gi, " ")
            .replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .slice(0, 20000);
        } catch (e) { return ""; }
      });
    }

    const briefing = await step.do("ai briefing", { retries: { limit: 2, delay: "15 seconds", backoff: "exponential" }, timeout: "2 minutes" }, async () => {
      const result = await this.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        messages: [
          { role: "system", content: "You prepare concise sales lead briefings for Cognis Group, an AI consulting firm (strategy, training, agent engineering) serving banks, ministries, and enterprises. Be factual; if information is thin, say so rather than inventing." },
          { role: "user", content: `New inbound lead.\nName: ${name}\nEmail: ${email}\nEmail domain: ${domain}${isCompany ? "" : " (personal email provider)"}\nSubmitted from page: ${page || "unknown"}\nTheir message:\n${message}\n\n${siteText ? "Their company website content (scraped):\n" + siteText : "No company website content available."}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            type: "object",
            properties: {
              company: { type: "string" },
              what_they_do: { type: "string" },
              likely_need: { type: "string" },
              talking_points: { type: "array", items: { type: "string" } },
              fit_score: { type: "number" },
            },
            required: ["what_they_do", "likely_need", "talking_points", "fit_score"],
          },
        },
        max_tokens: 800,
      });
      return result.response;
    });

    await step.do("store briefing", async () => {
      await this.env.DB.prepare("UPDATE leads SET briefing = ?1 WHERE id = ?2")
        .bind(JSON.stringify(briefing), leadId).run();
      return true;
    });

    await step.do("email briefing", { retries: { limit: 3, delay: "30 seconds", backoff: "exponential" }, timeout: "1 minute" }, async () => {
      const b = briefing || {};
      const points = (b.talking_points || []).map((p) => `  • ${p}`).join("\n");
      const text = [
        `Lead briefing for: ${name} <${email}>`,
        b.company ? `Company: ${b.company}` : `Domain: ${domain || "n/a"}`,
        ``,
        `What they do: ${b.what_they_do || "unknown"}`,
        `Likely need: ${b.likely_need || "unknown"}`,
        `Fit score: ${b.fit_score != null ? b.fit_score + "/10" : "n/a"}`,
        ``,
        `Talking points:`,
        points || "  (none)",
        ``,
        `Their message:`,
        message,
        ``,
        `Lead #${leadId} · stored in cognis-leads (D1)`,
      ].join("\n");
      await this.env.EMAIL.send({
        to: TO,
        from: FROM_FORMS,
        replyTo: email,
        subject: `Lead briefing: ${name}${b.company ? " — " + b.company : ""}`,
        text,
      });
      return true;
    });
  }
}

// ---------- HTTP handlers ----------
async function handleForm(request, env, ctx) {
  let form;
  try { form = await request.formData(); } catch (e) { return new Response("Bad request", { status: 400 }); }
  const get = (k) => (form.get(k) || "").toString().trim();
  const redirect = safeRedirect(get("redirect"));

  if (get("company")) return Response.redirect(redirect, 303); // honeypot
  const ip = clientIp(request);
  if (await limited(env.FORM_RL, "form:" + ip)) {
    return new Response("Too many submissions from your connection. Please wait a minute and try again, or email info@cognis.group.", { status: 429 });
  }

  const email = get("email");
  const name = get("name") || get("full_name");
  const message = get("message");
  const page = request.headers.get("referer") || "";
  if (!email || !email.includes("@") || email.length > 320) {
    return new Response("A valid email address is required.", { status: 400 });
  }

  if (message) {
    // ---- Contact / inquiry ----
    const ts = await verifyTurnstile(env, get("cf-turnstile-response"), ip);
    if (!ts.ok) {
      console.log(JSON.stringify({ event: "form-blocked", codes: ts.codes || [] }));
      return new Response(BLOCKED_HTML, { status: 403, headers: { "content-type": "text/html;charset=utf-8" } });
    }
    const res = await env.DB.prepare(
      "INSERT INTO leads (type, name, email, message, page) VALUES ('contact', ?1, ?2, ?3, ?4)"
    ).bind(name || null, email, message, page || null).run();
    const leadId = res.meta.last_row_id;

    try {
      await env.EMAIL.send({
        to: TO,
        from: FROM_FORMS,
        replyTo: email,
        subject: (get("subject") || "New contact form submission — cognis.group").slice(0, 200),
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n\nPage: ${page || "unknown"}\nLead #${leadId}`,
      });
    } catch (e) {
      // The lead is already stored. Mark it for the hourly retry and let the
      // visitor through — a sending-quota blip must never look like a broken form.
      console.log("notify send failed:", e && e.code, e && e.message);
      ctx.waitUntil(env.DB.prepare("UPDATE leads SET notified = 0 WHERE id = ?1").bind(leadId).run().catch(() => {}));
      return Response.redirect(redirect, 303);
    }

    ctx.waitUntil((async () => {
      try {
        await env.EMAIL.send({
          to: email,
          from: FROM_NOREPLY,
          replyTo: TO,
          subject: "We received your message — Cognis Group",
          text: `Hello${name ? " " + name : ""},\n\nThank you for reaching out to Cognis Group. Your message is with the team and we reply within one business day.\n\nFor anything urgent, write to info@cognis.group or call +1 (512) 743-7322 (US) or +234 908 000 1101 (NG).\n\nYour message:\n"${message}"\n\nQuod Tango Muto: what we touch, we change.\nCognis Group · cognis.group`,
          html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#131313;line-height:1.6"><p>Hello${esc(name ? " " + name : "")},</p><p>Thank you for reaching out to Cognis Group. Your message is with the team and <strong>we reply within one business day</strong>.</p><p>For anything urgent, write to <a href="mailto:info@cognis.group">info@cognis.group</a> or call +1 (512) 743-7322 (US) or +234 908 000 1101 (NG).</p><p style="color:#5F5F5C;border-left:3px solid #D6FD70;padding-left:12px">${esc(message)}</p><p style="color:#8A8A86;font-size:12px"><em>Quod Tango Muto</em>: what we touch, we change.<br>Cognis Group &middot; <a href="https://cognis.group">cognis.group</a></p></div>`,
        });
      } catch (e) { console.log("auto-reply failed:", e && e.code); }
      try {
        await env.FORM_WORKFLOW.create({ id: `lead-${leadId}`, params: { leadId, name, email, message, page } });
      } catch (e) { console.log("workflow create failed:", e && e.message); }
    })());

    return Response.redirect(redirect, 303);
  }

  // ---- Newsletter (double opt-in) ----
  const existing = await env.DB.prepare("SELECT id, token, confirmed FROM subscribers WHERE email = ?1").bind(email).first();
  if (existing && existing.confirmed) return Response.redirect(CONFIRM_LANDING, 303);

  const token = existing ? existing.token : crypto.randomUUID();
  if (!existing) {
    await env.DB.prepare("INSERT INTO subscribers (email, token) VALUES (?1, ?2)").bind(email, token).run();
  }
  const link = `https://cognis.group/api/confirm?token=${token}`;
  try {
    await env.EMAIL.send({
      to: email,
      from: FROM_NOREPLY,
      replyTo: TO,
      subject: "Confirm your subscription — Cognis Group",
      text: `Hello,\n\nConfirm your subscription to Cognis Group intelligence: field notes on AI strategy, agent engineering, and governance.\n\nConfirm here: ${link}\n\nIf you did not request this, ignore this email and nothing will be sent.\n\nCognis Group · cognis.group`,
      html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#131313;line-height:1.6"><p>Hello,</p><p>Confirm your subscription to Cognis Group intelligence: field notes on AI strategy, agent engineering, and governance.</p><p><a href="${link}" style="display:inline-block;background:#131313;color:#D6FD70;border-radius:100px;padding:12px 22px;text-decoration:none;font-weight:600">Confirm subscription</a></p><p style="color:#8A8A86;font-size:12px">If you did not request this, ignore this email and nothing will be sent.<br>Cognis Group &middot; <a href="https://cognis.group">cognis.group</a></p></div>`,
    });
  } catch (e) {
    console.log("confirm send failed:", e && e.code, e && e.message);
    return new Response("We could not send the confirmation email. Please try again or write to info@cognis.group.", { status: 502 });
  }
  return Response.redirect(CHECK_INBOX, 303);
}

async function handleConfirm(request, env, ctx) {
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!/^[0-9a-f-]{36}$/.test(token)) return Response.redirect("https://cognis.group/", 302);
  const row = await env.DB.prepare("SELECT id, email, confirmed FROM subscribers WHERE token = ?1").bind(token).first();
  if (!row) return Response.redirect("https://cognis.group/", 302);
  if (!row.confirmed) {
    await env.DB.prepare("UPDATE subscribers SET confirmed = 1, confirmed_at = datetime('now') WHERE id = ?1").bind(row.id).run();
    ctx.waitUntil(env.EMAIL.send({
      to: TO,
      from: FROM_FORMS,
      subject: "New confirmed subscriber — cognis.group",
      text: `${row.email} confirmed their newsletter subscription.`,
    }).catch((e) => console.log("subscriber notify failed:", e && e.code)));
  }
  return Response.redirect(CONFIRM_LANDING, 303);
}


// ---------- Shared helpers ----------
function clientIp(request) { return request.headers.get("cf-connecting-ip") || "0.0.0.0"; }

async function ipHash(ip) {
  const day = new Date().toISOString().slice(0, 10);
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip + "|" + day));
  return [...new Uint8Array(buf)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Rate Limiting binding: permissive by design; a failure never blocks a visitor.
async function limited(binding, key) {
  if (!binding) return false;
  try { const { success } = await binding.limit({ key }); return !success; } catch (e) { console.log("ratelimit error:", e && e.message); return false; }
}

async function verifyTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return { ok: true, skipped: true };
  if (!token) return { ok: false, codes: ["missing-input-response"] };
  const fd = new FormData();
  fd.append("secret", env.TURNSTILE_SECRET);
  fd.append("response", String(token).slice(0, 2048));
  if (ip) fd.append("remoteip", ip);
  try {
    const r = await fetch(TURNSTILE_VERIFY, { method: "POST", body: fd });
    const j = await r.json();
    return { ok: !!j.success, codes: j["error-codes"] || [] };
  } catch (e) { return { ok: false, codes: ["verify-failed"] }; }
}

const BLOCKED_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Please try again — Cognis Group</title></head><body style="margin:0;background:#f2f2f2;color:#131313;font-family:'Plus Jakarta Sans',Inter,system-ui,sans-serif"><main style="max-width:560px;margin:12vh auto;padding:40px;background:#fff;border-radius:20px"><h1 style="font-size:24px;margin:0 0 12px">We couldn't confirm that was a person.</h1><p style="line-height:1.6">Please go back and complete the check under the form, then send again. If it keeps happening, email us at <a href="mailto:info@cognis.group" style="color:#131313">info@cognis.group</a>.</p><p><a href="https://cognis.group/contact/" style="color:#131313">← Back to the contact form</a></p></main></body></html>`;

// ---------- Ask Cognis ----------
// The Rate Limiting binding proved permissive in testing, so the real guard is a
// D1 count of this visitor's questions in the last minute (ip_hash is salted daily).
async function askQuotaExceeded(env, hash, limit) {
  try {
    const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM asks WHERE ip_hash = ?1 AND created_at >= datetime('now', '-60 seconds')").bind(hash).first();
    return row && row.n >= limit;
  } catch (e) { console.log("quota check failed:", e && e.message); return false; }
}

async function handleAsk(request, env, ctx) {
  const ip = clientIp(request);
  const hash = await ipHash(ip);
  if (await limited(env.ASK_RL, "ask:" + ip) || await askQuotaExceeded(env, hash, 20)) {
    return Response.json({ answer: "You're sending questions faster than I can read them. Give me a moment and try again, or write to info@cognis.group.", sources: [], escalate: false, limited: true }, { status: 429 });
  }
  let body;
  try { body = await request.json(); } catch (e) { return Response.json({ error: "bad request" }, { status: 400 }); }
  const question = String((body && body.question) || "").trim().slice(0, 500);
  if (!question) return Response.json({ error: "empty question" }, { status: 400 });
  const history = (Array.isArray(body && body.history) ? body.history : [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-ASK_MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));
  const page = String((body && body.page) || "").slice(0, 300);
  const sid = String((body && body.sid) || "").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64);

  const started = Date.now();
  let answer = "", sources = [], path = "ai-search";
  const model = env.ASK_MODEL || "instance-default";
  try {
    if (env.SITE_SEARCH) {
      const req = {
        messages: [{ role: "system", content: ASK_SYSTEM }, ...history, { role: "user", content: question }],
        ai_search_options: { retrieval: { max_num_results: 6 }, query_rewrite: { enabled: true } },
      };
      if (env.ASK_MODEL) req.model = env.ASK_MODEL;
      const r = await env.SITE_SEARCH.chatCompletions(req);
      answer = ((r && r.choices && r.choices[0] && r.choices[0].message && r.choices[0].message.content) || "").trim();
      sources = [...new Set(((r && r.chunks) || []).map((c) => c.item && c.item.key).filter(Boolean))].slice(0, 3);
    }
    if (!answer) {
      path = "fallback";
      const out = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        messages: [{ role: "system", content: ASK_SYSTEM + "\n\nADDITIONAL FACTS: " + FACTS }, ...history, { role: "user", content: question }],
        max_tokens: 400,
      }, { gateway: { id: "default", metadata: { source: "site-chat" } } });
      answer = ((out && (out.response || out.result)) || "").trim();
    }
  } catch (e) {
    console.log("ask failed:", e && e.message);
    path = "error";
  }
  const escalate = !answer || HANDOFF_INTENT.test(question) || /info@cognis\.group|leave your email|team can confirm|senior (?:team )?member/i.test(answer);
  if (!answer) answer = "I don't have a reliable answer to that yet. I can have a senior team member reply within two business days — leave your email below.";
  const latency = Date.now() - started;

  ctx.waitUntil((async () => {
    try {
      await env.DB.prepare("INSERT INTO asks (sid, page, question, answer, sources, model, path, latency_ms, escalated, ip_hash) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)")
        .bind(sid || null, page || null, question, answer, JSON.stringify(sources), model, path, latency, escalate ? 1 : 0, hash).run();
    } catch (e) { console.log("ask log failed:", e && e.message); }
  })());
  console.log(JSON.stringify({ event: "ask", path, latency, escalate, sid: sid || null }));
  return Response.json({ answer, sources, escalate });
}

// A visitor leaves their email from the chat: stored as a lead, sent to the
// team with the transcript, acknowledged to the visitor, and enriched.
async function handleHandoff(request, env, ctx) {
  const ip = clientIp(request);
  if (await limited(env.FORM_RL, "handoff:" + ip)) return Response.json({ ok: false, error: "Too many requests from your connection. Please wait a minute, or email info@cognis.group." }, { status: 429 });
  let body;
  try { body = await request.json(); } catch (e) { return Response.json({ ok: false, error: "bad request" }, { status: 400 }); }
  const email = String((body && body.email) || "").trim().slice(0, 320);
  const name = String((body && body.name) || "").trim().slice(0, 120);
  if (!email.includes("@") || email.length < 5) return Response.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
  const ts = await verifyTurnstile(env, (body && body.turnstile) || "", ip);
  if (!ts.ok) {
    console.log(JSON.stringify({ event: "handoff-blocked", codes: ts.codes || [] }));
    return Response.json({ ok: false, error: "We couldn't verify the request. Please try again, or email info@cognis.group." }, { status: 403 });
  }
  const transcript = (Array.isArray(body && body.transcript) ? body.transcript : [])
    .filter((m) => m && typeof m.content === "string").slice(-12)
    .map((m) => `${m.role === "user" ? "Visitor" : "Ask Cognis"}: ${m.content.slice(0, 1000)}`).join("\n");
  const question = String((body && body.question) || "").trim().slice(0, 500);
  const page = String((body && body.page) || request.headers.get("referer") || "").slice(0, 300);
  const sid = String((body && body.sid) || "").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64);
  const message = `Chat handoff request${question ? `\n\nLast question: ${question}` : ""}${transcript ? `\n\nTranscript:\n${transcript}` : ""}`;

  const res = await env.DB.prepare("INSERT INTO leads (type, name, email, message, page) VALUES ('chat', ?1, ?2, ?3, ?4)")
    .bind(name || null, email, message, page || null).run();
  const leadId = res.meta.last_row_id;
  try {
    await env.EMAIL.send({
      to: TO, from: FROM_FORMS, replyTo: email,
      subject: `Chat handoff: ${name || email}`,
      text: `A website visitor asked Ask Cognis to connect them with the team.\n\nName: ${name || "(not given)"}\nEmail: ${email}\nPage: ${page || "unknown"}\nChat session: ${sid || "n/a"}\n\n${message}\n\nLead #${leadId} · stored in cognis-leads (D1)`,
    });
  } catch (e) {
    console.log("handoff notify failed:", e && e.code, e && e.message);
    ctx.waitUntil(env.DB.prepare("UPDATE leads SET notified = 0 WHERE id = ?1").bind(leadId).run().catch(() => {}));
    if (sid) ctx.waitUntil(env.DB.prepare("UPDATE asks SET handed_off = 1 WHERE sid = ?1").bind(sid).run().catch(() => {}));
    return Response.json({ ok: true, queued: true });
  }
  ctx.waitUntil((async () => {
    try {
      await env.EMAIL.send({
        to: email, from: FROM_NOREPLY, replyTo: TO,
        subject: "We'll be in touch — Cognis Group",
        text: `Hello${name ? " " + name : ""},\n\nThanks for talking to us on cognis.group. A senior member of the team has your question and will reply within two business days.\n\n${question ? "Your question: " + question + "\n\n" : ""}For anything urgent, write to info@cognis.group.\n\nCognis Group`,
      });
    } catch (e) { console.log("handoff auto-reply failed:", e && e.code); }
    try { await env.FORM_WORKFLOW.create({ id: `lead-${leadId}`, params: { leadId, name, email, message, page } }); } catch (e) { console.log("workflow create failed:", e && e.message); }
    if (sid) { try { await env.DB.prepare("UPDATE asks SET handed_off = 1 WHERE sid = ?1").bind(sid).run(); } catch (e) {} }
  })());
  return Response.json({ ok: true });
}

// ---------- Hourly retry of team notifications that could not be sent ----------
async function retryNotifications(env) {
  const pending = (await env.DB.prepare("SELECT id, type, name, email, message, page FROM leads WHERE notified = 0 ORDER BY id ASC LIMIT 20").all()).results || [];
  let sent = 0;
  for (const l of pending) {
    try {
      await env.EMAIL.send({
        to: TO, from: FROM_FORMS, replyTo: l.email,
        subject: `${l.type === "chat" ? "Chat handoff" : "Contact form"} (delayed): ${l.name || l.email}`,
        text: `This notification was delayed because the email sending quota was exhausted when it came in.\n\nName: ${l.name || "(not given)"}\nEmail: ${l.email}\nPage: ${l.page || "unknown"}\n\n${l.message || ""}\n\nLead #${l.id} · stored in cognis-leads (D1)`,
      });
      await env.DB.prepare("UPDATE leads SET notified = 1 WHERE id = ?1").bind(l.id).run();
      sent++;
      try {
        await env.EMAIL.send({ to: l.email, from: FROM_NOREPLY, replyTo: TO, subject: "We received your message — Cognis Group",
          text: `Hello${l.name ? " " + l.name : ""},\n\nThank you for reaching out to Cognis Group. Your message is with the team and a senior member will reply within two business days.\n\nFor anything urgent, write to info@cognis.group.\n\nCognis Group` });
      } catch (e) {}
      try { await env.FORM_WORKFLOW.create({ id: `lead-${l.id}`, params: { leadId: l.id, name: l.name || "", email: l.email, message: l.message || "", page: l.page || "" } }); } catch (e) {}
    } catch (e) {
      console.log("retry still failing:", e && e.code); break; // quota still exhausted; try next hour
    }
  }
  console.log(JSON.stringify({ event: "retry-notifications", pending: pending.length, sent }));
}

// ---------- Weekly digest (cron) ----------
async function sendDigest(env) {
  const since = "datetime('now', '-7 days')";
  const tot = await env.DB.prepare(`SELECT COUNT(*) AS n, COUNT(DISTINCT sid) AS s, COALESCE(SUM(escalated),0) AS e, COALESCE(SUM(handed_off),0) AS h, COALESCE(SUM(CASE WHEN path='error' THEN 1 ELSE 0 END),0) AS err FROM asks WHERE created_at >= ${since}`).first();
  const flagged = (await env.DB.prepare(`SELECT question, answer, created_at FROM asks WHERE created_at >= ${since} AND (escalated = 1 OR path = 'error') ORDER BY id DESC LIMIT 30`).all()).results || [];
  const recent = (await env.DB.prepare(`SELECT question, answer, page, created_at FROM asks WHERE created_at >= ${since} ORDER BY id DESC LIMIT 25`).all()).results || [];
  const leads = (await env.DB.prepare(`SELECT type, COUNT(*) AS n FROM leads WHERE created_at >= ${since} GROUP BY type`).all()).results || [];
  const line = (r) => `• ${r.created_at.slice(0, 16)} — Q: ${r.question}\n   A: ${(r.answer || "").slice(0, 240)}`;
  const text = [
    `Ask Cognis — last 7 days`,
    ``,
    `Questions: ${tot.n}   Conversations: ${tot.s}   Offered the team: ${tot.e}   Left their email: ${tot.h}   Errors: ${tot.err}`,
    `Leads this week: ${leads.map((l) => `${l.type} ${l.n}`).join(", ") || "none"}`,
    ``,
    `QUESTIONS WE COULD NOT FULLY ANSWER OR HANDED TO YOU (${flagged.length})`,
    flagged.map(line).join("\n") || "  (none)",
    ``,
    `MOST RECENT CONVERSATIONS (${recent.length})`,
    recent.map(line).join("\n") || "  (none)",
    ``,
    `Full log: Cloudflare dashboard → Storage & Databases → D1 → cognis-leads → table "asks".`,
  ].join("\n");
  await env.EMAIL.send({ to: TO, from: FROM_FORMS, subject: `Ask Cognis weekly digest — ${tot.n} questions, ${tot.h} handoffs`, text });
}

export default {
  async fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;
    if (path === "/api/form" && request.method === "POST") return handleForm(request, env, ctx);
    if (path === "/api/confirm" && request.method === "GET") return handleConfirm(request, env, ctx);
    if (path === "/api/ask" && request.method === "POST") return handleAsk(request, env, ctx);
    if (path === "/api/ask/handoff" && request.method === "POST") return handleHandoff(request, env, ctx);
    return Response.redirect("https://cognis.group/", 302);
  },
  async scheduled(controller, env, ctx) {
    if (controller.cron === "0 7 * * 1") ctx.waitUntil(sendDigest(env).catch((e) => console.log("digest failed:", e && e.message)));
    else ctx.waitUntil(retryNotifications(env).catch((e) => console.log("retry failed:", e && e.message)));
  },
};
