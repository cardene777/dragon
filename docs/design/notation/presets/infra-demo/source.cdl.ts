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

// infrastructure preset ... cloud / system 構成図 (col + row grid)
export const presetInfrastructure = withSteps(
  // 小見出しと説明を書く (#1498)。 cdl 0.20.0 で名前だけの箱は 54 まで縮み、段が近づいて
  // `GET/SET` の説明が隣の線に 1 かぶった。 中身を足せば箱が中身ぶんの高さに戻る
  infrastructure({ id: "infra-demo", topic: "クラウド・ネットワーク構成を階層で示す図" })
    .node({ id: "user", kind: "person", title: "User", eyebrow: "利用者", subtitle: "ブラウザ", col: 0, row: 0 })
    .node({ id: "cdn", kind: "cdn", title: "CloudFront", eyebrow: "配信", subtitle: "静的配信", col: 1, row: 0 })
    .node({ id: "alb", kind: "service", title: "ALB", eyebrow: "振り分け", subtitle: "負荷分散", col: 2, row: 0 })
    .node({ id: "app", kind: "service", title: "App", eyebrow: "処理", subtitle: "アプリ", col: 2, row: 1 })
    .node({ id: "db", kind: "database", title: "RDS", eyebrow: "保存", subtitle: "永続化", col: 3, row: 0 })
    .node({ id: "cache", kind: "cache", title: "Redis", eyebrow: "一時保存", subtitle: "高速化", col: 3, row: 1 })
    .connect({ from: "user", to: "cdn", label: "HTTPS" })
    .connect({ from: "cdn", to: "alb", label: "origin" })
    .connect({ from: "alb", to: "app", label: "route" })
    .connect({ from: "app", to: "db", label: "SQL" })
    .connect({ from: "app", to: "cache", label: "GET/SET" })
    .build(),
  [
    { ids: ["user"], title: "1. User", body: "利用者から始まる。" },
    { ids: ["cdn", "i0-user-cdn"], title: "2. CloudFront", body: "HTTPS を受ける。" },
    { ids: ["alb", "i1-cdn-alb"], title: "3. ALB", body: "origin へ振り分ける。" },
    { ids: ["app", "i2-alb-app"], title: "4. App", body: "処理を担う。" },
    { ids: ["db", "cache", "i3-app-db", "i4-app-cache"] },
  ],
);
