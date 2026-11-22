/**
 * `arch-label-frames.test.ts` から移した命令と書き出しの確かめ (#3763)。
 * build した `dist` を読み、選ぶ命令が `dist` を書く検査を全ての入口へ結ぶので、種類の検査のfileから外し、`kind-cli.test.ts` が読む
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as dragon from "../src/core";
import { describe, expect, it } from "vitest";
import { runCli } from "./export-support";

/*
 * 描く値の元の code を、検査の外 (この file を読む段) で先に読む。
 * 検査の中で初めて読むと、混んだ機械では変換だけで 1 件の上限 (10 秒) に近づく (#3410)
 */
const [{ LOOK }] = await Promise.all([import("../src/look/values")]);

type Point = [number, number];

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Edge {
  from: string;
  to: string;
  step: number;
  event: number;
  points: Point[];
}

interface Label extends Rect {
  step: number;
  event: number;
  text: string;
}

interface Region extends Rect {
  id: string;
  lines: string[];
}

interface Laid {
  width: number;
  height: number;
  edges: Edge[];
  labels: Label[];
  regions: Region[];
}

interface LayoutBreak {
  kind: string;
  step: number;
  parts: unknown[];
}

interface Problem {
  line: number;
  severity: string;
  message: string;
}

type Parsed = { ok: true; diagram: unknown } | { ok: false; errors: { message: string }[] };

/*
 * 描く処理と崩れの検査は build した本体から呼ぶ。本体は共有のブロック集を埋めて持ち、
 * 評価でAIが描いた図 (`eval-bridge.dragon` の `+bridge`) も読める
 */
const api = dragon as unknown as {
  checkLayoutText: (text: string, options: { lang: "ja" | "en" }) => LayoutBreak[];
  parseNotation: (text: string, options: { lang: "ja" | "en" }) => Parsed;
  renderDiagram: (diagram: unknown, options?: { lang: "ja" | "en" }) => { layout: Laid };
};

const ROOT = process.cwd();

const FIXTURES = join(ROOT, "packages/dragon/test/fixtures/layout");

/** 囲み「自社サービス」の中の APIサーバー から外の 価格オラクル へ、名前「為替レートを聞く」の線を引く図 */
const STRADDLE = join(FIXTURES, "label-straddles-group.dragon");

/** 箱 A、B、C を1行に並べ、段3で C → C の輪を描いてから、段4で A → C の名前「送る」を引く図 */
const ABOVE = join(FIXTURES, "label-above-frame.dragon");

function laid(file: string): Laid {
  const parsed = api.parseNotation(readFileSync(file, "utf8"), { lang: "ja" });
  if (!parsed.ok) throw new Error(`記法を読めない: ${parsed.errors.map((e) => e.message).join(" / ")}`);
  return api.renderDiagram(parsed.diagram, { lang: "ja" }).layout;
}

/** `dragon check --layout --json` が出す `warning` の行。記法を読めずに崩れを数えなかった回を、崩れの無い回と取り違えないよう、誤りの行も返す */
async function warnings(file: string): Promise<string[]> {
  const ran = await runCli(["check", file, "--layout", "--json", "--lang", "ja"]);
  let problems: Problem[];
  try {
    problems = JSON.parse(ran.stdout) as Problem[];
  } catch {
    return [`JSON を読めない (終わり方 ${ran.code}): ${ran.stdout}${ran.stderr}`];
  }
  return problems.filter((p) => p.severity !== "info").map((p) => `${p.line} ${p.severity} ${p.message}`);
}

/**
 * 名前の札と囲みの上と下の枠線の間が `LOOK.label.soft` より狭い所。
 * 枠線は囲みの四角を 0.5px 内へ縮めた所を太さ 1px で描くので、札の端から枠線の縁までを測る。札と横に重ならない囲みの枠線は比べない
 */
function nearFrames(layout: Laid): string[] {
  return layout.labels.flatMap((l) =>
    layout.regions.flatMap((g) => {
      if (l.x >= g.x + g.w || l.x + l.w <= g.x) return [];
      return [
        ["上", g.y + 0.5],
        ["下", g.y + g.h - 0.5],
      ].flatMap(([side, y]) => {
        const line = y as number;
        // 枠線が札を横切る時は、間を 0 より狭い値にする
        const gap = l.y >= line ? l.y - line - 0.5 : l.y + l.h <= line ? line - (l.y + l.h) - 0.5 : -1;
        return gap >= LOOK.label.soft - 0.01 ? [] : [`段${l.step + 1}の名前「${l.text}」と囲み「${g.lines.join("")}」の${String(side)}の枠線の間 ${gap.toFixed(1)}`];
      });
    }),
  );
}

/**
 * 名前の札から線までの離れ。線を 0.5px ごとに区切った点から札の四角までの最も短い離れで、線が札を通れば 0。
 * 描く処理の測り方を使わずに測り、描く処理と同じ誤りで通らないようにする
 */
function gapTo(points: Point[], r: Rect): number {
  let least = Number.POSITIVE_INFINITY;
  for (const [k, q] of points.slice(1).entries()) {
    const p = points[k] as Point;
    const n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 0.5));
    for (let i = 0; i <= n; i++) {
      const [x, y] = [p[0] + ((q[0] - p[0]) * i) / n, p[1] + ((q[1] - p[1]) * i) / n];
      least = Math.min(least, Math.hypot(Math.max(r.x - x, 0, x - (r.x + r.w)), Math.max(r.y - y, 0, y - (r.y + r.h))));
    }
  }
  return least;
}

/**
 * 図の名前のうち、自分の線の脇に無いか、別の線が自分の線までの `apart` 倍より近い名前。
 * 脇は札から自分の線までが、描く処理が最初に置く離れに札の高さを足した長さまでの所で、崩れの検査が線から離れた名前に数えない所。
 * 同じ道をもう一度引いた線は自分の線として比べない。離れは 0.5px ごとに測るので、0.5px より近い時だけ近いとする
 */
function strayLabels(layout: Laid, apart = 1): string[] {
  const reach = Math.max(LOOK.label.offset - LOOK.label.h / 2, LOOK.label.side) + LOOK.label.h;
  const key = (e: Edge): string => JSON.stringify(e.points);
  return layout.labels.flatMap((l) => {
    const own = layout.edges.find((e) => e.step === l.step && e.event === l.event);
    if (!own) return [`段${l.step + 1}の名前「${l.text}」の線が無い`];
    const gap = gapTo(own.points, l);
    const nearer = layout.edges.filter((e) => key(e) !== key(own) && gapTo(e.points, l) < gap * apart - 0.5);
    return [
      ...(gap > reach ? [`段${l.step + 1}の名前「${l.text}」が自分の線から ${gap.toFixed(1)} 離れる`] : []),
      ...nearer.map((e) => `段${l.step + 1}の名前「${l.text}」に、自分の線 (${gap.toFixed(1)}) の ${apart} 倍より線 ${e.from} → ${e.to} (${gapTo(e.points, l).toFixed(1)}) が近い`),
    ];
  });
}

describe("構成図の線の名前は囲みの枠線をまたがず、図の枠の内に収まる (#3554)", () => {
  it("label-frame-group-line-clear", async () => {
    const layout = laid(STRADDLE);
    // 図が囲みと名前を持つことを先に確かめる。持たなければ、枠線をまたぐ名前0件は当たり前になる
    expect(layout.regions.map((g) => g.lines.join("")), "見本の囲み").toEqual(["自社サービス"]);
    expect(layout.labels.map((l) => l.text), "見本の線の名前").toEqual(["為替レートを聞く"]);
    expect(nearFrames(layout), "囲みの枠線に近いかまたぐ名前").toEqual([]);
    expect(strayLabels(layout), "自分の線の脇に無い名前").toEqual([]);
    expect(await warnings(STRADDLE), "囲みの枠線をまたいでいた図の知らせ").toEqual([]);
  });

  it("label-frame-row-detour-inside", async () => {
    const layout = laid(ABOVE);
    const sent = layout.labels.find((l) => l.text === "送る");
    const own = layout.edges.find((e) => e.from === "a" && e.to === "c");
    if (!sent || !own) throw new Error("段4の A → C の線か名前「送る」が無い");
    // 線が行の上を回ることを先に確かめる。回らなければ、名前が図の上へはみ出さないのは当たり前になる
    expect(own.points.length, "A → C が回らない").toBe(4);
    expect((own.points[1] as Point)[1], "A → C が行の上を回らない").toBeLessThan((own.points[0] as Point)[1]);
    expect(sent.y, "名前「送る」の札の上の端と図の枠の上端の間").toBeGreaterThanOrEqual(LOOK.margin - 0.01);
    // 名前と別の線の間は、名前と自分の線の間の 2 倍空ける。C の下の輪と、A → B と B → C の線は、名前から遠い
    expect(strayLabels(layout, 2), "自分の線の脇に無いか、別の線が自分の線の 2 倍より近い名前").toEqual([]);
    expect(await warnings(ABOVE), "図の枠の上へはみ出していた図の知らせ").toEqual([]);
  });
});
