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
import { diamondPoints, type Point } from "../layout/scene";
import { userBlockReader } from "../user-blocks";
import { type BreakFinder, breakKey, findBreaks, type FrameSide, type LayoutBreak, type LayoutPart } from "./breaks";
import { drawDiagram } from "./draw";

/**
 * 描いた物から崩れを数える関数 (#3494)。描く処理に渡し、描いた後に呼ばせる。
 * 足した箱のブロックの形の輪郭はここで組む。描く処理が呼ぶので、足したブロックの定義が有効な間に組める。
 * 輪郭は定義を読む処理と一緒に登録した形を測る処理 (`BoxShapes`) が組む。形を持つ箱は定義を読んだ図にしか無いため (#3520)。
 * 手順の図の判断のひし形 (#3561) は、描く部品と同じ頂点 (`diamondPoints`) で組む。
 * 枠線を描く囲みと列と帯もここで組む (#3525)。囲みと列は名前の行で、帯は題で呼び、名前を持たない囲み (時間軸の図の軸の帯) は名前を空にして「枠線」と呼ぶ
 */
const finder: BreakFinder = (drawn) => {
  const { layout } = drawn;
  // 囲みは図の区画と状態遷移図の脇道。名前の行で呼び、名前を持たない帯 (時間軸の図の軸の帯) は名札で呼ぶ (#3526)
  const regions = layout ? layout.regions.map((r) => ({ ...r, name: r.lines.join(" ") || r.id })) : [];
  const side = layout?.side ? [{ ...layout.side, name: layout.side.title }] : [];
  return findBreaks({
    ...drawn,
    groups: [...regions, ...side],
    borders: [
      ...(layout?.regions ?? []).map((r) => ({ name: r.lines.join(" "), rect: r })),
      ...(layout?.strip ? [{ name: layout.strip.title, rect: layout.strip }] : []),
    ],
    outlines: new Map(
      drawn.boxes.flatMap((box): [string, Point[][]][] => {
        // 手順の図の判断はひし形で描く (#3561)
        if (box.shape === "diamond") return [[box.id, [diamondPoints(box)]]];
        const rings = userBlockReader()?.shapes.outline(box.id, box);
        return rings ? [[box.id, rings]] : [];
      }),
    ),
  });
};

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
 * 描いた図の崩れの種類ごとの文 (#3484)。運ぶ物の枠と図の枠の端の呼び方、丸が箱の形から浮く、枠か字が箱の形からはみ出す、
 * 2 つの丸が近すぎる、2 本の線が並んで近すぎる、部品が図の枠の端からはみ出す (#3515)、線の名前か流れた量の札が線から離れる (#3528)。
 * 囲みの呼び方と、線が箱か囲みの枠に沿って近すぎる文と、字が枠に接する文も持つ (#3526)。
 * 時間軸の図の針と時刻の目盛りの線と時間軸の囲みの呼び方と、部品が時間軸の囲みの枠に掛かる文も持つ (#3527)。
 * 囲みと列と帯の枠線の呼び方と、番号の丸が枠線に乗る文も持つ (#3525)。線の名前が枠線をまたぐ崩れも同じ文で知らせる (#3554)。
 * 配管の図の弁と計器と管の呼び方、札が部品に重なる、管が箱の縁の後ろを通る、2 本の管が重なって通る (#3523)。
 * ドーナツの輪の内側の呼び方も持ち、輪の真ん中の段の名前が収まらない崩れは図の枠からのはみ出しと同じ文で知らせる (#3560)。
 * 列の図の札に押した印と時間軸の範囲の囲みの呼び方と、針と囲みが字を横切る文も持つ (#3631)。印が字に重なる崩れは札が重なる文で知らせる。
 * 崩れを探す処理だけが読むので、描くだけの頁が最初に読む字の表 (`FIGURE_TEXT`) に置かない。置くと見本帳が最初に読む量の上限を超える (#3515)。
 * 線の呼び方と崩れの幅は、字の重なりの文と同じ表に残す
 */
interface BreakText {
  slotOf: (box: string) => string;
  groupOf: (name: string) => string;
  frameEdge: (side: FrameSide) => string;
  floatsOff: (badge: string, box: string) => string;
  sticksOut: (part: string, box: string) => string;
  tooClose: (a: string, b: string) => string;
  runClose: (a: string, b: string) => string;
  outOfFrame: (part: string, edge: string) => string;
  needle: string;
  ticks: string;
  axisPanel: string;
  reachesEdge: (part: string, panel: string) => string;
  borderOf: (name: string) => string;
  onBorder: (badge: string, border: string) => string;
  offLine: (text: string, line: string) => string;
  onLine: (text: string, line: string) => string;
  valveOf: (from: string, to: string | undefined) => string;
  gaugeOf: (box: string) => string;
  pipeOf: (from: string, to: string, step: number) => string;
  covers: (chip: string, part: string) => string;
  behindBox: (pipe: string, box: string) => string;
  merged: (a: string, b: string) => string;
  nearBorder: (line: string, part: string) => string;
  behindLine: (line: string, box: string) => string;
  touchesBorder: (text: string, box: string) => string;
  ring: string;
  stampOf: (text: string) => string;
  spanOf: (text: string) => string;
  crosses: (part: string, text: string) => string;
}

const BREAK_TEXT: Record<NotationLang, BreakText> = {
  ja: {
    slotOf: (box) => `「${box}」の運ぶ物の枠`,
    groupOf: (name) => `囲み「${name}」`,
    frameEdge: (side) => `図の枠の${{ left: "左端", right: "右端", top: "上端", bottom: "下端" }[side]}`,
    floatsOff: (badge, box) => `${spaced(badge)}が${box}の形から離れて浮く`,
    sticksOut: (part, box) => `${spaced(part)}が${box}の形からはみ出す`,
    tooClose: (a, b) => `${spaced(a)}と${spaced(b)}が近すぎる`,
    runClose: (a, b) => `${spaced(a)}と${spaced(b)}が並んで近すぎる`,
    outOfFrame: (part, edge) => `${spaced(part)}が${edge}からはみ出す`,
    needle: "針",
    ticks: "時刻の目盛りの線",
    axisPanel: "時間軸の囲み",
    reachesEdge: (part, panel) => `${spaced(part)}が${panel}の枠に掛かる`,
    borderOf: (name) => (name === "" ? "枠線" : `「${name}」の枠線`),
    onBorder: (badge, border) => `${spaced(badge)}が${border}に乗る`,
    offLine: (text, line) => `${spaced(text)}が${line}から離れて描かれる`,
    onLine: (text, line) => `${spaced(text)}が${line}に乗る`,
    valveOf: (from, to) => (to === undefined ? `「${from}」の弁` : `管 ${from} → ${to} の弁`),
    gaugeOf: (box) => `「${box}」の計器`,
    pipeOf: (from, to, step) => `管 ${from} → ${to} (段 ${step})`,
    covers: (chip, part) => `${spaced(chip)}が${spaced(part)}に重なる`,
    behindBox: (pipe, box) => `${spaced(pipe)}が${box}の縁の後ろを通る`,
    merged: (a, b) => `${spaced(a)}と${spaced(b)}が重なって通る`,
    nearBorder: (line, part) => `${spaced(line)}が${part}の枠に沿って近すぎる`,
    behindLine: (line, box) => `${spaced(line)}が${box}の裏を通る`,
    touchesBorder: (text, box) => `${spaced(text)}が${box}の枠に接する`,
    ring: "ドーナツの輪の内側",
    stampOf: (text) => `印「${text}」`,
    spanOf: (text) => `範囲の囲み「${text}」`,
    crosses: (part, text) => `${spaced(part)}が${spaced(text)}を横切る`,
  },
  en: {
    slotOf: (box) => `the carry slot of "${box}"`,
    groupOf: (name) => `the group "${name}"`,
    frameEdge: (side) => `the ${side} edge of the diagram frame`,
    floatsOff: (badge, box) => capital(`${badge} floats away from the shape of ${box}`),
    sticksOut: (part, box) => capital(`${part} sticks out of the shape of ${box}`),
    tooClose: (a, b) => capital(`${a} and ${b} are too close`),
    runClose: (a, b) => capital(`${a} and ${b} run too close side by side`),
    outOfFrame: (part, edge) => capital(`${part} sticks out of ${edge}`),
    needle: "the needle",
    ticks: "the line of time tick marks",
    axisPanel: "the time axis panel",
    reachesEdge: (part, panel) => capital(`${part} reaches the edge of ${panel}`),
    borderOf: (name) => (name === "" ? "a border" : `the border of "${name}"`),
    onBorder: (badge, border) => capital(`${badge} sits on ${border}`),
    offLine: (text, line) => capital(`${text} is drawn away from ${line}`),
    onLine: (text, line) => capital(`${text} sits on ${line}`),
    valveOf: (from, to) => (to === undefined ? `the valve of "${from}"` : `the valve on the pipe ${from} → ${to}`),
    gaugeOf: (box) => `the gauge of "${box}"`,
    pipeOf: (from, to, step) => `the pipe ${from} → ${to} (step ${step})`,
    covers: (chip, part) => capital(`${chip} covers ${part}`),
    behindBox: (pipe, box) => capital(`${pipe} runs behind the edge of ${box}`),
    merged: (a, b) => capital(`${a} and ${b} run on top of each other`),
    nearBorder: (line, part) => capital(`${line} runs too close along the border of ${part}`),
    behindLine: (line, box) => capital(`${line} runs behind ${box}`),
    touchesBorder: (text, box) => capital(`${text} touches the border of ${box}`),
    ring: "the inside of the donut ring",
    stampOf: (text) => `the stamp "${text}"`,
    spanOf: (text) => `the span frame "${text}"`,
    crosses: (part, text) => capital(`${part} crosses ${text}`),
  },
};

/** 崩れを知らせる文。段の番号は文に含めない (命令の行が頭に段を書く) */
export function describeBreak(b: LayoutBreak, lang: NotationLang = DEFAULT_LANG): string {
  const t = FIGURE_TEXT[lang];
  const w = BREAK_TEXT[lang];
  const name = (part: LayoutPart): string => {
    switch (part.kind) {
      case "badge":
        return t.badgeName(String(part.step));
      case "box":
        return t.quoted(part.name);
      case "group":
        return w.groupOf(part.name);
      case "slot":
        return w.slotOf(part.box);
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
        return w.frameEdge(part.side);
      case "needle":
        return w.needle;
      case "ticks":
        return w.ticks;
      case "panel":
        return w.axisPanel;
      case "valve":
        return w.valveOf(part.from, part.to);
      case "gauge":
        return w.gaugeOf(part.box);
      case "pipe":
        return w.pipeOf(part.from, part.to, part.step);
      case "border":
        return w.borderOf(part.name);
      case "ring":
        return w.ring;
      case "stamp":
        return w.stampOf(part.text);
      case "span":
        return w.spanOf(part.text);
    }
  };
  const [a, b2] = b.parts;
  const said =
    b.kind === "badge-off-shape"
      ? w.floatsOff(name(a), name(b2))
      : b.kind === "slot-outside-shape" || b.kind === "text-outside-shape"
        ? w.sticksOut(name(a), name(b2))
        : b.kind === "badges-close" || b.kind === "valve-near-pipe"
          ? w.tooClose(name(a), name(b2))
          : b.kind === "part-outside-frame" || b.kind === "title-outside-ring"
            ? w.outOfFrame(name(a), name(b2))
            : b.kind === "panel-edge"
              ? w.reachesEdge(name(a), name(b2))
              : b.kind === "label-off-line"
                ? w.offLine(name(a), name(b2))
                : b.kind === "label-on-line"
                  ? w.onLine(name(a), name(b2))
                : b.kind === "line-crosses-text" && a.kind === "line"
                  ? t.lineCrosses(a.from, a.to, name(b2))
                  : b.kind === "line-crosses-text"
                    ? w.crosses(name(a), name(b2))
                  : b.kind === "chip-over-part"
                    ? w.covers(name(a), name(b2))
                    : b.kind === "pipe-behind-box"
                      ? w.behindBox(name(a), name(b2))
                      : b.kind === "pipes-merged"
                        ? w.merged(name(a), name(b2))
                        : b.kind === "line-near-border"
                          ? w.nearBorder(name(a), name(b2))
                          : b.kind === "line-behind-box"
                            ? w.behindLine(name(a), name(b2))
                            : b.kind === "text-touches-border"
                              ? w.touchesBorder(name(a), name(b2))
                              : b.kind === "badge-on-frame" || b.kind === "label-on-frame"
                                ? w.onBorder(name(a), name(b2))
                                : w.runClose(name(a), name(b2));
  return b.width === undefined ? said : `${said} ${t.atWidth(b.width)}`;
}
