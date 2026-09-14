import type { CdlDiagram } from "@cardenelabs/cdl";

/**
 * 部品の図か (#1973)。
 *
 * 部品の頁には、部品そのものの図と、部品を箱に使う見本が並ぶ。 組み立てに渡す一覧や、
 * 編集画面の部品の欄に並べるのは部品そのものだけにする。 部品の図の id は全て `parts-` で
 * 始まる (`parts.cdl.ts` の書き方)。
 */
export function 部品の図か(id: string): boolean {
  return id.startsWith("parts-");
}

/**
 * 組み立てに渡す部品の一覧を作る (#1973)。
 *
 * 記法では `kind: arc-gauge` と頭を付けずに書くため、`parts-arc-gauge` と `arc-gauge` の両方で
 * 引けるようにする。 **編集画面とカタログの見本が同じ作り方を通る** = 別々に作ると、片方だけ
 * 引き方が変わって同じ記法から違う図ができる。
 *
 * 部品の file の書き出しをそのまま受ける (`Object.values(部品)`)。 図でない書き出し (説明の字) と
 * 部品でない図は飛ばす。
 */
export function 部品の一覧を作る(値たち: Iterable<unknown>): Record<string, CdlDiagram> {
  const 一覧: Record<string, CdlDiagram> = {};
  for (const 値 of 値たち) {
    if (!図か(値) || !部品の図か(値.id)) continue;
    一覧[値.id] = 値;
    一覧[値.id.slice("parts-".length)] = 値;
  }
  return 一覧;
}

function 図か(値: unknown): 値 is CdlDiagram {
  if (typeof 値 !== "object" || 値 === null) return false;
  const 図 = 値 as Partial<CdlDiagram>;
  return typeof 図.id === "string" && Array.isArray(図.nodes);
}
