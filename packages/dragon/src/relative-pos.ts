/**
 * 位置を他の要素からの相対で書くための解決。
 *
 * `位置: Web の右 200` のように、 座標の代わりに「誰の」「どちら側に」「どれだけ離して」 を書く。
 * 書く人も LLM も座標を知らないので、 数値を当てさせない形を用意する。
 *
 * 解決結果は絶対座標 (`posX` / `posY`) で、 座標を直接書いた時と同じ経路を通る。
 * 書き方が増えるだけで、 効き方は変わらない。
 *
 * 座標を決める場所が組み立て側 (`compile.ts`) と画面側 (playground の `overlay-dsl.ts`) の
 * 2 つあるため、 解決の規則は本 file に 1 つだけ置いて両方から呼ぶ。 片方だけ直すと画面が
 * 直らない事故を、 規則を共有することで構造的に防ぐ。
 */

/** 基準からどちら側に置くか。 */
export type RelativeDirection = "right" | "left" | "above" | "below";

/** 相対で書かれた位置の指定。 */
export type RelativePos = {
  /** 基準にする相手の名前。 `actors:` に書かれた名前をそのまま持つ。 */
  anchor: string;
  dir: RelativeDirection;
  /** 相手との間隔。 書かなかった時は `RELATIVE_GAP_DEFAULT`。 */
  gap?: number;
};

/** 位置を決めるのに必要な、 基準の中心と大きさ。 */
export type AnchorBox = { cx: number; cy: number; w: number; h: number };

/**
 * 間隔を書かなかった時の既定値。
 *
 * 8 図種 × 4 向きで間隔を変えながら、 cdl が出す近すぎ系の指摘の数を数えて決めた。
 * 100 で 17 件、 130 で 10 件、 140 で 4 件と減り、 160 で 2 件に落ちて以降は変わらない。
 * 残る 2 件は間隔と無関係な指摘なので、 減らなくなる 160 を既定にする。
 *
 * 自動配置が空ける隙間も実測では縦 100 / 横 256-406 で、 160 はその間に収まる。
 * 隣に置いたと読める近さと、 詰まって見えない広さの両方を満たす。
 */
export const RELATIVE_GAP_DEFAULT = 160;

/**
 * 書かれた向きの語。 日本語と英語の両方を受け付ける。
 *
 * 項目名が日本語でも英語でもよい (`種類` / `kind`) のと揃える。
 */
const DIRECTION_WORDS: Readonly<Record<string, RelativeDirection>> = {
  右: "right",
  左: "left",
  上: "above",
  下: "below",
  right: "right",
  left: "left",
  above: "above",
  below: "below",
};

/**
 * 日本語の形。 `Web の右` / `Web の右 200` / `Web の右200`。
 *
 * 相手の名前は控えめ (`.+?`) に取る。 名前自体が `の右` で終わる場合 (`Aの右 の左`) でも、
 * 後戻りして末尾の向きを先に確定するため取り違えない。
 */
const RE_JA = /^(.+?)\s*の\s*(右|左|上|下)(?:\s*(-?\d+(?:\.\d+)?))?$/;

/** 英語の形。 `Web right` / `Web right 200`。 向きの前後は空白で区切る。 */
const RE_EN = /^(.+?)\s+(right|left|above|below)(?:\s+(-?\d+(?:\.\d+)?))?$/i;

/**
 * `位置:` に書かれた値を相対指定として読む。 相対の形でなければ null。
 *
 * 座標の形 (`300,200`) は呼ぶ側が先に判定する。 ここは相対だけを見る。
 */
export function parseRelativePos(raw: string): RelativePos | null {
  const s = raw.trim();
  if (s === "") return null;
  const m = s.match(RE_JA) ?? s.match(RE_EN);
  if (!m) return null;
  const anchor = m[1]!.trim();
  if (anchor === "") return null;
  const dir = DIRECTION_WORDS[m[2]!.toLowerCase()];
  if (dir === undefined) return null;
  const gapRaw = m[3];
  if (gapRaw === undefined) return { anchor, dir };
  const gap = Number(gapRaw);
  // 数として読めない間隔は書かなかった扱いにする。 既定の間隔で置く方が、
  // 図から消えるより書いた人が気付きやすい。
  return Number.isFinite(gap) ? { anchor, dir, gap } : { anchor, dir };
}

/**
 * 相対指定を絶対座標に直す。
 *
 * `posX` / `posY` は箱の中心。 間隔は箱の縁と縁の間の距離として扱う。 中心間の距離にすると、
 * 大きさの違う箱を並べた時に見た目の隙間が揃わない。
 */
export function resolveRelativePos(
  rel: RelativePos,
  anchor: AnchorBox,
  target: { w: number; h: number },
): { posX: number; posY: number } {
  const gap = rel.gap ?? RELATIVE_GAP_DEFAULT;
  const dx = anchor.w / 2 + gap + target.w / 2;
  const dy = anchor.h / 2 + gap + target.h / 2;
  switch (rel.dir) {
    case "right":
      return { posX: anchor.cx + dx, posY: anchor.cy };
    case "left":
      return { posX: anchor.cx - dx, posY: anchor.cy };
    case "below":
      return { posX: anchor.cx, posY: anchor.cy + dy };
    case "above":
      return { posX: anchor.cx, posY: anchor.cy - dy };
  }
}

/**
 * 相対指定を解く順番を決める。
 *
 * 基準にした相手がまた相対で書かれていることがある (`B は A の右`、 `C は B の右`)。
 * 先に相手が決まっていないと座標を出せないので、 依存の浅い順に並べ替える。
 *
 * 輪になっている分 (`A は B の右`、 `B は A の右`) は解けないため、 順番からは外して
 * 名前だけを返す。 呼ぶ側が誤りとして扱う。
 */
export function orderByDependency(
  items: ReadonlyArray<{ name: string; rel?: RelativePos }>,
): { order: string[]; cyclic: string[] } {
  const relOf = new Map<string, RelativePos>();
  const known = new Set<string>();
  for (const it of items) {
    known.add(it.name);
    if (it.rel) relOf.set(it.name, it.rel);
  }
  const order: string[] = [];
  const done = new Set<string>();
  const cyclic = new Set<string>();

  // 再帰にすると基準の連鎖の長さだけ stack を積む。 連鎖の長さは書く人が決めるので
  // 上限を置けない。 明示的な配列で辿る。
  for (const it of items) {
    if (done.has(it.name) || cyclic.has(it.name)) continue;
    // path は [自分, 基準, 基準の基準, ...] の順に伸びる
    const path: string[] = [];
    const onPath = new Set<string>();
    let cur: string | undefined = it.name;
    while (cur !== undefined) {
      if (done.has(cur) || cyclic.has(cur)) break;
      if (onPath.has(cur)) {
        // 輪を見つけた。 輪に含まれる分だけを外す。 輪に入る手前の分は解けるので残す
        for (const n of path.slice(path.indexOf(cur))) cyclic.add(n);
        break;
      }
      path.push(cur);
      onPath.add(cur);
      const rel = relOf.get(cur);
      // 相対で書かれていない、 または相手が居ない = ここで辿り終わり
      if (rel === undefined || !known.has(rel.anchor)) break;
      cur = rel.anchor;
    }
    // 奥 (基準側) から順に並べる。 基準が先に決まっていないと座標を出せない
    for (let i = path.length - 1; i >= 0; i -= 1) {
      const n = path[i]!;
      if (cyclic.has(n) || done.has(n)) continue;
      done.add(n);
      order.push(n);
    }
  }
  return { order, cyclic: [...cyclic] };
}
