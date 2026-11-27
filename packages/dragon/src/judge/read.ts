/**
 * 判定の表 (`judge`、#3879) の記法を読む処理と書き戻す処理と、原本の形との行き来。
 *
 * 記法は `judge <題> [pass: <語>, block: <語>, note: pop]` で始め、`rule <名札> as <名前> [value: <値>, note: <説明>, example: <例>]` で列の規則を、
 * `case <名前> [note: <添え書き>, example: <例>]` で行の例を書き、例の下の `fail <規則の名札>: <外れた値> [stop]` で外れる規則を書く。
 * 1 行目の `[note: pop]` は規則と例の `note` を押すと出る札で見せ (#3890)、`example` は札で見せる表の `note` を持つ行にだけ書ける。
 * 規則は最初の `case` より前に書き、`fail` は外れる例の `case` の下に書く。dragon は値を比べず、書いた `fail` だけを✕にする。
 * 誤りは行を名指して、読む時に渡した言葉 (日本語か英語) の文で断る。
 *
 * 段は規則の列ごとに 1 つと判定の 1 つで、記法には書かない。原本の段は規則と題から言葉に依らずに決まる形で持ち、
 * 描く前の直し (`kinds/judge.ts` の `fold`) が頁の言葉の題に替える
 */
import type { NoteMode } from "../blocks/pop/block";
import { noteModeOf } from "../blocks/pop/read";
import { messagesFor } from "../messages";
import { markParsed } from "../parsed";
import type { Parsed } from "../parser";
import { attrs, name, shown } from "../print-kit";
import { fail, ID, NotationError, readAttrs, readDeclared, readName, skipSpaces } from "../read-kit";
import type { Diagram, DiagramModel, Step } from "../schema";
import { isBlankOrComment, type SourceLine, tokenize } from "../tokenize";
import { DEFAULT_LANG, type NotationLang } from "../words";
import type { JudgeCase, JudgeFail, JudgeRule, JudgeSpec } from "./types";

/** 1 行目の頭の語 */
export const JUDGE = "judge";

/** 判定の表に書ける行の頭の語 */
const HEADS = ["rule", "case", "fail"] as const;

/** 1 行目の属性。判定の語と、規則と例の説明の見せ方 (#3890) */
const HEAD_ATTRS = ["pass", "block", "note"] as const;

/** `fail` の行の、値を持たない印。照らせない例は、その後の列を照らさない */
const STOP = "stop";

interface JudgeMessages {
  /** 1 行目が `judge` で始まらない */
  head: string;
  /** `rule` の行が 1 つも無い */
  noRules: string;
  /** `case` の行が 1 つも無い */
  noCases: string;
  /** 最初の `case` より前の `fail` */
  failBeforeCase: string;
  /** 最初の `case` より後の `rule` */
  ruleAfterCase: string;
  /** 宣言していない規則を名指した `fail`。`rules` は宣言した規則の名札 */
  unknownRule: (id: string, rules: string) => string;
  /** 同じ例に同じ規則の `fail` を 2 度書いた */
  failTwice: (id: string) => string;
  /** 同じ名札の規則を 2 度宣言した */
  ruleTwice: (id: string) => string;
  /** `fail` の後に規則の名札が無い */
  failNeedsRule: string;
  /** `case` の後に例の名前が無い */
  caseNeedsName: string;
  /** 判定の表に書けない行 */
  badLine: (word: string) => string;
  /** 原本の段が規則と判定から決まる形でない */
  badSteps: string;
}

const MESSAGES: Record<NotationLang, JudgeMessages> = {
  ja: {
    head: "判定の表は 1 行目を judge <題> で始める",
    noRules: "判定の表に rule の行が無い。rule <名札> as <名前> [value: <値>] で列の規則を 1 つ以上書く",
    noCases: "判定の表に case の行が無い。case <名前> で行の例を 1 つ以上書く",
    failBeforeCase: "fail の行が最初の case より前に在る。fail は外れる例の case の下に書く",
    ruleAfterCase: "rule の行が case より後に在る。規則は最初の case より前に書く",
    unknownRule: (id, rules) => `fail の規則 ${id} を rule で宣言していない。書ける規則は ${rules}`,
    failTwice: (id) => `同じ例に規則 ${id} の fail を 2 度書いた。1 つの例には 1 つの規則を 1 度だけ書く`,
    ruleTwice: (id) => `規則 ${id} を 2 度宣言した。規則の名札は表の中で 1 つにする`,
    failNeedsRule: "fail の後に外れた規則の名札を書く (fail <規則>: <外れた値>)",
    caseNeedsName: "case の後に例の名前を書く (case <名前> [note: <添え書き>])",
    badLine: (word) => `判定の表に ${word} の行は書けない。書けるのは rule と case と fail の行`,
    badSteps: "判定の表の段は、規則の列ごとに 1 つと判定の 1 つで決まる形にする",
  },
  en: {
    head: "A judge table starts its first line with judge <title>",
    noRules: "The judge table has no rule line. Write one or more column rules with rule <id> as <name> [value: <value>]",
    noCases: "The judge table has no case line. Write one or more row cases with case <name>",
    failBeforeCase: "A fail line comes before the first case. Write fail under the case that fails",
    ruleAfterCase: "A rule line comes after a case. Write the rules before the first case",
    unknownRule: (id, rules) => `The fail rule ${id} is not declared with rule. The rules are ${rules}`,
    failTwice: (id) => `The same case has a fail for rule ${id} twice. Write each rule once per case`,
    ruleTwice: (id) => `Rule ${id} is declared twice. Give each rule its own id`,
    failNeedsRule: "Write the id of the failed rule after fail (fail <rule>: <failed value>)",
    caseNeedsName: "Write the case name after case (case <name> [note: <note>])",
    badLine: (word) => `A judge table cannot have a ${word} line. It takes rule, case, and fail lines`,
    badSteps: "The steps of a judge table are one per rule column and one for the verdicts",
  },
};

/** 記法が判定の表か。最初の空でない行の頭の語で見る */
export function isJudgeNotation(text: string): boolean {
  const head = tokenize(text).find((line) => !isBlankOrComment(line));
  return head !== undefined && new RegExp(`^${JUDGE}(?:\\s|\\[|$)`, "u").test(head.text);
}

/** 行の頭の語 */
const headOf = (source: SourceLine): string => /^[^\s[]+/u.exec(source.text)?.[0] ?? "";

/** 規則と題から決まる段。規則の列ごとに 1 つと、判定の 1 つ。どの言葉でも同じ形にし、頁の言葉の題は描く前に替える */
export function stepsOf(title: string, spec: Pick<JudgeSpec, "rules">): Step[] {
  return [...spec.rules.map((rule) => ({ title: rule.name, body: rule.value ?? rule.name, events: [] })), { title, body: title, events: [] }];
}

/** 判定の表の記法を読む。誤りは行を名指して `lang` の言葉の文で断る */
export function readJudge(text: string, lang: NotationLang = DEFAULT_LANG, defaultNote?: NoteMode): Parsed {
  const j = MESSAGES[lang];
  const m = messagesFor(lang);
  const lines = tokenize(text).filter((line) => !isBlankOrComment(line));
  try {
    const head = lines[0];
    if (!head || !isJudgeNotation(head.text)) throw new NotationError(head?.line ?? 1, 1, j.head);
    const titled = readName(head, JUDGE.length, m);
    const words = titled.rest < head.text.length ? readAttrs(head, titled.rest, HEAD_ATTRS, m) : new Map();
    // 1 行目の note が頁の既定に勝つ。札で見せる表の規則と例だけが example を書ける (#3890)
    const pop = (noteModeOf(head, words.get("note"), m) ?? defaultNote) === "pop";
    const title = titled.value === "" ? JUDGE : titled.value;
    const rules: JudgeRule[] = [];
    const cases: JudgeCase[] = [];
    for (const source of lines.slice(1)) {
      const word = headOf(source);
      if (!(HEADS as readonly string[]).includes(word)) throw fail(source, 0, j.badLine(word));
      if (word === "rule") {
        if (cases.length > 0) throw fail(source, 0, j.ruleAfterCase);
        const declared = readDeclared(source, "rule", ["value", "note", "example"], m);
        if (rules.some((rule) => rule.id === declared.id)) throw fail(source, declared.idAt, j.ruleTwice(declared.id));
        const value = declared.attrs.get("value")?.value;
        const note = declared.attrs.get("note")?.value;
        const example = declared.attrs.get("example");
        if (example && !(pop && note !== undefined)) throw fail(source, example.at, m.exampleWithoutPop);
        rules.push({
          id: declared.id,
          name: declared.name ?? declared.id,
          ...(value !== undefined ? { value } : {}),
          ...(note !== undefined ? { note } : {}),
          ...(example ? { example: example.value } : {}),
        });
      } else if (word === "case") {
        const named = readName(source, word.length, m);
        if (named.value === "") throw fail(source, 0, j.caseNeedsName);
        const read = named.rest < source.text.length ? readAttrs(source, named.rest, ["note", "example", "scene"], m) : new Map();
        const note = read.get("note")?.value;
        const example = read.get("example");
        if (example && !(pop && note !== undefined)) throw fail(source, example.at, m.exampleWithoutPop);
        // 説明の頁の同じ問いの節の場面の図の場面を名指す (#3892)。場面が在るかは頁が確かめる
        const scene = read.get("scene")?.value;
        cases.push({ name: named.value, ...(note !== undefined ? { note } : {}), ...(example ? { example: example.value } : {}), ...(scene !== undefined && scene !== "" ? { scene } : {}) });
      } else {
        const current = cases.at(-1);
        if (current === undefined) throw fail(source, 0, j.failBeforeCase);
        current.fails = [...(current.fails ?? []), readFail(source, rules, current, j, m)];
      }
    }
    if (rules.length === 0) throw fail(head, 0, j.noRules);
    if (cases.length === 0) throw fail(head, 0, j.noCases);
    const pass = words.get("pass")?.value;
    const block = words.get("block")?.value;
    const spec: JudgeSpec = { ...(pass !== undefined ? { pass } : {}), ...(block !== undefined ? { block } : {}), rules, cases };
    return { ok: true, diagram: markParsed(diagramOf(title, spec, pop)) };
  } catch (error) {
    if (!(error instanceof NotationError)) throw error;
    return { ok: false, errors: [{ line: error.line, column: error.column, message: error.message }] };
  }
}

/** `fail <規則>: <外れた値> [stop]` の行。規則は宣言した物で、同じ例の中で 1 度だけ */
function readFail(source: SourceLine, rules: readonly JudgeRule[], current: JudgeCase, j: JudgeMessages, m: ReturnType<typeof messagesFor>): JudgeFail {
  const text = source.text;
  const at = skipSpaces(text, "fail".length);
  const id = /^[^\s:[]+/u.exec(text.slice(at))?.[0];
  if (id === undefined || !ID.test(id)) throw fail(source, at, j.failNeedsRule);
  if (!rules.some((rule) => rule.id === id)) throw fail(source, at, j.unknownRule(id, rules.map((rule) => rule.id).join(" / ")));
  if (current.fails?.some((f) => f.rule === id)) throw fail(source, at, j.failTwice(id));
  let rest = skipSpaces(text, at + id.length);
  let value: string | undefined;
  if (text[rest] === ":") {
    const read = readName(source, rest + 1, m);
    if (read.value !== "") value = read.value;
    rest = read.rest;
  }
  if (rest < text.length && text[rest] !== "[") throw fail(source, rest, m.afterId);
  const stop = rest < text.length && readAttrs(source, rest, [], m, [STOP]).has(STOP);
  return { rule: id, ...(value !== undefined ? { value } : {}), ...(stop ? { stop: true as const } : {}) };
}

/** 判定の表の原本を記法に書き戻す。段は規則と題から決まるので書かない */
export function printJudge(diagram: Pick<Diagram, "title" | "judge" | "note">): string {
  const spec = diagram.judge;
  if (!spec) throw new Error("judge: the judge table has no judge field");
  const title = diagram.title === JUDGE ? "" : ` ${name(diagram.title)}`;
  const lines = [`${JUDGE}${title}${attrs([["pass", spec.pass], ["block", spec.block], ["note", diagram.note]])}`, ""];
  for (const rule of spec.rules) lines.push(`rule ${rule.id}${shown(rule.id, rule.name)}${attrs([["value", rule.value], ["note", rule.note], ["example", rule.example]])}`);
  lines.push("");
  for (const item of spec.cases) {
    lines.push(`case ${name(item.name)}${attrs([["note", item.note], ["example", item.example], ["scene", item.scene]])}`);
    for (const f of item.fails ?? []) lines.push(`  fail ${f.rule}${f.value === undefined ? "" : `: ${name(f.value)}`}${f.stop ? ` [${STOP}]` : ""}`);
  }
  return lines.join("\n");
}

/** 規則と例から組んだ版2の原本。`pop` は規則と例の説明を押すと出る札で見せる表 (#3890) */
function diagramOf(title: string, spec: JudgeSpec, pop: boolean): Diagram {
  return { version: 2, kind: "judge", title, ...(pop ? { note: "pop" as const } : {}), judge: spec, blocks: {}, steps: stepsOf(title, spec) };
}

/** 版2の原本にする。判定の表は規則と例を根の `judge` の欄に持ち、ブロックの宣言の欄を使わない */
export function judgeDiagram(model: DiagramModel, version: number): Diagram {
  if (!model.judge) throw new Error("judge: the judge table has no judge field");
  return { version, kind: "judge", title: model.title, ...(model.note ? { note: model.note } : {}), judge: model.judge, blocks: {}, steps: model.steps };
}

/** 描く処理の形にする。箱を持たず、規則と例を根の `judge` の欄のまま移す */
export function judgeModel(diagram: Diagram): DiagramModel {
  return { version: 1, kind: "judge", title: diagram.title, ...(diagram.note ? { note: diagram.note } : {}), ...(diagram.judge ? { judge: diagram.judge } : {}), boxes: [], steps: diagram.steps };
}

/**
 * 原本の形の決まりに書けない検査。外れる規則が宣言した規則か、同じ例に同じ規則を 2 度書かないか、規則の名札が重ならないか、
 * 段が規則と題から決まる形か。形に合わない原本は形の検査が断るので、ここでは読める所だけを見る
 */
export function judgeErrors(diagram: Diagram, lang: NotationLang = DEFAULT_LANG): string[] {
  const j = MESSAGES[lang];
  const spec = diagram.judge;
  if (!spec || !Array.isArray(spec.rules) || !Array.isArray(spec.cases)) return [];
  const errors: string[] = [];
  // example は札で見せる表の note を持つ規則と例だけが持てる (#3890)。札で見せない表の example は原本の形の検査が断る
  for (const row of [...spec.rules, ...spec.cases]) if (row?.example !== undefined && row.note === undefined) errors.push(messagesFor(lang).exampleWithoutPop);
  const ids = spec.rules.map((rule) => rule?.id).filter((id): id is string => typeof id === "string");
  for (const [i, id] of ids.entries()) if (ids.indexOf(id) !== i) errors.push(j.ruleTwice(id));
  for (const item of spec.cases) {
    const seen = new Set<string>();
    for (const f of Array.isArray(item?.fails) ? item.fails : []) {
      if (typeof f?.rule !== "string") continue;
      if (!ids.includes(f.rule)) errors.push(j.unknownRule(f.rule, ids.join(" / ")));
      else if (seen.has(f.rule)) errors.push(j.failTwice(f.rule));
      seen.add(f.rule);
    }
  }
  if (spec.rules.every((rule) => typeof rule?.name === "string")) {
    const wanted = stepsOf(diagram.title, spec);
    const steps = Array.isArray(diagram.steps) ? diagram.steps : [];
    const same = steps.length === wanted.length && wanted.every((w, i) => steps[i]?.title === w.title && steps[i]?.body === w.body && steps[i]?.events?.length === 0);
    if (!same) errors.push(j.badSteps);
  }
  return errors;
}
