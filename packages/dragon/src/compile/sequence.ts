import { sequence, sequenceStepId } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import type { DslDocument } from "../types";

import { 箱の題 } from "./node-title";

import { slugify } from "./slug";

export function compileSequence(doc: DslDocument): CdlDiagram {
  // v0.3 ... アニメーション 有無で経路を分岐。
  // 有り = builder 直接経路で state / 複数 phase を注入。
  /*
   * **段があっても組み立て器へ渡す** (#1466)。
   *
   * 順序図は 1 つの箱が図を丸ごと描く形になり、言づては箱の中の行になった。 段ごとに
   * 別経路で箱と縦線を組む形 (`compileSequenceWithAnimate`) では、その骨格が出ない。
   */
  const seqBuilder = sequence({
    id: slugify(doc.title),
    topic: doc.title,
    /*
     * 見出しに出すのは **書いた題** (#1466)。 名前は矢印の端として指すためのもので、
     * `title:` を書いたらそちらを出す (`箱の題`)。 板でも他の図種と同じ規約にする。
     */
    actors: doc.actors.map((a) =>
      a.subtitle ? { name: 箱の題(a), subtitle: a.subtitle } : 箱の題(a),
    ),
    ...(doc.bands && doc.bands.length > 0 ? { bands: doc.bands } : {}),
  });
  for (const s of doc.flow) {
    seqBuilder.step({
      from: s.from,
      to: s.to,
      label: s.label,
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.side ? { side: s.side } : {}),
      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
      ...(s.msgKind ? { kind: s.msgKind } : {}),
    });
  }
  const built = seqBuilder.build();
  const 段 = doc.animate?.phases ?? [];
  if (段.length === 0) return built;
  /*
   * 書いた段を「今どの言づてか」 に読み替える (#1466)。
   *
   * 記法は段ごとに光らせる矢印を並べる (`focus: [A -> B, ...]`) が、言づては矢印ではなく
   * 箱の中の行になった = 光らせる先が無い。 代わりに **その段までに出た言づての番号** を
   * 状態へ書き、箱がそこまでを描く。
   */
  const 番号 = new Map<string, number>();
  doc.flow.forEach((f, i) => 番号.set(`${slugify(f.from)} -> ${slugify(f.to)}`, i));
  const 状態名 = sequenceStepId();
  return {
    ...built,
    states: [...built.states, { id: 状態名, initial: "0" }],
    phases: 段.map((p, i) => {
      const 番 = Math.max(
        0,
        ...(p.highlight ?? []).map(
          (f) =>
            番号.get(
              f
                .split("->")
                .map((x) => slugify(x.trim()))
                .join(" -> "),
            ) ?? -1,
        ),
      );
      return {
        id: `p${i}`,
        duration: p.durationMs,
        title: p.name,
        body: p.body ?? "",
        activate: [slugify(doc.title)],
        ...(p.badge ? { badge: p.badge } : {}),
        /*
         * **書いた状態の動きも一緒に運ぶ** (#1466)。 板の段は「今どの言づてか」 を状態に
         * 書くが、記法は同じ段に `遷移:` / `切替:` も書ける。 板の分だけを載せると、
         * 書いた動きが黙って落ちる (実測で `tweens` が 0 件になっていた)。
         */
        sets: [
          ...(p.sets ?? []).map((x) => ({ stateId: x.state, value: x.value })),
          { stateId: 状態名, value: 番 },
        ],
        tweens: (p.tweens ?? []).map((t) => ({ stateId: t.state, from: t.from, to: t.to })),
      };
    }),
  };
}
