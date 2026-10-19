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
import { THEMES } from "@cardenelabs/dragon";
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
    document.documentElement.removeAttribute("data-site-theme");
  });
  afterEach(() => {
    document.body.innerHTML = "";
    document.documentElement.removeAttribute("data-site-theme");
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

  it("要素が無い時は地の明るい意匠と暗い意匠で別の既定に落ちる", () => {
    // 書き出しを止めるより、 近い色で出す方が良い。 値は下の検査が意匠の表と突き合わせる
    document.documentElement.setAttribute("data-site-theme", "letterpress");
    const 明 = stagePaperColor(null);
    document.documentElement.setAttribute("data-site-theme", "terminal");
    const 暗 = stagePaperColor(null);
    expect(明, "明るい側の既定が色として返らない").toMatch(/^#[0-9a-f]{6}$/i);
    expect(暗, "暗い側の既定が色として返らない").toMatch(/^#[0-9a-f]{6}$/i);
    expect(暗, "明暗で同じ既定に落ちている").not.toBe(明);
  });

  it("意匠が付いていない時は活版の紙に落ちる", () => {
    const 付けない = stagePaperColor(null);
    document.documentElement.setAttribute("data-site-theme", "letterpress");
    expect(付けない).toBe(stagePaperColor(null));
  });

  // ここが CSS とずれると、 読めなかった時だけ別の色で書き出される。
  // 値は `site-theme.css` の各意匠の表の `--d-surface` から読んで突き合わせる = 書き写すと片方だけ古くなる。
  // `import.meta.url` は jsdom 環境で file 形式にならないので、 作業 dir から辿る。
  const css = readFileSync(resolve(process.cwd(), "apps/playground-spa/src/styles/site-theme.css"), "utf8");
  it.each(THEMES.map((意匠) => [意匠]))("%s の既定の色が意匠の表の紙と揃っている", (意匠) => {
    const 表 = new RegExp(`html\\[data-site-theme="${意匠}"\\]\\s*\\{[^}]*?--d-surface:\\s*([^;]+);`).exec(css);
    expect(表, `${意匠} の表に --d-surface が無い`).not.toBeNull();
    document.documentElement.setAttribute("data-site-theme", 意匠);
    expect(stagePaperColor(null)).toBe(表![1]!.trim().toLowerCase());
  });
});
