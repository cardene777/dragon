import { load, YAMLException } from "js-yaml";
import { jsonToDiagram, describeOversizeSource } from "@cardenelabs/dragon";
import type { CompileNotice } from "@cardenelabs/dragon";
import type { CdlDiagram } from "@cardenelabs/cdl";
import type { YamlObjectResult, YamlDiagramResult } from "@/lib/yaml-error";

// 型と誤りの整形は `yaml-error.ts` に分けてある。 本 file は YAML 欄を開いた時だけ
// 読み込まれるため、 画面が誤りを出すのにここの到着を待つと帯が 1 拍遅れる (#1007)。
export type { YamlAdapterError, YamlObjectResult, YamlDiagramResult } from "@/lib/yaml-error";
export { formatYamlError } from "@/lib/yaml-error";

/**
 * CAR-1678 = YAML tab の parse pipeline bridge。
 * multi-line YAML source (`js-yaml`) を安全に load して plain object にしてから
 * dragon の `jsonToDiagram()` に流し込む。 error は parse (YAMLException) と
 * validation (jsonToDiagram の throw) の 2 段で発生し、 両方を `{ line, message }` の
 * 統一 form に mapping して呼出側 (CdlEditor preview 領域) が inline 表示できる shape で返す。
 *
 * 非目標 = anchor / merge key / multi-document YAML の対応、 CDL 独自 syntax の再現、
 * YAML → text DSL の逆変換。 いずれも本 PR 対象外 (spec § out)。
 */

/**
 * 複数行の YAML を `js-yaml` の `load()` で素の値に変換する。
 *
 * 空文字と空白だけの本文は誤り扱いにする (中身の無い図は描けない)。
 *
 * `---` で区切った複数の文書は **非対応**。 `load()` 自身が
 * `expected a single document in the stream` を投げるので、 parse の誤りとして表示される。
 * 別名参照 (anchor / merge key) は `js-yaml` の既定の挙動に任せる。
 */
export function yamlToObject(src: string): YamlObjectResult {
  // 読み取る前に大きさを見る (#1005)。 要素数の上限は読み取った後にしか分からないため、
  // 巨大な本文そのものによる待ちと記憶の消費はここでしか防げない
  const oversize = describeOversizeSource(src);
  if (oversize) {
    return {
      ok: false,
      error: { line: null, message: oversize, kind: "validation", reason: null },
    };
  }
  const trimmed = src.trim();
  if (trimmed.length === 0) {
    return {
      ok: false,
      error: {
        line: null,
        message: "YAML source is empty",
        kind: "validation",
        reason: null,
      },
    };
  }
  try {
    const parsed = load(src);
    if (parsed === undefined || parsed === null) {
      return {
        ok: false,
        error: {
          line: null,
          message: "YAML parsed to null / undefined, expected an object",
          kind: "validation",
          reason: null,
        },
      };
    }
    return { ok: true, value: parsed };
  } catch (e) {
    if (e instanceof YAMLException) {
      // js-yaml の mark は 0-origin、 preview 表示は 1-origin に揃える
      const rawLine = e.mark?.line;
      const line = typeof rawLine === "number" ? rawLine + 1 : null;
      // reason は「unexpected end of the stream within a single quoted scalar」 等の短文、
      // message は multi-line で mark position 含む長文になるため reason 優先で 1 行に丸める
      const reason = typeof e.reason === "string" && e.reason.length > 0 ? e.reason : e.message;
      return {
        ok: false,
        error: {
          line,
          message: reason,
          kind: "parse",
          reason,
        },
      };
    }
    return {
      ok: false,
      error: {
        line: null,
        message: e instanceof Error ? e.message : String(e),
        kind: "parse",
        reason: null,
      },
    };
  }
}

/**
 * YAML source を CdlDiagram に変換する full pipeline。 内部で `yamlToObject()` → `jsonToDiagram()` を
 * 順に呼び、 どちらの stage で error が起きても `{ ok: false, error }` で返す。
 * caller は成功時 diagram を CdlDiagramView に流し、 失敗時 error.line / message を preview 上部の
 * error banner に描画する (前回 render は消さない、 spec AC 4 の要件)。
 */
export function yamlToDiagram(
  src: string,
  // **`onNotice` も通す**。 読めない値や捨てた矢印の知らせは、 記法経路だけでなく YAML 欄でも
  // 利用者に届く必要がある (review 指摘)
  opts?: { partsCatalog?: Record<string, CdlDiagram>; onNotice?: (n: CompileNotice) => void },
): YamlDiagramResult {
  const parseResult = yamlToObject(src);
  if (!parseResult.ok) return parseResult;
  try {
    // jsonToDiagram は unknown を受けて中で形を検査する。 合わない形は throw される
    const diagram = jsonToDiagram(parseResult.value, opts);
    return { ok: true, diagram };
  } catch (e) {
    return {
      ok: false,
      error: {
        line: null,
        message: e instanceof Error ? e.message : String(e),
        kind: "validation",
        reason: null,
      },
    };
  }
}
