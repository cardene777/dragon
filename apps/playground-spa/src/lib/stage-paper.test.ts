/**
 * @vitest-environment jsdom
 *
 * 図面の紙の色を画面から読む処理の検証 (#1060)。
 *
 * 書き出す絵の紙は、画面で見えている紙と同じ色でなければならない。 値を書き写すと CSS 側を
 * 変えた時にこちらだけ古くなり、書き出した絵の紙だけが別の色になる。
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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
    // 書き出しを止めるより、 近い色で出す方が良い。
    //
    // **値を書き写さない**。 期待値は下の検査と同じく `globals.css` から読む =
    // 書き写すと配色を変えた時にこちらだけ古くなる (実測で踏んだ)。
    const 明 = stagePaperColor(null);
    document.documentElement.classList.add("dark");
    const 暗 = stagePaperColor(null);
    expect(明, "明るい側の既定が色として返らない").toMatch(/^#[0-9a-f]{6}$/i);
    expect(暗, "暗い側の既定が色として返らない").toMatch(/^#[0-9a-f]{6}$/i);
    expect(暗, "明暗で同じ既定に落ちている").not.toBe(明);
  });

  it("既定の色が画面の紙と揃っている", () => {
    // ここが CSS とずれると、 読めなかった時だけ別の色で書き出される。
    // 値は `globals.css` の `--d-surface` から読んで突き合わせる = 書き写すと片方だけ古くなる。
    // `import.meta.url` は jsdom 環境で file 形式にならないので、 作業 dir から辿る。
    const css = readFileSync(
      resolve(process.cwd(), "apps/playground-spa/src/styles/globals.css"),
      "utf8",
    );
    const surfaceIn = (block: string): string => {
      const scope = new RegExp(`${block}\\s*\\{[\\s\\S]*?--d-surface:\\s*([^;]+);`).exec(css);
      return scope![1]!.trim().toLowerCase();
    };
    expect(stagePaperColor(null), "明るい紙と既定がずれている").toBe(surfaceIn(":root"));
    document.documentElement.classList.add("dark");
    expect(stagePaperColor(null), "暗い紙と既定がずれている").toBe(surfaceIn("html\\.dark"));
  });
});
