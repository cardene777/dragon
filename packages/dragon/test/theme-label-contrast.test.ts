/**
 * 主題が **宣言している** edge label の配色を検査する (cardene777/cdl#388)。
 *
 * cdl 側の軸 27 `contrast-basics` は cdl の既定値どうしの対比しか測れない。 下流は 2 通りの
 * 経路で色を変えられるため、 下流の配色は下流が見る必要がある。
 *
 *   1. CSS 変数 (`--cdl-label-bg` / `--cdl-text-dim` / `--cdl-tone-*`)
 *   2. role selector への `fill: ... !important`
 *      (`[data-cdl-role="edge-label"]` / `[data-cdl-role="edge-label-bg"]`)
 *
 * `cdl-theme.css` の 6 主題は **2 の経路** で色を決めている。 変数だけを読むと実際の色と
 * 食い違うので、 role selector の宣言を読む。
 *
 * ## 何を検査するか = 宣言された配色まで
 *
 * 本 test が答える問いは 1 つだけ。
 *
 *   「各主題が edge label の文字と背景に宣言した色の組は、 宣言した文字の大きさに対して
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
 * **責務を分ける**。 描画結果の対比は実ブラウザで測る = #977 (`tests/a11y-check.spec.ts` に配線)。 本 test は配色の宣言だけを見る。 配色が正しくても描画で崩れることはあるが、
 * 配色が誤っていれば描画は必ず崩れるので、 先に潰す価値がある。
 *
 * ## 検査の範囲外を fail closed にする
 *
 * 上の問いに答えられない形で書かれていたら落とす。 黙って既定値に戻すと、 実際は違う色 /
 * 大きさなのに「配色は正しい」 と報告してしまう。
 *
 *   - 主題 × role の標準形以外の selector が label に当たりうる (`svg[...]` / `:hover` /
 *     子孫指定 / host 側の class を伴う祖先)
 *   - `@media` / `@supports` の中で label に当たりうる
 *   - 値に `var()` が入る
 *   - 色が不透明な sRGB に解決できない (`var()` / 半透明) / 大きさが px 以外 / 太さが相対値
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
  requiredContrastRatio({ fontSize: px, fontWeight: weight, opacity: 1 });

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

/** 主題 × role の標準形。 これ以外の selector が label に当たったら検査の範囲外。 */
const CANONICAL = /^(html\.dark )?\[data-cdl-theme="[a-z0-9-]+"\] \[data-cdl-role="(edge-label|edge-label-bg)"\]$/;

/**
 * selector が label の要素に当たるかを `matches()` で判定する。
 *
 * 正規表現で selector を読むと、 引用符の種類 (`'` / `"`) / 属性演算子前後の空白 / 大文字小文字の
 * flag といった正しい書き方を取りこぼす。 判定は DOM に任せる。
 *
 * 主題ごとに probe を作るのは、 `[data-cdl-theme="blueprint"] ...` のような selector が
 * 別主題の probe には当たらないため。
 */
function makeRoleProbes(themes: string[]): Element[] {
  const out: Element[] = [];
  for (const theme of themes) {
    for (const dark of [false, true]) {
      const dom = new JSDOM(
        `<html class="${dark ? "dark" : ""}"><body><svg data-cdl-theme="${theme}">` +
          `<g data-cdl-edge-label-for="e">` +
          `<rect data-cdl-role="edge-label-bg"></rect>` +
          `<text data-cdl-role="edge-label">m</text>` +
          `<text data-cdl-role="edge-label">s</text>` +
          `</g></svg></body></html>`,
      );
      const doc = dom.window.document;
      out.push(...Array.from(doc.querySelectorAll("[data-cdl-role]")));
    }
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
type Mode = "light" | "dark";
type Line = "main" | "sub";
type Decl = { fill?: string; px?: string; weight?: string; family?: string };

type Collected = {
  /** `主題:明暗` → role → 宣言。 標準形の selector から集めたもの。 */
  byTheme: Map<string, Partial<Record<Role, Decl>>>;
  /** 本 test が答えられない形。 1 件でもあれば落とす。 */
  outOfScope: string[];
};

/**
 * CSS から、 標準形の selector が宣言している配色を集める。
 *
 * CSSOM に解析させるのは、 property 名の正規化 / `font` shorthand の展開 / 無効値の破棄を
 * 実ブラウザと揃えるため。 selector の照合はしない (標準形かどうかを見るだけ)。
 */
function collect(cssText: string, themes: string[]): Collected {
  const probes = makeRoleProbes(themes);
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
  const byTheme = new Map<string, Partial<Record<Role, Decl>>>();
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

        const themeKey = `${/^html\.dark /.test(sel) ? "dark" : "light"}`;
        const theme = /\[data-cdl-theme="([a-z0-9-]+)"\]/.exec(sel)![1]!;
        const key = `${theme}:${themeKey}`;
        const role = m[2] as Role;
        const prev = byTheme.get(key)?.[role] ?? {};
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
        byTheme.set(key, { ...(byTheme.get(key) ?? {}), [role]: next });
      }
    }
  };
  walk(dom.window.document.styleSheets[0]!.cssRules, null);
  return { byTheme, outOfScope: [...new Set(outOfScope)] };
}

type Sample = {
  key: string;
  theme: string;
  mode: Mode;
  line: Line;
  fg: Rgb | null;
  bg: Rgb | null;
  px: number | null;
  weight: number | null;
  /** 宣言された font-family の先頭。 宣言が無ければ null (継承)。 */
  family: string | null;
};

/** 主題 × 明暗 × 行 について、 宣言された配色を解決する。 */
function resolve(collected: Collected, themes: string[]): Sample[] {
  const out: Sample[] = [];
  for (const theme of themes) {
    const light = collected.byTheme.get(`${theme}:light`) ?? {};
    const dark = collected.byTheme.get(`${theme}:dark`);
    for (const mode of ["light", "dark"] as Mode[]) {
      // 暗色専用の宣言が無ければ明色の宣言がそのまま効く。 entry を作らないと暗色を検査しない。
      const layer = {
        "edge-label": { ...light["edge-label"], ...(mode === "dark" ? dark?.["edge-label"] : {}) },
        "edge-label-bg": { ...light["edge-label-bg"], ...(mode === "dark" ? dark?.["edge-label-bg"] : {}) },
      };
      for (const line of ["main", "sub"] as Line[]) {
        const def = RENDERER_DEFAULT[line];
        const fgRaw = layer["edge-label"].fill;
        const bgRaw = layer["edge-label-bg"].fill;
        const pxRaw = layer["edge-label"].px;
        const weightRaw = layer["edge-label"].weight;
        out.push({
          key: `${theme}:${mode}:${line}`,
          theme, mode, line,
          fg: fgRaw === undefined ? null : parseColor(fgRaw) ?? parseHex(fgRaw) ?? parseNamed(fgRaw),
          bg: bgRaw === undefined ? null : parseColor(bgRaw) ?? parseHex(bgRaw) ?? parseNamed(bgRaw),
          px: pxRaw === undefined ? def.px : parsePx(pxRaw),
          weight: weightRaw === undefined ? def.weight : parseWeight(weightRaw),
          // 主題が宣言しなければ renderer が指定する family に落ちる。 main 行は renderer も
          // 指定しない (host からの継承) ため null になり、 face の検査対象から外れる。
          family: firstFamily(layer["edge-label"].family) ?? def.family,
        });
      }
    }
  }
  return out;
}

const css = readFileSync(CSS_PATH, "utf8");
/** CSS に現れる主題名。 手で並べず CSS から取る。 */
const THEMES = [...new Set([...css.matchAll(/\[data-cdl-theme="([a-z0-9-]+)"\]/g)].map((m) => m[1]!))].sort();
const collected = collect(css, THEMES);
const resolved = resolve(collected, THEMES);

describe("主題が宣言した edge label の配色 (cdl#388)", () => {
  it("CSS から 6 主題を取り出す", () => {
    expect(THEMES).toEqual(["blueprint", "circuit", "handdrawn", "isometric", "neumorphism", "pinboard"]);
  });

  it("6 主題 × 明暗 × 2 行 = 24 組を解決する", () => {
    expect(resolved.map((r) => r.key).sort()).toEqual(
      THEMES.flatMap((t) => ["light", "dark"].flatMap((m) => ["main", "sub"].map((l) => `${t}:${m}:${l}`))).sort(),
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
  const T = "neumorphism";
  const sel = `[data-cdl-theme="${T}"] [data-cdl-role="edge-label"]`;
  const probe = (decls: string, line: Line = "main") => {
    const injected = `${css}\n${sel} { ${decls} }`;
    return resolve(collect(injected, [T]), [T]).find((r) => r.key === `${T}:light:${line}`)!;
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
    expect(probe("font-size: 24.0.0px !important;").px).toBe(22);
    expect(probe("font-weight: 1001 !important;").weight).toBe(700);
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
    // 既定は cdl の SSOT (`EDGE_LABEL_TEXT`) から来る。 主題が宣言しない項目はここに落ちる。
    expect(probe("").px).toBe(EDGE_LABEL_TEXT.main.fontSize);
    expect(probe("", "sub").px).toBe(EDGE_LABEL_TEXT.sub.fontSize);
    // 太さは neumorphism が 700 を宣言しているので、 両行ともそちらが効く。
    expect(probe("", "sub").weight).toBe(700);
    // 宣言しない主題では既定に戻る。
    const noWeight = resolve(collect(css, THEMES), ["handdrawn"]).find((r) => r.key === "handdrawn:light:sub")!;
    expect(noWeight.weight).toBe(EDGE_LABEL_TEXT.sub.fontWeight);
  });

  it("engine の既定だけで 2 行とも large text になる", () => {
    // 主題が太さを宣言しなくても閾値が 3:1 で済む = 主題側の配色の自由度がここで決まる。
    // engine が sub を通常文字に戻すと、 この test と 24 組の判定が同時に動く。
    expect(requiredRatio(EDGE_LABEL_TEXT.main.fontSize, EDGE_LABEL_TEXT.main.fontWeight)).toBe(WCAG_AA_LARGE);
    expect(requiredRatio(EDGE_LABEL_TEXT.sub.fontSize, EDGE_LABEL_TEXT.sub.fontWeight)).toBe(WCAG_AA_LARGE);
  });
});

describe("検査の範囲外を検知する (cdl#388)", () => {
  const T = "neumorphism";
  const sel = `[data-cdl-theme="${T}"] [data-cdl-role="edge-label"]`;
  const found = (rule: string) => collect(`${css}\n${rule}`, THEMES).outOfScope;

  it("標準形でない selector を検知する", () => {
    expect(found(`svg[data-cdl-theme="${T}"] [data-cdl-role="edge-label"] { font-size: 11px !important; }`).length).toBeGreaterThan(0);
    expect(found(`[data-cdl-role="edge-label"]:hover { fill: #cccccc !important; }`).length).toBeGreaterThan(0);
    expect(found(`[data-cdl-edge-label-for] > [data-cdl-role="edge-label"] { fill: #cccccc !important; }`).length).toBeGreaterThan(0);
  });

  it("@media / @supports の中を検知する", () => {
    expect(found(`@media (min-width: 100px) { ${sel} { fill: #cccccc !important; } }`).length).toBeGreaterThan(0);
    expect(found(`@supports (fill: red) { ${sel} { font-size: 11px !important; } }`).length).toBeGreaterThan(0);
  });

  it("var() を検知する", () => {
    expect(found(`${sel} { fill: var(--x, #ccc) !important; }`).length).toBeGreaterThan(0);
    expect(found(`${sel} { font: var(--f) !important; }`).length).toBeGreaterThan(0);
  });

  it("!important が無い宣言を検知する", () => {
    // 後勝ちで統合できるのは importance が揃っている時だけ。
    expect(found(`${sel} { fill: #cccccc; }`).length).toBeGreaterThan(0);
  });

  it("小数の font-weight は範囲内として扱う", () => {
    // CSS Fonts Level 4 の絶対値は 1..1000 の数値で、 小数も有効。
    const r = resolve(collect(`${css}\n${sel} { font-weight: 650.5 !important; }`, [T]), [T])
      .find((x) => x.key === `${T}:light:main`)!;
    expect(r.weight).toBe(650.5);
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
      resolve(collect(`${css}\n${sel} { ${decl} }`, [T]), [T]).find((x) => x.key === `${T}:light:main`)!.fg;
    expect(fgOf("fill: black !important;")).toEqual([0, 0, 0]);
    expect(fgOf("fill: rebeccapurple !important;")).toEqual([102, 51, 153]);
  });

  it("固定の色でない名前を解決できない値として扱う", () => {
    // CSSOM が値を保持する形 (keyword / 文脈依存 / `none`)。 一度描かせると既定の黒に
    // 解決されるので、 そのまま読むと「対比十分」 と誤報告する。
    const fgOf = (decl: string) =>
      resolve(collect(`${css}\n${sel} { ${decl} }`, [T]), [T]).find((x) => x.key === `${T}:light:main`)!.fg;
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
    const fgOf = (decl: string) =>
      resolve(collect(`${css}\n${sel} { ${decl} }`, [T]), [T]).find((x) => x.key === `${T}:light:main`)!.fg;
    expect(fgOf("fill: zzznotacolor !important;")).toEqual([166, 106, 61]);
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
  const FONT_URL_FILES = [
    "../../../apps/playground-spa/index.html",
    "../../../apps/playground-spa/src/styles/header.css",
  ];

  /** web font の宣言から `family → 読み込む太さ` を作る。 */
  const declaredWeights = (text: string): Map<string, Set<number>> => {
    const out = new Map<string, Set<number>>();
    // `family=Inter:wght@400;500;700` / `family=JetBrains+Mono:wght@400;700` の形。
    for (const m of text.matchAll(/family=([A-Za-z+\d]+)(?::([^&"')]*))?/g)) {
      const family = m[1]!.replace(/\+/g, " ");
      const set = out.get(family) ?? new Set<number>();
      const axes = m[2] ?? "";
      // `wght@` より後ろの数値。 `opsz,wght@6..72,400;6..72,500` のように軸が複数ある形では
      // 各組の末尾が weight になる。
      const wght = /wght@(.+)$/.exec(axes)?.[1];
      if (wght === undefined) {
        // 太さの指定が無い形 = regular (400) だけを読み込む。
        set.add(400);
      } else {
        for (const group of wght.split(";")) {
          const last = group.split(",").pop()!.trim();
          const n = Number(last);
          if (Number.isFinite(n)) set.add(n);
        }
      }
      out.set(family, set);
    }
    return out;
  };

  const loaded = (): Map<string, Set<number>> => {
    const merged = new Map<string, Set<number>>();
    for (const rel of FONT_URL_FILES) {
      const text = readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
      for (const [family, weights] of declaredWeights(text)) {
        const set = merged.get(family) ?? new Set<number>();
        for (const w of weights) set.add(w);
        merged.set(family, set);
      }
    }
    return merged;
  };

  it("宣言から family ごとの太さを取り出す", () => {
    const m = declaredWeights(
      'href="https://x/css2?family=Newsreader:opsz,wght@6..72,400;6..72,600&family=Inter:wght@400;700&family=Kalam"',
    );
    expect([...m.get("Newsreader")!].sort()).toEqual([400, 600]);
    expect([...m.get("Inter")!].sort()).toEqual([400, 700]);
    // 太さを書かない形は regular だけ。
    expect([...m.get("Kalam")!]).toEqual([400]);
  });

  it("label を描く太さの face を全主題ぶん読み込んでいる", () => {
    const have = loaded();
    const samples = resolve(collect(css, THEMES), THEMES);
    const missing: string[] = [];
    let checked = 0;
    for (const s of samples) {
      // family が決まらない行は見ない。 main 行は主題も renderer も指定せず host からの
      // 継承になるので、 どの face が効くかを CSS からは決められない。
      if (s.family === null || s.weight === null) continue;
      const weights = have.get(s.family);
      // 端末に入っている前提の family (`Courier New` 等) は web font として読み込まない。
      if (weights === undefined) continue;
      checked++;
      if (!weights.has(s.weight)) missing.push(`${s.key} = ${s.family} の ${s.weight}`);
    }
    expect(missing).toEqual([]);
    // 件数も固定する。 主題側の宣言が消えると検査対象が減り、 空でも通る状態になる。
    // sub 行 12 組 (6 主題 × 明暗) は renderer が family を指定するので必ず対象に入り、
    // 加えて main 行に family を宣言する 4 主題 × 明暗 = 8 組が乗る。
    expect(checked).toBe(20);
  });


  it("engine の既定の太さも読み込んでいる (family を宣言する主題)", () => {
    // 主題が太さを宣言しない場合、 engine の既定 (main / sub とも 700) で描かれる。
    const have = loaded();
    const samples = resolve(collect(css, THEMES), THEMES);
    const families = new Set(samples.map((s) => s.family).filter((f): f is string => f !== null));
    const missing: string[] = [];
    for (const family of families) {
      const weights = have.get(family);
      if (weights === undefined) continue;
      for (const line of ["main", "sub"] as const) {
        const w = EDGE_LABEL_TEXT[line].fontWeight;
        if (!weights.has(w)) missing.push(`${family} の ${w} (${line} 行の既定)`);
      }
    }
    expect(missing).toEqual([]);
  });
});
