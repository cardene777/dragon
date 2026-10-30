/**
 * 字の重なる図を作れない間に、重なりを知らせる流れを確かめるための包み (#3197)。
 *
 * 線の無い段の番号を箱の角に置いてから (#3187)、記法と JSON で組んだ 6000 図以上で字の重なる図が 1 つも出ない。
 * そこで重なりを探す所 (`findOverlaps`) を包み、本物の結果に、決めた段で同時に見えている 2 つの字を組にした重なりを 1 件足す。
 * 組にする字は、札に入っていない、段の番号でも図の部品でもない字 (箱の名前など) から、描いた順に 2 つ選ぶ。
 * 重なりの四角は描いた字の四角そのままなので、編集画面の点線の四角が描いた字を覆うかを確かめられる。
 *
 * 書き出しの命令の検査 (`overlap-cli.test.ts`) は `vi.mock` で、編集画面の検査は検査用の build の設定
 * (`apps/playground-spa/src/lib/overlap-build.config.ts`) で、この包みを `findOverlaps` の代わりに読ませる。
 * 製品の code はこの file を読まない。
 */
import type { Ink, Overlap, Trace } from "../src/render/ink";

/** 重なりを足す段 (0 から数える)。2 段目に足し、1 段目は重なりの無い段として残す */
export const PAIRED_STEP = 1;

const visibleAt = (ink: Ink, t: number): boolean => ink.shown.some(([a, b]) => a <= t && t < b);

/** `step` 段目の止め絵の時刻に見えている、札にも段の番号にも図の部品にも当たらない字を 2 つ組にした重なり。2 つ無い時は無い */
export function pairedOverlap(inks: Ink[], stills: number[], step: number = PAIRED_STEP): Overlap | undefined {
  const t = stills[step];
  if (t === undefined) return undefined;
  const [a, b] = inks.filter((ink) => !ink.boxed && !ink.badge && !ink.part && visibleAt(ink, t));
  if (!a || !b) return undefined;
  return {
    kind: "texts",
    step,
    texts: [a.text, b.text],
    spots: [
      { text: a.text, rect: { ...a.rect }, badge: false },
      { text: b.text, rect: { ...b.rect }, badge: false },
    ],
  };
}

/** 重なりを探す処理を包み、本物の結果の後に組にした重なりを 1 件足す */
export function withPairedOverlap(find: (inks: Ink[], stills: number[], traces?: Trace[]) => Overlap[]): (inks: Ink[], stills: number[], traces?: Trace[]) => Overlap[] {
  return (inks, stills, traces) => {
    const found = find(inks, stills, traces);
    const paired = pairedOverlap(inks, stills);
    return paired ? [...found, paired] : found;
  };
}
