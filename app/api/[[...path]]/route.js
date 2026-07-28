import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getSupabase, llm, llmJSON, retrieveMemories, formatMemoriesForPrompt } from '@/lib/llm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CLASSIFIER_SYSTEM = `You are the classification core of NEXUS, an AI Productivity OS acting as a second brain for researchers, engineers, and builders.

Given a raw capture from the user, output a JSON object with these fields:
- title: string, 3-8 words, punchy summary
- summary: string, 1-2 sentences distilling the essence
- layer: one of ["semantic", "episodic", "procedural", "preference", "project", "reflection", "task"] — pick the ONE best memory layer
- tags: array of 2-6 lowercase kebab-case tags (topics, technologies, people)
- entities: array of key entities mentioned (frameworks, papers, repos, people)
- importance: integer 1-10 (10 = life-changing insight, 1 = trivial)
- energy: one of ["low", "medium", "high", "deep"] — cognitive energy this deserves
- action: string or null — if this implies a concrete next step, describe it in imperative voice, else null
- estimatedMinutes: integer or null — if action, rough time cost

Layer definitions:
- semantic: facts, concepts, knowledge, definitions
- episodic: something that happened, meeting notes, observations
- procedural: how-to, workflow, habit, methodology
- preference: user's tastes, tools, style
- project: work tied to a specific project/milestone
- reflection: lessons, mistakes, retrospectives, wins
- task: concrete todo item with clear completion criteria`;

async function handleCapture(body) {
  const { text, projectId = null } = body;
  if (!text || !text.trim()) return NextResponse.json({ error: 'text required' }, { status: 400 });
  const meta = await llmJSON({
    model: 'gpt-4o-mini',
    system: CLASSIFIER_SYSTEM,
    user: text,
  });
  const doc = {
    id: uuidv4(),
    content: text,
    title: meta.title || text.slice(0, 60),
    summary: meta.summary || '',
    layer: meta.layer || 'semantic',
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    entities: Array.isArray(meta.entities) ? meta.entities : [],
    importance: Number(meta.importance) || 5,
    energy: meta.energy || 'medium',
    action: meta.action || null,
    estimatedMinutes: meta.estimatedMinutes || null,
    projectId,
    completed: false,
    createdAt: new Date().toISOString(),
  };
  const sb = getSupabase();
  const { error } = await sb.from('memories').insert(doc);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ memory: doc });
}

async function handleListMemories(url) {
  const layer = url.searchParams.get('layer');
  const limit = parseInt(url.searchParams.get('limit') || '100');
  const sb = getSupabase();
  let q = sb.from('memories').select('*').order('createdAt', { ascending: false }).limit(limit);
  if (layer && layer !== 'all') q = q.eq('layer', layer);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ memories: data });
}

async function handleDeleteMemory(id) {
  const sb = getSupabase();
  const { error } = await sb.from('memories').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

async function handleToggleMemory(id) {
  const sb = getSupabase();
  const { data: m, error: findErr } = await sb.from('memories').select('completed').eq('id', id).single();
  if (findErr || !m) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const { error } = await sb
    .from('memories')
    .update({ completed: !m.completed, completedAt: !m.completed ? new Date().toISOString() : null })
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

async function handleNextAction() {
  const sb = getSupabase();
  const { data: memories, error } = await sb.from('memories').select('*').order('createdAt', { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const openTasks = memories.filter((m) => m.layer === 'task' && !m.completed);
  const projectItems = memories.filter((m) => m.layer === 'project');
  const context = memories.slice(0, 30);
  const now = new Date();
  const hour = now.getHours();
  const timeContext = hour < 11 ? 'morning (peak deep-work energy)' : hour < 14 ? 'midday' : hour < 18 ? 'afternoon' : hour < 22 ? 'evening (winding down)' : 'late night';

  const system = `You are the Executive Function of NEXUS, an AI Productivity OS. You answer ONE question: "What is the highest-impact thing the user should do RIGHT NOW?"

You consider: open tasks, active projects, deadlines implied by memory, energy required, current time-of-day energy, and momentum (recent work).

Return JSON: {
  "headline": "punchy 5-10 word action title",
  "why": "1-2 sentences explaining WHY this is the highest-impact action right now, referencing specific memories/context",
  "how": ["3-5 concrete micro-steps to start in the next 90 seconds"],
  "estimatedMinutes": integer,
  "energyFit": "why the current time-of-day energy fits",
  "linkedMemoryTitles": ["titles of memories this draws from"],
  "alternatives": [{"headline": "alt action 1", "why": "short reason"}, ...up to 2]
}`;

  const user = `Current time: ${now.toISOString()} (${timeContext})\nOpen tasks (${openTasks.length}): ${openTasks
    .slice(0, 10)
    .map((t) => `- ${t.title} [imp:${t.importance} energy:${t.energy}${t.estimatedMinutes ? ' ~' + t.estimatedMinutes + 'm' : ''}]`)
    .join('\n')}\n\nActive projects: ${projectItems.slice(0, 5).map((p) => p.title).join('; ') || '(none yet)'}\n\nRecent context (${context.length} memories):\n${context
    .slice(0, 20)
    .map((m) => `- (${m.layer}) ${m.title}`)
    .join('\n')}`;

  if (memories.length === 0) {
    return NextResponse.json({
      recommendation: {
        headline: 'Capture your first thought',
        why: 'NEXUS learns from every memory you feed it. Start by dumping what is on your mind right now — a task, an idea, a paper you are reading.',
        how: ['Press ⌘K to open the capture bar', 'Type anything on your mind', 'Let the AI classify it', 'Repeat 3-5 times to see the graph come alive'],
        estimatedMinutes: 2,
        energyFit: `Any time of day works for this. Right now it is ${timeContext}.`,
        linkedMemoryTitles: [],
        alternatives: [],
      },
    });
  }

  const result = await llmJSON({ model: 'gpt-4o-mini', system, user, temperature: 0.5 });
  return NextResponse.json({ recommendation: result });
}

async function handleAgents() {
  const sb = getSupabase();
  const { data: memories, error } = await sb.from('memories').select('*').order('createdAt', { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (memories.length === 0) {
    return NextResponse.json({ agents: [] });
  }
  const memBlock = memories
    .slice(0, 30)
    .map((m) => `- (${m.layer}) ${m.title}: ${m.summary || (m.content || '').slice(0, 120)} [tags:${(m.tags || []).join(',')}]`)
    .join('\n');
  const system = `You are the multi-agent orchestrator for NEXUS. Given the user's memory dump, generate a JSON object with 5 agent recommendations. Each agent inspects the memories through its lens.

Return: {
  "agents": [
    {"name": "Research", "icon": "microscope", "insight": "1-sentence pattern/finding grounded in the memories", "recommendation": "specific next action for the user (1 sentence)", "confidence": 0-100},
    {"name": "Coding", "icon": "code", ...},
    {"name": "Learning", "icon": "brain", ...},
    {"name": "Planning", "icon": "calendar", ...},
    {"name": "Reflection", "icon": "sparkles", ...}
  ]
}

Be SPECIFIC. Reference actual entities/tags from the memories. No generic advice.`;
  const user = `User memories:\n${memBlock}`;
  const result = await llmJSON({ model: 'gpt-4o-mini', system, user, temperature: 0.6 });
  return NextResponse.json(result);
}

async function handleChat(body) {
  const { message, sessionId } = body;
  if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 });
  const sid = sessionId || uuidv4();
  const sb = getSupabase();

  const { data: history } = await sb.from('chat_messages').select('*').eq('sessionId', sid).order('createdAt', { ascending: true }).limit(20);
  const relevantMemories = await retrieveMemories(message, 8);
  const memoryContext = formatMemoriesForPrompt(relevantMemories);

  const messages = [
    {
      role: 'system',
      content: `You are NEXUS, the user's second brain. You have access to their long-term memory. Reason from THEIR memories, not generic knowledge. When you cite something from memory, refer to it as "you noted..." or "from your memory of X". Be concise, sharp, and act like a brilliant teammate.\n\nRelevant memories:\n${memoryContext}`,
    },
    ...(history || []).map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  const reply = await llm({ model: 'gpt-4o-mini', messages, temperature: 0.6, max_tokens: 900 });

  const { error } = await sb.from('chat_messages').insert([
    { id: uuidv4(), sessionId: sid, role: 'user', content: message, createdAt: new Date().toISOString() },
    { id: uuidv4(), sessionId: sid, role: 'assistant', content: reply, createdAt: new Date().toISOString(), citedMemoryIds: relevantMemories.map((m) => m.id) },
  ]);
  if (error) console.error('chat_messages insert error:', error.message);

  return NextResponse.json({
    sessionId: sid,
    reply,
    citedMemories: relevantMemories.map((m) => ({ id: m.id, title: m.title, layer: m.layer })),
  });
}

async function handleChatHistory(sessionId) {
  const sb = getSupabase();
  const { data: msgs, error } = await sb.from('chat_messages').select('*').eq('sessionId', sessionId).order('createdAt', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: msgs });
}

async function handleGraph() {
  const sb = getSupabase();
  const { data: memories, error } = await sb.from('memories').select('*').order('createdAt', { ascending: false }).limit(120);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const nodes = memories.map((m) => ({
    id: m.id,
    label: m.title,
    layer: m.layer,
    importance: m.importance,
    tags: m.tags || [],
  }));

  // Build edges by shared tags/entities
  const edges = [];
  const seen = new Set();
  for (let i = 0; i < memories.length; i++) {
    for (let j = i + 1; j < memories.length; j++) {
      const a = memories[i];
      const b = memories[j];
      const shared = (a.tags || []).filter((t) => (b.tags || []).includes(t));
      const sharedEnt = (a.entities || []).filter((e) => (b.entities || []).includes(e));
      const weight = shared.length + sharedEnt.length * 1.5;
      if (weight >= 1) {
        const key = `${a.id}-${b.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          edges.push({ source: a.id, target: b.id, weight, sharedTags: shared });
        }
      }
    }
  }
  // Cap edges to keep graph readable
  edges.sort((x, y) => y.weight - x.weight);
  return NextResponse.json({ nodes, edges: edges.slice(0, 300) });
}

async function handleStats() {
  const sb = getSupabase();
  const { data: memories, error } = await sb.from('memories').select('*').limit(5000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const byLayer = {};
  for (const m of memories) byLayer[m.layer] = (byLayer[m.layer] || 0) + 1;
  const tasks = memories.filter((m) => m.layer === 'task');
  const done = tasks.filter((m) => m.completed).length;
  const now = Date.now();
  const last7 = memories.filter((m) => now - new Date(m.createdAt).getTime() < 7 * 864e5);
  const byDay = {};
  for (const m of last7) {
    const d = m.createdAt.slice(0, 10);
    byDay[d] = (byDay[d] || 0) + 1;
  }
  return NextResponse.json({
    total: memories.length,
    byLayer,
    tasksTotal: tasks.length,
    tasksDone: done,
    completionRate: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    last7DaysByDay: byDay,
    avgImportance: memories.length ? +(memories.reduce((s, m) => s + (m.importance || 5), 0) / memories.length).toFixed(1) : 0,
  });
}

async function handleSeed() {
  const sb = getSupabase();
  const { count: existing, error: countErr } = await sb.from('memories').select('*', { count: 'exact', head: true });
  if (countErr) return NextResponse.json({ error: countErr.message }, { status: 500 });
  if (existing > 0) return NextResponse.json({ ok: true, existing, skipped: true });
  const seeds = [
    'Reading "Attention Is All You Need" — want to re-implement multi-head attention from scratch this weekend in PyTorch.',
    'I focus best between 9am-11am. Deep work sessions after lunch feel forced.',
    'Ship v0.1 of the RAG document analyzer by Friday: PDF ingestion + basic Q&A.',
    'Meeting with Priya: she suggested using DSPy instead of raw LangChain for the router — worth investigating.',
    'Mistake: pushed to main without running tests, broke the demo. Set up pre-commit hook.',
    'Prefer FastAPI over Flask, Postgres over Mongo for structured data, and Ruff over Black+isort.',
    'Idea: an AI agent that reads my GitHub commits and writes weekly retrospectives automatically.',
    'Todo: refactor the vector store abstraction — currently leaks Qdrant-specific types into the domain layer.',
  ];
  const results = [];
  for (const text of seeds) {
    try {
      const meta = await llmJSON({ model: 'gpt-4o-mini', system: CLASSIFIER_SYSTEM, user: text });
      const doc = {
        id: uuidv4(),
        content: text,
        title: meta.title || text.slice(0, 60),
        summary: meta.summary || '',
        layer: meta.layer || 'semantic',
        tags: meta.tags || [],
        entities: meta.entities || [],
        importance: Number(meta.importance) || 5,
        energy: meta.energy || 'medium',
        action: meta.action || null,
        estimatedMinutes: meta.estimatedMinutes || null,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      const { error } = await sb.from('memories').insert(doc);
      if (error) throw new Error(error.message);
      results.push(doc.title);
    } catch (e) {
      results.push('ERR: ' + e.message);
    }
  }
  return NextResponse.json({ ok: true, seeded: results.length, titles: results });
}

function json(x, s = 200) {
  return NextResponse.json(x, { status: s });
}

async function router(request, method) {
  try {
    const url = new URL(request.url);
    const parts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
    const [p0, p1, p2] = parts;

    if (!p0) return json({ name: 'NEXUS OS API', ok: true });
    if (p0 === 'health') return json({ ok: true, ts: Date.now() });
    if (p0 === 'seed' && method === 'POST') return handleSeed();

    if (p0 === 'capture' && method === 'POST') return handleCapture(await request.json());

    if (p0 === 'memories') {
      if (method === 'GET' && !p1) return handleListMemories(url);
      if (method === 'DELETE' && p1) return handleDeleteMemory(p1);
      if (method === 'PATCH' && p1 && p2 === 'toggle') return handleToggleMemory(p1);
    }

    if (p0 === 'next-action' && method === 'GET') return handleNextAction();
    if (p0 === 'agents' && method === 'GET') return handleAgents();

    if (p0 === 'chat') {
      if (method === 'POST' && !p1) return handleChat(await request.json());
      if (method === 'GET' && p1) return handleChatHistory(p1);
    }

    if (p0 === 'graph' && method === 'GET') return handleGraph();
    if (p0 === 'stats' && method === 'GET') return handleStats();

    return json({ error: 'not found', path: parts }, 404);
  } catch (e) {
    console.error('API error:', e);
    return json({ error: e.message }, 500);
  }
}

export async function GET(request) { return router(request, 'GET'); }
export async function POST(request) { return router(request, 'POST'); }
export async function PUT(request) { return router(request, 'PUT'); }
export async function PATCH(request) { return router(request, 'PATCH'); }
export async function DELETE(request) { return router(request, 'DELETE'); }
