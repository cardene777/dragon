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

const KIND_TO_JA: Record<string, string> = {
  chart: "統計チャート",
  "line chart": "折れ線グラフ",
  "pie chart": "円グラフ",
  "bar chart": "棒グラフ",
  flow: "処理の流れ",
  swimlane: "スイムレーン (役割別レーン)",
  sequence: "時系列のやり取り",
  topology: "システム構成",
  er: "テーブル関係 (ER 図)",
  stateMachine: "状態遷移 (ステート図)",
  stateMachine2: "拡張ステート図 (階層状態)",
  infrastructure: "クラウド構成",
  classDiagram: "UML クラス図",
  tree: "階層ツリー",
  userJourney: "ユーザージャーニー",
  mindMap: "マインドマップ",
  funnel: "ファネル (段階別離脱)",
  quadrant: "四象限マトリクス",
  gantt: "ガントチャート",
  flowchart: "分岐フローチャート",
  network: "ネットワーク構成",
};

function applyTopicAutoFix(topic: string): string {
  // 1. 先頭の kind name を検出、 マッチしたら JA description に置換
  const kindMatch = topic.match(
    /^\s*(chart|flow|swimlane|sequence|topology|er|stateMachine2?|infrastructure|classDiagram|tree|userJourney|mindMap|funnel|quadrant|gantt|flowchart|network|line chart|pie chart|bar chart)\b/i,
  );
  if (kindMatch) {
    const kind = kindMatch[1]!.toLowerCase();
    const canonical = Object.keys(KIND_TO_JA).find((k) => k.toLowerCase() === kind);
    if (canonical) {
      return `${KIND_TO_JA[canonical]} を示す図`;
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
 * **記法からは届かない**。 `mind-map` 種別と `mindData` を作るのは組立て API
 * (`mindMap()` builder) だけで、 記法の `type: mind` は `card` を 3 列に並べる別実装
 * (`compileMind`)。 `#1170` まで `type: radial` が記法側の唯一の作り手だったが、 種別ごと
 * 消えたため、 本規則が当たるのは組立て API で組んだ図に限られる。
 *
 * 記法側にも同じ検査を届かせるなら `compileMind` を `mind-map` 種別に寄せる必要があり、
 * それは記法の絵が変わる変更なので `#1177` で扱う。
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
