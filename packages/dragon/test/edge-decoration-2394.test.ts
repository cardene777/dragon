/*
 * 矢印に書いた色味 / 線の種類 / 出どころ側の添え字が、図種によって黙って消えていた (#2394)。
 *
 * この 3 欄は図種ごとの組み立てが個別に渡す形になっていて、渡し忘れた図種でそのまま落ちる。
 * 記法は正しく読めていて (`tone="success" style="dashed"`)、落ちるのは組み立ての側なので、
 * 書いた人には「書いたのに何も起きない」 としか見えなかった。
 *
 * 直し方は渡す側を並べるのをやめ、矢印を描く図種が必ず通る 1 か所 (`矢印へ書き写す`) に置く。
 * 図種を足した日に同じ落とし方が再発しない形にする。
 */
import { describe, expect, it } from "vitest";
import { compileToCdl, type CompileNotice } from "../src/compile";
import { PRESET_TYPES, parseTextDslV05 } from "../src/v05/parser";

/** 図種ごとに読める値。 値として読む図は語の形が決まっている */
const 読める値 = (図種: string): string =>
  図種 === "gantt" ? '"1月"' : 図種 === "journey" ? '"満足"' : 図種 === "quadrant" ? '"左上"' : "10";

/**
 * 測る矢印 (`あ -> い`) を先頭に置かない本文。
 *
 * 先頭の矢印は図種によって別の扱いを受ける (工程表の最初の帯、骨格の図の根) ため、
 * 2 本目で測る。
 */
function 本文(図種: string, 飾り: string, 括弧: string): string {
  const v = 読める値(図種);
  return `title: "しらべ"
type: ${図種}

actors:
  - ぜろ: { value: ${v} }
  - あ: { value: ${v} }
  - い: { value: ${v} }

flow:
  - ぜろ -> あ: "はじめ"
  - あ -> い${飾り}${括弧}
`;
}

type 結果 = { 図: string; 知: CompileNotice[] };

function 組む(図種: string, 飾り: string, 括弧: string): 結果 {
  const p = parseTextDslV05(本文(図種, 飾り, 括弧));
  if (!p.ok) throw new Error(`読めない本文 (${図種}): ${p.errors.map((e) => e.message).join(" / ")}`);
  const 知: CompileNotice[] = [];
  const 図 = compileToCdl(p.doc, { onNotice: (n) => 知.push(n) });
  return { 図: JSON.stringify(図), 知 };
}

/** 測る 3 欄。 **2 通りずつ書く** = 既定と同じ値を書いて空振りするのを避ける */
const 測る欄: readonly (readonly [
  名: string,
  一つ目: readonly [string, string],
  ふたつ目: readonly [string, string],
])[] = [
  ["色味", [': "つなぐ" 情報', ""], [': "つなぐ" 成功', ""]],
  ["線の種類", [': "つなぐ" dashed', ""], [': "つなぐ" dotted-flow', ""]],
  ["出どころ側の添え字", [': "つなぐ"', ' { tailSub: "い" }'], [': "つなぐ"', ' { tailSub: "ろ" }']],
];

/** 素の本文で既に「矢印を描けません」 と伝えている図種か (飾りも含めて伝わっている) */
const 矢印そのものを伝える = (素: 結果): boolean =>
  素.知.some((n) => n.message.includes("矢印を描けません"));

describe("矢印に書いた飾りが図種ごとに消えない (#2394)", () => {
  it("全ての図種 × 3 欄で、図も変わらず知らせも出ない組み合わせが無い", () => {
    /*
     * **図種の一覧は記法から取る** = 検査側に写すと、図種を足した日に片方だけ古くなる。
     *
     * 4 区分に分ける。 効く (図が変わる) / 知らせる / 矢印そのものを伝える / 黙る。
     * 黙るだけが穴で、残り 3 つは「書いた人に何かが届いている」 状態。
     */
    const 区分: Record<string, string[]> = { 効く: [], 知らせる: [], 矢印そのもの: [], 黙る: [] };
    for (const 図種 of [...PRESET_TYPES].sort()) {
      const 素 = 組む(図種, ': "つなぐ"', "");
      for (const [名, [f1, k1], [f2, k2]] of 測る欄) {
        const 一 = 組む(図種, f1, k1);
        const 二 = 組む(図種, f2, k2);
        const 札 = `${図種}/${名}`;
        if (一.図 !== 二.図) 区分.効く!.push(札);
        else if (二.知.some((n) => !素.知.some((m) => m.message === n.message))) 区分.知らせる!.push(札);
        else if (矢印そのものを伝える(素)) 区分.矢印そのもの!.push(札);
        else 区分.黙る!.push(札);
      }
    }
    expect(区分.黙る, "書いても図が変わらず知らせも出ない組み合わせ").toEqual([]);
    // 空振り防止 = 3 区分とも 1 件以上あることを見る。 全部が 1 区分に寄ったら測れていない
    expect(区分.効く!.length, "効く側が 0 件 (走査が空振りしている)").toBeGreaterThan(0);
    expect(区分.知らせる!.length, "知らせる側が 0 件 (走査が空振りしている)").toBeGreaterThan(0);
    expect(区分.矢印そのもの!.length, "矢印を描けないと伝える側が 0 件").toBeGreaterThan(0);
  });

  it("鎖でつないだ流れ図で色味と線の種類が届く", () => {
    /*
     * 静止した `type: flow` は箱を鎖の形で並べる。 その経路は組み立てに説明文しか渡さず、
     * 色味も線の種類も落ちていた (実測 = 書いても `tone=accent style=dotted-flow` のまま)。
     */
    const p = parseTextDslV05(本文("flow", ': "つなぐ" 成功 dashed', ""));
    if (!p.ok) throw new Error("読めない本文");
    const d = compileToCdl(p.doc);
    const 矢印 = d.edges.find((e) => e.to === "い");
    expect(矢印, "測る矢印が無い (検査が空振りしている)").toBeDefined();
    expect(矢印?.tone).toBe("success");
    expect(矢印?.style).toBe("dashed");
  });

  it("線の種類が消えていた 3 図種で 2 通りに分かれる", () => {
    const 違う: string[] = [];
    for (const 図種 of ["er", "flow", "state"]) {
      const 取る = (語: string): string | undefined => {
        const p = parseTextDslV05(本文(図種, `: "つなぐ" ${語}`, ""));
        if (!p.ok) throw new Error(`読めない本文 (${図種})`);
        return compileToCdl(p.doc).edges.find((e) => e.to === "い")?.style;
      };
      const a = 取る("dashed");
      const b = 取る("dotted-flow");
      if (a !== "dashed" || b !== "dotted-flow") 違う.push(`${図種}: ${String(a)} / ${String(b)}`);
    }
    expect(違う, "図種 3 通り").toEqual([]);
  });

  it("出どころ側の添え字が、矢印を描く 6 図種で端の字になる", () => {
    const 違う: string[] = [];
    for (const 図種 of ["c4", "er", "flow", "state", "swimlane", "topology"]) {
      const p = parseTextDslV05(本文(図種, ': "つなぐ"', ' { tailSub: "1" }'));
      if (!p.ok) throw new Error(`読めない本文 (${図種})`);
      const 矢印 = compileToCdl(p.doc).edges.find((e) => e.to === "い");
      if (矢印?.tailLabel !== "1") 違う.push(`${図種}: ${String(矢印?.tailLabel)}`);
    }
    expect(違う, "図種 6 通り").toEqual([]);
  });

  it("クラス図の出どころ側の添え字は端に 1 度だけ出る", () => {
    /*
     * クラス図の組み立ては `tailCardinality` として渡しており、engine が端に置く。
     * 共通の書き写しがそこへ重ねると同じ字が 2 か所に出るので、クラス図だけ外している。
     */
    const p = parseTextDslV05(本文("class", ': "つなぐ"', ' { tailSub: "1" }'));
    if (!p.ok) throw new Error("読めない本文");
    const 矢印 = compileToCdl(p.doc).edges.find((e) => e.to === "い");
    expect(矢印?.tailLabel, "端の字が出ていない (検査が空振りしている)").toBe("1");
    expect(矢印?.sub, "札の下の行にも同じ字が出ている").toBeUndefined();
    expect(矢印?.label, "札にも同じ字が出ている").toBe("つなぐ");
  });

  it("陰性対照: 3 欄を書かない矢印は既定のまま", () => {
    const 違う: string[] = [];
    for (const 図種 of ["c4", "er", "flow", "state", "swimlane", "topology", "class"]) {
      const p = parseTextDslV05(本文(図種, ': "つなぐ"', ""));
      if (!p.ok) throw new Error(`読めない本文 (${図種})`);
      const 矢印 = compileToCdl(p.doc).edges.find((e) => e.to === "い");
      if (矢印 === undefined) 違う.push(`${図種}: 矢印が無い`);
      else if (矢印.tailLabel !== undefined) 違う.push(`${図種}: 端の字が入った`);
    }
    expect(違う, "図種 7 通り").toEqual([]);
  });

  it("矢印を描かない図種は今までどおり効かないと伝える", () => {
    /*
     * 直した側が広がりすぎて、伝える側を消していないかを見る。
     * 骨格の図 / 工程表は矢印の知らせ、板は言づての知らせで 3 欄を並べる。
     */
    const 足りない: string[] = [];
    for (const 図種 of ["tree", "mind", "gantt", "sequence", "solidity"]) {
      const { 知 } = 組む(図種, ': "つなぐ" 成功 dashed', ' { tailSub: "1" }');
      const 文 = 知.map((n) => n.message).join("\n");
      for (const 語 of ["色味", "線の種類", "出どころ側の添え字"]) {
        if (!文.includes(語)) 足りない.push(`${図種}: ${語}`);
      }
    }
    expect(足りない, "図種 5 通り × 欄 3 件").toEqual([]);
  });

  it("同じ 2 点を 2 本書いた図でも、それぞれの飾りが別々に届く", () => {
    /*
     * 書き写しは行と矢印を出現順に 1 本ずつ対応させる。 同じ 2 点を 2 本書いた図で
     * 片方の飾りがもう片方に付いたり、2 本目が取りこぼされたりしないことを見る。
     */
    const src = `title: "しらべ"
type: topology

actors:
  - あ
  - い

flow:
  - あ -> い: "ひとつ" 成功 dashed
  - あ -> い: "ふたつ" 情報 dotted-flow
`;
    const p = parseTextDslV05(src);
    if (!p.ok) throw new Error("読めない本文");
    const edges = compileToCdl(p.doc).edges;
    expect(edges.length, "矢印が 2 本無い (検査が空振りしている)").toBe(2);
    expect(edges.map((e) => [e.label, e.tone, e.style])).toEqual([
      ["ひとつ", "success", "dashed"],
      ["ふたつ", "info", "dotted-flow"],
    ]);
  });

  it("縦列を書いた流れ図でも色味と線の種類が届く", () => {
    /*
     * 縦列を書いた形は鎖ではなく共通の組み立てへ回る。 経路が分かれるので両方を見る。
     */
    const src = `title: "しらべ"
type: flow

lanes:
  main: { label: "まとめ" }

actors:
  - あ: { lane: main }
  - い: { lane: main }

flow:
  - あ -> い: "つなぐ" 成功 dashed { tailSub: "1" }
`;
    const p = parseTextDslV05(src);
    if (!p.ok) throw new Error("読めない本文");
    const 矢印 = compileToCdl(p.doc).edges.find((e) => e.to === "い");
    expect(矢印, "測る矢印が無い (検査が空振りしている)").toBeDefined();
    expect([矢印?.tone, 矢印?.style, 矢印?.tailLabel]).toEqual(["success", "dashed", "1"]);
  });
});
