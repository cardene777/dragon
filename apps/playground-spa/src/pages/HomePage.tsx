import { Link } from "react-router";
import { CdlDiagramView } from "@cardenelabs/cdl";
import { PenLine, Play, Share2 } from "lucide-react";
import { presetSequence, presetTopology, presetEr } from "@/topics/catalog/presets.cdl";
import { SiteHeader } from "@/components/SiteHeader";
import { useLocale } from "@/lib/useLocale";

/**
 * dragon の入口。 見た目の SSOT = docs/design/app.pen の 01 トップ、
 * class の中身は src/styles/home.css。
 * 6 段構成 = 名乗り / 実物の窓 / 3 つの強み / 3 手順 / 用途 3 例 / 締めの誘い。
 */

/** 記述の 1 かたまり。 role が色を決める (k=鍵 / v=値 / p=区切り / id=登場人物 / a=矢印) */
interface CodeToken {
  text: string;
  role?: "k" | "v" | "p" | "id" | "a";
}

/** 記述の 1 行。 indent は 0 か 1 の 2 段だけ、 hl を付けた行が今の局面 */
interface CodeLine {
  no: number;
  indent: 0 | 1;
  tokens: CodeToken[];
  hl?: boolean;
}

const DEMO_CODE: CodeLine[] = [
  { no: 1, indent: 0, tokens: [{ text: "title:", role: "k" }, { text: " ログイン処理", role: "v" }] },
  { no: 2, indent: 0, tokens: [{ text: "type:", role: "k" }, { text: " sequence", role: "v" }] },
  { no: 3, indent: 0, tokens: [] },
  { no: 4, indent: 0, tokens: [{ text: "actors:", role: "k" }] },
  {
    no: 5,
    indent: 1,
    tokens: [
      { text: "- { ", role: "p" },
      { text: "id: ", role: "k" },
      { text: "user", role: "v" },
      { text: ", ", role: "p" },
      { text: "label: ", role: "k" },
      { text: "User", role: "v" },
      { text: " }", role: "p" },
    ],
  },
  {
    no: 6,
    indent: 1,
    tokens: [
      { text: "- { ", role: "p" },
      { text: "id: ", role: "k" },
      { text: "api", role: "v" },
      { text: ", ", role: "p" },
      { text: "label: ", role: "k" },
      { text: "API", role: "v" },
      { text: " }", role: "p" },
    ],
  },
  {
    no: 7,
    indent: 1,
    tokens: [
      { text: "- { ", role: "p" },
      { text: "id: ", role: "k" },
      { text: "db", role: "v" },
      { text: ", ", role: "p" },
      { text: "label: ", role: "k" },
      { text: "DB", role: "v" },
      { text: " }", role: "p" },
    ],
  },
  { no: 8, indent: 0, tokens: [] },
  { no: 9, indent: 0, tokens: [{ text: "flow:", role: "k" }] },
  {
    no: 10,
    indent: 1,
    tokens: [
      { text: "- ", role: "p" },
      { text: "user", role: "id" },
      { text: " -> ", role: "a" },
      { text: "api", role: "id" },
      { text: ": ", role: "p" },
      { text: "POST /login", role: "v" },
    ],
  },
  {
    no: 11,
    indent: 1,
    hl: true,
    tokens: [
      { text: "- ", role: "p" },
      { text: "api", role: "id" },
      { text: " -> ", role: "a" },
      { text: "db", role: "id" },
      { text: ": ", role: "p" },
      { text: "SELECT user", role: "v" },
    ],
  },
  {
    no: 12,
    indent: 1,
    tokens: [
      { text: "- ", role: "p" },
      { text: "db", role: "id" },
      { text: " -> ", role: "a" },
      { text: "api", role: "id" },
      { text: ": ", role: "p" },
      { text: "row (1)", role: "v" },
    ],
  },
  {
    no: 13,
    indent: 1,
    tokens: [
      { text: "- ", role: "p" },
      { text: "api", role: "id" },
      { text: " -> ", role: "a" },
      { text: "user", role: "id" },
      { text: ": ", role: "p" },
      { text: "200 OK", role: "v" },
    ],
  },
  { no: 14, indent: 0, tokens: [] },
  { no: 15, indent: 0, tokens: [{ text: "animate:", role: "k" }] },
  { no: 16, indent: 1, tokens: [{ text: "mode:", role: "k" }, { text: " phase", role: "v" }] },
  { no: 17, indent: 1, tokens: [{ text: "duration:", role: "k" }, { text: " 600", role: "v" }] },
  { no: 18, indent: 1, tokens: [{ text: "easing:", role: "k" }, { text: " ease-out", role: "v" }] },
  { no: 19, indent: 1, tokens: [{ text: "loop:", role: "k" }, { text: " true", role: "v" }] },
];

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
          <span className="chip">v0.7</span>
          <span className="chip">49 種の形 × 時間軸 × 絶対配置</span>
        </div>
        <h1>
          {isJa ? (
            <>より自由な<em>図</em>を</>
          ) : (
            <>Diagrams <em>without limits</em></>
          )}
        </h1>
        <p className="lead">
          {isJa
            ? "形を選び置き場所を決め局面ごとに動かす。 型に合わせて諦めていた図が、 文章のまま組み上がる。"
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
              {DEMO_CODE.map((line) => (
                <div key={line.no} className={`code-line${line.hl ? " hl" : ""}`}>
                  <span className="ln">{line.no}</span>
                  <span className={`ind ind-${line.indent}`}></span>
                  <span className="code-text">
                    {line.tokens.map((tok, i) => (
                      <span key={i} className={tok.role ? `t-${tok.role}` : undefined}>
                        {tok.text}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
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
            <h3>{isJa ? "局面ごとに動き出す" : "Motion, phase by phase"}</h3>
            <p>{isJa ? "局面を切り替えると図そのものが推移する。 数値は補間され、 順序と因果が目に見える。" : "Switch phases and the diagram itself transitions. Values interpolate, and order and causality become visible."}</p>
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
          <span className="eyebrow">3 steps</span>
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
            <p>{isJa ? "右の実況表示に、 局面ごとに動く図が出る。 場所を指す文字列で共有もでき、 持ち出しもできる。" : "The live view on the right shows a diagram that moves phase by phase. Share it by URL, or take it with you."}</p>
          </div>
        </div>
      </section>

      <section className="examples">
        <div className="section-head">
          <span className="eyebrow">use case</span>
          <h2>{isJa ? "こんな図が書ける。" : "Diagrams you can write."}</h2>
        </div>
        <div className="examples-grid">
          <Link className="example" to="/catalog/presets">
            <div className="example-thumb">
              <CdlDiagramView hideMiniPhaseIndicator diagram={presetSequence} hideHeader />
            </div>
            <div className="example-body">
              <span className="example-tag tag-seq">sequence</span>
              <h3>{isJa ? "API 呼び出しの流れ" : "How an API call flows"}</h3>
              <p>{isJa ? "登場人物どうしのやりとりを時間軸で並べる。 認証や API 連携の説明に。" : "Lay out interactions between actors on a timeline. Ideal for explaining authentication and API integrations."}</p>
            </div>
          </Link>
          <Link className="example" to="/catalog/presets">
            <div className="example-thumb">
              <CdlDiagramView hideMiniPhaseIndicator diagram={presetTopology} hideHeader />
            </div>
            <div className="example-body">
              <span className="example-tag tag-topo">topology</span>
              <h3>{isJa ? "システム構成図" : "System topology"}</h3>
              <p>{isJa ? "部品の配置と、 要求がどこを通るかを同時に描く。" : "Show component placement and request paths in a single diagram."}</p>
            </div>
          </Link>
          <Link className="example" to="/catalog/presets">
            <div className="example-thumb">
              <CdlDiagramView hideMiniPhaseIndicator diagram={presetEr} hideHeader />
            </div>
            <div className="example-body">
              <span className="example-tag tag-er">er</span>
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
