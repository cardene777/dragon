/**
 * 判定の表 (#3879) の並べ方。規則と例から、行ごとのセルの印 (✓、✕、照らせない「—」) と判定と外れた規則を決める。
 * dragon は値を比べず、例に書いた外れる規則だけを✕にし、書かない規則を✓にする。`[stop]` を書いた規則の後の列は照らさない。
 * 表は HTML で描き、字を縮めずに枠の中を横に送るので、置き場所は持たず、幅と高さは見せ方を選ぶ決まりが読む目安だけを持つ
 */
import type { JudgeRule } from "../../judge/types";
import type { Layout } from "../../layout/scene";
import type { DiagramModel } from "../../schema";
import type { NotationLang } from "../../words";
import type { KindOptions } from "../parts";

/** 頁の言葉ごとの、表の見出しと判定の既定の語。判定の語は 1 行目の `[pass: <語>, block: <語>]` で替えられる */
export const JUDGE_WORDS: Record<NotationLang, { case: string; verdict: string; pass: string; block: string; verdictBody: (pass: string, block: string) => string }> = {
  ja: { case: "例", verdict: "判定", pass: "通す", block: "止める", verdictBody: (pass, block) => `例ごとに${pass}か${block}かを出す` },
  en: { case: "Case", verdict: "Verdict", pass: "pass", block: "block", verdictBody: (pass, block) => `Each case gets ${pass} or ${block}` },
};

/** セルの印。`pass` は✓、`fail` は✕、`skip` は照らせない「—」 */
export type JudgeMark = "pass" | "fail" | "skip";

/** 規則のセル。`col` は左から 0 で数えた規則の列、`value` は✕の下に出す外れた値 */
export interface JudgeCell {
  rule: string;
  col: number;
  mark: JudgeMark;
  value?: string;
}

/** 例の行。`why` は止める例の外れた規則の列 (左から) */
export interface JudgeRow {
  name: string;
  note?: string;
  cells: JudgeCell[];
  verdict: "pass" | "block";
  why: number[];
}

/** 判定の表の並べ方。`words` は頁の言葉の見出しと、替えた後の判定の語 */
export interface JudgeLayout extends Layout {
  judge: {
    rules: JudgeRule[];
    rows: JudgeRow[];
    words: { case: string; verdict: string; pass: string; block: string };
  };
}

/** 見せ方を選ぶ決まりが読む、列と行の大きさの目安 (px) */
const GUESS = { caseCol: 200, ruleCol: 112, verdictCol: 168, head: 60, row: 56 } as const;

/** 判定の表を並べる。枠の幅を渡した時はその幅を表の幅の目安にし、表が広い時は枠の中を横に送る */
export function layoutJudge(diagram: DiagramModel, lang: NotationLang, options: KindOptions): JudgeLayout {
  const spec = diagram.judge ?? { rules: [], cases: [] };
  const base = JUDGE_WORDS[lang];
  const rows = spec.cases.map((item): JudgeRow => {
    const fails = new Map((item.fails ?? []).map((f) => [f.rule, f]));
    const stopAt = spec.rules.findIndex((rule) => fails.get(rule.id)?.stop === true);
    const cells = spec.rules.map((rule, col): JudgeCell => {
      if (stopAt >= 0 && col > stopAt) return { rule: rule.id, col, mark: "skip" };
      const failed = fails.get(rule.id);
      if (!failed) return { rule: rule.id, col, mark: "pass" };
      return { rule: rule.id, col, mark: "fail", ...(failed.value !== undefined ? { value: failed.value } : {}) };
    });
    const why = cells.filter((cell) => cell.mark === "fail").map((cell) => cell.col);
    return { name: item.name, ...(item.note !== undefined ? { note: item.note } : {}), cells, verdict: why.length > 0 ? "block" : "pass", why };
  });
  const natural = GUESS.caseCol + spec.rules.length * GUESS.ruleCol + GUESS.verdictCol;
  return {
    kind: "judge",
    width: options.width ?? natural,
    height: GUESS.head + rows.length * GUESS.row,
    regions: [],
    boxes: [],
    lifelines: [],
    edges: [],
    labels: [],
    actions: [],
    badges: [],
    paths: [],
    ends: [],
    judge: {
      rules: spec.rules,
      rows,
      words: { case: base.case, verdict: base.verdict, pass: spec.pass ?? base.pass, block: spec.block ?? base.block },
    },
  };
}
