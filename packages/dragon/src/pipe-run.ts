/**
 * 配管の図 (`pipe`、#3389) の段の中の出来事を 1 つずつ当てて、残高と値と開いている呼び出しを持つ。
 *
 * 記法を読む所 (配管の図のブロックの読み方) は出来事を書いた行ごとに当て、量の足りない `move` や開いていない呼び出しの `return` を、その行を名指して断る。
 * 描く部品の並べ方 (`kinds/pipe/layout.ts`) は同じ手順で段ごとの残高と値と、変更が暫定か確定か取り消しかを作る。
 * 2 つが同じ手順を読むので、記法が通した原本は描く時にも同じ値になる。原本の JSON は形の検査しか通らないので、当てられない出来事は何も変えずに訳を返す。
 *
 * 量は書いた字のまま持ち、足し引きと比べは十進の数で行う。`0.02 + 0.0175 + 0.0125` は `0.05` になり、2 進の数の端数を出さない。
 * 処理を借りる呼び出し (`[call: delegate]`) の内側は呼んだ側の値の上で動き、書き込めない呼び出し (`[call: static]`) の内側は何も変えられない。
 */
import { ETH } from "./blocks/definition-values";
import type { PipeCall, PipeCallKind, PipeCheck, PipeHold, PipeMove, PipeWrite } from "./schema";

/** 量の字。0 以上の十進の数 */
const AMOUNT = /^\d+(?:\.\d+)?$/u;
/** 数と単位の字 (`0.05 WETH`)。単位は省ける */
const QUANTITY = /^(\d+(?:\.\d+)?)(?:\s+(\S+))?$/u;

/** 量として読めるか */
export const isAmount = (text: string): boolean => AMOUNT.test(text);

/** 数と単位。数として読めない字は `undefined` */
export function quantityOf(text: string): { number: string; unit?: string } | undefined {
  const found = QUANTITY.exec(text.trim());
  if (!found?.[1]) return undefined;
  return { number: found[1], ...(found[2] !== undefined ? { unit: found[2] } : {}) };
}

/** 十進の数を、整数と小数の桁数の組にする */
function decimal(text: string): { n: bigint; scale: number } {
  const [whole = "0", fraction = ""] = text.split(".");
  return { n: BigInt(`${whole}${fraction}`), scale: fraction.length };
}

/** 2 つの十進の数を同じ桁数に揃える */
function aligned(a: string, b: string): [bigint, bigint, number] {
  const x = decimal(a);
  const y = decimal(b);
  const scale = Math.max(x.scale, y.scale);
  return [x.n * 10n ** BigInt(scale - x.scale), y.n * 10n ** BigInt(scale - y.scale), scale];
}

/** 整数と小数の桁数を、末尾の 0 を落とした十進の字にする */
function shown(n: bigint, scale: number): string {
  const negative = n < 0n;
  const digits = (negative ? -n : n).toString().padStart(scale + 1, "0");
  const whole = digits.slice(0, digits.length - scale);
  const fraction = digits.slice(digits.length - scale).replace(/0+$/u, "");
  return `${negative ? "-" : ""}${whole}${fraction === "" ? "" : `.${fraction}`}`;
}

export const plus = (a: string, b: string): string => {
  const [x, y, scale] = aligned(a, b);
  return shown(x + y, scale);
};

export const minus = (a: string, b: string): string => {
  const [x, y, scale] = aligned(a, b);
  return shown(x - y, scale);
};

/** 比べた結果。`a` が小さければ負、同じなら 0、大きければ正 */
export function compare(a: string, b: string): number {
  const [x, y] = aligned(a, b);
  return x === y ? 0 : x < y ? -1 : 1;
}

/** 確認の結果。両側が数なら比べ、数でない確認は `[fail]` を書いた時だけ落ちる */
export function checkPasses(check: Pick<PipeCheck, "left" | "op" | "right" | "fail">): boolean {
  const left = quantityOf(check.left);
  const right = quantityOf(check.right);
  if (!left || !right) return check.fail !== true;
  const c = compare(left.number, right.number);
  switch (check.op) {
    case ">=":
      return c >= 0;
    case "<=":
      return c <= 0;
    case ">":
      return c > 0;
    case "<":
      return c < 0;
    case "==":
      return c === 0;
    case "!=":
      return c !== 0;
  }
}

/** 換算の比率の字 (`×0.0005`)。出る値を入る値で割り、有効な桁を 6 桁までにする。入る値が 0 の時は比率を出さない */
export function rateOf(input: string, output: string): string {
  const a = quantityOf(input);
  const b = quantityOf(output);
  if (!a || !b || compare(a.number, "0") === 0) return "×–";
  return `×${String(Number((Number(b.number) / Number(a.number)).toPrecision(6)))}`;
}

/** 残高と値の鍵。持ち主と、トークンか値の名前 */
export const keyOf = (owner: string, what: string): string => `${owner}|${what}`;

/** ある時点の残高と値と、出ているイベントの番号 */
export interface PipeSnapshot {
  balances: Map<string, string>;
  values: Map<string, string>;
  emitted: number[];
}

/** 開いている呼び出し。`index` は出てきた順の番号、`self` はこの呼び出しの内側が書き込む値の持ち主 */
export interface PipeFrame {
  index: number;
  from: string;
  to: string;
  kind: "call" | PipeCallKind;
  self: string;
  before: PipeSnapshot;
}

/** 出来事を当てられなかった訳 */
export type PipeFault =
  /** `return` と `revert` の者が、いちばん内側で開いている呼び出しの呼ばれた者でない。`open` はいちばん内側の呼び出し */
  | { fault: "notOpen"; open?: PipeFrame }
  /** 書き込めない呼び出しの内側で、残高か値かイベントか ETH を変えた */
  | { fault: "readOnly" }
  /** 処理を借りる呼び出しに ETH を添えた */
  | { fault: "valueOnDelegate" }
  /** `owner` が `token` の槽を持たない */
  | { fault: "noTank"; owner: string; token: string }
  /** `owner` の `token` が `have` しかない */
  | { fault: "short"; owner: string; token: string; have: string }
  /** `move` の頭の者がトークンの Contract でない */
  | { fault: "notToken" }
  /** 書き替える値を `owner` が持たない */
  | { fault: "noPlate"; owner: string };

/** 関係者の名札と名前 */
interface Named {
  id: string;
  name: string;
}

/** 配管の図の出来事を当てる手順。残高と値と開いている呼び出しを持つ */
export class PipeRun {
  readonly balances = new Map<string, string>();
  readonly values = new Map<string, string>();
  readonly frames: PipeFrame[] = [];
  /** 出ていて取り消されていないイベントの番号 (出した順) */
  emitted: number[] = [];
  /** トークンの Contract の名札から、そのトークンの名前。残高の単位に名前を書かれた関係者 */
  readonly tokens = new Map<string, string>();
  private calls = 0;
  private emits = 0;

  constructor(boxes: readonly Named[], holds: readonly PipeHold[]) {
    for (const hold of holds) {
      if ("token" in hold) {
        this.balances.set(keyOf(hold.box, hold.token), hold.amount);
        const owner = boxes.find((b) => b.name === hold.token);
        if (hold.token !== ETH && owner) this.tokens.set(owner.id, hold.token);
      } else this.values.set(keyOf(hold.box, hold.name), hold.value);
    }
  }

  /** 今の残高と値とイベントの写し */
  snapshot(): PipeSnapshot {
    return { balances: new Map(this.balances), values: new Map(this.values), emitted: [...this.emitted] };
  }

  /** 書き込めない呼び出しの内側か */
  readOnly(): boolean {
    return this.frames.some((f) => f.kind === "static");
  }

  /** `box` が書き込む値の持ち主。`box` を呼ばれた者に持つ、いちばん内側の開いている呼び出しの `self`。開いていなければ `box` */
  ownerOf(box: string): string {
    for (let i = this.frames.length - 1; i >= 0; i--) {
      const frame = this.frames[i] as PipeFrame;
      if (frame.to === box) return frame.self;
    }
    return box;
  }

  /** 量 `amount` を `owner` の `token` から引けるか。引けなければ訳 */
  private short(owner: string, token: string, amount: string): PipeFault | undefined {
    const have = this.balances.get(keyOf(owner, token));
    if (have === undefined) return { fault: "noTank", owner, token };
    return compare(have, amount) < 0 ? { fault: "short", owner, token, have } : undefined;
  }

  private transfer(token: string, from: string, to: string, amount: string): PipeFault | undefined {
    const fault = this.short(from, token, amount);
    if (fault) return fault;
    const into = this.balances.get(keyOf(to, token));
    if (into === undefined) return { fault: "noTank", owner: to, token };
    this.balances.set(keyOf(from, token), minus(this.balances.get(keyOf(from, token)) ?? "0", amount));
    this.balances.set(keyOf(to, token), plus(into, amount));
    return undefined;
  }

  /** 呼び出しを開く。添えた ETH は呼び出しを開いた後の残高から送り、取り消すと戻る */
  call(event: PipeCall): PipeFault | undefined {
    if (event.value !== undefined) {
      if (event.call === "delegate") return { fault: "valueOnDelegate" };
      if (event.call === "static" || this.readOnly()) return { fault: "readOnly" };
      const fault = this.short(event.from, ETH, event.value) ?? (this.balances.has(keyOf(event.to, ETH)) ? undefined : { fault: "noTank", owner: event.to, token: ETH });
      if (fault) return fault;
    }
    const top = this.frames[this.frames.length - 1];
    const self = event.call === "delegate" ? (top?.self ?? event.from) : event.to;
    this.frames.push({ index: this.calls++, from: event.from, to: event.to, kind: event.call ?? "call", self, before: this.snapshot() });
    if (event.value !== undefined) this.transfer(ETH, event.from, event.to, event.value);
    return undefined;
  }

  /** いちばん内側の呼び出しを `box` の `return` か `revert` で閉じ、閉じた呼び出しを返す。`revert` は呼び出しを開く前の残高と値とイベントへ戻す */
  close(box: string, how: "return" | "revert"): PipeFrame | PipeFault {
    const top = this.frames[this.frames.length - 1];
    if (!top || top.to !== box) return { fault: "notOpen", ...(top ? { open: top } : {}) };
    this.frames.pop();
    if (how === "revert") {
      this.balances.clear();
      for (const [k, v] of top.before.balances) this.balances.set(k, v);
      this.values.clear();
      for (const [k, v] of top.before.values) this.values.set(k, v);
      this.emitted = [...top.before.emitted];
    }
    return top;
  }

  move(event: PipeMove): PipeFault | undefined {
    if (this.readOnly()) return { fault: "readOnly" };
    const token = this.tokens.get(event.box);
    if (token === undefined) return { fault: "notToken" };
    return this.transfer(token, event.from, event.to, event.amount);
  }

  /** 値を書き替え、書き替えた値の持ち主を返す */
  write(event: PipeWrite): string | PipeFault {
    if (this.readOnly()) return { fault: "readOnly" };
    const owner = this.ownerOf(event.box);
    if (!this.values.has(keyOf(owner, event.name))) return { fault: "noPlate", owner };
    this.values.set(keyOf(owner, event.name), event.value);
    return owner;
  }

  /** イベントを出し、出した順の番号を返す */
  emit(): number | PipeFault {
    if (this.readOnly()) return { fault: "readOnly" };
    const id = this.emits++;
    this.emitted.push(id);
    return id;
  }
}

/** 訳か。当てた結果と訳を分ける */
export const isFault = (value: unknown): value is PipeFault => typeof value === "object" && value !== null && "fault" in value;
