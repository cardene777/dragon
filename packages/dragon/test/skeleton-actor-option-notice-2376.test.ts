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
import { 縦列を選べる図種 } from "../src/compile/lanes";
import { INLINE_ACTOR_KEYS, PRESET_TYPES, parseTextDslV05 } from "../src/v05/parser";

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

/**
 * 全ての箱が縦列を書いた本文 (#2386)。
 *
 * 段 (`stack`) は **図 1 枚ごとに** 読むかが決まり、縦列を書かない図ではどの図種でも伝える。
 * 図種ごとの違いを見る検査はその条件を満たした形で測る = 満たさない形で測ると、
 * 図種の違いと図の書き方の違いが混ざる。
 */
function 縦列を書いた本文(図種: string, 箱の欄: string): string {
  const 行 = 図種 === "class" ? ['rows: ["+ よ()"]'] : [];
  const 面 = `: { ${["lane: m", ...行].join(", ")} }`;
  const あ = ["lane: m", ...行, ...(箱の欄 === "" ? [] : [箱の欄])];
  return `title: "しらべ"
type: ${図種}

lanes:
  m: { label: "ま" }

actors:
  - ぜろ${面}
  - あ: { ${あ.join(", ")} }
  - い${面}

flow:
  - ぜろ -> あ: "はじめ"
  - あ -> い: "つなぐ"
`;
}

/** 縦列を書いた本文で、最初の箱の行に出た知らせ */
function 縦列を書いた知らせ(図種: string, 箱の欄: string): 知[] {
  const { 知 } = 組む(縦列を書いた本文(図種, 箱の欄));
  const 素 = 組む(縦列を書いた本文(図種, "")).知;
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
  // 色番号 (#2384)。 部品を置いた箱でだけ効くので、ふつうの箱では届く先が無い
  ["色", "colorHex", 'color: "#123456"'],
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
    // 構成の図の段 (`stack`) は、縦列を書いても効かないので移す先が無い (#2386)。
    // 当たり障りのない 1 文で埋めない
    const 書き方: Record<string, string> = { stack: "stack: 1", kind: "kind: actor" };
    const 付いた: string[] = [];
    let 走査 = 0;
    for (const [図種, 違い] of 骨組みの図種) {
      for (const 欄 of 違い.読まない ?? []) {
        走査 += 1;
        const 知 = 縦列を書いた知らせ(図種, 書き方[欄]!).find((n) => n.kind === "actor-option-not-honored");
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
        const 知 = 縦列を書いた知らせ(図種, 書く!).filter((n) => n.kind === "actor-option-not-honored");
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
          const 知 = 縦列を書いた知らせ(他, 書き方[欄]!).filter((n) => n.kind === "actor-option-not-honored");
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

  it("始まりの印と終わりの印と、行と組にした印には知らせが出ず図が変わる (state)", () => {
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

describe("箱に書いた色番号が使われないことを伝える (#2384)", () => {
  /** どの図種でも読める本文。 図種ごとに値の書き方だけ変える */
  function 色の本文(図種: string, 箱の欄: string): string {
    const 値 =
      図種 === "gantt" ? '"1月"' : 図種 === "journey" ? '"満足"' : 図種 === "quadrant" ? '"左上"' : "10";
    return `title: "しらべ"
type: ${図種}

actors:
  - ぜろ: { value: ${値} }
  - あ: { value: ${値}${箱の欄 === "" ? "" : `, ${箱の欄}`} }
  - い: { value: ${値} }

flow:
  - ぜろ -> あ: "はじめ"
  - あ -> い: "つなぐ"
`;
  }

  it("どの図種でも、色番号が黙って消えることが無い", () => {
    /*
     * **図種の一覧を検査に写さない**。 記法が受ける図種 (`PRESET_TYPES`) を全部回し、
     * 図が変わるか知らせが増えるかのどちらかが起きることを見る。
     * 0 件を出す検査なので、走査した図種の数を併記する。
     */
    const 黙る: string[] = [];
    let 走査 = 0;
    for (const t of [...PRESET_TYPES].sort()) {
      const 素p = parseTextDslV05(色の本文(t, ""));
      if (!素p.ok) continue;
      const 素文: string[] = [];
      const 素図 = JSON.stringify(
        compileToCdl(素p.doc, { onNotice: (n) => 素文.push(n.message) }),
      );
      const p = parseTextDslV05(色の本文(t, 'color: "#123456"'));
      if (!p.ok) continue;
      走査 += 1;
      const 文: string[] = [];
      const 図 = JSON.stringify(compileToCdl(p.doc, { onNotice: (n) => 文.push(n.message) }));
      const 増えた = 文.filter((m) => !素文.includes(m));
      if (図 === 素図 && 増えた.length === 0) 黙る.push(t);
    }
    expect(走査, "走査が 0 件 (空振り)").toBeGreaterThan(0);
    expect(黙る, `走査 ${走査} 図種`).toEqual([]);
  });

  it("部品を置いた箱では鳴らず、ふつうの箱では鳴る", () => {
    // 部品の側の知らせ (`compile/parts.ts`) が受け持つ。 判定の入口で飛ばしている
    const 部品 = 箱の知らせ("flow", 'kind: state-indicator, color: "#123456"').filter(
      (n) => n.kind === "actor-option-not-honored",
    );
    const ふつう = 箱の知らせ("flow", 'color: "#123456"').filter(
      (n) => n.kind === "actor-option-not-honored",
    );
    expect(部品.map((n) => n.message), "部品を置いた箱で鳴っている").toEqual([]);
    expect(ふつう.length, "ふつうの箱で鳴っていない (空振り)").toBe(1);
  });

  it("色の名前で書いた形は鳴らず、図が変わる", () => {
    // 記法の `色:` は 16 進数なら色番号に、名前なら箱の色 (`tone`) に入る
    const 知 = 箱の知らせ("flow", "color: 成功").filter((n) => n.kind === "actor-option-not-honored");
    expect(知.map((n) => n.message)).toEqual([]);
    expect(
      JSON.stringify(組む(本文("flow", "color: 成功")).図),
      "色の名前で図が変わらない (空振り)",
    ).not.toBe(JSON.stringify(組む(本文("flow", "")).図));
  });

  it("案内が色番号の行き先を書く", () => {
    const 案内 =
      箱の知らせ("flow", 'color: "#123456"').find((n) => n.kind === "actor-option-not-honored")
        ?.hint ?? "";
    expect(案内, `案内 "${案内}"`).toContain("部品");
    expect(案内, `案内 "${案内}"`).toContain("色の名前");
  });
});

describe("箱に書いた段が使われないことを伝える (#2386)", () => {
  /*
   * 段 (`stack`) が効くのは「書いた縦列に箱を置く形」 に入った図だけで、その形に入る条件は
   * 全ての箱が縦列を書いていること。 図種ではなく図 1 枚ごとに決まる。
   */
  const 段の図種 = 図種一覧.filter((t) => 縦列を選べる図種.has(t as never));

  /** 縦列を書いた形と書かない形を作り分ける。 クラス図だけは行が要る */
  function 段の本文(図種: string, 縦列: "全部" | "一部" | "無し", 段を書く: boolean): string {
    const 行 = 図種 === "class" ? ['rows: ["+ よ()"]'] : [];
    const 面 = (書く: boolean): string => {
      const 中 = [...(書く ? ["lane: m"] : []), ...行];
      return 中.length === 0 ? "" : `: { ${中.join(", ")} }`;
    };
    const あ = [
      ...(縦列 === "無し" ? [] : ["lane: m"]),
      ...行,
      ...(段を書く ? ["stack: 3"] : []),
    ];
    return `title: "しらべ"
type: ${図種}
${縦列 === "無し" ? "" : '\nlanes:\n  m: { label: "ま" }\n'}
actors:
  - ぜろ${面(縦列 === "全部")}
  - あ${あ.length === 0 ? "" : `: { ${あ.join(", ")} }`}
  - い${面(縦列 === "全部")}

flow:
  - ぜろ -> あ: "はじめ"
  - あ -> い: "つなぐ"
`;
  }

  /** 素の本文で出た文を差し引いた、段を書いた時の知らせ */
  function 段の知らせ(図種: string, 縦列: "全部" | "一部" | "無し"): 知[] {
    const 素 = 組む(段の本文(図種, 縦列, false)).知;
    return 組む(段の本文(図種, 縦列, true)).知.filter(
      (n) => !素.some((s) => s.kind === n.kind && s.line === n.line),
    );
  }

  it("縦列を選べる図種を走査できている (空振り防止)", () => {
    expect(段の図種.length, "縦列を選べる図種を 1 件も拾えていない").toBeGreaterThan(0);
  });

  it("縦列を書かない図では鳴り、全ての箱が書いた図では鳴らず図が変わる", () => {
    const 違う: string[] = [];
    let 鳴る図 = 0;
    let 鳴らない図 = 0;
    for (const t of 段の図種) {
      const 無し = 段の知らせ(t, "無し").filter((n) => n.kind === "actor-option-not-honored");
      if (無し.length !== 1) 違う.push(`${t} / 縦列なし: ${無し.length} 件`);
      else 鳴る図 += 1;
      const 全部 = 段の知らせ(t, "全部").filter((n) => n.kind === "actor-option-not-honored");
      if (全部.length !== 0) 違う.push(`${t} / 全部が縦列: ${全部.length} 件`);
      else 鳴らない図 += 1;
      const 素図 = JSON.stringify(組む(段の本文(t, "全部", false)).図);
      if (JSON.stringify(組む(段の本文(t, "全部", true)).図) === 素図) {
        違う.push(`${t}: 全ての箱が縦列を書いても図が変わらない`);
      }
    }
    expect(違う, `図種 ${段の図種.length} 件`).toEqual([]);
    expect(鳴る図, "鳴る図が 0 件 (空振り)").toBeGreaterThan(0);
    expect(鳴らない図, "鳴らない図が 0 件 (空振り)").toBeGreaterThan(0);
  });

  it("一部の箱だけが縦列を書いた図でも鳴る", () => {
    const 出ない: string[] = [];
    for (const t of 段の図種) {
      const 知 = 段の知らせ(t, "一部").filter((n) => n.kind === "actor-option-not-honored");
      if (知.length !== 1) 出ない.push(`${t}: ${知.length} 件`);
    }
    expect(出ない, `図種 ${段の図種.length} 件`).toEqual([]);
  });

  it("同じ行に知らせが 2 件以上並ばない (縦列の混在の知らせと重ねない)", () => {
    const 並んだ: string[] = [];
    for (const t of 段の図種) {
      for (const 縦列 of ["無し", "一部", "全部"] as const) {
        const 行ごと = new Map<number, string[]>();
        for (const n of 組む(段の本文(t, 縦列, true)).知) {
          行ごと.set(n.line, [...(行ごと.get(n.line) ?? []), n.kind]);
        }
        for (const [行, 種] of 行ごと) {
          if (種.length > 1) 並んだ.push(`${t} / 縦列${縦列}: 行 ${行} に ${種.join(" + ")}`);
        }
      }
    }
    expect(並んだ, `図種 ${段の図種.length} 件 × 3 通り`).toEqual([]);
  });

  it("案内は縦列を選べる図種にだけ付く", () => {
    // 縦列を選べない図種 (構成の図) では、どう書いても段が効かないので行き先が無い
    const 違う: string[] = [];
    let 付く図種 = 0;
    let 付かない図種 = 0;
    for (const t of 図種一覧) {
      const 知 = 段の知らせ(t, "無し").find((n) => n.kind === "actor-option-not-honored");
      if (知 === undefined) continue;
      if (縦列を選べる図種.has(t as never)) {
        付く図種 += 1;
        if (!(知.hint ?? "").includes("lane")) 違う.push(`${t}: 案内が無い "${知.hint ?? ""}"`);
      } else {
        付かない図種 += 1;
        if (知.hint !== undefined) 違う.push(`${t}: 行き先が無いのに案内が付く "${知.hint}"`);
      }
    }
    expect(違う, `図種 ${図種一覧.length} 件`).toEqual([]);
    expect(付く図種, "案内が付く図種が 0 件 (空振り)").toBeGreaterThan(0);
    expect(付かない図種, "案内が付かない図種が 0 件 (空振り)").toBeGreaterThan(0);
  });
});

describe("箱に書いた種類が使われないことを伝える (#2388)", () => {
  /*
   * 種類 (`kind`) を読むかは、図種だけでは決まらない。 ER 図は実体 1 つにつき表の箱を作る
   * 経路では読まないが、縦列や動きを書いた図は共通の組み立てへ回って読む。
   *
   * **図種の一覧を検査に写さず、組み上がった箱の種類で分ける** = 種類を読む図種を足した日に、
   * 検査が古い一覧のまま通ることを防ぐ。
   */
  type 箱 = { title?: string; kind?: string };

  /** 組み上がった箱 `あ` の種類 */
  function 箱の種類(本文: string): string | undefined {
    const 図 = 組む(本文).図 as unknown as { nodes?: 箱[] };
    return 図.nodes?.find((n) => n.title === "あ")?.kind;
  }

  /**
   * 書いた種類が箱に届くか。
   *
   * **既定の種類と比べない**。 流れ図の既定は `actor` なので、`kind: actor` だけを書いて
   * 既定と比べると「届いているのに変わらない」 になる。 種類を 2 通り書いて、
   * 組み上がった箱の種類が分かれるかで見る。
   */
  const 書く種類 = ["kind: actor", "kind: storage"] as const;

  it("種類が効く図種では鳴らず箱の種類が分かれ、効かない図種では鳴る", () => {
    const 違う: string[] = [];
    let 効く図種 = 0;
    let 効かない図種 = 0;
    for (const t of 図種一覧) {
      const 種類 = 書く種類.map((書く) => 箱の種類(縦列を書いた本文(t, 書く)));
      const 知 = 書く種類.map((書く) =>
        縦列を書いた知らせ(t, 書く).filter((n) => n.kind === "actor-option-not-honored"),
      );
      if (種類[0] !== 種類[1]) {
        効く図種 += 1;
        const 鳴った = 知.filter((k) => k.length > 0).length;
        if (鳴った > 0) 違う.push(`${t}: 種類が ${種類.join(" / ")} に分かれるのに ${鳴った} 通りで鳴る`);
      } else {
        効かない図種 += 1;
        const 鳴らない = 知.filter((k) => k.length !== 1).length;
        if (鳴らない > 0) 違う.push(`${t}: 種類が ${種類[0]} のまま分かれないのに ${鳴らない} 通りで鳴らない`);
      }
    }
    expect(違う, `図種 ${図種一覧.length} 件 × 種類 ${書く種類.length} 通り`).toEqual([]);
    // 両側に 1 件以上あることを見る = 片側だけだと判定が壊れても通る
    expect(効く図種, "種類が効く図種が 0 件 (空振り)").toBeGreaterThan(0);
    expect(効かない図種, "種類が効かない図種が 0 件 (空振り)").toBeGreaterThan(0);
  });

  it("種類を書かない箱では、どの図種でも知らせが 0 件", () => {
    const 出た = 図種一覧
      .map((t) => ({
        t,
        知: 縦列を書いた知らせ(t, "").filter((n) => n.kind === "actor-option-not-honored"),
      }))
      .filter(({ 知 }) => 知.length > 0)
      .map(({ t, 知 }) => `${t}: ${知.map((n) => n.message).join(" / ")}`);
    expect(出た, `図種 ${図種一覧.length} 件`).toEqual([]);
  });

  it("図 1 枚ごとに決まる欄は、読む図で鳴らず読まない図で鳴る", () => {
    /*
     * 条件は族の表が関数として持つ (`図ごと`)。 検査は **その関数に聞いて期待を決める** =
     * 条件を写すと、条件を直した日に検査だけが古くなる。
     *
     * 縦列を書かない形と全ての箱が書いた形の 2 通りで、条件が両方向に分かれることも見る。
     */
    const 違う: string[] = [];
    let 読む図 = 0;
    let 読まない図 = 0;
    for (const [図種, 違い] of 骨組みの図種) {
      for (const [欄, 読むか] of 違い.図ごと ?? []) {
        const 書く = 欄 === "kind" ? "kind: queue" : undefined;
        expect(書く, `欄 "${欄}" の書き方を検査が持っていない`).toBeDefined();
        for (const [形, 作る, 知らせ] of [
          ["縦列なし", 本文, 箱の知らせ],
          ["縦列あり", 縦列を書いた本文, 縦列を書いた知らせ],
        ] as const) {
          const p = parseTextDslV05(作る(図種, 書く!));
          expect(p.ok, `${図種} / ${形} の本文が読めない`).toBe(true);
          if (!p.ok) continue;
          const 知 = 知らせ(図種, 書く!).filter((n) => n.kind === "actor-option-not-honored");
          if (読むか(p.doc)) {
            読む図 += 1;
            if (知.length > 0) 違う.push(`${図種} / ${欄} / ${形}: 読むのに知らせが ${知.length} 件`);
            const 素 = 箱の種類(作る(図種, ""));
            if (箱の種類(作る(図種, 書く!)) === 素) {
              違う.push(`${図種} / ${欄} / ${形}: 読む側なのに箱が ${素} のまま`);
            }
          } else {
            読まない図 += 1;
            if (知.length !== 1) 違う.push(`${図種} / ${欄} / ${形}: 読まないのに知らせが ${知.length} 件`);
          }
        }
      }
    }
    expect(違う, `図種 ${図種一覧.length} 件`).toEqual([]);
    expect(読む図, "読む側の図が 0 件 (空振り)").toBeGreaterThan(0);
    expect(読まない図, "読まない側の図が 0 件 (空振り)").toBeGreaterThan(0);
  });

  it("案内は図 1 枚ごとに決まる図種にだけ付く", () => {
    /*
     * 縦列を足せば効く図種では行き先を書き、どう書いても読まない図種 (クラス図) では
     * 当たり障りのない 1 文で埋めない (#2382 の決まり)。
     */
    const 違う: string[] = [];
    let 付く図種 = 0;
    let 付かない図種 = 0;
    for (const t of 図種一覧) {
      const 知 = 箱の知らせ(t, "kind: queue").find((n) => n.kind === "actor-option-not-honored");
      if (知 === undefined) continue;
      const 図ごと = (骨組みの図種.get(t)?.図ごと ?? []).some(([欄]) => 欄 === "kind");
      if (図ごと) {
        付く図種 += 1;
        if (!(知.hint ?? "").includes("lane")) 違う.push(`${t}: 案内が無い "${知.hint ?? ""}"`);
      } else {
        付かない図種 += 1;
        if (知.hint !== undefined) 違う.push(`${t}: 行き先が無いのに案内が付く "${知.hint}"`);
      }
    }
    expect(違う, `図種 ${図種一覧.length} 件`).toEqual([]);
    expect(付く図種, "案内が付く図種が 0 件 (空振り)").toBeGreaterThan(0);
    expect(付かない図種, "案内が付かない図種が 0 件 (空振り)").toBeGreaterThan(0);
  });

  it("ER 図が図 1 枚ごとに決まる側に入っている", () => {
    /*
     * **図種の名前をここに書く** (#2382 と同じ形)。 上の 3 件は族の表から図種を取るので、
     * ER 図を表から落としても「走査対象が減った」 だけになり落ちない。
     */
    expect(
      (骨組みの図種.get("er")?.図ごと ?? []).map(([欄]) => 欄),
      "ER 図の種類が図 1 枚ごとに決まる側から外れている",
    ).toContain("kind");
    // 表の経路は表の箱しか作らない = どの種類を書いても同じ
    expect(箱の種類(本文("er", "kind: actor")), "ER 図の表の経路で種類が効いている").toBe(
      箱の種類(本文("er", "kind: service")),
    );
    // 縦列を全部書いた図は共通の組み立てへ回るので届く
    expect(
      箱の種類(縦列を書いた本文("er", "kind: actor")),
      "縦列を書いた ER 図で種類が届いていない",
    ).not.toBe(箱の種類(縦列を書いた本文("er", "kind: service")));
  });
});

describe("骨組みの図で箱の欄が黙って消えない (#2388)", () => {
  /*
   * 欄を 3 区分に分けて測る。 **効く (図が変わる) / 知らせる / 黙って消える** の 3 つで、
   * 3 つ目が 0 件であることを見る。
   *
   * **走査する欄を検査に写さない**。 記法が中括弧で読む項目名 (`INLINE_ACTOR_KEYS`) を
   * 全部回すので、項目を足した日に書き方の無い項目で落ちる。
   *
   * **縦列を書かない形で測る** (#2386 / #2388)。 段 (`stack`) のように図 1 枚ごとに
   * 読むかが決まる欄は、縦列を書いた形だと読む側へ回って走査から外れる。
   */
  const 書き方: Record<string, string> = {
    // 既定の種類 (`actor`) を避ける = 既定を書いた形は何も変えないのが正しい
    kind: "kind: queue",
    title: 'title: "だい"',
    subtitle: 'subtitle: "そえ"',
    eyebrow: 'eyebrow: "みだし"',
    value: "value: 3",
    previous: "previous: 2",
    rows: 'rows: ["よむ"]',
    marks: "marks: [pk]",
    lane: "lane: m",
    stack: "stack: 2",
    initial: "initial: true",
    final: "final: true",
    tone: "tone: info",
    color: 'color: "#123456"',
    touchpoint: 'touchpoint: "まどぐち"',
    opportunity: 'opportunity: "のびしろ"',
    owner: 'owner: "たんとう"',
    end: 'end: "3月"',
    posX: "posX: 100",
    posY: "posY: 100",
    posW: "posW: 200",
    posH: "posH: 80",
    offsetX: "offsetX: 10",
    offsetY: "offsetY: 10",
    shape: "shape: { kind: rect, source: 10, fillMax: 100 }",
    visibleIf: 'visibleIf: "{あたい}"',
    wBind: 'wBind: "{あたい}"',
    hBind: 'hBind: "{あたい}"',
    opacity: "opacity: 0.5",
    renderOffsetX: 'renderOffsetX: "{あたい}"',
    renderOffsetY: 'renderOffsetY: "{あたい}"',
    scale: "scale: 1.5",
  };

  /** 日本語の別名は英語名と同じ欄に入るので、英語名だけを走査する */
  const 走査する項目 = [...INLINE_ACTOR_KEYS].filter((k) => /^[a-zA-Z]/.test(k)).sort();

  /**
   * 1 欄だけを書いた本文。 縦列 (`lane`) を測る時だけ縦列の並びを足す。
   *
   * クラス図は行 (`rows`) が無いと箱が空になるので、行を測る時以外は土台に足す。
   */
  function 全欄の本文(図種: string, 項目: string, 書く: string): string {
    const 行 = 図種 === "class" ? 'rows: ["+ よ()"]' : "";
    const 面 = 行 === "" ? "" : `: { ${行} }`;
    const あ = [...(行 !== "" && 項目 !== "rows" ? [行] : []), ...(書く === "" ? [] : [書く])];
    const 縦列 = 項目 === "lane" ? '\nlanes:\n  m: { label: "ま" }\n' : "";
    return `title: "しらべ"
type: ${図種}
${縦列}
actors:
  - ぜろ${面}
  - あ${あ.length === 0 ? "" : `: { ${あ.join(", ")} }`}
  - い${面}

flow:
  - ぜろ -> あ: "はじめ"
  - あ -> い: "つなぐ"
`;
  }

  it("走査する項目すべてに書き方を持っている (空振り防止)", () => {
    const 無い = 走査する項目.filter((k) => 書き方[k] === undefined);
    expect(無い, `記法の項目 ${走査する項目.length} 件`).toEqual([]);
    expect(走査する項目.length, "記法の項目を 1 件も拾えていない").toBeGreaterThan(0);
  });

  it("効く / 知らせる / 黙って消える の 3 区分で、黙って消える欄が 0 件", () => {
    /*
     * 記法が項目そのものを断る形 (`scale` は部品にだけ効く) も、書いた人には届く。
     * 別に数えて 3 区分から外す = 断られた組み合わせを黙る側にも知らせる側にも混ぜない。
     */
    const 黙る: string[] = [];
    const 土台が読めない: string[] = [];
    let 走査 = 0;
    let 効く = 0;
    let 知らせる = 0;
    let 記法が断る = 0;
    for (const t of 図種一覧) {
      for (const k of 走査する項目) {
        const 素p = parseTextDslV05(全欄の本文(t, k, ""));
        if (!素p.ok) {
          土台が読めない.push(`${t} / ${k}: ${素p.errors.map((e) => e.message).join(" / ")}`);
          continue;
        }
        const 素文: string[] = [];
        const 素図 = JSON.stringify(compileToCdl(素p.doc, { onNotice: (n) => 素文.push(n.message) }));
        走査 += 1;
        const p = parseTextDslV05(全欄の本文(t, k, 書き方[k]!));
        if (!p.ok) {
          記法が断る += 1;
          continue;
        }
        const 文: string[] = [];
        const 図 = JSON.stringify(compileToCdl(p.doc, { onNotice: (n) => 文.push(n.message) }));
        // 素の本文で出た文を差し引く = 知らせの文面の形で探すと、箱の名前の書き方が
        // 図種で違う分だけ取りこぼす (#2384 で踏んだ形)
        const 増えた = 文.filter((m) => !素文.includes(m));
        if (図 !== 素図) 効く += 1;
        else if (増えた.length > 0) 知らせる += 1;
        else 黙る.push(`${t} / ${k}`);
      }
    }
    expect(土台が読めない, "欄を書かない本文が読めない組み合わせ").toEqual([]);
    expect(走査, "走査が 0 件 (空振り)").toBeGreaterThan(0);
    const 内訳 = `走査 ${走査} 通り (図種 ${図種一覧.length} 件 × 項目 ${走査する項目.length} 件) / 効く ${効く} 件 / 知らせる ${知らせる} 件 / 記法が断る ${記法が断る} 件`;
    expect(黙る, 内訳).toEqual([]);
    // 3 区分の両端に 1 件以上あることを見る = 片側だけだと判定が壊れても通る
    expect(効く, `効く欄が 0 件 (空振り) — ${内訳}`).toBeGreaterThan(0);
    expect(知らせる, `知らせる欄が 0 件 (空振り) — ${内訳}`).toBeGreaterThan(0);
  });
});
