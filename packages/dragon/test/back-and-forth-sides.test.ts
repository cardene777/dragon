/**
 * 同じ2つの箱を行きと帰りで結ぶ線の向きと名前の置き場 (#3607)。見本帳の図に残っていた崩れを直した形を確かめる。
 *
 * 行きと帰りの線は左右か上下に離し、名前はずらした側に置く (#3175、#3521)。
 * 離す向きを箱の名前の字の並びで決めていたので、書き手が `[side: below]` を書いた線が上の線になり、名前が2本の線の間で離れて描かれた。
 * 書き手が名前の側を書いた線は、その側へずらす。
 * 木の図は行きと帰りの線を離していなかったので、2本が同じ座標に重なった。木の線を走らない線は、構成図と同じく離す。
 * 状態遷移図で同じ線に段ごとに違う名前を付けると、後の名前を前の名前の外へ積み、線から離れて描いた。名前はずらした側に段の順に横へ並べる。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * 描く部品の元の code を、検査の外 (この file を読む段) で先に読む。
 * 検査の中で初めて読むと、混んだ機械では変換だけで 1 件の上限 (10 秒) に近づく (#3410)
 */
const [{ renderDiagram }, { parseNotation }, { APART, LOOK }, { lineGap }] = await Promise.all([
  import("../src/render/svg"),
  import("../src/parser"),
  import("../src/look/values"),
  import("../src/layout/scene"),
]);

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
  points: Point[];
}
interface Label extends Rect {
  step: number;
  text: string;
}
interface Badge {
  step: number;
  x: number;
  y: number;
}

const BLOCKS = join(process.cwd(), "packages/dragon/src/blocks");
/** 見本帳の線の名前の図。段1で a → b を引き、段2で b → a に `[side: below]` の名前を付ける */
const LABEL_SIDES = ["architecture", "state"].flatMap((kind) =>
  ["", ".en"].map((lang) => join(BLOCKS, `edge-label/gallery/edge-label.${kind}${lang}.dragon`)),
);
/** 見本帳の木の図の線の名前。段2で 根 → 記録、段3で 記録 → 根 に `[side: below]` の名前「照らす」を付ける */
const TREE_LABELS = ["", ".en"].map((lang) =>
  join(BLOCKS, `edge-label/gallery/edge-label.tree${lang}.dragon`),
);
/** 見本帳の状態遷移図の運ぶ物。段1と段3で 注文済み → 支払い待ち に違う名前を付け、段2で帰りの線を引く */
const CARRY_STATE = ["", ".en"].map((lang) =>
  join(BLOCKS, `carry/gallery/carry.state${lang}.dragon`),
);

function laid(file: string): { edges: Edge[]; labels: Label[]; badges: Badge[] } {
  const lang = file.includes(".en.") ? "en" : "ja";
  const parsed = parseNotation(readFileSync(file, "utf8"), { lang });
  if (!parsed.ok)
    throw new Error(`記法を読めない: ${parsed.errors.map((e) => e.message).join(" / ")}`);
  return renderDiagram(parsed.diagram, { lang }).layout;
}

/** 段 `step` (1 から数える) に引いた線 */
function lineAt(edges: Edge[], step: number): Edge {
  const found = edges.find((e) => e.step === step - 1);
  if (!found) throw new Error(`段${step}の線が無い`);
  return found;
}

/** 段 `step` (1 から数える) の線の名前 */
function labelAt(labels: Label[], step: number): Label {
  const found = labels.find((l) => l.step === step - 1);
  if (!found) throw new Error(`段${step}の名前が無い`);
  return found;
}

/** 横の区間ばかりの線の高さ。行きと帰りの線は箱の横を結ぶので、横の区間の高さを比べる */
const heightOf = (edge: Edge): number => (edge.points[0] as Point)[1];

describe("書き手が名前の側を書いた線は、その側へずらす (#3607)", () => {
  it("pull-apart-follows-asked-side", () => {
    for (const file of LABEL_SIDES) {
      const { edges, labels } = laid(file);
      const [there, back] = [lineAt(edges, 1), lineAt(edges, 2)];
      expect(heightOf(back), `${file} の段2の線が段1の線より下にない`).toBeGreaterThan(
        heightOf(there),
      );
      const below = labelAt(labels, 2);
      expect(below.y, `${file} の段2の名前が段2の線より下にない`).toBeGreaterThan(heightOf(back));
    }
  });
});

describe("木の図の行きと帰りの線を離す (#3607)", () => {
  it("tree-back-and-forth-lines-apart", () => {
    for (const file of TREE_LABELS) {
      const { edges, labels, badges } = laid(file);
      const [there, back] = [lineAt(edges, 2), lineAt(edges, 3)];
      expect(
        Math.abs(heightOf(back) - heightOf(there)),
        `${file} の行きと帰りの線が離れない`,
      ).toBeGreaterThanOrEqual(APART.line);
      // 段3の名前は書き手が書いた下の側に置き、段3の線を下の線にする
      expect(heightOf(back), `${file} の段3の線が段2の線より下にない`).toBeGreaterThan(
        heightOf(there),
      );
      expect(labelAt(labels, 3).y, `${file} の段3の名前が段3の線より下にない`).toBeGreaterThan(
        heightOf(back),
      );
      expect(
        labelAt(labels, 2).y + labelAt(labels, 2).h,
        `${file} の段2の名前が段2の線より上にない`,
      ).toBeLessThan(heightOf(there));
      // 段の番号は、その段の線の上に置く。2つの箱の組で前の段の番号の所を使うと、段3の番号が段2の線に残る
      const badge = badges.find((b) => b.step === 2);
      expect(badge, `${file} に段3の番号が無い`).toBeDefined();
      const r = LOOK.badge.r;
      expect(
        lineGap(back.points, {
          x: (badge?.x ?? 0) - r,
          y: (badge?.y ?? 0) - r,
          w: r * 2,
          h: r * 2,
        }),
        `${file} の段3の番号が段3の線の上に無い`,
      ).toBeLessThanOrEqual(0);
    }
  });
});

describe("状態遷移図で同じ線に付く違う名前を横に並べる (#3607)", () => {
  it("state-names-side-by-side-on-one-line", () => {
    for (const file of CARRY_STATE) {
      const { labels } = laid(file);
      const [first, third] = [labelAt(labels, 1), labelAt(labels, 3)];
      expect(
        Math.abs(first.y - third.y),
        `${file} の段1と段3の名前が同じ高さに並ばない`,
      ).toBeLessThan(0.5);
      const gap = Math.max(third.x - (first.x + first.w), first.x - (third.x + third.w));
      expect(gap, `${file} の段1と段3の名前が重なるか詰まる`).toBeGreaterThanOrEqual(
        LOOK.label.soft - 0.5,
      );
    }
  });
});
