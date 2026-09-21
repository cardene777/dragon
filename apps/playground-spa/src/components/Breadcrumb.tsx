import { Fragment } from "react";
import { Link } from "react-router";
import { useLocale } from "@/lib/useLocale";
import { 画面の名前を引く } from "@/lib/site-destinations";

/**
 * 道筋の 1 段。
 *
 * `行き先` だけを渡すと名前の表から字を引く。 表に無い字 (分類の呼び名 / 見本の識別子) は
 * `字` で直に渡す。 `行き先` を省いた段が今いる場所で、押せない字として出る。
 */
export interface 道筋の段 {
  /** 押せる行き先。 省くと今いる場所として出す */
  行き先?: string;
  /** 出す字。 省いた時は `行き先` を名前の表で引く */
  字?: string;
}

/**
 * 見た目の class。 画面によって 2 つある (#2453)。
 *
 * カタログの 2 画面は `catalog-crumb`、他は `nm-crumb`。 見た目は別々の CSS が持つので、
 * **この部品では揃えない**。 揃えると見た目が変わり、訳す作業が見た目の変更を巻き込む。
 */
export type 道筋の見た目 = "nm-crumb" | "catalog-crumb";

/**
 * 画面の上部に出る道筋 (#2451)。
 *
 * 見本の詳細 / 更新履歴 / 参加方法 の 3 画面が同じ markup を別々に書いていた。
 * 読み上げの名前だけは 3 つとも言語で選んでいたが、**中身の字は日本語を直に書いていた**ため
 * 英語で開いても `概要` と出ていた。 1 つにまとめて、言語はここで選ぶ。
 *
 * 見た目は `src/styles/` の `.nm-crumb` が持つ。 markup の形は 3 画面と同じにしてあるので、
 * 見た目は変わらない。
 */
export function Breadcrumb({
  段,
  見た目 = "nm-crumb",
}: {
  段: readonly 道筋の段[];
  見た目?: 道筋の見た目;
}): React.ReactElement {
  const [locale] = useLocale();
  // 段が無い道筋は出さない。 空の `<nav>` を残すと読み上げに空の目印だけが載る
  if (段.length === 0) {
    throw new Error("道筋の段が 1 つも無い");
  }
  return (
    <nav aria-label={locale === "ja" ? "道筋" : "Breadcrumb"} className={見た目}>
      {段.map((s, i) => {
        const 字 = s.字 ?? (s.行き先 === undefined ? undefined : 画面の名前を引く(s.行き先, locale));
        if (字 === undefined) {
          throw new Error(`道筋の段に字も行き先も無い (${i} 段目)`);
        }
        // 段を包まない。 `.nm-crumb` は直の子を横に並べて間隔を取るので、
        // 包むと区切りと字が 1 つの枠に入って間隔が変わる
        return (
          <Fragment key={`${s.行き先 ?? ""}-${字}`}>
            {i > 0 && <span aria-hidden="true">›</span>}
            {s.行き先 === undefined ? (
              <span className="cur">{字}</span>
            ) : (
              <Link to={s.行き先}>{字}</Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
