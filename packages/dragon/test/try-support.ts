/**
 * 読み手が値を入れて動かせる図 (`try`、#3337) の検査が共に使う道具。
 *
 * 図は部品の行を上から並べて書く。網 (`route`) が運び、待ち行列 (`queue`) が並べ、機械の列 (`chain`) が鎖につなぎ、
 * 入力の帯 (`ask`) が読み手に聞き、釦 (`press`) が押される。
 * 描く部品が返す置き場所 (`layout`) は、段ごとの状態 (`states`) を持つ。待ち行列の中身、機械の列のブロック、チップの欄の値、網を運ばれたチップの道を段ごとに読む。
 * 再生の部品は、読み手が押すたびに段を 1 つ作って原本の最後に足し、足した後の原本を `player.diagram` に持つ。
 * まだ `try` を読めない間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { expect } from "vitest";
import { api, exampleJson, type Json } from "./diagram-support";
import { draw, type Player, type PlayerOptions, type Rect } from "./render-support";

/** 仮名と漢字 */
export const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

/** 最初のブロックの prev。前のブロックが無いことを 0 が 64 字並んだ値で表す */
export const GENESIS = "0".repeat(64);

/** 誤りの文を英語で確かめる検査があるので、名札は英字にする。欄は送り手、宛先、量、手数料 */
export const SMALL_PARTS = [
  "route net: you - n1 - n3 - maker, you - n2 - n4 - n5 - maker [from: you, to: maker]",
  "queue pool [order: fee]",
  "chain blocks [edit: amount]",
  "ask sender, to, amount, fee [into: pool, via: net]",
  "press build [from: pool, into: blocks, take: 3]",
] as const;

/** 小さな図のチップ。名前 (送り手) と、宛先、量、手数料 */
export const SMALL_ITEMS = [
  "item o1 [to: c, amount: 3, fee: 7]",
  "item o2 [to: c, amount: 5, fee: 2]",
  "item o3 [to: c, amount: 1, fee: 9]",
  "item o4 [to: c, amount: 4, fee: 4]",
] as const;

/** 最初の段。機械の列にブロック 1 (o1) を置き、待ち行列に o2、o3、o4 を並べる */
export const SMALL_FIRST = [
  "step start",
  "  say 始める。",
  "  line blocks: o1",
  "  line pool: o2, o3, o4",
] as const;

/** 書き手が例として書く段。送る、作る、書き換える */
export const SMALL_EXAMPLES = [
  "step send",
  "  say 送る。",
  "  ask me, bob, 2, 6",
  "step build",
  "  say 作る。",
  "  press build",
  "step edit",
  "  say 書き換える。",
  "  item o1 [amount: 30]",
] as const;

/** 小さな図の記法。`parts` で部品の行を差し替え、`examples` を付けると書き手の例の段を足す */
export function smallTry(options: { parts?: readonly string[]; examples?: boolean } = {}): string {
  return [
    "try 小さな試す図",
    ...(options.parts ?? SMALL_PARTS),
    ...SMALL_ITEMS,
    ...SMALL_FIRST,
    ...(options.examples ? SMALL_EXAMPLES : []),
  ].join("\n");
}

/** 小さな図のチップの欄の値 (送り手、宛先、量、手数料の順) */
export const SMALL_VALUES: Record<string, string[]> = {
  o1: ["o1", "c", "3", "7"],
  o2: ["o2", "c", "5", "2"],
  o3: ["o3", "c", "1", "9"],
  o4: ["o4", "c", "4", "4"],
};

/** 小さな図の網で、you から maker への最短の道 */
export const SHORTEST = ["you", "n1", "n3", "maker"] as const;

/** 見本「トランザクションがブロックに入るまで」の原本。file が無ければ名指して落とす */
export function txBlock(file: "tx-block.json" | "tx-block.en.json" = "tx-block.json"): Json {
  const there = existsSync(join(process.cwd(), "packages/dragon/examples", file));
  expect(there, `packages/dragon/examples/${file} が無い`).toBe(true);
  return there ? exampleJson(file) : {};
}

/** 欄の多い試す図で、一番長い候補 (#3485) */
export const WIDE_ASK_LONGEST = "順序付けの遅れ";

/**
 * 入力の帯に欄を 6 つ持ち、5 つの欄が候補 (`choose`) を持つ試す図 (#3485)。期限の欄だけが長い候補 `WIDE_ASK_LONGEST` を持つ。
 * bitsumi の Canton のトランザクションが拒否される場面の図と同じ欄の数と候補で、広い枠では 1 行に収まらない
 */
export function wideAskTry(): string {
  return [
    "try 欄の多い試す図",
    "queue 通った",
    "ask トランザクション, 署名, 大きさ, 混み具合, View, 期限 [into: 通った]",
    "choose 署名: 有効, 無効",
    "choose 大きさ: 12000, 85134",
    "choose 混み具合: 空き, 混雑",
    "choose View: 整合, 不整合",
    `choose 期限: 間に合う, ${WIDE_ASK_LONGEST}, 応答の遅れ`,
    "step start",
    "  say 始める。",
  ].join("\n");
}

/**
 * 欄の名前に確かめる段を入れた、名前の長い 7 つの選ぶ欄を持つ試す図 (#3492)。候補は短く、名前の字の幅が候補で決まる欄の幅の下限より広い欄を持つ。
 * bitsumi の Canton のトランザクションが拒否される場面の図に倣った欄で、幅 740 の枠では 6 つ目から次の行へ送られる。
 * 最後の「Mediatorが応答を待つ期限」は、次の行へ送られて基準の幅 110 に留まると、どのブラウザの字でも名前が切れる長さにした
 */
export function labeledAskTry(): string {
  return [
    "try 名前の長い欄の試す図",
    "queue 通った",
    "ask トランザクション, 送るNodeの署名, batchのbyte数, Sequencerの混み具合, Sequencerの期限, 確かめるNodeのView, Mediatorが応答を待つ期限 [into: 通った]",
    "choose トランザクション: 送金A, 送金B",
    "choose 送るNodeの署名: 正しい, 壊れている",
    "choose batchのbyte数: 12000, 85134",
    "choose Sequencerの混み具合: 空いている, 混んでいる",
    "choose Sequencerの期限: 間に合う, 過ぎる",
    "choose 確かめるNodeのView: 合う, 合わない",
    "choose Mediatorが応答を待つ期限: 間に合う, 過ぎる",
    "step start",
    "  say 始める。",
  ].join("\n");
}

/** 記法を読んだ原本。読めなければ誤りを名指して落とす */
export function parsedTry(text: string, lang: "ja" | "en" = "ja"): Json {
  const parsed = api("parseNotation")(text, { lang });
  expect(
    parsed.ok,
    `試す図の記法が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}\n${text}`,
  ).toBe(true);
  return parsed.ok ? parsed.diagram : {};
}

/** 機械の列のブロック */
export interface TryBlock {
  /** 1 から数えるブロックの番号 */
  number: number;
  /** 1 つ前のブロックの hash を写した値 (16 進 64 字)。最初のブロックは `GENESIS` */
  prev: string;
  /** 番号と prev と中身から出した SHA-256 (16 進 64 字) */
  hash: string;
  /** 中のチップ (上から並べる順) */
  items: string[];
  /** 図に出すか。新しい方から 3 つを出し、それより古いブロックは畳む */
  shown: boolean;
  /** 1 つ前のブロックとのつながり。prev が 1 つ前のブロックの hash と同じなら `ok`。最初のブロックは持たない */
  link?: "ok" | "broken";
}

/** 網を運ばれたチップと、通った節 (送る側から作る人まで) */
export interface TryTrip {
  route: string;
  item: string;
  path: string[];
}

/** ある段の終わりの状態 */
export interface TryState {
  /** 待ち行列ごとの、上から見せる順のチップ */
  queues: Record<string, string[]>;
  /** 機械の列ごとのブロック (古い順) */
  chains: Record<string, TryBlock[]>;
  /** チップごとの欄の値。入力の帯の欄の順で、最初の欄がチップの名前 */
  items: Record<string, string[]>;
  /** この段で網を運ばれたチップ */
  trips: TryTrip[];
}

/** 部品の置き場所 */
export interface TryPart {
  id: string;
  type: "route" | "queue" | "chain" | "ask" | "press";
  rect: Rect;
  /** 待ち行列の箱に縦に収まるチップの数 */
  most?: number;
}

export interface TryLayout {
  kind: string;
  parts: TryPart[];
  states: TryState[];
}

/** 原本を描いた置き場所。`try` の置き場所でなければ落とす */
export function tryLayout(diagram: unknown): TryLayout {
  const rendered = draw("renderDiagram")(diagram);
  const layout = rendered.layout as unknown as Partial<TryLayout>;
  expect(layout.kind, "描いた置き場所が試す図の置き場所でない").toBe("try");
  expect(Array.isArray(layout.states), "試す図の置き場所が段ごとの状態 (states) を持たない").toBe(
    true,
  );
  expect(Array.isArray(layout.parts), "試す図の置き場所が部品の置き場所 (parts) を持たない").toBe(
    true,
  );
  return { kind: layout.kind ?? "", parts: layout.parts ?? [], states: layout.states ?? [] };
}

/** 最後の段の終わりの状態 */
export const lastState = (layout: TryLayout): TryState =>
  layout.states[layout.states.length - 1] as TryState;

/** ブロックの hash。番号と prev と、中のチップの欄の値を並べた配列を JSON の字にして SHA-256 を取る */
export function blockHash(number: number, prev: string, rows: string[][]): string {
  return createHash("sha256")
    .update(JSON.stringify([number, prev, rows]))
    .digest("hex");
}

/** 読み手が押せる再生の部品。押した後の原本を持つ */
export type TryPlayer = Player & { play(): void; readonly diagram?: unknown };

const players: TryPlayer[] = [];

/** 置いた図を片付ける。検査の file の `afterEach` に渡す */
export function releaseTry(): void {
  for (const player of players.splice(0)) player.destroy();
  document.body.innerHTML = "";
}

/** 幅 `width` の枠に原本を置く */
export function mountTry(
  diagram: unknown,
  width = 720,
  options: PlayerOptions = {},
): { host: HTMLElement; player: TryPlayer } {
  const host = document.createElement("div");
  Object.defineProperty(host, "clientWidth", { value: width });
  document.body.appendChild(host);
  const player = draw("mountDiagram")(host, structuredClone(diagram), options) as TryPlayer;
  players.push(player);
  return { host, player };
}

/** 押した後の原本。再生の部品が持っていなければ落とす */
export function sessionOf(player: TryPlayer): unknown {
  expect(
    player.diagram,
    "再生の部品が、読み手が足した段を含む原本 (diagram) を持たない",
  ).toBeDefined();
  return player.diagram;
}

/** 押した後の原本の段の数 */
export function stepsOf(player: TryPlayer): number {
  return ((sessionOf(player) as { steps?: unknown[] } | undefined)?.steps ?? []).length;
}

/** 入力の帯 */
export function askStrip(host: HTMLElement): HTMLFormElement | null {
  return host.querySelector<HTMLFormElement>('form[data-dragon="ask"]');
}

/** 入力の帯の送る釦 */
export function sendButton(host: HTMLElement): HTMLButtonElement | null {
  return host.querySelector<HTMLButtonElement>('button[data-dragon="send"]');
}

/** 釦 (`press`) の名前の釦 */
export function pressButton(host: HTMLElement, name: string): HTMLButtonElement | null {
  return host.querySelector<HTMLButtonElement>(`button[data-dragon="press"][data-press="${name}"]`);
}

const setValue = (input: HTMLInputElement, value: string): void => {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
};

/** 入力の帯の欄に `values` を打ち込んで送る。欄か送る釦が無ければ落とす */
export function send(host: HTMLElement, values: Record<string, string>): void {
  const strip = askStrip(host);
  expect(strip, "入力の帯 (form[data-dragon=ask]) が無い").not.toBeNull();
  for (const [field, value] of Object.entries(values)) {
    const input = strip?.querySelector<HTMLInputElement>(`input[data-field="${field}"]`);
    expect(input, `入力の帯に ${field} の欄が無い`).not.toBeUndefined();
    expect(input, `入力の帯に ${field} の欄が無い`).not.toBeNull();
    if (input) setValue(input, value);
  }
  const button = sendButton(host);
  expect(button, "入力の帯に送る釦 (button[data-dragon=send]) が無い").not.toBeNull();
  button?.click();
}

/** 釦を押す。釦が無ければ落とす */
export function press(host: HTMLElement, name: string): void {
  const button = pressButton(host, name);
  expect(
    button,
    `${name} の釦 (button[data-dragon=press][data-press=${name}]) が無い`,
  ).not.toBeNull();
  button?.click();
}

/** 図の中のチップを押し、出た欄に値を打ち込んで書き換える。チップか欄が無ければ落とす */
export function edit(host: HTMLElement, item: string, field: string, value: string): void {
  const chip = host.querySelector(`svg [data-chip="${item}"]`);
  expect(chip, `図の中にチップ ${item} (data-chip) が無い`).not.toBeNull();
  chip?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  const form = host.querySelector<HTMLFormElement>('form[data-dragon="edit"]');
  expect(
    form,
    `チップ ${item} を押しても書き換える欄 (form[data-dragon=edit]) が出ない`,
  ).not.toBeNull();
  const input = form?.querySelector<HTMLInputElement>(`input[data-field="${field}"]`);
  expect(input, `書き換える欄に ${field} の欄が無い`).not.toBeNull();
  if (input) setValue(input, value);
  const submit = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
  expect(submit, "書き換える欄に決める釦が無い").not.toBeNull();
  submit?.click();
}

/** 図 (SVG) を置き直した後の、今の図 */
export function figureOf(host: HTMLElement): SVGSVGElement | null {
  return host.querySelector<SVGSVGElement>('svg[data-dragon="figure"]');
}
