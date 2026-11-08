/**
 * 1 file で開ける HTML。削った字と、頁に図を置いて動かす script と、原本の JSON を収める。
 *
 * 開くと頁と同じく、枠の幅で見せ方を選び、動きを嫌う設定では止め絵を釦で送る。
 * 外へ何も取りに行かない。絵柄集の絵柄 (`tabler:<名前>`) は、図が使った絵柄の形だけを頁に収める (#3493)。
 */
import { readFileSync } from "node:fs";
import { iconsElement } from "../blocks/icon/page-icons";
import { setIconFields } from "../blocks/icon/set-fields";
import type { Theme } from "../look/values";
import { esc } from "../render/parts";
import type { Diagram } from "../schema";
import type { NotationLang } from "../words";

/** 頁に図を置いて動かす script。build で `player-global.ts` を 1 file に束ねた物 */
const PLAYER = new URL("./player.global.js", import.meta.url);

/** `lang` は図の中の字 (全体図の札と読み上げの名前) の言葉。頁の `lang` 属性も同じにし、名前をその言葉の声で読ませる (#3001) */
export function pageHtml(diagram: Diagram, look: { palette: string; theme: Theme; vars: string; lang: NotationLang }, fontCss: string): string {
  // `</script>` で script が途切れないよう、`<` を JSON の逃がし方で書く
  const json = JSON.stringify(diagram).replace(/</g, "\\u003c");
  const options = JSON.stringify({ palette: look.palette, theme: look.theme, lang: look.lang });
  return [
    "<!doctype html>",
    `<html lang="${look.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`,
    `<title>${esc(diagram.title)}</title>`,
    // 再生の帯の左右と下の余白は置いた頁が付ける (`player.ts`)。図は窓の幅いっぱいに置き、帯の字と釦と進み具合だけを窓の縁から離す (#3398)。
    // 試す図は段の説明の帯の下に入力の帯を置くので、下の余白は帯ではなく再生の部品の下に付け、最後に置いた帯を窓の下の縁から離す (#3437)。
    // 配管の図の下の段の矢印と呼び出しの結果も、帯と同じだけ窓の左右の縁から離す (#3418、#3450)
    `<style>${fontCss}:root{${look.vars}}html,body{margin:0}body{background:var(--bg)}.dg-player{padding-bottom:12px}.dg-bar,.dg-calls{padding:0 16px}</style>`,
    '</head><body><div id="dragon"></div>',
    `<script type="application/json" id="dragon-diagram">${json}</script>`,
    // 頁の script が読み込みの時に登録するので、script より前に置く
    iconsElement(setIconFields(diagram).map(([, value]) => value)),
    `<script>${readFileSync(PLAYER, "utf8").replace(/<\/script/gi, "<\\/script")}</script>`,
    `<script>DragonPlayer.mountDiagram(document.getElementById("dragon"),JSON.parse(document.getElementById("dragon-diagram").textContent),${options});</script>`,
    "</body></html>",
  ].join("\n");
}
