import { useState } from "react";
import { Link } from "react-router";
import { CdlDiagramView, NODE_KINDS } from "@cardenelabs/cdl";
import { parseTextDslV05, textDslToDiagram } from "@cardenelabs/dragon";
import { PenLine, Play, Share2 } from "lucide-react";
import { presetDeliverySequence, presetTopology, presetDeliveryRelations } from "@/topics/catalog/presets.cdl";
import { usePhaseIndex } from "@/components/PhaseChrome";
import { SiteHeader } from "@/components/SiteHeader";
import { useLocale } from "@/lib/useLocale";
import { 図に画面の言語を当てる } from "@/lib/diagram-lang";

import { 区間, 区間のspan } from "@/components/SyntaxCode";
/**
 * dragon の入口。 見た目の SSOT = docs/design/app.pen の 01 概要、
 * class の中身は src/styles/home.css。
 * 6 段構成 = 名乗り / 実物の窓 / 3 つの強み / 3 手順 / 用途 3 例 / 締めの誘い。
 */

/**
 * ヒーローに出す記法 (#1310 / #2455)。
 *
 * **言語ごとに 1 本ずつ持つ**。 英語で開いた画面に日本語の記法が出ていると、最初に目に入る
 * 実物が読めない。 2 本とも記法として通ることを検査が固定する (`home-notation.test.ts`)。
 * 光らせる行は、各言語の `focus` と `flow` から導く。
 *
 * かつては 1 行ずつ手で `<span>` を貼っていた (`.t-k` / `.t-v` / `.t-p` / `.t-id` / `.t-a`)。
 * 実装から導けるものを人手で書いていたため検査が無く、**記法として通らない本文が出ていた**
 * (`animate:` は最上位に無い項目、箱の書き方が違う、`(1)` が色名として読まれる の 6 件)。
 *
 * 本文を 1 つ持ち、色は分解器が決める。 記法として通ることは検査が固定する。
 */
const DEMO_SRC = {
  ja: `title: ログイン処理
type: sequence

actors:
  - User: { subtitle: "画面" }
  - API: { subtitle: "受付" }
  - DB: { subtitle: "台帳" }

flow:
  - User -> API: "POST /login" { kind: call }
  - API -> DB: "SELECT user" { kind: call }
  - DB -> API: "row" { kind: return }
  - API -> User: "200 OK" { kind: return }

animation:
  - step: "認証要求" 0.6s
    focus: [User, API]
  - step: "照会" 0.6s
    focus: [API, DB]
`,
  en: `title: Login flow
type: sequence

actors:
  - User: { subtitle: "Screen" }
  - API: { subtitle: "Front desk" }
  - DB: { subtitle: "Ledger" }

flow:
  - User -> API: "POST /login" { kind: call }
  - API -> DB: "SELECT user" { kind: call }
  - DB -> API: "row" { kind: return }
  - API -> User: "200 OK" { kind: return }

animation:
  - step: "Auth request" 0.6s
    focus: [User, API]
  - step: "Lookup" 0.6s
    focus: [API, DB]
`,
} as const;

const DEMO_DIAGRAM = {
  ja: textDslToDiagram(DEMO_SRC.ja),
  en: textDslToDiagram(DEMO_SRC.en),
} as const;

/** 各段の focus に両端が入る flow を、本文上の行番号へ戻す。 */
export function 段ごとの光る行(src: string): number[][] {
  const parsed = parseTextDslV05(src);
  if (!parsed.ok) return [];
  return (parsed.doc.animate?.phases ?? []).map((段) => {
    const focus = new Set(段.highlight ?? []);
    return parsed.doc.flow
      .filter((flow) => focus.has(flow.from) && focus.has(flow.to))
      .map((flow) => flow.pos.line);
  });
}

const DEMO_HIGHLIGHT_LINES = {
  ja: 段ごとの光る行(DEMO_SRC.ja),
  en: 段ごとの光る行(DEMO_SRC.en),
} as const;

/** 3 手順の 2 つ目に添える短い記述 */
const STEP_CODE = [
  "title: API call",
  "type: sequence",
  "actors:",
  "  - user",
  "  - api",
  "flow:",
  "  - user -> api: GET /me",
];

/** 名乗りに出す形の数。 手で書くと記法 package に形が増えた時に追随しないため、種別の一覧から導く */
const 形の数 = NODE_KINDS.filter((kind) => kind.startsWith("shape-")).length;

// トップの縮小見本は全体が一覧への行き先。中の表まで押す対象にすると、縮小された行が
// 24px 未満の入れ子の的になる。関係を触って読む操作は詳細画面だけに残す。
const HOME_DELIVERY_RELATIONS = { ...presetDeliveryRelations, relationFocus: "off" as const };

export function HomePage(): React.ReactElement {
  const [locale] = useLocale();
  const [図の入れ物, set図の入れ物] = useState<HTMLDivElement | null>(null);
  const 今の段番号 = usePhaseIndex(図の入れ物);
  const isJa = locale === "ja";
  const 記法 = isJa ? DEMO_SRC.ja : DEMO_SRC.en;
  const 図 = isJa ? DEMO_DIAGRAM.ja : DEMO_DIAGRAM.en;
  const 段番号 = Math.min(今の段番号, Math.max(0, 図.phases.length - 1));
  const 今の段 = 図.phases[段番号];
  const 光る行 = new Set((isJa ? DEMO_HIGHLIGHT_LINES.ja : DEMO_HIGHLIGHT_LINES.en)[段番号] ?? []);
  // 区切りの中黒は英語の側で `•` にする (#2455)。 `·` は片仮名の中黒の代わりに使われる字なので、
  // 画面を描く browser は日本語として数える
  const 区切り = isJa ? "·" : "•";
  return (
    <div>
      <SiteHeader />

      <section className="hero">
        <div className="hero-eyebrow">
          {/* 版は `packages/dragon/package.json` から差し込む (#1320)。 手で書くと追随しない */}
          <span className="chip">v{__DRAGON_VERSION__.split(".").slice(0, 2).join(".")}</span>
          <span className="chip">
            {isJa ? `${形の数} 種の形 × 時間軸 × 絶対配置` : `${形の数} shapes × timeline × absolute placement`}
          </span>
        </div>
        <h1>
          {isJa ? (
            <>より自由な<em>図</em>を</>
          ) : (
            <><em>Diagrams</em> beyond the template</>
          )}
        </h1>
        <p className="lead">
          {isJa
            ? "形を選び置き場所を決め段ごとに動かす。 型に合わせて諦めていた図が、 文章のまま組み上がる。"
            : "Pick the shape, place it where you want, move it phase by phase. Diagrams you gave up on—because the template could not hold them—now build themselves from plain text."}
        </p>
        <div className="hero-cta">
          <Link className="btn-primary" to="/editor">
            {isJa ? "編集画面を開く →" : "Open the editor →"}
          </Link>
          <Link className="btn-secondary" to="/docs">
            {isJa ? "使い方を読む" : "Read the docs"}
          </Link>
        </div>
      </section>

      <section className="hero-demo">
        <div className="canvas">
          <div className="canvas-bar">
            <div className="canvas-bar-left">
              <div className="dots">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
              <span className="file">api-call.dragon</span>
            </div>
            {今の段 !== undefined && (
              <span className="phase">
                <span className="live-dot"></span> phase {段番号 + 1} / {図.phases.length} {区切り} {今の段.title}
              </span>
            )}
          </div>
          <div className="canvas-body">
            <div className="canvas-code">
              {記法.replace(/\n$/, "").split("\n").map((行, i) => {
                const no = i + 1;
                const 字下げ = 行.startsWith("    ") ? 2 : 行.startsWith("  ") ? 1 : 0;
                return (
                  <div key={no} className={`code-line${光る行.has(no) ? " hl" : ""}`}>
                    <span className="ln">{no}</span>
                    <span className={`ind ind-${字下げ}`}></span>
                    <span className="code-text">{区間のspan(区間(行.slice(字下げ * 2), "記法"))}</span>
                  </div>
                );
              })}
            </div>
            <div className="canvas-stage" ref={set図の入れ物}>
              <CdlDiagramView
                hideMiniPhaseIndicator
                diagram={図に画面の言語を当てる(図, locale)}
                hideHeader
              />
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="section-head">
          <span className="eyebrow">{isJa ? "なぜ dragon か" : "Why dragon"}</span>
          <h2>{isJa ? "書く手間を、 動く成果に。" : "Turn your writing into diagrams that move."}</h2>
        </div>
        <div className="feature-grid">
          <div className="feature">
            <div className="feature-icon">
              <PenLine size={20} />
            </div>
            <h3>{isJa ? "YAML 風で書ける" : "Write it like YAML"}</h3>
            <p>{isJa ? "登場人物と流れを箇条書きで宣言するだけ。 図の内部構造を組む必要はない。" : "Just declare the actors and the flow as a list. You never assemble the diagram's internals."}</p>
          </div>
          <div className="feature">
            <div className="feature-icon">
              <Play size={20} />
            </div>
            <h3>{isJa ? "段ごとに動き出す" : "Motion, phase by phase"}</h3>
            <p>{isJa ? "段を切り替えると図そのものが推移する。 数値は補間され、 順序と因果が目に見える。" : "Switch phases and the diagram itself transitions. Values interpolate, and order and causality become visible."}</p>
          </div>
          <div className="feature">
            <div className="feature-icon">
              <Share2 size={20} />
            </div>
            <h3>{isJa ? "場所を指す文字列で渡せる" : "Hand it over as a URL"}</h3>
            <p>{isJa ? "図は SVG として書き出せる。 場所を指す文字列に載せれば、 そのまま共有も持ち出しもできる。" : "Export the diagram as SVG. Put it on a URL and it travels—shared or taken with you as is."}</p>
          </div>
        </div>
      </section>

      <section className="quickstart">
        <div className="section-head">
          <span className="eyebrow">{isJa ? "3 手順" : "3 steps"}</span>
          <h2>{isJa ? "1 分で走り出す。" : "Up and running in a minute."}</h2>
        </div>
        <div className="steps">
          <div className="step">
            <div className="step-num">01</div>
            <h3>{isJa ? "編集画面を開く" : "Open the editor"}</h3>
            <p>{isJa ? "ブラウザで /editor を開く。 導入作業は要らない。" : "Visit /editor in your browser. Nothing to install."}</p>
          </div>
          <div className="step">
            <div className="step-num">02</div>
            <h3>{isJa ? "YAML を書く" : "Write the YAML"}</h3>
            <p>{isJa ? "登場人物と流れを箇条書きで宣言する。 type で図の種類を選ぶ。" : "Declare the actors and the flow as a list. type picks the kind of diagram."}</p>
            <pre className="step-code">
              {STEP_CODE.map((line) => (
                <span key={line} className="step-code-line">
                  {line}
                </span>
              ))}
            </pre>
          </div>
          <div className="step">
            <div className="step-num">03</div>
            <h3>{isJa ? "SVG が動き出す" : "The SVG starts moving"}</h3>
            <p>{isJa ? "右の実況表示に、 段ごとに動く図が出る。 場所を指す文字列で共有もでき、 持ち出しもできる。" : "The live view on the right shows a diagram that moves phase by phase. Share it by URL, or take it with you."}</p>
          </div>
        </div>
      </section>

      <section className="examples">
        <div className="section-head">
          <span className="eyebrow">{isJa ? "使いどころ" : "use case"}</span>
          <h2>{isJa ? "こんな図が書ける。" : "Diagrams you can write."}</h2>
        </div>
        <div className="examples-grid">
          <Link className="example" to="/catalog/presets">
            <div className="example-thumb">
              <CdlDiagramView hideMiniPhaseIndicator diagram={図に画面の言語を当てる(presetDeliverySequence, locale)} hideHeader />
            </div>
            <div className="example-body">
              <span className="example-tag tag-seq">{isJa ? "シーケンス図" : "sequence"}</span>
              <h3>{isJa ? "API 呼び出しの流れ" : "How an API call flows"}</h3>
              <p>{isJa ? "登場人物どうしのやりとりを時間軸で並べる。 認証や API 連携の説明に。" : "Lay out interactions between actors on a timeline. Ideal for explaining authentication and API integrations."}</p>
            </div>
          </Link>
          <Link className="example" to="/catalog/presets">
            <div className="example-thumb">
              <CdlDiagramView hideMiniPhaseIndicator diagram={図に画面の言語を当てる(presetTopology, locale)} hideHeader />
            </div>
            <div className="example-body">
              <span className="example-tag tag-topo">{isJa ? "トポロジー図" : "topology"}</span>
              <h3>{isJa ? "システム構成図" : "System topology"}</h3>
              <p>{isJa ? "部品の配置と、 要求がどこを通るかを同時に描く。" : "Show component placement and request paths in a single diagram."}</p>
            </div>
          </Link>
          <Link className="example" to="/catalog/presets">
            <div className="example-thumb">
              <CdlDiagramView hideMiniPhaseIndicator diagram={図に画面の言語を当てる(HOME_DELIVERY_RELATIONS, locale)} hideHeader />
            </div>
            <div className="example-body">
              <span className="example-tag tag-er">{isJa ? "ER図" : "er"}</span>
              <h3>{isJa ? "データベースの構造" : "DB schema"}</h3>
              <p>{isJa ? "実体と関係を順番に見せる。 構造の見直しや引き継ぎに。" : "Reveal entities and relationships step by step. For schema review and onboarding."}</p>
            </div>
          </Link>
        </div>
        <div className="examples-more">
          <Link className="link-accent" to="/catalog">
            {isJa ? "カタログで図を見る →" : "Browse the catalog →"}
          </Link>
        </div>
      </section>

      <section className="closing-cta">
        <div className="closing-cta-inner">
          <h2>{isJa ? "今すぐ、 書いて動かす。" : "Write it now, watch it move."}</h2>
          <p>{isJa ? "YAML を 1 つ書くだけ。 動く図を 1 分後に手に入れる。" : "One YAML file is all it takes. A moving diagram is yours a minute later."}</p>
          <div className="closing-cta-buttons">
            <Link className="btn-primary" to="/editor">
              {isJa ? "編集画面を開く →" : "Open the editor →"}
            </Link>
            <a
              className="btn-secondary"
              href="https://github.com/cardene777/dragon"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub ↗
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
