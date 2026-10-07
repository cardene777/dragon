import type { DslActor, DslDocument, DslStep } from "../types";
import { 縦列ごとの段を決める } from "./lanes";
import { slugify } from "./slug";
import { 分かれ道の札, 泳法図で印をどう描く } from "./swimlane-marks";

/**
 * 段の箱 (`shape: stages`, #2797 / #2831) の配置規則。
 *
 * 段階ごとに同じ上端と高さの列を 1 本作り、列の見出しに「段階 N」と段階の名前を出す。
 * 箱は列の中へ書いた順に積む札にし、担当 (`lane`) は札の右の小さな字として添える。
 * 列の面・見出し・札の右の字は描く側 (`lane.stage` と `card` の `subtitle`) が描く。
 */

/**
 * 段階の列 1 本の幅。描く側は列の面をこの幅から列の間の 48 を引いた幅で描く。
 * 幅 332 の列の面に対して、札の左右へ内側の余白を 32 ずつ残す。
 */
export const STAGE_LANE_WIDTH = 380;

/**
 * 札の幅。見本は列の面の内側を 24 ずつ空けるが、幅 284 では列の間 (48) に置く
 * 「いいえ」の札と札の右端が近づき、描く側が衝突を避けて札を列の下端より下へ押し出す。
 * 幅 270 でも押し出されるため 268 とし、列の間を描く側が広げずに済めば cardene777/cdl#1035 で 24 に寄せる。
 */
export const STAGE_CARD_WIDTH = STAGE_LANE_WIDTH - 112;

/** 札の高さ。名前 1 行と右の担当を同じ行に置く札で、見本の札と同じく 1 行分に収める。 */
export const STAGE_CARD_HEIGHT = 48;

export type StageColumn = {
  id: string;
  /** 見出しの番号。描く側が「段階 N」の形で出す */
  number: string;
  name: string;
};

export type StageCard = {
  columnId: string;
  /** 左から数えた列の位置 (0 始まり)。線を曲線にするか戻り線にするかの判定に使う */
  column: number;
  stack: number;
  /** 札の右へ出す字。担当の名前か、分かれ道の札 */
  subtitle?: string;
};

export type StagesPlacement = {
  columns: StageColumn[];
  /** 箱の名前ごとの札 */
  cards: ReadonlyMap<string, StageCard>;
};

/** 段階を書かない箱は、担当、担当も無ければ箱の名前を段階に使う (#2797)。 */
export function 段階名(actor: Pick<DslActor, "stage" | "lane" | "name">): string {
  return actor.stage ?? actor.lane ?? actor.name;
}

/**
 * 札の右に出す字。分かれ道は「分かれ道」、それ以外は担当の名前を出す。
 *
 * 担当の名前が段階の名前と同じ時は出さない。段階を書かない箱は担当を段階に使うため、
 * 出すと見出しと同じ字が札の右にもう 1 度並ぶ。
 */
function 札の右の字(
  doc: Pick<DslDocument, "type" | "shape" | "lanes">,
  actor: DslActor,
  stage: string,
): string | undefined {
  if (泳法図で印をどう描く(doc, actor) === "札") return 分かれ道の札;
  if (actor.lane === undefined) return undefined;
  const 担当 = doc.lanes?.[actor.lane]?.label ?? actor.lane;
  return 担当 === stage ? undefined : 担当;
}

/**
 * 段を書かない列で、列の札をどの段から積むかを決める。
 *
 * 左の列から入る線のうち、札と同じ段から出る線が最も多くなる位置を選ぶ。
 * 同じ段から入る線は列をまたいでも真横に走るため、見本と同じく曲げずに読める。
 * 揃う本数が同じなら、図の一番下の段を下げない位置、その中でも上の位置を選ぶ。
 */
function 積み始める段(
  札たち: readonly DslActor[],
  flow: DslDocument["flow"],
  左の列の段: ReadonlyMap<string, number>,
  これまでの最下段: number,
): number {
  const 列の中の順 = new Map(札たち.map((actor, index) => [actor.name, index]));
  const 揃う本数 = new Map<number, number>();
  for (const step of flow) {
    const index = 列の中の順.get(step.to);
    const 出る段 = 左の列の段.get(step.from);
    if (index === undefined || 出る段 === undefined || 出る段 < index) continue;
    const 始め = 出る段 - index;
    揃う本数.set(始め, (揃う本数.get(始め) ?? 0) + 1);
  }
  const 最下段 = (始め: number): number => Math.max(これまでの最下段, 始め + 札たち.length - 1);
  let 選んだ = 0;
  for (const [始め, 本数] of 揃う本数) {
    const 今の本数 = 揃う本数.get(選んだ) ?? 0;
    if (本数 < 今の本数) continue;
    if (本数 === 今の本数) {
      if (最下段(始め) > 最下段(選んだ)) continue;
      if (最下段(始め) === 最下段(選んだ) && 始め >= 選んだ) continue;
    }
    選んだ = 始め;
  }
  return 選んだ;
}

/**
 * 段の箱の列と札を決める。
 *
 * 列は段階が箱に最初に現れた順に左から並べる。札は列の中で書いた順に下へ積み、
 * 段を書いた札がある列だけは書いた段をそのまま使う (空いた段へ書かない札を置く)。
 * 段を書かない列は、左の列から真横に入れる段から積む (`積み始める段`)。
 */
export function placeStages(
  doc: Pick<DslDocument, "type" | "shape" | "actors" | "flow" | "lanes">,
): StagesPlacement {
  const 段階たち: string[] = [];
  for (const actor of doc.actors) {
    const stage = 段階名(actor);
    if (!段階たち.includes(stage)) 段階たち.push(stage);
  }

  const 使ったid = new Set<string>();
  const columns = 段階たち.map((stage, index): StageColumn => {
    const base = `stage-${slugify(stage) || index}`;
    let id = base;
    let suffix = 2;
    while (使ったid.has(id)) id = `${base}-${suffix++}`;
    使ったid.add(id);
    return { id, number: String(index + 1), name: stage };
  });

  const cards = new Map<string, StageCard>();
  const 置いた段 = new Map<string, number>();
  let これまでの最下段 = -1;
  for (const [column, stage] of 段階たち.entries()) {
    const 札たち = doc.actors.filter((actor) => 段階名(actor) === stage);
    const 書いた段 = 札たち.some((actor) => actor.stack !== undefined)
      ? 縦列ごとの段を決める(札たち, () => stage)
      : undefined;
    const 始め = 書いた段 === undefined
      ? 積み始める段(札たち, doc.flow, 置いた段, これまでの最下段)
      : 0;
    for (const [index, actor] of 札たち.entries()) {
      const stack = 書いた段?.get(actor) ?? 始め + index;
      const subtitle = 札の右の字(doc, actor, stage);
      cards.set(actor.name, {
        columnId: columns[column]!.id,
        column,
        stack,
        ...(subtitle === undefined ? {} : { subtitle }),
      });
      これまでの最下段 = Math.max(これまでの最下段, stack);
    }
    for (const actor of 札たち) 置いた段.set(actor.name, cards.get(actor.name)!.stack);
  }
  return { columns, cards };
}

/**
 * 段の箱の線の通し方。
 *
 * 右の列へ進む線は曲線 (`curve`) で列の間を渡す。左の列や同じ列の上の札へ戻る線は
 * 列の見出しより上を回る戻り線 (`back-detour`) にする。同じ列で下の札へ進む線は
 * 描く側の既定 (真下へ下ろす直線) のまま返さない。
 */
export function 段の箱の線の通し方(
  placement: StagesPlacement,
  from: string,
  to: string,
): "curve" | "back-detour" | undefined {
  const 出る札 = placement.cards.get(from);
  const 入る札 = placement.cards.get(to);
  if (出る札 === undefined || 入る札 === undefined) return undefined;
  if (出る札.column < 入る札.column) return "curve";
  if (出る札.column > 入る札.column) return "back-detour";
  return 入る札.stack < 出る札.stack ? "back-detour" : undefined;
}

/**
 * 描く側が線の札を描く高さ。字 1 行の札は 36、補足 (`sub`) を持つ札は 68 で描く
 * (`@cardenelabs/cdl` の `LABEL_PILL_H_MAIN_ONLY` / `LABEL_PILL_H_WITH_SUB`、公開されていない)。
 * 描く側が値を変えたら、ここも合わせる。
 */
const 線の札の高さ = (sub: string | undefined): number => ((sub ?? "") === "" ? 36 : 68);

/**
 * 真横に渡る線と札の上端の間。見本の「いいえ」は線のすぐ下に札を置く。
 *
 * 描く側が線と札の間に求める最小の間 (`LABEL_TO_PATH_CLEARANCE` = 16) と同じにする。
 * これより詰めると、描く側が札を線から押し出して列の下端より下へ逃がす。
 */
const 札を線の下に置く間 = 16;

/**
 * 段の箱の線に渡す指定。通し方 (`段の箱の線の通し方`) と、札の置き場所を返す。
 *
 * 列をまたぐ線と戻り線の札は線の上に重ねる (`overlay`)。見本は「はい」を曲線の上に、
 * 「翌日もう一度」を戻り線の上に置く。
 *
 * 同じ段の札へ真横に渡る線だけは、札を線のすぐ下へずらす (見本の「いいえ」)。描く側は
 * 札を線から離して置き、同じ分かれ道から出る曲線の札と重ならない側へ逃がすため、
 * 何もしないと札が列の下端より下へ出る。書いた `overlay` / `labelOffsetY` は後段で上書きされる。
 */
export function 段の箱の線の指定(
  placement: StagesPlacement,
  step: Pick<DslStep, "from" | "to" | "label" | "sub">,
): { routing?: "curve" | "back-detour"; overlay?: true; labelOffsetY?: number } {
  const routing = 段の箱の線の通し方(placement, step.from, step.to);
  const 札がある = step.label !== "" || (step.sub ?? "") !== "";
  if (routing === undefined) return {};
  if (!札がある) return { routing };
  const 真横 =
    routing === "curve" &&
    placement.cards.get(step.from)?.stack === placement.cards.get(step.to)?.stack;
  return {
    routing,
    overlay: true,
    ...(真横 ? { labelOffsetY: 線の札の高さ(step.sub) / 2 + 札を線の下に置く間 } : {}),
  };
}
