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

/**
 * 基準からどちら側に置くか。
 *
 * 語の一覧は下の `RELATIVE_DIRECTIONS` が持つ。 型を並べ直さず、一覧から導く。
 */
export type RelativeDirection = (typeof RELATIVE_DIRECTIONS)[number];

/**
 * 向きとして受ける語の一覧。
 *
 * 読み取りの入口が 2 つある (本文の `位置: Web の右 200` と JSON の `posRel.dir`) ため、
 * 一覧を 1 箇所に置いて両方から引く。 2 度書くと、向きを足した時に片方だけが取り残される。
 */
export const RELATIVE_DIRECTIONS = ["right", "left", "above", "below"] as const;

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
 * 間隔として受け付ける数の形。
 *
 * 負の数は含めない (向きが裏返るため)。 小数と指数表記は受け付ける。 整数だけに絞ると、
 * 有効な数を書いたのに「書き方が読めません」 と返す (実測 = `1e2` / `.5` が弾かれた)。
 */
const GAP_NUM = String.raw`(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?`;

/**
 * 日本語の形。 `Web の右` / `Web の右 200` / `Web の右200`。
 *
 * 相手の名前は控えめ (`.+?`) に取る。 名前自体が `の右` で終わる場合 (`Aの右 の左`) でも、
 * 後戻りして末尾の向きを先に確定するため取り違えない。
 */
const RE_JA = new RegExp(String.raw`^(.+?)\s*の\s*(右|左|上|下)(?:\s*(${GAP_NUM}))?$`);

/** 英語の形。 `Web right` / `Web right 200`。 向きの前後は空白で区切る。 */
const RE_EN = new RegExp(String.raw`^(.+?)\s+(right|left|above|below)(?:\s+(${GAP_NUM}))?$`, "i");

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
  // 負の間隔は向きを裏返す。 `Web の右 -1000` が Web の左に置かれ、 確かめる側も同じ値で
  // 期待を作るので矛盾に気付けない (実測 = 右と書いて左に出た)。 間隔は 0 以上として扱う。
  // 記法から来る値は parser が弾くが、 本関数は公開しているので入口で閉じる
  const raw = rel.gap ?? RELATIVE_GAP_DEFAULT;
  const gap = Number.isFinite(raw) && raw >= 0 ? raw : RELATIVE_GAP_DEFAULT;
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

/** 解けない書き方の種類。 誤りの文は入口ごとに作るので、ここでは種類だけを返す */
export type RelativeProblemKind = "self" | "missing-anchor" | "cyclic";

/** 解けない書き方 1 件。 `anchor` は相手が居ない時だけ持つ */
export type RelativeProblem = {
  name: string;
  kind: RelativeProblemKind;
  anchor?: string;
};

/**
 * 解けない相対の指定を挙げる (#2039)。
 *
 * 解けない書き方は 3 通りある。 相手が居ない / 自分を基準にした / 基準が輪になっている。
 * どれも「書いたのに図が変わらない」 形で表に出るため、図を出す前に知らせる。
 *
 * **判定は本 file に 1 つだけ置く**。 読み取りの入口が 2 つある (本文と JSON) ため、
 * 片方だけに判定を持つと、同じ書き方が入口によって通ったり通らなかったりする。
 * 実際 JSON 側には判定が無く、相対で置く欄そのものが無かった。
 *
 * 誤りの文は返さない。 本文側は行番号を、JSON 側は欄の場所を添えるため、文の組み立ては
 * 入口に任せる。 ここが返すのは「誰の」「どの種類の」 解けなさか だけ。
 *
 * 呼ぶ側は、挙がった名前から相対の指定を外す。 残したままだと、誤りを無視して読み込んだ
 * 経路で解決できない指定が組み立てまで届く。
 */
export function findRelativeProblems(
  items: ReadonlyArray<{ name: string; rel?: RelativePos }>,
): RelativeProblem[] {
  const named = new Set(items.map((i) => i.name));
  const broken = new Set<string>();
  const out: RelativeProblem[] = [];

  for (const it of items) {
    const rel = it.rel;
    if (!rel) continue;
    if (rel.anchor === it.name) {
      out.push({ name: it.name, kind: "self" });
      broken.add(it.name);
      continue;
    }
    if (!named.has(rel.anchor)) {
      out.push({ name: it.name, kind: "missing-anchor", anchor: rel.anchor });
      broken.add(it.name);
    }
  }

  // 輪は、既に解けないと判った分を外してから探す。 外さないと「相手が居ない」 1 件が
  // 「輪になっている」 としても挙がり、同じ 1 つの誤りが 2 通りの直し方で出る
  const { cyclic } = orderByDependency(
    items.map((i) => ({ name: i.name, rel: broken.has(i.name) ? undefined : i.rel })),
  );
  for (const name of cyclic) out.push({ name, kind: "cyclic" });

  return out;
}
