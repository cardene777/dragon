/**
 * 記法の `values:` が、描画側が読む値に実際に届くことの検査 (#1162)。
 *
 * **段の値を手で渡さない**。 閉じた PR (#1179) の検査は `applyDerivedValues(手書きの base, ...)`
 * を呼んでおり、図の状態が 1 つも無くても通った。 実際の経路は
 * `layout()` → `computeStateValues(laid, phaseIdx, progress)` で、渡る値は `laid.states` から
 * 組み立てられる。 手で渡すと、その組み立てが空を返す形 (`animation:` を書かない図) を
 * 一度も通らない。 ここでは必ず実経路を通す。
 *
 * 画面が読む値もこの関数が作る (`CdlDiagramView` が内部で呼ぶ)。 絵として出るところまでは
 * `apps/playground-spa/src/lib/values-on-screen.test.tsx` が見る。
 */
import { readFile, readdir } from "node:fs/promises";
import { describe, it, expect } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { computeStateValues, layout } from "@cardenelabs/cdl";
import { textDslToDiagram } from "../src/index";
import { compileToCdl, type CompileNotice } from "../src/compile";
import { MAX_INPUT_ELEMENTS, countDiagramElements } from "../src/input-size";

/** `values` を持つ最小の図。 */
const 記法 = (body: string) => `title: "確認"\ntype: flow\n\nactors:\n  - A\n  - B\n\n${body}`;

/** その瞬間に描画側が読む値。 段の番号と進み具合を指定できる。 */
function 描画が読む値(src: string, 段 = 0, 進み = 0): Record<string, string> {
  return computeStateValues(layout(textDslToDiagram(src)), 段, 進み);
}

/** 組み立てが書いた人に伝えたこと。 編集画面はこの経路をそのまま画面に出す。 */
function 知らせ(src: string): CompileNotice[] {
  const out: CompileNotice[] = [];
  textDslToDiagram(src, { onNotice: (n) => out.push(n) });
  return out;
}

describe("値が描画側に届く (#1162)", () => {
  it("`animation:` を書かない図でも値が届く", () => {
    // 本 Issue の Goal 例がこの形 (states と values だけ)。 段を書かない図では図に状態が
    // 1 つも載らず、書いた値が 1 つも届いていなかった (実測 = 解決後が `{}`)
    const v = 描画が読む値(
      記法('states:\n  inflow: 10\n  done: 4\n\nvalues:\n  waiting: "{inflow} - {done}"'),
    );
    expect(v.inflow).toBe("10");
    expect(v.waiting).toBe("6");
  });

  it("参照した値から自動で決まる", () => {
    const v = 描画が読む値(
      記法(
        'states:\n  inflow: 100\n  done: 30\n\n' +
          'values:\n  waiting: "{inflow} - {done}"\n  busy: "{waiting} > 50"\n\n' +
          'animation:\n  - step: "流れる" 1.4s\n    focus: [A]',
      ),
    );
    expect(v.waiting).toBe("70");
    expect(v.busy).toBe("1");
  });

  it("書く順を入れ替えても結果が変わらない", () => {
    // 参照から解くので、書いた順に依存しない (spec 4.3)
    const 先 = 描画が読む値(記法('states:\n  x: 10\n\nvalues:\n  a: "{x} * 2"\n  b: "{a} + 1"'));
    const 後 = 描画が読む値(記法('states:\n  x: 10\n\nvalues:\n  b: "{a} + 1"\n  a: "{x} * 2"'));
    expect(後.a).toBe(先.a);
    expect(後.b).toBe(先.b);
    expect(後.b).toBe("21");
  });

  it("段の補間の途中でも決まり直す", () => {
    // **本 Issue の理由そのもの**。 掛け算や割り算は端点 2 点では表せないため、compile 時に
    // 畳むと途中の値が狂う。 段の値が動くたびに解き直されることを、途中の 1 点で見る
    const src = 記法(
      'states:\n  inflow: 0\n\nvalues:\n  half: "{inflow} / 2"\n\n' +
        'animation:\n  - step: "増える" 1.4s\n    focus: [A]\n    tween: inflow 0 -> 100',
    );
    expect(描画が読む値(src, 0, 0).half).toBe("0");
    expect(描画が読む値(src, 0, 0.5).half).toBe("25");
    expect(描画が読む値(src, 0, 1).half).toBe("50");
  });

  it("比較の結果は数として使える (真 = 1 / 偽 = 0)", () => {
    // spec 4.1 の前提。 変わると値で色や表示を切り替えている図が全て壊れる
    const src = 記法(
      'states:\n  waiting: 0\n\nvalues:\n  busy: "{waiting} > 80"\n  scaled: "{busy} * 5"\n\n' +
        'animation:\n  - step: "詰まる" 1.4s\n    focus: [A]\n    tween: waiting 0 -> 100',
    );
    const 偽 = 描画が読む値(src, 0, 0);
    expect(偽.busy).toBe("0");
    expect(偽.scaled).toBe("0");

    const 真 = 描画が読む値(src, 0, 1);
    expect(真.busy).toBe("1");
    expect(真.scaled).toBe("5");
  });

  it("values を書かない図の挙動が変わらない", () => {
    const d = textDslToDiagram(記法("states:\n  x: 1"));
    expect(d.derived).toBeUndefined();
    // 状態はそのまま届く (値を書かないことで状態まで消えない)
    expect(描画が読む値(記法("states:\n  x: 1")).x).toBe("1");
  });

  it("段なしで載せた state も外部参照を描画へ渡さない", () => {
    // state は `{name}` で SVG の paint 属性へ差し込める。 出口検査より後に state を載せると、
    // url(...) が検査を迂回して図を開いた人の環境から外部へ要求できてしまう
    const src = 記法('states:\n  fill: "url(https://example.invalid/pixel)"');
    const d = textDslToDiagram(src);
    expect(d.states.find((s) => s.id === "fill")?.initial).toBe("none");
    expect(知らせ(src).map((n) => n.kind)).toContain("external-paint-dropped");
  });
});

describe("値の反例 6 種 (#1162)", () => {
  it("輪はその値だけ止め、輪の外は動く", () => {
    const src = 記法(
      'states:\n  x: 5\n\nvalues:\n  a: "{b} + 1"\n  b: "{a} + 1"\n  c: "{x} * 2"',
    );
    const v = 描画が読む値(src);
    expect(v.c).toBe("10");
    expect(v.a).toBeUndefined();
    expect(v.b).toBeUndefined();
    // 図が黙って壊れないよう、書いた人に伝える (spec 4.2)
    expect(知らせ(src).map((n) => n.kind)).toContain("value-unresolved");
    expect(知らせ(src).find((n) => n.actor === "a")?.message).toContain("輪");
  });

  it("存在しない名前の参照はその値を止めて伝える", () => {
    const src = 記法('states:\n  x: 1\n\nvalues:\n  a: "{missing} + 1"');
    expect(描画が読む値(src).a).toBeUndefined();
    const n = 知らせ(src).find((x) => x.actor === "a");
    expect(n?.kind).toBe("value-unresolved");
    expect(n?.message).toContain("missing");
  });

  it("0 除算は値を止める (無限大を描画へ流さない)", () => {
    const src = 記法('states:\n  x: 0\n\nvalues:\n  a: "1 / {x}"');
    expect(描画が読む値(src).a).toBeUndefined();
    expect(知らせ(src).map((n) => n.kind)).toContain("value-unresolved");
  });

  it("数として読めない値との計算は止めて伝える", () => {
    const src = 記法('states:\n  x: "あいう"\n\nvalues:\n  a: "{x} + 1"');
    expect(描画が読む値(src).a).toBeUndefined();
    expect(知らせ(src).map((n) => n.kind)).toContain("value-unresolved");
  });

  it("states と values に同じ名前を書くと values を優先して伝える", () => {
    const src = 記法('states:\n  x: 1\n\nvalues:\n  x: "2 * 3"');
    // 値が勝つ (states 側の初期値は、まだ計算されていない間の値、spec 4.5)
    expect(描画が読む値(src).x).toBe("6");
    expect(知らせ(src).map((n) => n.kind)).toContain("value-shadows-state");
  });

  it("同じ名前を 2 度書くと先に書いた式を使い、伝える", () => {
    const src = 記法('states:\n  x: 1\n\nvalues:\n  a: "{x} + 1"\n  a: "{x} + 100"');
    expect(描画が読む値(src).a).toBe("2");
    expect(知らせ(src).map((n) => n.kind)).toContain("value-duplicate");
  });

  it("知らせは書いた行を指す", () => {
    // 行が分からないと、値を 20 個書いた図でどれを直すのか探すことになる
    const n = 知らせ(記法('states:\n  x: 1\n\nvalues:\n  a: "{missing} + 1"')).find(
      (x) => x.actor === "a",
    );
    // 12 行目 = `a: "{missing} + 1"` を書いた行
    expect(n?.line).toBe(12);
  });
});

describe("重なりは図に載った状態で見る (#1162)", () => {
  /** 状態 1 つを持つ最小の見本。 重ねると `p1__v` の名前で図に載る */
  const 見本: CdlDiagram = {
    id: "parts-test",
    topic: "test",
    lanes: [{ id: "l", x: 0, width: 400 }],
    nodes: [{ id: "box", lane: "l", stack: 0, kind: "actor", title: "T", value: "{v}" }],
    edges: [],
    states: [{ id: "v", initial: 10 }],
    phases: [] as CdlDiagram["phases"],
  };

  /** 見本を 1 つ重ねた図を組み立てる。 編集画面が見本を渡すのと同じ経路 */
  function 見本つきで組む(values: Array<{ name: string; expression: string }>): CompileNotice[] {
    const out: CompileNotice[] = [];
    compileToCdl(
      {
        title: "T",
        type: "sequence",
        actors: [
          { name: "A", kind: "actor", pos: { line: 1 } },
          { name: "p1", kind: "actor", partId: "test", pos: { line: 2 } },
        ],
        flow: [{ no: 1, from: "A", to: "A", label: "x", pos: { line: 3 } }],
        values: values.map((v) => ({ ...v, pos: { line: 4 } })),
        pos: { line: 1 },
      },
      { partsCatalog: { test: 見本 }, onNotice: (n) => out.push(n) },
    );
    return out;
  }

  it("見本から引き継いだ状態と同じ名前でも重なりを伝える", () => {
    // 見本の状態は `p1__v` の名前で図に載る。 書いた `states:` だけを見ていると、
    // この重なりを見落とす = 書いた値が効かないのに何も伝わらない
    const 知らせ = 見本つきで組む([{ name: "p1__v", expression: "1 + 1" }]);
    expect(知らせ.map((n) => n.kind)).toContain("value-shadows-state");
  });

  it("重なっていない名前では伝えない", () => {
    // 上の検査だけだと、全ての値を重なりとして報せる形でも通る
    const 知らせ = 見本つきで組む([{ name: "other", expression: "1 + 1" }]);
    expect(知らせ.map((n) => n.kind)).not.toContain("value-shadows-state");
  });
});

describe("値も入力の上限に数える (#1162 / #1005)", () => {
  it("値だけで上限を超える本文は組み立てない", () => {
    // 数えないと、値を 3,000 件書いた本文が素通りする。 これらは毎 frame 解かれるので
    // 組み立てを通った後に描画側が重さを引き受けることになる
    const 値 = Array.from({ length: MAX_INPUT_ELEMENTS + 1 }, (_, i) => `  v${i}: "1 + 1"`).join("\n");
    expect(() => textDslToDiagram(記法(`values:\n${値}`))).toThrow(/2,000 件までに/);
  });

  it("上限に収まる本文は今まで通り組み立てる", () => {
    expect(() => textDslToDiagram(記法('values:\n  a: "1 + 1"'))).not.toThrow();
  });

  it("記法を通らない入口 (埋め込んだ図の定義) でも値を数える", () => {
    // 埋め込んだ図と重ねる見本はこちらで数える (`CdlEditor` が見本の中身を足す経路)。
    // 片方だけ数えると、値を寄せた見本を重ねる形で上限をすり抜ける
    const 値 = Array.from({ length: 5 }, (_, i) => ({ id: `v${i}`, expression: "1 + 1" }));
    expect(countDiagramElements({ nodes: [{}], derived: 値 })).toBe(6);
  });
});

describe("式は compile 時に評価しない (#1162)", () => {
  it("図には式が文字列のまま載る", () => {
    // 畳むと段の補間中に決まり直せない。 載せるだけにして、解くのは毎 frame
    const d = textDslToDiagram(記法('values:\n  a: "1 + 1"'));
    expect(d.derived).toEqual([{ id: "a", expression: "1 + 1" }]);
  });
});

describe("検査が実経路を迂回していない (#1162)", () => {
  it("記法側の検査は式を解く関数を直接呼ばない", async () => {
    // 解く関数に手で組み立てた値を渡すと、図に状態が載らない形を通り抜ける (#1179 が
    // 閉じた理由)。 描画側と同じ入口 (`computeStateValues`) だけを使う
    const dir = new URL("./", import.meta.url);
    const files = (await readdir(dir)).filter((f) => f.endsWith(".test.ts"));
    const 迂回: string[] = [];
    for (const f of files) {
      const src = await readFile(new URL(f, dir), "utf8");
      for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*"@cardenelabs\/cdl"/g)) {
        const 取り込み = m[1] ?? "";
        if (/\b(applyDerivedValues|withDerivedValues)\b/.test(取り込み)) 迂回.push(f);
      }
    }
    expect(迂回, `解く関数を直接呼んでいる: ${迂回.join(", ")}`).toHaveLength(0);
  });

  it("本 file は描画側と同じ入口を使っている", () => {
    // 上の検査は「呼んでいないこと」 しか見ない。 何も import しない file でも通るため、
    // 実経路を通していること自体をここで固定する
    expect(computeStateValues).toBeTypeOf("function");
    expect(描画が読む値(記法('states:\n  x: 2\n\nvalues:\n  y: "{x} * 3"')).y).toBe("6");
  });
});
