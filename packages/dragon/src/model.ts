/**
 * 原本 (版2) と、描く処理が読む図の形 (版1と同じ欄と並び) の組み直し (#3346)。
 *
 * 版2の原本は図の宣言を `blocks` のブロックの名前ごとの欄に持ち、版1の原本は同じ宣言を根の欄と図の種類の欄に持つ。
 * 2 つの形の欄の対応は `HOMES` の 1 つの表が持ち、組み直し (`toModel`、`fromModel`)、版1の原本の移し (`upgrade`)、
 * 版1の誤りの場所の戻し (`toVersion1Pointer`) が同じ表を読む。
 *
 * 描く処理の形は版1と同じ欄と同じ並びで組み、版の欄も `1` を持つ。図の id はこの形の字から作るので、
 * 版2の原本を足す前と同じ図からは同じ id の SVG を描く。
 */
import { lifelinesOf } from "./blocks/lifeline/read";
import { readyParts } from './kinds/registry';
import type { Diagram, DiagramBlocks, DiagramModel, TryItem } from "./schema";

/** この道具が読める原本の版。版1の原本は読む時にこの版へ移す (#3346) */
export const FORMAT_VERSION = 2;

/** 描く処理の形の版の欄。版1の原本と同じ形なので、版1の `1` を持つ */
export const MODEL_VERSION = 1;

/** 版2の原本の欄と、版1の原本での置き場。版1の置き場は根の欄か、図の種類の欄 (`<種類の欄>.<欄>`) */
export const HOMES = [
  ["group", "regions"],
  ["box", "boxes"],
  ["strip", "strip"],
  ["path", "state.paths"],
  ["branch", "git.branches"],
  ["scale", "time.scale"],
  ["period", "time.period"],
  ["row", "time.rows"],
  ["task", "time.tasks"],
  ["point", "time.points"],
  ["zoom", "time.zoom"],
  ["item", "lineup.items"],
  ["role", "lineup.roles"],
  ["hold", "pipe.holds"],
  ["table", "er.tables"],
  ["circle", "venn.sets"],
] as const satisfies readonly (readonly [keyof DiagramBlocks, string])[];

type Obj = Record<string, unknown>;

const isObject = (value: unknown): value is Obj => typeof value === "object" && value !== null && !Array.isArray(value);
/** 書かない値。無いか、空の並び */
const blank = (value: unknown): boolean => value === undefined || (Array.isArray(value) && value.length === 0);

/**
 * 版1に無かった欄のうち、描く処理の形と原本の根に同じ形で置く欄。
 * 量の図 (#3560) の見た目と項目、2つの軸で置く図 (#3622) の軸と課題、回り続ける図の見た目 (#3638)
 */
const ROOTED = ["chart", "matrix", "cycle"] as const;

/** `from` の `ROOTED` の欄のうち、書いた欄だけ */
const rooted = (from: object): Obj => Object.fromEntries(ROOTED.flatMap((key) => ((from as Obj)[key] === undefined ? [] : [[key, (from as Obj)[key]]])));

/**
 * 描く処理の形を版2の原本にする。空の並びは書かず、`blocks` の欄は `HOMES` の順に並べる。
 * 試す図 (#3337) は版1に無かった種類なので `HOMES` を通さず、部品 (`part`) とチップ (`item`) と並べる組 (`side`) と関門 (`check`、#3476) をこの順に置く。
 * 量の図 (#3560) も版1に無かった種類で、見た目と項目を `blocks` でなく根の種類の欄 (`chart`) のまま移す。2つの軸で置く図 (#3622) の軸と課題と、回り続ける図の見た目 (#3638) も根の欄 (`matrix` と `cycle`) のまま移す
 * 手順の図 (#3561) も版1に無かった種類なので、箱 (`box`) と判断 (`choice`) と中身の帯 (`strip`) と今回は通らない道 (`path`) をこの順に置く
 */
export function fromModel(model: DiagramModel, version: number): Diagram {
  const own = readyParts(model.kind)?.model;
  if (own) return own.from(model, version);
  const source = model as unknown as Obj;
  const blocks: Obj = {};
  if (model.kind === "try") {
    blocks.part = model.try?.parts ?? [];
    if (!blank(model.try?.items)) blocks.item = model.try?.items;
    if (!blank(model.try?.sides)) blocks.side = model.try?.sides;
    if (!blank(model.try?.checks)) blocks.check = model.try?.checks;
  } else if (model.kind === "flow") {
    if (!blank(model.boxes)) blocks.box = model.boxes;
    if (!blank(model.flow?.choices)) blocks.choice = model.flow?.choices;
    if (model.strip !== undefined) blocks.strip = model.strip;
    if (!blank(model.flow?.paths)) blocks.path = model.flow?.paths;
  } else {
    for (const [field, home] of HOMES) {
      const [section, inner] = home.split(".");
      const value = inner === undefined ? source[section ?? ""] : (source[section ?? ""] as Obj | undefined)?.[inner];
      if (!blank(value)) blocks[field] = value;
    }
  }
  return {
    version,
    kind: model.kind,
    title: model.title,
    ...(model.view !== undefined ? { view: model.view } : {}),
    ...(model.define !== undefined ? { define: model.define } : {}),
    ...rooted(source),
    // 列の図の見た目 (#3625) は版1に無かった欄なので、`HOMES` を通さず根の欄 (`lineup`) に移す
    ...(model.lineup?.shape !== undefined ? { lineup: { shape: model.lineup.shape } } : {}),
    // 集合の重なりの図の見た目 (#3635) も同じく根の欄 (`venn`) に移す。集まりは `HOMES` の `circle` が移す
    ...(model.venn?.shape !== undefined ? { venn: { shape: model.venn.shape, ...(model.venn.unit !== undefined ? { unit: model.venn.unit } : {}) } } : {}),
    blocks: blocks as DiagramBlocks,
    steps: model.steps,
  };
}

/** 版1の原本か。版1は検査の前に版2の形へ移す */
export const isVersion1 = (input: unknown): input is Obj =>
  typeof input === "object" && input !== null && !Array.isArray(input) && (input as { version?: unknown }).version === 1;

/**
 * 版2の原本を描く処理の形にする。欄と並びは版1の原本を読んでいた時と同じにする
 * (版、種類、題、見せ方、区画、箱、帯、段、生存線、移れる道、枝、チップ、配管の図の始めの値、時間軸の図の欄)。
 * 時系列図の生存線は、箱の並びのまま左から組む。試す図 (#3337) は部品とチップと関門 (#3476) を試す図の欄 (`try`) に持つ。
 * 手順の図 (#3561) は判断と今回は通らない道を手順の図の欄 (`flow`) に持つ。表どうしの関係の図 (#3618) は表を表どうしの関係の図の欄 (`er`) に持つ。
 * 集合の重なりの図 (#3620) は集まりと見た目 (#3635) を集合の重なりの図の欄 (`venn`) に持つ
 */
export function toModel(diagram: Diagram): DiagramModel {
  const own = readyParts(diagram.kind)?.model;
  if (own) return own.to(diagram);
  const b = diagram.blocks;
  const boxes = b.box ?? [];
  if (diagram.kind === "try")
    return {
      version: MODEL_VERSION,
      kind: diagram.kind,
      title: diagram.title,
      ...(diagram.view !== undefined ? { view: diagram.view } : {}),
      ...(diagram.define !== undefined ? { define: diagram.define } : {}),
      boxes,
      steps: diagram.steps,
      try: {
        parts: b.part ?? [],
        items: (b.item ?? []) as TryItem[],
        ...(b.side !== undefined ? { sides: b.side } : {}),
        ...(b.check !== undefined ? { checks: b.check } : {}),
      },
    };
  if (diagram.kind === "flow")
    return {
      version: MODEL_VERSION,
      kind: diagram.kind,
      title: diagram.title,
      ...(diagram.view !== undefined ? { view: diagram.view } : {}),
      ...(diagram.define !== undefined ? { define: diagram.define } : {}),
      boxes,
      ...(b.strip !== undefined ? { strip: b.strip } : {}),
      steps: diagram.steps,
      flow: { choices: b.choice ?? [], paths: b.path ?? [] },
    };
  return {
    version: MODEL_VERSION,
    kind: diagram.kind,
    title: diagram.title,
    ...(diagram.view !== undefined ? { view: diagram.view } : {}),
    ...(diagram.define !== undefined ? { define: diagram.define } : {}),
    ...(b.group !== undefined ? { regions: b.group } : {}),
    boxes,
    ...(b.strip !== undefined ? { strip: b.strip } : {}),
    steps: diagram.steps,
    ...(diagram.kind === "sequence" ? { sequence: lifelinesOf(boxes) } : {}),
    ...rooted(diagram),
    ...(b.path !== undefined ? { state: { paths: b.path } } : {}),
    ...(b.branch !== undefined ? { git: { branches: b.branch } } : {}),
    // 見た目 (#3625) だけを持ちチップを持たない列の図も、見た目を落とさないよう列の図の欄を置く。空のチップの並びは `fromModel` が書き戻さない
    ...(b.item !== undefined || diagram.lineup !== undefined
      ? { lineup: { items: b.item ?? [], ...(b.role !== undefined ? { roles: b.role } : {}), ...(diagram.lineup !== undefined ? { shape: diagram.lineup.shape } : {}) } }
      : {}),
    ...(b.hold !== undefined ? { pipe: { holds: b.hold } } : {}),
    ...(b.table !== undefined ? { er: { tables: b.table } } : {}),
    ...(b.circle !== undefined || diagram.venn !== undefined ? { venn: { sets: b.circle ?? [], ...(diagram.venn ?? {}) } } : {}),
    ...(b.scale !== undefined || b.row !== undefined || b.task !== undefined
      ? {
          time: {
            ...(b.scale !== undefined ? { scale: b.scale } : {}),
            ...(b.period !== undefined ? { period: b.period } : {}),
            // 作業 (#3562) だけを持つ図も、描く処理は印の列の並びを読むので空の並びを置く
            rows: b.row ?? [],
            ...(b.task !== undefined ? { tasks: b.task } : {}),
            ...(b.point !== undefined ? { points: b.point } : {}),
            ...(b.zoom !== undefined ? { zoom: b.zoom } : {}),
          } as DiagramModel["time"],
        }
      : {}),
  };
}

/**
 * 版1の原本を、検査の前に版2の形へ移す。形を確かめる前に呼ぶので、知らない欄と形の違う値と空の並びはそのまま移し、検査に任せる
 * (版1で誤りだった原本は、版2でも同じ値の誤りになる)。空の並びを外して欄を整えるのは、検査を通った後の `fromModel` が行う。
 * 図の種類の欄 (`state`、`git`、`time`、`lineup`) は、中の欄を全て移せた時だけ消す。時系列図の生存線の欄 (`sequence`) は、箱の並びから組み直せるので書かない。
 * 時系列図でない図の生存線の欄は版1でも書けなかったので、根に残して検査に断らせる
 */
export function upgrade(input: Obj, version: number): Obj {
  const rest: Obj = { ...input };
  delete rest.version;
  if (rest.kind === "sequence") delete rest.sequence;
  const out: Obj = {};
  const blocks: Obj = {};
  const moved = new Set<string>();
  for (const [field, home] of HOMES) {
    const [section = "", inner] = home.split(".");
    if (inner === undefined) {
      if (!(section in rest)) continue;
      blocks[field] = rest[section];
      moved.add(section);
      continue;
    }
    const container = rest[section];
    if (isObject(container) && inner in container) blocks[field] = container[inner];
  }
  for (const section of ["state", "git", "time", "lineup"]) {
    const container = rest[section];
    const inners: string[] = HOMES.filter(([, home]) => home.startsWith(`${section}.`)).map(([, home]) => home.slice(section.length + 1));
    if (isObject(container) && Object.keys(container).every((key) => inners.includes(key))) moved.add(section);
  }
  out.version = version;
  for (const [key, value] of Object.entries(rest)) {
    if (key === "steps") out.blocks = blocks;
    if (!moved.has(key)) out[key] = value;
  }
  if (!("blocks" in out)) out.blocks = blocks;
  return out;
}

/** 版2の `blocks` の欄の場所から、版1の原本の同じ値の場所 */
const VERSION_1_HOMES: ReadonlyMap<string, string> = new Map(HOMES.map(([field, home]) => [`/blocks/${field}`, `/${home.replace(".", "/")}`]));

/**
 * 版2の `blocks` の欄の場所から、その欄を持っていた版1の図の種類の欄の場所 (`/blocks/branch` なら `/git`)。
 * 図の種類が書けない欄は、版1では図の種類の欄ごと断っていたので、その場所で返す。根の欄から移した欄は `undefined`
 */
export function version1SectionOf(pointer: string): string | undefined {
  const home = HOMES.find(([field]) => `/blocks/${field}` === pointer)?.[1];
  return home?.includes(".") ? `/${home.slice(0, home.indexOf("."))}` : undefined;
}

/**
 * 版2の場所 (JSON Pointer) を、版1の原本の場所へ戻す。`blocks` の欄の場所だけを戻し、ほかの場所 (段の中など) は同じ。
 * `blocks` そのものの場所は、版1の根の場所にする
 */
export function toVersion1Pointer(pointer: string): string {
  if (pointer === "/blocks") return "";
  const match = /^\/blocks\/[^/]+/u.exec(pointer);
  const home = match ? VERSION_1_HOMES.get(match[0]) : undefined;
  return match && home !== undefined ? `${home}${pointer.slice(match[0].length)}` : pointer;
}
