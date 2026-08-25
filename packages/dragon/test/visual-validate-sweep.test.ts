/**
 * Visual validate sweep (Tier C-2 ... cdl engine 層 overlap gating)。
 *
 * dragon playground の catalog topic module を Node 上で import し、cdl visualValidateAll に
 * 通して engine 計算上の overlap (edge-label-overlap + clearance 違反 + node-visibility +
 * alignment) を 0 件で gating する。
 *
 * **module の数を書かない**。 増えれば動く値で、書けば必ずずれる
 * (`rules/quality.md § 導出可能記述は人手で書かない`)。 実際 `charts` が漏れているのに
 * 「全 11 件」 と書かれていた (#1405)。 対象は `sources` が持ち、漏れは
 * § 一覧に載る図が 1 つ残らず sweep の対象に入っている が落とす。
 *
 * module の数と画面の category の数はずれる。 `primitives-extra` は `CATALOG_ITEMS` 側で
 * `primitives` に畳まれるため。 突き合わせを図の id で行うのはこのため。
 *
 * Playwright 経由の Tier C-1 (実 DOM bbox 走査) と二層防御 ... 同 bug を engine 側 layer と
 * 実 render 側 layer の両方で捉えることで、 cdl bug でも dragon CSS bug でも漏れない。
 *
 * 失敗時は diagram 単位で違反内容 (axis + detail) を出力。
 *
 * ---
 * 【interactive / ethereum を収録する理由 (Issue #398)】
 *
 * interactive は 129 diagram を持つ最大 category だが、 本 sweep に長く未収録だった。
 * そのため cdl の lane 幅計算が緩むと node が横に寄って読めなくなる崩れを誰も検知できなかった。
 *
 * 実際に起きたこと = interactive の 20+ item で横並び node の間隔が 60px しか取れず、
 * clearance policy (node 同士は 70px 必要) を 80 件違反していた (catalog sweep 実測)。
 * 原因は lane 幅を node 幅から決める時の左右余白 PAD が 20px で、
 * 間隔 = PAD * 2 + 著者指定の lane 間 gap 20px = 60px にしかならなかったこと。
 * cdl 側で PAD 20 → 25 に広げて間隔 70px を満たすよう修正済 (cdl PR #320)。
 *
 * ただし修正後の間隔は 70px = 必要値ちょうどで、 余裕が 0px の pair が 68 組ある。
 * 判定が `gap < required` の strict 比較なので pass するが、 PAD が 1px でも戻ると
 * 即座に 80 件の違反に戻る。 本 sweep に収録して、 その差し戻しを test で止める。
 *
 * ---
 * 【parts category を収録した経緯 (Issue #944)】
 *
 * parts は 80 diagram のうち "parts-bind-equalizer-5" が node-visibility 違反 5 件を出していた
 * (bar1-bar5 が幅 70px で、 axis の要求する幅 80px 未満)。 音量バーは細長い形が意図的な design
 * なので「バーを太くする」 か「意図的 design として除外登録する」 かの判断が要った。
 *
 * 実測すると、 幅を 80 にしても bar 同士の間隔は 70 のままだった (engine が lane 幅を
 * node 幅 + 余白に自動拡張するため)。 図が横に 50px 広がるだけで他の axis は壊れない。
 * 除外登録は「小さすぎる node」 を今後検知できなくする副作用を持つ一方、 幅を広げる側には
 * 副作用が無かったため、 バーを 80 に広げて axis の検知力を残した。
 *
 * この test は **意図的に skip も budget 緩和もしていない**。 defect を隠すと新規の描画崩れを
 * 検知できなくなるため、 収録した category は全 axis error 0 件で gating する。
 */
import { describe, it, expect } from "vitest";
import { visualValidateAll, type VisualValidationReport, type Violation } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

// catalog 各 page で render される全 topic を sweep 対象として集約。
// Astro の `apps/playground-spa/src/topics/catalog` 配下から相対 import。
import * as cookbook from "../../../apps/playground-spa/src/topics/catalog/cookbook.cdl";
import * as patterns from "../../../apps/playground-spa/src/topics/catalog/patterns.cdl";
import * as presets from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import * as primitives from "../../../apps/playground-spa/src/topics/catalog/primitives.cdl";
import * as primitivesExtra from "../../../apps/playground-spa/src/topics/catalog/primitives-extra.cdl";
import * as textDsl from "../../../apps/playground-spa/src/topics/catalog/text-dsl.cdl";
import * as animation from "../../../apps/playground-spa/src/topics/catalog/animation.cdl";
import * as styles from "../../../apps/playground-spa/src/topics/catalog/styles.cdl";
import * as interactive from "../../../apps/playground-spa/src/topics/catalog/interactive.cdl";
import * as ethereum from "../../../apps/playground-spa/src/topics/catalog/ethereum.cdl";
import * as parts from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import * as charts from "../../../apps/playground-spa/src/topics/catalog/charts.cdl";

type ModuleLike = Record<string, unknown>;

function collectDiagrams(mod: ModuleLike, source: string): CdlDiagram[] {
  const out: CdlDiagram[] = [];
  for (const [, value] of Object.entries(mod)) {
    if (isCdlDiagram(value)) {
      out.push(value);
    }
  }
  if (out.length === 0) {
    console.warn(`[visual-validate-sweep] ${source} に CdlDiagram export がない`);
  }
  return out;
}

function isCdlDiagram(v: unknown): v is CdlDiagram {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    Array.isArray(o.nodes) &&
    Array.isArray(o.edges) &&
    Array.isArray(o.lanes) &&
    Array.isArray(o.phases)
  );
}

// gating 対象軸 ... visualValidate の全 axis の error severity を gating 化。
// cdl routing v6 (PR #44) + shift v5 (PR #45) + baseline (PR #46) + 空 label bbox guard (PR #48)
// の 4 段改良で border case は全て engine 側で解消済、 手作業 labelOffset は sample DSL から全撤廃。
//
// 除外は下の 2 diagram の edge-node-cross のみで、 それ以外の severity=error は全て gating する。
// 「線が node を貫く」 のが図の意図そのものである 2 例だけを名指しで除いている。
function isGatingViolation(v: Violation & { diagramId?: string }): boolean {
  if (v.severity !== "error") return false;
  // pattern-passthrough は「a → router → c」 の意図的な通過設計、 edge-node-cross は design 通り。
  // pattern-hook は「a → hook → c」 の hook 割込み design、 同様に intentional 交差。
  if (
    (v.diagramId === "pattern-passthrough" || v.diagramId === "pattern-hook") &&
    v.axis === "edge-node-cross"
  ) {
    return false;
  }
  return true;
}

function formatReport(reports: VisualValidationReport[]): string {
  const fails = reports.filter((r) => !r.ok);
  if (fails.length === 0) return "(no violations)";
  const lines: string[] = [];
  for (const r of fails) {
    const byAxis = new Map<string, Violation[]>();
    for (const v of r.violations.filter((v) => v.severity === "error")) {
      const arr = byAxis.get(v.axis) ?? [];
      arr.push(v);
      byAxis.set(v.axis, arr);
    }
    if (byAxis.size === 0) continue;
    lines.push(`  diagram "${r.diagramId}"`);
    for (const [axis, vs] of byAxis) {
      lines.push(`    ${axis} ... ${vs.length} 件`);
      for (const v of vs) {
        lines.push(`      - ${v.detail}`);
      }
    }
  }
  return lines.join("\n");
}

const sources: Array<{ name: string; mod: ModuleLike }> = [
  { name: "cookbook", mod: cookbook },
  { name: "patterns", mod: patterns },
  { name: "presets", mod: presets },
  { name: "primitives", mod: primitives },
  { name: "primitives-extra", mod: primitivesExtra },
  { name: "text-dsl", mod: textDsl },
  { name: "animation", mod: animation },
  { name: "styles", mod: styles },
  { name: "interactive", mod: interactive },
  { name: "ethereum", mod: ethereum },
  { name: "parts", mod: parts },
  { name: "charts", mod: charts },
];

describe("Visual validate sweep (Tier C-2 ... cdl engine 層 overlap gating)", () => {
  for (const { name, mod } of sources) {
    it(`${name} ... visualValidate 全 axis error 0 件 (除外は intentional 2 diagram のみ)`, () => {
      const diagrams = collectDiagrams(mod, name);
      expect(diagrams.length).toBeGreaterThan(0);
      const report = visualValidateAll(diagrams, { profile: "catalog" });
      const gatingViolations = report.reports.flatMap((r) =>
        r.violations.filter(isGatingViolation).map((v) => ({ diagramId: r.diagramId, ...v })),
      );
      const detail = formatReport(report.reports);
      // 5 新軸 (PR #75) 込みの warn / error 集計を stderr に流す (info は vitest で suppress される)
      const warnByAxis = new Map<string, number>();
      const errByAxis = new Map<string, number>();
      for (const r of report.reports) {
        for (const v of r.violations) {
          const bucket = v.severity === "warn" ? warnByAxis : errByAxis;
          bucket.set(v.axis, (bucket.get(v.axis) ?? 0) + 1);
        }
      }
      if (warnByAxis.size + errByAxis.size > 0) {
        const wSummary = Array.from(warnByAxis.entries())
          .map(([a, n]) => `${a}=${n}`)
          .join(" ");
        const eSummary = Array.from(errByAxis.entries())
          .map(([a, n]) => `${a}=${n}`)
          .join(" ");
        process.stderr.write(
          `[visual-validate-sweep ${name}] err(${eSummary || "-"}) warn(${wSummary || "-"})\n`,
        );
        // group-boundary-clearance / lane-lane-gap / node-vertical-clearance sample 3 件
        const interestingAxes = new Set([
          "group-boundary-clearance",
          "lane-lane-gap",
          "node-vertical-clearance",
          "arrow-marker-clearance",
          "responsive-viewport",
          "grid-alignment",
          "phase-layout-stability",
          "accessibility-basics",
          "animation-frame-integrity",
          "i18n-cjk-detection",
          "contrast-basics",
          "print-media-compat",
          "color-blind-safety",
          "marker-gradient-def-integrity",
          "subpixel-precision",
          "dom-complexity-budget",
          "reduced-motion-compat",
          "touch-target-size",
          "row-content-typing",
          "terminal-safe-text",
          "gpu-layer-efficiency",
          "memory-budget",
          "svg-injection-safety",
          "seo-metadata-quality",
          "bidi-hyphenation",
          "structured-data-extraction",
          "diagram-version-semver",
          "migration-path-consistency",
          "axis-coverage-meta",
          "axis-documentation-completeness",
          "fixture-drift-detection",
          "locale-parity",
          "validate-performance-budget",
        ]);
        // Axis 47/48 = SweepReport.metaViolations 経由の meta 判定を stderr dump
        if (report.metaViolations.length > 0) {
          for (const m of report.metaViolations.slice(0, 5)) {
            process.stderr.write(`  meta: ${m.axis} — ${m.detail}\n`);
          }
        }
        const samples = report.reports
          .flatMap((r) => r.violations.filter((v) => interestingAxes.has(v.axis)))
          .slice(0, 3);
        for (const s of samples) {
          process.stderr.write(
            `  sample: ${s.axis} — ${s.detail} (diag=${(s as any).diagramId ?? "?"})\n`,
          );
        }
      }
      expect(gatingViolations, `\n${detail}`).toEqual([]);
    });
  }
});

/**
 * 一覧に載る図が 1 つ残らず sweep の対象に入っているか (#1405)。
 *
 * `sources` は手で並べるため、module を足した時に **ここへ足し忘れる**。
 * 忘れても本 file は通る = 検査の件数が減るだけで、何も落ちない。
 *
 * 実際 `charts` の 9 図が一覧に載りながら漏れており、重なりの 4 軸
 * (`edge-label-overlap` / clearance 違反 / `node-visibility` / alignment) が
 * **誰も確かめていない** 状態だった。
 *
 * ## 突き合わせは図の id で行う
 *
 * ページ名で比べてはいけない。 `primitives-extra` は一覧では `primitives` に畳まれるため、
 * 名前で比べると実在する module が「一覧に無い」 と誤って落ちる。
 *
 * 図の id は module と一覧の両方に現れ、畳み方に依らない。
 *
 * ## 両方向で見る
 *
 * 一覧にあって対象に無いのが漏れ。 逆に対象にあって一覧に無いのは、画面に出ない図を
 * 検査している形で、除外の宣言 (`isGatingViolation`) が意図しない図に効く元になる。
 *
 * ## 件数を書かない
 *
 * 「全 N 件」 と書くと module が増えた時にずれる
 * (`rules/quality.md § 導出可能記述は人手で書かない`)。 実際どれだけ漏れているかは
 * 下の検査が名指しで並べる。
 */
describe("一覧に載る図が 1 つ残らず sweep の対象に入っている (#1405)", () => {
  /** 一覧に載る図の id。 `parts` は遅延読み込みなので明示的に足す */
  async function 一覧の図(): Promise<Set<string>> {
    const { CATALOG_ITEMS, loadPartsItems } = await import("@/lib/catalog-items");
    const out = new Set<string>();
    for (const items of Object.values(CATALOG_ITEMS)) for (const it of items) out.add(it.id);
    // `parts` は `CATALOG_ITEMS` で空配列。 足さないと 80 図が範囲から漏れる
    for (const it of await loadPartsItems()) out.add(it.id);
    return out;
  }

  /** sweep が見る図の id */
  function 対象の図(): Set<string> {
    const out = new Set<string>();
    for (const { name, mod } of sources) for (const d of collectDiagrams(mod, name)) out.add(d.id);
    return out;
  }

  it("一覧の図と sweep の対象を 1 件以上集められている", async () => {
    // 空振り防止。 どちらかが空だと下の 2 件が両方とも「差が無い」 で通る
    const [一覧, 対象] = [await 一覧の図(), 対象の図()];
    expect(一覧.size, "一覧から図を 1 件も集められていない").toBeGreaterThan(0);
    expect(対象.size, "sweep の対象から図を 1 件も集められていない").toBeGreaterThan(0);
  });

  it("一覧にあって sweep の対象に無い図が無い", async () => {
    const [一覧, 対象] = [await 一覧の図(), 対象の図()];
    const 漏れ = [...一覧].filter((id) => !対象.has(id)).sort();
    expect(漏れ, "一覧に出るのに重なりの検査を通っていない図").toEqual([]);
  });

  it("sweep の対象だが一覧に無い図が無い", async () => {
    const [一覧, 対象] = [await 一覧の図(), 対象の図()];
    const 余り = [...対象].filter((id) => !一覧.has(id)).sort();
    expect(余り, "重なりの検査を通っているが一覧に出ない図").toEqual([]);
  });
});
