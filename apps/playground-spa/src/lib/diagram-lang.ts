import type { CdlDiagram } from "@cardenelabs/cdl";
import type { Locale } from "./i18n";

/**
 * 図を画面の言語で描く (#1910)。
 *
 * 描画エンジンは、図の言語 (`lang`) で形の絵の中の固定の字を引き替える (`PAY` → `決済`、
 * `hash` → `ハッシュ`、cdl#847)。 言語を書かない図は英語で描くので、日本語の画面に英語が残る。
 *
 * **見本の記法には書かない**。 見本の YAML / JSON を写した利用者の図が、カタログの画面の言語に
 * 縛られないようにするため。 画面が描く直前に当てる。
 *
 * **画面の言語に合わせる** (固定の日本語にしない)。 カタログは日本語と英語の表示を切り替えられ、
 * 英語の画面で形の字だけ日本語になる形を作らない。
 */

/**
 * 当てた図の控え。 言語ごとに、元の図から当てた図を引く。
 *
 * **同じ図と同じ言語には同じ object を返す**。 新しい object を返すと `CdlDiagramView` が
 * 別の図を渡されたとみなして描き直し、段が最初へ戻る (`palette-switch.ts` と同じ理由)。
 * 元の図を鍵にするので、元の図を捨てれば控えも消える。
 */
const 控え: Record<Locale, WeakMap<CdlDiagram, CdlDiagram>> = {
  ja: new WeakMap(),
  en: new WeakMap(),
};

/**
 * 図に画面の言語を当てる。
 *
 * **図が `lang` を書いていればそのまま返す**。 書き手が決めた言語を画面が上書きしない。
 */
export function 図に画面の言語を当てる(diagram: CdlDiagram, locale: Locale): CdlDiagram {
  if (diagram.lang !== undefined) return diagram;
  const 控えの図 = 控え[locale].get(diagram);
  if (控えの図 !== undefined) return 控えの図;
  const 当てた図: CdlDiagram = { ...diagram, lang: locale };
  控え[locale].set(diagram, 当てた図);
  return 当てた図;
}
