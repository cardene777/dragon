/**
 * 判定の表 (#3879) の並べ方。規則と例から、行ごとのセルの印 (✓、✕、照らせない「—」) と判定と外れた規則を決める。
 * dragon は値を比べず、例に書いた外れる規則だけを✕にし、書かない規則を✓にする。`[stop]` を書いた規則の後の列は照らさない。
 * 表は HTML で描き、字を縮めずに枠の中を横に送るので、置き場所は持たず、幅と高さは見せ方を選ぶ決まりが読む目安だけを持つ
 */
import type { JudgeRule } from "../../judge/types";
import type { Layout, SceneNote } from "../../layout/scene";
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

/** 例の行。`note` は札で見せない表で名前の下に出す添え書き。`scene` は押すと追う場面の名前 (#3892) */
export interface JudgeRow {
  name: string;
  note?: string;
  scene?: string;
  cells: JudgeCell[];
  verdict: "pass" | "block";
}

/**
 * 判定の表の並べ方。`words` は頁の言葉の見出しと、替えた後の判定の語。
 * `pop` は規則と例の `note` を押すと出る札で見せる表 (#3890) で、札の一覧は `noteCards` に持つ。
 * 札の名札は規則が `rule:<名札>`、例が `case:<書いた順の番号>` で、描いた表の押せるセルの `data-note` と同じ
 */
export interface JudgeLayout extends Layout {
  judge: {
    pop: boolean;
    rules: JudgeRule[];
    rows: JudgeRow[];
    words: { case: string; verdict: string; pass: string; block: string };
  };
}

/** 札で見せる表 (#3890) の札の名札。規則は名札、例は書いた順の番号 (0 から) で決める。押せるセルの `data-note` と札の `data-box` に使う */
export const judgeNoteId = {
  rule: (id: string): string => `rule:${id}`,
  case: (index: number): string => `case:${index}`,
} as const;

/** 見せ方を選ぶ決まりが読む、列と行の大きさの目安 (px) */
const GUESS = { caseCol: 200, ruleCol: 112, verdictCol: 168, head: 60, row: 56 } as const;

/** 判定の表を並べる。枠の幅を渡した時はその幅を表の幅の目安にし、表が広い時は枠の中を横に送る */
export function layoutJudge(diagram: DiagramModel, lang: NotationLang, options: KindOptions): JudgeLayout {
  const spec = diagram.judge ?? { rules: [], cases: [] };
  const base = JUDGE_WORDS[lang];
  const pop = diagram.note === "pop";
  const rows = spec.cases.map((item): JudgeRow => {
    const fails = new Map((item.fails ?? []).map((f) => [f.rule, f]));
    const stopAt = spec.rules.findIndex((rule) => fails.get(rule.id)?.stop === true);
    const cells = spec.rules.map((rule, col): JudgeCell => {
      if (stopAt >= 0 && col > stopAt) return { rule: rule.id, col, mark: "skip" };
      const failed = fails.get(rule.id);
      if (!failed) return { rule: rule.id, col, mark: "pass" };
      return { rule: rule.id, col, mark: "fail", ...(failed.value !== undefined ? { value: failed.value } : {}) };
    });
    // 札で見せる表は、例の note を名前の下に描かず札へ移す (#3890)
    return { name: item.name, ...(item.note !== undefined && !pop ? { note: item.note } : {}), ...(item.scene !== undefined ? { scene: item.scene } : {}), cells, verdict: cells.some((cell) => cell.mark === "fail") ? "block" : "pass" };
  });
  // 札の一覧。HTML の表は印を描く座標を持たないので、印の丸の真ん中は 0 にし、札は押したセルの四角から置く
  const card = (box: string, name: string, text: string, example: string | undefined): SceneNote => ({ box, name, text, ...(example !== undefined ? { example } : {}), x: 0, y: 0 });
  const noteCards = pop
    ? [
        ...spec.rules.flatMap((rule, i) => (rule.note === undefined ? [] : [card(judgeNoteId.rule(rule.id), `${i + 1} ${rule.name}`, rule.note, rule.example)])),
        ...spec.cases.flatMap((item, i) => (item.note === undefined ? [] : [card(judgeNoteId.case(i), item.name, item.note, item.example)])),
      ]
    : [];
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
    ...(noteCards.length > 0 ? { noteCards } : {}),
    judge: {
      pop,
      rules: spec.rules,
      rows,
      words: { case: base.case, verdict: base.verdict, pass: spec.pass ?? base.pass, block: spec.block ?? base.block },
    },
  };
}
