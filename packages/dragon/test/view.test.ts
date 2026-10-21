/**
 * 見せ方を字の大きさで選ぶ (#2985)。
 *
 * 置き場所を決めた後に全体を枠の幅へ収めて、字が 10.5px 以上なら全体を止めて中だけ動かす (`fixed`)。
 * 下回るなら寄って動かし、全体図で今どこかを示す (`follow`)。書き手が原本の `view` で決めた時はそれに従う。
 */
import { describe, expect, it } from "vitest";
import { api, exampleJson, type Json, patched } from "./diagram-support";
import { draw, type Rendered } from "./render-support";

const READABLE = 10.5;

/** 全体を収めた時の字が 10.5px 以上になる、一番狭い枠の幅 (整数)。 */
function narrowestReadable(rendered: Rendered): number {
  const choose = draw("chooseView");
  let low = 1;
  let high = 20_000;
  expect(choose(rendered, high).textPx, "広い枠でも字が読める大きさにならない").toBeGreaterThanOrEqual(READABLE);
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (choose(rendered, mid).textPx >= READABLE) high = mid;
    else low = mid + 1;
  }
  return low;
}

const renderOf = (diagram: Json): Rendered => draw("renderDiagram")(diagram);

describe("字の大きさで選ぶ", () => {
  it("view-mode-fixed-when-text-readable", () => {
    const choose = draw("chooseView");
    for (const file of ["oauth.json", "ccip.json"]) {
      const rendered = renderOf(exampleJson(file));
      const width = narrowestReadable(rendered);
      const at = choose(rendered, width);
      expect(at.textPx, `${file} の ${width} の枠の字`).toBeGreaterThanOrEqual(READABLE);
      expect(at.mode, `${file} の ${width} の枠`).toBe("fixed");
      expect(choose(rendered, width * 3).mode, `${file} の広い枠`).toBe("fixed");
    }
  });

  it("view-mode-follow-when-text-too-small", () => {
    const choose = draw("chooseView");
    for (const file of ["oauth.json", "ccip.json"]) {
      const rendered = renderOf(exampleJson(file));
      const width = narrowestReadable(rendered);
      const at = choose(rendered, width - 1);
      expect(at.textPx, `${file} の ${width - 1} の枠の字`).toBeLessThan(READABLE);
      expect(at.mode, `${file} の ${width - 1} の枠`).toBe("follow");
      expect(choose(rendered, 200).mode, `${file} の狭い枠`).toBe("follow");
    }
  });

  it("view-mode-honors-explicit-choice", () => {
    const choose = draw("chooseView");
    const plain = renderOf(exampleJson("ccip.json"));
    const width = narrowestReadable(plain);

    // 止めると決めた図は、字が 10.5px を下回る狭い枠でも止める
    const fixed = renderOf(patched(exampleJson("ccip.json"), ["view"], "fixed"));
    expect(fixed.view).toBe("fixed");
    expect(choose(fixed, Math.floor(width / 2)).mode).toBe("fixed");

    // 寄ると決めた図は、字が十分大きい広い枠でも寄る
    const follow = renderOf(patched(exampleJson("ccip.json"), ["view"], "follow"));
    expect(follow.view).toBe("follow");
    expect(choose(follow, width * 3).mode).toBe("follow");

    // 人は記法の `見せ方` の行で決め、JSON の `view` になる
    const parse = api("parseNotation");
    const notation = (line: string): string =>
      ["時系列図 見せ方を決めた図", line, "a = 送る側", "b = 受ける側", "# 送る", "> 送る側が受ける側へ送る。", "a -> b : 要求"].join("\n");
    for (const [line, view] of [
      ["見せ方 止める", "fixed"],
      ["見せ方 寄る", "follow"],
    ] as const) {
      const parsed = parse(notation(line));
      expect(parsed.ok, line).toBe(true);
      if (!parsed.ok) continue;
      expect((parsed.diagram as { view?: string }).view, line).toBe(view);
      expect(api("printNotation")(parsed.diagram), line).toContain(line);
    }
  });
});
