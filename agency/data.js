/* =============================================================================
   VoxelBox Agency — CONTENT DATA (single source of truth)
   -----------------------------------------------------------------------------
   HOW TO EDIT THIS SITE:
   - Everything in Services, Portfolio, and the Case Studies is generated from
     the three arrays below. Edit them here — do NOT hand-edit the cards in
     index.html; they are rendered by main.js from this file.

   - SERVICES  -> the 6 "Services" cards.  Fields: { id, title, desc, icon }
       `icon` is a raw inline-SVG string (currentColor is themed automatically).

   - PROJECTS  -> the 6 "Portfolio" cards + drive the case-study pages.
       Fields: { id, title, blurb, tags[], accent, mock }
       `accent` = CSS color used for that project's placeholder gradient.
       `mock`   = short label shown inside the screenshot PLACEHOLDER.
       Every project is DEMO content (a "Demo" badge is added automatically).

   - CASE_STUDIES -> keyed by the SAME id as the matching project.
       Fields: { problem, solution, results[], tools[] }
       `results` are ILLUSTRATIVE / DEMO figures — clearly labelled in the UI.
       Do NOT add real client names, real testimonials, or real metrics here.

   To ADD a project: add an entry to PROJECTS and a matching entry (same id)
   to CASE_STUDIES. To REMOVE one: delete both. Order in PROJECTS = display order.
   ============================================================================= */

/* SERVICES (6 cards) */
const SERVICES = [
  {
    id: "ai-automation",
    title: "AI Automation",
    desc: "Custom AI agents and pipelines that handle repetitive work — triage, tagging, drafting, and routing — so your team focuses on the hard parts.",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v3"/><rect x="5" y="5" width="14" height="12" rx="3"/><path d="M9 11h.01M15 11h.01"/><path d="M9 15h6"/><path d="M3 11h2M19 11h2M12 17v4M8 21h8"/></svg>`
  },
  {
    id: "local-llm",
    title: "Local LLM Setup",
    desc: "Self-hosted language-model stacks on your own hardware. Private by default, no per-token bills, tuned to your data and your latency budget.",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/><path d="M7 9l2 2-2 2M12 13h4"/></svg>`
  },
  {
    id: "dashboards",
    title: "Business Dashboards",
    desc: "Real-time dashboards that pull your scattered data into one clear picture — KPIs, ops health, and alerts you can actually act on.",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M8 13v4M12 11v6M16 14v3"/></svg>`
  },
  {
    id: "integrations",
    title: "Workflow Integrations",
    desc: "We connect the tools you already use — CRMs, inboxes, spreadsheets, chat — into automated flows that move data without copy-paste.",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M9 6h6a3 3 0 0 1 3 3v6"/><path d="M6 9v6a3 3 0 0 0 3 3h3"/></svg>`
  },
  {
    id: "web-app",
    title: "Website + App Development",
    desc: "Fast, modern web and app builds — from marketing sites to internal tools — with clean code, good UX, and no unnecessary bloat.",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M2 9h20"/><path d="M6 6.5h.01M9 6.5h.01"/><path d="M9 21h6"/></svg>`
  },
  {
    id: "infra",
    title: "Server & Infrastructure Setup",
    desc: "Self-hosted infrastructure done right — provisioning, containers, backups, monitoring, and hardening so your systems stay up and stay yours.",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/><path d="M7 7h.01M7 17h.01"/></svg>`
  }
];

/* PROJECTS (6 cards) — all DEMO content */
const PROJECTS = [
  {
    id: "support-agent",
    title: "AI Customer Support Agent",
    blurb: "A retrieval-grounded support assistant that answers common questions instantly and hands off cleanly to a human when it isn't sure.",
    tags: ["Python", "FastAPI", "RAG", "OpenAI-compatible", "WebSocket"],
    accent: "#ff7a1a",
    mock: "Support Console"
  },
  {
    id: "llm-portal",
    title: "Local LLM Business Portal",
    blurb: "A private, self-hosted chat portal running a local model — team logins, saved prompts, and document Q&A that never leaves the building.",
    tags: ["Ollama", "Node.js", "Postgres", "Docker", "SSO"],
    accent: "#2f7bff",
    mock: "LLM Portal"
  },
  {
    id: "lead-intake",
    title: "Automated Lead Intake System",
    blurb: "Inbound leads are parsed, enriched, scored, and routed to the right rep automatically — with a fallback queue for edge cases.",
    tags: ["Webhooks", "n8n", "Airtable", "Zapier", "Regex NLP"],
    accent: "#ffa338",
    mock: "Lead Pipeline"
  },
  {
    id: "ops-dashboard",
    title: "Operations Dashboard",
    blurb: "A single live view of orders, fulfillment, and system health, with threshold alerts pushed to chat before small issues become big ones.",
    tags: ["React", "Grafana", "Prometheus", "TimescaleDB"],
    accent: "#5aa2ff",
    mock: "Ops Overview"
  },
  {
    id: "discord-automation",
    title: "Discord Community Automation",
    blurb: "A bot that onboards members, moderates content, posts event pings, and syncs roles with an external system — hands-off community ops.",
    tags: ["discord.js", "Node.js", "Redis", "Cron"],
    accent: "#ff8c42",
    mock: "Community Bot"
  },
  {
    id: "kb-rag",
    title: "Internal Knowledge Base RAG System",
    blurb: "Staff ask questions in plain language and get answers grounded in your own docs, complete with citations back to the source page.",
    tags: ["Embeddings", "pgvector", "FastAPI", "Local LLM"],
    accent: "#3d8bff",
    mock: "Knowledge Search"
  }
];

/* CASE_STUDIES — keyed by project id. All content is DEMO / ILLUSTRATIVE. */
const CASE_STUDIES = {
  "support-agent": {
    problem: "A growing team was drowning in repetitive support tickets. The same dozen questions consumed hours daily, response times slipped, and agents burned out on copy-paste answers instead of the tricky cases that actually needed a human.",
    solution: "We built a retrieval-grounded AI support agent that reads from the company's own help docs and past resolved tickets. It answers common questions instantly in the existing chat widget, cites its sources, and escalates to a human the moment its confidence drops — with the full conversation attached.",
    results: [
      "Illustrative: a large share of routine tickets deflected before reaching a human",
      "Illustrative: first-response time reduced from hours to seconds for common questions",
      "Illustrative: agents freed to focus on complex, high-value cases",
      "Clean human handoff kept customer trust intact"
    ],
    tools: ["Python", "FastAPI", "RAG pipeline", "Vector search", "OpenAI-compatible API", "WebSocket streaming"]
  },
  "llm-portal": {
    problem: "A business wanted the productivity of modern AI chat, but sending internal documents and customer data to a third-party API was a non-starter for privacy and compliance reasons.",
    solution: "We deployed a self-hosted LLM portal on the company's own hardware. Staff log in with existing accounts, chat with a local model, save reusable prompts, and ask questions against uploaded documents — all without a single byte leaving the network.",
    results: [
      "Illustrative: sensitive data stays fully on-premise",
      "Illustrative: predictable flat infrastructure cost instead of per-token billing",
      "Illustrative: adopted across multiple teams for drafting and research",
      "No external API dependency or vendor lock-in"
    ],
    tools: ["Ollama", "Node.js", "PostgreSQL", "Docker", "Reverse proxy", "SSO"]
  },
  "lead-intake": {
    problem: "Inbound leads arrived from web forms, email, and ads in inconsistent formats. Manual sorting was slow, leads went cold, and promising prospects sometimes slipped through the cracks entirely.",
    solution: "We built an automated intake pipeline that captures every lead via webhook, normalizes and enriches the data, scores it against qualifying rules, and routes it to the right rep instantly — with a review queue for anything ambiguous so nothing is silently dropped.",
    results: [
      "Illustrative: near-instant lead routing instead of manual triage",
      "Illustrative: fewer dropped or duplicated leads",
      "Illustrative: reps spend time selling, not sorting",
      "Full audit trail for every inbound lead"
    ],
    tools: ["Webhooks", "n8n", "Airtable", "Zapier", "Lightweight NLP parsing"]
  },
  "ops-dashboard": {
    problem: "Operational data lived in half a dozen tools. Getting a straight answer about order status or system health meant pinging several people and stitching together spreadsheets — usually after something had already gone wrong.",
    solution: "We consolidated the key data streams into one real-time operations dashboard. Live tiles show orders, fulfillment, and infrastructure health, and threshold-based alerts fire into the team chat the moment a metric drifts out of range.",
    results: [
      "Illustrative: one shared source of truth for daily operations",
      "Illustrative: issues caught proactively via alerts, not customer complaints",
      "Illustrative: less time spent assembling manual status reports",
      "Faster, calmer incident response"
    ],
    tools: ["React", "Grafana", "Prometheus", "TimescaleDB", "Alerting webhooks"]
  },
  "discord-automation": {
    problem: "A busy community server relied on volunteers to manually onboard members, moderate spam, and post event reminders. Coverage was uneven, moderators burned out, and roles drifted out of sync with the group's other systems.",
    solution: "We built a Discord automation bot that greets and verifies new members, filters spam and rule-breaking content, schedules recurring event pings, and keeps member roles synced with an external source of truth — turning hours of manual moderation into a hands-off system.",
    results: [
      "Illustrative: round-the-clock moderation coverage",
      "Illustrative: smoother, more consistent onboarding",
      "Illustrative: moderators freed from repetitive tasks",
      "Roles stay in sync automatically"
    ],
    tools: ["discord.js", "Node.js", "Redis", "Cron scheduling"]
  },
  "kb-rag": {
    problem: "Company knowledge was scattered across wikis, PDFs, and old chat threads. New hires took weeks to get up to speed, and even veterans wasted time hunting for the one document that had the answer.",
    solution: "We built an internal knowledge-base assistant using retrieval-augmented generation. Staff ask questions in plain language and get concise answers grounded strictly in the company's own documents — each answer links back to the exact source page so people can verify and dig deeper.",
    results: [
      "Illustrative: answers in seconds instead of long document hunts",
      "Illustrative: faster onboarding for new team members",
      "Illustrative: every answer traceable to a source document",
      "Runs on a local model — internal docs stay private"
    ],
    tools: ["Text embeddings", "pgvector", "FastAPI", "Local LLM", "Citation linking"]
  }
};

// Expose data to main.js (and case-study.html) via the global scope.
window.VOXELBOX_DATA = { SERVICES, PROJECTS, CASE_STUDIES };
