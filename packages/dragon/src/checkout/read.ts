import { messagesFor } from "../messages";
import { fail, NotationError, readDeclared } from "../read-kit";
import { isBlankOrComment, tokenize, type SourceLine } from "../tokenize";
import { CHECKOUT_BLOCKS, type BlockRule } from "./blocks";
export const MAX_CHECKOUT_LINES = 10000;

export interface CheckoutBlock {
  kind: string;
  id: string;
  name: string;
  options: Readonly<Record<string, string>>;
  line: number;
}
export interface CheckoutDefinition {
  format: 1;
  kind: "checkout";
  id: string;
  title: string;
  note: string;
  blocks: readonly CheckoutBlock[];
}
export type ReadCheckout = { ok: true; definition: CheckoutDefinition } | { ok: false; errors: { line: number; column: number; message: string }[] };

export function isCheckoutNotation(text: string): boolean {
  const head = tokenize(text).find((line) => !isBlankOrComment(line));
  return head?.text.startsWith("checkout ") ?? false;
}

/** 購入の操作図。数式と規則は列挙した値だけを受け付け、入力をコードとして実行しない。 */
export function parseCheckout(text: string): ReadCheckout {
  if (text.split('\n').length > MAX_CHECKOUT_LINES) return {ok:false,errors:[{line:1,column:1,message:`checkout source line limit is ${MAX_CHECKOUT_LINES}`} ]};
  const lines = tokenize(text).filter((line) => !isBlankOrComment(line));
  const head = lines[0];
  if (!head) return { ok: false, errors: [{ line: 1, column: 1, message: "checkout の定義がありません" }] };
  const m = messagesFor("ja");
  const check = (condition: unknown, source: SourceLine, message: string): void => { if (!condition) throw fail(source, 0, message); };
  try {
    check(head.text.startsWith("checkout "), head, "checkout <id> as <題> [version: 1] で始めます");
    const title = readDeclared(head, "checkout", ["version", "note"], m);
    check(title.attrs.get("version")?.value === "1", head, "checkout の version は 1 を指定します");
    check(Boolean(title.name), head, "checkout の題を as の後に書きます");
    const blocks: CheckoutBlock[] = [];
    const ids = new Set<string>();
    for (const source of lines.slice(1)) {
      const word = source.text.split(/\s/u)[0] ?? "";
      const rule: BlockRule | undefined = CHECKOUT_BLOCKS.find((part) => part.name === word);
      check(rule, source, `購入の操作図で使えないブロックです: ${word}`);
      if (!rule) continue;
      const read = readDeclared(source, word, Object.keys(rule.fields), m);
      check(/^[a-z][a-z0-9_-]{0,63}$/u.test(read.id), source, "ブロックの id は小文字の英数字と - と _ で書きます");
      check(!ids.has(read.id), source, `id が重複しています: ${read.id}`);
      ids.add(read.id);
      const options: Record<string, string> = {};
      for (const [key, field] of Object.entries(rule.fields)) {
        const value = read.attrs.get(key)?.value ?? field.default;
        check(value !== undefined || !field.required, source, `${word} に ${key} を指定します`);
        if (value === undefined) continue;
        check((value.length > 0 || !field.required) && value.length <= 256, source, `${key} は1〜256文字です`);
        if (field.values) check(field.values.includes(value), source, `${key} は ${field.values.join(" / ")} から指定します`);
        if (field.number) check(/^\d+$/u.test(value) && Number.isSafeInteger(Number(value)) && Number(value) <= 1000000000, source, `${key} は0〜1000000000の整数です`);
        options[key] = value;
      }
      check((read.name ?? read.id).length <= 80, source, "表示名は80文字以内です");
      blocks.push({ kind: word, id: read.id, name: read.name ?? read.id, options, line: source.line });
    }
    const sourceOf = (part: CheckoutBlock): SourceLine => lines.find((line) => line.line === part.line) ?? head;
    for (const rule of CHECKOUT_BLOCKS) {
      const count = blocks.filter((part) => part.kind === rule.name).length;
      check(count >= rule.min && count <= rule.max, head, `${rule.name} は ${rule.min}〜${rule.max} 個定義します`);
    }
    const one = (kind: string): CheckoutBlock => {
      const part = blocks.find((item) => item.kind === kind);
      if (!part) throw fail(head, 0, `${kind} がありません`);
      return part;
    };
    const ref = (part: CheckoutBlock, key: string, kind: string): CheckoutBlock => {
      const found = blocks.find((item) => item.id === part.options[key] && item.kind === kind);
      check(found, sourceOf(part), `${part.id}.${key} は ${kind} の id を指定します`);
      if (!found) throw fail(sourceOf(part), 0, "参照先がありません");
      return found;
    };
    const product = one("product"), delivery = one("delivery"), budget = one("budget");
    check(Number(product.options.price) > 0, sourceOf(product), "単価は1以上です");
    check(Number(product.options.min) >= 1 && Number(product.options.min) <= Number(product.options.initial) && Number(product.options.initial) <= Number(product.options.max) && Number(product.options.max) <= 12, sourceOf(product), "数量は 1 ≤ min ≤ initial ≤ max ≤ 12 にします");
    check(Number(budget.options.min) <= Number(budget.options.initial) && Number(budget.options.initial) <= Number(budget.options.max) && Number(budget.options.min) < Number(budget.options.max), sourceOf(budget), "予算は min ≤ initial ≤ max で、min < max にします");
    const stride = Number(budget.options.step);
    check(stride > 0 && (Number(budget.options.max) - Number(budget.options.min)) % stride === 0 && (Number(budget.options.initial) - Number(budget.options.min)) % stride === 0, sourceOf(budget), "予算の初期値と最大値を step の刻みに揃えます");
    const options = blocks.filter((part) => part.kind === "option");
    for (const part of options) ref(part, "for", "delivery");
    check(options.some((part) => part.id === delivery.options.initial), sourceOf(delivery), "配送の initial は option の id を指定します");
    const total = one("total"), approval = one("approval"), payment = one("payment"), order = one("order"), flow = one("flow");
    ref(total, "product", "product"); ref(total, "delivery", "delivery");
    ref(approval, "total", "total"); ref(payment, "approval", "approval"); ref(order, "payment", "payment");
    const parties = blocks.filter((part) => part.kind === "party");
    for (const role of ["buyer", "agent", "seller", "payment"]) {
      check(parties.filter((part) => part.options.role === role).length === 1, head, `party の role: ${role} を1つ定義します`);
      check(ref(flow, role, "party").options.role === role, sourceOf(flow), `flow の ${role} と party の role を揃えます`);
    }
    const cases = blocks.filter((part) => part.kind === "scenario");
    for (const outcome of ["normal", "decline", "lost"]) check(cases.filter((part) => part.options.outcome === outcome).length === 1, head, `scenario の outcome: ${outcome} を1つ定義します`);
    return { ok: true, definition: { format: 1, kind: "checkout", id: title.id, title: title.name ?? title.id, note: title.attrs.get("note")?.value ?? "", blocks } };
  } catch (error) {
    if (!(error instanceof NotationError)) throw error;
    return { ok: false, errors: [{ line: error.line, column: error.column, message: error.message }] };
  }
}
