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
/**
 * 図の動きの種類。
 *
 * - `continuous` = 段の中で値が連続して動く (`tween` の始点と終点が違う)
 * - `step` = 段の切替で値が一度に変わる (`set` で値が実際に入れ替わる)
 * - `none` = 段を通しても画面に届く値が変わらない
 *
 * **書いてあるかではなく、値が実際に変わるかで決める**。 `tween(x, 50, 50)` や、
 * 初期値と同じ値を置く `set` は動かない。 数えると、止まったままの図に
 * 「段の切替で値が一度に変わる」 と書くことになる (実測 = `parts` の 6 図がこれだった)。
 */
export function motionOf(diagram: CdlDiagram): Motion {
  const owned = new Set<string>([
    ...(diagram.inputs ?? []).map((i) => i.id),
    ...(diagram.formulas ?? []).map((f) => f.id),
    ...(diagram.scrollTriggers ?? []).map((t) => t.id),
  ]);
  // 画面に出る値を段の順に組み立てる。 **描画側と同じ順で重ねる**
  // (`computeStateValues` は同じ段の中で `set` を順に適用してから `tween` が上書きし、
  // 過ぎた段の `tween` は終点で落ち着く)。 宣言された値を全て並べる形にすると、
  // 画面に一度も出ない途中の指定まで動きに数えてしまう
  const effective = new Map<string, string>();
  for (const s of diagram.states ?? []) effective.set(s.id, String(s.initial));

  // 状態ごとに、画面に出た値を段ごとに記録する。 2 種類以上あれば動いている
  const seen = new Map<string, Set<string>>();
  const record = (id: string): void => {
    const value = effective.get(id);
    if (value === undefined) return;
    const set = seen.get(id) ?? new Set<string>();
    set.add(value);
    seen.set(id, set);
  };
  for (const id of effective.keys()) record(id);

  const continuous = new Set<string>();
  for (const phase of diagram.phases ?? []) {
    for (const s of phase.sets ?? []) {
      if (owned.has(s.stateId)) continue;
      effective.set(s.stateId, String((s as { value?: unknown }).value));
    }
    for (const t of phase.tweens ?? []) {
      if (owned.has(t.stateId)) continue;
      const from = String((t as { from?: unknown }).from);
      const to = String((t as { to?: unknown }).to);
      // 始点と終点が同じ tween は段の中で動かない (`tween(x, 50, 50)`)。
      // それでも終点が持ち越した値と違えば、段の境界で一度に変わる
      if (from !== to) continuous.add(t.stateId);
      effective.set(t.stateId, to);
    }
    for (const id of effective.keys()) if (!owned.has(id)) record(id);
  }

  if (continuous.size > 0) return "continuous";
  for (const values of seen.values()) if (values.size >= 2) return "step";
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
