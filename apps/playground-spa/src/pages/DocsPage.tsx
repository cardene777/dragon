import { useEffect } from "react";
import { Link } from "react-router";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * dragon docs top = 旧 apps/playground/src/pages/docs/index.astro の忠実再現。
 * docs-hero + docs-hero-features (6 feature card) + docs-hero-snippet (code snippet)。
 * CSS SSOT = src/styles/docs-site.css (旧 apps/playground/src/styles/docs-site.css 移植)。
 * CSS selectors は `body.docs-body` を前提とするため、 mount 時に document.body に class 付与。
 */
export function DocsPage(): React.ReactElement {
  useEffect(() => {
    document.body.classList.add("docs-body");
    return () => document.body.classList.remove("docs-body");
  }, []);
  return (
    <div className="docs-body">
      <SiteHeader />
      <main className="docs-hero-shell">
        <section className="docs-hero">
          <div className="docs-hero-eyebrow">dragon · text dsl × svg animation</div>
          <h1 className="docs-hero-title">
            <span>書くと、</span>
            <span className="docs-hero-title-accent">動く</span>
            <span>。</span>
          </h1>
          <p className="docs-hero-lead">
            dragon は YAML 風 Text DSL を書くだけで sequence / topology / er / state ほか 12 種の図と animation が出力される OSS。
            mermaid 感覚の simplicity と、 phase / state / tween による dynamic 表現を両立。
            install 不要、 web editor で 30 秒から書ける。
          </p>
          <div className="docs-hero-cta">
            <Link to="/editor" className="docs-hero-cta-primary">
              Quickstart (5 分) →
            </Link>
            <Link to="/catalog" className="docs-hero-cta-secondary">
              Catalog で見本を見る
            </Link>
          </div>
        </section>

        <section className="docs-hero-features">
          <Link to="/editor" className="docs-feature-card">
            <div className="docs-feature-icon">⚡</div>
            <h2>5 分で動かす</h2>
            <p>install から最小 diagram → React 表示までの最短経路。</p>
          </Link>
          <Link to="/catalog/cookbook" className="docs-feature-card">
            <div className="docs-feature-icon">📖</div>
            <h2>9 実用例</h2>
            <p>sequence / swimlane / ER / FSM / topology ほか、 現場頻出パターン集。</p>
          </Link>
          <Link to="/catalog/primitives" className="docs-feature-card">
            <div className="docs-feature-icon">🧱</div>
            <h2>5 つの基本要素</h2>
            <p>lane / node / edge / state / phase で任意の図を組み立て。</p>
          </Link>
          <Link to="/catalog/presets" className="docs-feature-card">
            <div className="docs-feature-icon">🎁</div>
            <h2>6 種類の高位 API</h2>
            <p>swimlane / flow / sequence / topology / er / stateMachine。 mermaid 同等。</p>
          </Link>
          <Link to="/catalog" className="docs-feature-card">
            <div className="docs-feature-icon">🔄</div>
            <h2>Mermaid からの移行</h2>
            <p>sequenceDiagram / erDiagram / stateDiagram-v2 の 1:1 対応表。</p>
          </Link>
          <Link to="/catalog/animation" className="docs-feature-card">
            <div className="docs-feature-icon">👁</div>
            <h2>「目」 による自動検証</h2>
            <p>書いた宣言が画面に出ているかを engine が自動検証 (LLM 不要)。</p>
          </Link>
        </section>

        <section className="docs-hero-snippet">
          <h2>30 秒で雰囲気を掴む</h2>
          <pre>
            <code>{`import { diagram } from "@cardenelabs/cdl";
import { CdlDiagramView } from "@cardenelabs/cdl/react";

const hello = diagram("hello", { topic: "Hello world" })
  .lane("left",  { x: 0,   width: 320 })
  .lane("right", { x: 460, width: 320 })
  .nodes([
    { id: "a", lane: "left",  stack: 0, kind: "actor",    title: "Client" },
    { id: "b", lane: "right", stack: 0, kind: "function", title: "greet()" },
  ])
  .edge("a", "b", { label: "hello" })
  .phase("call", { duration: 1500, title: "Call", body: "Client が greet を呼ぶ。" },
    (p) => p.activate("a", "b", "a-b"))
  .build();

export const App = () => <CdlDiagramView diagram={hello} />;`}</code>
          </pre>
          <Link to="/editor" className="docs-hero-cta-primary docs-hero-snippet-cta">
            続き → Quickstart
          </Link>
        </section>
      </main>
    </div>
  );
}
