/**
 * 配管の図で、戻り値の札が収まる長さまで管を伸ばす形と、丸の名札から出る管の位置 (#3607)。見本帳の図に残っていた崩れを直した形を確かめる。
 *
 * 返した値の札は呼び出しの管を伝って戻り、管の上で止まる。札が管より長いと、どこに止めても弁か箱に重なった。
 * `dragon check --layout` は重なりを知らせるだけで (#3523)、描く側は管を伸ばさなかった。札が収まらない呼び出しは、2 つの箱の間を札が収まる長さまで開ける。
 * 丸の名札は角の丸みが高さの半分なので、真ん中を外れて出る管は名札の縁の後ろを通って見える。丸の名札から出る管は、名札の真ん中から出る。
 * 札は止まった所で濃く見えた後に消えていく。消えていく間も重なって見えるので、崩れの確かめも消え終わるまで札を見る。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * 描く部品と崩れを数える部品の元の code を、検査の外 (この file を読む段) で先に読む。
 * 検査の中で初めて読むと、混んだ機械では変換だけで 1 件の上限 (10 秒) に近づく (#3410)
 */
const [, { parseNotation }, { drawDiagram }, { findBreaks }, { MOTION }] = await Promise.all([
  import("../src/kinds/all"),
  import("../src/parser"),
  import("../src/render/draw"),
  import("../src/render/breaks"),
  import("../src/look/values"),
]);

type DrawnFigure = import("../src/render/breaks").DrawnFigure;
type PipePiece = import("../src/render/breaks").PipePiece;
type Point = [number, number];

const ROOT = process.cwd();
const FIXTURES = join(ROOT, "packages/dragon/test/fixtures/layout");
const BLOCKS = join(ROOT, "packages/dragon/src/blocks");
/** Router が Alice へ返す値の札が、呼び出しの管より長い図。2 人だけの並びと、間にトークンの箱を置いた並び */
const LONG_RETURNS = ["pipe-long-return.dragon", "pipe-long-return-held.dragon"].map((name) => join(FIXTURES, name));
/** 丸の名札の Alice からトークンの箱への管を引く見本帳の図 */
const ROUND_PARTIES = ["emit", "hold", "revert"].flatMap((block) => ["", ".en"].map((lang) => join(BLOCKS, `${block}/gallery/${block}.pipe${lang}.dragon`)));
/** 段4で Aggregator が Alice へ「1 WETH」を返す見本帳の図 */
const FOLD = join(BLOCKS, "fold/gallery/fold.pipe.en.dragon");

/** 記法の file を描き、描く処理が崩れの確かめへ渡した部品と止め絵の時刻を返す */
function drawn(file: string): DrawnFigure {
  const lang = file.includes(".en.") ? "en" : "ja";
  const parsed = parseNotation(readFileSync(file, "utf8"), { lang });
  if (!parsed.ok) throw new Error(`${file} を読めない: ${parsed.errors.map((e) => e.message).join(" / ")}`);
  let figure: DrawnFigure | undefined;
  drawDiagram(parsed.diagram, {
    lang,
    findBreaks: (input) => {
      figure = input;
      return [];
    },
  });
  if (!figure?.pieces) throw new Error(`${file} の描く処理が配管の部品を渡さない`);
  return figure;
}

const piecesOf = <K extends PipePiece["kind"]>(figure: DrawnFigure, kind: K): Extract<PipePiece, { kind: K }>[] =>
  (figure.pieces ?? []).filter((p): p is Extract<PipePiece, { kind: K }> => p.kind === kind);

describe("戻り値の札が収まる長さまで管を伸ばす (#3607)", () => {
  it("pipe-widens-for-long-return-chip", () => {
    for (const file of LONG_RETURNS) {
      const figure = drawn(file);
      const chip = piecesOf(figure, "chip").find((c) => c.text === "呼び出しの管のどこにも収まらないほど長い戻り値の札");
      expect(chip, `${file} に長い戻り値の札が無い`).toBeDefined();
      // 配管の図は形を持つ箱を描かないので、形の輪郭は空で渡す
      const covered = findBreaks({ ...figure, outlines: new Map() }).filter((b) => b.kind === "chip-over-part");
      expect(covered, `${file} の札が弁か計器か箱に重なる`).toEqual([]);
      // 札は Alice の名札の右の縁と Router の名札の左の縁の間に収まる
      const alice = piecesOf(figure, "box").find((b) => b.name === "Alice");
      const router = piecesOf(figure, "box").find((b) => b.name === "Router");
      expect(alice && router, `${file} に Alice か Router の名札が無い`).toBeTruthy();
      if (!chip || !alice || !router) continue;
      expect(chip.rect.x, `${file} の札が Alice の名札に掛かる`).toBeGreaterThanOrEqual(alice.rect.x + alice.rect.w);
      expect(chip.rect.x + chip.rect.w, `${file} の札が Router の名札に掛かる`).toBeLessThanOrEqual(router.rect.x);
    }
  });

  it("pipe-chip-counts-while-fading", () => {
    // 札は止まった所で濃く見えた後、`MOTION.fade` かけて消える。描いた字の記録が見える間に加え、消えていく間も崩れの確かめが札を見る
    const figure = drawn(FOLD);
    const chip = piecesOf(figure, "chip").find((c) => c.text === "1 WETH");
    const ink = figure.inks.find((i) => i.text === "1 WETH");
    expect(chip && ink, "fold.pipe.en に札「1 WETH」の部品か字の記録が無い").toBeTruthy();
    const end = (shown: [number, number][]): number => Math.max(...shown.map(([, b]) => b));
    expect(end(chip?.shown ?? [[0, 0]]), "札が消え終わる前に崩れの確かめが札を見なくなる").toBeGreaterThanOrEqual(end(ink?.shown ?? [[0, 0]]) + MOTION.fade - 1e-6);
  });
});

describe("丸の名札から出る管は名札の真ん中から出る (#3607)", () => {
  it("pipe-leaves-round-party-at-center", () => {
    for (const file of ROUND_PARTIES) {
      const figure = drawn(file);
      // 丸の名札は角の丸みが高さの半分の名札
      const rounds = piecesOf(figure, "box").filter((b) => Math.abs(b.corner - b.rect.h / 2) < 0.5);
      expect(rounds.length, `${file} に丸の名札が無い`).toBeGreaterThan(0);
      let ends = 0;
      for (const pipe of piecesOf(figure, "pipe"))
        for (const end of [pipe.points[0], pipe.points[pipe.points.length - 1]] as Point[])
          for (const { name, rect } of rounds) {
            const onSide = (Math.abs(end[0] - rect.x) < 0.5 || Math.abs(end[0] - (rect.x + rect.w)) < 0.5) && end[1] > rect.y - 0.5 && end[1] < rect.y + rect.h + 0.5;
            const onTop = (Math.abs(end[1] - rect.y) < 0.5 || Math.abs(end[1] - (rect.y + rect.h)) < 0.5) && end[0] > rect.x - 0.5 && end[0] < rect.x + rect.w + 0.5;
            if (!onSide && !onTop) continue;
            ends++;
            const off = onSide ? end[1] - (rect.y + rect.h / 2) : end[0] - (rect.x + rect.w / 2);
            expect(Math.abs(off), `${file} の管 ${pipe.from} → ${pipe.to} が ${name} の名札の真ん中を外れて出る`).toBeLessThan(0.5);
          }
      expect(ends, `${file} に丸の名札から出る管が無い`).toBeGreaterThan(0);
    }
  });
});
