/**
 * 図の説明の指摘の修正案が、自動修正の振る舞いと食い違わないことの検証 (#1942)。
 *
 * package 側の検査 (`packages/dragon/test/notation-lint.test.ts`) は説明を 3 通りしか
 * 入力にしないので、全ての型と実装の言葉の組はここで回す。
 *
 * ## #1934 の検査を落とした理由 (#2687)
 *
 * 元はここに、自動修正が書く説明 (`KIND_TO_JA` の `${shows}を示す${name}`) が
 * カタログの図の型の名前 (`ITEM_NAME_JA`) と同じ呼び名を使うことを照らす検査があった。
 *
 * cdl 0.96.0 で図の説明が **図の題として画面に出る** ようになり、書き換え先の定義文
 * (「全体に対する内訳の割合を示す円グラフ」) が見本帳の 8 枚にそのまま出た。
 * 道具は図の中身を知らないので名前を作れない = 自動修正は語を落とすだけに変え、
 * 書き換え先の表ごと落とした。
 *
 * 照らす相手が無くなったので検査も残せない。 「自動修正が名前を書かない」 ことは
 * package 側 (`先頭の型の名前は落とすだけで、図種の定義文を書かない`) が固定する。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { autoFix, lintDiagram } from "@cardenelabs/dragon";

const 記法の検査 = readFileSync(
  fileURLToPath(new URL("../../../../packages/dragon/src/notation-lint.ts", import.meta.url)),
  "utf8",
);

/** 自動修正が落とす型。 落とす正規表現 (`先頭の型の名前`) の選択肢を読む */
export function 落とす型(src: string): string[] {
  const 選択肢 = /const 先頭の型の名前 =\s*\/\^\\s\*\(([^)]*)\)\\b\/i/.exec(src)?.[1];
  if (選択肢 === undefined) return [];
  return 選択肢.split("|").flatMap((語) => {
    const 省ける = /^(.*)(.)\?$/.exec(語);
    return 省ける ? [省ける[1]!, 省ける[1]! + 省ける[2]!] : [語];
  });
}

function 図(topic: string): CdlDiagram {
  return { id: "d", topic, nodes: [], edges: [] } as unknown as CdlDiagram;
}

const 図の説明の規則 = "topic-redundant-implementation-detail";

/**
 * 図の説明に入れる実装の言葉。 検出の形 (`REDUNDANT_TOPIC_PATTERNS`) の 1 つに 1 つずつ当たる字を置く。
 *
 * 形の数は実物の理由 (`hint:`) の数を読んで突き合わせるので、形を足してここに字を足し忘れると検査が落ちる。
 * 読み方は指摘の文の検査 (`lint-message-words.test.ts`) と同じにする。
 */
export const 実装の言葉 = [
  "preset (詳細)",
  "render 未実装",
  "SVG polyline で描く",
  "polygon",
] as const;

/**
 * 型と実装の言葉の組ごとに、指摘の修正案が自動修正の振る舞いと食い違うもの。
 *
 * 見るのは 2 通り (#2687)。
 *
 * 直せると数えた組は、修正案が自動修正の書く説明そのもので、直した説明に指摘が残らないこと。
 * 残ると、道具が直せる数に入れた指摘が直した後も出る (#1940)。
 *
 * 直せないと数えた組は、自動修正が説明を変えないか、変えても指摘が残ること。
 * 変えて指摘も消えるなら直せたはずで、数え方が誤っている。
 *
 * **どちらの側も見る** = 片側だけ見ると、全部を直せないと数える実装が素通りする。
 */
export function 修正案とずれる組(
  型たち: readonly string[],
  言葉たち: readonly string[],
  検査: (d: CdlDiagram) => ReturnType<typeof lintDiagram>,
  直す: (d: CdlDiagram) => CdlDiagram,
): { ずれ: string[]; 組: number; 直せた: number } {
  const ずれ: string[] = [];
  let 組 = 0;
  let 直せた = 0;
  for (const 型 of 型たち) {
    for (const 言葉 of 言葉たち) {
      const d = 図(`${型} ${言葉}`);
      const 指摘 = 検査(d).issues.filter((i) => i.rule === 図の説明の規則);
      if (指摘.length === 0) {
        ずれ.push(`${d.topic}: 指摘が出ない`);
        continue;
      }
      組++;
      const 直した = 直す(d);
      const 残る = 検査(直した).issues.some((i) => i.rule === 図の説明の規則);
      for (const i of 指摘) {
        if (i.autoFixable) {
          直せた++;
          if (i.suggestion !== 直した.topic) {
            ずれ.push(`${d.topic}: 修正案は ${i.suggestion}、自動修正は ${直した.topic}`);
          }
          if (残る) ずれ.push(`${d.topic}: 直した説明 ${直した.topic} にまだ指摘が出る`);
        } else if (直した.topic !== d.topic && !残る) {
          ずれ.push(`${d.topic}: 直せているのに直せないと数えている (${直した.topic})`);
        }
      }
    }
  }
  return { ずれ, 組, 直せた };
}

const 型たち = 落とす型(記法の検査);

describe("図の説明の指摘の修正案と自動修正 (#1942)", () => {
  it("落とす型を実物から読めている", () => {
    expect(型たち.length, "落とす型を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("実装の言葉は検出の形と同じ数で、1 つずつ別の形に当たる", () => {
    const 形の数 = (記法の検査.match(/\bhint: "/g) ?? []).length;
    expect(形の数, "検出の形を 1 つも数えられていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(実装の言葉.length).toBe(形の数);
    const 区切り = "入っている。";
    const 理由 = 実装の言葉.map((言葉) => {
      const 指摘 = lintDiagram(図(`flow ${言葉}`)).issues.filter((i) => i.rule === 図の説明の規則);
      expect(指摘.length, `${言葉} が当たる形は 1 つのはず`).toBe(1);
      const 文 = 指摘[0]!.message;
      return 文.slice(文.indexOf(区切り) + 区切り.length).trim();
    });
    expect(new Set(理由).size, "2 つの言葉が同じ形に当たっている").toBe(実装の言葉.length);
  });

  it("どの型と実装の言葉の組でも、直せる数え方と自動修正の振る舞いが食い違わない", () => {
    const { ずれ, 組, 直せた } = 修正案とずれる組(型たち, 実装の言葉, lintDiagram, autoFix);
    expect(ずれ).toEqual([]);
    expect(組, "指摘の出た組が足りない (検査が空振りしている)").toBe(
      型たち.length * 実装の言葉.length,
    );
    // 直せる組が 1 つも無いと、直せる側の判定を 1 度も通らない
    expect(直せた, "直せる組が 1 つも無い (直せる側の判定を通っていない)").toBeGreaterThan(0);
  });

  it("植え込み対照: 直せないと数え直すと、直せていた組を全て見つける", () => {
    const 戻した = (d: CdlDiagram): ReturnType<typeof lintDiagram> => {
      const r = lintDiagram(d);
      return { ...r, issues: r.issues.map((i) => ({ ...i, autoFixable: false })) };
    };
    const { ずれ } = 修正案とずれる組(型たち, 実装の言葉, 戻した, autoFix);
    expect(ずれ.length, "直せていた組を 1 つも見つけていない").toBeGreaterThan(0);
    for (const 文 of ずれ) expect(文).toContain("直せているのに直せないと数えている");
  });

  it("植え込み対照: 自動修正が説明を変えないと、修正案とのずれを見つける", () => {
    const { ずれ } = 修正案とずれる組(["flow"], ["render 未実装"], lintDiagram, (d) => d);
    expect(ずれ).toEqual([
      "flow render 未実装: 修正案は 未実装、自動修正は flow render 未実装",
      "flow render 未実装: 直した説明 flow render 未実装 にまだ指摘が出る",
    ]);
  });
});
