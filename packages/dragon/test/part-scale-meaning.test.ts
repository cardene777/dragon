/**
 * `倍率:` (`scale`) の意味を 1 つに固定する (#1026)。
 *
 * 直す前は、同じ語が経路で別の意味を持っていた。
 *
 * | 経路 | `scale: 2` の意味 |
 * |---|---|
 * | 画面 (重ねて描く) | 見本を 2 倍に描く (図形の倍率) |
 * | 組み立て (`textDslToDiagram`) | `scale` という名前の状態を 2 にする |
 *
 * 図形の倍率として予約した。 状態の名前として使いたい時は `state: { scale: 2 }` と明示する。
 * repo 全体で `scale` / `倍率` という名前の状態は 0 件だったため、壊れる見本は無い (実測)。
 *
 * ここでは組み立て側だけを見る。 画面側との一致は
 * `apps/playground-spa/src/lib/part-placement-parity.test.ts` が測る。
 */
import { describe, it, expect } from "vitest";
import { diagram } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import {
  textDslToDiagram,
  partRenderSize,
  partTargetScale,
  partTargetSize,
  partScaleFactor,
  normalizePartScale,
  MAX_PART_SCALE,
} from "../src/index";

/** 見本 1 件。 箱 1 つだけの単純な図にして、倍率の効き方を測りやすくする。 */
function samplePart(): CdlDiagram {
  return diagram("p", { topic: "p" })
    .lane("l", { width: 400 })
    .node("box", { lane: "l", stack: 0, kind: "card", title: "p", w: 200, h: 100 })
    .state("scale", { initial: 1 })
    .build();
}

const catalog = { sample: samplePart() };

/** 取り込んだ図の中で、見本由来の箱の幅を測る。 */
function mergedBoxWidth(src: string): number {
  const d = textDslToDiagram(src, { partsCatalog: catalog });
  const ws = d.nodes.filter((n) => n.id.startsWith("a__")).map((n) => n.w ?? 0);
  return Math.max(0, ...ws);
}

const FORMS: Array<[string, string]> = [
  ["縦に並べた形", `actors:\n  - a:\n      kind: sample\n      scale: 2\n`],
  ["中括弧の形", `actors:\n  - a: { kind: sample, scale: 2 }\n`],
  ["空白区切りの形", `actors:\n  - a: sample scale=2\n`],
];

const head = `title: "t"\ntype: flow\n\n`;
const tail = `\nflow:\n  - a -> a: "x"\n`;

describe("倍率の意味 (#1026)", () => {
  it("状態の名前ではなく図形の倍率として読む", () => {
    // 直す前は stateOverride.scale になり、箱の大きさは変わらなかった
    const plain = mergedBoxWidth(`${head}actors:\n  - a: { kind: sample }\n${tail}`);
    const scaled = mergedBoxWidth(`${head}actors:\n  - a: { kind: sample, scale: 2 }\n${tail}`);
    expect(plain, "見本が取り込まれていない").toBeGreaterThan(0);
    expect(scaled, `倍率が効いていない (${scaled} / ${plain})`).toBeGreaterThan(plain * 1.5);
  });

  it("倍率 2 は伸縮率 2 になる (基準の取り違えを防ぐ)", () => {
    // `大きさ:` と `倍率:` は同じ物差しで測る。 図枠 (余白込み) を基準にすると、書いた倍率より
    // 大きく掛かる (実測 = 3 倍と書いて 4.0875 倍になり、画面側と割れた)
    const part = samplePart();
    for (const k of [2, 3, 0.5]) {
      const t = partTargetSize(part, undefined, undefined, k);
      const got = partTargetScale(part, t.w, t.h);
      expect(got.x, `横の伸縮率が ${k} でない`).toBeCloseTo(k, 6);
      expect(got.y, `縦の伸縮率が ${k} でない`).toBeCloseTo(k, 6);
    }
  });

  it("3 つの書き方で同じ意味になる", () => {
    // 書き方で意味が変わると、同じ本文を貼り替えただけで絵が変わる
    const got = FORMS.map(([name, actors]) => [name, mergedBoxWidth(`${head}${actors}${tail}`)] as const);
    const [, first] = got[0]!;
    for (const [name, w] of got) {
      expect(w, `${name} だけ値が違う (${got.map(([n, v]) => `${n}=${v}`).join(" / ")})`).toBeCloseTo(first, 1);
    }
  });

  it("状態を明示すれば scale という名前も使える (逃げ道)", () => {
    // 予約したのは項目名だけ。 `state:` で明示した分は従来どおり状態として通る
    const d = textDslToDiagram(`${head}actors:\n  - a: { kind: sample, state: { scale: 5 } }\n${tail}`, {
      partsCatalog: catalog,
    });
    const st = d.states?.find((s) => s.id.endsWith("scale"));
    expect(st, `状態が消えている (${(d.states ?? []).map((s) => s.id).join(",")})`).toBeDefined();
    expect(st!.initial).toBe(5);
  });

  it("大きさと掛け合わさる", () => {
    // 画面側も「図枠 × 大きさから出る率 × 倍率」 で描く。 片方だけに掛けると経路で絵が変わる
    const part = samplePart();
    const r = partRenderSize(part);
    const sized = partTargetSize(part, 800, 400, undefined);
    const both = partTargetSize(part, 800, 400, 2);
    expect(sized.w, "大きさがそのまま通っていない").toBe(800);
    expect(both.w, "掛け合わさっていない").toBe(1600);
    expect(both.h, "掛け合わさっていない").toBe(800);
    // 大きさを書かない辺は、伸縮率がちょうど倍率になる大きさに直す
    const only = partTargetSize(part, undefined, undefined, 2);
    expect(partTargetScale(part, only.w, only.h).x).toBeCloseTo(2, 6);
    expect(only.w, "図枠より小さい基準で掛けている").toBeLessThan(r.w * 2);
  });

  it("書かなければ大きさをそのまま返す", () => {
    // 倍率を書いていない本文の見え方を変えない
    const part = samplePart();
    expect(partTargetSize(part, 800, 400, undefined)).toEqual({ w: 800, h: 400 });
    expect(partTargetSize(part, undefined, undefined, undefined)).toEqual({ w: undefined, h: undefined });
  });

  it("描けない倍率は 1 に直す", () => {
    // 0 / 負数 / 数でない値で図が消えないようにする
    for (const bad of [0, -2, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(normalizePartScale(bad), `${bad}`).toBe(1);
    }
    expect(normalizePartScale(1e308), "上限で止まっていない").toBe(MAX_PART_SCALE);
  });

  it("倍率として読んだ語は状態を書き換えない", () => {
    // 予約から外すと、図形の倍率として効きつつ同名の状態も 2 に書き換わる。 見本が
    // `scale` という状態を持っていると、倍率を書いただけで中身の表示が変わる
    const d = textDslToDiagram(`${head}actors:\n  - a: { kind: sample, scale: 2 }\n${tail}`, {
      partsCatalog: catalog,
    });
    const st = d.states?.find((s) => s.id.endsWith("scale"));
    expect(st, "見本の状態が消えている").toBeDefined();
    expect(st!.initial, "倍率が状態にも書き込まれている").toBe(1);
  });

  it("大きさから出る率にも同じ上限が掛かる", () => {
    // 上限を倍率側にしか掛けないと、`大きさ:` だけで書いた本文が画面側と割れる
    // (画面は率に上限を掛けてから図枠に掛ける)
    const part = samplePart();
    const huge = Number(`1${"0".repeat(307)}`);
    const got = partTargetScale(part, huge, huge);
    expect(got.x, "横の率が上限で止まっていない").toBe(MAX_PART_SCALE);
    expect(got.y, "縦の率が上限で止まっていない").toBe(MAX_PART_SCALE);
  });

  it("日本語の項目名も中括弧の形で読む", () => {
    // README に載せた 3 例のうち中括弧の形だけ、項目名が英字しか読めず倍率が消えていた
    const jp = mergedBoxWidth(`${head}actors:\n  - a: { kind: sample, 倍率: 2 }\n${tail}`);
    const en = mergedBoxWidth(`${head}actors:\n  - a: { kind: sample, scale: 2 }\n${tail}`);
    expect(jp, `日本語の項目名が読めていない (${jp} / ${en})`).toBeCloseTo(en, 1);
  });

  it("日本語の項目名が状態として拾われない", () => {
    // 中括弧の形が日本語の項目名を読めるようになった副作用で、縦に並べた形でしか
    // 意味を持たない項目 (位置 / 大きさ 等) が状態の上書きに流れると、見本の中身が変わる
    const d = textDslToDiagram(
      `${head}actors:\n  - a: { kind: sample, 位置: 300, 大きさ: 400, 色: 失敗 }\n${tail}`,
      { partsCatalog: catalog },
    );
    const ids = (d.states ?? []).map((st) => String(st.id ?? ""));
    for (const key of ["位置", "大きさ", "色"]) {
      expect(ids.some((id) => id.endsWith(key)), `${key} が状態になっている (${ids.join(",")})`).toBe(false);
    }
  });

  it("上限は合成した後に 1 度だけ掛かる", () => {
    // 率ごとに掛けると、大きさ由来 1000 倍と倍率 2 で合わせて 2000 倍になり、
    // 1 度だけ掛ける経路 (1000 倍) と食い違う (実測 = engine 1000 / 画面 2000)
    const part = samplePart();
    const base = 400 * MAX_PART_SCALE;
    const f = partScaleFactor(part, base, base, 2);
    expect(f.x, "合成後の上限を超えている").toBe(MAX_PART_SCALE);
    expect(f.y, "合成後の上限を超えている").toBe(MAX_PART_SCALE);
  });

  it("倍率を書かなくても大きさに上限が掛かる", () => {
    // 見積りだけ上限を掛けて実体を青天井にすると、格子と実体がずれる
    // (実測 = 見積り 1000 倍に対して実体 10000 倍)
    const part = samplePart();
    const huge = 400 * MAX_PART_SCALE * 10;
    const t = partTargetSize(part, huge, huge, undefined);
    expect(partTargetScale(part, t.w, t.h).x, "見積りが上限で止まっていない").toBe(MAX_PART_SCALE);
    // 取り込み側は渡された寸法から自分で率を出し直すので、寸法の側が止まっている必要がある
    expect((t.w as number) / 400, "取り込み側に渡る寸法が止まっていない").toBe(MAX_PART_SCALE);
  });

  it("同じ名前の状態を持つ見本では知らせを出す", () => {
    // 予約する前は状態の上書きとして効いていた。 黙って意味が変わると気付けない
    const notices: string[] = [];
    textDslToDiagram(`${head}actors:\n  - a: { kind: sample, scale: 2 }\n${tail}`, {
      partsCatalog: catalog,
      onNotice: (n) => notices.push(`${n.kind}:${n.actor}`),
    });
    expect(notices, `知らせが出ていない (${notices.join(",")})`).toContain("scale-reserved:a");
  });

  it("同じ名前の状態が無ければ知らせない", () => {
    // 該当しない見本まで知らせると、知らせそのものが読まれなくなる
    const plain = diagram("q", { topic: "q" })
      .lane("l", { width: 400 })
      .node("box", { lane: "l", stack: 0, kind: "card", title: "q", w: 200, h: 100 })
      .build();
    const notices: string[] = [];
    textDslToDiagram(`${head}actors:\n  - a: { kind: plain, scale: 2 }\n${tail}`, {
      partsCatalog: { plain },
      onNotice: (n) => notices.push(n.kind),
    });
    expect(notices, `余計な知らせが出ている (${notices.join(",")})`).not.toContain("scale-reserved");
  });

  it("桁の大きい倍率でも大きさが非有限にならない", () => {
    const part = samplePart();
    const huge = Number(`1${"0".repeat(307)}`);
    const t = partTargetSize(part, huge, huge, MAX_PART_SCALE);
    expect(Number.isFinite(t.w!), "幅が非有限").toBe(true);
    expect(Number.isFinite(t.h!), "高さが非有限").toBe(true);
  });
});
