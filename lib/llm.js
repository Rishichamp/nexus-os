// LLM + Memory helpers for NEXUS OS
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.EMERGENT_LLM_BASE_URL;
const API_KEY = process.env.EMERGENT_LLM_KEY;

let _client;

// Server-side only client using the service role key — bypasses RLS.
// Never import this file from client components; API routes only.
export function getSupabase() {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
      },
    },
  });
  return _client;
}

export async function llm({ model = 'gpt-5', messages, temperature = 0.4, response_format = null, max_tokens = 1500 }) {
  const body = {
    model,
    messages,
    max_completion_tokens: max_tokens,
  };
  // GPT-5 family only supports temperature=1 (default) — omit param entirely for them
  if (!/^gpt-5/i.test(model) && !/^o[0-9]/i.test(model)) {
    body.temperature = temperature;
  }
  if (response_format) body.response_format = response_format;
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

export async function llmJSON({ model = 'gpt-5-mini', system, user, temperature = 0.2 }) {
  const out = await llm({
    model,
    temperature,
    messages: [
      { role: 'system', content: system + '\n\nRespond ONLY with valid JSON. No prose, no markdown fences.' },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_object' },
  });
  try {
    return JSON.parse(out);
  } catch (e) {
    const m = out.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error('Failed to parse JSON: ' + out.slice(0, 200));
  }
}

// Score memory importance & retrieve top-k relevant memories for a query
export async function retrieveMemories(query, k = 8) {
  const sb = getSupabase();

  // Full-text search against the generated searchVector column (see schema.sql)
  const { data: matches, error } = await sb
    .from('memories')
    .select('*')
    .textSearch('searchVector', query, { type: 'websearch' })
    .limit(k);
  if (error) console.error('retrieveMemories text search error:', error.message);

  const results = matches || [];
  if (results.length >= 3) return results;

  // Fallback: pad out with most recent memories
  const { data: recent } = await sb
    .from('memories')
    .select('*')
    .order('createdAt', { ascending: false })
    .limit(k);
  const seen = new Set(results.map((r) => r.id));
  for (const r of recent || []) {
    if (!seen.has(r.id) && results.length < k) results.push(r);
  }
  return results;
}

export function formatMemoriesForPrompt(memories) {
  if (!memories?.length) return '(no relevant memories yet)';
  return memories
    .map((m, i) => `[${i + 1}] (${m.layer}) ${m.title || ''}\n${(m.content || '').slice(0, 400)}\nTags: ${(m.tags || []).join(', ')}\n`)
    .join('\n---\n');
}
