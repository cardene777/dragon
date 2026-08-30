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

// stateMachine preset ... 状態遷移図 (設計「箱と行と関係」 の意匠)
//
// 注文が下書きから受付済へ進み、支払いを経て終わる。 受付済からは取り消せる。
//
// **遷移の種類は 1 つしかない**。 クラス図 6 種、ER 図は端 4 種 × 線 2 種に対して、
// 状態遷移の線は実線 + 開いた矢の 1 種だけ。 違いは語の中 (きっかけ / きっかけ + 条件) に入る。
//
// **始まりと終わりは箱ではない**。 行も名前も持たないので、箱にすると題も呼び名も空で
// 寸法が出せない。 塗った丸と輪で別に置く。
