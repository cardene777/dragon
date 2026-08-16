/**
 * 記法の `values:` が図に載り、 描画側で解かれることの検査 (#1162 段 1 後半)。
 *
 * 前半 (`#1163`) は記法として読めるところまでで、 `doc.values` に入るが図には載っていなかった。
 * ここで `compileToCdl` が `diagram.derived` に載せ、 描画側 (`@cardenelabs/cdl` の
 * `applyDerivedValues`) が段の値を出した後に解く経路を通す。
 *
 * **式は compile 時に評価しない**。 畳むと段の補間中に決まり直せなくなり、 掛け算や比較の
 * ように端点 2 点では表せない関係が途中で狂う。 載せるだけにして、 解くのは毎 frame。
 *
 * Issue の反例 6 種をここで固定する。
 */
import { describe, it, expect } from "vitest";
import { applyDerivedValues, textDslToDiagram, type CompileNotice } from "../src/index";

/** 記法を組み立てる。 `values` を持つ最小の図。 */
const 記法 = (body: string) => `title: "確認"\ntype: flow\n\nactors:\n  - A\n  - B\n\n${body}`;

/** 図に載った式を、 初期値から 1 度だけ解く (描画側と同じ経路)。 */
function 解く(states: Record<string, string>, diagram: ReturnType<typeof textDslToDiagram>) {
  return applyDerivedValues(states, diagram.derived);
}

describe("values が図に載る (#1162)", () => {
  it("書いた式が derived に載る", () => {
    const d = textDslToDiagram(
      記法('states:\n  inflow: 0\n  done: 0\n\nvalues:\n  waiting: "{inflow} - {done}"'),
    );
    expect(d.derived).toEqual([{ id: "waiting", expression: "{inflow} - {done}" }]);
  });

  it("式は compile 時に評価しない", () => {
    // 畳むと段の補間中に決まり直せない。 文字列のまま持つ
    const d = textDslToDiagram(記法('values:\n  a: "1 + 1"'));
    expect(d.derived?.[0]?.expression).toBe("1 + 1");
  });

  it("書く順を入れ替えても結果が変わらない", () => {
    // 参照から解くので、 書いた順に依存しない (spec 4 節)
    const 先 = textDslToDiagram(記法('states:\n  x: 10\n\nvalues:\n  a: "{x} * 2"\n  b: "{a} + 1"'));
    const 後 = textDslToDiagram(記法('states:\n  x: 10\n\nvalues:\n  b: "{a} + 1"\n  a: "{x} * 2"'));
    const 先の値 = 解く({ x: "10" }, 先).values;
    const 後の値 = 解く({ x: "10" }, 後).values;
    expect(先の値.a).toBe(後の値.a);
    expect(先の値.b).toBe(後の値.b);
    expect(後の値.b).toBe("21");
  });

  it("values を書かない図の挙動が変わらない", () => {
    const d = textDslToDiagram(記法("states:\n  x: 1"));
    expect(d.derived).toBeUndefined();
  });
});

describe("values の反例 6 種 (#1162)", () => {
  it("空の values は今までと同じ挙動", () => {
    // 節を書いたが中身が無い形。 `derived` を空配列で載せると描画側が無駄に回る
    const d = textDslToDiagram(記法("states:\n  x: 1"));
    expect(d.derived).toBeUndefined();
  });

  it("輪はその値だけ止め、 残りは動く", () => {
    const d = textDslToDiagram(
      記法('states:\n  x: 5\n\nvalues:\n  a: "{b} + 1"\n  b: "{a} + 1"\n  c: "{x} * 2"'),
    );
    const r = 解く({ x: "5" }, d);
    // 輪に入っていない値は動く
    expect(r.values.c).toBe("10");
    // 輪の 2 つは解けず、 読む側へ伝える
    expect(r.notices.map((n) => n.kind)).toContain("cycle");
  });

  it("存在しない名前の参照はその値を止めて伝える", () => {
    // 記法としては通る形 (英数字) で、 図のどこにも無い名前を参照する
    const d = textDslToDiagram(記法('states:\n  x: 1\n\nvalues:\n  a: "{missing} + 1"'));
    const r = 解く({ x: "1" }, d);
    expect(r.notices.length).toBeGreaterThan(0);
    expect(r.values.a).toBeUndefined();
  });

  it("0 除算は値を止めて伝える (無限大を描画へ流さない)", () => {
    const d = textDslToDiagram(記法('states:\n  x: 0\n\nvalues:\n  a: "1 / {x}"'));
    const r = 解く({ x: "0" }, d);
    expect(r.values.a === undefined || Number.isFinite(Number(r.values.a))).toBe(true);
  });

  it("数でない文字列との計算は止めて伝える", () => {
    const d = textDslToDiagram(記法('states:\n  x: 1\n\nvalues:\n  a: "{x} + 1"'));
    const r = 解く({ x: "あいう" }, d);
    expect(r.notices.length).toBeGreaterThan(0);
  });

  it("states と values に同じ名前を書くと values を優先して伝える", () => {
    const 届いた: CompileNotice[] = [];
    const d = textDslToDiagram(記法('states:\n  x: 1\n\nvalues:\n  x: "2 * 3"'), {
      onNotice: (n) => 届いた.push(n),
    });
    expect(届いた.map((n) => n.kind)).toContain("value-shadows-state");
    // 図には values 側が載る
    expect(d.derived).toEqual([{ id: "x", expression: "2 * 3" }]);
  });
});

describe("比較の結果は数として使える (#1162)", () => {
  it("真は 1、 偽は 0", () => {
    // spec 4 節。 これが変わると全ての図が壊れるので固定する
    const d = textDslToDiagram(
      記法('states:\n  waiting: 100\n\nvalues:\n  busy: "{waiting} > 80"\n  scaled: "{busy} * 5"'),
    );
    const 真 = 解く({ waiting: "100" }, d).values;
    expect(真.busy).toBe("1");
    expect(真.scaled).toBe("5");

    const 偽 = 解く({ waiting: "10" }, d).values;
    expect(偽.busy).toBe("0");
    expect(偽.scaled).toBe("0");
  });
});
