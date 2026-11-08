/**
 * `dragon check --layout` の中身 (#3484)。記法から図を描き、崩れを既定の幅と携帯の幅の両方で数えて、知らせる文を作る。
 *
 * 崩れの数え方は `breaks.ts` が持つ。ここは幅ごとに描いて突き合わせ、携帯の幅でだけ出る崩れに幅を付ける。
 * 列の図と試す図と配管の図は幅で組み方を変えるので、既定の幅で崩れない図も携帯の幅で崩れることがある。
 */
import { capital, FIGURE_TEXT, spaced } from "../figure-text";
import { type ParseOptions, parseNotation } from "../parser";
import type { Diagram } from "../schema";
import { tokenize } from "../tokenize";
import type { UserBlocks } from "../user-blocks";
import { DEFAULT_LANG, type NotationLang } from "../words";
import { boxOutline } from "../blocks/box/draw";
import type { Point } from "../layout/scene";
import { type BreakFinder, breakKey, findBreaks, type FrameSide, type LayoutBreak, type LayoutPart } from "./breaks";
import { drawDiagram } from "./draw";

/**
 * 描いた物から崩れを数える関数 (#3494)。描く処理に渡し、描いた後に呼ばせる。
 * 足した箱のブロックの形の輪郭はここで組む。描く処理が呼ぶので、足したブロックの定義が有効な間に組める
 */
const finder: BreakFinder = (drawn) =>
  findBreaks({
    ...drawn,
    outlines: new Map(
      drawn.boxes.flatMap((box): [string, Point[][]][] => {
        const outline = boxOutline(box);
        return outline ? [[box.id, outline]] : [];
      }),
    ),
  });

/** 崩れを確かめる携帯の幅 (CSS の px)。よく使われる携帯の画面の幅 */
const NARROW_WIDTH = 390;

/**
 * 既定の幅と幅 `NARROW_WIDTH` で描いた崩れを突き合わせる。`render` は幅を受け取って描き、崩れを返す。
 * 両方の幅で出る崩れは幅を持たず、携帯の幅でだけ出る崩れは幅を持つ。既定の幅の崩れを先に、携帯の幅でだけ出る崩れを後に並べる
 */
export function checkLayout(render: (width: number | undefined) => LayoutBreak[]): LayoutBreak[] {
  const wide = render(undefined);
  const narrow = render(NARROW_WIDTH);
  const known = new Set(wide.map(breakKey));
  return [...wide, ...narrow.filter((b) => !known.has(breakKey(b))).map((b) => ({ ...b, width: NARROW_WIDTH }))];
}

/** 読めた図 `diagram` の崩れ。描けない図は描く処理の断りを投げる */
export function diagramBreaks(diagram: Diagram, lang: NotationLang = DEFAULT_LANG, blocks?: UserBlocks): LayoutBreak[] {
  // 図の頭に書かずに渡した定義 (`dragon check --blocks`、#3508) も描く処理に渡す
  return checkLayout((width) => drawDiagram(diagram, { lang, findBreaks: finder, ...(width === undefined ? {} : { width }), ...(blocks === undefined ? {} : { blocks }) }).breaks ?? []);
}

/** 記法 `text` の崩れ。記法に誤りがあれば描かずに空を返す (誤りは `parseNotation` か `dragon check` が出す) */
export function checkLayoutText(text: string, options: ParseOptions = {}): LayoutBreak[] {
  const parsed = parseNotation(text, options);
  return parsed.ok ? diagramBreaks(parsed.diagram, options.lang ?? DEFAULT_LANG, options.blocks) : [];
}

/** 記法 `text` の段を始める `step` の行の番号 (1 から数える) を段の順に */
export const stepLines = (text: string): number[] => tokenize(text).flatMap((line) => (line.text.split(/\s/u)[0] === "step" ? [line.line] : []));

/**
 * 図の枠からはみ出す部品を知らせる文 (#3515)。枠のどの端かと、部品が枠の端からはみ出す。
 * 崩れを探す処理だけが読むので、描くだけの頁が最初に読む字の表 (`FIGURE_TEXT`) に置かない。置くと最初に読む量の上限を超える
 */
const FRAME_TEXT: Record<NotationLang, { edge: (side: FrameSide) => string; out: (part: string, edge: string) => string }> = {
  ja: {
    edge: (side) => `図の枠の${{ left: "左端", right: "右端", top: "上端", bottom: "下端" }[side]}`,
    out: (part, edge) => `${spaced(part)}が${edge}からはみ出す`,
  },
  en: {
    edge: (side) => `the ${side} edge of the diagram frame`,
    out: (part, edge) => capital(`${part} sticks out of ${edge}`),
  },
};

/** 崩れを知らせる文。段の番号は文に含めない (命令の行が頭に段を書く) */
export function describeBreak(b: LayoutBreak, lang: NotationLang = DEFAULT_LANG): string {
  const t = FIGURE_TEXT[lang];
  const name = (part: LayoutPart): string => {
    switch (part.kind) {
      case "badge":
        return t.badgeName(String(part.step));
      case "box":
        return t.quoted(part.name);
      case "slot":
        return t.slotOf(part.box);
      case "text":
        return t.quoted(part.text);
      case "line":
        return t.lineOf(part.from, part.to, part.step);
      case "icon":
        return t.iconOf(part.box);
      case "coin":
        return t.coin;
      case "envelope":
        return t.envelope;
      case "frame":
        return FRAME_TEXT[lang].edge(part.side);
    }
  };
  const [a, b2] = b.parts;
  const said =
    b.kind === "badge-off-shape"
      ? t.floatsOff(name(a), name(b2))
      : b.kind === "slot-outside-shape" || b.kind === "text-outside-shape"
        ? t.sticksOut(name(a), name(b2))
        : b.kind === "badges-close"
          ? t.tooClose(name(a), name(b2))
          : b.kind === "part-outside-frame"
            ? FRAME_TEXT[lang].out(name(a), name(b2))
            : t.runClose(name(a), name(b2));
  return b.width === undefined ? said : `${said} ${t.atWidth(b.width)}`;
}
