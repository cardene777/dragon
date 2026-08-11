import { useEffect } from "react";
import { Link } from "react-router";
import { Blocks, BookOpen, Gift, Repeat, ScanEye, Timer } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * ドキュメントの入口。 見た目の SSOT = docs/design/app.pen の 05 ドキュメント、
 * class の中身は src/styles/docs-site.css。
 * 要点は枠で囲わず、 頭の罫線だけで区切る。
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
          <div className="docs-hero-eyebrow">docs · v0.5</div>
          <h1 className="docs-hero-title">ドキュメント</h1>
          <p className="docs-hero-lead">
            書き方の全体像を 1 枚にまとめた読み物。 最初の 5 分で動かし、 次の 30 分で 5 つの基本要素と
            6 種類の高位 API を掴む。 Mermaid からの移行と、 「目」 による自動検証もここで扱う。
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
            <div className="docs-feature-icon">
              <Timer size={17} />
            </div>
            <h2>5 分で動かす</h2>
            <p>導入作業なし。 ブラウザで開いて貼るだけ。</p>
          </Link>
          <Link to="/catalog/cookbook" className="docs-feature-card">
            <div className="docs-feature-icon">
              <BookOpen size={17} />
            </div>
            <h2>9 実用例</h2>
            <p>現場でよく出る形をそのまま図にした集合。</p>
          </Link>
          <Link to="/catalog/primitives" className="docs-feature-card">
            <div className="docs-feature-icon">
              <Blocks size={17} />
            </div>
            <h2>5 つの基本要素</h2>
            <p>覚えるのは 5 つ。 残りは組合せで足りる。</p>
          </Link>
          <Link to="/catalog/presets" className="docs-feature-card">
            <div className="docs-feature-icon">
              <Gift size={17} />
            </div>
            <h2>6 種類の高位 API</h2>
            <p>種類を 1 行選ぶだけで骨格ができる。</p>
          </Link>
          <Link to="/catalog" className="docs-feature-card">
            <div className="docs-feature-icon">
              <Repeat size={17} />
            </div>
            <h2>Mermaid から移行</h2>
            <p>既存の記法を 1 対 1 で置き換えられる。</p>
          </Link>
          <Link to="/catalog/animation" className="docs-feature-card">
            <div className="docs-feature-icon">
              <ScanEye size={17} />
            </div>
            <h2>「目」 が検証する</h2>
            <p>読めない図を書いた時点で知らせが出る。</p>
          </Link>
        </section>

        <section className="docs-hero-snippet">
          <div className="docs-hero-snippet-head">
            <span className="docs-hero-snippet-no">02</span>
            <h2>30 秒で雰囲気を掴む</h2>
          </div>
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
