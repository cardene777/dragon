/**
 * 4 図 (クラス / ER / 状態 / シーケンス) の見た目 3 つ (#1462)。
 *
 * 設計は 3 つを求める。 描画側 (`cdl#560`、0.15.0) に足したが、記法にも組み立てにも
 * **1 つも配線していなかった** ので画面は変わっていなかった。
 *
 * | 求めるもの | 何が無かったか |
 * |---|---|
 * | 端の形 4 種 (三角 / 菱 / 開いた矢 / 鳥の足) | 記法に欄が無く、組み立ても渡していない |
 * | 自己参照の輪 | 組み立てが矢印ごと捨てていた |
 * | 始点終点の印 | #1450 で書けるようになった |
 *
 * ## 何を見るか
 *
 * 1. 4 種が描画側へ渡ること
 * 2. **書かない矢印に付かないこと** = 陰性対照。 既存の全図が変わらない
 * 3. 自己参照が矢印として残ること
 * 4. **図全体を 1 箱で描く図種では従来どおり落とすこと** = そちらは相手の箱が無い
 *
 * 2 と 4 が要点。 2 が無いと「常に付ける」 実装が通り、4 が無いと箱の無い図種で
 * 落ちる形を見逃す。
 */
import { describe, it, expect } from "vitest";

import { textDslToDiagram, jsonToDiagram } from "../src/index";
import { EDGE_HEAD_VALUES } from "../src/v05/parser";
import { EDGE_HEADS } from "@cardenelabs/cdl";
import { parseTextDslV05 } from "../src/v05";
import type { CompileNotice } from "../src/index";

const 記法 = (type: string, flow: string, actors = `  - A: "a"\n  - B: "b"\n`): string =>
  `title: "確認"\ntype: ${type}\n\nactors:\n${actors}\nflow:\n${flow}`;

const 矢印 = (type: string, flow: string, actors?: string) =>
  textDslToDiagram(記法(type, flow, actors)).edges;

describe("端の形が描画側へ渡る (#1462)", () => {
  it("受ける語を描画側から導いている", () => {
    // 手で並べると、描画側が形を増やした時に書けないままになる
    expect(EDGE_HEAD_VALUES.length, "受ける語が 0 件").toBeGreaterThan(0);
    expect([...EDGE_HEAD_VALUES].sort(), "描画側の一覧と食い違う").toEqual([...EDGE_HEADS].sort());
  });

  it("受ける語すべてが渡る", () => {
    let 測れた = 0;
    for (const 形 of EDGE_HEAD_VALUES) {
      const e = 矢印("class", `  - A -> B: "関係" { head: ${形} }\n`);
      expect(e[0]?.head, `${形} が渡っていない`).toBe(形);
      測れた += 1;
    }
    expect(測れた, "形を 1 つも測れていない (検査が空振りしている)").toBe(EDGE_HEAD_VALUES.length);
  });

  it("書かない矢印には値が入らない (既存の図が変わらない)", () => {
    // 陰性対照。 これが無いと「常に付ける」 実装でも上が通り、既存の全図の矢印が変わる。
    //
    // **欄の有無では見ない**。 組み立ては矢印の欄を一律に並べるので、書かない欄も
    // `undefined` として存在する (`side` / `guard` も同じ)。 見るのは値
    //
    // 図種は `topology` を使う。 `class` は #1466 で関係の語ごとに端の形が決まる
    // (`relation` を書かなければ `associates` = 開いた矢) ため、書かなくても値が入る
    const e = 矢印("topology", `  - A -> B: "関係"\n`);
    expect(e.length, "矢印を 1 本も作れていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(e[0]?.head).toBeUndefined();
  });

  it("読めない語を黙って捨てない", () => {
    const r = parseTextDslV05(記法("class", `  - A -> B: "関係" { head: nope }\n`)) as {
      errors?: Array<{ message: string; hint?: string }>;
    };
    const 文 = (r.errors ?? []).map((e) => `${e.message} ${e.hint ?? ""}`).join(" / ");
    expect(文).toContain("head が読めません");
    expect(文, "使える語を案内していない").toContain("triangle");
  });

  it("矢印を作る 9 図種すべてで渡る", () => {
    // 図種ごとの組み立てが分かれているので、1 図種だけ見ると別の図種で落ちたままになる。
    // 実際に図種ごとの組み立てにも同じ形を置いたが、外しても全図種が渡っていた
    // (欄を写す 1 箇所を全図種が通る) ため余分だった
    //
    // 順序図系 (`sequence` / `solidity`) は #1466 で 1 枚の板になり、言づては矢印ではなく
    // 板の中の行になった = 端の形を載せる矢印が無い。 板が言づてを持つことを別に見る
    const 矢印を作る図種 = ["swimlane", "er", "state", "topology", "class", "c4", "flow"];
    let 測れた = 0;
    for (const 型 of 矢印を作る図種) {
      const e = 矢印(型, `  - A -> B: "関係" { head: diamond }\n`);
      expect(e.map((x) => x.head).filter(Boolean), `${型} で渡っていない`).toContain("diamond");
      測れた += 1;
    }
    expect(測れた, "図種を 1 つも測れていない (検査が空振りしている)").toBe(矢印を作る図種.length);
  });

  it("順序図系は矢印を持たず、言づてが板の行になる", () => {
    // 上のループから外した 2 図種を放置すると、板が言づてを落としても誰も気付かない
    let 測れた = 0;
    for (const 型 of ["sequence", "solidity"]) {
      const d = textDslToDiagram(記法(型, `  - A -> B: "関係"\n`));
      expect(d.edges, `${型} に矢印が残っている`).toEqual([]);
      const 板 = d.nodes.find((n) => n.kind === "sequence-board");
      expect(板?.sequenceData?.messages.map((m) => m.label), `${型} の言づてが板に無い`).toEqual(["関係"]);
      測れた += 1;
    }
    expect(測れた, "図種を 1 つも測れていない (検査が空振りしている)").toBe(2);
  });

  it("JSON からも同じ値が渡る (書き方で変わらない)", () => {
    const d = jsonToDiagram({
      title: "確認",
      type: "class",
      actors: [{ name: "A" }, { name: "B" }],
      flow: [{ from: "A", to: "B", label: "関係", head: "diamond" }],
    });
    expect(d.edges[0]?.head).toBe("diamond");
  });
});

describe("自己参照が矢印として残る (#1462)", () => {
  it("書いた矢印を使う図種では残る", () => {
    // 設計は 3 図で使う = 状態の自己遷移 / シーケンスの自分宛て / ER の自己関係。
    // `class` も同じ経路なので併せて見る
    //
    // `sequence` は #1466 で板になり自分宛ては板の行になった (`from` と `to` が同じ言づて)。
    // 矢印としては残らないので、ここでは見ずに下の検査が板の側で見る
    let 測れた = 0;
    for (const 型 of ["state", "er", "class"]) {
      const e = 矢印(型, `  - A -> A: "自分"\n`);
      expect(e.some((x) => x.from === x.to), `${型} で自己参照が消えている`).toBe(true);
      測れた += 1;
    }
    expect(測れた, "図種を 1 つも測れていない (検査が空振りしている)").toBe(3);
  });

  it("順序図では自分宛てが板の行として残る", () => {
    const d = textDslToDiagram(記法("sequence", `  - A -> A: "自分"\n`));
    const 言づて = d.nodes.find((n) => n.kind === "sequence-board")?.sequenceData?.messages ?? [];
    expect(言づて.length, "言づてを 1 つも作れていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(言づて.some((m) => m.from === m.to), "自分宛てが消えている").toBe(true);
  });

  it("`type: flow` の静止図は鎖状に組むので対象外", () => {
    // `compileFlow` は登場人物を書いた順に繋ぐ = 書いた矢印そのものを使わない。
    // 自己参照だけを通しても繋ぐ相手が同じ箱になるため、この形は変えない。
    //
    // **段を書くと別経路 (generic) へ回るので残る**。 同じ図種で結果が分かれることを
    // 記録しておく = 気付かずに「flow でも残るはず」 と読むのを止める
    expect(矢印("flow", `  - A -> A: "自分"\n`).filter((e) => e.from === e.to)).toEqual([]);
    const 段あり = textDslToDiagram(
      `${記法("flow", `  - A -> A: "自分"\n`)}\nanimation:\n  - step: "s" 1s\n    focus: [A]\n`,
    ).edges;
    expect(段あり.some((e) => e.from === e.to), "段を書いた形でも消えている").toBe(true);
  });

  it("知らせも出さない (描けるようになったため)", () => {
    const 出た: CompileNotice[] = [];
    textDslToDiagram(記法("state", `  - A -> A: "自分"\n`), { onNotice: (n) => 出た.push(n) });
    expect(出た.filter((n) => n.message.includes("自分へ戻る矢印"))).toEqual([]);
  });

  it("図全体を 1 箱で描く図種では従来どおり落とす", () => {
    // そちらは矢印そのものを作らないので、通しても相手の箱が無い。
    // これが無いと「全部通す」 実装が通り、箱の無い図で壊れる
    const 出た: CompileNotice[] = [];
    const d = textDslToDiagram(記法("pie", `  - A -> A: "自分"\n`, `  - A: "10"\n  - B: "20"\n`), {
      onNotice: (n) => 出た.push(n),
    });
    expect(d.edges.filter((e) => e.from === e.to)).toEqual([]);
    expect(出た.length, "何も知らせていない").toBeGreaterThan(0);
  });

  it("端の形と自己参照を同時に書ける", () => {
    const e = 矢印("state", `  - A -> A: "催促" { head: open }\n`);
    const 輪 = e.find((x) => x.from === x.to);
    expect(輪?.head).toBe("open");
  });
});
