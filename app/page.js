'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Command as CommandIcon,
  Sparkles,
  Brain,
  Network,
  MessageSquareText,
  Calendar,
  Microscope,
  Code2,
  BookOpen,
  Compass,
  ArrowUpRight,
  ArrowRight,
  Check,
  Trash2,
  RefreshCw,
  Zap,
  Clock,
  Send,
  Plus,
  Loader2,
  ListTodo,
  Layers,
  Home,
  ChartLine,
  Wand2,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

const LAYER_STYLES = {
  semantic:    { color: '#a78bfa', bg: 'from-violet-500/20 to-violet-500/5',    label: 'Semantic',   icon: BookOpen },
  episodic:    { color: '#60a5fa', bg: 'from-blue-500/20 to-blue-500/5',        label: 'Episodic',   icon: Clock },
  procedural:  { color: '#34d399', bg: 'from-emerald-500/20 to-emerald-500/5',  label: 'Procedural', icon: Zap },
  preference:  { color: '#fbbf24', bg: 'from-amber-500/20 to-amber-500/5',      label: 'Preference', icon: Sparkles },
  project:     { color: '#f472b6', bg: 'from-pink-500/20 to-pink-500/5',        label: 'Project',    icon: Layers },
  reflection:  { color: '#fb7185', bg: 'from-rose-500/20 to-rose-500/5',        label: 'Reflection', icon: Compass },
  task:        { color: '#22d3ee', bg: 'from-cyan-500/20 to-cyan-500/5',        label: 'Task',       icon: ListTodo },
};

const AGENT_ICONS = { Research: Microscope, Coding: Code2, Learning: Brain, Planning: Calendar, Reflection: Sparkles };
const AGENT_COLORS = {
  Research:   'from-violet-500/30 to-fuchsia-500/10 border-violet-500/30',
  Coding:     'from-cyan-500/30 to-blue-500/10 border-cyan-500/30',
  Learning:   'from-emerald-500/30 to-teal-500/10 border-emerald-500/30',
  Planning:   'from-amber-500/30 to-orange-500/10 border-amber-500/30',
  Reflection: 'from-rose-500/30 to-pink-500/10 border-rose-500/30',
};

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------
async function api(path, opts = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) throw new Error((await res.text()) || res.statusText);
  return res.json();
}

// ---------------------------------------------------------------------------
// CountUp — animates a number tweening toward its latest value
// ---------------------------------------------------------------------------
function CountUp({ value = 0, decimals = 0, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = Number(value) || 0;
    const duration = 700;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{display.toFixed(decimals)}{suffix}</>;
}

// ---------------------------------------------------------------------------
// useSpotlight — tracks pointer position within an element as CSS vars,
// used by the `.spotlight` utility for a cursor-following glow
// ---------------------------------------------------------------------------
function useSpotlight() {
  const ref = useRef(null);
  const onMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
  }, []);
  return { ref, onMouseMove };
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------
function Sidebar({ view, setView, stats }) {
  const items = [
    { id: 'today',    label: 'Today',      icon: Home },
    { id: 'memory',   label: 'Memory',     icon: Brain },
    { id: 'graph',    label: 'Graph',      icon: Network },
    { id: 'chat',     label: 'Second Brain', icon: MessageSquareText },
    { id: 'agents',   label: 'Agents',     icon: Wand2 },
    { id: 'analytics',label: 'Analytics',  icon: ChartLine },
  ];
  return (
    <aside className="w-[240px] shrink-0 h-screen border-r border-white/5 flex flex-col glass-strong">
      <div className="px-5 py-5 border-b border-white/5">
        <motion.div
          className="flex items-center gap-2.5"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center glow-primary"
            whileHover={{ scale: 1.08, rotate: 4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            <Brain className="w-4 h-4 text-white" strokeWidth={2.5} />
            <div className="absolute inset-0 rounded-lg animate-pulse-glow bg-gradient-to-br from-violet-500/40 to-fuchsia-500/40 blur-md -z-10" />
          </motion.div>
          <div>
            <div className="text-sm font-bold tracking-tight text-gradient-animated">NEXUS</div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest">Second Brain OS</div>
          </div>
        </motion.div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {items.map((it, i) => {
          const Icon = it.icon;
          const active = view === it.id;
          return (
            <motion.button
              key={it.id}
              onClick={() => setView(it.id)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ x: active ? 0 : 2 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-300 relative group ${
                active ? 'bg-white/[0.06] text-white' : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-gradient-to-b from-violet-400 to-fuchsia-500"
                />
              )}
              <Icon className="w-4 h-4" />
              <span className="font-medium">{it.label}</span>
            </motion.button>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-white/5 space-y-2 text-xs">
        <div className="flex justify-between text-white/50">
          <span>Memories</span>
          <span className="text-white font-mono"><CountUp value={stats?.total ?? 0} /></span>
        </div>
        <div className="flex justify-between text-white/50">
          <span>Tasks done</span>
          <span className="text-white font-mono"><CountUp value={stats?.tasksDone ?? 0} />/<CountUp value={stats?.tasksTotal ?? 0} /></span>
        </div>
        <div className="flex justify-between text-white/50">
          <span>Avg importance</span>
          <span className="text-white font-mono">{stats?.avgImportance != null ? <CountUp value={stats.avgImportance} decimals={1} /> : '—'}</span>
        </div>
        <div className="pt-2 flex items-center gap-1.5 text-white/30">
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[10px] animate-ring-pulse">⌘K</kbd>
          <span className="text-[11px]">to capture</span>
        </div>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Capture Palette (⌘K)
// ---------------------------------------------------------------------------
function CapturePalette({ open, setOpen, onCaptured }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => ref.current?.focus(), 50);
  }, [open]);

  const submit = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const { memory } = await api('/capture', { method: 'POST', body: JSON.stringify({ text }) });
      toast.success(`Captured → ${LAYER_STYLES[memory.layer]?.label || memory.layer}`, {
        description: memory.title,
      });
      setText('');
      setOpen(false);
      onCaptured?.(memory);
    } catch (e) {
      toast.error('Capture failed', { description: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-0 gap-0 border-white/10 bg-[#0d0d15]/95 backdrop-blur-2xl overflow-hidden">
        <DialogTitle className="sr-only">Capture</DialogTitle>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 border border-white/10 flex items-center justify-center animate-ring-pulse">
            <Sparkles className="w-4 h-4 text-violet-300" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Capture anything</div>
            <div className="text-xs text-white/40">Task, idea, paper, insight — NEXUS will classify it into your memory.</div>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[10px] text-white/40">Esc</kbd>
        </div>
        <div className="p-5">
          <Textarea
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit();
            }}
            placeholder="Dump it here… e.g. 'Reading DPO paper, want to implement it in the RLHF repo this week'"
            className="min-h-[120px] resize-none bg-transparent border-white/5 focus-visible:ring-violet-500/30 text-[15px] leading-relaxed placeholder:text-white/25"
          />
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-1.5 text-[11px] text-white/40">
              <Info className="w-3 h-3" />
              AI classifies into semantic · episodic · procedural · task · project · preference · reflection
            </div>
            <Button onClick={submit} disabled={busy || !text.trim()} className="press-scale bg-gradient-to-br from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 border-0 shadow-lg shadow-violet-900/40 transition-all duration-300">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3.5 h-3.5 mr-2" />Capture</>}
              <kbd className="ml-2 px-1.5 py-0.5 rounded bg-black/30 border border-white/10 font-mono text-[10px] text-white/50">⌘↵</kbd>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Next-Best-Action hero
// ---------------------------------------------------------------------------
function NextActionHero({ rec, loading, onRefresh }) {
  const spot = useSpotlight();
  return (
    <motion.div
      ref={spot.ref}
      onMouseMove={spot.onMouseMove}
      initial={{ opacity: 0, y: 16, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl overflow-hidden glass-strong grain spotlight border border-white/10 p-7"
    >
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-violet-600/25 to-fuchsia-600/10 blur-3xl pointer-events-none animate-float" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-tr from-blue-600/15 to-transparent blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-white/50 font-semibold">The Next Best Action</div>
          </div>
          <motion.button
            onClick={onRefresh}
            disabled={loading}
            whileHover={{ rotate: 45 }}
            whileTap={{ scale: 0.92 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-xs text-white/40 hover:text-white flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Recompute
          </motion.button>
        </div>

        {loading && !rec ? (
          <div className="space-y-3">
            <div className="h-9 w-2/3 rounded-lg shimmer bg-white/[0.03]" />
            <div className="h-4 w-full rounded shimmer bg-white/[0.03]" />
            <div className="h-4 w-4/5 rounded shimmer bg-white/[0.03]" />
          </div>
        ) : rec ? (
          <>
            <motion.h1
              key={rec.headline}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl md:text-4xl font-bold tracking-tight text-gradient-animated leading-tight mb-3"
            >
              {rec.headline}
            </motion.h1>
            <p className="text-white/70 text-[15px] leading-relaxed max-w-3xl mb-5">{rec.why}</p>

            <div className="grid md:grid-cols-2 gap-5 mb-5">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-white/40 mb-2 font-semibold">Start in 90 seconds</div>
                <ol className="space-y-1.5">
                  {(rec.how || []).map((step, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: 0.15 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                      className="flex gap-2.5 text-sm text-white/80"
                    >
                      <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-[10px] font-mono text-violet-300">{i + 1}</span>
                      <span>{step}</span>
                    </motion.li>
                  ))}
                </ol>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-sm text-white/70">~{rec.estimatedMinutes || 30} min · {rec.energyFit}</span>
                </div>
                {!!rec.linkedMemoryTitles?.length && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5 font-semibold">Linked memories</div>
                    <div className="flex flex-wrap gap-1.5">
                      {rec.linkedMemoryTitles.map((t, i) => (
                        <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/60">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!!rec.alternatives?.length && (
              <div className="border-t border-white/5 pt-4">
                <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2 font-semibold">Also worth considering</div>
                <div className="space-y-1.5">
                  {rec.alternatives.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="w-3.5 h-3.5 text-white/30 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-white/80 font-medium">{a.headline}</span>
                        <span className="text-white/45 ml-2">— {a.why}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-white/50">Capture a few thoughts to unlock recommendations.</div>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Agent card grid
// ---------------------------------------------------------------------------
function AgentCards({ agents, loading }) {
  const list = agents?.agents || [];
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
      {loading && list.length === 0 && Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl h-40 glass border border-white/5 shimmer" />
      ))}
      {list.map((a, i) => {
        const Icon = AGENT_ICONS[a.name] || Sparkles;
        return (
          <motion.div
            key={a.name}
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4, scale: 1.015 }}
            className={`relative rounded-xl border bg-gradient-to-br p-4 group hover-lift ${AGENT_COLORS[a.name] || 'from-white/5 to-white/[0.02] border-white/10'}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-black/40 border border-white/10 flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="text-sm font-semibold">{a.name} Agent</div>
              </div>
              <div className="text-[10px] font-mono text-white/40">{a.confidence ?? 0}%</div>
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/40 mb-0.5">Insight</div>
                <div className="text-[13px] text-white/85 leading-snug">{a.insight}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/40 mb-0.5">Suggested action</div>
                <div className="text-[13px] text-white leading-snug font-medium">{a.recommendation}</div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Memory feed
// ---------------------------------------------------------------------------
function MemoryFeed({ memories, onDelete, onToggle }) {
  const [layer, setLayer] = useState('all');
  const layers = ['all', ...Object.keys(LAYER_STYLES)];
  const filtered = layer === 'all' ? memories : memories.filter((m) => m.layer === layer);

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {layers.map((l) => {
          const active = layer === l;
          const style = LAYER_STYLES[l];
          return (
            <button
              key={l}
              onClick={() => setLayer(l)}
              className={`relative px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-300 border press-scale ${
                active
                  ? 'bg-white/[0.08] text-white border-white/15'
                  : 'text-white/50 hover:text-white border-transparent hover:bg-white/[0.03]'
              }`}
              style={active && style ? { color: style.color, borderColor: style.color + '40' } : {}}
            >
              {active && (
                <motion.span
                  layoutId="layer-tab-active"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="absolute inset-0 rounded-md bg-white/[0.04] -z-10"
                />
              )}
              {l === 'all' ? 'All' : style?.label}
              <span className="ml-1.5 text-white/30 font-mono text-[10px]">
                {l === 'all' ? memories.length : memories.filter((m) => m.layer === l).length}
              </span>
            </button>
          );
        })}
      </div>
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {filtered.map((m) => {
            const s = LAYER_STYLES[m.layer] || LAYER_STYLES.semantic;
            const Icon = s.icon;
            return (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.25 } }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="group relative rounded-xl glass border border-white/5 p-4 hover-lift hover:border-white/10"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br ${s.bg} border border-white/10 flex items-center justify-center`}>
                    <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {m.layer === 'task' && (
                            <button
                              onClick={() => onToggle?.(m.id)}
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                m.completed ? 'bg-cyan-500 border-cyan-400' : 'border-white/20 hover:border-white/40'
                              }`}
                            >
                              {m.completed && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                            </button>
                          )}
                          <h3 className={`text-sm font-semibold truncate ${m.completed ? 'line-through text-white/40' : ''}`}>{m.title}</h3>
                          <span className="text-[10px] font-mono text-white/30 shrink-0">imp {m.importance}</span>
                        </div>
                        {m.summary && <p className="text-xs text-white/55 mt-1 leading-relaxed line-clamp-2">{m.summary}</p>}
                        {(m.tags?.length ?? 0) > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {m.tags.slice(0, 6).map((t) => (
                              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/50 font-mono">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => onDelete?.(m.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-white/30 text-sm">No memories in this layer yet.</div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Knowledge Graph (SVG force-directed, simple simulation)
// ---------------------------------------------------------------------------
function KnowledgeGraph({ nodes, edges }) {
  const [positions, setPositions] = useState({});
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);
  const W = 800;
  const H = 560;

  useEffect(() => {
    if (!nodes.length) return;
    const pos = {};
    // Layer clustering: give each layer a rough anchor
    const layerAnchors = {
      task: [0.25, 0.3], project: [0.7, 0.3], semantic: [0.25, 0.7], episodic: [0.5, 0.15],
      procedural: [0.75, 0.7], preference: [0.5, 0.85], reflection: [0.9, 0.55],
    };
    for (const n of nodes) {
      const anchor = layerAnchors[n.layer] || [0.5, 0.5];
      pos[n.id] = {
        x: anchor[0] * W + (Math.random() - 0.5) * 220,
        y: anchor[1] * H + (Math.random() - 0.5) * 160,
        vx: 0, vy: 0,
      };
    }
    // Force simulation - 120 iterations
    for (let iter = 0; iter < 120; iter++) {
      // Repulsion between all nodes
      const arr = nodes;
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const p1 = pos[arr[i].id]; const p2 = pos[arr[j].id];
          const dx = p2.x - p1.x, dy = p2.y - p1.y;
          const d2 = dx * dx + dy * dy + 0.01;
          const f = 800 / d2;
          const d = Math.sqrt(d2);
          const fx = (dx / d) * f, fy = (dy / d) * f;
          p1.vx -= fx; p1.vy -= fy;
          p2.vx += fx; p2.vy += fy;
        }
      }
      // Attraction along edges
      for (const e of edges) {
        const p1 = pos[e.source]; const p2 = pos[e.target];
        if (!p1 || !p2) continue;
        const dx = p2.x - p1.x, dy = p2.y - p1.y;
        const f = 0.008 * (e.weight || 1);
        p1.vx += dx * f; p1.vy += dy * f;
        p2.vx -= dx * f; p2.vy -= dy * f;
      }
      // Center pull + damping
      for (const n of nodes) {
        const p = pos[n.id];
        p.vx += (W / 2 - p.x) * 0.005;
        p.vy += (H / 2 - p.y) * 0.005;
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.7; p.vy *= 0.7;
        p.x = Math.max(30, Math.min(W - 30, p.x));
        p.y = Math.max(30, Math.min(H - 30, p.y));
      }
    }
    setPositions(pos);
  }, [nodes, edges]);

  if (!nodes.length) {
    return (
      <div className="rounded-2xl glass-strong border border-white/10 h-[560px] flex items-center justify-center text-white/40 text-sm">
        Capture a few memories to see your knowledge graph come to life.
      </div>
    );
  }

  return (
    <div className="rounded-2xl glass-strong border border-white/10 overflow-hidden relative">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-[560px]">
        <defs>
          <radialGradient id="node-glow">
            <stop offset="0%" stopColor="white" stopOpacity="0.9" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
        {edges.map((e, i) => {
          const p1 = positions[e.source]; const p2 = positions[e.target];
          if (!p1 || !p2) return null;
          const isHover = hover && (e.source === hover || e.target === hover);
          return (
            <line
              key={i}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              pathLength="1"
              stroke={isHover ? '#a78bfa' : '#ffffff'}
              strokeOpacity={isHover ? 0.5 : 0.06 + Math.min(e.weight, 5) * 0.03}
              strokeWidth={isHover ? 1.5 : 0.5 + Math.min(e.weight, 4) * 0.25}
              strokeDasharray="1"
              style={{
                animation: `draw-line 0.9s var(--ease-premium) ${Math.min(i * 4, 900)}ms both`,
                transition: 'stroke .3s, stroke-opacity .3s, stroke-width .2s',
              }}
            />
          );
        })}
        {nodes.map((n) => {
          const p = positions[n.id];
          if (!p) return null;
          const s = LAYER_STYLES[n.layer] || LAYER_STYLES.semantic;
          const r = 4 + (n.importance || 5) * 0.7;
          const isHover = hover === n.id;
          return (
            <g key={n.id} transform={`translate(${p.x},${p.y})`}
               onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)}
               className="cursor-pointer"
               style={{ transformOrigin: 'center', animation: 'fade-up-in 0.5s var(--ease-premium) both' }}>
              {n.importance >= 8 && (
                <circle r={r * 1.6} fill="none" stroke={s.color} strokeWidth={1} opacity={0.5} className="animate-pulse-glow" />
              )}
              <circle r={r * 2.4} fill="url(#node-glow)" opacity={isHover ? 0.5 : 0.15} />
              <circle r={r} fill={s.color} opacity={0.95} stroke="rgba(255,255,255,0.4)" strokeWidth={isHover ? 1.5 : 0.5}
                      style={{ transition: 'r .25s var(--ease-spring)' }} />
              {isHover && (
                <g style={{ animation: 'fade-up-in 0.2s var(--ease-soft) both' }}>
                  <rect x={r + 6} y={-10} width={Math.min(n.label.length * 6.2 + 12, 260)} height={20} rx={4}
                        fill="rgba(10,10,15,0.95)" stroke="rgba(255,255,255,0.15)" />
                  <text x={r + 12} y={4} fill="white" fontSize="11" fontFamily="Inter">{n.label.slice(0, 40)}</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 flex-wrap text-[10px]">
        {Object.entries(LAYER_STYLES).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/40 border border-white/5">
            <div className="w-2 h-2 rounded-full" style={{ background: v.color }} />
            <span className="text-white/60">{v.label}</span>
          </div>
        ))}
        <div className="ml-auto text-white/40">{nodes.length} nodes · {edges.length} links</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Second-Brain Chat
// ---------------------------------------------------------------------------
function ChatView() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    if (!input.trim() || busy) return;
    const userMsg = { role: 'user', content: input, id: Math.random().toString(36) };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setBusy(true);
    try {
      const { reply, sessionId: sid, citedMemories } = await api('/chat', {
        method: 'POST',
        body: JSON.stringify({ message: userMsg.content, sessionId }),
      });
      setSessionId(sid);
      setMessages((m) => [...m, { role: 'assistant', content: reply, citedMemories, id: Math.random().toString(36) }]);
    } catch (e) {
      toast.error('Chat failed', { description: e.message });
    } finally {
      setBusy(false);
    }
  };

  const suggestions = [
    'What have I been working on lately?',
    'Summarize my open tasks by priority',
    'What patterns do you see in my mistakes?',
    'Suggest a deep-work block for tomorrow',
  ];

  return (
    <div className="rounded-2xl glass-strong border border-white/10 flex flex-col h-[calc(100vh-140px)] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold">Second Brain</div>
          <div className="text-[11px] text-white/40">Grounded in your memory, not the internet.</div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 border border-white/10 flex items-center justify-center animate-float">
              <Sparkles className="w-6 h-6 text-violet-200" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gradient">Ask your second brain</div>
              <div className="text-sm text-white/40 mt-1">It knows everything you have told it.</div>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-xl">
              {suggestions.map((s) => (
                <button key={s} onClick={() => setInput(s)} className="text-xs px-3 py-1.5 rounded-lg glass border border-white/5 hover:border-white/15 text-white/70 hover:text-white hover-lift">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-4 max-w-3xl mx-auto">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-900/40'
                    : 'glass border border-white/10 text-white/90'
                }`}>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                  {m.role === 'assistant' && m.citedMemories?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/5">
                      <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Sourced from</div>
                      <div className="flex flex-wrap gap-1">
                        {m.citedMemories.map((c) => (
                          <span key={c.id} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/60" style={{ borderColor: (LAYER_STYLES[c.layer]?.color || '#fff') + '30', color: LAYER_STYLES[c.layer]?.color }}>
                            {c.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {busy && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <div className="glass border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-1.5 text-white/60 text-sm">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400" style={{ animation: 'float 1s ease-in-out infinite' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400" style={{ animation: 'float 1s ease-in-out 0.15s infinite' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400" style={{ animation: 'float 1s ease-in-out 0.3s infinite' }} />
                </span>
                Thinking through your memory…
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-white/5">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder="Ask anything about your memory…"
            className="min-h-[52px] max-h-40 resize-none bg-white/[0.03] border-white/10 focus-visible:ring-violet-500/30"
          />
          <Button onClick={send} disabled={busy || !input.trim()} className="press-scale h-[52px] px-5 bg-gradient-to-br from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 border-0 transition-colors duration-300">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analytics view
// ---------------------------------------------------------------------------
function AnalyticsView({ stats }) {
  const layerData = Object.entries(stats?.byLayer || {}).sort((a, b) => b[1] - a[1]);
  const total = stats?.total || 1;
  const days = Object.entries(stats?.last7DaysByDay || {}).sort();
  const maxDay = Math.max(1, ...days.map((d) => d[1]));

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="glass rounded-2xl border border-white/10 p-5 hover-lift">
        <div className="text-[11px] uppercase tracking-wider text-white/40 mb-3">Memory distribution</div>
        <div className="space-y-2.5">
          {layerData.map(([layer, count], i) => {
            const s = LAYER_STYLES[layer] || LAYER_STYLES.semantic;
            const pct = Math.round((count / total) * 100);
            return (
              <div key={layer}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/70">{s.label}</span>
                  <span className="text-white/40 font-mono"><CountUp value={count} /> · <CountUp value={pct} suffix="%" /></span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: s.color }}
                    initial={{ width: 0 }}
                    animate={{ width: pct + '%' }}
                    transition={{ duration: 0.8, delay: 0.1 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }} className="glass rounded-2xl border border-white/10 p-5 hover-lift">
        <div className="text-[11px] uppercase tracking-wider text-white/40 mb-3">Capture velocity · last 7 days</div>
        <div className="flex items-end gap-2 h-40">
          {days.length === 0 && <div className="text-white/30 text-sm">No data yet.</div>}
          {days.map(([d, v], i) => (
            <div key={d} className="flex-1 flex flex-col items-center gap-1.5">
              <motion.div
                className="w-full rounded-t-md bg-gradient-to-t from-violet-600 to-fuchsia-500"
                initial={{ height: 0 }}
                animate={{ height: (v / maxDay) * 100 + '%' }}
                transition={{ duration: 0.6, delay: 0.15 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              />
              <div className="text-[10px] text-white/40 font-mono">{d.slice(5)}</div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} className="glass rounded-2xl border border-white/10 p-5 hover-lift">
        <div className="text-[11px] uppercase tracking-wider text-white/40 mb-2">Focus Score</div>
        <div className="text-4xl font-bold text-gradient-animated"><CountUp value={stats?.completionRate ?? 0} suffix="%" /></div>
        <div className="text-xs text-white/40 mt-1"><CountUp value={stats?.tasksDone ?? 0} /> of <CountUp value={stats?.tasksTotal ?? 0} /> tasks completed</div>
        <Progress value={stats?.completionRate ?? 0} className="mt-4 h-1.5 bg-white/5" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }} className="glass rounded-2xl border border-white/10 p-5 hover-lift">
        <div className="text-[11px] uppercase tracking-wider text-white/40 mb-2">Signal Strength</div>
        <div className="text-4xl font-bold text-gradient-animated"><CountUp value={stats?.avgImportance ?? 0} decimals={1} /><span className="text-lg text-white/40">/10</span></div>
        <div className="text-xs text-white/40 mt-1">Average importance across <CountUp value={stats?.total ?? 0} /> memories</div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------
export default function App() {
  const [view, setView] = useState('today');
  const [captureOpen, setCaptureOpen] = useState(false);
  const [memories, setMemories] = useState([]);
  const [rec, setRec] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const [agents, setAgents] = useState(null);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [stats, setStats] = useState(null);

  const refreshAll = useCallback(async () => {
    try {
      const [m, g, s] = await Promise.all([
        api('/memories?limit=200'),
        api('/graph'),
        api('/stats'),
      ]);
      setMemories(m.memories || []);
      setGraph(g);
      setStats(s);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const refreshRec = useCallback(async () => {
    setRecLoading(true);
    try {
      const r = await api('/next-action');
      setRec(r.recommendation);
    } catch (e) {
      toast.error('Failed to compute next action', { description: e.message });
    } finally {
      setRecLoading(false);
    }
  }, []);

  const refreshAgents = useCallback(async () => {
    setAgentsLoading(true);
    try {
      const r = await api('/agents');
      setAgents(r);
    } catch (e) {
      console.error(e);
    } finally {
      setAgentsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      await refreshAll();
      const check = await api('/memories?limit=1').catch(() => ({ memories: [] }));
      if ((check.memories || []).length === 0) {
        // First time: offer seed
        toast('Welcome to NEXUS', {
          description: 'Your second brain is empty. Seed it with example memories?',
          action: {
            label: 'Seed',
            onClick: async () => {
              toast.loading('Seeding memories with AI classification…', { id: 'seed' });
              try {
                await api('/seed', { method: 'POST' });
                toast.success('Seeded 8 example memories', { id: 'seed' });
                await refreshAll();
                refreshRec();
                refreshAgents();
              } catch (e) {
                toast.error('Seed failed', { id: 'seed', description: e.message });
              }
            },
          },
          duration: 20000,
        });
      } else {
        refreshRec();
        refreshAgents();
      }
    })();
  }, [refreshAll, refreshRec, refreshAgents]);

  // ⌘K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCaptureOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const onCaptured = async () => {
    await refreshAll();
    refreshRec();
    refreshAgents();
  };

  const onDelete = async (id) => {
    await api(`/memories/${id}`, { method: 'DELETE' });
    toast.success('Memory removed');
    await refreshAll();
  };

  const onToggle = async (id) => {
    await api(`/memories/${id}/toggle`, { method: 'PATCH' });
    await refreshAll();
    refreshRec();
  };

  const viewTitle = {
    today: 'Today',
    memory: 'Memory',
    graph: 'Knowledge Graph',
    chat: 'Second Brain',
    agents: 'Agents',
    analytics: 'Analytics',
  }[view];

  const viewSubtitle = {
    today: 'The highest-impact thing for you, right now.',
    memory: 'Every thought, classified, searchable, forever.',
    graph: 'Your ideas, visually connected.',
    chat: 'A conversation with everything you know.',
    agents: 'Autonomous specialists reading your memory.',
    analytics: 'How your mind is compounding.',
  }[view];

  return (
    <div className="ambient-bg min-h-screen flex text-[15px]">
      <Sidebar view={view} setView={setView} stats={stats} />

      <main className="flex-1 min-w-0 h-screen overflow-y-auto scrollbar-thin">
        {/* Top bar */}
        <div className="sticky top-0 z-10 backdrop-blur-xl bg-[#0a0a0f]/70 border-b border-white/5">
          <div className="px-8 py-4 flex items-center justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-semibold">{viewTitle}</div>
                <div className="text-sm text-white/60 mt-0.5">{viewSubtitle}</div>
              </motion.div>
            </AnimatePresence>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCaptureOpen(true)}
                variant="outline"
                className="press-scale glass border-white/10 hover:border-white/20 hover:bg-white/5 gap-2 transition-colors duration-300"
              >
                <CommandIcon className="w-3.5 h-3.5" />
                Capture
                <kbd className="ml-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[10px] text-white/50">⌘K</kbd>
              </Button>
            </div>
          </div>
        </div>

        <div className="px-8 py-8 max-w-6xl mx-auto space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {view === 'today' && (
                <div className="space-y-6">
                  <NextActionHero rec={rec} loading={recLoading} onRefresh={refreshRec} />
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                        <Wand2 className="w-4 h-4 text-violet-300" />
                        Agent recommendations
                      </h2>
                      <motion.button whileHover={{ rotate: 45 }} whileTap={{ scale: 0.92 }} onClick={refreshAgents} className="text-xs text-white/40 hover:text-white flex items-center gap-1.5">
                        <RefreshCw className={`w-3 h-3 ${agentsLoading ? 'animate-spin' : ''}`} /> Refresh
                      </motion.button>
                    </div>
                    <AgentCards agents={agents} loading={agentsLoading} />
                  </div>
                </div>
              )}
              {view === 'memory' && <MemoryFeed memories={memories} onDelete={onDelete} onToggle={onToggle} />}
              {view === 'graph' && <KnowledgeGraph nodes={graph.nodes} edges={graph.edges} />}
              {view === 'chat' && <ChatView />}
              {view === 'agents' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-white/60 max-w-xl">
                      Five specialist agents read your memory through different lenses and coordinate on what matters most.
                    </div>
                    <motion.button whileHover={{ rotate: 45 }} whileTap={{ scale: 0.92 }} onClick={refreshAgents} className="text-xs text-white/40 hover:text-white flex items-center gap-1.5">
                      <RefreshCw className={`w-3 h-3 ${agentsLoading ? 'animate-spin' : ''}`} /> Refresh
                    </motion.button>
                  </div>
                  <AgentCards agents={agents} loading={agentsLoading} />
                </div>
              )}
              {view === 'analytics' && <AnalyticsView stats={stats} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <CapturePalette open={captureOpen} setOpen={setCaptureOpen} onCaptured={onCaptured} />

      {/* Floating capture button (mobile) */}
      <motion.button
        onClick={() => setCaptureOpen(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-6 right-6 md:hidden w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-2xl shadow-violet-900/50 flex items-center justify-center animate-ring-pulse"
      >
        <Plus className="w-5 h-5 text-white" />
      </motion.button>
    </div>
  );
}
