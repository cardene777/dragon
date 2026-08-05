import type { CdlDiagram } from "@cardenelabs/cdl";

/**
 * 図の動きの種類を、実装から導き出す (#1043)。
 *
 * 一覧の説明は人が書く自由文なので、そこに動きを書くと実装とずれる。 ずれは言い回しの
 * 列挙では止められない (実測 = 「値がゆっくり変わる」 「棒が次第に伸びる」 「じわじわ増える」
 * 「シームレスに切り替わる」 「漸次変化する」 「アニメーションしながら変わる」 の 6 つが
 * いずれも素通りした)。
 *
 * **そこで動きは書かせず、図から導く**。 導いた文は説明の後ろに並べる。 これで説明と実装が
 * 構造的にずれなくなり、説明側に動きの語が紛れ込んでも「正しい導出文の隣に余計な一文が並ぶ」
 * だけで済む (誤った主張が単独で出ることが無くなる)。
 */
export type Motion = "continuous" | "step" | "none";

/**
 * 段が触る状態のうち、**入力欄 / 計算式 / スクロールが握っていないもの** を返す。
 *
 * 握られている状態は実行時に上書きされるため、段で動かしても画面に届かない
 * (`interactive-panel.tsx` が入力欄と計算式の値を `stateOverrides` として返し、
 * `render.tsx` がそれを段の値に重ねる)。 これを除かないと、画面が動かない図に
 * 「連続して動く」 と書くことになる。
 */
function reachableStates(diagram: CdlDiagram): { tweened: Set<string>; setted: Set<string> } {
  const owned = new Set<string>([
    ...(diagram.inputs ?? []).map((i) => i.id),
    ...(diagram.formulas ?? []).map((f) => f.id),
    ...(diagram.scrollTriggers ?? []).map((t) => t.id),
  ]);
  const tweened = new Set<string>();
  const setted = new Set<string>();
  for (const phase of diagram.phases ?? []) {
    for (const t of phase.tweens ?? []) if (!owned.has(t.stateId)) tweened.add(t.stateId);
    for (const s of phase.sets ?? []) if (!owned.has(s.stateId)) setted.add(s.stateId);
  }
  return { tweened, setted };
}

/**
 * 図の動きの種類。
 *
 * - `continuous` = 段の中で値が連続して動く (`tween` を持つ)
 * - `step` = 段の切替で値が一度に変わる (`set` だけ)
 * - `none` = 段が画面に届く値を触らない
 */
export function motionOf(diagram: CdlDiagram): Motion {
  const { tweened, setted } = reachableStates(diagram);
  if (tweened.size > 0) return "continuous";
  if (setted.size > 0) return "step";
  return "none";
}

/** 動きの種類を表す 1 文。 動かない図には付けない。 */
export function motionNote(diagram: CdlDiagram): string | undefined {
  switch (motionOf(diagram)) {
    case "continuous": return "段の中で値が連続して動く";
    case "step": return "段の切替で値が一度に変わる";
    case "none": return undefined;
  }
}
