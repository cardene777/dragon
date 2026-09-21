import { Link, useLocation } from "react-router";
import { useLocale } from "@/lib/useLocale";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * 見つからない頁。 見た目の SSOT = docs/design/app.pen の 09 見つからない頁、
 * class の中身は src/styles/home.css の .v4-404-*。
 * シーンの目盛りを空のまま置くのは、 「まだ何も書かれていない」 ことを図の言葉で言うため。
 *
 * ## 入口の数は一覧から導く (#2445)
 *
 * 説明文は「いくつの入口から探せるか」 を言う。 以前はその数を字で書いており、
 * **4 と言いながら釦は 3 つ** だった。 釦は実装が持ち、数は文の中の字だったので、
 * 釦を足し引きしても追従しない。
 *
 * 行き先を下の一覧で持ち、釦も説明文の数もそこから作る。 増やしても減らしても揃う。
 */

/** 行き先。 釦の並びと、説明文が言う入口の数の両方がここから出る */
const 行き先 = [
  { to: "/editor", ja: "編集画面を開く →", en: "open editor →", 強い: true },
  { to: "/catalog", ja: "カタログを見る", en: "browse catalog", 強い: false },
  { to: "/docs", ja: "使い方を読む", en: "read docs", 強い: false },
] as const;

/**
 * 説明文。 入口の数を受け取って差し込む。
 *
 * **英語も数を差し込む**。 綴り (`three`) を字で置くと、日本語だけ直した日に英語が取り残される。
 */
function 説明文(数: number, isJa: boolean): string {
  return isJa
    ? `お探しの頁は移動または削除されたか、 そもそも存在しません。 dragon の ${数} つの入口から探してみてください。`
    : `The page you are looking for was moved, deleted, or never existed. Try one of dragon's ${数} entry points.`;
}

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
        {/* 段の目盛りを空のまま置いた飾り。 入口ではないので数に入れない */}
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
        <p className="v4-404-lead">{説明文(行き先.length, isJa)}</p>
        <div className="v4-404-cta">
          {行き先.map((先) => (
            <Link
              key={先.to}
              to={先.to}
              className={先.強い ? "v4-btn-primary" : "v4-btn-secondary"}
            >
              {isJa ? 先.ja : 先.en}
            </Link>
          ))}
        </div>
        <p className="v4-404-path">{location.pathname}</p>
      </main>
    </div>
  );
}
