import { Link } from "react-router";
import { CdlDiagramView } from "@cardenelabs/cdl";
import { PenLine, Play, Share2 } from "lucide-react";
import { presetSequence, presetTopology, presetEr } from "@/topics/catalog/presets.cdl";
import { SiteHeader } from "@/components/SiteHeader";
import { useLocale } from "@/lib/useLocale";

import { 区間, 区間のspan } from "@/components/SyntaxCode";
/**
 * dragon の入口。 見た目の SSOT = docs/design/app.pen の 01 トップ、
 * class の中身は src/styles/home.css。
 * 6 段構成 = 名乗り / 実物の窓 / 3 つの強み / 3 手順 / 用途 3 例 / 締めの誘い。
 */

/** 記述の 1 かたまり。 role が色を決める (k=鍵 / v=値 / p=区切り / id=登場人物 / a=矢印) */
/**
 * ヒーローに出す記法 (#1310)。
 *
 * かつては 1 行ずつ手で `<span>` を貼っていた (`.t-k` / `.t-v` / `.t-p` / `.t-id` / `.t-a`)。
 * 実装から導けるものを人手で書いていたため検査が無く、**記法として通らない本文が出ていた**
 * (`animate:` は最上位に無い項目、箱の書き方が違う、`(1)` が色名として読まれる の 6 件)。
 *
 * 本文を 1 つ持ち、色は分解器が決める。 記法として通ることは検査が固定する。
 */
const DEMO_SRC = `title: ログイン処理
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
  - step: "1. 認証要求" 0.6s
    focus: [User, API]
  - step: "2. 照会" 0.6s
    focus: [API, DB]
`;

/** いま光らせる行 (1 始まり)。 右の図の段と対になる */
const DEMO_HIGHLIGHT_LINE = 11;

/** 3 手順の 2 つ目に添える短い記述 */
const STEP_CODE = [
  "type: sequence",
  "actors:",
  "  - { id: user }",
  "  - { id: api }",
  "flow:",
  "  - user -> api: GET /me",
];

export function HomePage(): React.ReactElement {
  const [locale] = useLocale();
  const isJa = locale === "ja";
  return (
    <div>
      <SiteHeader />

      <section className="hero">
        <div className="hero-eyebrow">
          {/* 版は `packages/dragon/package.json` から差し込む (#1320)。 手で書くと追随しない */}
          <span className="chip">v{__DRAGON_VERSION__.split(".").slice(0, 2).join(".")}</span>
          <span className="chip">49 種の形 × 時間軸 × 絶対配置</span>
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
            {isJa ? "エディタを開く →" : "Open the editor →"}
          </Link>
          <Link className="btn-secondary" to="/docs">
            {isJa ? "ドキュメントを読む" : "Read the docs"}
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
            <span className="phase">
              <span className="live-dot"></span> phase 2 / 4 · API → DB
            </span>
          </div>
          <div className="canvas-body">
            <div className="canvas-code">
              {DEMO_SRC.replace(/\n$/, "").split("\n").map((行, i) => {
                const no = i + 1;
                const 字下げ = 行.startsWith("    ") ? 2 : 行.startsWith("  ") ? 1 : 0;
                return (
                  <div key={no} className={`code-line${no === DEMO_HIGHLIGHT_LINE ? " hl" : ""}`}>
                    <span className="ln">{no}</span>
                    <span className={`ind ind-${字下げ}`}></span>
                    <span className="code-text">{区間のspan(区間(行.slice(字下げ * 2), "記法"))}</span>
                  </div>
                );
              })}
            </div>
            <div className="canvas-stage">
              {/* 左の記法と対になる図解。 読み上げでも何の図か分かるよう名前を付ける */}
              <svg
                viewBox="0 0 600 380"
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label={isJa ? "左の記法から生成されるシーケンス図の例" : "Example sequence diagram generated from the notation on the left"}
              >
                <line className="lifeline" x1="100" y1="80" x2="100" y2="360" />
                <line className="lifeline" x1="300" y1="80" x2="300" y2="360" />
                <line className="lifeline" x1="500" y1="80" x2="500" y2="360" />

                <rect className="actor-box actor-focus-user" x="60" y="55" width="80" height="40" rx="3" />
                <text className="actor-label" x="100" y="80" textAnchor="middle">
                  User
                </text>
                <rect className="actor-box actor-focus-api" x="260" y="55" width="80" height="40" rx="3" />
                <text className="actor-label" x="300" y="80" textAnchor="middle">
                  API
                </text>
                <rect className="actor-box actor-focus-db" x="460" y="55" width="80" height="40" rx="3" />
                <text className="actor-label" x="500" y="80" textAnchor="middle">
                  DB
                </text>

                {/* 矢羽根も線と同じ組で動かす。 印 (marker) は参照元の色を継がないので、
                    塗りを currentColor にした図形として置き、 色の推移を線と共有する */}
                <path className="seq-msg seq-msg-1" d="M 100 150 L 292 150" />
                <path className="seq-head seq-msg-1" d="M292 145 L300 150 L292 155 Z" />
                <text className="seq-label seq-label-1" x="196" y="138" textAnchor="middle">
                  POST /login
                </text>

                <path className="seq-msg seq-msg-2" d="M 300 200 L 492 200" />
                <path className="seq-head seq-msg-2" d="M492 195 L500 200 L492 205 Z" />
                <text className="seq-label seq-label-2" x="396" y="188" textAnchor="middle">
                  SELECT user
                </text>

                <path className="seq-msg seq-msg-3" d="M 500 260 L 308 260" />
                <path className="seq-head seq-msg-3" d="M308 255 L300 260 L308 265 Z" />
                <text className="seq-label seq-label-3" x="404" y="248" textAnchor="middle">
                  row (1)
                </text>

                <path className="seq-msg seq-msg-4" d="M 300 320 L 108 320" />
                <path className="seq-head seq-msg-4" d="M108 315 L100 320 L108 325 Z" />
                <text className="seq-label seq-label-4" x="204" y="308" textAnchor="middle">
                  200 OK
                </text>

                <text className="phase-text phase-1" x="300" y="30">
                  phase 1 · call · 1.4s
                </text>
                <text className="phase-text phase-2" x="300" y="30">
                  phase 2 · query · 1.4s
                </text>
                <text className="phase-text phase-3" x="300" y="30">
                  phase 3 · return · 1.4s
                </text>
                <text className="phase-text phase-4" x="300" y="30">
                  phase 4 · ok · 1.4s
                </text>
              </svg>
              <div className="stage-progress" aria-hidden="true">
                <span className="seg on"></span>
                <span className="seg on"></span>
                <span className="seg"></span>
                <span className="seg"></span>
              </div>
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
            <h3>{isJa ? "エディタを開く" : "Open the editor"}</h3>
            <p>{isJa ? "ブラウザで /editor にアクセスする。 導入作業は要らない。" : "Visit /editor in your browser. Nothing to install."}</p>
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
              <CdlDiagramView hideMiniPhaseIndicator diagram={presetSequence} hideHeader />
            </div>
            <div className="example-body">
              <span className="example-tag tag-seq">{isJa ? "シーケンス図" : "sequence"}</span>
              <h3>{isJa ? "API 呼び出しの流れ" : "How an API call flows"}</h3>
              <p>{isJa ? "登場人物どうしのやりとりを時間軸で並べる。 認証や API 連携の説明に。" : "Lay out interactions between actors on a timeline. Ideal for explaining authentication and API integrations."}</p>
            </div>
          </Link>
          <Link className="example" to="/catalog/presets">
            <div className="example-thumb">
              <CdlDiagramView hideMiniPhaseIndicator diagram={presetTopology} hideHeader />
            </div>
            <div className="example-body">
              <span className="example-tag tag-topo">{isJa ? "トポロジー図" : "topology"}</span>
              <h3>{isJa ? "システム構成図" : "System topology"}</h3>
              <p>{isJa ? "部品の配置と、 要求がどこを通るかを同時に描く。" : "Show component placement and request paths in a single diagram."}</p>
            </div>
          </Link>
          <Link className="example" to="/catalog/presets">
            <div className="example-thumb">
              <CdlDiagramView hideMiniPhaseIndicator diagram={presetEr} hideHeader />
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
            {isJa ? "図のカタログを見る →" : "Browse the catalog →"}
          </Link>
        </div>
      </section>

      <section className="closing-cta">
        <div className="closing-cta-inner">
          <h2>{isJa ? "今すぐ、 書いて動かす。" : "Write it now, watch it move."}</h2>
          <p>{isJa ? "YAML を 1 つ書くだけ。 動く図を 1 分後に手に入れる。" : "One YAML file is all it takes. A moving diagram is yours a minute later."}</p>
          <div className="closing-cta-buttons">
            <Link className="btn-primary" to="/editor">
              {isJa ? "エディタを開く →" : "Open the editor →"}
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
