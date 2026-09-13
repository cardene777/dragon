import { Link, useLocation } from "react-router";
import { useLocale } from "@/lib/useLocale";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * 見つからない頁。 見た目の SSOT = docs/design/app.pen の 09 見つからない頁、
 * class の中身は src/styles/home.css の .v4-404-*。
 * シーンの目盛りを空のまま置くのは、 「まだ何も書かれていない」 ことを図の言葉で言うため。
 */
export function NotFoundPage(): React.ReactElement {
  const [locale] = useLocale();
  const location = useLocation();
  const isJa = locale === "ja";
  return (
    <div>
      <SiteHeader />
      <main className="v4-404">
        <div className="v4-404-code" aria-label="404">
          <span aria-hidden="true">4</span>
          <span className="zero" aria-hidden="true">
            0
          </span>
          <span aria-hidden="true">4</span>
        </div>
        <div className="v4-404-phases" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h1 className="v4-404-title">
          <em>{isJa ? "そこは" : "That page"}</em>
          <span>{isJa ? "、 まだ書かれていない。" : " has not been written yet."}</span>
        </h1>
        <p className="v4-404-lead">
          {isJa
            ? "お探しの頁は移動または削除されたか、 そもそも存在しません。 dragon の 4 つの入口から探してみてください。"
            : "The page you are looking for was moved, deleted, or never existed. Try one of dragon's four entry points."}
        </p>
        <div className="v4-404-cta">
          <Link to="/editor" className="v4-btn-primary">
            {isJa ? "編集画面を開く →" : "open editor →"}
          </Link>
          <Link to="/catalog" className="v4-btn-secondary">
            {isJa ? "カタログを見る" : "browse catalog"}
          </Link>
          <Link to="/docs" className="v4-btn-secondary">
            {isJa ? "使い方を読む" : "read docs"}
          </Link>
        </div>
        <p className="v4-404-path">{location.pathname}</p>
      </main>
    </div>
  );
}
