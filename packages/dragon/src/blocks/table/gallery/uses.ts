/** 見本帳の部品の頁で、表の語を使う見本を探す関数 (#3618)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "kind:er": (v) => v.diagram.kind === "er",
  /** 表どうしの関係の図は表を必ず宣言するので、表を持つかで決める */
  "head:table": (v) => (v.diagram.blocks.table?.length ?? 0) > 0,
  "head:field": (v) => (v.diagram.blocks.table ?? []).some((t) => t.fields.length > 0),
  "attr:table.color": (v) => (v.diagram.blocks.table ?? []).some((t) => t.color !== undefined),
  "attr:field.key": (v) => (v.diagram.blocks.table ?? []).some((t) => t.fields.some((f) => f.key === true)),
  "attr:field.ref": (v) => (v.diagram.blocks.table ?? []).some((t) => t.fields.some((f) => f.ref !== undefined)),
} satisfies BlockUses;
