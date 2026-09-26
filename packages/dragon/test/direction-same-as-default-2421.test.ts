/**
 * 既定と同じ向きを書いた時に知らせる (#2421)。
 *
 * ## なぜ「既定と同じ値なら素通り」 では足りないか
 *
 * **向きを書くこと自体が組み立ての経路を切り替える**。 フローは鎖をやめて書いた端のとおりに
 * 繋ぎ (`鎖にしない書き方`)、担当の図は静止図の組み立てから共通の組み立てへ回る。
 *
 * だから向きを書くと、経路が切り替わる図では絵が変わる。 既定と同じ値でも同じ。
 * 画面で突き合わせた実測 (#2424 で既定を横にする前に測ったので、書いた値は `縦`)。
 *
 * | 図 | 書かない | `direction: 縦` |
 * |---|---|---|
 * | 動きを書かないフロー | viewBox 490×539 ・ 矢印は点線 | viewBox 504×631 ・ 矢印は実線 |
 * | 動きを書いたフロー | (同じ) | (同じ) |
 *
 * 知らせを出すのは **向きの行を外しても同じ経路を通る** 時だけ。 その経路の中で向きを読むのは
 * `並べる向き` だけなので、既定と同じ値ならそこも同じ値を返し、出来上がりは 1 箇所も変わらない。
 *
 * ## 種類を分ける理由
 *
 * `direction-not-honored` は「書いた向きが捨てられた」、
 * `direction-same-as-default` は「書いた向きは効いているが、書かなくても同じ」。
 * 読み手が次に取る手が違う (書き方を変える / 行を外すか別の値を書く) ので 1 つにまとめない。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram, PRESET_TYPES } from "../src/index";
import { 既定の向き, 向きを選べる図種 } from "../src/compile/direction";
import type { CompileNotice } from "../src/compile";
import type { PresetType } from "../src/types";

/**
 * 図種ごとの既定と、その言い換え (#2424)。
 *
 * **実装から導く**。 図種の既定は変わりうる値なので (#2424 でフローを縦から横へ変えた)、
 * 検査に書き写すと片方だけ古くなる。
 */
const 既定 = (type: string): "縦" | "横" => 既定の向き(type as PresetType);
const 既定の言い換え = (type: string): string[] =>
  既定(type) === "縦" ? ["縦", "vertical"] : ["横", "horizontal"];
const 既定でない語 = (type: string): string[] =>
  既定(type) === "縦" ? ["横", "horizontal"] : ["縦", "vertical"];

type 形 = {
  type: string;
  向き: string | null;
  動き?: boolean;
  縦列?: boolean;
  端?: readonly string[];
};

/** 3 つの箱を持つ最小の記法。 向き / 動き / 縦列 / 矢印の端 を差し替えて比べる。 */
const 記法 = ({ type, 向き, 動き = false, 縦列 = false, 端 = ['A -> B: "x"', 'B -> C: "y"'] }: 形): string =>
  [
    'title: "確かめ"',
    `type: ${type}`,
    ...(向き === null ? [] : [`direction: ${向き}`]),
    "",
    "actors:",
    縦列 ? "  - A: { lane: 左 }" : "  - A",
    縦列 ? "  - B: { lane: 左 }" : "  - B",
    縦列 ? "  - C: { lane: 左 }" : "  - C",
    "",
    "flow:",
    ...端.map((e) => `  - ${e}`),
    ...(動き
      ? ["", "animation:", '  - step: "1 つ目" 1.0s', '    focus: ["A"]', '    description: "説明"']
      : []),
    "",
  ].join("\n");

/** 記法を組み、知らせと「描かれる形」 を返す。 */
function 組む(src: string): { 種類: string[]; 文: string[]; 形: string } {
  const 出た: CompileNotice[] = [];
  const d = textDslToDiagram(src, { onNotice: (n) => 出た.push(n) });
  return {
    種類: 出た.map((n) => n.kind),
    文: 出た.map((n) => n.message),
    // 描く側が読む値だけを取る。 並び (縦列と段) ・ 矢印 ・ 縦列の名前 の 3 つ
    形: JSON.stringify({
      nodes: d.nodes.map((n) => ({ t: n.title, l: n.lane, s: n.stack })),
      edges: d.edges.map((e) => ({ f: e.from, t: e.to, l: e.label, st: e.style })),
      lanes: (d.lanes ?? []).map((l) => l.label ?? l.id),
    }),
  };
}

const 同じ種類だけ = (r: { 種類: string[] }, kind: string): string[] => r.種類.filter((k) => k === kind);

describe("既定と同じ向きを書いた時の知らせ (#2421)", () => {
  it("動きを書いた図に既定の向きを書くと、1 件出る", () => {
    for (const type of ["flow", "swimlane"]) {
      for (const 向き of 既定の言い換え(type)) {
        const r = 組む(記法({ type, 向き, 動き: true }));
        expect(同じ種類だけ(r, "direction-same-as-default"), `${type} ${向き}`).toHaveLength(1);
        expect(r.文.join(" "), `${type} ${向き} の知らせに既定が読める`).toContain(
          `${既定(type)} は type: ${type} の既定`,
        );
      }
    }
  });

  it("既定と違う向きでは出ない", () => {
    // 効いている向きに「書かなくても同じ」 と言うと嘘になる
    for (const type of ["flow", "swimlane"]) {
      for (const 向き of 既定でない語(type)) {
        for (const 動き of [false, true]) {
          const r = 組む(記法({ type, 向き, 動き }));
          expect(同じ種類だけ(r, "direction-same-as-default"), `${type} ${向き} 動き=${動き}`).toEqual([]);
        }
      }
    }
  });

  it("向きを書かなければ出ない", () => {
    // 書いていない図に知らせを出すと、正しい図で毎回鳴る
    for (const type of ["flow", "swimlane"]) {
      for (const 動き of [false, true]) {
        const r = 組む(記法({ type, 向き: null, 動き }));
        expect(同じ種類だけ(r, "direction-same-as-default"), `${type} 動き=${動き}`).toEqual([]);
      }
    }
  });

  it("経路が切り替わる図では、既定と同じ値でも出ない (絵が変わるため)", () => {
    // **本 Issue の要**。 動きを書かないフローは向きを書くと鎖をやめるので、
    // 既定と同じ値でも出来上がりが変わる
    const 書いた = 組む(記法({ type: "flow", 向き: 既定("flow") }));
    const 書かない = 組む(記法({ type: "flow", 向き: null }));
    expect(書いた.形, "向きを書くと描かれる形が変わる").not.toBe(書かない.形);
    expect(同じ種類だけ(書いた, "direction-same-as-default"), "絵が変わる形では出さない").toEqual([]);
  });

  it("知らせが出る形では、向きの行を外しても描かれる形が変わらない", () => {
    // 知らせの主張そのものを測る = 「書かなくても同じ」 が本当かを出来上がりで見る
    for (const type of ["flow", "swimlane"]) {
      const 向き = 既定(type);
      const 書いた = 組む(記法({ type, 向き, 動き: true }));
      const 書かない = 組む(記法({ type, 向き: null, 動き: true }));
      expect(同じ種類だけ(書いた, "direction-same-as-default"), `${type} で知らせが出ている`).toHaveLength(1);
      expect(書いた.形, `${type} は向きの行を外しても同じ形`).toBe(書かない.形);
    }
  });

  it("全ての箱が縦列を書いた形では、捨てられた側の知らせだけが出る", () => {
    // 縦列が勝つ形は「効かない」 なので、`direction-same-as-default` に混ぜない
    const r = 組む(記法({ type: "flow", 向き: 既定("flow"), 縦列: true, 動き: true }));
    expect(同じ種類だけ(r, "direction-not-honored"), "捨てられた知らせが 1 件").toHaveLength(1);
    expect(同じ種類だけ(r, "direction-same-as-default"), "既定と同じの知らせは出さない").toEqual([]);
  });

  it("向きを選べない図種は、これまでどおり捨てられた側の知らせを出す", () => {
    // 走査した件数を併記する = 0 件が「該当なし」 か「測っていない」 かを分ける
    // 選べる側は実物から引く (#2524)。 手で並べると図種を足した日にここだけ古くなる
    const 対象 = [...PRESET_TYPES].filter((t) => !向きを選べる図種.has(t));
    expect(対象.length, "向きを選べない図種が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);
    const 既定と同じが出た: string[] = [];
    const 捨てられたが出なかった: string[] = [];
    const 測れた: string[] = [];
    const 組めなかった: string[] = [];
    for (const type of 対象) {
      let r;
      try {
        r = 組む(記法({ type, 向き: "横" }));
      } catch {
        // その図種が受け取らない本文は「測れなかった」。 0 件の側に数えない
        組めなかった.push(type);
        continue;
      }
      測れた.push(type);
      if (同じ種類だけ(r, "direction-same-as-default").length > 0) 既定と同じが出た.push(type);
      if (同じ種類だけ(r, "direction-not-honored").length !== 1) 捨てられたが出なかった.push(type);
    }
    // 母数を固定する = 組めない図種が増えた日に、0 件が「該当なし」 から「測っていない」 へ
    // すり替わるのを止める
    expect(
      測れた.length,
      `測れた ${測れた.length} 図種 / 組めなかった ${組めなかった.length} 図種 (${組めなかった.join(", ")})`,
    ).toBe(対象.length - 組めなかった.length);
    expect(測れた.length, "測れた図種が対象の半分に満たない").toBeGreaterThan(対象.length / 2);
    expect(既定と同じが出た, `測れた ${測れた.length} 図種`).toEqual([]);
    expect(捨てられたが出なかった, `測れた ${測れた.length} 図種`).toEqual([]);
  });

  it("24 図種 × 向き 4 通りを走査して、知らせと出来上がりが食い違わない", () => {
    // 植え込み対照の代わりに、主張と実物の食い違いを全件で数える。
    // 嘘 = 知らせが出たのに形が変わる / 取りこぼし = 形が同じで既定と同じ値なのに黙る
    const 嘘: string[] = [];
    const 取りこぼし: string[] = [];
    let 走査 = 0;
    for (const type of ["flow", "swimlane"]) {
      for (const 向き of ["縦", "横", "vertical", "horizontal"]) {
        for (const 動き of [false, true]) {
          for (const 縦列 of [false, true]) {
            for (const 端 of [
              ['A -> B: "x"', 'B -> C: "y"'],
              ['A -> C: "x"', 'C -> B: "y"'],
            ]) {
              走査 += 1;
              const 名 = `${type} ${向き} 動き=${動き} 縦列=${縦列} 端=${端[0]}`;
              const 書いた = 組む(記法({ type, 向き, 動き, 縦列, 端 }));
              const 書かない = 組む(記法({ type, 向き: null, 動き, 縦列, 端 }));
              const 同じ形 = 書いた.形 === 書かない.形;
              const 出た = 同じ種類だけ(書いた, "direction-same-as-default").length > 0;
              const 捨てられた = 同じ種類だけ(書いた, "direction-not-honored").length > 0;
              if (出た && !同じ形) 嘘.push(名);
              if (!出た && !捨てられた && 同じ形 && 既定の言い換え(type).includes(向き)) 取りこぼし.push(名);
            }
          }
        }
      }
    }
    expect(走査, "走査が空振りしている").toBe(64);
    expect(嘘, "知らせが出たのに出来上がりが変わる形").toEqual([]);
    expect(取りこぼし, "出来上がりが同じで既定と同じ値なのに黙る形").toEqual([]);
  });
});
