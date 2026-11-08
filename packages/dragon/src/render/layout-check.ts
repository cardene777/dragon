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
import { type BreakFinder, breakKey, findBreaks, type LayoutBreak, type LayoutPart } from "./breaks";
import { drawDiagram } from "./draw";

/**
 * 描いた物から崩れを数える関数 (#3494)。描く処理に渡し、描いた後に呼ばせる。
 * 足した箱のブロックの形の輪郭はここで組む。描く処理が呼ぶので、足したブロックの定義が有効な間に組める。
 * 枠線を描く囲みと列と帯もここで組む (#3525)。囲みは原本の名前で、列 (枝の帯) と時間軸の図の帯は描いた名前で呼ぶ
 */
const finder: BreakFinder = ({ regions, strip, diagram, ...drawn }) =>
  findBreaks({
    ...drawn,
    frames: [
      ...regions.map((r) => ({ name: diagram.regions?.find((g) => g.id === r.id)?.name ?? r.lines.join(" "), rect: r })),
      ...(strip ? [{ name: strip.title, rect: strip }] : []),
    ],
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
 * 崩れを知らせる文の言葉 (#3484)。運ぶ物の枠と段を添えた線と囲みの枠線の呼び方、丸が箱の形から浮く、枠か字が箱の形からはみ出す、
 * 2 つの丸が近すぎる、丸が枠線に乗る (#3525)、2 本の線が並んで近すぎる、携帯の幅でだけ出る崩れの幅。
 * 崩れの確かめは見本帳が最初に読む script に載せないので (#3494)、図の字の表 `FIGURE_TEXT` ではなくここに置く
 */
interface BreakText {
  slotOf: (box: string) => string;
  lineOf: (from: string, to: string, step: number) => string;
  frameOf: (name: string) => string;
  floatsOff: (badge: string, box: string) => string;
  sticksOut: (part: string, box: string) => string;
  tooClose: (a: string, b: string) => string;
  onFrame: (badge: string, frame: string) => string;
  runClose: (a: string, b: string) => string;
  atWidth: (width: number) => string;
}

const BREAK_TEXT: Record<NotationLang, BreakText> = {
  ja: {
    slotOf: (box) => `「${box}」の運ぶ物の枠`,
    lineOf: (from, to, step) => `線 ${from} → ${to} (段 ${step})`,
    frameOf: (name) => (name === "" ? "枠線" : `「${name}」の枠線`),
    floatsOff: (badge, box) => `${spaced(badge)}が${box}の形から離れて浮く`,
    sticksOut: (part, box) => `${spaced(part)}が${box}の形からはみ出す`,
    tooClose: (a, b) => `${spaced(a)}と${spaced(b)}が近すぎる`,
    onFrame: (badge, frame) => `${spaced(badge)}が${frame}に乗る`,
    runClose: (a, b) => `${spaced(a)}と${spaced(b)}が並んで近すぎる`,
    atWidth: (width) => `(幅 ${width} の時)`,
  },
  en: {
    slotOf: (box) => `the carry slot of "${box}"`,
    lineOf: (from, to, step) => `the line ${from} → ${to} (step ${step})`,
    frameOf: (name) => (name === "" ? "a border" : `the border of "${name}"`),
    floatsOff: (badge, box) => capital(`${badge} floats away from the shape of ${box}`),
    sticksOut: (part, box) => capital(`${part} sticks out of the shape of ${box}`),
    tooClose: (a, b) => capital(`${a} and ${b} are too close`),
    onFrame: (badge, frame) => capital(`${badge} sits on ${frame}`),
    runClose: (a, b) => capital(`${a} and ${b} run too close side by side`),
    atWidth: (width) => `(at width ${width})`,
  },
};

/** 崩れを知らせる文。段の番号は文に含めない (命令の行が頭に段を書く) */
export function describeBreak(b: LayoutBreak, lang: NotationLang = DEFAULT_LANG): string {
  const words = FIGURE_TEXT[lang];
  const t = BREAK_TEXT[lang];
  const name = (part: LayoutPart): string => {
    switch (part.kind) {
      case "badge":
        return words.badgeName(String(part.step));
      case "box":
        return words.quoted(part.name);
      case "slot":
        return t.slotOf(part.box);
      case "text":
        return words.quoted(part.text);
      case "line":
        return t.lineOf(part.from, part.to, part.step);
      case "frame":
        return t.frameOf(part.name);
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
          : b.kind === "badge-on-frame"
            ? t.onFrame(name(a), name(b2))
            : t.runClose(name(a), name(b2));
  return b.width === undefined ? said : `${said} ${t.atWidth(b.width)}`;
}
