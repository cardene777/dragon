/**
 * @vitest-environment jsdom
 *
 * 書き出した SVG が画面の意匠の定義を自分で解決できることを検証する (#2800)。
 * CSS にある地の色と、画面の外に一つだけ置かれた defs は、そのまま複製するだけでは持ち出せない。
 * 動く版と静止版の違いもここで小さく固定する。
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  動きを外す,
  解決できない参照,
  参照しているID,
  定義を埋め込む,
  書き出し用のSVGを作る,
  書き出したSVGの地の色,
} from "./export-svg";

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";

function svg(markup = ""): SVGSVGElement {
  const root = document.createElementNS(SVG_NS, "svg");
  root.innerHTML = markup;
  return root;
}

function 参照の図(): SVGSVGElement {
  const root = svg(
    '<defs><pattern id="p1" /></defs><rect fill="url(#p1)" style="filter: url(&quot;#f1&quot;)" marker-end="url(\'#m1\')" /><use href="#u1" />',
  );
  const use = document.createElementNS(SVG_NS, "use");
  use.setAttributeNS(XLINK_NS, "xlink:href", "#u2");
  root.appendChild(use);
  return root;
}

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("SVG 書き出しの意匠 (#2800)", () => {
  it("属性と style 属性が指す id を重複なく拾う", () => {
    // Given
    const 図 = 参照の図();

    // When
    const 実際 = 参照しているID(図).sort();

    // Then
    expect(実際).toEqual(["f1", "m1", "p1", "u1", "u2"]);
  });

  it("SVG の中に無い参照だけを返す", () => {
    // Given
    const 図 = 参照の図();

    // When
    const 実際 = 解決できない参照(図).sort();

    // Then
    expect(実際).toEqual(["f1", "m1", "u1", "u2"]);
  });

  function 定義を持つ画面(): SVGSVGElement {
    const 画面 = svg(
      '<defs><filter id="dragon-f" /><pattern id="dragon-p" href="#dragon-base" /><pattern id="dragon-base"><rect fill="url(#dragon-g)" /></pattern><linearGradient id="dragon-g" /></defs>',
    );
    document.body.appendChild(画面);
    return 画面;
  }

  function 書き出し用(): SVGSVGElement {
    return svg('<rect style="filter: url(&quot;#dragon-f&quot;)" fill="url(#dragon-p)" />');
  }

  it("画面にある定義を足しても未解決を返さない", () => {
    // Given
    定義を持つ画面();
    const 図 = 書き出し用();

    // When
    const 実際 = 定義を埋め込む(図, document);

    // Then
    expect(実際).toEqual([]);
  });

  it("推移的に足した定義で参照を全て解決する", () => {
    // Given
    定義を持つ画面();
    const 図 = 書き出し用();
    定義を埋め込む(図, document);

    // When
    const 実際 = 解決できない参照(図);

    // Then
    expect(実際).toEqual([]);
  });

  it("推移的に必要な四つの定義を各一つだけ足す", () => {
    // Given
    定義を持つ画面();
    const 図 = 書き出し用();
    定義を埋め込む(図, document);

    // When
    const 件数 = ["dragon-f", "dragon-p", "dragon-base", "dragon-g"].map(
      (id) => 図.querySelectorAll(`[id="${id}"]`).length,
    );

    // Then
    expect(件数).toEqual([1, 1, 1, 1]);
  });

  it("定義を足しても元の参照属性を書き換えない", () => {
    // Given
    定義を持つ画面();
    const 図 = 書き出し用();
    const rect = 図.querySelector("rect");
    if (!rect) throw new Error("参照を持つ rect を置けない");
    const 前 = { fill: rect.getAttribute("fill"), style: rect.getAttribute("style") };

    // When
    定義を埋め込む(図, document);
    const 後 = { fill: rect.getAttribute("fill"), style: rect.getAttribute("style") };

    // Then
    expect(後).toEqual(前);
  });

  it("探す先の定義を元の場所から動かさない", () => {
    // Given
    const 画面 = 定義を持つ画面();
    const 図 = 書き出し用();

    // When
    定義を埋め込む(図, document);
    const 実際 = ["dragon-f", "dragon-p", "dragon-base", "dragon-g"].map(
      (id) => 画面.querySelectorAll(`[id="${id}"]`).length,
    );

    // Then
    expect(実際).toEqual([1, 1, 1, 1]);
  });

  it("探す先にも無い定義は例外にせず返す", () => {
    // Given
    const 図 = svg('<rect fill="url(#nope)" />');

    // When
    const 実際 = 定義を埋め込む(図, document);

    // Then
    expect(実際).toEqual(["nope"]);
  });

  it("探す先にも無い定義の要素を足さない", () => {
    // Given
    const 図 = svg('<rect fill="url(#nope)" />');
    定義を埋め込む(図, document);

    // When
    const 実際 = 図.querySelectorAll('[id="nope"]').length;

    // Then
    expect(実際).toBe(0);
  });

  it("書き出し用が既に持つ id は同名の画面定義で増やさない", () => {
    // Given
    document.body.appendChild(svg('<defs><marker id="cdl-m" /></defs>'));
    const 図 = svg('<defs><marker id="cdl-m" /></defs><path marker-end="url(#cdl-m)" />');

    // When
    定義を埋め込む(図, document);
    const 実際 = 図.querySelectorAll('[id="cdl-m"]').length;

    // Then
    expect(実際).toBe(1);
  });

  it("静止 SVG から全種類の SMIL 要素を外す", () => {
    // Given
    const 図 = svg(
      '<defs><animate id="defs-animation" /></defs><circle><animate /><animateMotion><mpath href="#route" /></animateMotion><animateTransform /><set /></circle>',
    );

    // When
    動きを外す(図);
    const 実際 = 図.querySelectorAll("animate, animateMotion, animateTransform, set").length;

    // Then
    expect(実際).toBe(0);
  });

  it("凡例のまとまり・3 項目・文字色を保つ", () => {
    // Given
    const 舞台 = svg(`<g data-cdl-role="legend">
      <g data-cdl-role="legend-item"><text data-cdl-role="legend-text" fill="var(--cdl-text-mute, #4d7187)">分かれ道</text></g>
      <g data-cdl-role="legend-item"><text data-cdl-role="legend-text" fill="var(--cdl-text-mute, #4d7187)">始まり</text></g>
      <g data-cdl-role="legend-item"><text data-cdl-role="legend-text" fill="var(--cdl-text-mute, #4d7187)">終わり</text></g>
    </g>`);
    document.body.appendChild(舞台);

    // When
    const 書き出し = 書き出し用のSVGを作る(舞台, "静止");

    // Then
    expect(書き出し.querySelectorAll('[data-cdl-role="legend"]')).toHaveLength(1);
    expect(書き出し.querySelectorAll('[data-cdl-role="legend-item"]')).toHaveLength(3);
    expect(
      [...書き出し.querySelectorAll('[data-cdl-role="legend-text"]')].map((text) => ({
        text: text.textContent,
        fill: text.getAttribute("fill"),
      })),
    ).toEqual([
      { text: "分かれ道", fill: "var(--cdl-text-mute, #4d7187)" },
      { text: "始まり", fill: "var(--cdl-text-mute, #4d7187)" },
      { text: "終わり", fill: "var(--cdl-text-mute, #4d7187)" },
    ]);
  });

  it("動きを外してもそれらの親と defs を残す", () => {
    // Given
    const 図 = svg(
      '<defs><animate id="defs-animation" /></defs><circle><animate /><animateMotion><mpath href="#route" /></animateMotion><animateTransform /><set /></circle>',
    );

    // When
    動きを外す(図);
    const 実際 = {
      circle: 図.querySelectorAll("circle").length,
      defs: 図.querySelectorAll("defs").length,
    };

    // Then
    expect(実際).toEqual({ circle: 1, defs: 1 });
  });

  it("根に書かれた不透明な地の色を返す", () => {
    // Given
    const 図 = svg();
    図.style.backgroundColor = "rgb(1, 2, 3)";

    // When
    const 実際 = 書き出したSVGの地の色(図);

    // Then
    expect(実際).toBe("rgb(1, 2, 3)");
  });

  it("根の style に地が無ければ null を返す", () => {
    // Given
    const 図 = svg();

    // When
    const 実際 = 書き出したSVGの地の色(図);

    // Then
    expect(実際).toBeNull();
  });

  it("transparent の地は null を返す", () => {
    // Given
    const 図 = svg();
    図.style.backgroundColor = "transparent";

    // When
    const 実際 = 書き出したSVGの地の色(図);

    // Then
    expect(実際).toBeNull();
  });

  it("透明度が 0 の地は null を返す", () => {
    // Given
    const 図 = svg();
    図.style.backgroundColor = "rgba(0, 0, 0, 0)";

    // When
    const 実際 = 書き出したSVGの地の色(図);

    // Then
    expect(実際).toBeNull();
  });
});
