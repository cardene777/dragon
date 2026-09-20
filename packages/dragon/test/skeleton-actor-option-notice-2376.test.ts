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

/** 図種ごとに、その図種が読める最小の本文を作る */
function 本文(図種: string, 箱の欄: string): string {
  const 欄 = 箱の欄 === "" ? "" : `: { ${箱の欄} }`;
  if (図種 === "swimlane") {
    return `title: "しらべ"
type: swimlane

lanes:
  main: { label: "まとめ" }

actors:
  - あ: { lane: main${箱の欄 === "" ? "" : `, ${箱の欄}`} }
  - い: { lane: main }

flow:
  - あ -> い: "つなぐ"
`;
  }
  if (図種 === "class") {
    return `title: "しらべ"
type: class

actors:
  - あ: { rows: ["+ よむ()"]${箱の欄 === "" ? "" : `, ${箱の欄}`} }
  - い: { rows: ["+ かく()"] }

flow:
  - あ -> い: "つかう"
`;
  }
  return `title: "しらべ"
type: ${図種}

actors:
  - あ${欄}
  - い

flow:
  - あ -> い: "つなぐ"
`;
}

type 知 = { kind: string; line: number; message: string };

function 組む(src: string): { 知: 知[]; 図: ReturnType<typeof compileToCdl> } {
  const p = parseTextDslV05(src);
  if (!p.ok) throw new Error(`読めない本文: ${p.errors.map((e) => e.message).join(" / ")}`);
  const 知: 知[] = [];
  const 図 = compileToCdl(p.doc, {
    onNotice: (n) => 知.push({ kind: n.kind, line: n.line, message: n.message }),
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

/** どの図種でも読まない欄。 書くと知らせが 1 件出る */
const 読まない欄: readonly (readonly [string, string])[] = [
  ["始まりの印", "initial: true"],
  ["終わりの印", "final: true"],
  ["前の値", "previous: 2"],
];

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
    for (const t of 図種一覧) {
      for (const [名, 書く] of 読まない欄) {
        const 知 = 箱の知らせ(t, 書く).filter((n) => n.kind === "actor-option-not-honored");
        if (知.length !== 1) 出ない.push(`${t} / ${名}: ${知.length} 件`);
      }
    }
    expect(出ない, `図種 ${図種一覧.length} 件 × 欄 ${読まない欄.length} 件`).toEqual([]);
  });

  it("読まない欄の呼び名が知らせの文に出る", () => {
    const 出ない: string[] = [];
    for (const t of 図種一覧) {
      for (const [名, 書く] of 読まない欄) {
        const 文 = 箱の知らせ(t, 書く).find((n) => n.kind === "actor-option-not-honored")?.message ?? "";
        if (!文.includes(名)) 出ない.push(`${t} / ${名}: "${文}"`);
      }
    }
    expect(出ない, `図種 ${図種一覧.length} 件 × 欄 ${読まない欄.length} 件`).toEqual([]);
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

  it("印は、この判定では伝えない (#2377 へ切り出した)", () => {
    /*
     * 印 (`marks`) を行頭の記号に読み替えるのは ER 図と状態遷移図だけ (`行頭の印にする`)
     * なので、骨組みの残り 5 図種では行と組にしても効かない。
     *
     * それでもここでは伝えない = 伝える側に回すとカタログの見本 3 枚と日本語の項目の
     * 見本が同時に動く。 鳴らさないことを固定し、行と印の扱いは別に切り出す。
     *
     * **効かない図種の数も見る** (0 件になったら除外そのものが要らなくなる合図)。
     */
    const 鳴った: string[] = [];
    const 効かない図種: string[] = [];
    for (const t of 図種一覧) {
      const 書く = t === "class" ? "marks: [ok]" : 'rows: ["よむ"], marks: [ok]';
      const 印なし = 書く.replace(/,?\s*marks: \[ok\]/, "");
      if (JSON.stringify(組む(本文(t, 書く)).図) === JSON.stringify(組む(本文(t, 印なし)).図)) {
        効かない図種.push(t);
      }
      const 知 = 箱の知らせ(t, 書く).filter((n) => n.kind === "actor-option-not-honored");
      if (知.length > 0) 鳴った.push(`${t}: 知らせが ${知.length} 件`);
    }
    expect(鳴った, `図種 ${図種一覧.length} 件`).toEqual([]);
    expect(効かない図種.length, "印が全図種で効くようになった = 除外が要らない").toBeGreaterThan(0);
  });

  it("図種ごとに外す欄を書くと、その図種でだけ知らせが出る", () => {
    /*
     * 実装が持つ表 (`骨組みの図種` の値) を走査する。 検査側で欄の名前を写すと、
     * 表を直した日に片方だけ古くなる。
     */
    const 書き方: Record<string, string> = { stack: "stack: 1", kind: "kind: actor" };
    const 走査した: string[] = [];
    const 出ない: string[] = [];
    for (const [図種, 欄群] of 骨組みの図種) {
      for (const 欄 of 欄群) {
        const 書く = 書き方[欄];
        expect(書く, `欄 "${欄}" の書き方を検査が持っていない`).toBeDefined();
        走査した.push(`${図種}/${欄}`);
        const 知 = 箱の知らせ(図種, 書く!).filter((n) => n.kind === "actor-option-not-honored");
        if (知.length !== 1) 出ない.push(`${図種} / ${欄}: ${知.length} 件`);
      }
    }
    expect(走査した.length, "外す欄を 1 件も持つ図種が無い (空振り)").toBeGreaterThan(0);
    expect(出ない, `走査 ${走査した.join(" ")}`).toEqual([]);
  });

  it("図種ごとに外す欄は、他の図種では知らせが出ない", () => {
    const 書き方: Record<string, string> = { stack: "stack: 1", kind: "kind: actor" };
    const 出た: string[] = [];
    for (const [図種, 欄群] of 骨組みの図種) {
      for (const 欄 of 欄群) {
        for (const 他 of 図種一覧) {
          if (他 === 図種) continue;
          if ((骨組みの図種.get(他) ?? []).includes(欄)) continue;
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
      for (const [名, 書く] of 読まない欄) {
        const 知 = 箱の知らせ(t, 書く);
        const 行ごと = new Map<number, number>();
        for (const n of 知) 行ごと.set(n.line, (行ごと.get(n.line) ?? 0) + 1);
        for (const [行, 数] of 行ごと) if (数 > 1) 並んだ.push(`${t} / ${名}: 行 ${行} に ${数} 件`);
      }
    }
    expect(並んだ, `図種 ${図種一覧.length} 件 × 欄 ${読まない欄.length} 件`).toEqual([]);
  });

  it("除外の集合は図種ごとに正しく引かれる", () => {
    // 外す欄を持たない図種は共通の除外をそのまま返し、持つ図種はそのぶん小さくなる
    const 小さくない: string[] = [];
    for (const [図種, 欄群] of 骨組みの図種) {
      const 集合 = 骨組みの図が伝えない箱の欄(図種);
      for (const 欄 of 欄群) if (集合.has(欄)) 小さくない.push(`${図種} が ${欄} を除いたまま`);
    }
    expect(小さくない, `図種 ${図種一覧.length} 件`).toEqual([]);
  });
});
