/**
 * 記法の検査の自動修正が書く図の説明が、カタログの図の型の名前と同じ呼び名を使うことの検証 (#1934)。
 *
 * 自動修正 (`autoFix`) は、図の説明が型の名前 (`gantt` など) で始まる時に日本語の説明へ書き換える。
 * 書き換え先の表は記法の package (`packages/dragon/src/notation-lint.ts`) が持ち、カタログの名前は
 * 画面側 (`ITEM_NAME_JA`) が持つ。 package は画面側の file を読まないので、2 つを照らす検査をここに置く。
 *
 * 直す前は、自動修正が書く説明とカタログの名前が別の呼び名になっていた。 名前を差し替えるだけだと
 * `ガントチャート を示す図` のように図が重なるので、説明のほうを型ごとに書き下している。
 *
 * 同じ型の一覧で、図の説明の指摘の修正案が自動修正の書く説明と一致することも確かめる (#1942)。
 * package 側の検査は説明 4 通りしか入力にしないので、全ての型と実装の言葉の組はここで回す。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { autoFix, lintDiagram } from "@cardenelabs/dragon";
import { ITEM_NAME_JA } from "./i18n";
import { 残るカタカナ語 } from "./screen-words";

const 記法の検査 = readFileSync(
  fileURLToPath(new URL("../../../../packages/dragon/src/notation-lint.ts", import.meta.url)),
  "utf8",
);

/**
 * カタログに同じ型の見本が無い型と、その理由。
 *
 * 照らす相手が無いので名前の照合から外す。 **1 件ごとに理由を書く** = 名前だけ並べると、
 * 照合に落ちた型を 1 行足すだけで黙らせられる。 外した型も図の重なりとカタカナ語の検査には入れる。
 */
export const 見本の無い型: Record<string, string> = {
  chart:
    "型を決めない図表の総称。 カタログは円グラフと折れ線グラフを別々の見本で置き、総称の見本は無い",
  "bar chart": "カタログに棒グラフの見本が無い (図表の見本は円グラフと折れ線グラフの 2 つ)",
};

/** 自動修正が書き換える型。 検出の正規表現 (`topic.match(/^\s*(…)\b/i)`) の選択肢を読む */
export function 書き換える型(src: string): string[] {
  const 選択肢 = /topic\.match\(\s*\/\^\\s\*\(([^)]*)\)\\b\/i/.exec(src)?.[1];
  if (選択肢 === undefined) return [];
  return 選択肢.split("|").flatMap((語) => {
    const 省ける = /^(.*)(.)\?$/.exec(語);
    return 省ける ? [省ける[1]!, 省ける[1]! + 省ける[2]!] : [語];
  });
}

/** 書き換え先の表 (`KIND_TO_JA`) が持つ型 */
export function 表の型(src: string): string[] {
  const 表 = /const KIND_TO_JA[^=]*=\s*\{([\s\S]*?)\n\};/.exec(src)?.[1] ?? "";
  return [...表.matchAll(/^\s+"?([A-Za-z0-9 ]+?)"?:\s*\{/gm)].map((m) => m[1]!);
}

/** 型に対応する見本の鍵。 `gantt` → `presetGantt`、`line chart` → `presetChartLine` */
export function 見本の鍵(型: string): string {
  const 語 = 型.split(" ").reverse();
  return `preset${語.map((w) => w[0]!.toUpperCase() + w.slice(1)).join("")}`;
}

function 図(topic: string): CdlDiagram {
  return { id: "d", topic, nodes: [], edges: [] } as unknown as CdlDiagram;
}

function 書き換え(topic: string): string {
  return autoFix(図(topic)).topic;
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
 * 型と実装の言葉の組ごとに、図の説明の指摘が自動修正と食い違うもの。
 *
 * 見るのは 3 つ。 自動修正できると数えているか、修正案が自動修正の書く説明そのものか、
 * 直した説明にもう指摘が出ないか。 3 つ目が崩れると、道具が直せる数に入れた指摘が直した後も残る。
 */
export function 修正案とずれる組(
  型たち: readonly string[],
  言葉たち: readonly string[],
  検査: (d: CdlDiagram) => ReturnType<typeof lintDiagram>,
  直す: (d: CdlDiagram) => CdlDiagram,
): { ずれ: string[]; 組: number } {
  const ずれ: string[] = [];
  let 組 = 0;
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
      for (const i of 指摘) {
        if (!i.autoFixable) ずれ.push(`${d.topic}: 自動修正できると数えていない`);
        if (i.suggestion !== 直した.topic) {
          ずれ.push(`${d.topic}: 修正案は ${i.suggestion}、自動修正は ${直した.topic}`);
        }
      }
      if (検査(直した).issues.some((i) => i.rule === 図の説明の規則)) {
        ずれ.push(`${d.topic}: 直した説明 ${直した.topic} にまだ指摘が出る`);
      }
    }
  }
  return { ずれ, 組 };
}

/**
 * カタログに同じ型の見本がある型のうち、書き換えた説明がカタログの名前で終わらないもの。
 *
 * 「含む」 ではなく「`を示す` の直後から末尾までが名前ちょうど」 で見る。 含むだけだと
 * `状態遷移図 を示す図` のように名前の後ろへ別の図の名前を足した形も通り、末尾だけを見ると
 * カタログの名前が `線グラフ` に変わっても `折れ線グラフ` で通る。
 */
export function 名前とずれる型(
  型たち: readonly string[],
  書き換える: (topic: string) => string,
  名前表: Record<string, string>,
): { ずれ: string[]; 照らした: number } {
  const ずれ: string[] = [];
  let 照らした = 0;
  for (const 型 of 型たち) {
    const 名前 = 名前表[見本の鍵(型)];
    if (名前 === undefined) continue;
    照らした++;
    const 説明 = 書き換える(型);
    if (!説明.endsWith(`を示す${名前}`)) ずれ.push(`${型}: ${説明} (カタログは ${名前})`);
  }
  return { ずれ, 照らした };
}

const 型たち = 書き換える型(記法の検査);

describe("自動修正が書く図の説明とカタログの名前 (#1934)", () => {
  it("書き換える型と書き換え先の表の型が同じ", () => {
    expect(
      型たち.length,
      "書き換える型を 1 つも読めていない (検査が空振りしている)",
    ).toBeGreaterThan(0);
    expect([...表の型(記法の検査)].sort()).toEqual([...型たち].sort());
  });

  it("見本の無い型は、カタログに同じ型の見本が無い型と同じ", () => {
    const 無い = 型たち.filter((型) => !Object.hasOwn(ITEM_NAME_JA, 見本の鍵(型)));
    expect(無い.sort()).toEqual(Object.keys(見本の無い型).sort());
  });

  it("カタログに同じ型の見本がある型は、書き換えた説明が「…を示す{カタログの名前}」 で終わる", () => {
    const { ずれ, 照らした } = 名前とずれる型(型たち, 書き換え, ITEM_NAME_JA);
    expect(照らした, "カタログの名前と 1 つも照らせていない (検査が空振りしている)").toBe(
      型たち.length - Object.keys(見本の無い型).length,
    );
    expect(ずれ).toEqual([]);
  });

  it("どの型でも図が重ならない", () => {
    const 重なる = 型たち.map(書き換え).filter((説明) => /図\s*を示す/.test(説明));
    expect(重なる).toEqual([]);
  });

  it("書き換えた説明に、残す語の一覧の外のカタカナ語が無い", () => {
    expect(残るカタカナ語(型たち.map(書き換え).join("\n"))).toEqual([]);
  });

  it("植え込み対照: カタログの名前が変わると、書き換えた説明の末尾と重なる名前でもずれとして見つける", () => {
    // 植え込む名前は **いまの名前と違うもの** にする。 同じ名前を置くとずれが生まれず、
    // 検査が空振りしていることに気付けない (#2550 で `工程表` から `ガントチャート` へ
    // 変えた時、植え込みが `ガントチャート` のままで 1 件しか出なくなった)
    const 変えた = { ...ITEM_NAME_JA, presetGantt: "工程表", presetChartLine: "線グラフ" };
    expect(名前とずれる型(型たち, 書き換え, 変えた).ずれ).toEqual([
      "gantt: 作業の期間と前後の関係を示すガントチャート (カタログは 工程表)",
      "line chart: 値の移り変わりを示す折れ線グラフ (カタログは 線グラフ)",
    ]);
  });

  it("植え込み対照: 名前の後ろに図を足す旧い文型は、名前を含んでもずれとして見つける", () => {
    const 旧い = (型: string): string => `${ITEM_NAME_JA[見本の鍵(型)] ?? 型} を示す図`;
    const { ずれ } = 名前とずれる型(["gantt", "stateMachine"], 旧い, ITEM_NAME_JA);
    expect(ずれ).toEqual([
      "gantt: ガントチャート を示す図 (カタログは ガントチャート)",
      "stateMachine: 状態遷移図 を示す図 (カタログは 状態遷移図)",
    ]);
  });

  it("植え込み対照: 省ける字 (`?`) を持つ選択肢は両方の型に開く", () => {
    const src =
      "const kindMatch = topic.match(\n    /^\\s*(flow|stateMachine2?|line chart)\\b/i,\n  );";
    expect(書き換える型(src)).toEqual(["flow", "stateMachine", "stateMachine2", "line chart"]);
  });
});

describe("図の説明の指摘の修正案と自動修正 (#1942)", () => {
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

  it("どの型と実装の言葉の組でも、修正案は自動修正が書く説明そのもので、直した説明に指摘が残らない", () => {
    expect(
      型たち.length,
      "書き換える型を 1 つも読めていない (検査が空振りしている)",
    ).toBeGreaterThan(0);
    const { ずれ, 組 } = 修正案とずれる組(型たち, 実装の言葉, lintDiagram, autoFix);
    expect(ずれ).toEqual([]);
    expect(組, "指摘の出た組が足りない (検査が空振りしている)").toBe(
      型たち.length * 実装の言葉.length,
    );
  });

  it("植え込み対照: 1 つの型だけ修正案を固定の文にして直せないと数えると、その型の組を全て見つける", () => {
    const 固定の文 = "何を示す図かを文で書き直す";
    const 戻した = (d: CdlDiagram): ReturnType<typeof lintDiagram> => {
      const r = lintDiagram(d);
      if (!d.topic.startsWith("gantt ")) return r;
      return {
        ...r,
        issues: r.issues.map((i) => ({ ...i, suggestion: 固定の文, autoFixable: false })),
      };
    };
    expect(修正案とずれる組(型たち, 実装の言葉, 戻した, autoFix).ずれ).toEqual(
      実装の言葉.flatMap((言葉) => [
        `gantt ${言葉}: 自動修正できると数えていない`,
        `gantt ${言葉}: 修正案は ${固定の文}、自動修正は 作業の期間と前後の関係を示すガントチャート`,
      ]),
    );
  });

  it("植え込み対照: 自動修正が説明を変えないと、修正案とのずれと直した後の指摘の両方を見つける", () => {
    const { ずれ } = 修正案とずれる組(["er"], ["polygon"], lintDiagram, (d) => d);
    expect(ずれ).toEqual([
      "er polygon: 修正案は 表どうしの関係を示すER図、自動修正は er polygon",
      "er polygon: 直した説明 er polygon にまだ指摘が出る",
    ]);
  });
});
