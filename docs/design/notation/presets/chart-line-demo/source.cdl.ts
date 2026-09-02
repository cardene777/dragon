const STEP_DURATION = 900;

/**
 * 起点から描く段の長さ (ミリ秒、#1357)。
 *
 * 既定の 0.9 秒では、線が伸びる / 扇が開く様子を追う前に描き終わる。 見本ごとに違う値を
 * 置ける (`Step` の `duration`) が、同じページの中で速さがばらつくと比べにくいので
 * **描く段は 1 つの値に揃える**。
 *
 * ## 描く段の後ろの段にも同じ値を置く (#1440)
 *
 * `描き直す` (`redraw-mode.ts`) を選ぶと、1 段目の `draw` が 2 段目以降へ写されてその段でも
 * 起点から描かれる。 ところが **伸び具合は段の進みそのもの** で決まる = 描画側
 * (`@cardenelabs/cdl`) は段の進み 0→1 を `strokeDashoffset` に直接使い、段の長さと別の
 * 「描く時間」 を持たない。
 *
 * 2 段目を既定の 0.9 秒のままにすると、同じ絵が 2.4 秒かけて描かれた後 0.9 秒で描き直される
 * = 約 2.7 倍速い。 1 段目が作った期待を裏切り、「別のデータで描き直した」 という
 * `描き直す` の意図が伝わらない。
 *
 * そのため **描く見本は 2 段目にも同じ値を置く**。 対象は `draw` を持つ 7 見本すべてで、
 * 1 つだけ直すと同じページの中で間がばらつく。
 *
 * 代償は既定の「動かすだけ」 側でも 2 段目が 0.9 秒から伸びること。 描く速さを段の長さと
 * 別に指定できれば代償なしで直せるが、それは描画側の作りを変える話になる。
 */
const DRAW_DURATION = 2400;

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

/**
 * 図表の箱の中身に状態を通す (#1194)。
 *
 * 図表の中身 (`chartData` / `funnelData` / `ganttData` / `quadrantData` / `journeyData`) は
 * `{名前}` を受ける型で宣言されている一方、preset の入口 (`.datum({ value })` 等) は数と語しか
 * 受けない。 そこで組み上がった図の中身を書き換える。 読む側は cdl の
 * `render/payload-binding.ts` が `{名前}` を解いてから数と語として扱う。
 *
 * 図表の preset はいずれも箱を 1 つだけ作り、そこに配列を丸ごと載せる。 対象が先頭の箱に
 * 限られるのはそのため。
 */
function bindFirstNode(d: CdlDiagram, patch: (n: Node) => Node): CdlDiagram {
  return { ...d, nodes: d.nodes.map((n, i) => (i === 0 ? patch(n) : n)) };
}

// chart preset (line) ... 時系列
// 折れ線の高さを状態から取り、計画と実績を同じ図で見る。
const LINE_POINTS = [
  { id: "line_jan", label: "Jan", plan: 1000, actual: 900 },
  { id: "line_feb", label: "Feb", plan: 1300, actual: 1400 },
  { id: "line_mar", label: "Mar", plan: 1100, actual: 1250 },
  { id: "line_apr", label: "Apr", plan: 1600, actual: 1750 },
] as const;

const lineBuilder = chart({
  id: "chart-line-demo",
  topic: "時系列データの推移を線で示す折れ線グラフ",
  type: "line",
});

export const presetChartLine = withSteps(
  bindFirstNode(lineBuilder.build(), (n) => ({
    ...n,
    // `chartData` は `LINE_POINTS` を回す `for` で 1:1 に作るので長さは常に一致する
    chartData: n.chartData?.map((c, i) => {
      const p = LINE_POINTS[i];
      return p === undefined ? c : { ...c, value: `{${p.id}}` };
    }),
  })),
  [
    {
      ids: ["chart-line-demo-chart"],
      // 左端から右へ線が伸びる (#1351)。 開いた瞬間に全長で出ると静止画と区別が付かない
      draw: ["chart-line-demo-chart"],
      // 描く段は伸ばす (#1353)。 既定の 0.9 秒では引かれる様子を追う前に引き終わる
      duration: DRAW_DURATION,
      title: "計画",
      body: "四半期ごとの見込みを引いた線。 左から順に引かれる。",
    },
    {
      body: "実績に置き換えると 2 月以降が計画を上回る。 点の高さを状態から取っている。",
      tweens: LINE_POINTS.map((p) => ({ id: p.id, from: p.plan, to: p.actual })),
    },
  ],
  LINE_POINTS.map((p) => ({ id: p.id, initial: p.plan })),
);
