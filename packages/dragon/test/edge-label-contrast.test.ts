/**
 * 図の中の線に添える札 (edge label) の配色を検査する (cardene777/cdl#388)。
 *
 * cdl 側の軸 27 `contrast-basics` は cdl の既定値どうしの対比しか測れない。 下流は 2 通りの
 * 経路で色を変えられるため、 下流の配色は下流が見る必要がある。
 *
 *   1. CSS 変数 (`--cdl-label-bg` / `--cdl-text-dim` / `--cdl-tone-*`)
 *   2. role selector への `fill: ... !important`
 *      (`[data-cdl-role="edge-label"]` / `[data-cdl-role="edge-label-bg"]`)
 *
 * `cdl-theme.css` は 2 の経路で色を決めている。 変数だけを読むと実際の色と食い違うので、
 * role selector の宣言を読む。
 *
 * ## 明暗をどう測るか
 *
 * `cdl-theme.css` は色を直に書かず `var(--d-*)` で参照する。 明暗の差は `globals.css` が
 * `:root` と `html.dark` で同じ変数に別の値を置くことで生まれる。
 *
 * そこで `globals.css` から明暗 2 通りの変数表を作り、 `cdl-theme.css` の `var()` を
 * 置き換えてから読む。 変数の連鎖が解けない (定義が無い) 場合は `var()` が残るので、
 * 範囲外として落ちる = 変数表と実際の参照がずれたら気付ける。
 *
 * ## 何を検査するか = 宣言された配色まで
 *
 * 本 test が答える問いは 1 つだけ。
 *
 *   「明暗それぞれで、 札の文字と背景に宣言した色の組は、 宣言した文字の大きさに対して
 *    WCAG AA を満たすか」
 *
 * これは **配色の検査** であって、 描画結果の検査ではない。 実際に画面に出る対比は
 * 半透明の重なり / 祖先の `opacity` / hover / 表示環境 (`@media`) / host 側の背景 に依存し、
 * それらは実ブラウザでしか決まらない。
 *
 * ## なぜ描画結果まで見ないか
 *
 * 当初は jsdom に代表 DOM を組み立てて描画結果を再現しようとしたが、 review で **6 round
 * 連続** して「代表 DOM と実ページの差」 を指摘され続けた (presentation attribute / 兄弟構造 /
 * 祖先の group opacity / host の背景 / `all: initial` / hover 等の状態依存 selector)。
 *
 * 合成 DOM は実ページと等価にならないので、 精度を上げても収束しない。 静的解析の
 * 非収束 pattern (`~/.claude/rules/quality.md § 責務境界` に同型の事例)。
 *
 * **責務を分ける**。 描画結果の対比は実ブラウザで測る = #977 (`tests/a11y-check.spec.ts` に配線)。
 * 本 test は配色の宣言だけを見る。 配色が正しくても描画で崩れることはあるが、 配色が誤って
 * いれば描画は必ず崩れるので、 先に潰す価値がある。
 *
 * ## 検査の範囲外を fail closed にする
 *
 * 上の問いに答えられない形で書かれていたら落とす。 黙って既定値に戻すと、 実際は違う色 /
 * 大きさなのに「配色は正しい」 と報告してしまう。
 *
 *   - role の標準形以外の selector が札に当たりうる (`svg[...]` / `:hover` / 子孫指定 /
 *     host 側の class を伴う祖先)
 *   - `html.dark` を前置する (明暗は変数側で決める規約。 ここに書くと決める場所が 2 つになる)
 *   - `@media` / `@supports` の中で札に当たりうる
 *   - 変数表で解けない `var()` が残る
 *   - 色が不透明な sRGB に解決できない (半透明) / 大きさが px 以外 / 太さが相対値
 *   - `opacity` / `fill-opacity` / `all` を宣言する (配色だけでは対比が決まらなくなる)
 *   - `!important` が付かない (後勝ちで統合できなくなる。 `cdl-theme.css` は全宣言に付ける規約)
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import {
  EDGE_LABEL_TEXT,
  WCAG_AA_LARGE,
  WCAG_AA_NORMAL,
  requiredContrastRatio,
} from "@cardenelabs/cdl";

const CSS_PATH = fileURLToPath(
  new URL("../../../apps/playground-spa/src/styles/cdl-theme.css", import.meta.url),
);
/** 明暗の値を持つ変数表の出どころ。 */
const GLOBALS_PATH = fileURLToPath(
  new URL("../../../apps/playground-spa/src/styles/globals.css", import.meta.url),
);

type Mode = "light" | "dark";

/**
 * `globals.css` から明暗 2 通りの変数表を作る。
 *
 * `:root` が明るい表示の値、 `html.dark` が暗い表示の上書き。 暗い表を作る時は
 * `:root` を土台にして `html.dark` を重ねる (上書きが無い変数は明るい値のまま効く)。
 *
 * 取り出しは中括弧の対応を数えて行う。 正規表現で `{[^}]*}` と書くと、 中に別の規則を
 * 持つ形 (`@layer` 等) で途中で切れる。
 */
function readVarTables(globalsText: string): Record<Mode, Map<string, string>> {
  const block = (selector: string): string => {
    const head = new RegExp(`(^|\\})\\s*${selector}\\s*\\{`, "m").exec(globalsText);
    if (!head) return "";
    let depth = 1;
    const start = head.index + head[0].length;
    for (let i = start; i < globalsText.length; i++) {
      const c = globalsText[i];
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) return globalsText.slice(start, i);
      }
    }
    return "";
  };
  const decls = (text: string): Map<string, string> => {
    const out = new Map<string, string>();
    // 値に `;` を含む形 (`font-family` の一覧) があるので、 宣言の切れ目は次の `--name:` で見る。
    for (const m of text.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
      out.set(m[1]!.trim(), m[2]!.trim());
    }
    return out;
  };
  const light = decls(block(":root"));
  const dark = new Map(light);
  for (const [k, v] of decls(block("html\\.dark"))) dark.set(k, v);
  return { light, dark };
}

/**
 * `var(--x)` / `var(--x, fallback)` を変数表の値で置き換える。
 *
 * 値の中がさらに `var()` を含む形 (`--v4-ink: var(--d-text-primary)`) があるので繰り返す。
 * 表に無い変数は **置き換えない** = `var()` が残り、 呼出側が範囲外として落とす。
 * 循環参照で止まらなくならないよう上限を置く。
 */
function expandVars(cssText: string, table: Map<string, string>): string {
  let out = cssText;
  for (let round = 0; round < 12; round++) {
    let changed = false;
    out = out.replace(/var\(\s*(--[a-z0-9-]+)\s*(?:,([^()]*))?\)/gi, (whole, name: string, fallback?: string) => {
      const hit = table.get(name);
      if (hit !== undefined) {
        changed = true;
        return hit;
      }
      // 表に無くても代替が書かれていれば、 実ブラウザは代替を使う。
      if (fallback !== undefined && fallback.trim()) {
        changed = true;
        return fallback.trim();
      }
      return whole;
    });
    if (!changed) break;
  }
  return out;
}

type Rgb = [number, number, number];

/** WCAG 2.x の相対輝度。 */
function luminance([r, g, b]: Rgb): number {
  const ch = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0]! + 0.7152 * ch[1]! + 0.0722 * ch[2]!;
}

/** WCAG 2.x の contrast ratio (1..21)。 */
function contrast(a: Rgb, b: Rgb): number {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * WCAG AA の閾値と large text の判定は cdl の SSOT を使う。
 *
 * ここに 24 / 18.66 / 700 を書き写すと、 engine 側の判定を変えた時に下流の検査だけが古い
 * 規則で測り続ける。 実際 `RENDERER_DEFAULT` を書き写していた間に engine 側が sub 行を
 * 太字に変え (cardene777/cdl#391)、 この検査は sub を通常文字として測ったままだった。
 */
const requiredRatio = (px: number, weight: number): number =>
  requiredContrastRatio({ fontSize: px, fontWeight: weight, opacity: 1, fontFamily: null });

/** `render/edges.tsx` が presentation attribute で与える既定。 主題が宣言しなければこの値。 */
const RENDERER_DEFAULT = {
  main: {
    px: EDGE_LABEL_TEXT.main.fontSize,
    weight: EDGE_LABEL_TEXT.main.fontWeight,
    family: EDGE_LABEL_TEXT.main.fontFamily,
  },
  sub: {
    px: EDGE_LABEL_TEXT.sub.fontSize,
    weight: EDGE_LABEL_TEXT.sub.fontWeight,
    family: EDGE_LABEL_TEXT.sub.fontFamily,
  },
} as const;

/** 配色だけでは対比が決まらなくなる property。 宣言されていたら検査の範囲外。 */
const OUT_OF_SCOPE_PROPS = ["opacity", "fill-opacity", "all"] as const;

/** 対比に効く property。 これを 1 つも宣言しない規則は、 role に言及していても無関係。 */
const RELEVANT_PROPS = ["fill", "font-size", "font-weight", "font-family", ...OUT_OF_SCOPE_PROPS] as const;

/**
 * `font-family` の先頭 (最も優先される family) を取り出す。 宣言が無ければ null。
 *
 * 先頭だけを見るのは、 続きが端末に入っている前提の代替 (`monospace` / `Courier New`) で、
 * どの face が使われるかを web font の宣言から決められないため。
 */
function firstFamily(value: string | undefined): string | null {
  if (value === undefined) return null;
  const head = value.replace(/!important/, "").split(",")[0]?.trim() ?? "";
  return head.replace(/^["']|["']$/g, "") || null;
}

/**
 * role の標準形。 これ以外の selector が札に当たったら検査の範囲外。
 *
 * `html.dark` の前置きも認めない。 明暗は変数側で決める規約で、 ここに書くと決める場所が
 * 2 つになる (`cdl-theme.css` 冒頭の規約)。
 */
const CANONICAL = /^\[data-cdl-role="(edge-label|edge-label-bg)"\]$/;

/**
 * selector が札の要素に当たるかを `matches()` で判定する。
 *
 * 正規表現で selector を読むと、 引用符の種類 (`'` / `"`) / 属性演算子前後の空白 / 大文字小文字の
 * flag といった正しい書き方を取りこぼす。 判定は DOM に任せる。
 *
 * 暗い表示の probe も作るのは、 `html.dark` を前置した selector を「当たる」 と判定して
 * 標準形の検査に載せるため。 作らないと当たらないまま素通りする。
 */
function makeRoleProbes(): Element[] {
  const out: Element[] = [];
  for (const dark of [false, true]) {
    const dom = new JSDOM(
      `<html class="${dark ? "dark" : ""}"><body><svg data-cdl-stage="">` +
        `<g data-cdl-edge-label-for="e">` +
        `<rect data-cdl-role="edge-label-bg"></rect>` +
        `<text data-cdl-role="edge-label">m</text>` +
        `<text data-cdl-role="edge-label">s</text>` +
        `</g></svg></body></html>`,
    );
    out.push(...Array.from(dom.window.document.querySelectorAll("[data-cdl-role]")));
  }
  return out;
}

/**
 * CSS の `<named-color>` 一覧 (CSS Color Level 4)。 値が固定で環境に依らないものだけ。
 *
 * 一覧を持つのは、 system color (`CanvasText` / `AccentColor` 等) を弾くため。 これらは
 * 環境しだいで色が変わるので、 jsdom が返す固定値で対比を判定してはいけない。 「弾く名前」
 * を並べる形だと将来 system color が増えた時に漏れるので、 「通す名前」 を並べる。
 */
const NAMED_COLORS = new Set(
  ("aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown " +
   "burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan " +
   "darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid " +
   "darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet " +
   "deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro " +
   "ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki " +
   "lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow " +
   "lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray " +
   "lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine " +
   "mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise " +
   "mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab " +
   "orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru " +
   "pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown " +
   "seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan " +
   "teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen").split(" "),
);

/**
 * CSSOM が正規化しなかった名前付きの色を rgb に直す。
 *
 * jsdom は名前付きの色 (`red` 等) を保持したまま返すので、 一度描かせて解決する。 判定は
 * `fill` そのもので行う (property ごとに初期値が違うため、 `color` で代用すると `initial` の
 * 解決がずれる)。
 *
 * 受けるのは `<named-color>` と `initial` だけ。
 *
 *   - system color (`CanvasText` 等) ... 環境しだいで変わるので通さない
 *   - `currentColor` ... `color` しだいで変わるので通さない
 *   - `inherit` / `unset` ... 親の値なので、 目印の色と一致することで弾かれる
 *   - `none` / `transparent` ... 半透明として `parseColor` が弾く
 *   - 綴りが無効 ... 宣言が捨てられるので、 目印の色と一致することで弾かれる
 */
const NAMED_PROBE_SENTINEL = "rgb(1, 2, 3)";
function parseNamed(value: string): Rgb | null {
  const v = value.trim().replace(/!important/, "").trim().toLowerCase();
  // `initial` は `fill` の初期値 (黒) に解決される固定の色なので通す。
  if (!NAMED_COLORS.has(v) && v !== "initial") return null;
  const dom = new JSDOM(
    `<style>p { fill: ${NAMED_PROBE_SENTINEL} } p i { fill: ${v} }</style><p><i></i></p>`,
  );
  const el = dom.window.document.querySelector("i");
  if (!el) return null;
  const resolved = dom.window.getComputedStyle(el).fill;
  if (resolved === NAMED_PROBE_SENTINEL) return null; // 捨てられた or 継承した
  return parseColor(resolved);
}

/** 不透明な hex を rgb に直す。 CSSOM が正規化しなかった値の受け皿。 */
function parseHex(value: string): Rgb | null {
  let h = value.trim().replace(/!important/, "").trim().replace(/^#/, "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
}

/** CSSOM が不透明な sRGB (`rgb(r, g, b)`) に解決した色を取る。 半透明や `var()` は `null`。 */
function parseColor(value: string): Rgb | null {
  const m = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(value.trim());
  return m ? ([Number(m[1]), Number(m[2]), Number(m[3])] as Rgb) : null;
}

/** `font-size` を px に直す。 px 以外の単位や `calc()` は `null`。 */
function parsePx(value: string): number | null {
  const m = /^([\d.]+)px$/.exec(value.trim());
  if (!m) return null;
  const n = Number.parseFloat(m[1]!);
  return Number.isFinite(n) ? n : null;
}

/** `font-weight` を数値に直す。 相対値 (`bolder` / `lighter`) は `null`。 */
function parseWeight(value: string): number | null {
  const v = value.trim().toLowerCase();
  if (v === "normal") return 400;
  if (v === "bold") return 700;
  const n = Number(v);
  // CSS Fonts Level 4 の絶対値は 1..1000 の数値 (小数も有効)。
  return Number.isFinite(n) && n >= 1 && n <= 1000 ? n : null;
}

type Role = "edge-label" | "edge-label-bg";
type Line = "main" | "sub";
type Decl = { fill?: string; px?: string; weight?: string; family?: string };

type Collected = {
  /** role → 宣言。 標準形の selector から集めたもの。 */
  byRole: Partial<Record<Role, Decl>>;
  /** 本 test が答えられない形。 1 件でもあれば落とす。 */
  outOfScope: string[];
};

/**
 * CSS から、 標準形の selector が宣言している配色を集める。
 *
 * CSSOM に解析させるのは、 property 名の正規化 / `font` shorthand の展開 / 無効値の破棄を
 * 実ブラウザと揃えるため。 selector の照合はしない (標準形かどうかを見るだけ)。
 */
function collect(cssText: string): Collected {
  const probes = makeRoleProbes();
  /**
   * selector が label のいずれかの要素に当たるか。
   *
   * `:hover` 等の状態を表す擬似クラスは静的な DOM では常に偽になる。 外した形で当たるなら
   * 「状態しだいで当たる」 = 拾う側に倒す (標準形ではないので範囲外として報告される)。
   * 評価できない selector も同様に拾う。
   */
  const matchesAny = (candidate: string): boolean => {
    if (!candidate.trim()) return false;
    for (const el of probes) {
      try {
        if (el.matches(candidate)) return true;
      } catch {
        return true; // 評価できない = 当たるか分からないので拾う側に倒す
      }
    }
    return false;
  };
  /** `:hover` 等の状態は静的な DOM では常に偽になるので、 外した形でも試せるようにする。 */
  const stripState = (sel: string) =>
    sel.replace(
      /:(hover|focus|focus-visible|focus-within|active|target|visited|link|checked|disabled|enabled)\b/g,
      "",
    );

  /**
   * selector が label の要素に当たりうるか。
   *
   * まず probe DOM に対して丸ごと照合する。 これで図の中で完結する selector
   * (`[data-cdl-role="node-body"] rect` が label に当たらないこと等) は正しく判定できる。
   *
   * 加えて **class / id を伴う形** を拾う。 実ページには `.v4-editor-stage` のような祖先が
   * 付くことがあり、 それを probe に全部用意することはできない。 class / id を含む selector は
   * 祖先の条件を落として一番右の compound だけで判定する (当たりうるなら拾う = 安全側)。
   *
   * この緩和は host 側と図の中を区別しない。 図の中にも id はある (`#cdl-arrow-*`)。 現状は
   * それらの一番右が `#cdl-arrow-accent` 等で probe に当たらないため拾われないが、 将来
   * `#some-id text` のような形を図の中に書くと、 label に届かなくても拾われる。 その場合は
   * 「範囲外」 として test が落ちるので、 見て判断する (黙って通すより良い)。
   */
  const hitsLabel = (selectorText: string): boolean => {
    for (const candidate of new Set([selectorText, stripState(selectorText)])) {
      if (matchesAny(candidate)) return true;
    }
    // `html.dark` は probe が持つ (明暗の切替として模した) ので、 host 側の class ではない。
    const hostPart = selectorText.replace(/^html\.dark\s+/, "");
    if (!/[.#]/.test(hostPart)) return false;
    const subject = selectorText.split(/[\s>+~]+/).filter(Boolean).pop() ?? selectorText;
    return [...new Set([subject, stripState(subject)])].some(matchesAny);
  };
  const dom = new JSDOM(`<style>${cssText}</style>`);
  const byRole: Partial<Record<Role, Decl>> = {};
  const outOfScope: string[] = [];

  const walk = (rules: ArrayLike<unknown>, condition: string | null): void => {
    for (const rule of Array.from(rules)) {
      const r = rule as {
        selectorText?: string;
        style?: CSSStyleDeclaration;
        cssRules?: ArrayLike<unknown>;
        conditionText?: string;
        media?: { mediaText?: string };
        cssText?: string;
      };
      // jsdom では CSSStyleRule も `cssRules` を持つので、 先に `selectorText` で判定する。
      if (!r.selectorText || !r.style) {
        if (!r.cssRules) continue;
        const cond = r.conditionText ?? r.media?.mediaText ?? (r.cssText ?? "").split("{")[0]?.trim() ?? "条件付き";
        walk(r.cssRules, cond);
        continue;
      }
      // 対比に効く property を 1 つも宣言しない規則は無関係 (file 冒頭の `stroke: none` 等)。
      //
      // `font: var(--x)` は longhand に展開されないので `getPropertyValue` に出ない。 生の
      // 宣言文からも見ないと、 関係ある規則を無関係と誤判定して素通しする。
      const hasLonghand = [...RELEVANT_PROPS].some((prop) => r.style!.getPropertyValue(prop));
      const hasFontShorthand = /(^|[;{\s])font:/.test(r.style.cssText ?? "");
      if (!hasLonghand && !hasFontShorthand) continue;

      for (const one of r.selectorText.split(",")) {
        const sel = one.trim().replace(/\s+/g, " ");
        if (!hitsLabel(sel)) continue;

        // 条件付き at-rule の中は、 selector の形に依らず範囲外。
        if (condition !== null) {
          outOfScope.push(`@${condition} 内: ${sel}`);
          continue;
        }
        const m = CANONICAL.exec(sel);
        if (!m) {
          // 標準形でない selector は、 いつどの要素に当たるかが配色だけでは決まらない。
          outOfScope.push(`標準形でない selector: ${sel}`);
          continue;
        }
        for (const prop of OUT_OF_SCOPE_PROPS) {
          if (r.style.getPropertyValue(prop)) outOfScope.push(`${sel} { ${prop} }`);
        }
        if (/(^|[;{\s])font:\s*[^;}]*var\(/.test(r.style.cssText ?? "")) {
          outOfScope.push(`${sel} { font: var(...) }`);
        }

        const role = m[1] as Role;
        const prev = byRole[role] ?? {};
        const next: Decl = { ...prev };
        for (const [prop, field] of [
          ["fill", "fill"],
          ["font-size", "px"],
          ["font-weight", "weight"],
          ["font-family", "family"],
        ] as const) {
          const value = r.style.getPropertyValue(prop);
          if (!value) continue;
          if (/var\(/.test(value)) outOfScope.push(`${sel} { ${prop}: ${value} }`);
          // 宣言を後勝ちで統合してよいのは、 同じ specificity で importance も揃っている時だけ。
          // `!important` が付かない宣言が混ざると、 先に書いた `!important` の方が勝つ。
          if (r.style.getPropertyPriority(prop) !== "important") {
            outOfScope.push(`${sel} { ${prop} } に !important が無い`);
          }
          next[field] = value;
        }
        byRole[role] = next;
      }
    }
  };
  walk(dom.window.document.styleSheets[0]!.cssRules, null);
  return { byRole, outOfScope: [...new Set(outOfScope)] };
}

type Sample = {
  key: string;
  mode: Mode;
  line: Line;
  fg: Rgb | null;
  bg: Rgb | null;
  px: number | null;
  weight: number | null;
  /** 宣言された font-family の先頭。 宣言が無ければ null (継承)。 */
  family: string | null;
};

/** 明暗 × 行 について、 宣言された配色を解決する。 */
function resolve(byMode: Record<Mode, Collected>): Sample[] {
  const out: Sample[] = [];
  for (const mode of ["light", "dark"] as Mode[]) {
    const layer = byMode[mode].byRole;
    for (const line of ["main", "sub"] as Line[]) {
      const def = RENDERER_DEFAULT[line];
      const fgRaw = layer["edge-label"]?.fill;
      const bgRaw = layer["edge-label-bg"]?.fill;
      const pxRaw = layer["edge-label"]?.px;
      const weightRaw = layer["edge-label"]?.weight;
      out.push({
        key: `${mode}:${line}`,
        mode, line,
        fg: fgRaw === undefined ? null : parseColor(fgRaw) ?? parseHex(fgRaw) ?? parseNamed(fgRaw),
        bg: bgRaw === undefined ? null : parseColor(bgRaw) ?? parseHex(bgRaw) ?? parseNamed(bgRaw),
        px: pxRaw === undefined ? def.px : parsePx(pxRaw),
        weight: weightRaw === undefined ? def.weight : parseWeight(weightRaw),
        // CSS が宣言しなければ renderer が指定する family に落ちる。 main 行は renderer も
        // 指定しない (host からの継承) ため null になり、 face の検査対象から外れる。
        family: firstFamily(layer["edge-label"]?.family) ?? def.family,
      });
    }
  }
  return out;
}

const css = readFileSync(CSS_PATH, "utf8");
const VARS = readVarTables(readFileSync(GLOBALS_PATH, "utf8"));

/** 変数を明暗それぞれの値に置き換えた CSS。 検査はこれを読む。 */
const expanded: Record<Mode, string> = {
  light: expandVars(css, VARS.light),
  dark: expandVars(css, VARS.dark),
};
const collectedByMode: Record<Mode, Collected> = {
  light: collect(expanded.light),
  dark: collect(expanded.dark),
};
const collected: Collected = {
  byRole: collectedByMode.light.byRole,
  outOfScope: [...new Set([...collectedByMode.light.outOfScope, ...collectedByMode.dark.outOfScope])],
};
const resolved = resolve(collectedByMode);

describe("札の配色 (cdl#388)", () => {
  it("明暗の変数表を取り出す", () => {
    // 表が空だと全ての `var()` が解けず、 範囲外の検査だけが落ちて原因が見えなくなる。
    expect(VARS.light.get("--d-text-primary")).toBe("#191714");
    expect(VARS.dark.get("--d-text-primary")).toBe("#f3f1ec");
    // 暗い表は明るい表を土台にする = 上書きの無い変数は明るい値のまま効く。
    expect(VARS.dark.get("--d-r-1")).toBe(VARS.light.get("--d-r-1"));
  });

  it("明暗で違う色に解決される", () => {
    // 同じ宣言から 2 通りの色が出ることが、 明暗 2 表示の前提。
    const light = resolved.find((r) => r.key === "light:main")!;
    const dark = resolved.find((r) => r.key === "dark:main")!;
    expect(light.fg).not.toEqual(dark.fg);
    expect(light.bg).not.toEqual(dark.bg);
  });

  it("明暗 × 2 行 = 4 組を解決する", () => {
    expect(resolved.map((r) => r.key).sort()).toEqual(
      ["dark:main", "dark:sub", "light:main", "light:sub"],
    );
  });

  it("本 test の範囲外の形で書かれていない", () => {
    // 標準形でない selector / 条件付き at-rule / `var()` / `opacity` 系は、 宣言された配色だけ
    // では対比が決まらない。 黙って既定値に戻すと「配色は正しい」 と誤って報告する。
    // 描画結果の検査は実ブラウザ側 (#977) の担当。
    expect(collected.outOfScope).toEqual([]);
  });

  it("色 / 大きさ / 太さが全て解決できる", () => {
    const bad = resolved.filter((r) => r.fg === null || r.bg === null || r.px === null || r.weight === null);
    expect(bad.map((r) => r.key)).toEqual([]);
  });

  it.each(resolved.map((r) => [r.key, r] as const))("%s の配色が WCAG AA を満たす", (_key, r) => {
    const { fg, bg, px, weight } = r;
    if (fg === null || bg === null || px === null || weight === null) {
      throw new Error(`${r.key} が解決できない (前の test が原因を示す)`);
    }
    const required = requiredRatio(px, weight);
    expect(contrast(fg, bg), `${px}px weight ${weight} → 要求 ${required}:1`).toBeGreaterThanOrEqual(required);
  });

  it("閾値は宣言された文字の大きさで決まる", () => {
    expect(requiredRatio(22, 700)).toBe(WCAG_AA_LARGE);
    expect(requiredRatio(19, 400)).toBe(WCAG_AA_NORMAL);
    expect(requiredRatio(11, 700)).toBe(WCAG_AA_NORMAL); // 太字でも 18.66px 未満
    expect(requiredRatio(24, 400)).toBe(WCAG_AA_LARGE);
  });

  it("対比の式が WCAG の定義どおり", () => {
    expect(contrast([255, 255, 255], [0, 0, 0])).toBeCloseTo(21, 5);
    expect(contrast([78, 163, 106], [78, 163, 106])).toBeCloseTo(1, 5);
  });

  it("閾値を割る組合せは検知できる (検査が素通りしていない)", () => {
    expect(contrast([204, 204, 204], [255, 255, 255])).toBeLessThan(WCAG_AA_LARGE);
  });
});

describe("CSSOM が値を実ブラウザと同じに解決する (cdl#388)", () => {
  const sel = `[data-cdl-role="edge-label"]`;
  const probe = (decls: string, line: Line = "main") => {
    const injected = `${expanded.light}\n${sel} { ${decls} }`;
    const one = collect(injected);
    return resolve({ light: one, dark: one }).find((r) => r.key === `light:${line}`)!;
  };

  it("property 名の大文字小文字と colon 前の空白を吸収する", () => {
    expect(probe("FONT-SIZE : 11px !important;").px).toBe(11);
  });

  it("font shorthand を展開する", () => {
    const r = probe("font: 11px sans-serif !important;");
    expect(r.px).toBe(11);
    expect(r.weight).toBe(400);
  });

  it("後に書かれた宣言が勝つ", () => {
    expect(probe("font-size: 11px !important; font-size: 22px !important;").px).toBe(22);
  });

  it("無効な値は宣言が無かったものとして扱う (ブラウザと同じ)", () => {
    // 期待値は CSS の宣言そのものを読む。 書き写すと配色を変えた時にここだけ古くなる。
    const declared = resolve(collectedByMode).find((r) => r.key === "light:main")!;
    expect(probe("font-size: 24.0.0px !important;").px).toBe(declared.px);
    expect(probe("font-weight: 1001 !important;").weight).toBe(declared.weight);
  });

  it("keyword の font-weight を数値に直す", () => {
    expect(probe("font-weight: bold !important;").weight).toBe(700);
    expect(probe("font-weight: normal !important;").weight).toBe(400);
    expect(probe("font-weight: bolder !important;").weight).toBeNull();
  });

  it("calc() / rem を解決できない値として扱う", () => {
    expect(probe("font-size: calc(11px) !important;").px).toBeNull();
    expect(probe("font-size: 1.2rem !important;").px).toBeNull();
  });

  it("hex を rgb に正規化する", () => {
    expect(probe("fill: #abc !important;").fg).toEqual([170, 187, 204]);
  });

  it("半透明の色を解決できない値として扱う", () => {
    expect(probe("fill: rgba(0, 0, 0, 0.5) !important;").fg).toBeNull();
  });

  it("宣言が無ければ renderer の既定値を使う", () => {
    // 既定は cdl の SSOT (`EDGE_LABEL_TEXT`)。 CSS が宣言しない項目はここに落ちる。
    expect(probe("").px).toBe(EDGE_LABEL_TEXT.main.fontSize);
    expect(probe("", "sub").px).toBe(EDGE_LABEL_TEXT.sub.fontSize);
    // 大きさは CSS が宣言しないので、 両行とも renderer の値がそのまま出る。
    const bare = collect("[data-cdl-role='edge-label'] { fill: #000000 !important; }");
    const sample = resolve({ light: bare, dark: bare }).find((r) => r.key === "light:sub")!;
    expect(sample.weight).toBe(EDGE_LABEL_TEXT.sub.fontWeight);
  });

  it("engine の既定だけで 2 行とも large text になる", () => {
    // CSS が太さを宣言しなくても閾値が 3:1 で済む = 配色側の自由度がここで決まる。
    // engine が sub を通常文字に戻すと、 この test と 4 組の判定が同時に動く。
    expect(requiredRatio(EDGE_LABEL_TEXT.main.fontSize, EDGE_LABEL_TEXT.main.fontWeight)).toBe(WCAG_AA_LARGE);
    expect(requiredRatio(EDGE_LABEL_TEXT.sub.fontSize, EDGE_LABEL_TEXT.sub.fontWeight)).toBe(WCAG_AA_LARGE);
  });
});

describe("検査の範囲外を検知する (cdl#388)", () => {
  const sel = `[data-cdl-role="edge-label"]`;
  const found = (rule: string) => collect(`${expanded.light}\n${rule}`).outOfScope;

  it("標準形でない selector を検知する", () => {
    expect(found(`svg[data-cdl-stage] [data-cdl-role="edge-label"] { font-size: 11px !important; }`).length).toBeGreaterThan(0);
    expect(found(`[data-cdl-role="edge-label"]:hover { fill: #cccccc !important; }`).length).toBeGreaterThan(0);
    expect(found(`[data-cdl-edge-label-for] > [data-cdl-role="edge-label"] { fill: #cccccc !important; }`).length).toBeGreaterThan(0);
  });

  it("@media / @supports の中を検知する", () => {
    expect(found(`@media (min-width: 100px) { ${sel} { fill: #cccccc !important; } }`).length).toBeGreaterThan(0);
    expect(found(`@supports (fill: red) { ${sel} { font-size: 11px !important; } }`).length).toBeGreaterThan(0);
  });

  it("解けない var() を検知する", () => {
    // 代替を持たない `var()` は変数表で解けないのでそのまま残り、 範囲外になる。
    expect(found(`${sel} { fill: var(--not-defined) !important; }`).length).toBeGreaterThan(0);
    expect(found(`${sel} { font: var(--f) !important; }`).length).toBeGreaterThan(0);
  });

  it("html.dark の前置きを検知する", () => {
    // 明暗は変数側で決める規約。 ここに書くと決める場所が 2 つになる。
    expect(found(`html.dark ${sel} { fill: #cccccc !important; }`).length).toBeGreaterThan(0);
  });

  it("!important が無い宣言を検知する", () => {
    // 後勝ちで統合できるのは importance が揃っている時だけ。
    expect(found(`${sel} { fill: #cccccc; }`).length).toBeGreaterThan(0);
  });

  it("小数の font-weight は範囲内として扱う", () => {
    // CSS Fonts Level 4 の絶対値は 1..1000 の数値で、 小数も有効。
    const one = collect(`${expanded.light}\n${sel} { font-weight: 650.5 !important; }`);
    expect(resolve({ light: one, dark: one }).find((x) => x.key === "light:main")!.weight).toBe(650.5);
  });

  it("opacity / fill-opacity / all を検知する", () => {
    // 配色だけでは対比が決まらなくなる。
    expect(found(`${sel} { opacity: 0.5 !important; }`).length).toBeGreaterThan(0);
    expect(found(`${sel} { fill-opacity: 0.5 !important; }`).length).toBeGreaterThan(0);
    expect(found(`${sel} { all: initial !important; }`).length).toBeGreaterThan(0);
  });

  it("label に当たらない規則は検知しない", () => {
    expect(found(`@media (min-width: 100px) { [data-cdl-role="node-label"] { fill: #cccccc !important; } }`)).toEqual([]);
    expect(found(`[data-cdl-role="node-body"] rect { fill: #cccccc !important; }`)).toEqual([]);
  });

  it("role 名を書かなくても label に当たれば検知する", () => {
    // `svg text` は label の要素に当たる。 selector の字面ではなく当たるかどうかで決める。
    expect(found(`svg text { fill: #cccccc !important; }`).length).toBeGreaterThan(0);
  });

  it("selector list の並び順に依らず検知する", () => {
    // 規則全体で先に絞ると、 list の 2 番目以降に置かれた形を取りこぼす。
    const rule = (order: "first" | "last") =>
      order === "first"
        ? `.v4-editor-stage [data-cdl-role="edge-label"], [data-cdl-role="node-label"] { fill: #cccccc !important; }`
        : `[data-cdl-role="node-label"], .v4-editor-stage [data-cdl-role="edge-label"] { fill: #cccccc !important; }`;
    expect(found(rule("first")).length).toBeGreaterThan(0);
    expect(found(rule("last")).length).toBeGreaterThan(0);
  });

  it("host 側の祖先を伴う selector を検知する", () => {
    // 実ページには `.v4-editor-stage` のような class を持つ祖先が付く。 probe には
    // 用意できないので、 祖先の条件を落として一番右の compound で判定する。
    expect(found(`.v4-editor-stage [data-cdl-role="edge-label"] { fill: #cccccc !important; }`).length).toBeGreaterThan(0);
    expect(found(`.v4-editor-stage [data-cdl-role="edge-label"]:hover { fill: #cccccc !important; }`).length).toBeGreaterThan(0);
    expect(found(`#app [data-cdl-role="edge-label-bg"] { fill: #cccccc !important; }`).length).toBeGreaterThan(0);
  });

  it("host 側の class があっても label に当たらなければ検知しない", () => {
    // 一番右の compound が label の要素に当たらない = この規則は label に届かない。
    expect(found(`.v4-editor-stage [data-cdl-role="node-label"] { fill: #cccccc !important; }`)).toEqual([]);
  });

  it("名前付きの色を解決する", () => {
    const fgOf = (decl: string) =>
      ((one) => resolve({ light: one, dark: one }).find((x) => x.key === "light:main")!.fg)(
        collect(`${expanded.light}\n${sel} { ${decl} }`),
      );
    expect(fgOf("fill: black !important;")).toEqual([0, 0, 0]);
    expect(fgOf("fill: rebeccapurple !important;")).toEqual([102, 51, 153]);
  });

  it("固定の色でない名前を解決できない値として扱う", () => {
    // CSSOM が値を保持する形 (keyword / 文脈依存 / `none`)。 一度描かせると既定の黒に
    // 解決されるので、 そのまま読むと「対比十分」 と誤報告する。
    const fgOf = (decl: string) =>
      ((one) => resolve({ light: one, dark: one }).find((x) => x.key === "light:main")!.fg)(
        collect(`${expanded.light}\n${sel} { ${decl} }`),
      );
    for (const v of [
      "currentColor", "inherit", "unset", "none", "transparent",
      // system color = 環境しだいで変わる。 jsdom が返す固定値で判定してはいけない。
      "CanvasText", "Canvas", "LinkText", "AccentColor", "ButtonFace", "Highlight",
    ]) {
      expect(fgOf(`fill: ${v} !important;`), v).toBeNull();
    }
    // `initial` は `fill` の初期値 (黒) に解決される = 固定の色なので受理する。
    expect(fgOf("fill: initial !important;")).toEqual([0, 0, 0]);
  });

  it("綴りが無効な色は宣言が無かったものとして扱う (ブラウザと同じ)", () => {
    // CSSOM が無効な宣言を捨てるので、 前の有効な宣言が残る。 主題の色がそのまま出る。
    //
    // 期待値は主題の宣言そのもの。 CSS から読んで突き合わせる (色を変えた時に 2 箇所を直す
    // 必要が出ないように = 実際 #977 で `#a66a3d` → `#865631` に変えた時にここが落ちた)。
    const declaredFg = resolve(collectedByMode).find((x) => x.key === "light:main")!.fg;
    const fgOf = (decl: string) =>
      ((one) => resolve({ light: one, dark: one }).find((x) => x.key === "light:main")!.fg)(
        collect(`${expanded.light}\n${sel} { ${decl} }`),
      );
    expect(declaredFg, "CSS が色を宣言している").not.toBeNull();
    expect(fgOf("fill: zzznotacolor !important;")).toEqual(declaredFg);
  });

  it("引用符の種類や空白が違っても検知する", () => {
    // 正規表現で selector を読むと取りこぼす形。 `matches()` は文法として解釈する。
    expect(found(`[data-cdl-role='edge-label'] { fill: #cccccc !important; }`).length).toBeGreaterThan(0);
    expect(found(`[ data-cdl-role = "edge-label" ] { fill: #cccccc !important; }`).length).toBeGreaterThan(0);
  });
});

describe("cdl が読まない CSS 変数を残さない (cdl#388)", () => {
  it("--cdl-label-text は cdl が読まないので使わない", () => {
    // cdl の edge label は `var(--cdl-text-dim, ...)` と tone 色しか読まない
    // (`packages/cdl/src/render/edges.tsx`)。 `--cdl-label-text` を書いても効かないため、
    // 「設定したつもり」 が残る。 実際の色は role selector の `fill` で決める。
    expect(css).not.toMatch(/--cdl-label-text\s*:/);
  });
});

describe("描く太さの face を読み込んでいる (cdl#391)", () => {
  /**
   * `font-weight: 700` と書いても、 その太さの face を読み込んでいなければ 700 では描かれない。
   *
   * CSS の font matching は、 要求より重い face が無ければ軽い face に落とす。 Chromium は
   * その時 **合成太字を当てない** = 実測で 600 と 700 の描画が 1 byte 差なく一致した。
   *
   * cdl は sub 行を「太字だから large text」 として 3:1 で判定する (`isLargeText`)。 実際に
   * 描かれるのが 600 なら、 その前提が成り立たない。 4.5:1 が要るのに 3:1 で通ってしまう。
   */
  /**
   * 字を読み込む経路 (#1122)。
   *
   * 以前は `index.html` が Google の配信元から太さを 4 段ずつ読んでいたので、 その URL を
   * 解析していた。 同梱に切り替えて可変幅の face 1 つが 100-900 を賄う形になったため、
   * **同梱した css の `@font-face` を読む** 形に変えた。
   *
   * 読む css は `main.tsx` の import から取り出す。 list を test 側に写すと、 app 側で
   * import を増減した時に食い違う。
   */
  const ENTRY = "../../../apps/playground-spa/src/main.tsx";
  const PKG_ROOT = "../../../apps/playground-spa/node_modules/";

  /** `main.tsx` が読む同梱 css の相対 path を取り出す。 */
  const bundledFontCss = (entry: string): string[] =>
    [...entry.matchAll(/^import\s+"(@fontsource[^"]+\.css)";/gm)].map((m) => PKG_ROOT + m[1]!);

  /**
   * `@font-face` の宣言から `family → その太さを描けるか` を作る。
   *
   * 可変幅は `font-weight: 100 900` のように範囲で書く。 範囲は両端を含む連続値なので、
   * 描けるかは範囲に入るかで決まる。
   */
  const declaredWeights = (text: string): Map<string, (w: number) => boolean> => {
    const out = new Map<string, (w: number) => boolean>();
    for (const block of text.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
      const body = block[1]!;
      const family = /font-family:\s*['"]?([^;'"]+)['"]?\s*;/.exec(body)?.[1]?.trim();
      const weight = /font-weight:\s*([^;]+);/.exec(body)?.[1]?.trim();
      if (family === undefined || weight === undefined) continue;
      const ns = weight.split(/\s+/).map(Number).filter((n) => Number.isFinite(n));
      if (ns.length === 0) continue;
      const lo = Math.min(...ns);
      const hi = Math.max(...ns);
      const prev = out.get(family);
      const fn = (w: number): boolean => w >= lo && w <= hi;
      out.set(family, prev === undefined ? fn : (w: number) => prev(w) || fn(w));
    }
    return out;
  };

  const read = (rel: string): string => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

  const loaded = (): Map<string, (w: number) => boolean> => {
    const merged = new Map<string, (w: number) => boolean>();
    for (const rel of bundledFontCss(read(ENTRY))) {
      for (const [family, fn] of declaredWeights(read(rel))) {
        const prev = merged.get(family);
        merged.set(family, prev === undefined ? fn : (w: number) => prev(w) || fn(w));
      }
    }
    return merged;
  };

  it("`main.tsx` から同梱 css の path を取り出す", () => {
    const got = bundledFontCss('import "@fontsource-variable/inter/wght.css";\nimport "./x.css";\n');
    expect(got).toEqual([PKG_ROOT + "@fontsource-variable/inter/wght.css"]);
    // 同梱以外の import は拾わない。
    expect(bundledFontCss('import "./styles/globals.css";')).toEqual([]);
  });

  it("`@font-face` から family ごとの太さの範囲を取り出す", () => {
    const m = declaredWeights(`
      @font-face { font-family: 'Inter Variable'; font-weight: 100 900; src: url(a.woff2); }
      @font-face { font-family: "Old"; font-weight: 400; src: url(b.woff2); }
    `);
    // 可変幅は範囲の内側を全部描ける。
    expect(m.get("Inter Variable")!(400)).toBe(true);
    expect(m.get("Inter Variable")!(700)).toBe(true);
    expect(m.get("Inter Variable")!(950)).toBe(false);
    // 単一値はその太さだけ。
    expect(m.get("Old")!(400)).toBe(true);
    expect(m.get("Old")!(700)).toBe(false);
  });

  it("同梱 css を 1 つ以上読んでいる", () => {
    // 0 件だと下の検査が「対象なし」 で素通りする (#1122 で index.html から URL を消した時、
    // 旧実装が 0 件になって checked が 0 に落ちた)。
    const css = bundledFontCss(read(ENTRY));
    expect(css.length, "main.tsx が同梱 css を読んでいない").toBeGreaterThan(0);
    for (const rel of css) expect(read(rel).length, `${rel} が空`).toBeGreaterThan(0);
  });

  it("札を描く太さの face を明暗ぶん読み込んでいる", () => {
    const have = loaded();
    const samples = resolve(collectedByMode);
    const missing: string[] = [];
    let checked = 0;
    for (const s of samples) {
      // family が決まらない行は見ない。 main 行は主題も renderer も指定せず host からの
      // 継承になるので、 どの face が効くかを CSS からは決められない。
      if (s.family === null || s.weight === null) continue;
      const 描ける = have.get(s.family);
      // 端末に入っている前提の family (`Courier New` 等) は同梱しない。
      if (描ける === undefined) continue;
      checked++;
      if (!描ける(s.weight)) missing.push(`${s.key} = ${s.family} の ${s.weight}`);
    }
    expect(missing).toEqual([]);
    // 件数も固定する。 CSS 側の宣言が消えると検査対象が減り、 空でも通る状態になる。
    // 明暗 × 2 行 = 4 組。 CSS が `font-family` を宣言するので 4 組とも対象に入る。
    expect(checked).toBe(4);
  });


  it("engine の既定の太さも読み込んでいる (family を宣言する主題)", () => {
    // 主題が太さを宣言しない場合、 engine の既定 (main / sub とも 700) で描かれる。
    const have = loaded();
    const samples = resolve(collectedByMode);
    const families = new Set(samples.map((s) => s.family).filter((f): f is string => f !== null));
    const missing: string[] = [];
    for (const family of families) {
      const 描ける = have.get(family);
      if (描ける === undefined) continue;
      for (const line of ["main", "sub"] as const) {
        const w = EDGE_LABEL_TEXT[line].fontWeight;
        if (!描ける(w)) missing.push(`${family} の ${w} (${line} 行の既定)`);
      }
    }
    expect(missing).toEqual([]);
  });
});
