/*
 * 値として読む図で、値を書いた箱に書いた呼び名が黙って消えないことを見る (#2390)。
 *
 * 呼び名 (`subtitle`) が値として読まれるのは **値を書いていない箱だけ**
 * (`a.value ?? a.subtitle`)。 値を書いた箱では読む先が無いのに、族の除外がこの欄を
 * 外していたため誰も伝えなかった (実測 = 13 図種すべてで図も変わらず知らせも 0 件)。
 *
 * 対象の図種は `値として読む図種` が持つ (実装が SSOT)。 一覧を検査側で写すと、
 * 図種を足した日に片方だけ古くなる。
 */
import { describe, expect, it } from "vitest";
import { compileToCdl } from "../src/compile";
import { 値として読む図種 } from "../src/compile/actor-option-notice";
import { parseTextDslV05 } from "../src/v05/parser";

/**
 * その図種が読める値の語。
 *
 * **図種ごとに書き分ける** = 工程表は時期、体験の地図は気持ち、四象限は区画の語しか読まない。
 * 数を書くと値が落ちた形になり、呼び名の違いと値の違いが混ざる。
 */
function 読める値(図種: string, ふたつ目 = false): string {
  if (図種 === "gantt") return ふたつ目 ? '"3月"' : '"1月"';
  if (図種 === "journey") return ふたつ目 ? '"不満"' : '"満足"';
  if (図種 === "quadrant") return ふたつ目 ? '"右下"' : '"左上"';
  return ふたつ目 ? "20" : "10";
}

function 本文(図種: string, 欄: readonly string[]): string {
  const v = 読める値(図種);
  return `title: "しらべ"
type: ${図種}

actors:
  - ぜろ: { value: ${v} }
  - あ${欄.length === 0 ? "" : `: { ${欄.join(", ")} }`}
  - い: { value: ${v} }
`;
}

type 知 = { kind: string; line: number; message: string; hint?: string };

function 組む(src: string): { 知: 知[]; 図: string } {
  const p = parseTextDslV05(src);
  if (!p.ok) throw new Error(`読めない本文: ${p.errors.map((e) => e.message).join(" / ")}`);
  const 知: 知[] = [];
  const 図 = compileToCdl(p.doc, {
    onNotice: (n) => 知.push({ kind: n.kind, line: n.line, message: n.message, hint: n.hint }),
  });
  return { 知, 図: JSON.stringify(図) };
}

/** 素の本文で出た文を差し引いた、欄を書いた時の知らせ */
function 箱の知らせ(図種: string, 素の欄: readonly string[], 欄: readonly string[]): 知[] {
  const 素 = 組む(本文(図種, 素の欄)).知;
  return 組む(本文(図種, 欄)).知.filter(
    (n) => !素.some((s) => s.kind === n.kind && s.line === n.line),
  );
}

const 図種一覧 = [...値として読む図種.keys()];

describe("値を書いた箱に書いた呼び名が黙って消えない (#2390)", () => {
  it("対象の図種を走査できている (空振り防止)", () => {
    expect(図種一覧.length, "図種を 1 件も拾えていない").toBeGreaterThan(0);
  });

  it("値を書いた箱に呼び名を書くと、その行に知らせが 1 件出る", () => {
    const 出ない: string[] = [];
    for (const t of 図種一覧) {
      const 素 = [`value: ${読める値(t)}`];
      const 知 = 箱の知らせ(t, 素, [...素, `subtitle: ${読める値(t, true)}`]).filter(
        (n) => n.kind === "actor-option-not-honored",
      );
      if (知.length !== 1) 出ない.push(`${t}: ${知.length} 件`);
    }
    expect(出ない, `図種 ${図種一覧.length} 件`).toEqual([]);
  });

  it("値を書かない箱に呼び名を書くと、鳴らずに図が変わる", () => {
    /*
     * 鳴らないことだけを見ると、呼び名が読まれなくなっても通る。 図が変わることも見る。
     * 呼び名は読める語で書く = 読めない語だと箱ごと落ちて、図が変わらない側に見える。
     */
    const 違う: string[] = [];
    for (const t of 図種一覧) {
      const 書く = [`subtitle: ${読める値(t, true)}`];
      const 知 = 箱の知らせ(t, [], 書く).filter((n) => n.kind === "actor-option-not-honored");
      if (知.length > 0) 違う.push(`${t}: 値として読むのに知らせが ${知.length} 件`);
      if (組む(本文(t, 書く)).図 === 組む(本文(t, [])).図) {
        違う.push(`${t}: 値として読む側なのに図が変わらない`);
      }
    }
    expect(違う, `図種 ${図種一覧.length} 件`).toEqual([]);
  });

  it("呼び名の案内は、同じ図種の中の行き先を書く", () => {
    /*
     * 飾りの欄 (位置 / 大きさ) の行き先は別の図種だが、呼び名の行き先は同じ図種の中にある =
     * 値を消せば値として読まれ、題 (`title`) を書けば箱に出る。
     * 固定の 1 文で済ませると、呼び名だけを書いた読み手が図種を変えろと読まされる (#2382)。
     */
    const 違う: string[] = [];
    for (const t of 図種一覧) {
      const 素 = [`value: ${読める値(t)}`];
      const 案内 =
        箱の知らせ(t, 素, [...素, `subtitle: ${読める値(t, true)}`]).find(
          (n) => n.kind === "actor-option-not-honored",
        )?.hint ?? "";
      if (!案内.includes("value")) 違う.push(`${t}: 値を消す案内が無い "${案内}"`);
      if (!案内.includes("title")) 違う.push(`${t}: 題を書く案内が無い "${案内}"`);
      if (案内.includes("箱を並べる図種")) 違う.push(`${t}: 図種を変えろと案内している "${案内}"`);
    }
    expect(違う, `図種 ${図種一覧.length} 件`).toEqual([]);
  });

  it("飾りの欄の案内は今までどおり図種の行き先を書く", () => {
    // 呼び名の案内を足したことで、飾りの欄の案内が消えていないことを見る
    const 違う: string[] = [];
    for (const t of 図種一覧) {
      const 素 = [`value: ${読める値(t)}`];
      const 案内 =
        箱の知らせ(t, 素, [...素, "posW: 200"]).find((n) => n.kind === "actor-option-not-honored")
          ?.hint ?? "";
      if (!案内.includes("箱を並べる図種")) 違う.push(`${t}: 飾りの案内が無い "${案内}"`);
      if (案内.includes("title")) 違う.push(`${t}: 書いていない呼び名の案内が混ざる "${案内}"`);
    }
    expect(違う, `図種 ${図種一覧.length} 件`).toEqual([]);
  });

  it("呼び名と飾りを両方書くと、案内が両方の行き先を書く", () => {
    const 違う: string[] = [];
    for (const t of 図種一覧) {
      const 素 = [`value: ${読める値(t)}`];
      const 案内 =
        箱の知らせ(t, 素, [...素, `subtitle: ${読める値(t, true)}`, "posW: 200"]).find(
          (n) => n.kind === "actor-option-not-honored",
        )?.hint ?? "";
      if (!案内.includes("title")) 違う.push(`${t}: 呼び名の行き先が無い "${案内}"`);
      if (!案内.includes("箱を並べる図種")) 違う.push(`${t}: 飾りの行き先が無い "${案内}"`);
    }
    expect(違う, `図種 ${図種一覧.length} 件`).toEqual([]);
  });

  it("同じ箱の行に知らせが 2 件以上並ばない", () => {
    const 並んだ: string[] = [];
    for (const t of 図種一覧) {
      const 行ごと = new Map<number, string[]>();
      for (const n of 組む(本文(t, [`value: ${読める値(t)}`, `subtitle: ${読める値(t, true)}`])).知) {
        行ごと.set(n.line, [...(行ごと.get(n.line) ?? []), n.kind]);
      }
      for (const [行, 種] of 行ごと) {
        if (種.length > 1) 並んだ.push(`${t}: 行 ${行} に ${種.join(" + ")}`);
      }
    }
    expect(並んだ, `図種 ${図種一覧.length} 件`).toEqual([]);
  });

  it("呼び名が族の除外に残っていない", () => {
    /*
     * **欄の名前をここに書く** (#2382 と同じ形)。 上の検査は族の表から図種を取るので、
     * 呼び名を除外へ戻すと「走査した欄が減った」 のではなく全図種で鳴らなくなるが、
     * 何が戻されたかは名指しでないと読めない。
     */
    const 素 = ['value: 10'];
    const 知 = 箱の知らせ("pie", 素, [...素, 'subtitle: "20"']).filter(
      (n) => n.kind === "actor-option-not-honored",
    );
    expect(知.length, "呼び名が族の除外に戻っている").toBe(1);
    expect(知[0]!.message, `文 "${知[0]?.message ?? ""}"`).toContain("呼び名");
  });
});
