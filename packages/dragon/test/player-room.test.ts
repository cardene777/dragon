/**
 * 図を窓の幅いっぱいに置く入れ物が再生の部品に付ける余白 (#3744)。
 *
 * 再生の帯の左右と下の余白は置いた頁が付ける (`player.ts`)。図を窓の幅いっぱいに置く 1 file の HTML は、
 * 再生の部品の下に 12px、再生の帯と呼び出しの欄の左右に 16px を付ける (#3398、#3437)。
 * 帯つきの図の帯の枠も同じ余白を付ける (`embed-bar.test.ts` の `frame-bar-keeps-room-from-edges`)。
 * ここでは 1 file の HTML が今と同じ余白の見た目を出すことを確かめる。
 */
import { expect, it } from "vitest";
import { pageHtml } from "../src/export/html";
import { planPage } from "../src/export/page";
import { smallArchitecture } from "./diagram-support";
import "../src/kind-use/architecture";

it("html-page-keeps-bar-room", () => {
  const html = pageHtml(planPage(smallArchitecture(), { lang: "ja" }), "", "");
  expect(html, "1 file の HTML の再生の部品の余白が変わった").toContain(
    "html,body{margin:0}body{background:var(--bg)}.dg-player{padding-bottom:12px}.dg-bar,.dg-calls{padding:0 16px}</style>",
  );
});
