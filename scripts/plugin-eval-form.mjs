/**
 * 評価の記録 (`plugins/dragon/evals/record.json`) の 1 つのケースの形 (#3546)。
 *
 * 記録を書く `plugin-eval-record.mjs` と、記録を読む検査 (`plugin-eval.test.ts`) が同じ版を使う。
 *
 * 版 2 のケースの記録は、版 1 の欄 (`fingerprint`、`runs`、`passed`、`claude`、`date`) に加えて次の 3 つの数を持つ。
 *
 * - `diagrams` は評価で AI が保存した図の数。写しの repo に前から在った図と、ブロックの定義だけの file は数えない
 * - `broken` は `dragon check --layout` の崩れが 1 件以上残る図の数
 * - `unchecked` は検査が失敗したか記法の誤りで、崩れを測れなかった図の数。測れなかった図を崩れ 0 件と読まないため、別の数で持つ
 *
 * 版を持たない記録 (版 1) は崩れを数えていないので、読む側は通さず、評価を回し直すよう名指す。
 */

/** 崩れの数を持つ記録の形の版 */
export const RECORD_VERSION = 2;

const RERUN = "評価を回し直す (node scripts/plugin-eval-record.mjs)";

/** 1 つのケースの記録を読み、通らない理由を並べる。空の並びなら通る */
export function entryProblems(name, entry) {
  if (entry === undefined) return [`${name} を回した記録が無い。${RERUN}`];
  if (entry.version !== RECORD_VERSION) {
    const seen = entry.version === undefined ? "版を持たない" : `版 ${String(entry.version)} の`;
    return [`${name} の記録が古い形か知らない形 (${seen}記録) で、AIが描いた図の崩れを数えていない。${RERUN}`];
  }
  const problems = [];
  for (const field of ["diagrams", "broken", "unchecked"]) {
    if (!Number.isInteger(entry[field]) || entry[field] < 0) {
      problems.push(`${name} の記録に${label(field)}が無い。${RERUN}`);
    }
  }
  if (problems.length > 0) return problems;
  if (entry.unchecked > 0) {
    problems.push(`${name} でAIが保存した図のうち${entry.unchecked}枚は、崩れを数えられなかった (検査が失敗したか記法の誤り)`);
  }
  if (entry.broken > 0) {
    problems.push(`${name} でAIが保存した図のうち${entry.broken}枚に、dragon check --layout の崩れが残る`);
  }
  return problems;
}

function label(field) {
  if (field === "diagrams") return "AIが保存した図の数";
  if (field === "broken") return "崩れの残る図の数";
  return "崩れを数えられなかった図の数";
}
