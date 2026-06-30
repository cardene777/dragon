import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { compile, CdlDiagramView, type CdlDiagram } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";
import CodeMirror from "@uiw/react-codemirror";
import { yaml } from "@codemirror/lang-yaml";
import { EditorView } from "@codemirror/view";

// dragon DSL は YAML 互換、 yaml mode を流用 + v4 palette で theme override
const v4EditorTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "#fcf8ee",
      color: "#1a1f2a",
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontSize: "13px",
      height: "100%",
    },
    ".cm-content": { padding: "18px 14px", caretColor: "#2d6a8f" },
    ".cm-cursor": { borderLeftColor: "#2d6a8f" },
    ".cm-line": { padding: "0 4px" },
    ".cm-gutters": {
      backgroundColor: "#fcf8ee",
      color: "#8a8678",
      border: "none",
      borderRight: "1px solid #e0d9c8",
      fontFamily: "'JetBrains Mono', monospace",
    },
    ".cm-activeLineGutter": { backgroundColor: "rgba(45,106,143,0.06)", color: "#2d6a8f" },
    ".cm-activeLine": { backgroundColor: "rgba(45,106,143,0.04)" },
    ".cm-selectionBackground, ::selection": { backgroundColor: "rgba(45,106,143,0.18) !important" },
    "&.cm-focused": { outline: "none" },
  },
  { dark: false }
);

/**
 * Visual Editor v1.1
 *
 * 設計:
 * - 左 ... DSL textarea (monospace、 line-numbered hint)
 * - 右 ... live preview (CdlDiagramView) + pan/zoom toolbar (Mermaid Live Editor 相当)
 * - 入力 debounce 300ms で parse + render
 * - URL hash で share (`#s=<base64>`)、 起動時に hash から復元
 * - Download SVG ボタン
 * - Reset / Sample 切替ボタン (12 件 scroll 横並び)
 * - Error 表示 (parse error 時に行番号付き)
 * - pan/zoom ... wheel zoom (cursor 中心、 0.25-8x)、 drag pan、 Fit/Reset/100%/+/- toolbar
 */

const SAMPLES: { label: string; code: string }[] = [
  {
    label: "API call (sequence)",
    code: `title: "ログイン API"
type: sequence

actors:
  - User
  - API
  - DB

flow:
  - User -> API: "POST /login"
  - API -> DB: "SELECT user"
  - DB -> API: "row"
  - API -> User: "200 OK" (success)

animation:
  - step: "call" 1.4s
    focus: [User, API]
  - step: "query" 1.4s
    focus: [API, DB]
  - step: "return" 1.4s
    focus: [API, DB]
  - step: "ok" 1.4s
    focus: [User, API]
`,
  },
  {
    label: "Order checkout (sequence)",
    code: `title: "Order checkout"
type: sequence

actors:
  - User
  - Cart
  - Payment

flow:
  - User -> Cart: "add item"
  - Cart -> Payment: "charge"
  - Payment -> User: "receipt" (success)

animation:
  - step: "add" 1.2s
    focus: [User, Cart]
  - step: "charge" 1.5s
    focus: [Cart, Payment]
  - step: "receipt" 1.2s
    focus: [User, Payment]
`,
  },
  {
    label: "CI pipeline (flow)",
    code: `title: "CI pipeline"
type: flow

actors:
  - Push: { kind: event }
  - Build: { kind: function }
  - Test: { kind: function }
  - Deploy: { kind: function }

flow:
  - Push -> Build: "trigger"
  - Build -> Test: "artifact"
  - Test -> Deploy: "pass" (success)

animation:
  - step: "trigger" 1.2s
  - step: "build" 1.5s
  - step: "test" 1.5s
  - step: "deploy" 1.2s
`,
  },
  {
    label: "Microservices (swimlane)",
    code: `title: "User registration"
type: swimlane

actors:
  - User
  - Auth: { kind: service }
  - DB: { kind: database }
  - Mail: { kind: service }

flow:
  - User -> Auth: "POST /register"
  - Auth -> DB: "INSERT user"
  - Auth -> Mail: "send welcome"
  - Mail -> User: "email"

animation:
  - step: "register" 1.4s
  - step: "persist" 1.4s
  - step: "notify" 1.4s
`,
  },
  {
    label: "System architecture (topology)",
    code: `title: "system architecture"
type: topology

actors:
  - LB: { kind: cloud, subtitle: "Load Balancer" }
  - Web: { kind: service, subtitle: "API server" }
  - Cache: { kind: service, subtitle: "Redis" }
  - DB: { kind: database, subtitle: "Postgres" }

flow:
  - LB -> Web: "route"
  - Web -> Cache: "lookup"
  - Web -> DB: "query"

animation:
  - step: "ingress" 1.2s
    focus: [LB, Web]
  - step: "cache" 1.2s
    focus: [Web, Cache]
  - step: "fallback" 1.5s
    focus: [Web, DB]
`,
  },
  {
    label: "User-Post schema (er)",
    code: `title: "User-Post schema"
type: er

actors:
  - User: { kind: entity, rows: ["id: PK", "email", "name"] }
  - Post: { kind: entity, rows: ["id: PK", "userId: FK", "title", "body"] }
  - Comment: { kind: entity, rows: ["id: PK", "postId: FK", "body"] }

flow:
  - User -> Post: "writes" { cardinality: "1:N" }
  - Post -> Comment: "has" { cardinality: "1:N" }
`,
  },
  {
    label: "Auth FSM (state-machine)",
    code: `title: "auth FSM"
type: state

actors:
  - Idle: { kind: state, initial: true }
  - Loading: { kind: state }
  - Done: { kind: state, final: true }
  - Error: { kind: state }

flow:
  - Idle -> Loading: "submit"
  - Loading -> Done: "ok" (success)
  - Loading -> Error: "fail"
  - Error -> Idle: "retry"

animation:
  - step: "idle" 1.0s
    focus: [Idle]
  - step: "submit" 1.2s
    focus: [Loading]
  - step: "done" 1.0s
    focus: [Done]
`,
  },
  {
    label: "OOP class (class)",
    code: `title: "Animal class hierarchy"
type: class

actors:
  - Animal: { rows: ["+name: string", "+age: int", "+speak(): void"] }
  - Dog: { rows: ["+breed: string", "+bark(): void"] }
  - Cat: { rows: ["+indoor: boolean", "+meow(): void"] }

flow:
  - Dog -> Animal: "extends"
  - Cat -> Animal: "extends"
`,
  },
  {
    label: "Sprint roadmap (gantt)",
    code: `title: "Q1-Q4 roadmap"
type: gantt

actors:
  - Design: { subtitle: "Q1" }
  - Build: { subtitle: "Q2" }
  - Test: { subtitle: "Q3" }
  - Ship: { subtitle: "Q4" }

animation:
  - step: "Q1" 1.0s
    focus: [Design]
  - step: "Q2" 1.0s
    focus: [Build]
  - step: "Q3" 1.0s
    focus: [Test]
  - step: "Q4" 1.0s
    focus: [Ship]
`,
  },
  {
    label: "Project brainstorm (mind)",
    code: `title: "Project ideas"
type: mind

actors:
  - root: { title: "New Project" }
  - features: { title: "Features" }
  - design: { title: "Design" }
  - launch: { title: "Launch" }
  - market: { title: "Go-to-market" }
`,
  },
  {
    label: "Language share (pie)",
    code: `title: "Language share"
type: pie

actors:
  - TypeScript: { value: "45%" }
  - Python: { value: "30%" }
  - Rust: { value: "15%" }
  - Go: { value: "10%" }
`,
  },
  {
    label: "C4 context (c4)",
    code: `title: "C4 context model"
type: c4

actors:
  - User: { kind: person, subtitle: "L1" }
  - System: { kind: service, subtitle: "L1: system" }
  - API: { kind: service, subtitle: "L2: container" }
  - DB: { kind: database, subtitle: "L2: container" }

flow:
  - User -> System: "use"
  - System -> API: "request"
  - API -> DB: "query"
`,
  },
];

function encodeShare(src: string): string {
  try {
    return btoa(unescape(encodeURIComponent(src)));
  } catch {
    return "";
  }
}

function decodeShare(hash: string): string | null {
  try {
    const match = hash.match(/[#&]s=([^&]+)/);
    if (!match) return null;
    return decodeURIComponent(escape(atob(match[1]!)));
  } catch {
    return null;
  }
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 8;
const ZOOM_STEP = 0.2;

export function CdlEditor(): React.JSX.Element {
  const [src, setSrc] = useState<string>(SAMPLES[0]!.code);
  const [diagram, setDiagram] = useState<CdlDiagram | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeSample, setActiveSample] = useState(SAMPLES[0]!.label);

  const filteredSamples = useMemo(() => {
    if (!search.trim()) return SAMPLES;
    const q = search.toLowerCase();
    return SAMPLES.filter((s) => s.label.toLowerCase().includes(q));
  }, [search]);

  const categorize = (label: string): string => {
    const m = label.match(/\(([^)]+)\)/);
    return m ? m[1]! : "other";
  };

  const groupedSamples = useMemo(() => {
    const groups: Record<string, typeof SAMPLES> = {};
    for (const s of filteredSamples) {
      const cat = categorize(s.label);
      if (!groups[cat]) groups[cat] = [];
      groups[cat]!.push(s);
    }
    return groups;
  }, [filteredSamples]);
  const timerRef = useRef<number | null>(null);

  // pan/zoom state
  const [transform, setTransform] = useState({ tx: 0, ty: 0, scale: 1 });
  const previewRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  // URL hash から復元 (起動時 1 回のみ)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const restored = decodeShare(window.location.hash);
    if (restored) setSrc(restored);
  }, []);

  // src 変更時 debounce 300ms で parse + render
  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      try {
        const d = textDslToDiagram(src);
        // compile を pre-check して validate/layout の throw を CdlDiagramView 描画前に捕捉する。
        // ここで catch しないと CdlDiagramView 内 useMemo の throw が React island 全体を unmount し、
        // .cdl-editor-textarea / .cdl-editor-error 等の UI も丸ごと消える (e.g. self-loop edge)。
        compile(d);
        setDiagram(d);
        setError(null);
      } catch (e) {
        setError((e as Error).message);
        // diagram は前回のまま (preview を残す)
      }
    }, 300);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [src]);

  // Fit handler ... preview 領域に SVG の bounding を合わせる。
  // SVG が render される度 + sample 切替時に自動 Fit。
  const handleFit = useCallback((): void => {
    if (!previewRef.current) return;
    const svg = previewRef.current.querySelector("svg");
    if (!svg) return;
    const previewRect = previewRef.current.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    if (!vb || vb.width === 0 || vb.height === 0) {
      setTransform({ tx: 0, ty: 0, scale: 1 });
      return;
    }
    const scaleX = previewRect.width / vb.width;
    const scaleY = previewRect.height / vb.height;
    const scale = Math.min(scaleX, scaleY) * 0.95;
    const tx = (previewRect.width - vb.width * scale) / 2;
    const ty = (previewRect.height - vb.height * scale) / 2;
    setTransform({ tx, ty, scale });
  }, []);

  // diagram 切替時に自動 Fit
  useEffect(() => {
    if (!diagram) return;
    // SVG の layout 反映を待つため 2 frame 遅延 + 100ms fallback
    let cancelled = false;
    const r1 = window.requestAnimationFrame(() => {
      if (cancelled) return;
      const r2 = window.requestAnimationFrame(() => {
        if (cancelled) return;
        handleFit();
      });
      return () => window.cancelAnimationFrame(r2);
    });
    const t = window.setTimeout(() => {
      if (!cancelled) handleFit();
    }, 120);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(r1);
      window.clearTimeout(t);
    };
  }, [diagram, handleFit]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>): void => {
    e.preventDefault();
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setTransform((t) => {
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, t.scale + delta));
      const factor = newScale / t.scale;
      const newTx = mx - (mx - t.tx) * factor;
      const newTy = my - (my - t.ty) * factor;
      return { tx: newTx, ty: newTy, scale: newScale };
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    // toolbar クリックは pan させない
    if ((e.target as HTMLElement).closest(".cdl-editor-zoom-toolbar")) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, tx: transform.tx, ty: transform.ty };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (!dragging) return;
    setTransform((t) => ({
      ...t,
      tx: dragStart.current.tx + (e.clientX - dragStart.current.x),
      ty: dragStart.current.ty + (e.clientY - dragStart.current.y),
    }));
  };

  const handleMouseUp = (): void => setDragging(false);

  const handleReset = (): void => handleFit();
  const handle100 = (): void => {
    if (!previewRef.current) {
      setTransform({ tx: 0, ty: 0, scale: 1 });
      return;
    }
    // 中央寄せして scale=1.0 にする
    const svg = previewRef.current.querySelector("svg");
    const previewRect = previewRef.current.getBoundingClientRect();
    if (!svg) {
      setTransform({ tx: 0, ty: 0, scale: 1 });
      return;
    }
    const vb = svg.viewBox.baseVal;
    const tx = (previewRect.width - vb.width) / 2;
    const ty = (previewRect.height - vb.height) / 2;
    setTransform({ tx, ty, scale: 1 });
  };

  const zoomAtCenter = (delta: number): void => {
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) {
      setTransform((t) => ({ ...t, scale: Math.max(MIN_SCALE, Math.min(MAX_SCALE, t.scale + delta)) }));
      return;
    }
    const mx = rect.width / 2;
    const my = rect.height / 2;
    setTransform((t) => {
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, t.scale + delta));
      const factor = newScale / t.scale;
      const newTx = mx - (mx - t.tx) * factor;
      const newTy = my - (my - t.ty) * factor;
      return { tx: newTx, ty: newTy, scale: newScale };
    });
  };

  const handleZoomIn = (): void => zoomAtCenter(ZOOM_STEP);
  const handleZoomOut = (): void => zoomAtCenter(-ZOOM_STEP);

  // Esc で Reset
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") handleReset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleFit]);

  const handleShare = (): void => {
    if (typeof window === "undefined") return;
    const encoded = encodeShare(src);
    const url = `${window.location.origin}${window.location.pathname}#s=${encoded}`;
    void navigator.clipboard.writeText(url).catch(() => {
      // clipboard 失敗時 fallback ... URL を window.prompt で表示
      window.prompt("共有 URL をコピーしてください:", url);
    });
    const button = document.getElementById("editor-share-btn");
    if (button) {
      const orig = button.textContent;
      button.textContent = "コピーしました ✔";
      setTimeout(() => {
        if (button) button.textContent = orig;
      }, 1500);
    }
  };

  const handleDownload = (): void => {
    if (typeof document === "undefined") return;
    const svg = document.querySelector(".cdl-editor-preview svg");
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${diagram?.id ?? "diagram"}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const scaleDisplay = useMemo(() => `${Math.round(transform.scale * 100)}%`, [transform.scale]);

  const handleSelectSample = (s: { label: string; code: string }): void => {
    setSrc(s.code);
    setActiveSample(s.label);
  };

  const handleNewFile = (): void => {
    const blank = `title: "untitled"
type: sequence

actors:
  - A
  - B

flow:
  - A -> B: "msg"

animation:
  - step: "step 1" 1.2s
    focus: [A, B]
`;
    setSrc(blank);
    setActiveSample("new");
  };

  return (
    <div className="v4-editor">
      {/* ── 左 sidebar (new file 主体) ── */}
      <aside className="v4-editor-side">
        <button
          type="button"
          className="v4-editor-side-new"
          onClick={handleNewFile}
        >
          <span className="v4-editor-side-new-plus">+</span>
          <span>new file</span>
        </button>
        <details className="v4-editor-side-samples" open={false}>
          <summary className="v4-editor-side-samples-summary">
            <span className="v4-editor-side-samples-label">samples</span>
            <span className="v4-editor-side-samples-count">{filteredSamples.length}</span>
            <span className="v4-editor-side-samples-caret">›</span>
          </summary>
          <div className="v4-editor-side-samples-body">
            <input
              className="v4-editor-search"
              type="text"
              placeholder="🔍 search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="v4-editor-side-list">
              {Object.entries(groupedSamples).map(([cat, list]) => (
                <div key={cat} className="v4-editor-side-group">
                  <div className="v4-editor-side-group-title">{cat}</div>
                  {list.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      className={`v4-editor-side-item ${activeSample === s.label ? "active" : ""}`}
                      onClick={() => handleSelectSample(s)}
                    >
                      {s.label.replace(/\s*\([^)]*\)\s*$/, "")}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </details>
      </aside>

      {/* ── 中央 DSL editor (CodeMirror) ── */}
      <section className="v4-editor-code">
        <header className="v4-editor-bar">
          <span className="v4-editor-bar-file">▲ {activeSample}.dragon</span>
          <span className="v4-editor-bar-gap" />
          <button type="button" className="v4-editor-bar-btn" onClick={handleShare}>
            共有 URL
          </button>
          <button
            type="button"
            className="v4-editor-bar-btn v4-editor-bar-btn-primary"
            onClick={handleDownload}
            disabled={!diagram}
          >
            SVG download
          </button>
        </header>
        <div className="v4-editor-code-body">
          <CodeMirror
            value={src}
            theme={v4EditorTheme}
            extensions={[yaml()]}
            onChange={(v) => setSrc(v)}
            height="100%"
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              dropCursor: false,
              highlightActiveLine: true,
              highlightActiveLineGutter: true,
              autocompletion: false,
              indentOnInput: true,
            }}
          />
        </div>
        {error && <pre className="v4-editor-error">{error}</pre>}
      </section>

      {/* ── 右 preview pane (full-bleed) ── */}
      <section className="v4-editor-preview">
        <header className="v4-editor-bar">
          <span className="v4-editor-bar-file">
            <span className="v4-editor-live" /> live preview
          </span>
          <span className="v4-editor-bar-gap" />
          <button type="button" className="v4-editor-bar-btn" onClick={handleFit}>
            fit
          </button>
          <button type="button" className="v4-editor-bar-btn" onClick={handleReset}>
            reset
          </button>
          <button type="button" className="v4-editor-bar-btn" onClick={handle100}>
            100%
          </button>
          <button type="button" className="v4-editor-bar-btn" onClick={handleZoomOut}>
            −
          </button>
          <button type="button" className="v4-editor-bar-btn" onClick={handleZoomIn}>
            +
          </button>
          <span className="v4-editor-bar-zoom">{scaleDisplay}</span>
        </header>
        <div
          className="v4-editor-stage"
          ref={previewRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="v4-editor-pan"
            style={{
              transform: `translate(${transform.tx}px, ${transform.ty}px) scale(${transform.scale})`,
              transformOrigin: "0 0",
            }}
          >
            {diagram ? (
              <div className="v4-editor-svg-wrap">
                <CdlDiagramView diagram={diagram} />
              </div>
            ) : (
              <div className="v4-editor-empty">読み込み中...</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
