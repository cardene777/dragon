/**
 * 1 file で開ける HTML。削った字と、頁に図を置いて動かす script と、原本の JSON を収める。
 *
 * 開くと頁と同じく、枠の幅で見せ方を選び、動きを嫌う設定では止め絵を釦で送る。
 * 外へ何も取りに行かない。
 */
import { readFileSync } from "node:fs";
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
    `<style>${fontCss}:root{${look.vars}}html,body{margin:0}body{background:var(--bg)}</style>`,
    '</head><body><div id="dragon"></div>',
    `<script type="application/json" id="dragon-diagram">${json}</script>`,
    `<script>${readFileSync(PLAYER, "utf8").replace(/<\/script/gi, "<\\/script")}</script>`,
    `<script>DragonPlayer.mountDiagram(document.getElementById("dragon"),JSON.parse(document.getElementById("dragon-diagram").textContent),${options});</script>`,
    "</body></html>",
  ].join("\n");
}
