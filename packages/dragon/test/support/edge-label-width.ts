/**
 * 図の幅を決めている矢印の札を求める (#2484)。
 *
 * ## なぜ札が幅を決めるか
 *
 * 描画側は縦列の間隔に下限を持つ。 各対で
 *
 * ```
 * 下限 = 札の箱の幅 + 32 × 2 + 40 × 2
 * ```
 *
 * を確保したうえで、**全対の中心間距離を最も広い対に揃える** 段が続く。
 * そのため札を 1 文字伸ばすと、その対だけでなく全部の対が広がる。
 *
 * 実測 (`flow-demo`、#2426)。
 *
 * | 矢印の札 | viewBox の幅 |
 * |---|---|
 * | 3 本とも 8 字 | 2536 |
 * | 3 本とも 4 字 | 2248 |
 * | 3 本とも 2 字 | 2104 |
 * | 1 本だけ 8 字、他 2 本は 2 字 | 2536 |
 *
 * ## 何に使うか
 *
 * 図が器に入らなくなった時、**落ちた言い方に原因を載せる** ために使う。
 * この因果を知らないまま落ちた人は、同じ調べを最初からやり直すことになる。
 *
 * **落ちる時にだけ呼ぶ**。 図を組み直すため、通る時に毎回呼ぶと検査が遅くなる。
 */
import { layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

/** 札を詰める時の字数。 実測で下限に張り付く長さ (#2426) */
const 詰めた字数 = 2;

/** 詰めた札。 字の中身は幅にしか効かないので、同じ字を並べる */
const 詰めた札 = "あ".repeat(詰めた字数);

export interface 幅の見立て {
  /** いま最も長い矢印の札 */
  最長の札: string;
  /** その図が持つ矢印の札の本数 (空の札は数えない) */
  札の本数: number;
  /** いまの viewBox の幅 */
  いまの幅: number;
  /** 全ての札を詰めて組み直した時の viewBox の幅 */
  詰めた幅: number;
}

/** 図の viewBox の幅 */
function 幅(d: CdlDiagram): number {
  const laid = layout(d) as unknown as { viewBox?: { w?: number } };
  return laid.viewBox?.w ?? 0;
}

/**
 * その図の幅を決めている札と、札を詰めた時の幅を返す。
 *
 * **矢印の札を 1 本も持たない図は `null` を返す**。 札が無い図が器に入らない理由は
 * 別にあり、ここで数を返すと原因を取り違えさせる。
 */
export function 幅を決めている札(d: CdlDiagram): 幅の見立て | null {
  const 図 = d as unknown as { edges?: { label?: string }[] };
  const 札 = (図.edges ?? []).map((e) => e.label ?? "").filter((s) => s.trim() !== "");
  if (札.length === 0) return null;

  const 最長の札 = 札.reduce((a, b) => (b.length > a.length ? b : a));

  // 元の図を書き換えない。 検査は同じ図を何度も読む
  const 詰めた図 = JSON.parse(JSON.stringify(d)) as CdlDiagram;
  const 詰めた辺 = (詰めた図 as unknown as { edges?: { label?: string }[] }).edges ?? [];
  for (const e of 詰めた辺) {
    if ((e.label ?? "").trim() !== "") e.label = 詰めた札;
  }

  return {
    最長の札,
    札の本数: 札.length,
    いまの幅: 幅(d),
    詰めた幅: 幅(詰めた図),
  };
}

/** 落ちた時の言い方に足す 1 行。 札を持たない図は理由を書いて返す */
export function 幅の理由(d: CdlDiagram): string {
  const m = 幅を決めている札(d);
  if (m === null) return `${d.id} ... 矢印の札を持たない (幅の理由は札ではない)`;
  return (
    `${d.id} ... 最も長い札 "${m.最長の札}" (${m.最長の札.length} 字、札 ${m.札の本数} 本)。` +
    ` 幅 ${m.いまの幅} → 全ての札を ${詰めた字数} 字に詰めると ${m.詰めた幅}`
  );
}

/**
 * 落ちた時に添える行をまとめて作る。
 *
 * **空の一覧では図を 1 枚も組み直さない** = 通る時に呼ばれても値を求めない。
 * 呼ぶ側で三項演算子を書くと、書き忘れた日に黙って毎回組み直す形になる。
 * 早く返す責務をここへ寄せ、`edge-label-width-2484.test.ts` が組み直しの回数で見る。
 */
export function 幅の理由をまとめる(名: string[], 図から引く: (id: string) => CdlDiagram | undefined): string {
  if (名.length === 0) return "";
  const 行 = 名
    .map(図から引く)
    .filter((d): d is CdlDiagram => d !== undefined)
    .map((d) => "  " + 幅の理由(d));
  return 行.length === 0 ? "" : "\n" + 行.join("\n");
}
