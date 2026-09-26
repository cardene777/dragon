/*
 * 板の箱に体験と工程の欄を書いた時、知らせを 1 件にする (#2380)。
 *
 * 担当 / 終わる時期 / 接点 / 伸びしろ は `reportChartFieldsNotHonored` が受け持つ。
 * 板の知らせ (`actor-kind-not-honored`) が同じ欄を重ねて伝えると、1 つの欄が 2 つの名前で
 * 呼ばれ、しかも案内が食い違う (板は「箱を持つ図種へ」、工程は「type: gantt へ」)。
 *
 * 4 欄の一覧は `体験と工程の欄` が持つ (実装が SSOT)。 検査側で写すと、5 つ目を足した日に
 * 片方だけ古くなる。
 */
import { describe, expect, it } from "vitest";
import { compileToCdl } from "../src/compile";
import {
  体験と工程の欄,
  値として読む図が伝えない箱の欄,
  値として読む図種,
  木の図が伝えない箱の欄,
  板が伝えない箱の欄,
  骨組みの図が伝えない箱の欄,
  骨組みの図種,
} from "../src/compile/actor-option-notice";
import { parseTextDslV05 } from "../src/v05/parser";

/** 板の 2 図種。 `reportActorKindNotHonored` が対象にする図種と同じ */
const 板の図種 = ["sequence", "solidity"] as const;

/** 4 欄の書き方。 一覧は実装から取り、値だけをここで決める */
const 書き方: Record<string, string> = {
  owner: 'owner: "だれか"',
  end: 'end: "4月"',
  touchpoint: 'touchpoint: "まど"',
  opportunity: 'opportunity: "のびしろ"',
};

/** 板が伝える側に残る欄。 4 欄を除いても板の知らせが痩せていないことの対照 */
const 板が伝える欄: readonly (readonly [string, string])[] = [
  ["色", "tone: info"],
  ["行", 'rows: ["よむ"]'],
  ["小見出し", 'eyebrow: "みだし"'],
  ["値", "value: 10"],
];

function 本文(図種: string, 箱の欄: string): string {
  const 欄 = 箱の欄 === "" ? "" : `: { ${箱の欄} }`;
  return `title: "しらべ"
type: ${図種}

actors:
  - あ${欄}
  - い

flow:
  - あ -> い: "つなぐ"
`;
}

type 知 = { kind: string; line: number; message: string; hint?: string };

function 組む(src: string): 知[] {
  const p = parseTextDslV05(src);
  if (!p.ok) throw new Error(`読めない本文: ${p.errors.map((e) => e.message).join(" / ")}`);
  const 知らせ: 知[] = [];
  compileToCdl(p.doc, {
    onNotice: (n) => 知らせ.push({ kind: n.kind, line: n.line, message: n.message, hint: n.hint }),
  });
  return 知らせ;
}

/** 最初の箱の行に出た知らせ。 素の本文でも出る知らせは差し引く */
function 箱の知らせ(図種: string, 箱の欄: string): 知[] {
  const 素 = 組む(本文(図種, ""));
  return 組む(本文(図種, 箱の欄)).filter(
    (n) => !素.some((s) => s.kind === n.kind && s.line === n.line),
  );
}

const 四欄 = [...体験と工程の欄];

describe("板の箱に体験と工程の欄を書いた時の知らせ (#2380)", () => {
  it("4 欄を走査できていて、書き方を全部持っている (空振り防止)", () => {
    expect(四欄.length, "体験と工程の欄が空").toBeGreaterThan(0);
    const 持たない = 四欄.filter((欄) => 書き方[欄] === undefined);
    expect(持たない, "検査が書き方を持たない欄").toEqual([]);
  });

  it("板の箱に 4 欄を書くと、その行の知らせが 1 件だけ", () => {
    const 違う: string[] = [];
    for (const 図種 of 板の図種) {
      for (const 欄 of 四欄) {
        const 知 = 箱の知らせ(図種, 書き方[欄]!);
        if (知.length !== 1) 違う.push(`${図種} / ${欄}: ${知.map((n) => n.kind).join(" + ")}`);
      }
    }
    expect(違う, `図種 ${板の図種.length} 件 × 欄 ${四欄.length} 件`).toEqual([]);
  });

  it("残る 1 件はガントチャートと体験の地図を案内する側", () => {
    const 違う: string[] = [];
    for (const 図種 of 板の図種) {
      for (const 欄 of 四欄) {
        const 知 = 箱の知らせ(図種, 書き方[欄]!);
        const 残り = 知[0];
        if (残り === undefined || 残り.kind !== "chart-value-unreadable") {
          違う.push(`${図種} / ${欄}: ${残り?.kind ?? "知らせ無し"}`);
          continue;
        }
        if (!残り.message.includes(欄)) 違う.push(`${図種} / ${欄}: 文に欄名が無い "${残り.message}"`);
        const 行き先 = 欄 === "owner" || 欄 === "end" ? "type: gantt" : "type: journey";
        if (!(残り.hint ?? "").includes(行き先)) {
          違う.push(`${図種} / ${欄}: 案内が ${行き先} でない "${残り.hint ?? ""}"`);
        }
      }
    }
    expect(違う, `図種 ${板の図種.length} 件 × 欄 ${四欄.length} 件`).toEqual([]);
  });

  it("板が伝える他の欄は、従来どおり板の知らせが 1 件出る", () => {
    // 4 欄を除いた結果、板の知らせ自体が痩せていないことの対照
    const 出ない: string[] = [];
    for (const 図種 of 板の図種) {
      for (const [名, 書く] of 板が伝える欄) {
        const 知 = 箱の知らせ(図種, 書く).filter((n) => n.kind === "actor-kind-not-honored");
        if (知.length !== 1) 出ない.push(`${図種} / ${名}: ${知.length} 件`);
      }
    }
    expect(出ない, `図種 ${板の図種.length} 件 × 欄 ${板が伝える欄.length} 件`).toEqual([]);
  });

  it("4 欄はどの族の除外にも入っている (実装から導く)", () => {
    /*
     * 箱の知らせは図種の族ごとに「伝えない欄」 の集合を持つ。 4 欄は別の知らせが受け持つので、
     * どの族も伝えてはいけない。 族の集合を実装から取り出して突き合わせる。
     */
    const 族: (readonly [string, ReadonlySet<string>])[] = [
      ["板", 板が伝えない箱の欄],
      ["木の図", 木の図が伝えない箱の欄],
      ...[...値として読む図種.keys()].map(
        (t) => [`値として読む図/${t}`, 値として読む図が伝えない箱の欄(t)] as const,
      ),
      ...[...骨組みの図種.keys()].map(
        (t) => [`骨組みの図/${t}`, 骨組みの図が伝えない箱の欄(t)] as const,
      ),
    ];
    expect(族.length, "族を 1 件も拾えていない (空振り)").toBeGreaterThan(2);
    const 欠け: string[] = [];
    for (const [名, 集合] of 族) {
      for (const 欄 of 四欄) if (!集合.has(欄)) 欠け.push(`${名}: ${欄}`);
    }
    expect(欠け, `族 ${族.length} 件 × 欄 ${四欄.length} 件`).toEqual([]);
  });

  it("4 欄はどの図種に書いても、同じ行に知らせが 2 件並ばない", () => {
    const 図種一覧 = [...板の図種, ...骨組みの図種.keys(), ...値として読む図種.keys(), "tree", "mind"];
    const 並んだ: string[] = [];
    let 走査 = 0;
    for (const 図種 of 図種一覧) {
      for (const 欄 of 四欄) {
        走査 += 1;
        const 行ごと = new Map<number, string[]>();
        for (const n of 箱の知らせ(図種, 書き方[欄]!)) {
          行ごと.set(n.line, [...(行ごと.get(n.line) ?? []), n.kind]);
        }
        for (const [行, 種] of 行ごと) {
          if (種.length > 1) 並んだ.push(`${図種} / ${欄}: 行 ${行} に ${種.join(" + ")}`);
        }
      }
    }
    expect(走査, "走査が 0 件 (空振り)").toBeGreaterThan(0);
    expect(並んだ, `走査 ${走査} 件 (図種 ${図種一覧.length} 件 × 欄 ${四欄.length} 件)`).toEqual([]);
  });
});
