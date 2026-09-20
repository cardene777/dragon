/*
 * 箱を並べて線で繋ぐ図で、箱に書いた指定が使われないことを伝える (#2376)。
 *
 * 状態遷移図は `initial: true` を読んで「初期」 の札を出す。 同じ記法を流れ図に書いても
 * 何も起きず、知らせも出なかった (実測 = 見本 447 枚すべて)。
 *
 * 対象の図種と読まない欄は `骨組みの図種` が持つ (実装が SSOT)。 一覧を検査側で写すと、
 * 図種を足した日に片方だけ古くなる。
 */
import { describe, expect, it } from "vitest";
import { compileToCdl } from "../src/compile";
import { 骨組みの図種, 骨組みの図が伝えない箱の欄 } from "../src/compile/actor-option-notice";
import { parseTextDslV05 } from "../src/v05/parser";

/**
 * 図種ごとに、その図種が読める最小の本文を作る。
 *
 * **測る箱 (`あ`) を先頭にも末尾にも置かない** (#2382)。 状態遷移図は並びから始まりと
 * 終わりを決めるので、先頭の箱に始まりの印を書いても図が変わらない = 読む欄の対照が
 * 空振りする (実測で `initial` が「読むのに図が変わらない」 と出た)。
 */
function 本文(図種: string, 箱の欄: string): string {
  const 欄 = 箱の欄 === "" ? "" : `: { ${箱の欄} }`;
  if (図種 === "swimlane") {
    return `title: "しらべ"
type: swimlane

lanes:
  main: { label: "まとめ" }

actors:
  - ぜろ: { lane: main }
  - あ: { lane: main${箱の欄 === "" ? "" : `, ${箱の欄}`} }
  - い: { lane: main }

flow:
  - ぜろ -> あ: "はじめ"
  - あ -> い: "つなぐ"
`;
  }
  if (図種 === "class") {
    return `title: "しらべ"
type: class

actors:
  - ぜろ: { rows: ["+ はじめ()"] }
  - あ: { rows: ["+ よむ()"]${箱の欄 === "" ? "" : `, ${箱の欄}`} }
  - い: { rows: ["+ かく()"] }

flow:
  - ぜろ -> あ: "はじめる"
  - あ -> い: "つかう"
`;
  }
  return `title: "しらべ"
type: ${図種}

actors:
  - ぜろ
  - あ${欄}
  - い

flow:
  - ぜろ -> あ: "はじめ"
  - あ -> い: "つなぐ"
`;
}

type 知 = { kind: string; line: number; message: string; hint?: string };

function 組む(src: string): { 知: 知[]; 図: ReturnType<typeof compileToCdl> } {
  const p = parseTextDslV05(src);
  if (!p.ok) throw new Error(`読めない本文: ${p.errors.map((e) => e.message).join(" / ")}`);
  const 知: 知[] = [];
  const 図 = compileToCdl(p.doc, {
    onNotice: (n) => 知.push({ kind: n.kind, line: n.line, message: n.message, hint: n.hint }),
  });
  return { 知, 図 };
}

/** 最初の箱の行に出た知らせ。 行番号は本文の作りで変わるので、箱の名前で引く */
function 箱の知らせ(図種: string, 箱の欄: string): 知[] {
  const { 知 } = 組む(本文(図種, 箱の欄));
  const 素 = 組む(本文(図種, "")).知;
  return 知.filter((n) => !素.some((s) => s.kind === n.kind && s.line === n.line));
}

const 図種一覧 = [...骨組みの図種.keys()];

/**
 * 共通に読まない欄。 書くと知らせが 1 件出る。
 *
 * 欄の名前を添えるのは、図種ごとに読む欄 (`骨組みの図種` の `読む`) を差し引くため (#2382)。
 * 差し引く一覧を検査側に写すと、族に図種を足した日に片方だけ古くなる。
 */
const 読まない欄: readonly (readonly [string, string, string])[] = [
  ["始まりの印", "initial", "initial: true"],
  ["終わりの印", "final", "final: true"],
  ["前の値", "previous", "previous: 2"],
  // 行 (`rows`) と組にした形は別に見る (読み替えられる図種では効く)
  ["印", "marks", "marks: [ok]"],
];

/** その図種が読む欄を差し引いた、読まない欄の一覧 */
function その図種が読まない欄(図種: string): readonly (readonly [string, string, string])[] {
  const 読む = 骨組みの図種.get(図種)?.読む ?? [];
  return 読まない欄.filter(([, 欄]) => !読む.includes(欄));
}

/** どの図種も読む欄。 書いても知らせは出ず、図が変わる */
const 読む欄: readonly (readonly [string, string])[] = [
  ["呼び名", 'subtitle: "そえ"'],
  ["小見出し", 'eyebrow: "みだし"'],
  ["色味", "tone: info"],
  ["透け具合", "opacity: 0.5"],
];

describe("骨組みの図で箱に書いた指定が使われないことを伝える (#2376)", () => {
  it("対象の図種を走査できている (空振り防止)", () => {
    expect(図種一覧.length, "図種を 1 件も拾えていない").toBeGreaterThan(0);
  });

  it("素の本文は読めて、箱の知らせが 1 件も出ない", () => {
    const 出た = 図種一覧
      .map((t) => ({ t, 知: 組む(本文(t, "")).知.filter((n) => n.kind === "actor-option-not-honored") }))
      .filter(({ 知 }) => 知.length > 0)
      .map(({ t, 知 }) => `${t}: ${知.map((n) => n.message).join(" / ")}`);
    expect(出た, `図種 ${図種一覧.length} 件`).toEqual([]);
  });

  it("読まない欄を書くと、その行に知らせが 1 件出る", () => {
    const 出ない: string[] = [];
    let 走査 = 0;
    for (const t of 図種一覧) {
      for (const [名, , 書く] of その図種が読まない欄(t)) {
        走査 += 1;
        const 知 = 箱の知らせ(t, 書く).filter((n) => n.kind === "actor-option-not-honored");
        if (知.length !== 1) 出ない.push(`${t} / ${名}: ${知.length} 件`);
      }
    }
    expect(走査, "走査が 0 件 (空振り)").toBeGreaterThan(0);
    expect(出ない, `走査 ${走査} 件 (図種 ${図種一覧.length} 件)`).toEqual([]);
  });

  it("読まない欄の呼び名が知らせの文に出る", () => {
    const 出ない: string[] = [];
    for (const t of 図種一覧) {
      for (const [名, , 書く] of その図種が読まない欄(t)) {
        const 文 = 箱の知らせ(t, 書く).find((n) => n.kind === "actor-option-not-honored")?.message ?? "";
        if (!文.includes(名)) 出ない.push(`${t} / ${名}: "${文}"`);
      }
    }
    expect(出ない, `図種 ${図種一覧.length} 件`).toEqual([]);
  });

  it("案内は伝えた欄の行き先だけを書く (#2382)", () => {
    /*
     * 3 つの行き先を並べた 1 文を固定で添えていた間、状態遷移図では 2 つが誤りになっていた。
     * 伝えていない欄の行き先が案内に混ざらないことを、欄ごとに見る。
     */
    const 混ざらない: readonly (readonly [string, string])[] = [
      // 伝えた欄 (呼び名) → その欄を伝えていない時に案内へ出てはいけない語
      ["始まりの印", "前の値"],
      ["前の値", "始まりと終わりの印"],
      ["印", "前の値"],
    ];
    const 出た: string[] = [];
    let 走査 = 0;
    for (const t of 図種一覧) {
      for (const [名, , 書く] of その図種が読まない欄(t)) {
        const 出てはいけない = 混ざらない.find(([欄]) => 欄 === 名)?.[1];
        if (出てはいけない === undefined) continue;
        走査 += 1;
        const 案内 = 箱の知らせ(t, 書く).find((n) => n.kind === "actor-option-not-honored")?.hint ?? "";
        if (案内.includes(出てはいけない)) 出た.push(`${t} / ${名}: "${案内}"`);
      }
    }
    expect(走査, "走査が 0 件 (空振り)").toBeGreaterThan(0);
    expect(出た, `走査 ${走査} 件`).toEqual([]);
  });

  it("印の案内は、その図種が印を読むかで分かれる (#2382)", () => {
    /*
     * 印を読む図種で足りないのは行 (`rows`) のほうなので、別の図種へ移せとは案内しない。
     * どの図種が読むかは `行頭の印にする` が決めるので、検査側で一覧を写さず図の変化で分ける。
     */
    const 違う: string[] = [];
    let 読む図種 = 0;
    let 読まない図種 = 0;
    for (const t of 図種一覧) {
      if (!その図種が読まない欄(t).some(([, 欄]) => 欄 === "marks")) continue;
      const 行つき = t === "class" ? "marks: [ok]" : 'rows: ["よむ"], marks: [ok]';
      const 印なし = 行つき.replace(/,?\s*marks: \[ok\]/, "");
      const 読む =
        JSON.stringify(組む(本文(t, 行つき)).図) !== JSON.stringify(組む(本文(t, 印なし)).図);
      const 案内 = 箱の知らせ(t, "marks: [ok]").find((n) => n.kind === "actor-option-not-honored")?.hint ?? "";
      if (読む) {
        読む図種 += 1;
        if (!案内.includes("rows")) 違う.push(`${t}: 印を読むのに行を足す案内が無い "${案内}"`);
        if (案内.includes("type:")) 違う.push(`${t}: 印を読むのに別の図種へ移す案内 "${案内}"`);
      } else {
        読まない図種 += 1;
        if (!案内.includes("type:")) 違う.push(`${t}: 印を読まないのに図種の案内が無い "${案内}"`);
      }
    }
    expect(違う, `図種 ${図種一覧.length} 件`).toEqual([]);
    expect(読む図種, "印を読む図種が 0 件 (空振り)").toBeGreaterThan(0);
    expect(読まない図種, "印を読まない図種が 0 件 (空振り)").toBeGreaterThan(0);
  });

  it("行き先を持たない欄には案内を付けない (#2382)", () => {
    // 段 (`stack`) は移す先が無い。 当たり障りのない 1 文で埋めない
    const 書き方: Record<string, string> = { stack: "stack: 1", kind: "kind: actor" };
    const 付いた: string[] = [];
    let 走査 = 0;
    for (const [図種, 違い] of 骨組みの図種) {
      for (const 欄 of 違い.読まない ?? []) {
        走査 += 1;
        const 知 = 箱の知らせ(図種, 書き方[欄]!).find((n) => n.kind === "actor-option-not-honored");
        if (知?.hint !== undefined) 付いた.push(`${図種} / ${欄}: "${知.hint}"`);
      }
    }
    expect(走査, "走査が 0 件 (空振り)").toBeGreaterThan(0);
    expect(付いた, `走査 ${走査} 件`).toEqual([]);
  });

  it("図種ごとに読む欄は、その図種で鳴らず図を変える (#2382)", () => {
    /*
     * 読む欄は `骨組みの図種` の `読む` が持つ。 鳴らないことだけを見ると、表が古くなって
     * 実際には読まれない欄を書いても通る (#2370 で踏んだ形) ので、図が変わることも見る。
     */
    const 走査した: string[] = [];
    const 違う: string[] = [];
    for (const [図種, 違い] of 骨組みの図種) {
      for (const 欄 of 違い.読む ?? []) {
        const 書く = 読まない欄.find(([, k]) => k === 欄)?.[2];
        expect(書く, `欄 "${欄}" の書き方を検査が持っていない`).toBeDefined();
        走査した.push(`${図種}/${欄}`);
        const 知 = 箱の知らせ(図種, 書く!).filter((n) => n.kind === "actor-option-not-honored");
        if (知.length > 0) 違う.push(`${図種} / ${欄}: 読むのに知らせが ${知.length} 件`);
        const 素 = JSON.stringify(組む(本文(図種, "")).図);
        if (JSON.stringify(組む(本文(図種, 書く!)).図) === 素) {
          違う.push(`${図種} / ${欄}: 読む側に書いてあるのに図が変わらない`);
        }
      }
    }
    expect(走査した.length, "読む欄を 1 件も持つ図種が無い (空振り)").toBeGreaterThan(0);
    expect(違う, `走査 ${走査した.join(" ")}`).toEqual([]);
  });

  it("図種ごとに読む欄は、他の図種では知らせが出る (#2382)", () => {
    const 出ない: string[] = [];
    for (const [図種, 違い] of 骨組みの図種) {
      for (const 欄 of 違い.読む ?? []) {
        const 書く = 読まない欄.find(([, k]) => k === 欄)?.[2];
        for (const 他 of 図種一覧) {
          if (他 === 図種) continue;
          if ((骨組みの図種.get(他)?.読む ?? []).includes(欄)) continue;
          const 知 = 箱の知らせ(他, 書く!).filter((n) => n.kind === "actor-option-not-honored");
          if (知.length !== 1) 出ない.push(`${他} / ${欄}: ${知.length} 件`);
        }
      }
    }
    expect(出ない, `図種 ${図種一覧.length} 件`).toEqual([]);
  });

  it("読む欄には知らせを出さない", () => {
    const 出た: string[] = [];
    for (const t of 図種一覧) {
      for (const [名, 書く] of 読む欄) {
        const 知 = 箱の知らせ(t, 書く).filter((n) => n.kind === "actor-option-not-honored");
        if (知.length > 0) 出た.push(`${t} / ${名}: ${知.map((n) => n.message).join(" / ")}`);
      }
    }
    expect(出た, `図種 ${図種一覧.length} 件 × 欄 ${読む欄.length} 件`).toEqual([]);
  });

  it("読む欄は実際に図を変えている (一覧が古くなっていないことの対照)", () => {
    /*
     * 「読む欄に鳴らさない」 だけでは空振りする。 読む欄の一覧が古くなって実際には
     * 読まれていない欄を含んでいても、知らせを出さない限り上の検査は通る (#2370 で踏んだ形)。
     */
    const 変わらない: string[] = [];
    for (const t of 図種一覧) {
      const 素 = JSON.stringify(組む(本文(t, "")).図);
      for (const [名, 書く] of 読む欄) {
        if (JSON.stringify(組む(本文(t, 書く)).図) === 素) 変わらない.push(`${t} / ${名}`);
      }
    }
    expect(変わらない, `図種 ${図種一覧.length} 件 × 欄 ${読む欄.length} 件`).toEqual([]);
  });

  it("行と組にした印は、効く図種で鳴らず効かない図種で鳴る (#2377)", () => {
    /*
     * 印 (`marks`) を行頭の記号に読み替えるのは ER 図と状態遷移図だけ (`行頭の印にする`)。
     * 残りの図種では行と組にしても効かない。
     *
     * **図種の一覧を検査に写さず、図が実際に変わったかで判定する** = 読み替えの表に
     * 図種を足した日に、検査が古い一覧のまま通ることを防ぐ。
     */
    const 違う: string[] = [];
    let 効く図種 = 0;
    let 効かない図種 = 0;
    for (const t of 図種一覧) {
      const 書く = t === "class" ? "marks: [ok]" : 'rows: ["よむ"], marks: [ok]';
      const 印なし = 書く.replace(/,?\s*marks: \[ok\]/, "");
      const 効く = JSON.stringify(組む(本文(t, 書く)).図) !== JSON.stringify(組む(本文(t, 印なし)).図);
      const 知 = 箱の知らせ(t, 書く).filter((n) => n.kind === "actor-option-not-honored");
      if (効く) 効く図種 += 1;
      else 効かない図種 += 1;
      if (効く && 知.length > 0) 違う.push(`${t}: 効くのに知らせが ${知.length} 件`);
      if (!効く && 知.length !== 1) 違う.push(`${t}: 効かないのに知らせが ${知.length} 件`);
    }
    expect(違う, `図種 ${図種一覧.length} 件`).toEqual([]);
    // 両側に 1 件以上あることを見る = 片側だけだと判定が壊れても通る
    expect(効く図種, "印が効く図種が 0 件 (空振り)").toBeGreaterThan(0);
    expect(効かない図種, "印が効かない図種が 0 件 (空振り)").toBeGreaterThan(0);
  });

  it("行を書かずに印だけを書くと、どの図種でも知らせが出る", () => {
    // 読み替える先の行が無いので、印を読む図種でも効かない
    const 対象 = 図種一覧.filter((t) => t !== "class"); // クラス図の本文は既に行を持つ
    const 出ない = 対象
      .map((t) => ({
        t,
        知: 箱の知らせ(t, "marks: [ok]").filter((n) => n.kind === "actor-option-not-honored"),
      }))
      .filter(({ 知 }) => 知.length !== 1)
      .map(({ t, 知 }) => `${t}: ${知.length} 件`);
    expect(出ない, `図種 ${対象.length} 件`).toEqual([]);
  });

  it("図種ごとに読まない欄を書くと、その図種でだけ知らせが出る", () => {
    /*
     * 実装が持つ表 (`骨組みの図種` の `読まない`) を走査する。 検査側で欄の名前を写すと、
     * 表を直した日に片方だけ古くなる。
     */
    const 書き方: Record<string, string> = { stack: "stack: 1", kind: "kind: actor" };
    const 走査した: string[] = [];
    const 出ない: string[] = [];
    for (const [図種, 違い] of 骨組みの図種) {
      for (const 欄 of 違い.読まない ?? []) {
        const 書く = 書き方[欄];
        expect(書く, `欄 "${欄}" の書き方を検査が持っていない`).toBeDefined();
        走査した.push(`${図種}/${欄}`);
        const 知 = 箱の知らせ(図種, 書く!).filter((n) => n.kind === "actor-option-not-honored");
        if (知.length !== 1) 出ない.push(`${図種} / ${欄}: ${知.length} 件`);
      }
    }
    expect(走査した.length, "読まない欄を 1 件も持つ図種が無い (空振り)").toBeGreaterThan(0);
    expect(出ない, `走査 ${走査した.join(" ")}`).toEqual([]);
  });

  it("図種ごとに読まない欄は、他の図種では知らせが出ない", () => {
    const 書き方: Record<string, string> = { stack: "stack: 1", kind: "kind: actor" };
    const 出た: string[] = [];
    for (const [図種, 違い] of 骨組みの図種) {
      for (const 欄 of 違い.読まない ?? []) {
        for (const 他 of 図種一覧) {
          if (他 === 図種) continue;
          if ((骨組みの図種.get(他)?.読まない ?? []).includes(欄)) continue;
          const 知 = 箱の知らせ(他, 書き方[欄]!).filter((n) => n.kind === "actor-option-not-honored");
          if (知.length > 0) 出た.push(`${他} / ${欄}`);
        }
      }
    }
    expect(出た, `図種 ${図種一覧.length} 件`).toEqual([]);
  });

  it("同じ箱の行に知らせが 2 件以上並ばない (#2107 の決まり)", () => {
    const 並んだ: string[] = [];
    for (const t of 図種一覧) {
      for (const [名, , 書く] of 読まない欄) {
        const 知 = 箱の知らせ(t, 書く);
        const 行ごと = new Map<number, number>();
        for (const n of 知) 行ごと.set(n.line, (行ごと.get(n.line) ?? 0) + 1);
        for (const [行, 数] of 行ごと) if (数 > 1) 並んだ.push(`${t} / ${名}: 行 ${行} に ${数} 件`);
      }
    }
    expect(並んだ, `図種 ${図種一覧.length} 件 × 欄 ${読まない欄.length} 件`).toEqual([]);
  });

  it("除外の集合は図種ごとに両方向へ引かれる (#2382)", () => {
    // 違いを持たない図種は共通の除外をそのまま返し、持つ図種は読まない欄が抜け読む欄が入る
    const 違う: string[] = [];
    for (const [図種, 違い] of 骨組みの図種) {
      const 集合 = 骨組みの図が伝えない箱の欄(図種);
      for (const 欄 of 違い.読まない ?? []) {
        if (集合.has(欄)) 違う.push(`${図種} が ${欄} を除いたまま`);
      }
      for (const 欄 of 違い.読む ?? []) {
        if (!集合.has(欄)) 違う.push(`${図種} が ${欄} を除いていない`);
      }
    }
    expect(違う, `図種 ${図種一覧.length} 件`).toEqual([]);
  });
});

describe("状態遷移図の箱に書いた指定が使われないことを伝える (#2382)", () => {
  /*
   * **図種の名前をここに書く**。 上の組は族の表から図種を取るので、状態遷移図を表から
   * 外しても「走査対象が減った」 だけになり落ちない (実測 = 外して回すと空振り検査 1 件
   * しか落ちなかった)。 起票した不具合そのものを指す錨として、この図種だけは名指しで見る。
   */
  it("状態遷移図が族に入っている", () => {
    expect([...骨組みの図種.keys()], "状態遷移図が族から外れている").toContain("state");
  });

  it("前の値と、行を書かない印に知らせが出る", () => {
    const 出ない: string[] = [];
    for (const [名, 書く] of [
      ["前の値", "previous: 2"],
      ["印 (行なし)", "marks: [entry]"],
    ] as const) {
      const 知 = 箱の知らせ("state", 書く).filter((n) => n.kind === "actor-option-not-honored");
      if (知.length !== 1) 出ない.push(`${名}: ${知.length} 件`);
      else if (!知[0]!.message.includes(名.split(" ")[0]!)) 出ない.push(`${名}: "${知[0]!.message}"`);
    }
    expect(出ない).toEqual([]);
  });

  it("始まりの印と終わりの印と、行と組にした印には知らせが出ず図が変わる", () => {
    const 素 = JSON.stringify(組む(本文("state", "")).図);
    const 違う: string[] = [];
    for (const [名, 書く] of [
      ["始まりの印", "initial: true"],
      ["終わりの印", "final: true"],
      ["行と組にした印", 'rows: ["よむ"], marks: [entry]'],
    ] as const) {
      const 知 = 箱の知らせ("state", 書く).filter((n) => n.kind === "actor-option-not-honored");
      if (知.length > 0) 違う.push(`${名}: 知らせが ${知.length} 件`);
      if (JSON.stringify(組む(本文("state", 書く)).図) === 素) 違う.push(`${名}: 図が変わらない`);
    }
    expect(違う).toEqual([]);
  });
});
