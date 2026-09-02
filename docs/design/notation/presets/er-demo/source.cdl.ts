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

// er preset ... ER 図 (設計「箱と行と関係」 の意匠)
//
// `users` が `orders` を出し、`orders` が `order_items` を抱える。 `users` は自分自身を
// 上司として持つ (上司も利用者なので `manager_id` は `users` を指す)。
//
// **端の印は両端に付く**。 クラス図の印は「どちらが親か」 のような関係そのものの性質を指す
// ので 1 つで足りるが、ER の印が指すのは端ごとに違う個数なので両端に要る。
// 箱に近い側が個数 (棒 = 1 / 三又 = 多)、その外側が任意か (棒 = 必須 / 丸 = 任意)。
export const presetEr = withSteps(
  er({ id: "er-demo", topic: "テーブル間の関係を表す図", defaultTone: "info" })
    .entity({
      id: "users",
      title: "users",
      subtitle: "利用者",
      columns: [
        { name: "id", type: "bigint", pk: true },
        { name: "email", type: "text" },
        { name: "manager_id", type: "bigint", fk: true, optional: true },
        { name: "created_at", type: "timestamptz" },
      ],
    })
    .entity({
      id: "orders",
      title: "orders",
      subtitle: "注文",
      columns: [
        { name: "id", type: "bigint", pk: true },
        { name: "user_id", type: "bigint", fk: true },
        { name: "total", type: "numeric" },
        { name: "placed_at", type: "timestamptz" },
      ],
    })
    .entity({
      id: "order_items",
      title: "order_items",
      subtitle: "注文の明細",
      columns: [
        // 親の鍵が自分の鍵に入る = 識別する関係の子側。 山形 + 下線で重ねて示す
        { name: "order_id", type: "bigint", pk: true, fk: true },
        { name: "product_id", type: "bigint", pk: true, fk: true },
        { name: "qty", type: "int" },
      ],
    })
    // 識別しない = 破線。 子は自分の鍵を持ち、親はただの参照先。 1 人が 0 件以上を出す
    .relation({
      from: "users",
      to: "orders",
      label: "注文する",
      style: "dashed",
      tailHead: "one",
      head: "zero-many",
    })
    // 識別する = 実線。 親の鍵が子の鍵に入るので、親なしでは子を名指せない
    .relation({
      from: "orders",
      to: "order_items",
      label: "明細を持つ",
      tailHead: "one",
      head: "many",
    })
    // 自分への関係。 0 か 1 人の上司が 0 人以上の部下を持つ
    .relation({
      from: "users",
      to: "users",
      label: "上司",
      style: "dashed",
      tailHead: "zero-one",
      head: "zero-many",
    })
    .build(),
  [
    { ids: ["users"], title: "1. users 表", body: "主キーは名前に下線。 印は形 × 塗りの 2 軸。" },
    {
      ids: ["orders", "rel-0-users-orders"],
      title: "2. 注文を出す",
      body: "破線は識別しない関係。 1 人が 0 件以上を出す。",
    },
    {
      ids: ["order_items", "rel-1-orders-order_items"],
      title: "3. 明細を抱える",
      body: "実線は識別する関係。 親の鍵が子の鍵に入る。",
    },
    {
      ids: ["rel-2-users-users"],
      title: "4. 自分への関係",
      body: "上司も利用者。 manager_id は同じ表を指す。",
    },
  ],
);
