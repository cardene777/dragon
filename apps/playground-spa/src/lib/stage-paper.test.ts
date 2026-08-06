/**
 * @vitest-environment jsdom
 *
 * 図面の紙の色を画面から読む処理の検証 (#1060)。
 *
 * 書き出す絵の紙は、画面で見えている紙と同じ色でなければならない。 値を書き写すと CSS 側を
 * 変えた時にこちらだけ古くなり、書き出した絵の紙だけが別の色になる。
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { stagePaperColor } from "./stage-paper";

/** 背景色を持つ要素を作って body に置く。 */
function 面(色: string, 親?: HTMLElement): HTMLElement {
  const el = document.createElement("div");
  el.style.backgroundColor = 色;
  (親 ?? document.body).appendChild(el);
  return el;
}

describe("図面の紙の色 (#1060)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.documentElement.classList.remove("dark");
  });
  afterEach(() => {
    document.body.innerHTML = "";
    document.documentElement.classList.remove("dark");
  });

  it("要素自身の背景を返す", () => {
    expect(stagePaperColor(面("rgb(58, 47, 34)"))).toBe("rgb(58, 47, 34)");
  });

  it("要素が透けていたら色を持つ祖先まで遡る", () => {
    // 図面の枠は背景を持たず、 後ろの面が紙になることがある
    const 親 = 面("rgb(240, 232, 212)");
    const 子 = 面("transparent", 親);
    expect(stagePaperColor(子)).toBe("rgb(240, 232, 212)");
  });

  it("`rgba(...,0)` も透けていると見なす", () => {
    const 親 = 面("rgb(26, 20, 8)");
    const 子 = 面("rgba(0, 0, 0, 0)", 親);
    expect(stagePaperColor(子)).toBe("rgb(26, 20, 8)");
  });

  it("要素が無い時は画面の明暗に応じた既定に落ちる", () => {
    // 書き出しを止めるより、 近い色で出す方が良い
    expect(stagePaperColor(null)).toBe("#f0e8d4");
    document.documentElement.classList.add("dark");
    expect(stagePaperColor(null)).toBe("#3a2f22");
  });

  it("既定の暗い色が画面の紙と揃っている", () => {
    // ここが CSS とずれると、 読めなかった時だけ別の色で書き出される。
    // `editor.css` の `html.dark[data-cdl-theme="blueprint"] .v4-editor-stage` と同じ値
    document.documentElement.classList.add("dark");
    expect(stagePaperColor(null), "CSS の紙と既定がずれている").toBe("#3a2f22");
  });
});
