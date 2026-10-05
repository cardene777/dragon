export type 書き出しの形 = "動く" | "静止";

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";
const 動きの選択子 = "animate, animateMotion, animateTransform, set";
const URL参照 = /url\(\s*["']?#([^\s)'"]+)["']?\s*\)/g;

const 継ぐ性質 = [
  "fill",
  "fill-opacity",
  "fill-rule",
  "stroke",
  "stroke-width",
  "stroke-opacity",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "paint-order",
  "color",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "letter-spacing",
  "text-anchor",
  "dominant-baseline",
  "visibility",
  "marker-start",
  "marker-mid",
  "marker-end",
] as const;

const 継がない性質 = [
  "opacity",
  "filter",
  "mix-blend-mode",
  "rx",
  "ry",
  "r",
  "display",
  "overflow",
  "transform",
  "transform-origin",
  "transform-box",
] as const;

const 根だけの性質 = [
  "background-color",
  "background-image",
  "background-size",
  "background-position",
  "background-repeat",
] as const;

type 性質 =
  (typeof 継ぐ性質)[number] | (typeof 継がない性質)[number] | (typeof 根だけの性質)[number];
type 要素の対 = { 画面: Element; 複製: Element };
type 読んだ値 = { 対: 要素の対; 画面: Map<性質, string>; CSSなし: Map<性質, string> };

function 自身と子孫(要素: Element): Element[] {
  return [要素, ...要素.querySelectorAll<Element>("*")];
}

function IDを持つ要素(範囲: Element, id: string): Element | null {
  return 自身と子孫(範囲).find((要素) => 要素.id === id) ?? null;
}

/** 属性と style 属性に書かれた、同じ SVG 内の id への参照を列挙する。 */
export function 参照しているID(svg: Element): string[] {
  const ids = new Set<string>();
  for (const 要素 of 自身と子孫(svg)) {
    for (const 属性 of Array.from(要素.attributes)) {
      for (const match of 属性.value.matchAll(URL参照)) {
        const id = match[1];
        if (id) ids.add(id);
      }
      if (属性.localName === "href" && 属性.value.startsWith("#")) {
        ids.add(属性.value.slice(1));
      }
    }
  }
  return [...ids];
}

/** SVG 内に同じ id の要素が無い参照を返す。 */
export function 解決できない参照(svg: Element): string[] {
  return 参照しているID(svg).filter((id) => IDを持つ要素(svg, id) === null);
}

function 直下のDefs(svg: SVGSVGElement): SVGDefsElement | null {
  return (
    Array.from(svg.children).find((要素): 要素 is SVGDefsElement => 要素.localName === "defs") ??
    null
  );
}

/**
 * SVG が参照する定義を探す先から複製し、定義が参照する定義も続けて足す。
 * 元の定義を動かさず id も変えないため、画面と書き出しで同じ参照を使える。
 */
export function 定義を埋め込む(svg: SVGSVGElement, 探す先: Document): string[] {
  let defs = 直下のDefs(svg);
  let 未解決 = 解決できない参照(svg);

  while (未解決.length > 0) {
    let 足した = false;
    for (const id of 未解決) {
      if (IDを持つ要素(svg, id)) continue;
      const 元 = 探す先.getElementById(id);
      if (!元) continue;
      if (!defs) {
        defs = svg.ownerDocument.createElementNS(SVG_NS, "defs");
        svg.insertBefore(defs, svg.firstChild);
      }
      defs.appendChild(元.cloneNode(true));
      足した = true;
    }
    const 次 = 解決できない参照(svg);
    if (!足した) return 次;
    未解決 = 次;
  }

  return [];
}

/** 静止 SVG に残してはいけない SMIL の動きだけを外す。 */
export function 動きを外す(svg: Element): void {
  for (const 要素 of svg.querySelectorAll(動きの選択子)) 要素.remove();
}

function 透明な色(色: string): boolean {
  const 値 = 色.trim().toLowerCase();
  if (値 === "" || 値 === "transparent") return true;
  const 関数 = /^rgba?\((.*)\)$/.exec(値)?.[1];
  if (!関数) return false;
  const slash = 関数.lastIndexOf("/");
  if (slash >= 0) return Number.parseFloat(関数.slice(slash + 1)) === 0;
  const parts = 関数.split(",");
  return parts.length === 4 && Number.parseFloat(parts[3] ?? "") === 0;
}

/** 書き出した SVG の根へ固定した、不透明な地の色を返す。 */
export function 書き出したSVGの地の色(svg: SVGSVGElement): string | null {
  const 色 = svg.style.backgroundColor;
  return 透明な色(色) ? null : 色;
}

function 動きの対象(svg: SVGSVGElement, 動き: Element): Element | null {
  const href = 動き.getAttribute("href") ?? 動き.getAttributeNS(XLINK_NS, "href");
  if (href !== null) return href.startsWith("#") ? IDを持つ要素(svg, href.slice(1)) : null;
  return 動き.parentElement;
}

function 動きが変える性質(svg: SVGSVGElement): Map<Element, Set<string>> {
  const 結果 = new Map<Element, Set<string>>();
  for (const 動き of svg.querySelectorAll(動きの選択子)) {
    const 対象 = 動きの対象(svg, 動き);
    if (!対象) continue;
    const 性質 = 結果.get(対象) ?? new Set<string>();
    if (動き.localName === "animateTransform" || 動き.localName === "animateMotion") {
      性質.add("transform");
      性質.add("transform-origin");
      性質.add("transform-box");
    } else {
      const 名前 = 動き.getAttribute("attributeName")?.trim().toLowerCase();
      if (名前) 性質.add(名前);
    }
    結果.set(対象, 性質);
  }
  return 結果;
}

function 読む性質(複製: Element, 根: SVGSVGElement): readonly 性質[] {
  return 複製 === 根
    ? [...継ぐ性質, ...継がない性質, ...根だけの性質]
    : [...継ぐ性質, ...継がない性質];
}

function 値を読む(style: CSSStyleDeclaration, 性質一覧: readonly 性質[]): Map<性質, string> {
  return new Map(性質一覧.map((名前) => [名前, style.getPropertyValue(名前)]));
}

function 隔離した計算値を読む(svg: SVGSVGElement, 対一覧: 要素の対[]): 読んだ値[] {
  const doc = 対一覧[0]?.画面.ownerDocument ?? svg.ownerDocument;
  const window = doc.defaultView;
  if (!window) throw new Error("画面の計算値を読めない");

  const iframe = doc.createElement("iframe");
  iframe.src = "about:blank";
  iframe.setAttribute("aria-hidden", "true");
  iframe.tabIndex = -1;
  Object.assign(iframe.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: "1px",
    height: "1px",
    border: "0",
    opacity: "0",
    pointerEvents: "none",
  });
  doc.body.appendChild(iframe);

  try {
    const 隔離doc = iframe.contentDocument;
    const 隔離window = iframe.contentWindow;
    if (!隔離doc || !隔離window) throw new Error("見比べに使う空の文書を作れない");
    隔離doc.body.appendChild(隔離doc.adoptNode(svg));

    // CSSStyleDeclaration は生きた値なので、書き始める前に文字列へ写しておく。
    return 対一覧.map((対) => {
      const 性質一覧 = 読む性質(対.複製, svg);
      return {
        対,
        画面: 値を読む(window.getComputedStyle(対.画面), 性質一覧),
        CSSなし: 値を読む(隔離window.getComputedStyle(対.複製), 性質一覧),
      };
    });
  } finally {
    svg.remove();
    iframe.remove();
  }
}

function styleを持つ(要素: Element): CSSStyleDeclaration {
  return (要素 as HTMLElement | SVGElement).style;
}

/**
 * 画面の舞台から、単独で開いても画面と同じに見える書き出し用の SVG を作る。
 * 画面の要素には触れず、CSS が無い文書との差だけを複製の style 属性へ固定する。
 */
export function 書き出し用のSVGを作る(画面の舞台: SVGSVGElement, 形: 書き出しの形): SVGSVGElement {
  const 複製 = 画面の舞台.cloneNode(true) as SVGSVGElement;
  if (!複製.getAttribute("xmlns")) 複製.setAttribute("xmlns", SVG_NS);
  if (!複製.getAttribute("xmlns:xlink")) 複製.setAttribute("xmlns:xlink", XLINK_NS);

  const 画面の要素 = 自身と子孫(画面の舞台);
  const 複製の要素 = 自身と子孫(複製);
  const 対一覧 = 画面の要素.map((画面, index) => {
    const 対になる複製 = 複製の要素[index];
    if (!対になる複製) throw new Error("画面と書き出し用 SVG の要素を対応付けられない");
    return { 画面, 複製: 対になる複製 };
  });
  const 動く性質 = 形 === "動く" ? 動きが変える性質(複製) : new Map<Element, Set<string>>();

  if (形 === "静止") 動きを外す(複製);
  const 残った対 = 対一覧.filter(({ 複製: 要素 }) => 要素 === 複製 || 複製.contains(要素));
  const 読取り = 隔離した計算値を読む(複製, 残った対);
  const 画面から読取り = new Map(読取り.map((値) => [値.対.画面, 値]));

  for (const 値 of 読取り) {
    const { 画面, 複製: 要素 } = 値.対;
    const 親の値 = 画面.parentElement ? 画面から読取り.get(画面.parentElement) : undefined;
    for (const [名前, 画面の値] of 値.画面) {
      const CSSなしの値 = 値.CSSなし.get(名前);
      if (CSSなしの値 === undefined || 画面の値 === CSSなしの値) continue;
      if (要素 === 複製 && (名前 === "display" || 名前 === "overflow")) continue;
      if (形 === "動く" && 動く性質.get(要素)?.has(名前)) continue;
      if (
        親の値 &&
        継ぐ性質.includes(名前 as (typeof 継ぐ性質)[number]) &&
        画面の値 === 親の値.画面.get(名前) &&
        CSSなしの値 === 親の値.CSSなし.get(名前)
      ) {
        continue;
      }
      styleを持つ(要素).setProperty(名前, 画面の値);
    }
  }

  定義を埋め込む(複製, 画面の舞台.ownerDocument);
  return 複製;
}
