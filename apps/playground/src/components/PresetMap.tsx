import { useEffect, useMemo, useRef, useState } from "react";
import { textDslToDiagram } from "@cardenelabs/dragon";
import { CdlDiagramView, type CdlDiagram } from "@cardenelabs/cdl";

type PresetNode = {
  id: string;
  label: string;
  icon: string;
  cluster: "basic" | "domain" | "extended";
  x: number; // 0-100 (% of canvas)
  y: number;
  description: string;
  sampleDsl: string;
};

const PRESETS: PresetNode[] = [
  // basic cluster (top, 6 preset)
  {
    id: "sequence",
    label: "sequence",
    icon: "↔",
    cluster: "basic",
    x: 20, y: 24,
    description: "UML sequence (actor + msg)。 mermaid sequenceDiagram と同等。",
    sampleDsl: `title: "sequence demo"
type: sequence

actors:
  - Client
  - API
  - DB

flow:
  - Client -> API: "request"
  - API -> DB: "query"
  - DB -> API: "result" (success)
  - API -> Client: "response" (success)
`,
  },
  {
    id: "flow",
    label: "flow",
    icon: "↓",
    cluster: "basic",
    x: 35, y: 12,
    description: "flowchart (縦並び step)。 step ごとの遷移を視覚化。",
    sampleDsl: `title: "auth flow"
type: flow

actors:
  - Start: { kind: event }
  - Verify: { kind: function }
  - End: { kind: event }

flow:
  - Start -> Verify: "input"
  - Verify -> End: "ok" (success)
`,
  },
  {
    id: "swimlane",
    label: "swimlane",
    icon: "∥",
    cluster: "basic",
    x: 65, y: 12,
    description: "actor 別 lane に分ける sequence。 責任分担が明確。",
    sampleDsl: `title: "checkout"
type: swimlane

actors:
  - User
  - Cart: { kind: service }
  - Payment: { kind: api }

flow:
  - User -> Cart: "add item"
  - Cart -> Payment: "charge"
  - Payment -> User: "receipt" (success)
`,
  },
  {
    id: "topology",
    label: "topology",
    icon: "◌",
    cluster: "basic",
    x: 80, y: 24,
    description: "system 配置図。 server / db / cache の network を描く。",
    sampleDsl: `title: "system"
type: topology

actors:
  - LB: { kind: cloud }
  - Web: { kind: service }
  - DB: { kind: database }

flow:
  - LB -> Web: "route"
  - Web -> DB: "query"
`,
  },
  {
    id: "er",
    label: "er",
    icon: "▢",
    cluster: "basic",
    x: 26, y: 38,
    description: "ER 図 (entity + relation + cardinality)。 DB schema 視覚化。",
    sampleDsl: `title: "User-Order ER"
type: er

actors:
  - User: { kind: entity, rows: ["id: PK", "email"] }
  - Order: { kind: entity, rows: ["id: PK", "userId: FK"] }

flow:
  - User -> Order: "places" { cardinality: "1:N" }
`,
  },
  {
    id: "state",
    label: "state",
    icon: "⊙",
    cluster: "basic",
    x: 74, y: 38,
    description: "state machine (initial / final / transition)。",
    sampleDsl: `title: "auth FSM"
type: state

actors:
  - Idle: { kind: state, initial: true }
  - Loading: { kind: state }
  - Done: { kind: state, final: true }

flow:
  - Idle -> Loading: "submit"
  - Loading -> Done: "ok" (success)
`,
  },
  // domain cluster (left, 1 preset)
  {
    id: "code",
    label: "code",
    icon: "◆",
    cluster: "domain",
    x: 32, y: 84,
    description: "アプリケーションの code path 専用。 actor / function / storage / event を自動 sort。",
    sampleDsl: `title: "Service handler"
type: code

actors:
  - Client: { kind: actor }
  - Server: { kind: function }
  - DB: { kind: storage }

states:
  count: 100

flow:
  - Client -> Server: "POST /orders"
  - Server -> DB: "UPDATE"

animation:
  - step: "call" 1.2s
    focus: [Client, Server]
  - step: "storage" 1.5s
    focus: [Server, DB]
    tween:
      count: 100 -> 99
`,
  },
  // extended cluster (right, 5 preset)
  {
    id: "gantt",
    label: "gantt",
    icon: "▬",
    cluster: "extended",
    x: 92, y: 48,
    description: "timeline 横棒。 task の期間 / 依存を視覚化。",
    sampleDsl: `title: "Q1-Q4 roadmap"
type: gantt

actors:
  - Design: { subtitle: "Q1" }
  - Build: { subtitle: "Q2" }
  - Test: { subtitle: "Q3" }
  - Ship: { subtitle: "Q4" }
`,
  },
  {
    id: "class",
    label: "class",
    icon: "▤",
    cluster: "extended",
    x: 58, y: 68,
    description: "UML class (fields + methods)。 OOP design 視覚化。",
    sampleDsl: `title: "User class"
type: class

actors:
  - User: { rows: ["+name: string", "+email: string", "+login(): void"] }
  - Admin: { rows: ["+permissions: string[]", "+banUser(): void"] }

flow:
  - Admin -> User: "extends"
`,
  },
  {
    id: "pie",
    label: "pie",
    icon: "◐",
    cluster: "extended",
    x: 90, y: 70,
    description: "円グラフ。 value + label で割合を表現。",
    sampleDsl: `title: "Market share"
type: pie

actors:
  - A: { value: "45%" }
  - B: { value: "30%" }
  - C: { value: "25%" }
`,
  },
  {
    id: "c4",
    label: "c4",
    icon: "▣",
    cluster: "extended",
    x: 62, y: 84,
    description: "C4 model 階層 (system / container / component)。",
    sampleDsl: `title: "C4 context"
type: c4

actors:
  - User: { kind: person, subtitle: "L1" }
  - System: { kind: service, subtitle: "L1" }
  - DB: { kind: database, subtitle: "L2" }

flow:
  - User -> System: "use"
  - System -> DB: "query"
`,
  },
  {
    id: "mind",
    label: "mind",
    icon: "✺",
    cluster: "extended",
    x: 88, y: 80,
    description: "mind map (中央 root + 放射)。 思考整理 / brainstorm。",
    sampleDsl: `title: "Project ideas"
type: mind

actors:
  - root: { title: "Project" }
  - features: { title: "Features" }
  - design: { title: "Design" }
  - launch: { title: "Launch" }
`,
  },
];

const CLUSTER_STROKE: Record<PresetNode["cluster"], string> = {
  basic: "#2d6a8f",
  domain: "#c2410c",
  extended: "#6d28d9",
};

// cluster head 配置 + tier-1 制御点を 1 箇所に集約 (PRESETS の coords 同様、 SSOT)
const CLUSTER_LAYOUT: Record<
  PresetNode["cluster"],
  { x: number; y: number; label: string; glyph: string; tier1d: string }
> = {
  basic: { x: 50, y: 24, label: "basic", glyph: "B", tier1d: "M 50 50 C 48 42, 49 32, 50 24" },
  domain: { x: 22, y: 72, label: "domain", glyph: "D", tier1d: "M 50 50 C 40 58, 30 66, 22 72" },
  extended: { x: 78, y: 60, label: "extended", glyph: "E", tier1d: "M 50 50 C 62 52, 72 56, 78 60" },
};

export function PresetMap(): React.JSX.Element {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ tx: 0, ty: 0, scale: 1 });
  const dragRef = useRef({ active: false, x: 0, y: 0, tx: 0, ty: 0 });
  const [selected, setSelected] = useState<PresetNode | null>(null);
  const [diagram, setDiagram] = useState<CdlDiagram | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return PRESETS;
    const q = search.toLowerCase();
    return PRESETS.filter((p) => p.id.includes(q) || p.label.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }, [search]);

  // filter 後に preset を持つ cluster だけ tier-1 edge + head を render する用
  const countsByCluster = useMemo(() => {
    const m: Record<PresetNode["cluster"], number> = { basic: 0, domain: 0, extended: 0 };
    for (const p of filtered) m[p.cluster]++;
    return m;
  }, [filtered]);
  const visibleClusters = useMemo(
    () => (Object.keys(CLUSTER_LAYOUT) as PresetNode["cluster"][]).filter((c) => countsByCluster[c] > 0),
    [countsByCluster]
  );

  // node click → diagram render
  useEffect(() => {
    if (!selected) {
      // selected 変化に derived state (diagram) を同期する legitimate pattern。 [selected]
      // deps で cascading render なし。
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDiagram(null);
      return;
    }
    try {
      const d = textDslToDiagram(selected.sampleDsl);
      setDiagram(d);
    } catch {
      setDiagram(null);
    }
  }, [selected]);

  // wheel zoom
  const onWheel = (e: React.WheelEvent): void => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setTransform((t) => {
      const newScale = Math.max(0.4, Math.min(4, t.scale + delta));
      const factor = newScale / t.scale;
      return {
        tx: mx - (mx - t.tx) * factor,
        ty: my - (my - t.ty) * factor,
        scale: newScale,
      };
    });
  };

  const onMouseDown = (e: React.MouseEvent): void => {
    const t = e.target as HTMLElement;
    if (t.closest(".node") || t.closest(".cluster-head")) return;
    dragRef.current = { active: true, x: e.clientX, y: e.clientY, tx: transform.tx, ty: transform.ty };
  };
  const onMouseMove = (e: React.MouseEvent): void => {
    if (!dragRef.current.active) return;
    setTransform((t) => ({
      ...t,
      tx: dragRef.current.tx + (e.clientX - dragRef.current.x),
      ty: dragRef.current.ty + (e.clientY - dragRef.current.y),
    }));
  };
  const onMouseUp = (): void => {
    dragRef.current.active = false;
  };

  const reset = (): void => setTransform({ tx: 0, ty: 0, scale: 1 });
  const zoomIn = (): void => setTransform((t) => ({ ...t, scale: Math.min(4, t.scale + 0.2) }));
  const zoomOut = (): void => setTransform((t) => ({ ...t, scale: Math.max(0.4, t.scale - 0.2) }));

  return (
    <div className="map-root">
      <div
        ref={canvasRef}
        className="map-canvas"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <div
          className="map-inner"
          style={{ transform: `translate(${transform.tx}px, ${transform.ty}px) scale(${transform.scale})` }}
        >
          {/* cluster zones (head + 各 preset を囲む) */}
          <div className="cluster-zone cluster-basic" style={{ left: "10%", top: "4%", width: "80%", height: "44%" }}></div>
          <div className="cluster-zone cluster-domain" style={{ left: "12%", top: "62%", width: "22%", height: "34%" }}></div>
          <div className="cluster-zone cluster-extended" style={{ left: "54%", top: "38%", width: "44%", height: "50%" }}></div>

          {/* hierarchy edges: dragon (50,50) → cluster head → 各 preset、 filter で head ごと連動 */}
          <svg className="edges" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Tier 1: dragon → cluster head */}
            {visibleClusters.map((c) => (
              <path key={`tier1-${c}`} className={`edge-path edge-${c} edge-tier1`} d={CLUSTER_LAYOUT[c].tier1d} />
            ))}

            {/* Tier 2: cluster head → preset nodes */}
            {filtered.map((p) => {
              const head = CLUSTER_LAYOUT[p.cluster];
              const cx = (head.x + p.x) / 2;
              const cy = (head.y + p.y) / 2;
              return (
                <path
                  key={`edge-${p.id}`}
                  className={`edge-path edge-${p.cluster}`}
                  d={`M ${head.x} ${head.y} C ${cx} ${cy}, ${(p.x + cx) / 2} ${(p.y + cy) / 2}, ${p.x} ${p.y}`}
                />
              );
            })}
          </svg>

          {/* cluster head nodes (filter 連動、 装飾用 pointer-events:none) */}
          {visibleClusters.map((c) => {
            const head = CLUSTER_LAYOUT[c];
            const n = countsByCluster[c];
            return (
              <div
                key={`head-${c}`}
                className={`cluster-head head-${c}`}
                style={{ left: `${head.x}%`, top: `${head.y}%` }}
              >
                <div className={`head-glyph head-${c}-glyph`}>{head.glyph}</div>
                <div className="head-label">{head.label}</div>
                <div className="head-meta">{n} {n === 1 ? "preset" : "presets"}</div>
              </div>
            );
          })}

          {/* center dragon */}
          <div className="node node-center" style={{ left: "50%", top: "50%" }}>
            <div className="center-glyph">
              <svg viewBox="0 0 24 24" fill="none"><path d="M3 21 L21 3 L21 21 Z" fill="#fff" /></svg>
            </div>
            <div className="center-title">dragon</div>
            <div className="center-meta">animated diagram dsl</div>
            <button className="center-btn" onClick={() => (window.location.href = "/editor")}>
              open editor →
            </button>
          </div>

          {/* preset nodes */}
          {filtered.map((p) => (
            <div
              key={p.id}
              className={`node node-${p.cluster} ${selected?.id === p.id ? "node-selected" : ""}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              onClick={() => setSelected(p)}
            >
              <div className="node-head">
                <div className={`node-icon icon-${p.cluster}`}>
                  <PresetIcon id={p.id} />
                </div>
                <div className="node-label">{p.label}</div>
              </div>
              <div className="node-desc">{p.description.split("。")[0]}。</div>
              <div className="node-tag">type: {p.id}</div>
            </div>
          ))}
        </div>
      </div>

      {/* search bar */}
      <div className="map-search">
        <input
          type="text"
          placeholder="🔍 preset を検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* zoom controls */}
      <div className="map-controls">
        <button onClick={zoomIn} title="zoom in">+</button>
        <button onClick={zoomOut} title="zoom out">−</button>
        <button onClick={reset} title="reset">⌖</button>
        <div className="map-zoom-display">{Math.round(transform.scale * 100)}%</div>
      </div>

      {/* minimap (hierarchy + filter 連動 + viewport は pan/zoom 反映) */}
      <div className="map-minimap">
        <div className="minimap-head">
          <span>overview</span>
          <span className="live-dot"></span>
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* cluster zone outlines */}
          <rect x="10" y="4" width="80" height="44" rx="3" fill="rgba(45,106,143,0.06)" stroke="rgba(45,106,143,0.3)" strokeWidth="0.4" strokeDasharray="1 1" />
          <rect x="12" y="62" width="22" height="34" rx="3" fill="rgba(194,65,12,0.06)" stroke="rgba(194,65,12,0.3)" strokeWidth="0.4" strokeDasharray="1 1" />
          <rect x="54" y="38" width="44" height="50" rx="3" fill="rgba(109,40,217,0.06)" stroke="rgba(109,40,217,0.3)" strokeWidth="0.4" strokeDasharray="1 1" />
          {/* cluster head marker (visible のみ) */}
          {visibleClusters.map((c) => {
            const h = CLUSTER_LAYOUT[c];
            return <rect key={`mini-head-${c}`} x={h.x - 2.5} y={h.y - 2.5} width="5" height="5" rx="1" fill={CLUSTER_STROKE[c]} opacity="0.85" />;
          })}
          {/* preset nodes (filter 後のみ) */}
          {filtered.map((p) => (
            <circle key={p.id} cx={p.x} cy={p.y} r={p.cluster === "domain" ? 1.8 : 1.5} fill={CLUSTER_STROKE[p.cluster]} />
          ))}
          {/* center dragon */}
          <rect x="46" y="46" width="8" height="8" rx="1.5" fill="#0a0e1a" />
          {/* viewport rect (pan/zoom 反映、 inverse transform で表示領域を計算) */}
          {(() => {
            const s = transform.scale;
            // canvas 全体は 0-100 の世界座標。 viewport は inner の transform を逆算。
            // 表示領域の世界座標 = (0 - tx)/s, (canvasW - tx)/s に相当するが viewBox は %、 簡略化 ... canvas 100% を s で割って tx/canvasW% 引く。
            const vw = 100 / s;
            const vh = 100 / s;
            const vx = -transform.tx / s / 6;   // tx px → canvas % へは canvas 幅依存、 概算で /6 (rough)
            const vy = -transform.ty / s / 6;
            return (
              <rect
                x={Math.max(0, Math.min(100 - vw, vx))}
                y={Math.max(0, Math.min(100 - vh, vy))}
                width={Math.min(100, vw)}
                height={Math.min(100, vh)}
                fill="none"
                stroke="#2d6a8f"
                strokeWidth="0.6"
                rx="2"
                opacity="0.5"
              />
            );
          })()}
        </svg>
      </div>

      {/* detail modal */}
      {selected && diagram && (
        <div className="map-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="map-modal" onClick={(e) => e.stopPropagation()}>
            <button className="map-modal-close" onClick={() => setSelected(null)} aria-label="close">×</button>
            <div className="map-modal-head">
              <div className={`map-modal-icon icon-${selected.cluster}`}>
                <PresetIcon id={selected.id} />
              </div>
              <div>
                <h2>{selected.label}</h2>
                <span className="map-modal-meta">type: {selected.id} · cluster: {selected.cluster}</span>
              </div>
            </div>
            <p className="map-modal-desc">{selected.description}</p>
            <div className="map-modal-preview">
              <CdlDiagramView diagram={diagram} />
            </div>
            <div className="map-modal-actions">
              <a
                href={`/editor#s=${typeof window !== "undefined" ? btoa(unescape(encodeURIComponent(selected.sampleDsl))) : ""}`}
                className="map-modal-btn primary"
              >
                edit this preset →
              </a>
              <a href={`/docs/cdl/presets/${selected.id}`} className="map-modal-btn ghost">
                read docs
              </a>
            </div>
          </div>
        </div>
      )}

      {/* stats (filter 連動) */}
      <div className="map-stats">
        {(Object.keys(CLUSTER_LAYOUT) as PresetNode["cluster"][]).map((c) => (
          <div key={c} className={`stat-pill ${c}`}>
            <span className="dot"></span>
            <span className="num">{countsByCluster[c]}</span>
            {c}
          </div>
        ))}
      </div>

      {/* hint */}
      <div className="map-hint">
        <div className="hint-row"><kbd>⌘</kbd>scroll · zoom</div>
        <div className="hint-row"><kbd>drag</kbd>pan · canvas</div>
        <div className="hint-row"><kbd>click</kbd>preview · node</div>
      </div>
    </div>
  );
}

// SVG icon per preset
function PresetIcon({ id }: { id: string }): React.JSX.Element {
  const props = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const };
  switch (id) {
    case "sequence":
      return <svg {...props}><path d="M3 12h18M3 12l4-4M3 12l4 4M21 12l-4-4M21 12l-4 4" /></svg>;
    case "flow":
      return <svg {...props}><path d="M12 3v18M12 21l-4-4M12 21l4-4" /></svg>;
    case "swimlane":
      return <svg {...props}><path d="M6 3v18M12 3v18M18 3v18" /></svg>;
    case "topology":
      return <svg {...props} strokeLinecap="butt"><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" /><circle cx="12" cy="18" r="3" /><path d="m8 8 8 0M8 8l4 7M16 8l-4 7" strokeLinecap="round" /></svg>;
    case "er":
      return <svg {...props} strokeLinecap="butt"><rect x="3" y="4" width="8" height="6" rx="1" /><rect x="13" y="14" width="8" height="6" rx="1" /><path d="M11 7h2v7" strokeLinecap="round" /></svg>;
    case "state":
      return <svg {...props} strokeLinecap="butt"><circle cx="6" cy="12" r="3" /><circle cx="18" cy="12" r="3" /><path d="M9 12h6" strokeLinecap="round" /></svg>;
    case "code":
      return <svg {...props} strokeLinejoin="round"><path d="M12 2 L20 10 L12 22 L4 10 Z" /></svg>;
    case "gantt":
      return <svg {...props}><rect x="3" y="6" width="8" height="3" rx="1.5" /><rect x="8" y="11" width="10" height="3" rx="1.5" /><rect x="6" y="16" width="12" height="3" rx="1.5" /></svg>;
    case "class":
      return <svg {...props} strokeLinecap="butt"><rect x="4" y="4" width="16" height="16" rx="1" /><path d="M4 10h16M4 15h16" strokeLinecap="round" /></svg>;
    case "pie":
      return <svg {...props} strokeLinecap="butt"><circle cx="12" cy="12" r="9" /><path d="M12 3 v9 L21 12" strokeLinecap="round" /></svg>;
    case "c4":
      return <svg {...props} strokeLinecap="butt"><rect x="3" y="3" width="18" height="18" rx="1" /><rect x="7" y="7" width="10" height="10" rx="1" /><rect x="10" y="10" width="4" height="4" rx="1" /></svg>;
    case "mind":
      return <svg {...props} strokeLinecap="butt"><circle cx="12" cy="12" r="3" /><circle cx="4" cy="6" r="2" /><circle cx="20" cy="6" r="2" /><circle cx="4" cy="18" r="2" /><circle cx="20" cy="18" r="2" /><path d="M10 11 6 7M14 11l6-4M10 13l-6 4M14 13l6 4" strokeLinecap="round" /></svg>;
    default:
      return <svg {...props}><circle cx="12" cy="12" r="9" /></svg>;
  }
}
