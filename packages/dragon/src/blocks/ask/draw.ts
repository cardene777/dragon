/**
 * 入力の帯のブロックが送るチップの描き方 (#3337、#3348)。
 *
 * チップは 1 枚につき 1 つの部品 (`data-chip`) で、中の字は名前と、待ち行列が並べる順の欄の値の 2 つだけ。
 * 出来事ごとの位置を keyframes で辿り、待ち行列の席とブロックの中の席の間を滑る。
 * 網を運ばれるチップは送る側の節で現れ、最短の道の節を順に通って作る人へ着いてから待ち行列へ入る。
 * 網の節の関門で止まったチップ (#3476) は待ち行列に席を持たず、止まった節まで運ばれてそこで薄れて消える。
 * 宣言したチップは塗り、送ったチップは縁だけで描く。入力の帯そのものは再生の部品 (`try-player.ts`) が描く。
 * この file は試す図を描く部品 (`render/try.ts`) だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import { hasWide, textBox } from "../../layout/measure";
import { TRY_LOOK } from "../../look/try";
import { LOOK, TYPE } from "../../look/values";
import { partRadius } from "../../render/corner";
import { esc, r1, sansOf, write } from "../../render/parts";
import type { TryKit } from "../../render/try";
import { cs } from "../color/draw";

const T = TRY_LOOK;
const C = T.chip;

/** チップ。1 枚につき 1 つの部品で、名前と並べる順の欄の値だけを出す */
export function tryChips(k: TryKit): void {
  const { layout, diagram, ctx, moments, track, phasesOf, phased, record, cls, top } = k;
  const declared = new Set((diagram.try?.items ?? []).map((item) => item.id));
  const chipIds = [
    ...new Set(
      moments.flatMap((mo) => [...Object.entries(mo.chips).flatMap(([id, at]) => (at ? [id] : [])), ...(mo.trip ? [mo.trip.item] : [])]),
    ),
  ];
  for (const id of chipIds) {
    const moved = track(
      moments.map((mo) => mo.chips[id] ?? null),
      (k) => (moments[k]?.trip?.item === id ? moments[k]?.trip?.points : undefined),
    );
    const name = layout.names[id] ?? id;
    const rx = partRadius(ctx.corner, C.radius);
    const baseline = C.h / 2 + LOOK.baseline.tag;
    const nameText = write(undefined, cls("dg-try-cn", name), C.padX, baseline, name, TYPE.tryChip);
    record(
      name,
      hasWide(name) ? sansOf(TYPE.tryChip) : TYPE.tryChip,
      moved.rests,
      C.padX,
      baseline,
    );
    const field = layout.valueField;
    const values =
      field === undefined ? [] : moments.map((mo) => mo.state.items[id]?.[field] ?? "");
    const valueText =
      field === undefined
        ? ""
        : phased(
            values,
            layout.chip.w - C.padX,
            baseline,
            cls("dg-try-cv", values.join("")),
            "end",
          );
    for (const p of phasesOf(values)) {
      const style = hasWide(p.value) ? sansOf(TYPE.tryChipValue) : TYPE.tryChipValue;
      record(
        p.value,
        style,
        moved.rests,
        layout.chip.w - C.padX - textBox(p.value, 0, 0, style).w,
        baseline,
        "start",
        [p.from, p.to],
      );
    }
    const sent = !declared.has(id);
    top.push(
      `<g class="dg-a" data-chip="${esc(id)}" style="${cs(T.color.part)};${moved.style}"><rect class="${sent ? "dg-try-sent" : "dg-try-chip"}" width="${r1(layout.chip.w)}" height="${C.h}" rx="${rx}"/>${nameText}${valueText}</g>`,
    );
  }
}
