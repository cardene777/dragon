/**
 * 種類の行に `[shape: pipe]` を書いたシーケンス図を、#93 で選んだ試作の案C (パイプ図の部品) で描く (Tracelyth #91、#93、#97、#107、#3720)。
 *
 * 生存線は管で描き、呼ばれている間はその列の管に紺の管を重ねる。呼び出しは横の管と動く印、お金は太い管とトークンの色の液、
 * requireと書き換えとログは生存線から札へ出る短い管、戻りとリバートは破線で描く。列の頭の下に器と札と2人を結ぶ値の矢印を置き、
 * 段ごとに今の段の帯を敷く。後の段の線と札は先に薄く見せ (`dg-ghost`)、その段の始まりで消える。
 * 線を起こした操作の番号を持つ線とリバートの×は、`data-op="段/番号"` を持つ。
 * 見た目の規則 (`SEQ_CSS`) はこの見た目のシーケンス図の SVG にだけ書く。
 * 並べ方と描き方は後から読む塊に入り、見た目の部品の組 (`SEQUENCE_PIPE`) として置き場 (`look-store.ts`) へ置く。
 */
import { cs } from "../blocks/color/draw";
import {
  layoutSequencePipe,
  type SeqCard,
  seqCardPill,
  type SeqLinkState,
  seqPillWidth,
  type SeqRun,
  seqSpace,
  type SeqSlotState,
  type SeqTankState,
  type SequenceEdge,
  type SequenceLabel,
  type SequenceLayout,
} from "../layout/sequence-pipe";
import { textWidth } from "../layout/measure";
import type { Point, Rect } from "../layout/scene";
import { SEQ_CARD, SEQ_FONT, SEQ_LINK, SEQ_LINK_FONT, SEQ_LOOK, SEQ_TYPE, SEQC_F, SEQC_N, SEQC_O, SEQC_O1, SEQC_V } from "../look/sequence";
import { type Corner, EASE, LOOK, MOTION, type Palette, type Theme } from "../look/values";
import { partRadius } from "./corner";
import type { SequenceLook } from "./look-store";
import type { EdgeTime, LabelTime, Timeline } from "../timeline";
import { USER_DASH, userEdgeOf } from "../user-blocks";
import type { Frame, Motion } from "./motion";
import { type Ctx, cssFont, esc, pathOf, r1 } from "./parts";

/** シーケンス図の部品の見た目 (Tracelyth #91、#93、#97、#111) */
const SEQ_CSS = [
  ".dg-strike{stroke:var(--c-rose);stroke-width:1.6;stroke-linecap:round}",
  // シーケンスの部品 (Tracelyth #91)
  ".dg-row{fill:color-mix(in srgb,var(--c-blue) 15%,var(--wash,var(--bg)))}",
  ".dg-ghost{opacity:.3}",
  ".dg-ghost-mask{fill:var(--bg)}",
  ".dg-ghost path{fill:none;stroke:var(--mute);stroke-width:1.5}",
  ".dg-ghost rect{fill:none;stroke:var(--mute);stroke-width:1}",
  ".dg-ghost circle{fill:none;stroke:var(--mute);stroke-width:1.2}",
  `.dg-ghost text{fill:var(--mute);${cssFont(SEQ_FONT)}}`,
  ".dg-ghost .dg-b{font-weight:700}",
  ".dg-sqe{fill:none;stroke:var(--c);stroke-linecap:round;stroke-linejoin:round}",
  ".dg-sqe-head{fill:var(--tk,var(--c))}",
  // 列の頭と器と札と管 (Tracelyth #93)
  ".dg-sqh-fr{fill:var(--surf);stroke:var(--line);stroke-width:2.5}",
  ".dg-sqh-mk{fill:var(--c)}",
  `.dg-sqh-i{${cssFont(SEQ_TYPE.headInitial)};fill:var(--on-c)}`,
  `.dg-sqh-n{${cssFont(SEQ_TYPE.headName)};fill:var(--ink)}`,
  `.dg-sqh-s{${cssFont(SEQ_TYPE.headSub)};fill:var(--mute);letter-spacing:.04em}`,
  ".dg-sqh-on{fill:none;stroke:var(--c);stroke-width:2.5}",
  ".dg-sqp{stroke:var(--line);stroke-linecap:round}",
  ".dg-sqlive{stroke:var(--c);stroke-linecap:round;stroke-opacity:.9}",
  ".dg-sqcall{fill:none;stroke:color-mix(in srgb,var(--c) 55%,var(--line));stroke-linecap:round}",
  ".dg-sqpulse{fill:var(--c-blue);stroke:var(--surf);stroke-width:1.5}",
  ".dg-sqtube{fill:none;stroke:color-mix(in srgb,var(--line) 70%,var(--surf));stroke-linecap:butt}",
  ".dg-sqliq{fill:none;stroke:var(--tk,var(--c));stroke-linecap:butt}",
  ".dg-sqstub{fill:none;stroke:var(--line);stroke-width:5;stroke-linecap:round}",
  ".dg-tk0{--tk:var(--c-amber)}",
  ".dg-tk1{--tk:color-mix(in srgb,var(--c-amber) 50%,var(--ink))}",
  ".dg-tk2{--tk:var(--c-green)}",
  ".dg-tk3{--tk:var(--c-violet)}",
  ".dg-sqt-fr{fill:var(--surf);stroke:var(--c-green);stroke-width:2.2}",
  ".dg-sqt-liq{fill:var(--tk)}",
  `.dg-sqt-n{${cssFont(SEQ_TYPE.tankName)};fill:var(--mute);letter-spacing:.04em}`,
  `.dg-sqt-v{${cssFont(SEQ_TYPE.tankValue)};fill:var(--c-green)}`,
  ".dg-sqt-undo{fill:var(--c-rose)}",
  ".dg-sqs-fr{fill:var(--surf);stroke:var(--line);stroke-width:1.2}",
  `.dg-sqs-n{${cssFont(SEQ_TYPE.slotName)};fill:var(--mute)}`,
  `.dg-sqs-v{${cssFont(SEQ_TYPE.slotValue)};fill:var(--ink)}`,
  ".dg-sqk-l{stroke:var(--c);stroke-width:1.8;stroke-dasharray:6 5}",
  ".dg-sqk-h{fill:var(--c)}",
  ".dg-sqk-b{fill:var(--surf);stroke:var(--c);stroke-width:1.4}",
  `.dg-sqk-t{${cssFont(SEQ_LINK_FONT)};fill:var(--ct)}`,
  ".dg-sqk-d{fill:var(--c)}",
  `.dg-sqk-dt{${cssFont(SEQ_LINK_FONT)};fill:var(--on-c)}`,
  // リバートで戻った値の札とリバートの札は赤で描く (Tracelyth #111)
  ".dg-sqk-t.dg-sqt-undo{fill:var(--c-rose)}",
  ".dg-sqk-d.dg-sqk-du{fill:var(--c-rose)}",
  ".dg-sql.dg-sql-write rect{fill:var(--surf);stroke:var(--line)}",
  ".dg-sqw-old{fill:var(--mute)}",
  ".dg-sqw-new{font-weight:700}",
  ".dg-sqw-to{fill:var(--mute)}",
  ".dg-sqw-cut{stroke:var(--c-rose);stroke-width:1.4;stroke-linecap:round}",
  ".dg-sql .dg-sqlog-pill{fill:var(--c);stroke:none}",
  `.dg-sql .dg-sqlog-mark{${cssFont(SEQ_TYPE.mark)};fill:var(--on-c)}`,
  // 呼び出しとログの表の形の札 (Tracelyth #97)
  ".dg-sql .dg-sqc-full,.dg-sql .dg-sqc-head{fill:var(--surf);fill-opacity:1;stroke:var(--c);stroke-width:1.6}",
  ".dg-sqc .dg-sqc-hr{fill:none;stroke:var(--hair);stroke-width:1.4}",
  `.dg-sqc .dg-sqc-o{${cssFont(SEQC_O)}}`,
  `.dg-sqc .dg-sqc-o1{${cssFont(SEQC_O1)}}`,
  `.dg-sqc .dg-sqc-f{${cssFont(SEQC_F)}}`,
  `.dg-sqc .dg-sqc-n{${cssFont(SEQC_N)}}`,
  `.dg-sqc .dg-sqc-v{${cssFont(SEQC_V)}}`,
  ".dg-sql .dg-sqc-o,.dg-sql .dg-sqc-o1,.dg-sql .dg-sqc-n{fill:var(--mute)}",
  ".dg-sql .dg-sqc-f{fill:var(--c)}",
  ".dg-sql .dg-sqc-v{fill:var(--ink)}",
  ".dg-sqc[data-card]{cursor:pointer}",
  ".dg-sqc-head{display:none}",
  // 図を置いた頁が `data-cards` で札を開くか閉じるかを決め、押した札 (`data-flip`) だけ逆にする
  '[data-cards="open"] .dg-sqc[data-flip] .dg-sqc-rows,[data-cards="open"] .dg-sqc[data-flip] .dg-sqc-full,[data-cards="folded"] .dg-sqc:not([data-flip]) .dg-sqc-rows,[data-cards="folded"] .dg-sqc:not([data-flip]) .dg-sqc-full{display:none}',
  '[data-cards="open"] .dg-sqc[data-flip] .dg-sqc-head,[data-cards="folded"] .dg-sqc:not([data-flip]) .dg-sqc-head{display:inline}',
  '[data-cards="open"] .dg-sqc[data-flip] .dg-sqc-top,[data-cards="folded"] .dg-sqc:not([data-flip]) .dg-sqc-top{transform:translateY(var(--drop,0))}',
  `.dg-sql text,.dg-sqn text{${cssFont(SEQ_FONT)};fill:var(--ct)}`,
  ".dg-sql .dg-b,.dg-sqn .dg-b{font-weight:700}",
  ".dg-sql-call rect{fill:var(--bg);fill-opacity:.92}",
  ".dg-sql-call text{fill:var(--ink)}",
  ".dg-sql-call .dg-b{fill:var(--ct)}",
  ".dg-sql-chip rect,.dg-sql-self rect,.dg-sql-stop rect,.dg-sqn rect{fill:color-mix(in srgb,var(--c) 9%,var(--surf));stroke:var(--c);stroke-width:1.1}",
  ".dg-sql-slate text{fill:var(--ink)}",
  ".dg-sql-slate rect{stroke:var(--line)}",
  ".dg-sql-stop rect{fill:var(--surf)}",
  ".dg-sqb-o circle{fill:var(--surf);stroke:var(--line);stroke-width:1.4}",
  `.dg-sqb-o text,.dg-sqb-on text{${cssFont(SEQ_TYPE.badge)};fill:var(--ink)}`,
  ".dg-sqb-on circle{fill:var(--c-blue)}",
  ".dg-sqb-on text{fill:var(--on-c)}",
  ".dg-stop circle{fill:var(--c-rose)}",
  ".dg-stop path{fill:none;stroke:var(--on-c);stroke-width:2;stroke-linecap:round}",
  ".dg-veil{fill:var(--bg);fill-opacity:.6}",
].join("");

/** 描いた部品を積む層。下から順に帯、線と生存線、光る線、列の頭、段の番号、札 */
type SeqLayers = Parameters<SequenceLook["draw"]>[3];

/** 札の字を描く。太字の所は `dg-b` の tspan にする */
function seqText(runs: readonly SeqRun[], x: number, y: number, anchor?: "middle"): string {
  const body = runs.map((r) => (r.bold ? `<tspan class="dg-b">${esc(r.text)}</tspan>` : esc(r.text))).join("");
  return `<text x="${r1(x)}" y="${r1(y)}"${anchor ? ` text-anchor="${anchor}"` : ""}>${body}</text>`;
}

/** 後のステップを先に薄く見せる形の出入り。初めから見えていて、そのステップの始まりで消える */
function seqGhostKf(m: Motion, a: number): string {
  return m.kf([
    [0, { opacity: 1 }],
    [Math.max(0, a - 0.05), { opacity: 1 }],
    [a, { opacity: 0 }],
    [m.total, { opacity: 0 }],
  ]);
}

/** 線を起こした操作の番号の印 (`段/番号`)。番号を持たない部品は持たない */
const seqOp = (part: { step: number; op?: number }): string => (part.op === undefined ? "" : ` data-op="${part.step}/${part.op}"`);

/** 列の頭 (Tracelyth #93)。コントラクトはパイプ図の箱と同じ枠と頭文字の印、アカウントは丸と頭文字で描く。角を落とす色味では丸めない */
function seqHead(box: SequenceLayout["boxes"][number], y: number, corner: Corner): string {
  const S = SEQ_LOOK;
  const who = box.icon !== undefined;
  const my = y + S.headH / 2;
  const mx = box.x + S.headPadX + S.markW / 2;
  const tx = box.x + S.headPadX + S.markW + S.markGap;
  const mark = who
    ? `<circle class="dg-sqh-mk" cx="${r1(mx)}" cy="${r1(my)}" r="${S.markW / 2}"/>`
    : `<rect class="dg-sqh-mk" x="${r1(mx - S.markW / 2)}" y="${r1(my - S.markW / 2)}" width="${S.markW}" height="${S.markW}" rx="${partRadius(corner, 6)}"/>`;
  const initial = `<text class="dg-sqh-i" data-initial="${esc(box.id)}" x="${r1(mx)}" y="${r1(my + 4.6)}" text-anchor="middle">${esc(([...box.name][0] ?? "").toUpperCase())}</text>`;
  // 名前は他の図の箱の名前と同じ `dg-sn` も持つ。置いた頁は図の名前をこの印で読み、図を縮める下限の字の大きさもこの字で測る
  const name = `<text class="dg-sn dg-sqh-n" x="${r1(tx)}" y="${r1(box.sub !== undefined ? my - 1.5 : my + 4.6)}">${esc(box.name)}</text>`;
  const note = box.sub !== undefined ? `<text class="dg-sqh-s" x="${r1(tx)}" y="${r1(my + 11.5)}">${esc(box.sub)}</text>` : "";
  return `<g class="dg-sqh ${who ? "dg-sqh-who" : "dg-sqh-cab"}" data-head="${esc(box.id)}" style="${cs(box.color)}"><rect class="dg-sqh-fr" x="${r1(box.x)}" y="${r1(y)}" width="${r1(box.w)}" height="${S.headH}" rx="${partRadius(corner, who ? S.headH / 2 : 10)}"/>${mark}${initial}${name}${note}</g>`;
}

/** 矢印の先。破線の戻りは開いた矢じり、実線は塗った矢じりで、お金の矢印は大きく描く */
function seqArrowHead(points: readonly Point[], dashed: boolean, money: boolean): string {
  const [ex, ey] = points[points.length - 1] as Point;
  const [px, py] = points[points.length - 2] as Point;
  const len = Math.hypot(ex - px, ey - py) || 1;
  const dx = (ex - px) / len;
  const dy = (ey - py) / len;
  if (dashed) {
    const a = 7;
    const h = 4.5;
    return `<path class="dg-sqe" d="M ${r1(ex - dx * a - dy * h)} ${r1(ey - dy * a + dx * h)} L ${r1(ex)} ${r1(ey)} L ${r1(ex - dx * a + dy * h)} ${r1(ey - dy * a - dx * h)}" style="stroke-width:1.6"/>`;
  }
  const a = money ? 13 : 8;
  const h = money ? 9.5 : 5;
  return `<path class="dg-sqe-head" d="M ${r1(ex)} ${r1(ey)} L ${r1(ex - dx * a - dy * h)} ${r1(ey - dy * a + dx * h)} L ${r1(ex - dx * a + dy * h)} ${r1(ey - dy * a - dx * h)} Z"/>`;
}

/** 線を引く動き。`a` から引き始めて `drawn` で引き終え、`after` の点 (リバートで戻す動き) が無ければ最後のステップまで残る */
function seqDrawKf(m: Motion, a: number, drawn: number, after?: Frame[]): string {
  return m.kf([
    [0, { opacity: 0, "stroke-dashoffset": 1 }],
    [a, { opacity: 0, "stroke-dashoffset": 1 }, EASE.inOut],
    [a + 0.05, { opacity: 1 }],
    [drawn, { "stroke-dashoffset": 0 }],
    ...(after ?? [
      [m.last, { opacity: 1, "stroke-dashoffset": 0 }, EASE.inOut] as Frame,
      [Math.min(m.last + MOTION.fade, m.total), { opacity: 0, "stroke-dashoffset": 0 }] as Frame,
    ]),
    [m.total, { opacity: 0, "stroke-dashoffset": 1 }],
  ]);
}

/**
 * 1 本の線 (Tracelyth #93)。呼び出しは横の管と動く印、お金は太い管とトークンの色の液、requireと書き換えとログは生存線から札へ出る短い管、
 * 戻りとリバートは破線で描く。`undoneAt` はリバートの時刻で、戻るお金の液はその時刻から送った側へ引いて消える
 */
function seqEdge(e: SequenceEdge, time: EdgeTime, m: Motion, corner: Corner, undoneAt?: { step: number; at: number }): { ghost: string; lit: string; pulse?: string } {
  const S = SEQ_LOOK;
  const self = e.from === e.to;
  const added = userEdgeOf(e.step, e.event);
  const dash = e.dash ?? (added?.shape === undefined ? undefined : USER_DASH[added.shape]);
  const money = e.block === "+money" || e.carry.kind === "coin";
  const key = `${e.step}/${e.event}`;
  const d = pathOf(e.points, corner);
  const { start: a, drawn: b } = time;
  const drawn = Math.max(b, a + 0.1);
  const ghost = `<g class="dg-a" data-ghost="edge ${key}" style="${seqGhostKf(m, a)}"><g class="dg-ghost"><path d="${d}"/></g></g>`;
  const op = seqOp(e);
  if (money) {
    const tone = e.tone === undefined ? "" : ` dg-tk${e.tone}`;
    const back: Frame[] | undefined =
      undoneAt === undefined || e.step >= undoneAt.step
        ? undefined
        : [
            [undoneAt.at, { opacity: 1, "stroke-dashoffset": 0 }, EASE.inOut],
            [undoneAt.at + 0.5, { opacity: 1, "stroke-dashoffset": 1 }],
            [undoneAt.at + 0.6, { opacity: 0, "stroke-dashoffset": 1 }],
          ];
    const tube = `<path class="dg-sqtube dg-a" data-tube="${key}" d="${d}" stroke-width="${S.moneyW}" style="${m.vis(a)}"/>`;
    const liquid = `<path class="dg-sqliq${tone} dg-a" data-liquid="${key}" pathLength="1" d="${d}" stroke-width="${S.liquidW}" style="stroke-dasharray:1;${seqDrawKf(m, a, drawn, back)}"/>`;
    const head = `<g class="dg-a${tone}" style="${m.vis(drawn - 0.05)}">${seqArrowHead(e.points, false, true)}</g>`;
    return { ghost, lit: `<g${op} style="${cs(e.color)}">${tube}${liquid}${head}</g>` };
  }
  if (dash !== undefined) {
    const body = `<path class="dg-sqe dg-a" d="${d}" stroke-dasharray="${dash}" style="stroke-width:${e.width};${m.vis(a)}"/>`;
    const head = `<g class="dg-a" style="${m.vis(drawn - 0.05)}">${seqArrowHead(e.points, true, false)}</g>`;
    return { ghost, lit: `<g${op} style="${cs(e.color)}">${body}${head}</g>` };
  }
  if (self) return { ghost, lit: `<g${op} style="${cs(e.color)}"><path class="dg-sqstub dg-a" d="${d}" style="${m.vis(a)}"/></g>` };
  // 呼び出しの管。管を引きながら、紺の印が呼んだ側から呼ばれた側へ動く
  const body = `<path class="dg-sqcall dg-a" pathLength="1" d="${d}" stroke-width="${e.width}" style="stroke-dasharray:1;${seqDrawKf(m, a, drawn)}"/>`;
  const head = `<g class="dg-a" style="${m.vis(drawn - 0.05)}">${seqArrowHead(e.points, false, false)}</g>`;
  const [x0, y0] = e.points[0] as Point;
  const [x1] = e.points[e.points.length - 1] as Point;
  const pulse = `<g class="dg-a" data-pulse="${key}" style="${m.move(
    [
      [0, x0, y0],
      [a, x0, y0],
      [drawn, x1, y0],
      [m.total, x1, y0],
    ],
    [
      [0, { opacity: 0 }],
      [Math.max(0, a - 0.01), { opacity: 0 }],
      [a, { opacity: 1 }],
      [drawn, { opacity: 1 }],
      [Math.min(drawn + 0.2, m.total), { opacity: 0 }],
      [m.total, { opacity: 0 }],
    ],
  )}"><rect class="dg-sqpulse" x="-9" y="-4.5" width="18" height="9" rx="${partRadius(corner, 4.5)}"/></g>`;
  return { ghost, lit: `<g${op} style="${cs(e.color)}">${body}${head}</g>`, pulse };
}

/** 札の字。折った呼び出しの札は行ごとに書く */
function seqWords(l: SequenceLabel, x: number): string {
  const S = SEQ_LOOK;
  if (!l.lines) return seqText(l.runs, x, l.y + l.h / 2 + 4, l.kind === "call" ? undefined : "middle");
  return l.lines.map((runs, k) => seqText(runs, x, l.y + S.callH / 2 + 4 + k * S.callH)).join("");
}

/**
 * 表の形の札 (Tracelyth #97)。行を含む枠 (`dg-sqc-full`) と見出しだけの枠 (`dg-sqc-head`) を持ち、閉じた札は行と行を含む枠を隠して見出しだけの枠を出す。
 * 呼び出しの札は閉じると見出しを線の上まで下ろす (`--drop`)。`key` が真の札は `data-card` を持ち、押すと開き閉じが替わる
 */
function seqCardBody(l: SequenceLabel & { card: SeqCard }, key: boolean, corner: Corner): string {
  const C = SEQ_CARD;
  const card = l.card;
  const log = card.mark !== undefined;
  const { x, y, w, h } = l;
  const hh = l.headH ?? 0;
  const left = x + C.padX;
  let head: string;
  if (card.mark !== undefined) {
    const pw = seqCardPill(card.mark);
    const ox = left + pw + C.pillGap;
    const owner = `${card.owner}.`;
    head = `<rect class="dg-sqlog-pill" x="${r1(left)}" y="${r1(y + C.pillY)}" width="${r1(pw)}" height="${C.pillH}" rx="${partRadius(corner, C.pillH / 2)}"/><text class="dg-sqlog-mark" x="${r1(left + pw / 2)}" y="${r1(y + C.pillY + C.pillH / 2 + 3.4)}" text-anchor="middle">${esc(card.mark)}</text><text class="dg-sqc-o1" x="${r1(ox)}" y="${r1(y + C.oneY)}">${esc(owner)}</text><text class="dg-sqc-f" x="${r1(ox + textWidth(owner, SEQC_O1))}" y="${r1(y + C.oneY)}">${esc(card.name)}</text>`;
  } else {
    head = `<text class="dg-sqc-o" x="${r1(left)}" y="${r1(y + C.ownerY)}">${esc(card.owner)}</text><text class="dg-sqc-f" x="${r1(left)}" y="${r1(y + C.nameY)}">${esc(card.name)}</text>`;
  }
  const rows =
    card.rows.length === 0
      ? ""
      : `<path class="dg-sqc-hr" d="M ${r1(x + 1)} ${r1(y + hh)} H ${r1(x + w - 1)}"/>` +
        card.rows
          .map((r, i) => {
            const ry = y + hh + C.rowTop + i * C.rowH;
            return `<text class="dg-sqc-n" x="${r1(left)}" y="${r1(ry)}">${esc(r.name)}</text><text class="dg-sqc-v" x="${r1(x + w - C.padX)}" y="${r1(ry)}" text-anchor="end">${esc(r.value)}</text>`;
          })
          .join("");
  const drop = log ? 0 : h - hh;
  return `<g class="dg-sqc${log ? " dg-sqc-log" : ""}"${key ? ` data-card="${l.step}/${l.event}"` : ""} style="--drop:${r1(drop)}px"><rect class="dg-sqc-full" x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${partRadius(corner, 5)}"/><g class="dg-sqc-top"><rect class="dg-sqc-head" x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(hh)}" rx="${partRadius(corner, 5)}"/>${head}</g><g class="dg-sqc-rows">${rows}</g></g>`;
}

/** 札の中身。書き換えは前の値に打ち消しの線を引いて後の値を並べ、ログは「ログ」の印を置く (Tracelyth #93) */
function seqLabelBody(l: SequenceLabel, corner: Corner): string {
  const S = SEQ_LOOK;
  const rect = `<rect x="${r1(l.x)}" y="${r1(l.y)}" width="${r1(l.w)}" height="${r1(l.h)}" rx="${partRadius(corner, l.kind === "call" ? 3 : 5)}"/>`;
  const base = l.y + l.h / 2 + 4;
  if (l.write) {
    const w = l.write;
    const sp = seqSpace();
    const x = l.x + S.chipPadX;
    const oldX = x + textWidth(w.slot, SEQ_FONT) + sp;
    const oldW = w.old === undefined ? 0 : textWidth(w.old, SEQ_FONT);
    const toX = oldX + oldW + sp;
    const nowX = w.old === undefined ? oldX : toX + textWidth("→", SEQ_FONT) + sp;
    const at = (left: number, body: string): string => `<text x="${r1(left)}" y="${r1(base)}">${body}</text>`;
    const old =
      w.old === undefined
        ? ""
        : `${at(oldX, `<tspan class="dg-sqw-old">${esc(w.old)}</tspan>`)}<line class="dg-sqw-cut" x1="${r1(oldX - 1.5)}" y1="${r1(base - 3.8)}" x2="${r1(oldX + oldW + 1.5)}" y2="${r1(base - 3.8)}"/>${at(toX, `<tspan class="dg-sqw-to">→</tspan>`)}`;
    const unit = w.unit === undefined ? "" : ` ${esc(w.unit)}`;
    return `${rect}${at(x, `<tspan class="dg-sqw-slot">${esc(w.slot)}</tspan>`)}${old}${at(nowX, `<tspan class="dg-sqw-new">${esc(w.now)}</tspan>${unit}`)}`;
  }
  if (l.log) {
    const pw = seqPillWidth(l.log.mark);
    const px = l.x + S.chipPadX - 3;
    const ph = l.h - 8;
    return `${rect}<rect class="dg-sqlog-pill" x="${r1(px)}" y="${r1(l.y + 4)}" width="${r1(pw)}" height="${r1(ph)}" rx="${r1(partRadius(corner, ph / 2))}"/><text class="dg-sqlog-mark" x="${r1(px + pw / 2)}" y="${r1(l.y + l.h / 2 + 3.4)}" text-anchor="middle">${esc(l.log.mark)}</text>${seqText(l.log.rest, px + pw + S.pillGap, base)}`;
  }
  const x = l.kind === "call" ? l.x + S.chipPadX / 2 : l.x + l.w / 2;
  return `${rect}${seqWords(l, x)}`;
}

/** 札。呼び出しの札は字だけを管の上に、ほかは枠に入れて描く。出たステップから最後のステップまで残る */
function seqLabel(l: SequenceLabel, time: LabelTime, m: Motion, corner: Corner): { ghost: string; shown: string } {
  const S = SEQ_LOOK;
  if (l.card) {
    const carded = { ...l, card: l.card };
    const extra = l.card.mark !== undefined ? " dg-sql-log" : "";
    const shown = `<g class="dg-sql dg-sql-${l.kind} dg-sql-${l.color}${extra} dg-a" data-label="${l.step}/${l.event}" style="${cs(l.color)};${m.rise(time.start, time.end)}">${seqCardBody(carded, true, corner)}</g>`;
    return { ghost: `<g class="dg-a" data-ghost="label ${l.step}/${l.event}" style="${seqGhostKf(m, time.start)}"><g class="dg-ghost">${seqCardBody(carded, false, corner)}</g></g>`, shown };
  }
  const x = l.kind === "call" ? l.x + S.chipPadX / 2 : l.x + l.w / 2;
  const y = l.y + l.h / 2 + 4;
  const rect = `<rect x="${r1(l.x)}" y="${r1(l.y)}" width="${r1(l.w)}" height="${r1(l.h)}" rx="${partRadius(corner, l.kind === "call" ? 3 : 5)}"/>`;
  const extra = l.write ? " dg-sql-write" : l.log ? " dg-sql-log" : "";
  const shown = `<g class="dg-sql dg-sql-${l.kind} dg-sql-${l.color}${extra} dg-a" data-label="${l.step}/${l.event}" style="${cs(l.color)};${m.rise(time.start, time.end)}">${seqLabelBody(l, corner)}</g>`;
  // 枠の札を先に薄く見せる形は、下を地の色で塗る。塗らないと薄い線が札の字を横切る
  const mask = l.kind === "call" ? "" : `<rect class="dg-ghost-mask" x="${r1(l.x)}" y="${r1(l.y)}" width="${r1(l.w)}" height="${r1(l.h)}" rx="${partRadius(corner, 5)}"/>`;
  const ghost = `<g class="dg-a" data-ghost="label ${l.step}/${l.event}" style="${seqGhostKf(m, time.start)}">${mask}<g class="dg-ghost">${l.kind === "call" ? "" : rect}${l.lines ? seqWords(l, x) : seqText(l.runs, x, y, l.kind === "call" ? undefined : "middle")}</g></g>`;
  return { ghost, shown };
}

/** ステップの番号。今のステップは塗った丸、前のステップは枠の丸、後のステップは先に薄く見せる */
function seqBadge(b: { step: number; x: number; y: number }, ctx: Ctx): { ghost: string; shown: string } {
  const { m } = ctx;
  const span = ctx.t.steps[b.step];
  if (!span) return { ghost: "", shown: "" };
  const r = LOOK.badge.r;
  const n = esc(String(b.step + 1));
  const mark = `<circle cx="${r1(b.x)}" cy="${r1(b.y)}" r="${r}"/><text x="${r1(b.x)}" y="${r1(b.y + 3.6)}" text-anchor="middle">${n}</text>`;
  const ghost = `<g class="dg-a" data-ghost="badge ${b.step}" style="${seqGhostKf(m, span.start)}"><g class="dg-ghost">${mark}</g></g>`;
  const past = `<g class="dg-sqb-o dg-a" style="${m.vis(span.start)}">${mark}</g>`;
  const now = `<g class="dg-sqb-on dg-a" data-badge="${b.step}" style="${m.vis(span.start, span.end, { within: true })}">${mark}</g>`;
  return { ghost, shown: past + now };
}

/** 器と札の値ごとの出入り。`at` は値が変わる時刻の並びで、`k` 番目の値は `at[k]` から次の値の時刻まで見える */
function seqStateKf(m: Motion, at: readonly number[], k: number): string {
  const f = 0.2;
  const off = at[k + 1];
  if (k === 0) {
    return m.kf([
      [0, { opacity: 1 }],
      ...(off === undefined
        ? []
        : ([
            [off, { opacity: 1 }],
            [off + f, { opacity: 0 }],
            [m.last, { opacity: 0 }],
            [Math.min(m.last + f, m.total), { opacity: 1 }],
          ] as Frame[])),
      [m.total, { opacity: 1 }],
    ]);
  }
  const on = at[k] ?? 0;
  return m.kf([
    [0, { opacity: 0 }],
    [on, { opacity: 0 }],
    [on + f, { opacity: 1 }],
    ...(off === undefined
      ? ([
          [m.last, { opacity: 1 }],
          [Math.min(m.last + f, m.total), { opacity: 0 }],
        ] as Frame[])
      : ([
          [off, { opacity: 1 }],
          [off + f, { opacity: 0 }],
        ] as Frame[])),
    [m.total, { opacity: 0 }],
  ]);
}

/** 値が変わる時刻。お金と書き換えは線を引き終えた時、リバートは赤い×の丸が出た時 */
function seqStateTimes(states: readonly (SeqTankState | SeqSlotState | SeqLinkState)[], timeline: Timeline): number[] {
  return states.map((x) =>
    x.step < 0 ? 0 : (timeline.edges.find((t) => t.step === x.step && t.event === x.event)?.drawn ?? timeline.steps[x.step]?.start ?? 0),
  );
}

/** 列の頭の下の器と札 (Tracelyth #93)。器はトークンの名前と、液の水位と数を値ごとに持ち、札は名前と値ごとの字を持つ */
function seqShelf(layout: SequenceLayout, timeline: Timeline, m: Motion, corner: Corner): string {
  const S = SEQ_LOOK;
  const tanks = layout.tanks.map((t) => {
    const cx = t.x + t.w / 2;
    const vy = t.y + S.tankTop;
    const inner = { x: t.x + 3, y: vy + 3, w: t.w - 6, h: S.tankH - 6 };
    const at = seqStateTimes(t.states, timeline);
    const states = t.states
      .map((st, k) => {
        const h = inner.h * S.tankFill * st.level;
        return `<g class="dg-a" data-tank-state="${esc(t.box)}/${esc(t.token)}/${k}" style="${seqStateKf(m, at, k)}"><rect class="dg-sqt-liq" x="${r1(inner.x)}" y="${r1(inner.y + inner.h - h)}" width="${r1(inner.w)}" height="${r1(h)}" rx="${partRadius(corner, 3)}"/><text class="dg-sqt-v${st.undo ? " dg-sqt-undo" : ""}" x="${r1(cx)}" y="${r1(vy + S.tankH + 12)}" text-anchor="middle">${esc(st.text)}</text></g>`;
      })
      .join("");
    return `<g class="dg-sqt dg-tk${t.tone}" data-tank="${esc(t.box)}/${esc(t.token)}"><text class="dg-sqt-n" x="${r1(cx)}" y="${r1(t.y + 10)}" text-anchor="middle">${esc(t.name)}</text><rect class="dg-sqt-fr" x="${r1(t.x)}" y="${r1(vy)}" width="${r1(t.w)}" height="${S.tankH}" rx="${partRadius(corner, 7)}"/>${states}</g>`;
  });
  const slots = layout.slots.map((x) => {
    const cx = x.x + x.w / 2;
    const names = x.lines.map((l, i) => `<text class="dg-sqs-n" x="${r1(cx)}" y="${r1(x.y + 13 + i * S.slotLine)}" text-anchor="middle">${esc(l)}</text>`).join("");
    const at = seqStateTimes(x.states, timeline);
    const states = x.states
      .map(
        (st, k) =>
          `<g class="dg-a" data-slot-state="${esc(x.box)}/${esc(x.name)}/${k}" style="${seqStateKf(m, at, k)}"><text class="dg-sqs-v${st.undo ? " dg-sqt-undo" : ""}" x="${r1(cx)}" y="${r1(x.y + x.h - 7)}" text-anchor="middle">${esc(st.text)}</text></g>`,
      )
      .join("");
    return `<g class="dg-sqs" data-slot="${esc(x.box)}/${esc(x.name)}"><rect class="dg-sqs-fr" x="${r1(x.x)}" y="${r1(x.y)}" width="${r1(x.w)}" height="${r1(x.h)}" rx="${partRadius(corner, 6)}"/>${names}${states}</g>`;
  });
  // 2人をキーに持つ値の点線の矢印。札は値が変わるたびに字を替え、増えた量と減った量を札の右の印に書く (#107)
  const links = layout.links.map((l) => {
    const a = SEQ_LINK.arrow;
    const dir = Math.sign(l.x2 - l.x1) || 1;
    const tip = l.x2;
    const line = `<line class="dg-sqk-l" x1="${r1(l.x1)}" y1="${r1(l.y)}" x2="${r1(tip - dir * a)}" y2="${r1(l.y)}"/><path class="dg-sqk-h" d="M ${r1(tip - dir * a * 1.6)} ${r1(l.y - a)} L ${r1(tip)} ${r1(l.y)} L ${r1(tip - dir * a * 1.6)} ${r1(l.y + a)} Z"/>`;
    const at = seqStateTimes(l.states, timeline);
    const base = l.label.y + l.label.h / 2 + 11.5 * 0.36;
    const cx = l.label.x + l.label.w / 2;
    const states = l.states
      .map((st, k) => {
        const dw = st.deltaW ?? 0;
        const delta = st.delta
          ? `<rect class="dg-sqk-d${st.undo ? " dg-sqk-du" : ""}" x="${r1(l.label.x + l.label.w + SEQ_LINK.deltaGap)}" y="${r1(l.label.y)}" width="${r1(dw)}" height="${r1(l.label.h)}" rx="${r1(partRadius(corner, l.label.h / 2))}"/><text class="dg-sqk-dt" x="${r1(l.label.x + l.label.w + SEQ_LINK.deltaGap + dw / 2)}" y="${r1(base)}" text-anchor="middle">${esc(st.delta)}</text>`
          : "";
        return `<g class="dg-a" data-link-state="${esc(l.from)}>${esc(l.to)}/${esc(l.name)}/${k}" style="${seqStateKf(m, at, k)}"><text class="dg-sqk-t${st.undo ? " dg-sqt-undo" : ""}" x="${r1(cx)}" y="${r1(base)}" text-anchor="middle">${esc(st.text)}</text>${delta}</g>`;
      })
      .join("");
    return `<g class="dg-sqk" data-link="${esc(l.from)}>${esc(l.to)}/${esc(l.name)}" style="${cs("violet")}">${line}<rect class="dg-sqk-b" x="${r1(l.label.x)}" y="${r1(l.label.y)}" width="${r1(l.label.w)}" height="${r1(l.label.h)}" rx="${r1(partRadius(corner, l.label.h / 2))}"/>${states}</g>`;
  });
  return tanks.join("") + slots.join("") + links.join("");
}

/** 寄って追う形の上に留める列の頭と器と札。`pad` は留める帯の上の余白 */
function seqBand(layout: SequenceLayout, timeline: Timeline, m: Motion, pad: number, corner: Corner): string {
  const top = Math.min(...layout.boxes.map((b) => b.y));
  const body = layout.boxes.map((box) => seqHead(box, box.y, corner)).join("") + seqShelf(layout, timeline, m, corner);
  return `<g transform="translate(0 ${r1(pad - top)})">${body}</g>`;
}

/** 留める帯の高さ。列の頭と器と札の全部が入る */
const seqBandHeight = (layout: SequenceLayout, pad: number): number => pad * 2 + (layout.shelf - Math.min(...layout.boxes.map((b) => b.y)));

/** シーケンスの部品を、層ごとに積む (Tracelyth #91、#93) */
function drawSequenceParts(layout: SequenceLayout, timeline: Timeline, ctx: Ctx, L: SeqLayers): void {
  const { m } = ctx;
  const S = SEQ_LOOK;
  for (const r of layout.rows) {
    const span = timeline.steps[r.step];
    if (span)
      L.band.push(
        `<rect class="dg-row dg-a" data-row="${r.step}" x="${r1(r.x)}" y="${r1(r.y)}" width="${r1(r.w)}" height="${r1(r.h)}" rx="${partRadius(ctx.corner, 8)}" style="${m.vis(span.start, span.end, { within: true })}"/>`,
      );
  }
  // 生存線は管。呼ばれている間は、呼び出しが出る時からその列の管に紺の管を重ねる
  for (const l of layout.lifelines)
    L.base.push(`<line class="dg-sqp" data-pipe="${esc(l.id)}" x1="${r1(l.x)}" y1="${r1(l.y1)}" x2="${r1(l.x)}" y2="${r1(l.y2)}" stroke-width="${S.pipeW}"/>`);
  const timeOf = (e: { step: number; event: number }): EdgeTime | undefined => timeline.edges.find((t) => t.step === e.step && t.event === e.event);
  const xOf = new Map(layout.lifelines.map((l) => [l.id, l.x]));
  for (const bar of layout.bars) {
    const t = timeOf(bar);
    const x = xOf.get(bar.box);
    if (!t || x === undefined) continue;
    L.base.push(
      `<line class="dg-sqlive dg-a" data-live="${bar.step}/${bar.event}" x1="${r1(x)}" y1="${r1(bar.y)}" x2="${r1(x)}" y2="${r1(bar.y + bar.h)}" stroke-width="${S.liveW}" style="${cs("blue")};${m.vis(t.start)}"/>`,
    );
    // 呼ばれている間は、列の頭の枠も紺にする
    const box = layout.boxes.find((b) => b.id === bar.box);
    const ret = layout.edges.find(
      (e) => e.from === bar.box && e.from !== e.to && (e.block === "+ret" || e.block === "+revert") && Math.abs((e.points[0] as Point)[1] - (bar.y + bar.h)) < 1,
    );
    const until = ret ? (timeOf(ret)?.drawn ?? m.last) : m.last;
    if (box)
      L.node.push(
        `<rect class="dg-sqh-on dg-a" x="${r1(box.x)}" y="${r1(box.y)}" width="${r1(box.w)}" height="${r1(box.h)}" rx="${partRadius(ctx.corner, box.icon !== undefined ? r1(box.h / 2) : 10)}" style="${cs("blue")};${m.vis(t.start, until, { within: true })}"/>`,
      );
  }
  const marked = new Set(layout.marks.map((k) => `${k.step}/${k.event}`));
  // リバートで戻ったお金の線と書き換えの札は、リバートのステップから薄くする
  const red = layout.edges.find((e) => e.block === "+revert");
  const undoneAt = red ? timeline.steps[red.step]?.start : undefined;
  const fade =
    undoneAt === undefined
      ? ""
      : m.kf([
          [0, { opacity: 1 }],
          [undoneAt, { opacity: 1 }, EASE.inOut],
          [undoneAt + MOTION.fade, { opacity: 0.35 }],
          [m.total, { opacity: 0.35 }],
        ]);
  const undone = (e: SequenceEdge): boolean =>
    red !== undefined && e.step < red.step && (e.block === "+money" || e.carry.kind === "coin" || e.block === "+write" || e.block === "+log");
  const back = red && undoneAt !== undefined ? { step: red.step, at: undoneAt } : undefined;
  for (const e of layout.edges) {
    const time = timeOf(e);
    if (!time) continue;
    if (marked.has(`${e.step}/${e.event}`)) continue;
    const drawn = seqEdge(e, time, m, ctx.corner, back);
    L.base.push(drawn.ghost);
    L.lit.push(undone(e) ? `<g class="dg-a" data-undone="${e.step}/${e.event}" style="${fade}">${drawn.lit}</g>` : drawn.lit);
    if (drawn.pulse) L.lit.push(drawn.pulse);
  }
  for (const k of layout.marks) {
    const time = timeOf(k);
    if (!time) continue;
    const { x, y } = k;
    const c = 3.6;
    L.top.push(
      `<g class="dg-stop dg-a" data-stop="${esc(k.box)}"${seqOp(k)} style="${cs("rose")};${m.vis(time.start)}"><circle cx="${r1(x)}" cy="${r1(y)}" r="${S.markR}"/><path d="M ${r1(x - c)} ${r1(y - c)} L ${r1(x + c)} ${r1(y + c)} M ${r1(x + c)} ${r1(y - c)} L ${r1(x - c)} ${r1(y + c)}"/></g>`,
    );
  }
  for (const box of layout.boxes) L.node.push(seqHead(box, box.y, ctx.corner));
  L.node.push(seqShelf(layout, timeline, m, ctx.corner));
  for (const b of layout.badges) {
    if (!timeline.steps[b.step]) continue;
    const drawn = seqBadge(b, ctx);
    L.base.push(drawn.ghost);
    L.badge.push(drawn.shown);
  }
  for (const l of layout.labels) {
    const time = timeline.labels.find((t) => t.step === l.step && t.event === l.event);
    if (!time) continue;
    // この見た目の札は、出た段の後も最後の段まで残す (Tracelyth #91)。時刻の表は見た目を問わず組むので、ここで終わりを最後に替える (#3720)
    const drawn = seqLabel(l, { ...time, end: m.last }, m, ctx.corner);
    L.base.push(drawn.ghost);
    L.top.push(drawn.shown);
  }
  for (const a of layout.actions) {
    const time = timeline.events.find((t) => t.step === a.step && t.event === a.event);
    if (!time) continue;
    const rect = `<rect x="${r1(a.x)}" y="${r1(a.y)}" width="${r1(a.w)}" height="${r1(a.h)}" rx="${partRadius(ctx.corner, 5)}"/>`;
    const words = seqText(a.runs, a.x + S.chipPadX, a.y + a.h / 2 + 4);
    L.base.push(
      `<g class="dg-a" data-ghost="note ${a.step}/${a.event}" style="${seqGhostKf(m, time.at)}"><rect class="dg-ghost-mask" x="${r1(a.x)}" y="${r1(a.y)}" width="${r1(a.w)}" height="${r1(a.h)}" rx="${partRadius(ctx.corner, 5)}"/><g class="dg-ghost">${rect}${words}</g></g>`,
    );
    L.top.push(`<g class="dg-sqn dg-a" data-note="${a.step}/${a.event}" style="${cs(a.color)};${m.rise(time.at, m.last)}">${rect}${words}</g>`);
  }
  // リバートで戻ったお金と書き換えの札を、リバートのステップから薄くして線で消す
  for (const k of layout.strikes) {
    const from = timeline.steps[k.step]?.start;
    if (from === undefined) continue;
    const l =
      k.of !== undefined
        ? layout.labels.find((x) => `${x.step}/${x.event}` === k.of)
        : [...layout.labels, ...layout.actions].find((x) => Math.abs(x.y + x.h / 2 - (k.y + k.h / 2)) < 1 && k.x >= x.x - 1 && k.x + k.w <= x.x + x.w + 1);
    const veil = l ? `<rect class="dg-veil" x="${r1(l.x)}" y="${r1(l.y)}" width="${r1(l.w)}" height="${r1(l.h)}" rx="${partRadius(ctx.corner, 5)}"/>` : "";
    L.top.push(`<g class="dg-a" style="${m.vis(from)}">${veil}<line class="dg-strike" x1="${r1(k.x)}" y1="${r1(k.y + k.h / 2)}" x2="${r1(k.x + k.w)}" y2="${r1(k.y + k.h / 2)}"/></g>`);
  }
}

/**
 * 段 `step` を見せる寄って追う窓の真ん中 (Tracelyth #91)。中心に寄せると、窓より広いステップは左右の両方が切れるので、
 * 選んだ絵 (#86 の問い3の案A) と同じく、ステップを始めた線から読ませる。段で動く物が無い段は前の段の真ん中のまま
 */
function seqFollow(layout: SequenceLayout, step: number, focus: Rect | undefined, prev: [number, number], vw: number, below: number): [number, number] {
  if (!focus) return prev;
  const first = Math.min(...[...layout.edges, ...layout.actions].filter((p) => p.step === step).map((p) => p.event));
  const starts = layout.edges.filter((e) => e.step === step && e.event === first).flatMap((e) => e.points.map((p) => p[0]));
  const left = Math.max(focus.x, (starts.length > 0 ? Math.min(...starts) : focus.x) - SEQ_LOOK.followLead);
  return [focus.w <= vw ? focus.x + focus.w / 2 : left + vw / 2, focus.h <= below ? focus.y + focus.h / 2 : focus.y - SEQ_LOOK.followLead / 2 + below / 2];
}

/**
 * 今のステップの帯と生存線の帯の地 (Tracelyth #91)。明るいテーマの地 (--bg) は色を持つため、混ぜると灰色に寄るので白にする。
 * 明暗で地を替えない色味 (arcade) は明るい表示でも暗い地なので、白でなく面の色を使う
 */
function seqVars(palette: Palette, theme: Theme): string {
  const light = theme === "light" && palette.light.bg !== palette.dark.bg;
  return `--wash:${light ? SEQ_LOOK.wash : "var(--surf)"}`;
}

/** パイプ図の部品で描く時系列図の見た目の組。後から読む塊が置き場へ置く (#3720) */
export const SEQUENCE_PIPE: SequenceLook = {
  layout: (diagram, lang) => layoutSequencePipe(diagram, lang),
  draw: (layout, timeline, ctx, layers) => drawSequenceParts(layout as SequenceLayout, timeline, ctx, layers),
  band: (layout, timeline, m, pad, corner) => seqBand(layout as SequenceLayout, timeline, m, pad, corner),
  bandHeight: (layout, pad) => seqBandHeight(layout as SequenceLayout, pad),
  shelf: (layout) => (layout as SequenceLayout).shelf,
  follow: (layout, step, focus, prev, vw, below) => seqFollow(layout as SequenceLayout, step, focus, prev, vw, below),
  followAspect: SEQ_LOOK.followAspect,
  css: SEQ_CSS,
  vars: seqVars,
};
