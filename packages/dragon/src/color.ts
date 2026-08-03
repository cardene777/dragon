/**
 * 色として読める値かの判定と、 図から外部参照を落とす処理 (#1004)。
 *
 * 図の中の文字列は最終的に SVG の属性になる。 色を塗る位置 (`fill` / `stroke` 等) に
 * `url(https://example.invalid/x)` が入ると、 図を開いた人の環境からその URL へ要求が飛ぶ。
 * 書き出した SVG を配布しても同じことが起きる。
 *
 * 入口は 1 つではない (状態の上書き / phase の `set` / 画面が直接書く背景色 / 埋め込んだ JSON)。
 * 入口ごとに塞ぐと 1 つ見落とした時に穴が残るため、 **組み立ての最後に図全体を走査する**
 * 出口の検査を置く。 入口側の判定 (`isColorValue`) は「正しい図を保つ」 ため、
 * 出口の検査 (`stripExternalPaint`) は「漏れを塞ぐ」 ための二重の構えになっている。
 */

/**
 * CSS の標準色名。
 *
 * 色名を色として扱わないと、 初期値に `red` を持つ状態が「色ではない」 判定になり、
 * その状態への上書きが無検査で通る (実測で `fill="url(...)"` が生成された)。
 * 逆に 16 進の初期値へ正当な `red` を書いた時に元の色へ戻る退行も起きる。
 *
 * 完全一致で照合する。 部分一致にすると `red; background:url(x)` のような形が通る。
 */
const CSS_COLOR_NAMES: ReadonlySet<string> = new Set([
  "aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige", "bisque", "black",
  "blanchedalmond", "blue", "blueviolet", "brown", "burlywood", "cadetblue", "chartreuse",
  "chocolate", "coral", "cornflowerblue", "cornsilk", "crimson", "cyan", "darkblue", "darkcyan",
  "darkgoldenrod", "darkgray", "darkgreen", "darkgrey", "darkkhaki", "darkmagenta",
  "darkolivegreen", "darkorange", "darkorchid", "darkred", "darksalmon", "darkseagreen",
  "darkslateblue", "darkslategray", "darkslategrey", "darkturquoise", "darkviolet", "deeppink",
  "deepskyblue", "dimgray", "dimgrey", "dodgerblue", "firebrick", "floralwhite", "forestgreen",
  "fuchsia", "gainsboro", "ghostwhite", "gold", "goldenrod", "gray", "green", "greenyellow",
  "grey", "honeydew", "hotpink", "indianred", "indigo", "ivory", "khaki", "lavender",
  "lavenderblush", "lawngreen", "lemonchiffon", "lightblue", "lightcoral", "lightcyan",
  "lightgoldenrodyellow", "lightgray", "lightgreen", "lightgrey", "lightpink", "lightsalmon",
  "lightseagreen", "lightskyblue", "lightslategray", "lightslategrey", "lightsteelblue",
  "lightyellow", "lime", "limegreen", "linen", "magenta", "maroon", "mediumaquamarine",
  "mediumblue", "mediumorchid", "mediumpurple", "mediumseagreen", "mediumslateblue",
  "mediumspringgreen", "mediumturquoise", "mediumvioletred", "midnightblue", "mintcream",
  "mistyrose", "moccasin", "navajowhite", "navy", "oldlace", "olive", "olivedrab", "orange",
  "orangered", "orchid", "palegoldenrod", "palegreen", "paleturquoise", "palevioletred",
  "papayawhip", "peachpuff", "peru", "pink", "plum", "powderblue", "purple", "rebeccapurple",
  "red", "rosybrown", "royalblue", "saddlebrown", "salmon", "sandybrown", "seagreen", "seashell",
  "sienna", "silver", "skyblue", "slateblue", "slategray", "slategrey", "snow", "springgreen",
  "steelblue", "tan", "teal", "thistle", "tomato", "transparent", "turquoise", "violet", "wheat",
  "white", "whitesmoke", "yellow", "yellowgreen",
  // 塗らないことを表す値。 色ではないが、 色を書く位置に置ける正当な値
  "none", "currentcolor",
]);

/**
 * 色として読める値か。
 *
 * 状態の値は node の `fill` にそのまま入る。 そのため「色の状態を探す」 判定と
 * 「上書きを受け入れるか」 の判定は同じ物差しでなければならない。 別々に持つと、
 * 片方だけ直した時に片方が通してしまう。
 *
 * 通すのは 16 進の 3 形 (`#rgb` / `#rrggbb` / `#rrggbbaa`) と、 標準の色名。
 * 桁数を絞るのは、 `#1234` のような半端な形を色として扱うと描画側の解釈に委ねる範囲が
 * 広がるため。 見本のすべての色が 3 形に収まることは `parts-color-hex-format.test.ts` が検査している。
 *
 * `rgb(...)` / `hsl(...)` は通さない。 括弧を含む形を許すと、 括弧の中身を見る判定が要る。
 * 見本のどのパーツも使っておらず、 通す理由が無い。
 */
export function isColorValue(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const s = v.trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s)) return true;
  return CSS_COLOR_NAMES.has(s.toLowerCase());
}

/**
 * 図の外側を指す値か。
 *
 * SVG の `url(...)` は図の中の定義 (`url(#gradient-1)`) も指せる。 これは正当な用途なので、
 * 括弧の中が `#` で始まる形だけを残し、 それ以外を外向きとみなす。
 *
 * 空白と大文字小文字は無視する。 `URL( https://... )` のような書き方で判定を抜けられないため。
 */
export function pointsOutside(v: unknown): boolean {
  if (typeof v !== "string") return false;
  // 空白をすべて落としてから見る。 `url ( http...)` のように間に空白を挟む形も同じ扱いにする
  const compact = v.replace(/\s+/g, "").toLowerCase();
  const m = compact.match(/url\(([^)]*)/);
  if (m) {
    const inner = (m[1] ?? "").replace(/^["']/, "");
    // 図の中の定義を指すものだけ残す
    return !inner.startsWith("#");
  }
  // `url(` を伴わない直書きの参照。 属性によってはこの形でも読み込まれる
  return /^(https?:)?\/\//.test(compact) || compact.startsWith("data:");
}

/** 色を塗る位置に使われる key。 ここに入る値は SVG の paint 属性になる */
const PAINT_KEYS: ReadonlySet<string> = new Set([
  "fill", "stroke", "color", "bg", "background",
  "fillbind", "strokebind", "colorbind",
  "stfill", "strokecolor", "fillcolor",
]);

/** 落とした時に入れる値。 「塗らない」 を表す SVG の正当な値 */
const SAFE_PAINT = "none";

/** 落とした場所と値。 呼出側が書いた人に知らせるために使う */
export type StrippedPaint = { path: string; value: string };

/**
 * 図の中から、 色を塗る位置に入った外部参照を落とす。
 *
 * 対象は 2 種類ある。
 *
 * - 色を塗る key (`fill` / `stroke` / `bg` 等) の値
 * - 状態の値 (`states[].initial` と、 phase が状態へ入れる値)。 状態は `{名前}` の形で
 *   `fill` に差し込まれるため、 色を塗る位置に届く
 *
 * 説明文 (`title` / `subtitle` / `value` / `rows`) は対象外。 文字として出るだけで
 * 属性にはならないため、 URL を書く正当な用途を壊さない。
 *
 * 図を直接書き換える (返り値ではなく引数を変える)。 組み立ての最後に 1 度だけ呼ぶ前提。
 */
export function stripExternalPaint(diagram: unknown): StrippedPaint[] {
  const stripped: StrippedPaint[] = [];
  walk(diagram, "", false, stripped);
  return stripped;
}

/**
 * 図の中を辿って外部参照を落とす。
 *
 * `inStateValue` = 今見ている場所が状態の値かどうか。 状態は key の名前が `initial` や
 * 状態名そのもの (phase の `sets`) になるため、 key の名前だけでは色かどうか分からない。
 * 「状態を入れる箱の中にいる」 ことを引き継いで判断する。
 */
function walk(node: unknown, path: string, inStateValue: boolean, out: StrippedPaint[]): void {
  if (node === null || typeof node !== "object") return;

  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      walk(node[i], `${path}[${i}]`, inStateValue, out);
    }
    return;
  }

  const obj = node as Record<string, unknown>;
  for (const [key, value] of Object.entries(obj)) {
    const here = path ? `${path}.${key}` : key;
    const lower = key.toLowerCase();
    // 状態を入れる箱に入ったら、 その中の値はすべて状態の値として扱う
    const nextInState = inStateValue || lower === "states" || lower === "sets" || lower === "tweens";

    if (typeof value === "string") {
      const isPaint = PAINT_KEYS.has(lower) || (nextInState && (lower === "initial" || lower === "to" || lower === "from" || !isReservedStateKey(lower)));
      if (isPaint && pointsOutside(value)) {
        obj[key] = SAFE_PAINT;
        out.push({ path: here, value });
      }
      continue;
    }
    walk(value, here, nextInState, out);
  }
}

/**
 * 状態を入れる箱の中で、 値ではなく仕組みを表す key。
 *
 * phase の `sets` は「状態名: 値」 の形なので、 key の名前を列挙して除外できない。
 * 代わりに、 状態の箱が持つ決まった名前 (`id` / `stateId` / `duration` 等) を除いた残りを
 * 値とみなす。
 */
function isReservedStateKey(lowerKey: string): boolean {
  return lowerKey === "id" || lowerKey === "stateid" || lowerKey === "duration" ||
    lowerKey === "title" || lowerKey === "body" || lowerKey === "badge" || lowerKey === "kind";
}
