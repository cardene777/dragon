/**
 * 機械の列の描き方 (#3337、#3348)。
 *
 * ブロックは新しい方から 3 つを左から古い順に並べ、ブロックが足されると左へ滑り、古いブロックは消えて畳んだ印に数える。
 * ブロックの中の字は番号と prev と hash の頭の 4 字で、hash は書き換えた段から新しい値に替わる。
 * ブロックの間のつながりは prev が前のブロックの今の hash と同じ間は `=`、違う間は橙の `≠` を出す。
 * この file は試す図を描く部品 (`render/try.ts`) だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import { blockKey, type TryChainPlaced, type TryMoment } from "../../kinds/try/layout";
import { hasWide, textBox } from "../../layout/measure";
import { TRY_LOOK } from "../../look/try";
import { LOOK, TYPE } from "../../look/values";
import { frameShape, partRadius } from "../../render/corner";
import type { Shown } from "../../render/ink";
import { esc, pathOf, r1, sansOf, write } from "../../render/parts";
import type { TryKit, TryRest, TryWindow } from "../../render/try";
import { cs } from "../color/draw";

const T = TRY_LOOK;
const B = T.block;
const C = T.chip;

/** 機械の列ごとの題と、ブロックとつながりと畳んだ印 */
export function chainRows(k: TryKit): void {
  const { layout, title, base, node } = k;
  for (const chain of layout.chains) {
    base.push(
      `<g data-part="${esc(chain.id)}" style="${cs(T.color.part)}">${title(chain.title)}</g>`,
    );
    node.push(drawChain(k, chain));
  }
}

/** 機械の列 1 つ。ブロックは左上を原点に描いて出来事ごとの位置へ動かし、つながりは後ろのブロックと一緒に動く */
function drawChain(k: TryKit, chain: TryChainPlaced): string {
  const { ctx, moments, windows, spanOf, track, phasesOf, shownKf, phased, record, cls } = k;
  const { m } = ctx;
  const numbers = [
    ...new Set(moments.flatMap((mo) => (mo.state.chains[chain.id] ?? []).map((b) => b.number))),
  ].sort((a, b) => a - b);
  const blockOf = (mo: TryMoment, n: number) =>
    (mo.state.chains[chain.id] ?? []).find((b) => b.number === n);
  const rowW = chain.w - B.padX * 2;
  const rowText = B.row / 2 + LOOK.baseline.tag + 1;
  const row = (
    y: number,
    key: string,
    values: string[],
    strong: boolean,
    rests: TryRest[],
  ): string => {
    const keyX = B.padX + B.rowPad;
    const valueX = keyX + textBox(key, 0, 0, TYPE.tryRowKey).w + B.keyGap;
    record(key, TYPE.tryRowKey, rests, keyX, y + rowText);
    for (const p of phasesOf(values))
      record(p.value, TYPE.tryRowValue, rests, valueX, y + rowText, "start", [p.from, p.to]);
    return (
      `<rect class="${strong ? "dg-try-hrow" : "dg-try-row"}" x="${B.padX}" y="${r1(y)}" width="${r1(rowW)}" height="${B.row}" rx="${partRadius(ctx.corner, B.rowRadius)}"/>` +
      `<text class="dg-try-rk" x="${r1(keyX)}" y="${r1(y + rowText)}">${key}</text>${phased(values, valueX, y + rowText, strong ? "dg-try-rv dg-try-hv" : "dg-try-rv")}`
    );
  };
  const blocks = numbers.map((n) => {
    const key = blockKey(chain.id, n);
    const moved = track(moments.map((mo) => mo.blocks[key] ?? null));
    const box = { x: 0, y: 0, w: chain.w, h: chain.h };
    const frame = frameShape(
      ctx.corner,
      ` class="dg-try-blk" ${ctx.sh}`,
      box,
      `<rect class="dg-try-blk" width="${r1(chain.w)}" height="${r1(chain.h)}" rx="${B.radius}" ${ctx.sh}/>`,
    );
    const builtAt = moments.findIndex(
      (mo) => mo.built?.chain === chain.id && mo.built.number === n,
    );
    const ring =
      builtAt < 0
        ? ""
        : `<g class="dg-a" style="${m.vis((windows[builtAt] as TryWindow).b, spanOf(moments[builtAt]?.step ?? 0).end)}">${frameShape(ctx.corner, ' class="dg-halo"', box, `<rect class="dg-halo" width="${r1(chain.w)}" height="${r1(chain.h)}" rx="${B.radius}"/>`)}${frameShape(ctx.corner, ' class="dg-on"', box, `<rect class="dg-on" width="${r1(chain.w)}" height="${r1(chain.h)}" rx="${B.radius}"/>`)}</g>`;
    const label = chain.labels[n] ?? String(n);
    const no = write(
      undefined,
      cls("dg-try-no", label),
      B.padX,
      chain.noBaseline - chain.top,
      label,
      TYPE.tryBlockNo,
    );
    record(
      label,
      hasWide(label) ? sansOf(TYPE.tryBlockNo) : TYPE.tryBlockNo,
      moved.rests,
      B.padX,
      chain.noBaseline - chain.top,
    );
    const prevs = moments.map((mo) => (blockOf(mo, n)?.prev ?? "").slice(0, 4));
    const hashes = moments.map((mo) => (blockOf(mo, n)?.hash ?? "").slice(0, 4));
    const caption = `<text class="dg-try-cap" x="${B.padX}" y="${r1(chain.captionBaseline - chain.top)}">SHA-256</text>`;
    record("SHA-256", TYPE.tryCaption, moved.rests, B.padX, chain.captionBaseline - chain.top);
    return `<g class="dg-a" data-block="${n}" data-chain="${esc(chain.id)}" style="${moved.style}">${frame}${ring}${no}${row(chain.prevY - chain.top, "prev", prevs, false, moved.rests)}${caption}${row(chain.hashY - chain.top, "hash", hashes, true, moved.rests)}</g>`;
  });

  // つながり。後ろのブロックの左上を原点に、前のブロックの hash の行の右端から後ろのブロックの prev の行の左端まで引く
  const hashMid = chain.hashY - chain.top + B.row / 2;
  const prevMid = chain.prevY - chain.top + B.row / 2;
  const midX = -B.gap / 2;
  const elbow = pathOf([
    [-B.gap - B.padX, hashMid],
    [midX, hashMid],
    [midX, prevMid],
    [B.padX, prevMid],
  ]);
  const badge = T.link.badge;
  const badgeY = (hashMid + prevMid) / 2;
  const links = numbers
    .filter((n) => n > 1)
    .map((n) => {
      const key = blockKey(chain.id, n);
      const before = blockKey(chain.id, n - 1);
      const positions = moments.map((mo) =>
        mo.blocks[before] ? (mo.blocks[key] ?? null) : null,
      );
      const moved = track(positions);
      const status = moments.map((mo, k) => (positions[k] ? (blockOf(mo, n)?.link ?? "ok") : ""));
      const phases = phasesOf(status).filter((p) => p.value !== "");
      const kinds = [...new Set(phases.map((p) => p.value))];
      const variant = (kind: string): string => {
        const broken = kind === "broken";
        const ranges: Shown[] = phases.filter((p) => p.value === kind).map((p) => [p.from, p.to]);
        const anim =
          kinds.length > 1
            ? ` class="dg-a" style="${cs(broken ? T.color.broken : T.color.part)};${shownKf(ranges)}"`
            : ` style="${cs(broken ? T.color.broken : T.color.part)}"`;
        const symbol = broken ? "≠" : "=";
        return (
          `<g data-link-state="${kind}"${anim}><path class="dg-try-ln" d="${elbow}"/>` +
          `<rect class="dg-try-lb" x="${r1(midX - badge / 2)}" y="${r1(badgeY - badge / 2)}" width="${badge}" height="${badge}" rx="${partRadius(ctx.corner, C.radius)}"/>` +
          `<text class="dg-try-lt" x="${r1(midX)}" y="${r1(badgeY + LOOK.baseline.label)}" text-anchor="middle">${symbol}</text></g>`
        );
      };
      return `<g class="dg-a" data-link="${n - 1}-${n}" data-chain="${esc(chain.id)}" style="${moved.style}">${kinds.map(variant).join("")}</g>`;
    });

  // 畳んだ印。畳んだ数ごとに字を替え、畳んだブロックが無い間は出さない
  const counts = moments.map((mo) => {
    const list = mo.state.chains[chain.id] ?? [];
    return list.filter((b) => !b.shown).length;
  });
  const foldPhases = phasesOf(counts).filter((p) => p.value > 0);
  const fold =
    foldPhases.length === 0
      ? ""
      : `<g data-fold="${esc(chain.id)}">${foldPhases
          .map((p) => {
            const text = chain.folds[p.value] ?? String(p.value);
            const w =
              textBox(text, 0, 0, hasWide(text) ? sansOf(TYPE.tryHint) : TYPE.tryHint).w +
              T.fold.padX * 2;
            const x = chain.fold.right - w;
            const rect = { x, y: chain.fold.y, w, h: T.fold.h };
            const label = write(
              ctx.ink,
              cls("dg-try-ft", text),
              x + T.fold.padX,
              chain.fold.y + T.fold.h / 2 + LOOK.baseline.tag,
              text,
              hasWide(text) ? sansOf(TYPE.tryHint) : TYPE.tryHint,
              [[p.from, p.to]],
            );
            return `<g class="dg-a" style="${shownKf([[p.from, p.to]])}">${frameShape(ctx.corner, ' class="dg-try-fold"', rect, `<rect class="dg-try-fold" x="${r1(x)}" y="${r1(rect.y)}" width="${r1(w)}" height="${T.fold.h}" rx="${partRadius(ctx.corner, C.radius)}"/>`)}${label}</g>`;
          })
          .join("")}</g>`;
  return `<g data-chain-row="${esc(chain.id)}" style="${cs(T.color.part)}">${blocks.join("")}${links.join("")}${fold}</g>`;
}
