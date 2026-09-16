import type { DslDocument } from "../types";

/**
 * 図表の欄を読む小道具 (#2030 で `compile.ts` から移した)。
 *
 * 値の図 (`pie` / `bar` / `line` ほか 6 種) ・ 漏斗 ・ 道のり ・ 四象限 の 4 系統が使う。
 * 数と語の読み方を 1 箇所に置くのは、図種ごとに別の読み方をすると同じ本文が図種で
 * 別の値に化けるため。
 *
 * **葉に置く** = ここが `compile.ts` を取り込まないので、どちらから呼んでも輪にならない。
 */

/**
 * 割合の書き方から数値を読む。 読めなければ `null`。
 *
 * 受けるのは `"45%"` / `"45"` / `"45.5%"` と、 前後の空白。 `"四割"` や `"0.45"` のような
 * 別の言い方は読まない = **黙って 0 にすると、 その分だけ欠けた円が「正しい図」 として出る**。
 * 読めなかったことは呼出側が警告に出す。
 */
export function parseShareValue(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const m = raw.trim().match(/^(-?\d+(?:\.\d+)?)\s*%?$/);
  if (m === null) return null;
  const v = Number(m[1]);
  return Number.isFinite(v) ? v : null;
}

/**
 * 状態を読む欄かどうか (`{名前}`)。
 *
 * **`{名前}` そのものだけを受ける**。 `{v} 件` のような混ざった形は、描画側が数として
 * 読めず既定値に落ちて印が付くだけになる (`render/payload-binding.ts` は解いた文字列を
 * そのまま数にする)。 書けたのに効かない形を作らない。
 *
 * `%` を付けた形も受けない。 同じ理由で `"45%"` は数に直せるが `"{v}%"` は直せない。
 *
 * 名前に使えるのは英数字と `_` で、読む側 (cdl の `interpolate`) と同じ範囲に合わせる。
 * 決まった accessor (`.sum` 等) は付けてよい。
 */
export function parseBoundValue(raw: string | undefined): string | null {
  if (raw === undefined) return null;
  const t = raw.trim();
  return /^\{\w+(?:\.(?:length|sum|max|min|avg)|\[\d+\])?\}$/.test(t) ? t : null;
}

/**
 * 図表の数の欄を読む。 数そのものか、状態を読む `{名前}` を返す。
 *
 * 数として解けない `{名前}` は、そのまま図表の中身に渡して描画側が段ごとに解く。
 * 受け取る側の型 (`BoundNumber`) は元から 2 通りを想定している = 入口だけが塞がっていた。
 */
export function parseChartValue(raw: string | undefined): number | string | null {
  const n = parseShareValue(raw);
  if (n !== null) return n;
  return parseBoundValue(raw);
}

/** 状態を読む欄が指している名前 (`{v.sum}` なら `v`)。 欄でなければ null */
export function 参照する名前(value: number | string | null): string | null {
  if (typeof value !== "string") return null;
  const m = value.match(/^\{(\w+)/);
  return m ? m[1]! : null;
}

/**
 * 図表の箱の大きさ (#1260)。
 *
 * **組立て API と同じ値を使う**。 別の値にすると、同じ内容を書いても描いた図の大きさが変わる
 * (実測 = 記法の `funnel` は 640x368、組立て API は 560x480 で、描いた図の viewBox が
 * 785x488 対 712x600 になっていた)。
 *
 * 組立て API 側は中身の件数で変えない (実測 = 2 / 4 / 8 件のどれでも同じ値)。 そのため
 * こちらも定数で持つ。 `gantt` だけは件数で高さを変える = 8 件目から最後の帯が枠の外に
 * 出るため (`compileGantt` の実測)、組立て API の固定 360 より正しい。
 */
export const 図表の大きさ = {
  funnel: { w: 560, h: 480 },
  tree: { w: 720, h: 480 },
  mind: { w: 720, h: 480 },
  journey: { w: 720, h: 480 },
  quadrant: { w: 640, h: 480 },
} as const;

/**
 * 図表の欄が `{名前}` で読む値を、**1 か所で** 確かめる (#1200)。
 *
 * 図表には数の欄 (割合 / 段の人数) と語の欄 (気持ち / 区画) があり、どちらも `{名前}` で
 * 状態を読める。 確かめることは欄の種類で違うが、**土台は同じ** = 同じ名前を 2 回書いた時に
 * 後ろが効くこと、段で状態に入る値 (切り替え / 補間) も見ること、の 2 つ。
 *
 * #1198 と #1201 では欄ごとに検査を書き足しており、同じ土台を 3 度書いていた。 3 度とも
 * review で同じ形の穴を指摘されている (最初の宣言で判定する / 段で入る値を見落とす)。
 * 土台を 1 つにして、欄ごとの違いだけを外から渡す。
 *
 * ## 確かめること
 *
 * | 欄 | 通す値 | 段で入る値 |
 * |---|---|---|
 * | 数 | 数として読める (空文字は弾く、`Number("")` が 0 を返すため) | 切り替え先が数 |
 * | 語 | 語表にある語 | 切り替え先が語表にあり、補間されない (補間の行き先は数) |
 *
 * 自動で決まる値 (`values:`) は式の評価結果で必ず数になるため、数の欄からは参照できて
 * 語の欄からは参照できない。 式そのものの不備 (語を読む / 名前が無い) は
 * `value-unresolved` の警告が別に出る (実測で確認済)。
 *
 * ## 責務境界 (#1198 / #1200)
 *
 * **見るのは組み立ての時点で決まっている範囲だけ**。 記法の値は実行時に決まるため、ここで
 * 全部を判定しようとすると式の評価を組み立て側で再現することになる。 実際に #1199 の review で
 * 4 round 続けて同じ形の指摘が出て収束せず、境界を決めて切り分けた (穴を 1 つ塞ぐと別の形が
 * 出る = 塞ぎ方ではなく責務の置き場所の問題だった)。
 *
 * | 見る | 見ない | 見ない理由 |
 * |---|---|---|
 * | 名前が宣言されているか | 段の行き先が負になる形 | 描画側が問題なく描く (負の大きさも `NaN` も出ないことを実測) |
 * | 宣言の時点で読める値か | 式が実行時に返す値 | 式の不備は `value-unresolved` の警告が別に出る (実測で確認) |
 * | 段で状態に入る値 | | |
 *
 * 見ない範囲は描画側が受け持つ = 解けない値は既定値で描いて `data-cdl-unresolved` を付ける。
 */
export function 図表の欄から参照できる名前(
  doc: DslDocument,
  欄: {
    読めるか: (v: number | string) => boolean;
    補間で壊れるか: boolean;
    自動の値を許すか: boolean;
  },
): Set<string> {
  // 同じ名前を 2 回宣言した時は後ろが効く。 描画側が後の宣言を有効値として扱うため、
  // 前の宣言で判定すると「読めると判定したのに読めない値が入る」 状態になる (実測)
  const 実効 = new Map<string, number | string>();
  for (const s of doc.animate?.states ?? []) 実効.set(s.name, s.initial);

  const 壊れる = new Set<string>();
  for (const p of doc.animate?.phases ?? []) {
    for (const st of p.sets ?? []) if (!欄.読めるか(st.value)) 壊れる.add(st.state);
    if (欄.補間で壊れるか) for (const tw of p.tweens ?? []) 壊れる.add(tw.state);
  }

  const out = new Set<string>();
  for (const [名前, 値] of 実効) {
    if (!欄.読めるか(値)) continue;
    if (壊れる.has(名前)) continue;
    out.add(名前);
  }
  if (欄.自動の値を許すか) for (const v of doc.values ?? []) out.add(v.name);
  return out;
}

/** 数の欄が読める値か。 空文字と空白だけは弾く (`Number("")` は 0 を返す) */
export function 数として読めるか(v: number | string): boolean {
  if (typeof v === "number") return Number.isFinite(v);
  const t = v.trim();
  if (t === "") return false;
  return Number.isFinite(Number(t));
}

export function 数の欄から参照できる名前(doc: DslDocument): Set<string> {
  return 図表の欄から参照できる名前(doc, {
    読めるか: 数として読めるか,
    // 補間の行き先は数なので、数の欄では壊れない
    補間で壊れるか: false,
    自動の値を許すか: true,
  });
}

export function 語の欄から参照できる名前(doc: DslDocument, 語表: Map<string, string>): Set<string> {
  return 図表の欄から参照できる名前(doc, {
    読めるか: (v) => 語表.has(String(v).trim()),
    // 補間の行き先は数。 語の欄が読む状態を補間すると、その段で語が数に変わる
    補間で壊れるか: true,
    // 式の評価結果は数になるため、語の欄からは読めない
    自動の値を許すか: false,
  });
}
