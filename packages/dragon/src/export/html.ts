/**
 * 1 file で開ける HTML。字と、頁に図を置いて動かす script と、原本の JSON を収める。
 *
 * 開くと頁と同じく、枠の幅で見せ方を選び、動きを嫌う設定では止め絵を釦で送る。
 * 外へ何も取りに行かない。絵柄集の絵柄 (`tabler:<名前>`) は、図が使った絵柄の形だけを頁に収める (#3493)。
 *
 * 命令の書き出し (`dragon export`) とブラウザの書き出す入口 (`captureHtml`、#3667) の両方がこの組み方を使う。
 * 再生の script (`player.global.js`) の中身は呼ぶ側が読んで渡す。命令は file から、ブラウザは入口の隣から読む。
 * ブラウザも読むので、Node の組み込みの module を読まない。
 */
import { iconsElement } from "../blocks/icon/page-icons";
import { setIconFields } from "../blocks/icon/set-fields";
import { esc } from "../render/parts";
import type { PagePlan } from "./page";

/**
 * 頁の HTML。`plan` は原本から集めた物 (`planPage`)、`fontCss` は字の `@font-face` の並び、`player` は再生の script の中身。
 * 頁の `lang` 属性は図の中の字の言葉にし、名前をその言葉の声で読ませる (#3001)
 */
export function pageHtml(plan: Pick<PagePlan, "source" | "palette" | "vars" | "lang" | "rendered">, fontCss: string, player: string): string {
  const diagram = plan.source;
  // `</script>` で script が途切れないよう、`<` を JSON の逃がし方で書く
  const json = JSON.stringify(diagram).replace(/</g, "\\u003c");
  const options = JSON.stringify({ palette: plan.palette.id, theme: plan.rendered.theme, lang: plan.lang });
  return [
    "<!doctype html>",
    `<html lang="${plan.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`,
    `<title>${esc(diagram.title)}</title>`,
    // 再生の帯の左右と下の余白は置いた頁が付ける (`player.ts`)。図は窓の幅いっぱいに置き、帯の字と釦と進み具合だけを窓の縁から離す (#3398)。
    // 試す図は段の説明の帯の下に入力の帯を置くので、下の余白は帯ではなく再生の部品の下に付け、最後に置いた帯を窓の下の縁から離す (#3437)。
    // 配管の図の下の段の矢印と呼び出しの結果も、帯と同じだけ窓の左右の縁から離す (#3418、#3450)
    `<style>${fontCss}:root{${plan.vars}}html,body{margin:0}body{background:var(--bg)}.dg-player{padding-bottom:12px}.dg-bar,.dg-calls{padding:0 16px}</style>`,
    '</head><body><div id="dragon"></div>',
    `<script type="application/json" id="dragon-diagram">${json}</script>`,
    // 頁の script が読み込みの時に登録するので、script より前に置く
    iconsElement(setIconFields(diagram).map(([, value]) => value)),
    `<script>${player.replace(/<\/script/gi, "<\\/script")}</script>`,
    `<script>DragonPlayer.mountDiagram(document.getElementById("dragon"),JSON.parse(document.getElementById("dragon-diagram").textContent),${options});</script>`,
    "</body></html>",
  ].join("\n");
}
