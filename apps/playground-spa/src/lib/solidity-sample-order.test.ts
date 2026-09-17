/**
 * 契約の図 (`type: solidity`) の見本が、種別による縦線の並べ替えを実演していること (#2131)。
 *
 * 並べ替えそのものは `packages/dragon/test/solidity-lane-order.test.ts` (#1411) が見ている。
 * ここで見るのは **カタログの見本がその並べ替えを使っているか**。
 *
 * 見本は種別を 1 つも書いておらず、全ての箱が `actor` になって並べ替えの鍵が揃い、
 * **書いた順のまま並んでいた**。 題は「種別ごとに縦列が並ぶ」 と謳うのに、図は出来事から
 * 始まっていた。 並べ替えの検査は手書きの記法で通るため、見本の不備は素通りした。
 *
 * ## 何を見るか
 *
 * **並びそのものではなく、書いた順と違うこと** を見る。 見本は逆順 (出来事 → 人) で書いて
 * あるので、図の並びが書いた順と一致したら見本は並べ替えを実演していない。 並びだけを見ると、
 * 誰かが見本を人から順に書き直した時に、実演が消えていても通る。
 *
 * 矢印の行き先も見る。 縦線の並びは板の中で番号として持たれ、矢印はその番号で相手を指す。
 */
import { describe, it, expect } from "vitest";
import { load } from "js-yaml";
import { textDslToDiagram, jsonToDiagram } from "@cardenelabs/dragon";
import type { CdlDiagram } from "@cardenelabs/cdl";

import * as Cookbook from "@/topics/catalog/cookbook.cdl";

type 板 = {
  kind?: string;
  sequenceData?: {
    actors: { name: string }[];
    messages: { label: string; from: number; to: number }[];
  };
};

const 記法 = Cookbook.sourceYaml__tokenTransferSolidity;
const JSON記法 = Cookbook.sourceJson__tokenTransferSolidity;

/** 板を引く。 見つからなければ検査の前提が崩れている */
function 板を引く(図: CdlDiagram): NonNullable<板["sequenceData"]> {
  const b = (図.nodes as unknown as 板[]).find((n) => n.kind === "sequence-board");
  if (!b?.sequenceData) throw new Error("順序図の板が無い (図の組み立て方が変わった)");
  return b.sequenceData;
}

/** 縦線の名前を並びどおりに取り出す */
function 縦線(図: CdlDiagram): string[] {
  return 板を引く(図).actors.map((a) => a.name);
}

/**
 * 記法に書いた箱の名前を、書いた順に取り出す。
 *
 * **`actors:` の塊だけを YAML として読む**。 記法の段 (`- step: "呼ぶ" 1.2s`) は YAML として
 * 書けない形を含むため、文書全体を読むと落ちる。
 */
function 書いた順(記法: string): string[] {
  const 塊 = /^actors:\n((?: {2}- .*\n)+)/m.exec(記法)?.[1];
  if (塊 === undefined) throw new Error("記法に actors: の塊が無い (見本の書き方が変わった)");
  const 箱たち = load(塊) as (string | Record<string, unknown>)[];
  return 箱たち.map((a) => (typeof a === "string" ? a : Object.keys(a)[0]!));
}

describe("契約の図の見本が種別による並べ替えを実演する (#2131)", () => {
  it("記法の箱を 4 つ読め、板に縦線が 4 本ある (前提)", () => {
    expect(書いた順(記法), "記法の箱を読めていない (検査が空振りしている)").toHaveLength(4);
    expect(縦線(textDslToDiagram(記法)), "縦線を数えられていない").toHaveLength(4);
  });

  it("記法は逆順 (出来事 → 保存 → 契約 → 人) で書いてある", () => {
    // 順に書くと並べ替えが働いても働かなくても同じ図になり、実演にならない
    expect(書いた順(記法)).toEqual(["Transfer", "残高表", "トークン契約", "利用者"]);
  });

  it("図は 人 → 契約 → 保存 → 出来事 の順に並ぶ (書いた順と違う)", () => {
    const 並び = 縦線(textDslToDiagram(記法));
    expect(並び).toEqual(["利用者", "トークン契約", "残高表", "Transfer"]);
    expect(並び, "書いた順のまま並んでいる (種別が効いていない)").not.toEqual(書いた順(記法));
  });

  it("JSON も同じ順に並ぶ", () => {
    expect(縦線(jsonToDiagram(JSON.parse(JSON記法)))).toEqual(縦線(textDslToDiagram(記法)));
  });

  it("矢印が並べ替えた後も同じ相手を指す", () => {
    const b = 板を引く(textDslToDiagram(記法));
    const 名 = b.actors.map((a) => a.name);
    expect(b.messages.map((m) => `${m.label}: ${名[m.from]} -> ${名[m.to]}`)).toEqual([
      "transfer(花子, 100): 利用者 -> トークン契約",
      "残高を書き換える: トークン契約 -> 残高表",
      "Transfer を出す: トークン契約 -> Transfer",
      "成功を返す: トークン契約 -> 利用者",
    ]);
  });

  it("種別を外すと書いた順のまま並ぶ (検査が空振りしていない)", () => {
    // 見本の不備 (種別を書かない) を再現し、上の検査が区別できることを確かめる
    const 種別なし = 記法.replace(/: \{ kind: [a-z]+ \}/g, "");
    expect(種別なし, "種別を外せていない (置き換えが効いていない)").not.toContain("kind:");
    expect(縦線(textDslToDiagram(種別なし))).toEqual(書いた順(記法));
  });
});
