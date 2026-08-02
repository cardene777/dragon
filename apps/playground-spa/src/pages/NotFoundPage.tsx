import { Link } from "react-router";
import { useLocale } from "@/lib/useLocale";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * 404 page = 旧 apps/playground/src/pages/404.astro 忠実復元。
 * v4-404 = 大きい 404 code + em 強調 title + 4 CTA (overview / editor / catalog / docs)。
 * CSS = home.css の .v4-404-* class (旧 404.astro <style> tag 移植)。
 */
export function NotFoundPage(): React.ReactElement {
  const [locale] = useLocale();
  const isJa = locale === "ja";
  return (
    <div>
      <SiteHeader />
      <main className="v4-404">
        <div className="v4-404-code">404</div>
        <h1 className="v4-404-title">
          <em>{isJa ? "そこは" : "That page"}</em>
          <span>{isJa ? "、 まだ書かれていない。" : " has not been written yet."}</span>
        </h1>
        <p className="v4-404-lead">
          {isJa
            ? "お探しの page は移動 / 削除されたか、 そもそも存在しません。 dragon の 4 つの入口から探してみてください。"
            : "The page you are looking for was moved, deleted, or never existed. Try one of dragon's four entry points."}
        </p>
        <div className="v4-404-cta">
          <Link to="/" className="v4-btn-primary">
            overview →
          </Link>
          <Link to="/editor" className="v4-btn-secondary">
            open editor
          </Link>
          <Link to="/catalog" className="v4-btn-secondary">
            browse catalog
          </Link>
          <Link to="/docs" className="v4-btn-secondary">
            read docs
          </Link>
        </div>
      </main>
    </div>
  );
}
