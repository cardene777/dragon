import { useEffect, useMemo, useRef, useState } from "react";
import { textDslToDiagram, type CdlDiagram } from "@cardenelabs/dragon";
import { CdlDiagramView } from "@cardenelabs/cdl";

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
    x: 22, y: 22,
    description: "UML sequence (actor + msg)。 mermaid sequenceDiagram と同等。",
    sampleDsl: `title: "sequence demo"
type: sequence

actors:
  - Alice
  - API
  - DB

flow:
  - Alice -> API: "request"
  - API -> DB: "query"
  - DB -> API: "result" (success)
  - API -> Alice: "response" (success)
`,
  },
  {
    id: "flow",
    label: "flow",
    icon: "↓",
    cluster: "basic",
    x: 38, y: 14,
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
    x: 54, y: 14,
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
    x: 70, y: 22,
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
    x: 66, y: 38,
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
    id: "solidity",
    label: "solidity",
    icon: "◆",
    cluster: "domain",
    x: 14, y: 56,
    description: "Solidity smart contract 専用。 EOA / contract / storage / event を自動 sort。",
    sampleDsl: `title: "ERC-20 transfer"
type: solidity

actors:
  - Alice: { kind: eoa }
  - Token: { kind: contract }
  - balances: { kind: storage }

states:
  alice_bal: 100
  bob_bal: 0

flow:
  - Alice -> Token: "transfer(Bob, 10)"
  - Token -> balances: "update"

animation:
  - step: "call" 1.2s
    focus: [Alice, Token]
  - step: "storage" 1.5s
    focus: [Token, balances]
    tween:
      alice_bal: 100 -> 90
      bob_bal: 0 -> 10
`,
  },
  // extended cluster (right, 5 preset)
  {
    id: "gantt",
    label: "gantt",
    icon: "▬",
    cluster: "extended",
    x: 80, y: 50,
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
    x: 86, y: 36,
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
    x: 88, y: 62,
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
    x: 80, y: 76,
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
    x: 68, y: 82,
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

const CLUSTER_COLOR: Record<PresetNode["cluster"], string> = {
  basic: "rgba(193,127,62,0.06)",
  domain: "rgba(193,127,62,0.12)",
  extended: "rgba(193,127,62,0.06)",
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

  // node click → diagram render
  useEffect(() => {
    if (!selected) {
      setDiagram(null);
      return;
    }
    try {
      const d = textDslToDiagram(selected.sampleDsl);
      setDiagram(d);
    } catch (e) {
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
    if ((e.target as HTMLElement).closest(".node")) return;
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
          {/* edges from center */}
          <svg className="edges" viewBox="0 0 100 100" preserveAspectRatio="none">
            {filtered.map((p) => (
              <line
                key={`edge-${p.id}`}
                x1="50"
                y1="50"
                x2={p.x}
                y2={p.y}
                stroke="rgba(193,127,62,0.25)"
                strokeWidth="0.15"
                strokeDasharray="0.5 0.5"
              />
            ))}
          </svg>

          {/* center dragon */}
          <div className="node node-center" style={{ left: "50%", top: "50%" }}>
            <div className="node-icon">◢</div>
            <div className="node-label">dragon</div>
            <div className="node-meta">animated DSL</div>
            <button className="node-edit-btn center-btn" onClick={() => window.location.href = "/editor"}>
              open editor →
            </button>
          </div>

          {/* preset nodes */}
          {filtered.map((p) => (
            <div
              key={p.id}
              className={`node node-${p.cluster} ${selected?.id === p.id ? "node-selected" : ""}`}
              style={{ left: `${p.x}%`, top: `${p.y}%`, background: CLUSTER_COLOR[p.cluster] }}
              onClick={() => setSelected(p)}
            >
              <div className="node-icon">{p.icon}</div>
              <div className="node-label">{p.label}</div>
              <div className="node-meta">type: {p.id}</div>
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

      {/* minimap */}
      <div className="map-minimap">
        <svg viewBox="0 0 100 100">
          {PRESETS.map((p) => (
            <circle key={p.id} cx={p.x} cy={p.y} r="2.5" fill="#c17f3e" opacity="0.6" />
          ))}
          <circle cx="50" cy="50" r="3.5" fill="#3b2e22" />
        </svg>
      </div>

      {/* detail modal */}
      {selected && diagram && (
        <div className="map-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="map-modal" onClick={(e) => e.stopPropagation()}>
            <button className="map-modal-close" onClick={() => setSelected(null)} aria-label="close">×</button>
            <div className="map-modal-head">
              <span className="map-modal-icon">{selected.icon}</span>
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

      {/* onboarding hint */}
      <div className="map-hint">
        ⌘ scroll to zoom · drag to pan · click node to preview
      </div>
    </div>
  );
}
