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
    label: "送金 (sequence)",
    code: `title: "送金フロー"
type: sequence

actors:
  - Alice
  - Vault: storage
  - Bob

states:
  alice_bal: 100
  bob_bal: 0

flow:
  - Alice -> Vault: "deposit"
  - Vault -> Bob: "send" (success)

animation:
  - step: "送金開始" 1.5s
    focus: [Alice, Vault]
    tween:
      alice_bal: 100 -> 90
    badge: "送金開始"
  - step: "送金完了" 1.5s
    focus: [Vault, Bob]
    tween:
      bob_bal: 0 -> 10
    badge: "送金完了"
`,
  },
  {
    label: "ERC-20 transfer (solidity)",
    code: `title: "ERC-20 transfer"
type: solidity

actors:
  - Alice: { kind: eoa, subtitle: "送り手" }
  - Bob: { kind: eoa, subtitle: "受け手" }
  - Token: { kind: contract, subtitle: "ERC-20" }
  - balances: { kind: storage, rows: ["Alice: {alice_bal}", "Bob: {bob_bal}"] }
  - "Transfer": { kind: event }

states:
  alice_bal: 100
  bob_bal: 0

flow:
  - Alice -> Token: "transfer(Bob, 10)"
  - Token -> balances: "balances update"
  - Token -> "Transfer": "emit" (success)

animation:
  - step: "call" 1.2s
    focus: [Alice, Token]
  - step: "storage" 1.5s
    focus: [Token, balances]
    tween:
      alice_bal: 100 -> 90
      bob_bal: 0 -> 10
  - step: "emit" 0.8s
    focus: [Token, "Transfer"]
`,
  },
  {
    label: "Auth FSM (state-machine)",
    code: `title: "Auth FSM"
type: state

actors:
  - Idle: { kind: state, initial: true }
  - Loading: { kind: state }
  - Done: { kind: state, final: true }
  - Error: { kind: state }

flow:
  - Idle -> Loading: "submit"
  - Loading -> Done: "ok" (success)
  - Loading -> Error: "fail" (error)
`,
  },
  {
    label: "Permit (EIP-2612)",
    code: `title: "EIP-2612 Permit"
type: sequence

actors:
  - Owner: { kind: actor, subtitle: "署名のみ (gas 0)" }
  - Spender: { kind: actor, subtitle: "relayer" }
  - "EIP-712 typed-data": card
  - "permit(...sig)": function
  - allowances: storage

flow:
  - Owner -> "EIP-712 typed-data": "sign" (info, dotted-flow)
  - "EIP-712 typed-data" -> Spender: "send sig" (info, dotted-flow)
  - Spender -> "permit(...sig)": "permit(sig)" (accent, dotted-flow)
  - "permit(...sig)" -> allowances: "set allowance" (teal, dotted-flow)

states:
  allowance: 0

animation:
  - step: "Off-chain signature" 1.5s
    focus: [Owner, "EIP-712 typed-data"]
    badge: "signed"
  - step: "Spender relay" 1.2s
    focus: ["EIP-712 typed-data", Spender]
    badge: "relayed"
  - step: "on-chain execute" 1.5s
    focus: [Spender, "permit(...sig)", allowances]
    tween:
      allowance: 0 -> 100
    badge: "approved"
`,
  },
  {
    label: "Uniswap V2 swap",
    code: `title: "UniswapV2 swap"
type: sequence

actors:
  - Trader
  - "Router.swap()": function
  - "Pair (USDC/ETH)": storage

flow:
  - Trader -> "Router.swap()": "swapExactTokensForTokens" (accent)
  - "Router.swap()" -> "Pair (USDC/ETH)": "transferFrom + transfer" (teal, dotted-flow)
  - "Pair (USDC/ETH)" -> Trader: "send out token" (success, dotted-flow)

states:
  pool_usdc: 100000
  pool_eth: 50
  trader_eth: 0

animation:
  - step: "swap 1000 USDC -> ETH" 1.8s
    focus: [Trader, "Router.swap()", "Pair (USDC/ETH)"]
    tween:
      pool_usdc: 100000 -> 101000
      pool_eth: 50 -> 49.5
      trader_eth: 0 -> 0.5
    badge: "swapped"
`,
  },
  {
    label: "Multisig (Gnosis Safe)",
    code: `title: "Gnosis Safe execTransaction"
type: sequence

actors:
  - "Owner 1"
  - "Owner 2"
  - "Owner 3"
  - "Safe.execTransaction()": function
  - "Target contract": function

flow:
  - "Owner 1" -> "Safe.execTransaction()": "sig 1" (info, dotted-flow)
  - "Owner 2" -> "Safe.execTransaction()": "sig 2" (info, dotted-flow)
  - "Owner 3" -> "Safe.execTransaction()": "sig 3 + execute" (accent, dotted-flow)
  - "Safe.execTransaction()" -> "Target contract": "call(data)" (success, dotted-flow)

states:
  sigs_collected: 0
  threshold: 3

animation:
  - step: "Owner 1 sign" 1.0s
    focus: ["Owner 1", "Safe.execTransaction()"]
    tween:
      sigs_collected: 0 -> 1
    badge: "1/3"
  - step: "Owner 2 sign" 1.0s
    focus: ["Owner 2", "Safe.execTransaction()"]
    tween:
      sigs_collected: 1 -> 2
    badge: "2/3"
  - step: "Owner 3 sign + execute" 1.2s
    focus: ["Owner 3", "Safe.execTransaction()", "Target contract"]
    tween:
      sigs_collected: 2 -> 3
    badge: "3/3 executed"
`,
  },
  {
    label: "Login flow",
    code: `title: "Login flow"
type: flow

actors:
  - Start: event
  - Verify: function
  - Done: event
  - Error: event

flow:
  - Start -> Verify: "submit credentials"
  - Verify -> Done: "OK" (success)
  - Verify -> Error: "NG" (error)

states:
  progress: 0

animation:
  - step: "verify" 1s
    focus: [Start, Verify]
    tween:
      progress: 0 -> 50
    badge: "verifying"
  - step: "complete" 1s
    focus: [Verify, Done]
    tween:
      progress: 50 -> 100
    badge: "logged in"
`,
  },
  {
    label: "System topology",
    code: `title: "System topology"
type: topology

actors:
  - Browser: service
  - API: service
  - DB: database
  - Cache: storage

flow:
  - Browser -> API: "HTTPS"
  - API -> Cache: "get cached"
  - API -> DB: "SQL"

animation:
  - step: "request" 1s
    focus: [Browser, API]
    badge: "request"
  - step: "cache lookup" 1s
    focus: [API, Cache]
    badge: "cache"
  - step: "db query" 1s
    focus: [API, DB]
    badge: "query"
`,
  },
  {
    label: "User-Order ER",
    code: `title: "User-Order schema"
type: er

actors:
  - User
  - Order
  - Product

flow:
  - User -> Order: "places" (info)
  - Order -> Product: "contains" (teal)

animation:
  - step: "user places order" 1s
    focus: [User, Order]
    badge: "1:N"
  - step: "order contains product" 1s
    focus: [Order, Product]
    badge: "N:M"
`,
  },
  {
    label: "NFT mint sequence",
    code: `title: "Lazy mint (signature-based)"
type: sequence

actors:
  - Creator: { kind: actor, subtitle: "署名のみ (gas 0)" }
  - "Voucher": card
  - Buyer
  - "redeem()": function
  - "tokenId 42": storage

flow:
  - Creator -> "Voucher": "sign voucher" (info, dotted-flow)
  - "Voucher" -> Buyer: "off-chain hand-off" (info, dotted-flow)
  - Buyer -> "redeem()": "redeem(voucher, sig)" (accent)
  - "redeem()" -> "tokenId 42": "_mint + transfer" (success, dotted-flow)

states:
  minted: 0

animation:
  - step: "creator signs voucher" 1.2s
    focus: [Creator, "Voucher"]
    badge: "signed"
  - step: "buyer receives voucher" 1.2s
    focus: ["Voucher", Buyer]
    badge: "received"
  - step: "buyer redeems" 1.5s
    focus: [Buyer, "redeem()", "tokenId 42"]
    tween:
      minted: 0 -> 1
    badge: "minted"
`,
  },
  {
    label: "Bridge (LayerZero)",
    code: `title: "LayerZero V2 send"
type: sequence

actors:
  - "Source OApp"
  - "Source Endpoint": function
  - "DVN": service
  - "Executor": service
  - "Dest Endpoint": function
  - "Dest OApp"

flow:
  - "Source OApp" -> "Source Endpoint": "send(message)" (accent)
  - "Source Endpoint" -> "DVN": "verify request" (info, dotted-flow)
  - "DVN" -> "Dest Endpoint": "verified payload" (info, dotted-flow)
  - "Executor" -> "Dest Endpoint": "execute()" (accent)
  - "Dest Endpoint" -> "Dest OApp": "lzReceive(message)" (success, dotted-flow)

states:
  src_sent: 0
  dst_received: 0

animation:
  - step: "source send" 1.5s
    focus: ["Source OApp", "Source Endpoint", "DVN"]
    tween:
      src_sent: 0 -> 1
    badge: "sent"
  - step: "DVN verify" 1.2s
    focus: ["DVN", "Dest Endpoint"]
    badge: "verified"
  - step: "dest receive" 1.5s
    focus: ["Executor", "Dest Endpoint", "Dest OApp"]
    tween:
      dst_received: 0 -> 1
    badge: "received"
`,
  },
  {
    label: "DAO Governor",
    code: `title: "Governor propose + vote"
type: sequence

actors:
  - Proposer
  - "Voter A"
  - "Voter B"
  - "Governor.propose()": function
  - "castVote()": function
  - "proposals map": storage
  - "vote tally": storage

flow:
  - Proposer -> "Governor.propose()": "propose(targets, calldatas)" (accent)
  - "Governor.propose()" -> "proposals map": "store proposalId" (teal, dotted-flow)
  - "Voter A" -> "castVote()": "For" (success)
  - "castVote()" -> "vote tally": "+1 For" (teal, dotted-flow)
  - "Voter B" -> "castVote()": "Against" (error)
  - "castVote()" -> "vote tally": "+1 Against" (teal, dotted-flow)

states:
  proposal_count: 0
  for_count: 0
  against_count: 0

animation:
  - step: "propose" 1.2s
    focus: [Proposer, "Governor.propose()", "proposals map"]
    tween:
      proposal_count: 0 -> 1
    badge: "proposed"
  - step: "Voter A votes For" 1.0s
    focus: ["Voter A", "castVote()", "vote tally"]
    tween:
      for_count: 0 -> 1
    badge: "For"
  - step: "Voter B votes Against" 1.0s
    focus: ["Voter B", "castVote()", "vote tally"]
    tween:
      against_count: 0 -> 1
    badge: "Against"
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
