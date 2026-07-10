import { Link } from "react-router";
import { CdlDiagramView } from "@cardenelabs/cdl";
import { presetSequence, presetTopology, presetEr } from "@/topics/catalog/presets.cdl";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * dragon top page = 旧 apps/playground/src/pages/index.astro の忠実再現。
 * 6 section 構成: hero / hero-demo (canvas mockup + animated seq SVG) /
 * features (3 card) / quickstart (3 step) / examples (3 preset thumbnail) / closing-cta。
 * CSS SSOT = src/styles/home.css (旧 index.astro <style> tag 706 line)。
 */
export function HomePage(): React.ReactElement {
  return (
    <div>
      <SiteHeader />

      <section className="hero">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="ver">v0.5</span>
            <span>text dsl × svg animation</span>
          </div>
          <h1>
            書くと、<em>動く</em>。
          </h1>
          <p className="lead">
            YAML風の1ファイルに登場人物と流れを書くだけで、phaseごとに動くSVG図が手に入る。インストール不要、ブラウザで開いて1分で走り出す。
          </p>
          <div className="hero-cta">
            <Link className="btn-primary" to="/editor">
              エディタを開く →
            </Link>
            <Link className="btn-secondary" to="/docs">
              ドキュメントを読む
            </Link>
          </div>
        </div>
      </section>

      <section className="hero-demo">
        <div className="canvas">
          <div className="canvas-bar">
            <div className="dots">
              <span className="dot r"></span>
              <span className="dot y"></span>
              <span className="dot g"></span>
            </div>
            <span className="file">
              ▲ <b>api-call.dragon</b>
            </span>
            <span className="phase">
              <span className="live-dot"></span> phase 2 / 4 · API → DB
            </span>
          </div>
          <div className="canvas-body">
            <pre className="canvas-code">
              <span className="ln">1</span>
              <span className="k">title</span>: <span className="s">"ログインAPI"</span>
              {"\n"}
              <span className="ln">2</span>
              <span className="k">type</span>: sequence
              {"\n"}
              <span className="ln">3</span>
              {"\n"}
              <span className="ln">4</span>
              <span className="k">actors</span>:
              {"\n"}
              <span className="ln">5</span>
              {"  - User"}
              {"\n"}
              <span className="ln">6</span>
              {"  - API"}
              {"\n"}
              <span className="ln">7</span>
              {"  - DB"}
              {"\n"}
              <span className="ln">8</span>
              {"\n"}
              <span className="ln">9</span>
              <span className="k">flow</span>:
              {"\n"}
              <span className="ln">10</span>
              {"  - "}
              <span className="hl-1">
                User → API: <span className="s">"login"</span>
              </span>
              {"\n"}
              <span className="ln">11</span>
              {"  - "}
              <span className="hl-2">
                API → DB: <span className="s">"select"</span>
              </span>
              {"\n"}
              <span className="ln">12</span>
              {"  - "}
              <span className="hl-3">
                DB → API: <span className="s">"row"</span>
              </span>
              {"\n"}
              <span className="ln">13</span>
              {"  - "}
              <span className="hl-4">
                API → User: <span className="s">"200"</span>
              </span>
              {"\n"}
              <span className="ln">14</span>
              {"\n"}
              <span className="ln">15</span>
              <span className="k">animation</span>:
              {"\n"}
              <span className="ln">16</span>
              {"  - step: "}
              <span className="s">"call"</span>
              {" 1.4s"}
              {"\n"}
              <span className="ln">17</span>
              {"  - step: "}
              <span className="s">"query"</span>
              {" 1.4s"}
              {"\n"}
              <span className="ln">18</span>
              {"  - step: "}
              <span className="s">"return"</span>
              {" 1.4s"}
              {"\n"}
              <span className="ln">19</span>
              {"  - step: "}
              <span className="s">"ok"</span>
              {" 1.4s"}
            </pre>
            <div className="canvas-stage">
              <svg viewBox="0 0 600 380" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <marker id="ar-teal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M0,0 L10,5 L0,10 z" fill="#1f4d6e" />
                  </marker>
                  <marker id="ar-purple" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M0,0 L10,5 L0,10 z" fill="#6d28d9" />
                  </marker>
                  <marker id="ar-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M0,0 L10,5 L0,10 z" fill="#4ea36a" />
                  </marker>
                </defs>
                <line className="lifeline" x1="100" y1="80" x2="100" y2="360" />
                <line className="lifeline" x1="300" y1="80" x2="300" y2="360" />
                <line className="lifeline" x1="500" y1="80" x2="500" y2="360" />

                <rect className="actor-box actor-focus-user" x="60" y="55" width="80" height="40" rx="7" />
                <text className="actor-label" x="100" y="80" textAnchor="middle">
                  User
                </text>
                <rect className="actor-box actor-focus-api" x="260" y="55" width="80" height="40" rx="7" />
                <text className="actor-label" x="300" y="80" textAnchor="middle">
                  API
                </text>
                <rect className="actor-box actor-focus-db" x="460" y="55" width="80" height="40" rx="7" />
                <text className="actor-label" x="500" y="80" textAnchor="middle">
                  DB
                </text>

                <path className="seq-msg seq-msg-1" d="M 100 150 L 300 150" markerEnd="url(#ar-teal)" />
                <text className="seq-label seq-label-1" x="200" y="138" textAnchor="middle">
                  POST /login
                </text>

                <path className="seq-msg seq-msg-2" d="M 300 200 L 500 200" markerEnd="url(#ar-teal)" />
                <text className="seq-label seq-label-2" x="400" y="188" textAnchor="middle">
                  SELECT user
                </text>

                <path className="seq-msg seq-msg-3" d="M 500 260 L 300 260" markerEnd="url(#ar-purple)" />
                <text className="seq-label seq-label-3" x="400" y="248" textAnchor="middle">
                  row (1)
                </text>

                <path className="seq-msg seq-msg-4" d="M 300 320 L 100 320" markerEnd="url(#ar-green)" />
                <text className="seq-label seq-label-4" x="200" y="308" textAnchor="middle">
                  200 OK
                </text>

                <text className="phase-text phase-1" x="300" y="30" fill="#1f4d6e">
                  phase 1 · call · 1.4s
                </text>
                <text className="phase-text phase-2" x="300" y="30" fill="#1f4d6e">
                  phase 2 · query · 1.4s
                </text>
                <text className="phase-text phase-3" x="300" y="30" fill="#6d28d9">
                  phase 3 · return · 1.4s
                </text>
                <text className="phase-text phase-4" x="300" y="30" fill="#4ea36a">
                  phase 4 · ok · 1.4s
                </text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="section-head">
          <span className="eyebrow">なぜdragonか</span>
          <h2>書く手間を、動く成果に。</h2>
        </div>
        <div className="feature-grid">
          <div className="feature">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
            </div>
            <h3>YAML風で書ける</h3>
            <p>登場人物と流れを箇条書きで宣言するだけ。図の内部構造を組む必要はない。</p>
          </div>
          <div className="feature">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <h3>phaseごとに動く</h3>
            <p>state / tween / setで数値を補間し、phaseで焦点を切替える。静止画では伝わらない順序が伝わる。</p>
          </div>
          <div className="feature">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12h18M12 3v18" />
              </svg>
            </div>
            <h3>install不要</h3>
            <p>ブラウザでエディタを開いてYAMLを書けば、その場で動くSVGが手に入る。npm installも設定ファイルもいらない。</p>
          </div>
        </div>
      </section>

      <section className="quickstart">
        <div className="section-head">
          <span className="eyebrow">3 steps</span>
          <h2>1分で走り出す。</h2>
        </div>
        <div className="steps">
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <h3>エディタを開く</h3>
              <p>
                ブラウザで<code>/editor</code>にアクセス。 install不要。
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <h3>YAMLを書く</h3>
              <p>
                登場人物と流れを箇条書きで宣言する。<code>type: sequence</code>で図の種類を選ぶ。
              </p>
              <pre className="step-code">
                <span className="k">title</span>: <span className="s">"ログインAPI"</span>
                {"\n"}
                <span className="k">type</span>: sequence
                {"\n"}
                <span className="k">actors</span>:
                {"\n  - User\n  - API\n"}
                <span className="k">flow</span>:
                {"\n  - User → API: "}
                <span className="s">"login"</span>
              </pre>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
              <h3>SVGが動き出す</h3>
              <p>右のライブプレビューにphase単位で動くSVGが表示される。 URLで共有もダウンロードもできる。</p>
            </div>
          </div>
        </div>
      </section>

      <section className="examples">
        <div className="section-head">
          <span className="eyebrow">use case</span>
          <h2>こんな図が書ける。</h2>
        </div>
        <div className="examples-grid">
          <Link className="example" to="/catalog/presets">
            <div className="example-thumb">
              <CdlDiagramView diagram={presetSequence} hideHeader />
            </div>
            <div className="example-body">
              <span className="example-tag">sequence</span>
              <h3>API呼び出しの流れ</h3>
              <p>登場人物どうしのやりとりを時間軸で並べる。認証 / API連携の説明に。</p>
            </div>
          </Link>
          <Link className="example" to="/catalog/presets">
            <div className="example-thumb">
              <CdlDiagramView diagram={presetTopology} hideHeader />
            </div>
            <div className="example-body">
              <span className="example-tag">topology</span>
              <h3>システム構成図</h3>
              <p>コンポーネントの配置と、リクエストがどこを通るかを同時に描く。</p>
            </div>
          </Link>
          <Link className="example" to="/catalog/presets">
            <div className="example-thumb">
              <CdlDiagramView diagram={presetEr} hideHeader />
            </div>
            <div className="example-body">
              <span className="example-tag">er</span>
              <h3>DBスキーマ</h3>
              <p>entityと関係性を順番に見せる。 schema review / onboardingに。</p>
            </div>
          </Link>
        </div>
        <div className="examples-more">
          <Link className="btn-secondary" to="/catalog">
            図のカタログを見る →
          </Link>
        </div>
      </section>

      <section className="closing-cta">
        <div className="closing-cta-inner">
          <h2>今すぐ、書いて動かす。</h2>
          <p>YAMLを1ファイル書くだけ。 動く図を1分後に手に入れる。</p>
          <div className="closing-cta-buttons">
            <Link className="btn-primary" to="/editor">
              エディタを開く →
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
