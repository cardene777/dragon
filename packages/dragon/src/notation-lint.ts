/**
 * 記法の検査 (図を書く人向けの修正システム)。
 *
 * cdl / dragon の記法で書いた図 (`CdlDiagram`) を決まった規則で検査し、直し方を修正案
 * (`suggestion`) として返す純粋関数。 言語モデルは使わない。
 *
 * 検知システム (`check:cdl` / `check:dragon` / `check:kind`) は開発者向けで実装の不具合を
 * 見つける。 こちらは図を書く人向けで、読む人へ伝わらない書き方 (図の説明に入り込んだ実装の
 * 書き方、無い部品を指す参照、値や項目が空の図表など) を見つける。
 *
 * 使い方:
 *   import { lintDiagram, autoFix } from "@cardenelabs/dragon";
 *   const report = lintDiagram(diagram);
 *   // report.issues = LintIssue[]
 *   // report.autoFixableCount = 自動修正で実際に解消できる指摘の数
 *   const patched = autoFix(diagram); // 自動修正を当てた新しい図 (元の図は変えない)
 *
 * 道具:
 *   node packages/dragon/scripts/dragon-lint.mjs apps/playground-spa/src/topics/catalog/presets.cdl.ts
 */
import type { CdlDiagram, CdlNode } from "@cardenelabs/cdl";

export type LintSeverity = "warn" | "info";

export type LintIssue = {
  /** rule 識別子 */
  rule: string;
  severity: LintSeverity;
  /** 該当対象 (node id / edge id / diagram id) */
  target: string;
  /**
   * 書き手向けの指摘の文。 書き手が打ち込む識別子と書き手の値は `` ` `` で囲み、 残りは日本語で書く
   * (画面側の `lint-message-words.test.ts` が全規則の文を判定に通す)
   */
  message: string;
  /** 修正案。 自動修正できる指摘は自動修正が書く値そのもの、 できない指摘は直し方の文 */
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

/**
 * 図の説明に入り込んだ実装の書き方と、 読む人に何が伝わらないか。
 *
 * 文は理由だけを持ち、 直し方の例を書かない。 直し方は修正案 (`suggestion`) が自動修正の
 * 出力から作る。 例を字で書くと、 自動修正の出力を変えた日に例だけが古い文型で残る
 * (実測 = #1934 で出力を変えた後も `「〜 を示す図」 のように` が残っていた、 #1940)。
 */
const REDUNDANT_TOPIC_PATTERNS: Array<{ pattern: RegExp; hint: string }> = [
  { pattern: /\bpreset\s*\(/i, hint: "`preset (…)` は作り手の書き方で、 読む人には何を示す図かが伝わらない" },
  { pattern: /render\s*未実装/, hint: "`render 未実装` は作り手向けの控えで、 カタログに出す説明には要らない" },
  {
    pattern: /SVG\s+(polyline|arc|rect|path)/i,
    hint: "`SVG` の描き方の名前 (`polyline` / `arc` / `rect` / `path`) は実装の詳細で、 何を示す図かが伝わらない",
  },
  { pattern: /\bpolygon\b/i, hint: "`polygon` は実装の言葉で、 何を示す図かが伝わらない" },
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
 * `name` はカタログが同じ型の見本に付けた名前 (`apps/playground-spa/src/lib/i18n.ts` の
 * `ITEM_NAME_JA` の `preset*`) と同じ字にする。 利用者は自動修正で書き換わった説明の名前で
 * カタログを探すため、 呼び名が割れると同じ型の見本に辿り着けない。 照らす検査は画面側の
 * `lint-topic-names.test.ts` が持つ (この package は画面側の file を読まない)。
 *
 * 説明の末尾を型の名前にするのは、 名前の多くが `図` で終わるため。 旧い文型
 * 「{名前} を示す図」 のまま名前を差し替えると `工程表 を示す図` / `状態遷移図 を示す図` の
 * ように図が重なる。 カタログの見本の説明 (`全体に対する内訳の割合を示す円グラフ`) と同じ並びにした。
 *
 * `chart` と `bar chart` はカタログに同じ型の見本が無いので、 図表の日常語で呼ぶ。
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

/**
 * 図の説明に実装の書き方が入っていないかを見る。
 *
 * **自動修正で消えるかは、 直した後の説明にもう 1 度当てて決める** (#1940)。 自動修正が消すのは
 * 先頭の型の名前と、 括弧の中の実装の言葉だけで、 括弧の外の `SVG polyline を使う` は字が変わらない。
 * 当てずに「直せる」 と返すと、 道具が直せる数に入れ、 直したはずの指摘が次の検査でまた出る。
 *
 * 修正案は、 直せる時は自動修正が書く値そのもの (`LintIssue.suggestion` の約束)、 直せない時は
 * 直し方の文にする。 文の例は書き換え先の表から作り、 字で書かない。
 */
function ruleTopicRedundancy(d: CdlDiagram): LintIssue[] {
  const 当たる = REDUNDANT_TOPIC_PATTERNS.filter(({ pattern }) => pattern.test(d.topic));
  if (当たる.length === 0) return [];
  const 直した後 = applyTopicAutoFix(d.topic);
  const 直せる = !REDUNDANT_TOPIC_PATTERNS.some(({ pattern }) => pattern.test(直した後));
  const 例 = KIND_TO_JA.gantt!;
  const 手で直す = `何を示す図かを文で書き直す (「${例.shows}を示す${例.name}」 のように)`;
  return 当たる.map(({ hint }) => ({
    rule: "topic-redundant-implementation-detail",
    severity: "warn",
    target: d.id,
    message: `図の説明 \`${d.topic}\` に実装の書き方が入っている。 ${hint}`,
    suggestion: 直せる ? 直した後 : 手で直す,
    autoFixable: 直せる,
  }));
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
          message: `図表 \`${n.id}\` に値 (\`datum\`) が 1 件も無く、 図表が描かれない`,
          suggestion: `\`.datum({ id, label, value })\` で値を 1 件以上足す`,
          autoFixable: false,
        });
      }
      if (data.length === 1) {
        out.push({
          rule: "chart-single-datum",
          severity: "info",
          target: n.id,
          message: `図表 \`${n.id}\` の値 (\`datum\`) が 1 件だけで、 比べることも移り変わりを追うこともできない`,
          suggestion: `値を 2 件以上にする (折れ線グラフは 3 件以上で傾きが読める)`,
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
            message: `作業 \`${t.id}\` の \`dependsOn\` が、 無い作業 \`${t.dependsOn}\` を指している`,
            suggestion: `\`dependsOn\` を既にある作業の \`id\` に直すか、 \`dependsOn\` を外す`,
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
            message: `枝 \`${b.id}\` の \`parent\` が、 無い枝 \`${b.parent}\` を指している`,
            suggestion: `\`parent\` を中心 (\`${n.mindData.rootId}\`) か、 既にある枝の \`id\` に直す`,
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
            message: `階層図の項目 \`${t.id}\` の \`parent\` が、 無い項目 \`${t.parent}\` を指している`,
            suggestion: `\`parent\` を既にある項目の \`id\` に直すか、 \`parent\` を外して一番上の項目にする`,
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
          message: `四象限図 \`${n.id}\` に項目 (\`item\`) が 1 件も無く、 軸だけが描かれる`,
          suggestion: `\`.item({ id, title, quadrant })\` で項目を 1 件以上足す (\`quadrant\` は \`topLeft\` などの 4 区画から選ぶ)`,
          autoFixable: false,
        });
      }
      const bySlot = new Set(items.map((it) => it.quadrant));
      if (items.length >= 4 && bySlot.size === 1) {
        out.push({
          rule: "quadrant-single-quadrant",
          severity: "info",
          target: n.id,
          message: `四象限図 \`${n.id}\` の項目がすべて 1 つの区画に集まり、 4 つに分けた意味が薄い`,
          suggestion: `項目を 2 つ以上の区画に分ける。 強みと弱みを並べる分析 (\`SWOT\`) や優先度を決める図は、 4 つの区画に散らして使う`,
          autoFixable: false,
        });
      }
    }
  }
  return out;
}

/**
 * 段階の人数が減っていくことを見る。
 *
 * 人数の欄は `{名前}` を書ける (状態から取る形、 cdl の `render/payload-binding.ts` が解く)。
 * その場合ここでは値が決まらないので、**数どうしの組だけを比べる** (#1194)。
 *
 * 素通しで比べると文字列の大小比較になり、`{trial}` が `{signup}` より大きいという理由で
 * 発火する。 実際にカタログの funnel を状態から取る形にした時、その偽発火が出た。
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
            message: `段階 \`${stages[i]!.id}\` の数 (${今}) が前の段階 (${前}) より多い。 絞り込み図は段階が進むほど数が減る`,
            suggestion: `段階の順番を確かめる。 数が増える流れを示すなら、 折れ線グラフ (\`chart-line\`) などの別の図にする`,
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
