/**
 * 頁に収める絵柄集の絵柄 (#3493)。書き出した HTML の頁と `dragon embed` の頁は外を読めないので、図が使った絵柄の形だけを頁に収める。
 *
 * 書く側 (書き出しの命令) は使った絵柄の表を `<script type="application/json" id="dragon-icons">` に書き、
 * 頁の script は読み込みの時にそれを読んで登録する。表の要素は script より前に置くので、script が動く時には頁に在る。
 */
import { registerTabler, tablerPath } from "./sets";

/** 絵柄の表を置く要素の id */
const ID = "dragon-icons";

/**
 * 名前の並び `values` (`tabler:<名前>`) の形を収めた要素の字。登録した表に在る絵柄だけを、絵柄集の名前 (`tabler`) を鍵にした表にする。
 * 収める絵柄が無ければ空の字
 */
export function iconsElement(values: readonly string[]): string {
  const tabler: Record<string, string> = {};
  for (const value of values) {
    const d = tablerPath(value);
    if (d !== undefined) tabler[value.slice("tabler:".length)] = d;
  }
  if (Object.keys(tabler).length === 0) return "";
  const tables = { tabler };
  // `</script>` で要素が途切れないよう、`<` を JSON の逃がし方で書く
  return `<script type="application/json" id="${ID}">${JSON.stringify(tables).replace(/</g, "\\u003c")}</script>`;
}

/** 頁 `doc` に収めた絵柄の表を登録する。表が無いか読めなければ何もしない (頁の図は誤りの文を出す) */
export function registerPageIcons(doc: Document): void {
  const text = doc.getElementById(ID)?.textContent;
  if (!text) return;
  let tables: unknown;
  try {
    tables = JSON.parse(text);
  } catch {
    return;
  }
  if (tables === null || typeof tables !== "object") return;
  const tabler = (tables as { tabler?: unknown }).tabler;
  if (tabler !== null && typeof tabler === "object") registerTabler(tabler as Record<string, string>);
}
