/**
 * 種類 (`kind`) に書いた名前が箱の種類にも部品の一覧にも無い時、書いた行へ知らせが出る (#2113)。
 *
 * 記法は箱の種類に無い名前を部品の名前とみなす。 部品の一覧に無ければ種類を書かなかった箱として
 * 描き、`console.warn` にだけ英語の 1 文を出していた。 編集画面は知らせだけを画面に出すため、
 * 部品の名前や箱の種類 (`evnet`) を書き間違えても理由が見えなかった。
 *
 * | 組み立て方 | 知らせ |
 * |---|---|
 * | 部品を持つ一覧を渡し、名前が一覧に無い | `part-not-found` を書いた行で 1 件。 綴りの近い名前を案内する |
 * | 一覧を渡さない / 部品を 1 つも持たない一覧 | 出さない (部品か書き間違いかを決められない) |
 *
 * 部品は実物 (`parts.cdl.ts`) を、編集画面と同じ作り方 (`部品の一覧を作る`) で一覧にする。
 */
import { describe, expect, it } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { jsonToDiagram, textDslToDiagram, type CompileNotice } from "../src/index";
import { 部品の一覧を作る } from "../../../apps/playground-spa/src/lib/parts-catalog";
import * as 部品 from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";

const 一覧 = 部品の一覧を作る(Object.values(部品));
/** 綴り違いの元にする実物の部品 */
const 実在の部品 = "state-indicator";

type 結果 = { 知らせ: CompileNotice[]; 警告: string[]; 図: CdlDiagram };

function 集める(組み立て: (onNotice: (n: CompileNotice) => void) => CdlDiagram): 結果 {
  const 知らせ: CompileNotice[] = [];
  const 警告: string[] = [];
  const もとの = console.warn;
  console.warn = (m: unknown) => void 警告.push(String(m));
  try {
    const 図 = 組み立て((n) => 知らせ.push(n));
    return { 知らせ, 警告, 図 };
  } finally {
    console.warn = もとの;
  }
}

/** 箱 2 つの記法。 `開始` の行に種類を書く。 書いた行の番号も返す */
function 記法(書き方: "1 行" | "中括弧" | "縦に並べる", 種類: string): { src: string; 行: number } {
  const 開始の行 =
    書き方 === "1 行"
      ? [`  - 開始: ${種類}`]
      : 書き方 === "中括弧"
        ? [`  - 開始: { kind: ${種類} }`]
        : ["  - 開始:", `      kind: ${種類}`];
  const src = ['title: "t"', "type: flow", "actors:", ...開始の行, "  - 処理: function", "flow:", '  - 開始 -> 処理: "渡す"'].join(
    "\n",
  );
  return { src, 行: src.split("\n").findIndex((l) => l.startsWith("  - 開始")) + 1 };
}

/** `部品の一覧` に `null` を渡すと一覧を渡さずに組み立てる (`undefined` は既定値に置き換わるため使わない) */
function 記法で組み立てる(src: string, 部品の一覧: Record<string, CdlDiagram> | null = 一覧): 結果 {
  return 集める((onNotice) =>
    textDslToDiagram(src, { onNotice, ...(部品の一覧 === null ? {} : { partsCatalog: 部品の一覧 }) }),
  );
}

function JSONで組み立てる(種類: string, 部品の一覧: Record<string, CdlDiagram> = 一覧): 結果 {
  return 集める((onNotice) =>
    jsonToDiagram(
      {
        title: "t",
        type: "flow",
        actors: [
          { name: "開始", kind: 種類 },
          { name: "処理", kind: "function" },
        ],
        flow: [{ from: "開始", to: "処理", label: "渡す" }],
      },
      { onNotice, partsCatalog: 部品の一覧 },
    ),
  );
}

const 一覧に無い = (r: 結果): CompileNotice[] => r.知らせ.filter((n) => n.kind === "part-not-found");

/** 書き違いの形ごとに、案内に出る近い名前と、その名前の区分 */
const 書き違い: Array<[string, string, string, string]> = [
  ["箱の種類の綴り違い", "evnet", "event", "箱の種類"],
  ["部品の名前の綴り違い", "state-indicatr", 実在の部品, "部品"],
  ["前置きつきの部品の名前の綴り違い", "parts-state-indicatr", 実在の部品, "部品"],
];

describe("一覧に無い名前を種類に書くと、書いた行へ知らせる (#2113)", () => {
  it("実物の部品を一覧にできていて、綴り違いの元にする部品を含む", () => {
    expect(Object.keys(一覧).length, "部品の一覧が空 (検査が空振りしている)").toBeGreaterThan(0);
    expect(Object.hasOwn(一覧, 実在の部品), `${実在の部品} が部品の一覧に無い`).toBe(true);
  });

  for (const 書き方 of ["1 行", "中括弧", "縦に並べる"] as const) {
    it.each(書き違い)(`記法 (${書き方}) の%s: 書いた行に 1 件知らせ、近い名前を案内する`, (_名, 種類, 近い, 区分) => {
      const { src, 行 } = 記法(書き方, 種類);
      const r = 記法で組み立てる(src);
      const 出た = 一覧に無い(r);
      expect(出た.map((n) => [n.line, n.actor]), JSON.stringify(r.知らせ)).toEqual([[行, "開始"]]);
      expect(出た[0]!.message).toContain(`"${種類}"`);
      expect(出た[0]!.hint).toBe(`近い名前は ${近い} (${区分}) です`);
      // 知らせと同じ文が console.warn にも出る
      expect(r.警告).toContain(`[dragon] ${出た[0]!.message}`);
    });
  }

  it.each(書き違い)("JSON の%s: 1 件知らせ、近い名前を案内する", (_名, 種類, 近い, 区分) => {
    const r = JSONで組み立てる(種類);
    const 出た = 一覧に無い(r);
    expect(出た.map((n) => n.actor), JSON.stringify(r.知らせ)).toEqual(["開始"]);
    expect(出た[0]!.hint).toBe(`近い名前は ${近い} (${区分}) です`);
    expect(r.警告).toContain(`[dragon] ${出た[0]!.message}`);
  });

  it("parts- 付きの名前だけを持つ一覧でも、前置きを外した名前を勧める", () => {
    // 組み立ては前置きの有無のどちらでも引ける。 編集画面の一覧は両方の名前を持つが、利用側が
    // 前置き付きだけを渡すこともある。 外さずに比べると、前置きの 6 文字が距離に入り何も勧めない
    const 前置きだけ = { [`parts-${実在の部品}`]: 一覧[`parts-${実在の部品}`]! };
    expect(Object.keys(前置きだけ)).toEqual([`parts-${実在の部品}`]);
    const 出た = 一覧に無い(記法で組み立てる(記法("中括弧", "state-indicatr").src, 前置きだけ));
    expect(出た.map((n) => n.hint)).toEqual([`近い名前は ${実在の部品} (部品) です`]);
  });

  it("近い名前が無い時は、書ける名前の種類を案内する", () => {
    const 出た = 一覧に無い(記法で組み立てる(記法("中括弧", "zzqqxx-yyy").src));
    expect(出た.map((n) => n.hint)).toEqual(["kind には、箱の種類か、部品の一覧にある部品の名前を書いてください"]);
  });

  it.each([
    ["部品の名前", 実在の部品],
    ["前置きつきの部品の名前", `parts-${実在の部品}`],
    ["箱の種類", "event"],
  ])("%s: 書いた箱では知らせない", (_名, 種類) => {
    for (const 書き方 of ["1 行", "中括弧", "縦に並べる"] as const) {
      expect(一覧に無い(記法で組み立てる(記法(書き方, 種類).src)), 書き方).toEqual([]);
    }
    expect(一覧に無い(JSONで組み立てる(種類))).toEqual([]);
  });

  it("部品の一覧を渡さない組み立てでは知らせない", () => {
    const r = 記法で組み立てる(記法("中括弧", "evnet").src, null);
    expect(一覧に無い(r)).toEqual([]);
    // 知らせないが、部品として描けないことは console.warn に残す
    expect(r.警告.filter((m) => m.includes("部品の一覧 (partsCatalog) を渡していない"))).toHaveLength(1);
  });

  it("部品を 1 つも持たない一覧を渡した組み立てでも知らせない", () => {
    // 編集画面は部品を読み込み終わる前に空の一覧を渡す。 知らせると正しい部品の名前にも注意が出る
    expect(一覧に無い(記法で組み立てる(記法("中括弧", 実在の部品).src, {}))).toEqual([]);
    expect(一覧に無い(JSONで組み立てる("evnet", {}))).toEqual([]);
  });

  it("知らせの文のとおり、種類を書かなかった箱と同じ図になる", () => {
    const 書き違えた本文 = 記法("1 行", "evnet").src;
    const 書かない本文 = 書き違えた本文.replace("  - 開始: evnet\n", "  - 開始\n");
    expect(書かない本文, "種類を外せていない").not.toBe(書き違えた本文);
    expect(JSON.stringify(記法で組み立てる(書き違えた本文).図)).toBe(JSON.stringify(記法で組み立てる(書かない本文).図));
  });
});
