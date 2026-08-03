import { compile, visualValidateLaid, type CdlDiagram, type LaidDiagram, type Violation } from "@cardenelabs/cdl";
import { visibleWarnings } from "@/lib/editor-warnings";

/**
 * 図を組み立てて、 位置関係を検査する (#1006)。
 *
 * **配置の計算は 1 回だけ走る**。 組み立て (`compile`) が中で配置を出すので、 その結果を
 * 持ち回って検査と図枠の原点に使う。 持ち回らずに `visualValidate` や `layout` を呼ぶと、
 * 同じ図の配置を 2 度 3 度と計算することになる (実測 = 辺 1,000 本で 1 回の描画に 5.42 秒、
 * うち大半が重複した配置計算)。
 *
 * 組み立てに失敗したら投げる。 図を載せる前に呼出側が捕まえるため、 ここでは握らない。
 * 検査だけが失敗した場合は警告なしで図を返す = 検査の不調で図が出なくなる方が困る。
 */
export interface BuildResult {
  /** 配置まで済ませた図。 描画と図枠の原点で使い回す */
  laid: LaidDiagram;
  /** 画面に出す位置関係の警告 (絞り込み済) */
  warnings: Violation[];
}

/**
 * 差し替え可能な依存。
 *
 * 既定では cdl の関数をそのまま使う。 test が「配置を何回計算したか」 を数えるために
 * 差し替える口として置いている (数を数える以外の用途で差し替えない)。
 */
export interface BuildDeps {
  compile: (d: CdlDiagram) => LaidDiagram;
  validateLaid: typeof visualValidateLaid;
}

const DEFAULT_DEPS: BuildDeps = { compile, validateLaid: visualValidateLaid };

export function buildAndValidate(d: CdlDiagram, deps: BuildDeps = DEFAULT_DEPS): BuildResult {
  const laid = deps.compile(d);
  let warnings: Violation[] = [];
  try {
    const report = deps.validateLaid(laid, d);
    warnings = visibleWarnings(report.violations, d);
  } catch {
    warnings = [];
  }
  return { laid, warnings };
}
