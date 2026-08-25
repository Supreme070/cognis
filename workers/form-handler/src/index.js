// cognis.group platform worker — forms, double opt-in, lead log, AI concierge,
// and lead-enrichment workflow. All email via Cloudflare Email Sending; all
// storage in D1 (cognis-leads).
//
// Routes (cognis.group/api/*):
//   POST /api/form     — contact + newsletter submissions (HTML form posts)
//   GET  /api/confirm  — newsletter double-opt-in confirmation link
//   POST /api/ask      — "Ask Cognis" site concierge (JSON)

import { WorkflowEntrypoint } from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";

const TO = "info@cognis.group";
const FROM_FORMS = { email: "forms@cognis.group", name: "Cognis Group Website" };
const FROM_NOREPLY = { email: "noreply@cognis.group", name: "Cognis Group" };
const FALLBACK_REDIRECT = "https://cognis.group/thanks/";
const CONFIRM_LANDING = "https://cognis.group/thanks-subscribe/";
const CHECK_INBOX = "https://cognis.group/confirm-subscription/";
const FREE_MAIL = new Set(["gmail.com","yahoo.com","outlook.com","hotmail.com","icloud.com","aol.com","proton.me","protonmail.com","live.com","msn.com","yandex.com","mail.com","gmx.com"]);

// Compact fact sheet — fallback context for /api/ask until AI Search indexing is live.
const FACTS = `Cognis Group is an AI consulting and engineering firm founded in 2024, registered in Lagos, Nigeria, with offices in Cheyenne (USA), Ontario (Canada), and Lagos (Nigeria). Motto: Quod Tango Muto — what we touch, we change. Three practices: AI Strategy & Advisory (readiness assessment, use cases, executable roadmaps), AI Training & Workforce Development (AI literacy from executives to operators), and AI Agent & Automation Engineering (custom agents and automation deployed to production). Cognis builds and runs four products: Cognis AI (AI workforce, cognis.group/products), MarketSage (autonomous marketing and sales intelligence, marketsage.africa), Migratio (data migration and reconciliation for banks and regulated enterprises, migratio.cognis.group), and SPOG (single pane of glass enterprise observability, spog.cognis.group). Clients include banks, ministries, and enterprises across Africa, Europe, and the Americas. Governance expertise: NDPA, EU AI Act, ISO 42001, NIST AI RMF. Contact: info@cognis.group, +1 (512) 743-7322 (US), +2349080001101 (NG). Site sections: /our-services/, /products/, /case-studies/, /how-we-work/, /why-cognis/, /faq/, /careers/, /contact/.`;

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

  const email = get("email");
  const name = get("name") || get("full_name");
  const message = get("message");
  const page = request.headers.get("referer") || "";
  if (!email || !email.includes("@") || email.length > 320) {
    return new Response("A valid email address is required.", { status: 400 });
  }

  if (message) {
    // ---- Contact / inquiry ----
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
      console.log("notify send failed:", e && e.code, e && e.message);
      return new Response("Something went wrong sending your message. Please email info@cognis.group directly.", { status: 502 });
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

async function handleAsk(request, env) {
  let body;
  try { body = await request.json(); } catch (e) { return Response.json({ error: "bad request" }, { status: 400 }); }
  const question = (body && body.question ? String(body.question) : "").trim().slice(0, 500);
  if (!question) return Response.json({ error: "empty question" }, { status: 400 });

  try {
    if (env.SITE_SEARCH) {
      const r = await env.SITE_SEARCH.chatCompletions({
        messages: [
          { role: "system", content: "You are the Cognis Group site assistant. Answer using only the provided site content. Be concise (under 150 words), factual, and helpful. If the content does not answer the question, say so and point to info@cognis.group. Never invent prices, clients, or commitments." },
          { role: "user", content: question },
        ],
        ai_search_options: { retrieval: { max_num_results: 5 }, query_rewrite: { enabled: true } },
      });
      const answer = r.choices && r.choices[0] && r.choices[0].message ? r.choices[0].message.content : "";
      const sources = [...new Set((r.chunks || []).map((c) => c.item && c.item.key).filter(Boolean))].slice(0, 3);
      return Response.json({ answer, sources });
    }
    // Fallback until AI Search is indexed: answer from the embedded fact sheet.
    const out = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        { role: "system", content: `You are the Cognis Group site assistant. Answer only from these facts; if they do not cover the question, say you are not sure and point to info@cognis.group. Be concise (under 120 words). Never invent prices, clients, or commitments.\n\nFACTS: ${FACTS}` },
        { role: "user", content: question },
      ],
      max_tokens: 512,
    }, { gateway: { id: "default", metadata: { source: "site-chat" } } });
    return Response.json({ answer: out.response || out.result || "", sources: [] });
  } catch (e) {
    console.log("ask failed:", e && e.message);
    return Response.json({ answer: "" }, { status: 502 });
  }
}

export default {
  async fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;
    if (path === "/api/form" && request.method === "POST") return handleForm(request, env, ctx);
    if (path === "/api/confirm" && request.method === "GET") return handleConfirm(request, env, ctx);
    if (path === "/api/ask" && request.method === "POST") return handleAsk(request, env);
    return Response.redirect("https://cognis.group/", 302);
  },
};
