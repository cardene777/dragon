/**
 * Notation lint (author 向け修正システム)。
 *
 * cdl / dragon 記法で書かれた CdlDiagram を rule-based に検査し、
 * 「もっと良い書き方」 を suggestion として返す純粋関数。 LLM 不要、 rule のみ。
 *
 * 検知システム (`check:cdl` / `check:dragon` / `check:kind`) は開発陣向けで
 * 「実装バグ」 を検出するが、 本 notation-lint は **author 向け** で
 * 「書き方の癖 / 冗長表現 / 未定義参照 / 空 payload」 等を検出する。
 *
 * 使い方:
 *   import { lintDiagram } from "@cardenelabs/dragon";
 *   const report = lintDiagram(diagram);
 *   // report.issues[] = LintIssue[]
 *   // report.fixed = LintIssue[] のうち自動修正で解消される件
 *   // report.autoFix(diagram) = 修正済 CdlDiagram
 *
 * CLI:
 *   pnpm dragon-lint apps/playground-spa/src/topics/catalog/presets.cdl.ts
 */
import type { CdlDiagram, CdlNode } from "@cardenelabs/cdl";

export type LintSeverity = "warn" | "info";

export type LintIssue = {
  /** rule 識別子 */
  rule: string;
  severity: LintSeverity;
  /** 該当対象 (node id / edge id / diagram id) */
  target: string;
  /** 人間向けメッセージ */
  message: string;
  /** 修正案 (自動修正可能なら適用後の値、 手動修正必要なら null) */
  suggestion?: string;
  /** autoFix() が本 issue を自動解消できるか */
  autoFixable: boolean;
};

export type LintReport = {
  diagramId: string;
  issues: LintIssue[];
  /** autoFix() が実際に解消できる issue の数 */
  autoFixableCount: number;
};

const REDUNDANT_TOPIC_PATTERNS: Array<{ pattern: RegExp; hint: string }> = [
  { pattern: /\bpreset\s*\(/i, hint: "「〜 preset (詳細)」 は実装表現、 「〜 を示す図」 のように読者向け説明に" },
  { pattern: /render\s*未実装/, hint: "「render 未実装」 は開発者向け内部メモ、 catalog 表示では省く" },
  { pattern: /SVG\s+(polyline|arc|rect|path)/i, hint: "「SVG polyline / arc / rect / path」 は実装詳細、 「〜 を示す図」 に置換" },
  { pattern: /\bpolygon\b/i, hint: "「polygon」 は実装用語、 図の意味を説明する自然文に置換" },
];

/**
 * 検査対象 diagram の全 rule を実行し LintReport を返す。
 * 全 rule は純粋 (副作用なし / LLM 呼び出しなし)。
 */
export function lintDiagram(d: CdlDiagram): LintReport {
  const issues: LintIssue[] = [];

  issues.push(...ruleTopicRedundancy(d));
  issues.push(...ruleEmptyChartData(d));
  issues.push(...ruleGanttUnknownDependsOn(d));
  issues.push(...ruleMindMapParentReference(d));
  issues.push(...ruleTreeParentReference(d));
  issues.push(...ruleQuadrantMissingItems(d));
  issues.push(...ruleFunnelMonotonicCount(d));

  return {
    diagramId: d.id,
    issues,
    autoFixableCount: issues.filter((i) => i.autoFixable).length,
  };
}

/**
 * lintDiagram で detected な issue のうち autoFixable=true のものを機械的に適用して
 * 修正済 CdlDiagram を返す。 手動修正必要な issue は残る (次回 lint 時に再検出)。
 */
export function autoFix(d: CdlDiagram): CdlDiagram {
  const patched: CdlDiagram = {
    ...d,
    topic: applyTopicAutoFix(d.topic),
    nodes: d.nodes.map((n) => ({ ...n })),
  };
  return patched;
}

/**
 * 図の型ごとに、 自動修正が書く説明「{shows}を示す{name}」 の 2 つの部品。
 *
 * `name` は見本帳が同じ型の見本に付けた名前 (`apps/playground-spa/src/lib/i18n.ts` の
 * `ITEM_NAME_JA` の `preset*`) と同じ字にする。 利用者は自動修正で書き換わった説明の名前で
 * 見本帳を探すため、 呼び名が割れると同じ型の見本に辿り着けない。 照らす検査は画面側の
 * `lint-topic-names.test.ts` が持つ (この package は画面側の file を読まない)。
 *
 * 説明の末尾を型の名前にするのは、 名前の多くが `図` で終わるため。 旧い文型
 * 「{名前} を示す図」 のまま名前を差し替えると `工程表 を示す図` / `状態遷移図 を示す図` の
 * ように図が重なる。 見本帳の見本の説明 (`全体に対する内訳の割合を示す円グラフ`) と同じ並びにした。
 *
 * `chart` と `bar chart` は見本帳に同じ型の見本が無いので、 図表の日常語で呼ぶ。
 */
const KIND_TO_JA: Record<string, { shows: string; name: string }> = {
  chart: { shows: "項目ごとの数値", name: "グラフ" },
  "line chart": { shows: "値の移り変わり", name: "折れ線グラフ" },
  "pie chart": { shows: "全体に対する内訳の割合", name: "円グラフ" },
  "bar chart": { shows: "項目ごとの値の大きさ", name: "棒グラフ" },
  flow: { shows: "処理の順番", name: "フロー" },
  swimlane: { shows: "役割ごとの縦列に分けた処理の流れ", name: "スイムレーン" },
  sequence: { shows: "要素どうしのやり取りの順番", name: "シーケンス図" },
  topology: { shows: "システムの構成要素と接続", name: "トポロジー図" },
  er: { shows: "表どうしの関係", name: "ER図" },
  stateMachine: { shows: "状態と遷移の条件", name: "状態遷移図" },
  stateMachine2: { shows: "親の状態の中に置いた子の状態と遷移の条件", name: "入れ子の状態遷移図" },
  infrastructure: { shows: "クラウドとネットワークの構成", name: "階層構成図" },
  classDiagram: { shows: "クラスどうしの関係", name: "クラス図" },
  tree: { shows: "組織や分類の親子の関係", name: "階層図" },
  userJourney: { shows: "利用者の気持ちの移り変わり", name: "体験の道筋" },
  mindMap: { shows: "中心の主題から広がる発想", name: "枝分かれ図" },
  funnel: { shows: "段階ごとに残る数と離れる数", name: "絞り込み図" },
  quadrant: { shows: "2 つの軸で分けた項目の位置", name: "四象限図" },
  gantt: { shows: "作業の期間と前後の関係", name: "工程表" },
  flowchart: { shows: "分岐や判定を含む処理の順番", name: "流れ図" },
  network: { shows: "機器と区画のつながり", name: "ネットワーク図" },
};

function applyTopicAutoFix(topic: string): string {
  // 1. 先頭の kind name を検出、 マッチしたら「{shows}を示す{name}」 に置換
  const kindMatch = topic.match(
    /^\s*(chart|flow|swimlane|sequence|topology|er|stateMachine2?|infrastructure|classDiagram|tree|userJourney|mindMap|funnel|quadrant|gantt|flowchart|network|line chart|pie chart|bar chart)\b/i,
  );
  if (kindMatch) {
    const kind = kindMatch[1]!.toLowerCase();
    const canonical = Object.keys(KIND_TO_JA).find((k) => k.toLowerCase() === kind);
    if (canonical) {
      const { shows, name } = KIND_TO_JA[canonical]!;
      return `${shows}を示す${name}`;
    }
  }

  // 2. kind 名で始まらない場合は括弧内実装詳細のみ除去
  let out = topic;
  out = out.replace(/\s*\([^)]*(preset|render|SVG|polygon|polyline|arc|rect|path)[^)]*\)/gi, "");
  out = out.replace(/\b(preset|render)\b/gi, "");
  out = out.replace(/\s+/g, " ").trim();
  if (out.length < 3) return "図の説明";
  return out;
}

function ruleTopicRedundancy(d: CdlDiagram): LintIssue[] {
  const out: LintIssue[] = [];
  for (const { pattern, hint } of REDUNDANT_TOPIC_PATTERNS) {
    if (pattern.test(d.topic)) {
      out.push({
        rule: "topic-redundant-implementation-detail",
        severity: "warn",
        target: d.id,
        message: `topic に実装詳細が含まれる: "${d.topic}"`,
        suggestion: hint,
        autoFixable: true,
      });
    }
  }
  return out;
}

function ruleEmptyChartData(d: CdlDiagram): LintIssue[] {
  const out: LintIssue[] = [];
  for (const n of d.nodes) {
    if (n.kind === "chart-line" || n.kind === "chart-pie" || n.kind === "chart-bar") {
      const data = n.chartData ?? [];
      if (data.length === 0) {
        out.push({
          rule: "chart-empty-datum",
          severity: "warn",
          target: n.id,
          message: `chart node "${n.id}" が datum 0 件、 chart は非表示になる`,
          suggestion: `.datum({ id: ..., label: ..., value: ... }) を 1 件以上追加`,
          autoFixable: false,
        });
      }
      if (data.length === 1) {
        out.push({
          rule: "chart-single-datum",
          severity: "info",
          target: n.id,
          message: `chart node "${n.id}" が datum 1 件、 比較 / 推移として意味が薄い`,
          suggestion: `2 件以上の datum を推奨 (line 系は 3 件以上で trend が見える)`,
          autoFixable: false,
        });
      }
    }
  }
  return out;
}

function ruleGanttUnknownDependsOn(d: CdlDiagram): LintIssue[] {
  const out: LintIssue[] = [];
  for (const n of d.nodes) {
    if (n.kind === "gantt-timeline") {
      const tasks = n.ganttData ?? [];
      const ids = new Set(tasks.map((t) => t.id));
      for (const t of tasks) {
        if (t.dependsOn && !ids.has(t.dependsOn)) {
          out.push({
            rule: "gantt-unknown-depends-on",
            severity: "warn",
            target: t.id,
            message: `task "${t.id}" が未定義 task "${t.dependsOn}" に dependsOn 参照`,
            suggestion: `参照先 id を修正 or dependsOn を除去`,
            autoFixable: false,
          });
        }
      }
    }
  }
  return out;
}

/**
 * 枝の親が実在するかを見る。
 *
 * **記法からも届く** (`#1177`)。 一時期は組立て API (`mindMap()` builder) で組んだ図にしか
 * 当たらなかった = 記法の `type: mind` が `card` を 3 列に並べる別実装で、 `mind-map` 種別を
 * 作っていなかったため (`#1170` で `type: radial` が消えて唯一の作り手が無くなった)。
 * `#1177` で `compileMind` を `mind-map` 種別に寄せたので、 前提が揃うようになった。
 *
 * ただし **記法から違反が出ることは無い**。 記法の `actors` は「1 つ目が中心、 残りが枝」 の
 * 並びで親を書く場所が無く、 全ての枝が中心の直下 (必ず実在する) になるため。 違反が出るのは
 * 組立て API で親を書き間違えた図になる。
 */
function ruleMindMapParentReference(d: CdlDiagram): LintIssue[] {
  const out: LintIssue[] = [];
  for (const n of d.nodes) {
    if (n.kind === "mind-map" && n.mindData) {
      const known = new Set<string>([n.mindData.rootId]);
      for (const b of n.mindData.branches) known.add(b.id);
      for (const b of n.mindData.branches) {
        if (!known.has(b.parent)) {
          out.push({
            rule: "mindmap-unknown-parent",
            severity: "warn",
            target: b.id,
            message: `branch "${b.id}" が未定義 parent "${b.parent}" を参照`,
            suggestion: `parent を rootId ("${n.mindData.rootId}") または既存 branch id に修正`,
            autoFixable: false,
          });
        }
      }
    }
  }
  return out;
}

function ruleTreeParentReference(d: CdlDiagram): LintIssue[] {
  const out: LintIssue[] = [];
  for (const n of d.nodes) {
    if (n.kind === "tree-hierarchy" && n.treeData) {
      const ids = new Set(n.treeData.map((t) => t.id));
      for (const t of n.treeData) {
        if (t.parent && !ids.has(t.parent)) {
          out.push({
            rule: "tree-unknown-parent",
            severity: "warn",
            target: t.id,
            message: `tree node "${t.id}" が未定義 parent "${t.parent}" を参照`,
            suggestion: `parent id を既存 tree node に修正 or parent 除去 (root にする)`,
            autoFixable: false,
          });
        }
      }
    }
  }
  return out;
}

function ruleQuadrantMissingItems(d: CdlDiagram): LintIssue[] {
  const out: LintIssue[] = [];
  for (const n of d.nodes) {
    if (n.kind === "quadrant-matrix" && n.quadrantData) {
      const items = n.quadrantData.items;
      if (items.length === 0) {
        out.push({
          rule: "quadrant-empty",
          severity: "warn",
          target: n.id,
          message: `quadrant "${n.id}" が item 0 件、 軸のみ表示される`,
          suggestion: `.item({ id: ..., title: ..., quadrant: "topLeft" | ... }) を 1 件以上追加`,
          autoFixable: false,
        });
      }
      const bySlot = new Set(items.map((it) => it.quadrant));
      if (items.length >= 4 && bySlot.size === 1) {
        out.push({
          rule: "quadrant-single-quadrant",
          severity: "info",
          target: n.id,
          message: `quadrant "${n.id}" の item が 1 象限に集中、 マトリクスの意味が薄い`,
          suggestion: `2 象限以上に item を分散 (SWOT / Priority matrix 等は 4 象限 balanced を推奨)`,
          autoFixable: false,
        });
      }
    }
  }
  return out;
}

/**
 * 段の人数が減っていくことを見る。
 *
 * 人数の欄は `{名前}` を書ける (状態から取る形、 cdl の `render/payload-binding.ts` が解く)。
 * その場合ここでは値が決まらないので、**数どうしの組だけを比べる** (#1194)。
 *
 * 素通しで比べると文字列の大小比較になり、`{trial}` が `{signup}` より大きいという理由で
 * 発火する。 実際に見本帳の funnel を状態から取る形にした時、その偽発火が出た。
 */
function ruleFunnelMonotonicCount(d: CdlDiagram): LintIssue[] {
  const out: LintIssue[] = [];
  for (const n of d.nodes) {
    if (n.kind === "funnel-stages" && n.funnelData) {
      const stages = n.funnelData;
      for (let i = 1; i < stages.length; i++) {
        const 今 = stages[i]!.count;
        const 前 = stages[i - 1]!.count;
        if (typeof 今 !== "number" || typeof 前 !== "number") continue;
        if (今 > 前) {
          out.push({
            rule: "funnel-increasing-count",
            severity: "warn",
            target: stages[i]!.id,
            message: `stage "${stages[i]!.id}" (${stages[i]!.count}) が前段 (${stages[i - 1]!.count}) より増加、 funnel は単調減少が期待される`,
            suggestion: `stage 順を再確認、 増加 pattern なら別 preset (chart-line 等) を検討`,
            autoFixable: false,
          });
        }
      }
    }
  }
  return out;
}

// dev-only import bridging (unused var lint prevention)
export type { CdlDiagram, CdlNode };
