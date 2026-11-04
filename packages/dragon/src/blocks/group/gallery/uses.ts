/** 見本帳の部品の頁で、区画の語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "kind:architecture": (v) => v.diagram.kind === "architecture",
  "head:group": (v) => (v.diagram.blocks.group ?? []).length > 0,
  /** 区画の行を閉じる `end` は区画があれば必ず書くので、区画があるかで決める */
  "head:end": (v) => (v.diagram.blocks.group ?? []).length > 0,
  "attr:group.note": (v) => (v.diagram.blocks.group ?? []).some((r) => r.note !== undefined),
  "attr:group.color": (v) => (v.diagram.blocks.group ?? []).some((r) => r.color !== undefined),
  "attr:group.icon": (v) => (v.diagram.blocks.group ?? []).some((r) => r.icon !== undefined),
} satisfies BlockUses;
