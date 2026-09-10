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
// 除外は下の表が持つ。 それ以外の severity=error は全て gating する。

/**
 * 落とさない組。 「線が箱を貫く」 ことが図の意図そのものである図を名指しで除く。
 *
 * **表にした上で実物と突き合わせる** (#1730)。 元は `if` の中に 2 図を直接書いており、
 * うち `pattern-hook` は **何にも当たっていなかった**。 図が
 * 「送り手 → 関数」 と「関数 → 受け側の実装」 の 2 本だけになり、 取り決めが書く
 * 「a → hook → c」 の形を持たなくなっていたため。
 *
 * 当たらない除外が残ると、 **その図だけ検知が消えたことに誰も気付けない**。
 * 下の § 名指しした組は実物で裏を取る が、 当たらなくなった組を落とす。
 */
interface 見逃す組 {
  /** 図の id */
  readonly diagramId: string;
  /** 落とさない軸 */
  readonly axis: string;
  /** なぜ意図どおりなのか */
  readonly 理由: string;
}

const 見逃す組の一覧: readonly 見逃す組[] = [
  {
    diagramId: "pattern-passthrough",
    axis: "edge-node-cross",
    理由: "「a → router → c」 の通過を見せる図で、 router を貫くこと自体が意図",
  },
];

function isGatingViolation(v: Violation & { diagramId?: string }): boolean {
  if (v.severity !== "error") return false;
  return !見逃す組の一覧.some((x) => x.diagramId === v.diagramId && x.axis === v.axis);
}

// group-boundary-clearance / lane-lane-gap / node-vertical-clearance sample 3 件
/** `warn` のうち中身まで出す軸。 `error` は重さで決めるのでこの一覧に依らない (#1730) */
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

/** `error` を何件まで並べるか。 超えた分は件数だけ残す */
const ERROR_DUMP_MAX = 10;

/**
 * stderr に流す抜粋を組み立てる (#1730)。
 *
 * **`error` は軸の一覧に依らず必ず中身を出す**。 抜粋の対象を `interestingAxes` という
 * 手書きの一覧で決めていたため、 そこに無い軸は `err(edge-node-cross=1)` と数だけ出て
 * **どの図か辿れなかった**。 `error` は落とすべき重さなので、 数が出た時点で中身も出す。
 *
 * `warn` は従来どおり一覧で絞る。 件数が多く、 全部出すと読めなくなるため。
 *
 * 書き出しと組み立てを分けてあるのは、 **出ることを機械で確かめられるようにする** ため。
 * `process.stderr` に直接書くと、 出たかどうかを検査から見られない。
 */
function 違反の抜粋(
  reports: VisualValidationReport[],
  interestingAxes: ReadonlySet<string>,
): string[] {
  const lines: string[] = [];
  const withId = (sev: Violation["severity"]) =>
    reports.flatMap((r) =>
      r.violations.filter((v) => v.severity === sev).map((v) => ({ ...v, diagramId: r.diagramId })),
    );

  const errors = withId("error");
  for (const e of errors.slice(0, ERROR_DUMP_MAX)) {
    lines.push(`  error: ${e.axis} — ${e.detail} (diag=${e.diagramId})`);
  }
  // **黙って打ち切らない**。 出し切れなかった件数を残す
  if (errors.length > ERROR_DUMP_MAX) {
    lines.push(
      `  error: 残り ${errors.length - ERROR_DUMP_MAX} 件は出力していない (全 ${errors.length} 件)`,
    );
  }

  for (const s of withId("warn")
    .filter((v) => interestingAxes.has(v.axis))
    .slice(0, 3)) {
    lines.push(`  sample: ${s.axis} — ${s.detail} (diag=${s.diagramId})`);
  }
  return lines;
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
      /*
       * 違反に図の id を添える。 **順序を逆にしない** (#1416)。
       *
       * `{ diagramId: r.diagramId, ...v }` と書くと、`v` が `diagramId` を持たない時に
       * `undefined` で上書きされ、添えたはずの id が消える。 落ちた時に「どの図か」 が
       * 読めなくなる (件数だけを見る assert なので、消えても検査は通ってしまう)。
       */
      const gatingViolations = report.reports.flatMap((r) =>
        r.violations.filter(isGatingViolation).map((v) => ({ ...v, diagramId: r.diagramId })),
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
        // Axis 47/48 = SweepReport.metaViolations 経由の meta 判定を stderr dump
        if (report.metaViolations.length > 0) {
          for (const m of report.metaViolations.slice(0, 5)) {
            process.stderr.write(`  meta: ${m.axis} — ${m.detail}\n`);
          }
        }
        for (const line of 違反の抜粋(report.reports, interestingAxes)) {
          process.stderr.write(`${line}\n`);
        }
      }
      expect(gatingViolations, `\n${detail}`).toEqual([]);
    });
  }
});

/**
 * 名指しした組は実物で裏を取る (#1730)。
 *
 * ## なぜ要るか
 *
 * 見逃す組は「いま実際に貫いている図」 に対して書いたはずのものだが、 **図が変われば
 * 当たらなくなる**。 当たらなくなっても表からは消えないため、 その図だけ検知が消えたことに
 * 誰も気付けない。
 *
 * 実際に `pattern-hook` がこの形だった。 表には「a → hook → c」 の割込みと書いてあるのに、
 * 図は「送り手 → 関数」 と「関数 → 受け側の実装」 の 2 本だけで、 貫く線を 1 本も持たない。
 * `edge-node-cross` の違反を 1 件も出さないので、 除外は何も除外していなかった。
 *
 * ## どう見るか
 *
 * 名指しした組ごとに、 **その軸の違反が実物で 1 件以上出る** ことを求める。 出ない組は
 * 落として、 表から消させる。 期待する件数が「1 件以上」 なので収容対照の向きになる
 * (`rules/quality.md § 期待する件数で対照の向きが変わる`)。
 *
 * 走査は sweep 本体と同じ `sources` を回す。 対象を別に持つと、 本体が見ている図と
 * 裏取りが見ている図がずれる。
 *
 * **表が空の時に通らないようにする**。 空なら「1 件も当たらない」 が真になり、 検査が
 * 空振りしたまま緑になる。
 */
describe("名指しした見逃しが実物で当たっている (#1730)", () => {
  /** 全 source を 1 度だけ通し、 `図の id + 軸` の組を数える */
  function 違反の組(): Map<string, number> {
    const 数 = new Map<string, number>();
    for (const { name, mod } of sources) {
      const report = visualValidateAll(collectDiagrams(mod, name), { profile: "catalog" });
      for (const r of report.reports) {
        for (const v of r.violations) {
          if (v.severity !== "error") continue;
          const key = `${r.diagramId}\u0000${v.axis}`;
          数.set(key, (数.get(key) ?? 0) + 1);
        }
      }
    }
    return 数;
  }

  it("見逃す組を 1 件以上持っている (空振り防止)", () => {
    expect(
      見逃す組の一覧.length,
      "見逃す組が 1 件も無い。 下の検査は空の表に対して必ず通るので、 表を消すなら本検査ごと消す",
    ).toBeGreaterThan(0);
  });

  it("error の違反は軸の一覧に依らず中身まで出す", () => {
    /*
     * **出るかどうかを機械で確かめる** (#1730)。
     *
     * 元は `interestingAxes` に載る軸だけを抜粋していたため、 載っていない軸は
     * 件数だけが出て中身が 1 行も出なかった。 手で直しても、 次に同じ形へ戻す変更を
     * 止められない。
     *
     * 見本は fixture ではなく **実物** から採る。 名指しした見逃しが実物で当たっている
     * ことは上の検査が固定しているので、 error は必ず 1 件以上ある。
     */
    const 実物 = sources
      .map(({ name, mod }) => visualValidateAll(collectDiagrams(mod, name), { profile: "catalog" }))
      .find((r) => r.reports.some((x) => x.violations.some((v) => v.severity === "error")));
    expect(実物, "error を持つ群が 1 つも無い (検査が空振りしている)").toBeDefined();

    const 行 = 違反の抜粋(実物!.reports, interestingAxes);
    const errorLines = 行.filter((l) => l.startsWith("  error: "));
    expect(errorLines.length, "error の違反があるのに中身の行が 1 本も出ていない").toBeGreaterThan(0);

    // 軸 / 中身 / 図の名前 の 3 つが揃っていること。 どれが欠けても辿れない
    const 見本 = 実物!.reports.flatMap((r) =>
      r.violations.filter((v) => v.severity === "error").map((v) => ({ v, id: r.diagramId })),
    )[0]!;
    expect(errorLines[0]).toContain(見本.v.axis);
    expect(errorLines[0]).toContain(見本.v.detail);
    expect(errorLines[0]).toContain(見本.id);

    // 一覧に載っていない軸でも出ること = 手書きの一覧に戻したら落ちる
    const 一覧外 = 実物!.reports.flatMap((r) =>
      r.violations.filter((v) => v.severity === "error" && !interestingAxes.has(v.axis)),
    );
    expect(
      一覧外.length,
      "一覧外の error が 1 件も無い。 この検査は一覧に戻す変更を止められていない",
    ).toBeGreaterThan(0);
  });

  it("名指しした組が実物でその軸の違反を出している", () => {
    const 数 = 違反の組();
    // 空振り防止 = 走査そのものが 1 件も違反を拾えていないなら、 下の判定は測れていない
    expect(数.size, "error の違反を 1 件も拾えていない (裏取りが空振りしている)").toBeGreaterThan(
      0,
    );
    const 当たらない = 見逃す組の一覧
      .filter((x) => (数.get(`${x.diagramId}\u0000${x.axis}`) ?? 0) === 0)
      .map((x) => `${x.diagramId} / ${x.axis} (理由: ${x.理由})`);
    expect(
      当たらない,
      "名指ししたのに実物が違反を出さない組。 図が変わって見逃しが不要になっているので表から消す",
    ).toEqual([]);
  });
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
 * ## 突き合わせの道具は共有する
 *
 * 一覧を集める形と差分の取り方は `apps/playground-spa/src/lib/catalog-scope.ts` が持つ
 * (#1409)。 4 つの検査が同じ道具を呼び、道具そのものの性質 (重複数を落とさない /
 * `parts` を漏らさない) は catalog-scope 側の検査が固定する。
 *
 * ## 件数を書かない
 *
 * 「全 N 件」 と書くと module が増えた時にずれる
 * (`rules/quality.md § 導出可能記述は人手で書かない`)。 実際どれだけ漏れているかは
 * 下の検査が名指しで並べる。
 */
describe("一覧に載る図が 1 つ残らず sweep の対象に入っている (#1405)", () => {
  /** 一覧を読む道具は 4 つの検査で共有する (#1409)。 定義と検査は catalog-scope が持つ */
  const 一覧の図 = async (): Promise<string[]> => (await import("@/lib/catalog-scope")).一覧の図();
  const 差分 = async (l: readonly string[], r: readonly string[]): Promise<string[]> =>
    (await import("@/lib/catalog-scope")).差分(l, r);

  /** sweep が見る図の id */
  function 対象の図(): string[] {
    const out: string[] = [];
    for (const { name, mod } of sources) for (const d of collectDiagrams(mod, name)) out.push(d.id);
    return out;
  }

  it("一覧の図と sweep の対象を 1 件以上集められている", async () => {
    // 空振り防止。 どちらかが空だと下の 2 件が両方とも「差が無い」 で通る
    const [一覧, 対象] = [await 一覧の図(), 対象の図()];
    expect(一覧.length, "一覧から図を 1 件も集められていない").toBeGreaterThan(0);
    expect(対象.length, "sweep の対象から図を 1 件も集められていない").toBeGreaterThan(0);
  });

  it("一覧にあって sweep の対象に無い図が無い", async () => {
    const 漏れ = await 差分(await 一覧の図(), 対象の図());
    expect(漏れ, "一覧に出るのに重なりの検査を通っていない図").toEqual([]);
  });

  it("sweep の対象だが一覧に無い図が無い", async () => {
    const 余り = await 差分(対象の図(), await 一覧の図());
    expect(余り, "重なりの検査を通っているが一覧に出ない図").toEqual([]);
  });
});
