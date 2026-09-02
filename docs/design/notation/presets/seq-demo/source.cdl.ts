const STEP_DURATION = 900;

/**
 * 組み上がった図に段を組み直す (#1194)。
 *
 * preset の builder は `.phase()` を持たない (`swimlane` だけが `DiagramBuilder` を返す) ため、
 * 段は `build()` の後に足す。 preset が自動で作る段は 1 つだけで、全要素を光らせて終わるので、
 * そのままでは開いても静止画と区別が付かない。
 *
 * 題と説明を省いた段は、preset が自動で作った段のものを引き継ぐ。 図の型そのものの説明は
 * 最後の段に残したいので、最後の段で省くのが既定の使い方になる。
 */
function withSteps(
  d: CdlDiagram,
  steps: readonly Step[],
  states: readonly State[] = [],
): CdlDiagram {
  const auto = d.phases[0];
  const lit: string[] = [];
  const phases: Phase[] = steps.map((s, i) => {
    for (const id of s.ids ?? []) if (!lit.includes(id)) lit.push(id);
    return {
      id: `p${i + 1}`,
      duration: s.duration ?? STEP_DURATION,
      title: s.title ?? auto?.title ?? "",
      body: s.body ?? auto?.body ?? "",
      activate: [...lit],
      // 空なら欄ごと置かない (#1351)。 置くと `draw` を使わない見本の JSON の形が変わる =
      // 描画側の `builder.ts` も同じ扱いをしている
      ...((s.draw ?? []).length > 0 ? { draw: [...(s.draw ?? [])] } : {}),
      tweens: (s.tweens ?? []).map((t) => ({ stateId: t.id, from: t.from, to: t.to })),
      sets: (s.sets ?? []).map((v) => ({ stateId: v.id, value: v.value })),
      badge: auto?.badge,
    };
  });
  return { ...d, states: [...(d.states ?? []), ...states], phases };
}

// sequence preset ... 時系列のやり取り (設計「箱と行と関係」 の意匠)
//
// **ここだけ骨格が違う**。 他の 3 図は「箱 + 行 + 関係」 だが、こちらは縦が時間で箱を持たない。
// 言づてを行にして、語を左の桁に縦に並べる。 参加者の糸は残す = x の位置が「誰」 で、
// 縦の連なりが「その参加者を時間で追う」 手段になる。
//
// 教科書の縦形 (箱 + 寿命線 + 線の上の札) は 3 版まで詰めて却下されている。 骨格の選び方の
// 問題ではなく、時間を位置に畳んでいたのが原因だった。
//
// **段が進むと濃さが移る**。 済んだ言づては薄く残り、今の 1 本だけが濃い。 全部同じ濃さで
// 残すと、どこを見ているのか判らなくなる。
export const presetSequence = withSteps(
  sequence({
    id: "seq-demo",
    topic: "時系列のやり取りを縦の時間軸で並べる図",
    actors: [
      { name: "Browser", subtitle: "画面" },
      { name: "API", subtitle: "受付" },
      { name: "DB", subtitle: "台帳" },
      { name: "Queue", subtitle: "待ち行列" },
    ],
    // 動いている間の帯。 台帳は途中で手が空くので区間が 2 つに分かれる
    bands: [
      { actor: "Browser", from: 0, to: 5 },
      { actor: "API", from: 0, to: 5 },
      { actor: "DB", from: 1, to: 2 },
      { actor: "DB", from: 6, to: 6 },
      { actor: "Queue", from: 4, to: 6 },
    ],
  })
    // 呼ぶ = 相手にやらせて待つ (実線 + 塗った矢)
    .step({ from: "Browser", to: "API", label: "注文を出す", kind: "call" })
    .step({ from: "API", to: "DB", label: "在庫を押さえる", kind: "call" })
    // 返す = 呼ばれた側から戻る。 新しい仕事ではないので線が切れる
    .step({ from: "DB", to: "API", label: "押さえた", kind: "return" })
    // 自分宛て。 控えを書くだけで相手がいない
    .step({ from: "API", to: "API", label: "控えを書く", kind: "call" })
    // 投げる = 返事を待たない。 実線だが矢を閉じない
    .step({ from: "API", to: "Queue", label: "発送を頼む", kind: "fire" })
    .step({ from: "API", to: "Browser", label: "受け付けた", kind: "return" })
    .step({ from: "Queue", to: "DB", label: "引当を確定", kind: "call" })
    .build(),
  [
    {
      ids: ["seq-demo"],
      title: "1. 注文を出す",
      body: "実線に塗った矢。 相手にやらせて待つ。 左の点が出どころ。",
      sets: [{ id: "seq_step", value: 0 }],
    },
    {
      title: "2. 在庫を押さえる",
      body: "受付が台帳に問い合わせる。 動いている間だけ帯が伸びる。",
      sets: [{ id: "seq_step", value: 1 }],
    },
    {
      title: "3. 押さえた",
      body: "破線に開いた矢。 新しい仕事ではないので線が切れる。",
      sets: [{ id: "seq_step", value: 2 }],
    },
    {
      title: "4. 控えを書く",
      body: "自分宛ての言づて。 相手がいない仕事。",
      sets: [{ id: "seq_step", value: 3 }],
    },
    {
      title: "5. 発送を頼む",
      body: "実線に開いた矢。 矢を閉じないことで返事を待たないと示す。",
      sets: [{ id: "seq_step", value: 4 }],
    },
    {
      title: "6. 受け付けた",
      body: "待ち行列の返事を待たずに画面へ返す。",
      sets: [{ id: "seq_step", value: 5 }],
    },
    {
      body: "台帳は途中で手が空く。 帯が途切れることでそれと判る。",
      sets: [{ id: "seq_step", value: 6 }],
    },
  ],
  [{ id: "seq_step", initial: "0" }],
);
