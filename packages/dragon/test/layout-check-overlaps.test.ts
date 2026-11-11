/**
 * 列の図と時間軸の図で、字に重なる印と囲みと針を `dragon check --layout` が拾う (#3631)。
 *
 * #3615 で見本を足した時、検査が何も言わないのに、書き出した PNG で字の重なりが 3 つ見つかった。
 * 列の図では札に押した印 (`stamp`) が同じ段の札の下の一言に重なり、時間軸の図では範囲の囲み (`span ... [shape: box]`) の点線と
 * 段の終わりの針が作業の棒の期間の字を横切った。見本は重ならない書き方に直したので、重なる形の記法はこの file の中に書く。
 * 印が字に重なる形は今の種類 `chip-over-part` で、囲みと針が字を横切る形は今の種類 `line-crosses-text` で出す (step 2 で決めた)。
 */
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as dragon from "@cardenelabs/dragon";
import { describe, expect, it } from "vitest";
import { runCli } from "./export-support";

interface Part {
  kind: string;
  text?: string;
}

interface LayoutBreak {
  kind: string;
  step: number;
  width?: number;
  parts: Part[];
}

/**
 * 最後の段で、会計の札に印「支払い済み」を押し、同じ段に札の下の一言「付き添いの家族は3番目」が出る列の図。
 * 印は札の右下から札の下へ 6px はみ出して押し、一言は札の下に書くので、印の下の縁が一言の字の上に掛かる
 */
const STAMP_ON_NOTE = `lineup 会計の順番

box 受付 [order: none]
box 会計 [color: green]

item 発熱, 腹痛
item 付き添いの家族 [color: amber]

step 受付に出す
  say 患者が受付に診察券を出す。
  line 受付: 発熱, 腹痛, 付き添いの家族

step 会計で払う
  say 会計の列に並び、払い終える。
  line 会計: 発熱, 腹痛, 付き添いの家族
  stamp 会計: 支払い済み
`;

/** 同じ列の図で、印を一言の出ない次の段に押す。一言は書いた段にだけ出るので、印と一言は同じ止め絵に揃わない */
const STAMP_APART = `lineup 会計の順番

box 受付 [order: none]
box 会計 [color: green]

item 発熱, 腹痛
item 付き添いの家族 [color: amber]

step 受付に出す
  say 患者が受付に診察券を出す。
  line 受付: 発熱, 腹痛, 付き添いの家族

step 会計で払う
  say 会計の列に並ぶ。
  line 会計: 発熱, 腹痛, 付き添いの家族

step 払い終える
  say 上から払い終える。
  stamp 会計: 支払い済み
`;

/**
 * 段2で、目盛り 1 から 14 を囲む範囲の囲み「重なる日」を出す時間軸の図。
 * 囲みの左の縁は目盛り 1 の所に立ち、目盛り 0 から始まる内装の棒の期間の字「1〜12日」を縦に横切る。
 * 針は段1の終わりに目盛り 3、段2の終わりに目盛り 23 に止まり、どの期間の字にも掛からない
 */
const SPAN_CROSSING = `time 店を開く準備

scale 日 1d 31 [from: 1]
task interior as 内装 0-11 [color: violet]
task stock as 仕入れ 12-20 [color: amber]

step 内装を始める
  say 内装の工事を始める。
  now -> 2

step 仕入れを始める
  say 内装と仕入れの日が重なる。
  span 1-14: 重なる日 [color: slate, shape: box]
  now -> 22
`;

/** 段1の終わりに針が目盛り 2 に止まり、内装の棒の期間の字「1〜12日」を縦に横切る時間軸の図。範囲の囲みは持たない */
const NEEDLE_CROSSING = `time 店を開く準備

scale 日 1d 31 [from: 1]
task interior as 内装 0-11 [color: violet]
task stock as 仕入れ 12-20 [color: amber]

step 内装を始める
  say 内装の工事を始める。
  now -> 1

step 仕入れを終える
  say 仕入れを終える。
  now -> 22
`;

/**
 * 範囲の囲みが仕入れの棒を外から囲み、針が期間の字の無い所に止まる時間軸の図。
 * 囲みの左の縁は内装の期間の字の右にも仕入れの期間の字の左にも掛からず、針は目盛り 3 と 23 に止まる
 */
const TIME_APART = `time 店を開く準備

scale 日 1d 31 [from: 1]
task interior as 内装 0-11 [color: violet]
task stock as 仕入れ 12-20 [color: amber]

step 内装を始める
  say 内装の工事を始める。
  now -> 2

step 仕入れを始める
  say 仕入れの日を囲む。
  span 12-20: 仕入れの日 [color: slate, shape: box]
  now -> 22
`;

/**
 * 記法 `text` を日本語の字で描いた崩れ。組み上がった package の `checkLayoutText` で数え、図の種類を読み込む処理を `dragon check` と揃える。
 * 元の code の入口は図の種類を読み込まないので、列の図と時間軸の図を読めない
 */
const breaksOf = (text: string): LayoutBreak[] => {
  const checkLayoutText = (dragon as unknown as { checkLayoutText: (text: string, options: { lang: "ja" | "en" }) => LayoutBreak[] }).checkLayoutText;
  return checkLayoutText(text, { lang: "ja" });
};

/** 印が字に重なる崩れ */
const isStampOver = (b: LayoutBreak): boolean => b.kind === "chip-over-part" && b.parts[0]?.kind === "stamp";
/** 範囲の囲みが字を横切る崩れ */
const isSpanCrossing = (b: LayoutBreak): boolean => b.kind === "line-crosses-text" && b.parts[0]?.kind === "span";
/** 針が字を横切る崩れ */
const isNeedleCrossing = (b: LayoutBreak): boolean => b.kind === "line-crosses-text" && b.parts[0]?.kind === "needle";

describe("字に重なる印と囲みと針 (#3631)", () => {
  it("layout-check-finds-stamp-over-note", () => {
    const found = breaksOf(STAMP_ON_NOTE);
    expect(found, `印「支払い済み」が段2の一言「付き添いの家族は3番目」に重なることを出さない ${JSON.stringify(found)}`).toContainEqual({
      kind: "chip-over-part",
      step: 2,
      parts: [
        { kind: "stamp", text: "支払い済み" },
        { kind: "text", text: "付き添いの家族は3番目" },
      ],
    });
  });

  it("layout-check-finds-span-crossing-task-text", () => {
    const found = breaksOf(SPAN_CROSSING);
    expect(found, `範囲の囲み「重なる日」が段2で期間の字「1〜12日」を横切ることを出さない ${JSON.stringify(found)}`).toContainEqual({
      kind: "line-crosses-text",
      step: 2,
      parts: [
        { kind: "span", text: "重なる日" },
        { kind: "text", text: "1〜12日" },
      ],
    });
  });

  it("layout-check-finds-needle-crossing-task-text", () => {
    const found = breaksOf(NEEDLE_CROSSING);
    expect(found, `段1の終わりの針が期間の字「1〜12日」を横切ることを出さない ${JSON.stringify(found)}`).toContainEqual({
      kind: "line-crosses-text",
      step: 1,
      parts: [{ kind: "needle" }, { kind: "text", text: "1〜12日" }],
    });
  });

  it("layout-check-skips-stamp-span-needle-apart", () => {
    // 離れた形で崩れが 0 件なのが、拾う処理が無いためではないことを、重なる形で同じ崩れを拾うことで先に確かめる
    expect(breaksOf(STAMP_ON_NOTE).filter(isStampOver).length, "重なる形の列の図で、印が字に重なる崩れを拾わない").toBeGreaterThan(0);
    expect(breaksOf(SPAN_CROSSING).filter(isSpanCrossing).length, "重なる形の時間軸の図で、囲みが字を横切る崩れを拾わない").toBeGreaterThan(0);
    expect(breaksOf(NEEDLE_CROSSING).filter(isNeedleCrossing).length, "重なる形の時間軸の図で、針が字を横切る崩れを拾わない").toBeGreaterThan(0);
    // 既定の幅と携帯の幅のどちらでも、離れた形では 3 つの崩れのどれも出さない
    expect(breaksOf(STAMP_APART).filter(isStampOver), "一言の出ない段に押した印を、一言に重なる印に数える").toEqual([]);
    const apart = breaksOf(TIME_APART);
    expect(apart.filter(isSpanCrossing), "期間の字を避けた範囲の囲みを、字を横切る囲みに数える").toEqual([]);
    expect(apart.filter(isNeedleCrossing), "期間の字の無い所に止まる針を、字を横切る針に数える").toEqual([]);
  });

  it("layout-check-names-stamp-span-needle", async () => {
    const dir = mkdtempSync(join(tmpdir(), "dragon-overlaps-"));
    const files = { stamp: join(dir, "stamp.dragon"), span: join(dir, "span.dragon"), needle: join(dir, "needle.dragon") };
    writeFileSync(files.stamp, STAMP_ON_NOTE);
    writeFileSync(files.span, SPAN_CROSSING);
    writeFileSync(files.needle, NEEDLE_CROSSING);
    // 子の process を 6 つ並べて起こし、1 件の上限 (10 秒) の中で終える
    const runs = await Promise.all(
      (["ja", "en"] as const).flatMap((lang) =>
        [files.stamp, files.span, files.needle].map((file) => runCli(["check", file, "--layout", "--lang", lang])),
      ),
    );
    for (const ran of runs) expect(ran.code, ran.stderr).toBe(0);
    const [stampJa, spanJa, needleJa, stampEn, spanEn, needleEn] = runs.map((ran) => ran.stdout);
    expect(stampJa, "日本語の行が印と一言を名指さない").toContain("warning 段 2: 印「支払い済み」が「付き添いの家族は3番目」に重なる");
    expect(spanJa, "日本語の行が範囲の囲みと期間の字を名指さない").toContain("warning 段 2: 範囲の囲み「重なる日」が「1〜12日」を横切る");
    expect(needleJa, "日本語の行が針と期間の字を名指さない").toContain("warning 段 1: 針が「1〜12日」を横切る");
    // 英語の字で描くと一言と期間の字も英語になるので、字は形だけを見る
    expect(stampEn, "英語の行が印と一言を名指さない").toMatch(/warning Step 2: The stamp "支払い済み" covers "[^"]+"/u);
    expect(spanEn, "英語の行が範囲の囲みと期間の字を名指さない").toMatch(/warning Step 2: The span frame "重なる日" crosses "[^"]+"/u);
    expect(needleEn, "英語の行が針と期間の字を名指さない").toMatch(/warning Step 1: The needle crosses "[^"]+"/u);
  });
});
