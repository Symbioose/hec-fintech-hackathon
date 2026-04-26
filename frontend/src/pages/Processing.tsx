import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { checkBackend, geminiAvailable, type BackendStatus } from "@/lib/gemini";
import { getAMRecommendations, getBackendProductCount } from "@/lib/api";

/* ─── Agents ──────────────────────────────────────────────────────────── */
interface Step { t: number; progress: number; status: string; }

interface AgentDef {
  initials: string;
  name: string;
  subtitle: string;
  accentColor: string;
  result: string;
  steps: Step[];
}

const AGENTS: AgentDef[] = [
  {
    initials: "BNP",
    name: "BNP Paribas EM",
    subtitle: "PDF · Indicative term sheet",
    accentColor: "#ffffff",
    result: "4 products extracted",
    steps: [
      { t: 0,    progress: 4,   status: "Connecting agent..." },
      { t: 800,  progress: 22,  status: "Reading document..." },
      { t: 2200, progress: 51,  status: "Extracting structured terms..." },
      { t: 3900, progress: 78,  status: "Matching against mandate..." },
      { t: 5500, progress: 100, status: "4 products extracted" },
    ],
  },
  {
    initials: "GS",
    name: "Goldman Sachs SP",
    subtitle: "Bloomberg MSG · Sales note",
    accentColor: "#b0b0b0",
    result: "2 products extracted",
    steps: [
      { t: 0,    progress: 4,   status: "Connecting agent..." },
      { t: 1300, progress: 16,  status: "Reading document..." },
      { t: 3000, progress: 47,  status: "Extracting structured terms..." },
      { t: 5200, progress: 80,  status: "Matching against mandate..." },
      { t: 8000, progress: 100, status: "2 products extracted" },
    ],
  },
  {
    initials: "SGN",
    name: "SocGen SP Desk",
    subtitle: "Email · Weekly outlook",
    accentColor: "#7a7a7a",
    result: "6 products extracted",
    steps: [
      { t: 0,    progress: 4,   status: "Connecting agent..." },
      { t: 600,  progress: 28,  status: "Reading document..." },
      { t: 1900, progress: 55,  status: "Extracting structured terms..." },
      { t: 3600, progress: 82,  status: "Matching against mandate..." },
      { t: 5100, progress: 100, status: "6 products extracted" },
    ],
  },
];

const DONE_TIME = 8500;
const BUTTON_TIME = 9300;

interface AgentState { progress: number; status: string; done: boolean; }

/* ─── Activity Log ────────────────────────────────────────────────────── */
type LogEntry = { t: number; agent: string; text: string; color?: string };

function buildLogTimeline(): LogEntry[] {
  const log: LogEntry[] = [];
  AGENTS.forEach((agent) => {
    agent.steps.forEach((step, i) => {
      log.push({
        t: step.t + (i === 0 ? 100 : 50),
        agent: agent.initials,
        text: step.status,
        color: i === agent.steps.length - 1 ? agent.accentColor : undefined,
      });
    });
  });
  log.push({ t: 2100, agent: "ROUTER", text: "Loading mandate constraints (8 rules)..." });
  log.push({ t: 6300, agent: "ROUTER", text: "Cross-checking proposals against mandate...", color: "var(--c-text2)" });
  log.push({ t: 7800, agent: "ROUTER", text: "Auto-rejecting mandate breaches...", color: "var(--c-reject)" });
  log.push({ t: 8200, agent: "ROUTER", text: "Generating gap analysis for near-misses...", color: "var(--c-gap)" });
  return log.sort((a, b) => a.t - b.t);
}

const LOG_TIMELINE = buildLogTimeline();

interface LiveStats {
  total: number;
  match: number;
  nearMiss: number;
  rejected: number;
}

/* ─── Component ───────────────────────────────────────────────────────── */
export default function Processing() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<AgentState[]>(
    AGENTS.map(() => ({ progress: 4, status: "Connecting agent...", done: false })),
  );
  const [log, setLog] = useState<LogEntry[]>([]);
  const [phase, setPhase] = useState<"init" | "matching" | "done">("init");
  const [showButton, setShowButton] = useState(false);
  const [tick, setTick] = useState(0);
  const [backend, setBackend] = useState<BackendStatus | null>(null);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const startRef = useRef(Date.now());
  const logEndRef = useRef<HTMLDivElement | null>(null);

  // Check backend health and fetch real scoring data
  useEffect(() => {
    checkBackend().then(setBackend);

    // Fetch real recommendations from the backend for Carmignac (am-001)
    getAMRecommendations("am-001").then((recs) => {
      if (!recs) return;
      const match    = recs.filter((r) => !r.hard_fail && r.score >= 78).length;
      const nearMiss = recs.filter((r) => !r.hard_fail && r.score >= 50 && r.score < 78).length;
      const rejected = recs.filter((r) => r.hard_fail || r.score < 50).length;
      setLiveStats({ total: recs.length, match, nearMiss, rejected });
    });

    // Also verify seeded product count for the log
    getBackendProductCount().then((count) => {
      if (!count) return;
      setLog((prev) => [
        ...prev,
        {
          t: 0,
          agent: "API",
          text: `Backend connected — ${count} products in mandate scope`,
          color: "var(--c-teal)",
        },
      ]);
    });
  }, []);

  // Tick counter for elapsed time
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, []);

  // Animate agents + log
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    AGENTS.forEach((agent, idx) => {
      agent.steps.forEach((step, si) => {
        const isLast = si === agent.steps.length - 1;
        timers.push(
          setTimeout(() => {
            setAgents((prev) => {
              const next = [...prev];
              next[idx] = {
                progress: step.progress,
                status: step.status,
                done: isLast,
              };
              return next;
            });
          }, step.t),
        );
      });
    });

    LOG_TIMELINE.forEach((entry) => {
      timers.push(
        setTimeout(() => {
          setLog((prev) => [...prev, entry]);
        }, entry.t),
      );
    });

    timers.push(setTimeout(() => setPhase("matching"), 2000));
    timers.push(setTimeout(() => {
      setPhase("done");
      // Append final summary line using real stats if available
      setLog((prev) => {
        const stats = liveStats;
        const summary = stats
          ? `Analysis complete: ${stats.match} match · ${stats.nearMiss} near-miss · ${stats.rejected} rejected`
          : "Analysis complete: 5 match · 6 near-miss · 1 rejected";
        return [
          ...prev,
          { t: DONE_TIME, agent: "ROUTER", text: summary, color: "var(--c-text)" },
        ];
      });
    }, DONE_TIME));
    timers.push(setTimeout(() => setShowButton(true), BUTTON_TIME));

    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [log.length]);

  const elapsed = ((Date.now() - startRef.current) / 1000).toFixed(1);
  const allDone = phase === "done";

  // Displayed stats: real backend data if available, fallback to dataset defaults
  const displayStats = liveStats ?? { total: 12, match: 5, nearMiss: 6, rejected: 1 };
  const statsFromBackend = liveStats !== null;

  return (
    <div
      style={{
        flex: 1,
        background: "var(--c-bg)",
        color: "var(--c-text)",
        fontFamily: "JetBrains Mono, monospace",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          padding: "10px 18px",
          borderBottom: "1px solid var(--c-border)",
          background: "var(--c-amber-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11 }}>
          <span style={{ color: "var(--c-amber)", fontWeight: 700 }}>
            {allDone ? "ANALYSIS COMPLETE" : "BATCH INGESTION"}
          </span>
          <span style={{ color: "var(--c-amber-dim)" }}>·</span>
          <span style={{ color: "var(--c-text3)" }}>
            3 sources · {displayStats.total} proposals · 8 mandate constraints
          </span>
          <span
            style={{
              fontSize: 8,
              fontWeight: 700,
              color: "var(--c-text3)",
              background: "var(--c-bg3)",
              border: "1px solid var(--c-border2)",
              padding: "1px 6px",
              borderRadius: 2,
              letterSpacing: "0.1em",
            }}
          >
            OVERNIGHT BATCH · SCHEDULED 02:00 CET
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 10 }}>
          <span style={{ color: "var(--c-text3)" }}>
            ELAPSED <span style={{ color: "var(--c-amber)" }}>{elapsed}s</span>
          </span>
          {!allDone && (
            <span
              className="animate-blink"
              style={{ color: "var(--c-amber)", fontWeight: 700, letterSpacing: "0.08em" }}
            >
              ● RUNNING
            </span>
          )}
          {allDone && (
            <span style={{ color: "var(--c-teal)", fontWeight: 700, letterSpacing: "0.08em" }}>
              ● DONE
            </span>
          )}
        </div>
      </div>

      {/* Main 2-column layout */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.4fr 1fr", overflow: "hidden", minHeight: 0 }}>
        {/* LEFT: Agent panels */}
        <div
          style={{
            borderRight: "1px solid var(--c-border)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "8px 18px",
              borderBottom: "1px solid var(--c-border)",
              background: "var(--c-bg1)",
              fontSize: 9,
              color: "var(--c-text3)",
              letterSpacing: "0.12em",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            AGENTS
          </div>
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}
          >
            {AGENTS.map((agent, idx) => (
              <AgentCard key={agent.initials} agent={agent} state={agents[idx]} />
            ))}
          </div>

          {/* Bottom CTA */}
          <div
            style={{
              padding: "12px 18px",
              borderTop: "1px solid var(--c-border)",
              background: "var(--c-bg1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 16, fontSize: 10 }}>
                <Stat label="MATCH"     value={String(displayStats.match)}    color="var(--c-match)"  pending={!allDone} />
                <Stat label="NEAR-MISS" value={String(displayStats.nearMiss)} color="var(--c-gap)"    pending={!allDone} />
                <Stat label="REJECTED"  value={String(displayStats.rejected)} color="var(--c-reject)" pending={!allDone} />
                <Stat label="TOTAL"     value={String(displayStats.total)}    color="var(--c-text)"   pending={!allDone} />
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 8, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.06em" }}>
                <span style={{ color: geminiAvailable ? "var(--c-match)" : "var(--c-text3)" }}>
                  {geminiAvailable ? "✓ GEMINI" : "○ GEMINI"}
                </span>
                <span style={{ color: backend?.online ? "var(--c-match)" : "var(--c-text3)" }}>
                  {backend === null ? "… API" : backend.online ? "✓ BACKEND LIVE" : "○ BACKEND OFFLINE"}
                </span>
                {backend?.online && (
                  <span style={{ color: "var(--c-text3)" }}>
                    FAISS {backend.indicesBuilt ? "✓" : "building…"}
                  </span>
                )}
                {allDone && statsFromBackend && (
                  <span style={{ color: "var(--c-teal)" }}>✓ LIVE SCORES</span>
                )}
              </div>
            </div>
            {showButton && (
              <button
                onClick={() => navigate("/")}
                className="animate-slide-up"
                style={{
                  padding: "7px 16px",
                  background: "var(--c-amber)",
                  border: "none",
                  borderRadius: 2,
                  color: "#000",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "JetBrains Mono, monospace",
                  letterSpacing: "0.04em",
                }}
              >
                VIEW RESULTS →
              </button>
            )}
          </div>
        </div>

        {/* RIGHT: Activity log */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--c-bg)" }}>
          <div
            style={{
              padding: "8px 18px",
              borderBottom: "1px solid var(--c-border)",
              background: "var(--c-bg1)",
              fontSize: 9,
              color: "var(--c-text3)",
              letterSpacing: "0.12em",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <span>ACTIVITY LOG</span>
            <span style={{ color: "var(--c-text3)", fontWeight: 400, letterSpacing: "0.04em" }}>
              {log.length} events
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
            {log.map((entry, i) => (
              <LogLine key={i} entry={entry} index={i} />
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Agent Card ──────────────────────────────────────────────────────── */
function AgentCard({ agent, state }: { agent: AgentDef; state: AgentState }) {
  return (
    <div
      style={{
        padding: "14px 18px",
        borderBottom: "1px solid var(--c-border)",
        background: state.done ? "var(--c-bg1)" : "transparent",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 2,
            background: `color-mix(in srgb, ${agent.accentColor} 12%, transparent)`,
            border: `1px solid ${agent.accentColor}`,
            color: agent.accentColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "JetBrains Mono, monospace",
            letterSpacing: "0.04em",
          }}
        >
          {agent.initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--c-text)",
              fontFamily: "JetBrains Mono, monospace",
              marginBottom: 2,
            }}
          >
            {agent.name}
          </div>
          <div style={{ fontSize: 9, color: "var(--c-text3)", letterSpacing: "0.04em" }}>
            {agent.subtitle.toUpperCase()}
          </div>
        </div>
        {state.done && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "var(--c-teal)",
              letterSpacing: "0.08em",
              background: "var(--c-teal-bg)",
              border: "1px solid rgba(0,201,167,0.4)",
              padding: "2px 6px",
              borderRadius: 2,
            }}
          >
            ✓ DONE
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 3,
          width: "100%",
          background: "var(--c-bg3)",
          marginBottom: 8,
          position: "relative",
        }}
      >
        <div
          style={{
            height: "100%",
            background: state.done ? "var(--c-teal)" : agent.accentColor,
            width: `${state.progress}%`,
            transition: "width 0.7s ease-out, background 0.3s",
          }}
        />
      </div>

      {/* Status + percent */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          style={{
            fontSize: 10,
            color: state.done ? "var(--c-teal)" : "var(--c-text2)",
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          {state.done ? `→ ${state.status}` : state.status}
        </span>
        <span
          style={{
            fontSize: 10,
            color: state.done ? "var(--c-teal)" : agent.accentColor,
            fontFamily: "JetBrains Mono, monospace",
            fontWeight: 600,
          }}
        >
          {state.progress.toString().padStart(3, " ")}%
        </span>
      </div>
    </div>
  );
}

/* ─── Activity log line ───────────────────────────────────────────────── */
function LogLine({ entry, index }: { entry: LogEntry; index: number }) {
  const ts = (entry.t / 1000).toFixed(2).padStart(6, "0");
  return (
    <div
      className="animate-fade-in"
      style={{
        display: "grid",
        gridTemplateColumns: "70px 60px 1fr",
        gap: 10,
        padding: "3px 18px",
        fontSize: 10,
        fontFamily: "JetBrains Mono, monospace",
        lineHeight: 1.5,
      }}
    >
      <span style={{ color: "var(--c-text3)" }}>+{ts}s</span>
      <span
        style={{
          color: "var(--c-amber)",
          fontWeight: 600,
          letterSpacing: "0.04em",
        }}
      >
        [{entry.agent}]
      </span>
      <span style={{ color: entry.color ?? "var(--c-text2)" }}>{entry.text}</span>
    </div>
  );
}

/* ─── Stat ────────────────────────────────────────────────────────────── */
function Stat({
  label, value, color, pending,
}: {
  label: string; value: string; color: string; pending: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: pending ? "var(--c-text3)" : color,
          fontFamily: "JetBrains Mono, monospace",
          transition: "color 0.4s",
        }}
      >
        {pending ? "—" : value}
      </span>
      <span
        style={{
          fontSize: 8,
          color: "var(--c-text3)",
          letterSpacing: "0.12em",
          fontWeight: 700,
        }}
      >
        {label}
      </span>
    </div>
  );
}
