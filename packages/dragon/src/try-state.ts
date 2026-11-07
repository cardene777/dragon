/**
 * 試す図 (`try`、#3337) の段ごとの状態を、出来事を 1 つずつ当てて作る。
 *
 * 記法を読む所 (`parser.ts`) は出来事を書いた行ごとに当て、空の待ち行列からの `press` や満杯の待ち行列への `ask` を、その行を名指して断る。
 * 描く部品の並べ方 (`layout/try.ts`) は同じ手順で段ごとの状態 (`layout.states`) と、出来事ごとの状態を作る。
 * 2 つが同じ手順を読むので、記法が通した原本は描く時にも同じ状態になる。
 *
 * 待ち行列は `order` の欄の値の高い順 (同じ値は入った順) に並べる。値は 2 つとも有限の数として読めれば数で、そうでなければ字で比べる。
 * ブロックの `prev` は作った時の 1 つ前のブロックの `hash` で、作った後は変えない。`hash` は番号と `prev` と中のチップの欄の値から、
 * 段ごとに今の欄の値で出し直す。2 つ目以降のブロックは、`prev` が 1 つ前のブロックの今の `hash` と同じなら `ok`、違えば `broken` を持つ。
 * 記録の列 (`log`、#3441) の記録は番号と中のチップだけを持ち、prev と hash を持たない。`all` を書いた記録の列は、記録の中のチップのその欄が全てその値なら `yes`、
 * 1 つでも違えば `no` の印を、段ごとに今の欄の値で出し直す。記録の列を持たない図の状態は、記録の列の欄 (`logs`) を持たない。
 * 入力の帯の `into` は同じ名札の待ち行列が在ればその待ち行列で、無ければ欄の名前で、送ったチップをその欄の値と同じ名札の待ち行列へ入れる (#3441)。
 * `accept` を書いた待ち行列へ入力の帯が送るチップは、名前 (最初の欄の値) が `accept` に在る時だけ入る (#3453)。段の中の `line` は書き手が中身を書くので断らない。
 * `from` に 2 つ以上の待ち行列を書いた釦は、書いた順にそれぞれの上から `take` 件ずつを取り出して 1 つにまとめ、どれかが `take` 件に満たなければ何も変えない (#3453)。
 * 原本の JSON は部品の名札の食い違い (宣言していない部品やチップ) を形の検査で止められないので、当てられない出来事は何も変えずに誤りの種類を返す。
 */
import { queueMost, TRY_LOOK } from "./look/try";
import { sha256 } from "./sha256";
import type { DiagramEvent, TryItem, TryPart, TryVerdict } from "./schema";
import { LANE_MOST } from "./blocks/line/block";

/** 最初のブロックの prev。前のブロックが無いことを 0 が 64 字並んだ値で表す */
export const GENESIS = "0".repeat(64);

/** 機械の列のブロック */
export interface TryBlock {
  /** 1 から数えるブロックの番号 */
  number: number;
  /** 作った時の 1 つ前のブロックの hash (16 進 64 字)。最初のブロックは `GENESIS` */
  prev: string;
  /** 番号と prev と中のチップの欄の値から出した SHA-256 (16 進 64 字) */
  hash: string;
  /** 中のチップ (上から並べる順) */
  items: string[];
  /** 図に出すか。新しい方から `TRY_LOOK.shown` 個を出し、それより古いブロックは畳む */
  shown: boolean;
  /** 1 つ前のブロックとのつながり。最初のブロックは持たない */
  link?: "ok" | "broken";
}

/** 記録の列の記録 (#3441) */
export interface TryRecord {
  /** 1 から数える記録の番号 */
  number: number;
  /** 中のチップ (まとめた順) */
  items: string[];
  /** `all` の印。記録の列が `all` を持たなければ持たない */
  mark?: string;
  /** 図に出すか。新しい方から `TRY_LOOK.shown` 個を出し、それより古い記録は畳む */
  shown: boolean;
}

/** 網を運ばれたチップと、通った節 (送る側から作る人まで) */
export interface TryTrip {
  route: string;
  item: string;
  path: string[];
}

/** ある時点の状態 */
export interface TryState {
  /** 待ち行列ごとの、上から見せる順のチップ */
  queues: Record<string, string[]>;
  /** 機械の列ごとのブロック (古い順) */
  chains: Record<string, TryBlock[]>;
  /** 記録の列ごとの記録 (古い順)。記録の列を持たない図は持たない (#3441) */
  logs?: Record<string, TryRecord[]>;
  /** チップごとの欄の値。入力の帯の欄の順で、最初の欄がチップの名前 */
  items: Record<string, string[]>;
  /** この段で網を運ばれたチップ */
  trips: TryTrip[];
}

/**
 * 出来事を当てられなかった訳。`index` は `line` の中の何番目のチップか。
 * `part` は部品の名札の食い違い (宣言していない部品か、種類の違う部品)、`count` は `ask` の値の数の食い違い。
 * `refused` は待ち行列 `part` が名前 `item` のチップを受け入れないこと (#3453)。
 * `empty` は釦が取り出す待ち行列 `part` が空なこと。`want` は 2 つ以上の待ち行列から集める釦で、チップはあるが `want` 件に満たないこと (#3453)
 */
export type TryFault =
  | { kind: "part"; part: string }
  | { kind: "count"; want: number }
  | { kind: "noChip"; index: number; item: string }
  | { kind: "twice"; index: number; item: string }
  | { kind: "elsewhere"; index: number; item: string; part: string }
  | { kind: "full"; part: string; most: number }
  | { kind: "refused"; part: string; item: string }
  | { kind: "blockFull"; part: string; most: number }
  | { kind: "empty"; part: string; want?: number };

/** 出来事を当てた結果。`chip` は送って作ったチップ、`block` は足したブロック (機械の列と番号)、`record` は足した記録 (記録の列と番号) */
export interface TryApplied {
  fault?: TryFault;
  chip?: string;
  block?: { chain: string; number: number };
  record?: { log: string; number: number };
}

type Part<T extends TryPart["type"]> = Extract<TryPart, { type: T }>;

/** 2 つの値を比べる。`a` が高い時に正。2 つとも有限の数として読めれば数で、そうでなければ字の並び (符号の位置) で比べる */
export function compareValues(a: string, b: string): number {
  const x = Number(a);
  const y = Number(b);
  if (a.trim() !== "" && b.trim() !== "" && Number.isFinite(x) && Number.isFinite(y)) return x - y;
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * 網の `from` から `to` への最短の道 (節の数が最も少ない道)。同じ長さの道が複数ある時は、書いた順の早い線を先に辿った道。
 * 道が無ければ空の並び
 */
export function shortestPath(route: Part<"route">): string[] {
  const next = new Map<string, string[]>();
  const link = (a: string, b: string): void => {
    const list = next.get(a) ?? [];
    if (!list.includes(b)) list.push(b);
    next.set(a, list);
  };
  for (const path of route.paths)
    path.forEach((node, i) => {
      const after = path[i + 1];
      if (after === undefined) return;
      link(node, after);
      link(after, node);
    });
  const parent = new Map<string, string | null>([[route.from, null]]);
  const queue = [route.from];
  for (let i = 0; i < queue.length; i++) {
    const node = queue[i] as string;
    if (node === route.to) break;
    for (const to of next.get(node) ?? []) {
      if (parent.has(to)) continue;
      parent.set(to, node);
      queue.push(to);
    }
  }
  if (!parent.has(route.to)) return [];
  const path: string[] = [];
  for (
    let at: string | null | undefined = route.to;
    at !== null && at !== undefined;
    at = parent.get(at)
  )
    path.unshift(at);
  return path;
}

/** チップの名前から作るチップの名札。既に使われていれば `<名前>-2`、`<名前>-3` ... の空いた最小の番号を付ける */
export function freshId(name: string, used: (id: string) => boolean): string {
  if (!used(name)) return name;
  for (let n = 2; ; n++) if (!used(`${name}-${n}`)) return `${name}-${n}`;
}

/**
 * 入力の帯が送るチップの行き先の待ち行列の名札 (#3441)。`into` が部品の名札 (`isPart`) ならその名札で、
 * そうでなく入力の帯の欄の名前なら、送る値のうちその欄の値
 */
export function intoOf(ask: Part<"ask">, values: readonly string[], isPart: (id: string) => boolean): string {
  if (isPart(ask.into)) return ask.into;
  const at = ask.fields.indexOf(ask.into);
  return at < 0 ? ask.into : (values[at] ?? ask.into);
}

/** 釦が取り出す待ち行列の名札を、書いた順に重ならずに並べる。`from` が 1 つの名札の字なら、その 1 つ (#3453) */
export const fromsOf = (press: Part<"press">): string[] =>
  typeof press.from === "string" ? [press.from] : [...new Set(press.from)];

/** 名前 `name` のチップを、待ち行列 `queue` が受け入れるか。`accept` を書かない待ち行列はどの名前も受け入れる (#3453) */
export const accepts = (queue: TryPart | undefined, name: string): boolean =>
  queue?.type !== "queue" || queue.accept === undefined || queue.accept.includes(name);

/** 入力の帯の欄。入力の帯が無ければ空 */
export const askFields = (parts: readonly TryPart[]): string[] =>
  parts.find((p): p is Part<"ask"> => p.type === "ask")?.fields ?? [];

interface Entry {
  id: string;
  /** 入った順 */
  seq: number;
}

interface Built {
  number: number;
  prev: string;
  items: string[];
}

/** 試す図の状態を出来事ごとに進める。作った時は宣言したチップだけを持ち、待ち行列と機械の列は空 */
export class TryRun {
  /** 待ち行列に縦に収まるチップの数 */
  readonly most: number;
  /** 入力の帯の欄 */
  readonly fields: string[];
  private readonly parts: Map<string, TryPart>;
  private readonly chips = new Map<string, string[]>();
  private readonly queues = new Map<string, Entry[]>();
  private readonly chains = new Map<string, Built[]>();
  /** 記録の列ごとの、記録の中のチップ (古い順) */
  private readonly logs = new Map<string, string[][]>();
  private trips: TryTrip[] = [];
  private seq = 0;

  constructor(spec: { parts: readonly TryPart[]; items: readonly TryItem[] }, most = queueMost()) {
    this.most = most;
    this.fields = askFields(spec.parts);
    this.parts = new Map(spec.parts.map((p) => [p.id, p]));
    for (const p of spec.parts) {
      if (p.type === "queue") this.queues.set(p.id, []);
      if (p.type === "chain") this.chains.set(p.id, []);
      if (p.type === "log") this.logs.set(p.id, []);
    }
    for (const item of spec.items)
      this.chips.set(item.id, [item.id, ...this.fields.slice(1).map((f) => item.values[f] ?? "")]);
  }

  /** チップを持つか */
  has(id: string): boolean {
    return this.chips.has(id);
  }

  /** 次の段を始める。網を運ばれたチップは段ごとに数え直す */
  beginStep(): void {
    this.trips = [];
  }

  /** 出来事を 1 つ当てる。試す図の出来事でない出来事は何もしない */
  apply(event: DiagramEvent): TryApplied {
    if (event.type === "line" && "part" in event) return this.line(event.part, event.items);
    if (event.type === "ask") return this.ask(event.values);
    if (event.type === "press") return this.press(event.press);
    if (event.type === "item") return this.edit(event.item, event.values);
    return {};
  }

  /** 待ち行列の中身を `items` の並びにするか、機械の列に `items` を入れた新しいブロックを足す */
  line(part: string, items: readonly string[]): TryApplied {
    const p = this.parts.get(part);
    if (p?.type !== "queue" && p?.type !== "chain") return { fault: { kind: "part", part } };
    const seen = new Set<string>();
    for (const [index, item] of items.entries()) {
      if (!this.chips.has(item)) return { fault: { kind: "noChip", index, item } };
      if (seen.has(item)) return { fault: { kind: "twice", index, item } };
      seen.add(item);
      const at = this.where(item);
      // 待ち行列の並びを書き直す時は、その待ち行列に居たチップを書いてよい
      if (at !== undefined && !(p.type === "queue" && at === part))
        return { fault: { kind: "elsewhere", index, item, part: at } };
    }
    if (p.type === "queue") {
      if (items.length > this.most) return { fault: { kind: "full", part, most: this.most } };
      this.queues.set(
        part,
        items.map((id) => ({ id, seq: this.seq++ })),
      );
      return {};
    }
    if (items.length > LANE_MOST) return { fault: { kind: "blockFull", part, most: LANE_MOST } };
    return { block: this.build(part, [...items]) };
  }

  /**
   * 入力の帯の欄の値でチップを作り、入力の帯の待ち行列へ送る。網を書いた入力の帯は、網の最短の道を運ぶ。
   * `into` が部品の名札でなく欄の名前なら、その欄の値と同じ名札の待ち行列へ送る (#3441)。
   * 送る先の待ち行列が名前 (最初の欄の値) を受け入れなければ、満杯かを見る前に断る (#3453)
   */
  ask(values: readonly string[]): TryApplied {
    const ask = this.partOf("ask", "ask");
    if (!ask) return { fault: { kind: "part", part: "ask" } };
    if (values.length !== ask.fields.length)
      return { fault: { kind: "count", want: ask.fields.length } };
    const into = intoOf(ask, values, (id) => this.parts.has(id));
    const queue = this.queues.get(into);
    if (!queue) return { fault: { kind: "part", part: into } };
    const name = values[0] ?? "";
    if (!accepts(this.parts.get(into), name)) return { fault: { kind: "refused", part: into, item: name } };
    if (queue.length >= this.most)
      return { fault: { kind: "full", part: into, most: this.most } };
    const id = freshId(name, (x) => this.chips.has(x));
    this.chips.set(id, [...values]);
    queue.push({ id, seq: this.seq++ });
    const route = ask.via === undefined ? undefined : this.partOf("route", ask.via);
    if (route) this.trips.push({ route: route.id, item: id, path: shortestPath(route) });
    return { chip: id };
  }

  /**
   * 釦を押す。待ち行列の上から `take` 件 (少なければ全部) を、機械の列の新しいブロックか記録の列の新しい記録へ待ち行列の並びのまま移す。
   * `from` に 2 つ以上の待ち行列を書いた釦は、書いた順にそれぞれの上から `take` 件ずつを 1 つにまとめる。
   * どれかが `take` 件に満たなければ、書いた順で最初に足りない待ち行列を名指して断り、どの待ち行列も変えない (#3453)
   */
  press(name: string): TryApplied {
    const press = this.partOf("press", name);
    if (!press) return { fault: { kind: "part", part: name } };
    const froms = fromsOf(press);
    const missing = froms.find((id) => !this.queues.has(id));
    const log = this.logs.get(press.into);
    if (missing !== undefined || (!this.chains.has(press.into) && !log))
      return { fault: { kind: "part", part: missing ?? press.into } };
    const gather = froms.length > 1;
    for (const id of froms) {
      const waiting = this.queues.get(id)?.length ?? 0;
      if (waiting === 0) return { fault: { kind: "empty", part: id } };
      if (gather && waiting < press.take) return { fault: { kind: "empty", part: id, want: press.take } };
    }
    const taken = froms.flatMap((id) => this.sorted(id).slice(0, press.take));
    for (const id of froms)
      this.queues.set(
        id,
        (this.queues.get(id) ?? []).filter((entry) => !taken.includes(entry.id)),
      );
    if (log) {
      log.push(taken);
      return { record: { log: press.into, number: log.length } };
    }
    return { block: this.build(press.into, taken) };
  }

  /** チップの欄の値を書き換える。入力の帯の欄 (最初の欄を除く) でない鍵は読まない */
  edit(item: string, values: Readonly<Record<string, string>>): TryApplied {
    const row = this.chips.get(item);
    if (!row) return { fault: { kind: "noChip", index: 0, item } };
    for (const [key, value] of Object.entries(values)) {
      const at = this.fields.indexOf(key);
      if (at >= 1) row[at] = value;
    }
    return {};
  }

  /** 今の状態。hash は今の欄の値で出し直す */
  state(): TryState {
    const queues: Record<string, string[]> = {};
    for (const id of this.queues.keys()) queues[id] = this.sorted(id);
    const chains: Record<string, TryBlock[]> = {};
    for (const [id, built] of this.chains) {
      const blocks = built.map((b): TryBlock => ({
        number: b.number,
        prev: b.prev,
        hash: this.hashOf(b),
        items: [...b.items],
        shown: false,
      }));
      blocks.forEach((block, i) => {
        block.shown = i >= blocks.length - TRY_LOOK.shown;
        const before = blocks[i - 1];
        if (before) block.link = block.prev === before.hash ? "ok" : "broken";
      });
      chains[id] = blocks;
    }
    const items: Record<string, string[]> = {};
    for (const [id, row] of this.chips) items[id] = [...row];
    const trips = this.trips.map((t) => ({ ...t, path: [...t.path] }));
    if (this.logs.size === 0) return { queues, chains, items, trips };
    const logs: Record<string, TryRecord[]> = {};
    for (const [id, records] of this.logs) {
      const p = this.partOf("log", id);
      logs[id] = records.map((list, i): TryRecord => ({
        number: i + 1,
        items: [...list],
        ...(p?.all ? { mark: this.markOf(p.all, list) } : {}),
        shown: i >= records.length - TRY_LOOK.shown,
      }));
    }
    return { queues, chains, logs, items, trips };
  }

  /** 名札 `id` の種類 `type` の部品 */
  private partOf<T extends TryPart["type"]>(type: T, id: string): Part<T> | undefined {
    const p = this.parts.get(id);
    return p?.type === type ? (p as Part<T>) : undefined;
  }

  /** チップが今居る部品の名札。どこにも居なければ `undefined` */
  private where(item: string): string | undefined {
    for (const [id, entries] of this.queues) if (entries.some((e) => e.id === item)) return id;
    for (const [id, built] of this.chains) if (built.some((b) => b.items.includes(item))) return id;
    for (const [id, records] of this.logs) if (records.some((list) => list.includes(item))) return id;
    return undefined;
  }

  /** 記録の印。中のチップの `all.field` の欄が全て `all.value` なら `all.yes`、1 つでも違えば `all.no` */
  private markOf(all: TryVerdict, items: readonly string[]): string {
    const at = this.fields.indexOf(all.field);
    return items.every((id) => this.chips.get(id)?.[at] === all.value) ? all.yes : all.no;
  }

  /** 待ち行列の上から見せる順。`order` の欄の値の高い順、同じ値は入った順。`order` が無ければ入った順 */
  private sorted(id: string): string[] {
    const p = this.parts.get(id);
    const at = p?.type === "queue" && p.order !== undefined ? this.fields.indexOf(p.order) : -1;
    const entries = [...(this.queues.get(id) ?? [])];
    const value = (e: Entry): string => this.chips.get(e.id)?.[at] ?? "";
    entries.sort((a, b) => (at >= 1 ? compareValues(value(b), value(a)) : 0) || a.seq - b.seq);
    return entries.map((e) => e.id);
  }

  /** 機械の列に新しいブロックを足す。prev は 1 つ前のブロックの今の hash */
  private build(chain: string, items: string[]): { chain: string; number: number } {
    const built = this.chains.get(chain) ?? [];
    const last = built[built.length - 1];
    const block = { number: built.length + 1, prev: last ? this.hashOf(last) : GENESIS, items };
    built.push(block);
    this.chains.set(chain, built);
    return { chain, number: block.number };
  }

  private hashOf(block: Built): string {
    return sha256(
      JSON.stringify([block.number, block.prev, block.items.map((id) => this.chips.get(id) ?? [])]),
    );
  }
}
