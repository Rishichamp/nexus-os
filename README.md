<div align="center">

# 🧠 NEXUS OS

### *Your AI-Powered Second Brain*

**Capture · Classify · Connect · Reason**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-11-FF0055?style=for-the-badge&logo=framer)](https://www.framer.com/motion/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-violet?style=for-the-badge)](LICENSE)

> A full-stack AI productivity OS that captures your thoughts, classifies them with LLMs, connects them in a live knowledge graph, and surfaces your single highest-impact next action — powered by a multi-agent system that knows your full context.

![NEXUS OS Screenshot](docs/screenshot.png)

</div>

---

## ✨ Features

- **⌘K Capture Palette** — Frictionless thought capture with instant LLM classification (layer, tags, importance score, entity extraction)
- **🕸️ Live Knowledge Graph** — SVG force-directed graph showing tag-based connections between memories, with animated edge draw-in
- **🤖 Multi-Agent Dashboard** — 5 specialist AI agents (Focus, Energy, Risk, Growth, Integration) run in parallel and surface the single best action
- **🧠 Second Brain Chat** — Conversational interface grounded exclusively in your own memory store, not the internet
- **📊 Analytics Dashboard** — Memory distribution, capture velocity, focus score, and signal strength with animated visualisations
- **✨ Premium Animations** — Cursor spotlight, aurora background, spring physics, count-up numbers, staggered entrances via Framer Motion

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (React 18)                  │
│  Sidebar · Capture Palette · Graph · Chat · Analytics   │
│              Framer Motion · Tailwind · shadcn/ui        │
└──────────────────────┬──────────────────────────────────┘
                       │ fetch()
┌──────────────────────▼──────────────────────────────────┐
│            Next.js 15 — App Router                      │
│        /api/[[...path]]  (catch-all API route)          │
│  capture · memories · graph · agents · chat · stats     │
│              LLM calls via Emergent proxy               │
└──────────────────────┬──────────────────────────────────┘
                       │ @supabase/supabase-js
┌──────────────────────▼──────────────────────────────────┐
│         Supabase — hosted PostgreSQL                    │
│   memories table · chat_messages table                  │
│   tsvector full-text search · GIN index · RLS           │
└─────────────────────────────────────────────────────────┘
```

**Capture flow:** `User input → ⌘K → POST /api/capture → LLM classifier (gpt-4o-mini) → structured memory → Supabase insert → tsvector trigger fires`

**Chat flow:** `Message → /api/chat → PostgreSQL full-text search → top-k memories as LLM context → response grounded in your knowledge`

**Agent flow:** `GET /api/agents → Promise.all(5 parallel LLM calls) → specialist recommendations → Next Best Action`

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **UI** | React 18, Tailwind CSS 4, shadcn/ui (48 components) |
| **Animations** | Framer Motion 11 — spring physics, layoutId, AnimatePresence |
| **Database** | Supabase (hosted PostgreSQL) |
| **DB Client** | @supabase/supabase-js v2 |
| **Search** | PostgreSQL full-text search (tsvector + GIN index + plpgsql trigger) |
| **AI/LLM** | OpenAI-compatible API (gpt-4o-mini for classification, agents, chat) |
| **Icons** | lucide-react |
| **Package Manager** | Yarn |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Yarn (`npm install -g yarn`)
- A [Supabase](https://supabase.com) account (free)
- An LLM API key (OpenAI or compatible)

### 1. Clone & Install

```bash
git clone https://github.com/<your-username>/nexus-os.git
cd nexus-os
yarn install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor → New Query**, paste the contents of [`supabase-schema.sql`](supabase-schema.sql), click **Run**
3. Go to **SQL Editor → New Query**, run:
   ```sql
   grant all on memories to service_role;
   grant all on chat_messages to service_role;
   ```
4. Go to **Settings → API Keys** and copy your **Project URL** and **Secret key**

### 3. Configure Environment

```bash
cp .env.example .env
```

Fill in `.env`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
EMERGENT_LLM_KEY=your-llm-api-key
EMERGENT_LLM_BASE_URL=https://api.openai.com/v1
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Run

```bash
# Mac/Linux
yarn dev

# Windows
yarn dev:no-reload
```

Open [http://localhost:3000](http://localhost:3000) — click **Seed** to populate example memories.

---

## 📁 Project Structure

```
nexus-os/
├── app/
│   ├── api/[[...path]]/route.js   # All backend endpoints (capture, memories, agents, chat, graph, stats)
│   ├── page.js                    # Full UI — sidebar, capture palette, all views
│   ├── layout.js
│   └── globals.css                # Design system: aurora, glassmorphism, animation primitives
├── lib/
│   ├── llm.js                     # Supabase client, LLM helpers, memory retrieval
│   └── utils.js
├── components/ui/                 # shadcn/ui components (48 files)
├── supabase-schema.sql            # One-time DB setup — tables, trigger, indexes
├── .env.example                   # Environment variable template
└── package.json
```

---

## 🧩 Memory Layers

NEXUS OS classifies every capture into one of 7 cognitive layers:

| Layer | Description | Example |
|---|---|---|
| 🔵 **Semantic** | Facts, concepts, knowledge | "Transformers use self-attention" |
| 🟣 **Episodic** | Events, experiences, meetings | "Met Priya, she suggested DSPy" |
| 🟡 **Procedural** | How-to knowledge, workflows | "To deploy: push to main, check CI" |
| 🟠 **Preference** | Personal preferences, opinions | "Prefer FastAPI over Flask" |
| 🟢 **Project** | Project-specific context | "RAG analyzer: use Qdrant for vectors" |
| 🔴 **Reflection** | Meta-learning, retrospectives | "Pushed without tests — set up hook" |
| ⚪ **Task** | Actionable items | "Ship v0.1 by Friday" |

---

## 🤖 Multi-Agent System

Five specialist agents read your full memory store in parallel:

| Agent | Lens | Output |
|---|---|---|
| 🎯 **Focus** | Task completion & priorities | Highest-impact incomplete task |
| ⚡ **Energy** | Cognitive load matching | Best task for your current energy level |
| ⚠️ **Risk** | Gaps, deadlines, neglected areas | What you're at risk of missing |
| 📈 **Growth** | Learning opportunities | Skills and knowledge to develop |
| 🔗 **Integration** | Cross-domain connections | Insights from connecting disparate memories |

---

## 🗺️ Roadmap

- [ ] Vector embeddings with pgvector for semantic search
- [ ] Obsidian-style markdown editor for rich capture
- [ ] Chrome extension for one-click web capture
- [ ] Daily AI digest email via agent recommendations
- [ ] Mobile PWA with offline capture queue
- [ ] Multi-user support with Supabase Auth

---

## 📖 Documentation

- [Study Guide & Interview Q&A](docs/NEXUS_OS_Study_Guide.docx) — 33 questions covering architecture, system design, AI integration, and portfolio presentation
- [Supabase Schema](supabase-schema.sql) — annotated database setup

---

## 🙏 Acknowledgements

Built with [Next.js](https://nextjs.org/), [Supabase](https://supabase.com/), [Framer Motion](https://www.framer.com/motion/), and [shadcn/ui](https://ui.shadcn.com/).

---

<div align="center">

Made by **[Rishichamp](https://github.com/Rishichamp)** · IIT (ISM) Dhanbad

⭐ Star this repo if it helped you!

</div>
