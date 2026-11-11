/**
 * 考えを広げる地図 (`mind`、#3619) の見た目の値。
 *
 * ほかの値と同じく値の表の層 (`look/`) に置き、描く file は字の大きさと線の太さをここと `values.ts` から読む。
 * 考えを広げる地図の並べ方と描き方 (`kinds/mind/layout.ts` と `render/mind.ts`) は後から読む塊にあるので、
 * 回り続ける図と同じく `values.ts` の `LOOK` と `TYPE` に入れず、考えを広げる地図を描かない頁が最初に読む script にこの値を持たせない。
 * 見た目の元は step 2 で本人が選んだ動く試作の案A (真ん中の題から枝を四方へ曲線で伸ばし、段ごとに枝と葉が濃くなる)。
 */
import type { ColorKey, TextStyle } from "./values";

const text = (size: number, weight: number): TextStyle => ({ size, weight, family: "sans" });

/** 考えの名前の字。真ん中の題 (`centre`) を一番大きく太く、枝 (`branch`) を太く、葉 (`leaf`) を小さく書き、段の深さを字の大きさで読ませる */
export const MIND_TYPE = {
  centre: text(17, 700),
  branch: text(14, 700),
  leaf: text(12.5, 500),
} as const;

/** 考えの段。真ん中の題が 0、枝が 1、葉が 2 */
export type MindLevel = 0 | 1 | 2;

/**
 * 図の外周の余白 `pad`。
 * `node` は段ごとの考えの枠で、高さ `h` と、名前の左右に空ける幅の和 `pad`。枠は高さの半分の丸みを持つ丸い札にする。
 * `gap` は並べる間で、題の縁から枝の縁まで `trunk`、枝の縁から葉の縁まで `twig`、同じ枝の葉どうし `leaf`、上下に並ぶ枝の塊どうし `branch`。
 * `fan` は 1 つの考えの縁から出る線どうしの、線の出る所の間。同じ所から出ると線が重なって走り、どの線がどの考えへ向かうか読めない。
 * `baseline` は名前の字の基準線を、枠の高さの真ん中から字の大きさの何割下げるか。
 * `badge` は段の番号の丸で、考えの枠の上の縁と丸の縁の間 `above`。
 * `faint` は書いた段より前の考えと線の濃さで、試作と同じく初めから薄く見せ、書いた段で濃くする。
 * `cut` は書いた段の始まりに薄い線を消して引き直すまでの秒。薄い線のまま縮めて見せないよう、ほぼ一瞬で替える。
 * `samples` は曲線の線を崩れの確かめに渡す時に区切る点の数。
 * `centre` は色を書かない真ん中の題の色、`branches` は色を書かない枝に書いた順に配る色
 */
export const MIND_LOOK = {
  pad: 24,
  node: {
    centre: { h: 48, pad: 40 },
    branch: { h: 36, pad: 30 },
    leaf: { h: 28, pad: 24 },
  },
  gap: { trunk: 60, twig: 44, leaf: 14, branch: 36 },
  fan: 6,
  baseline: 0.34,
  badge: { above: 4 },
  faint: 0.15,
  cut: 0.01,
  samples: 16,
  centre: "violet",
  branches: ["blue", "green", "amber", "rose"],
  /**
   * `stroke` は線の太さで、題から枝への線 `trunk`、枝から葉への線 `twig`、題と枝の枠 `ring`、葉の枠 `leaf`、書いた段の間に重ねる太い枠 `now`
   */
  stroke: { trunk: 2.6, twig: 1.9, ring: 1.6, leaf: 1.3, now: 2.8 },
} as const satisfies {
  centre: ColorKey;
  branches: readonly ColorKey[];
  [key: string]: unknown;
};
