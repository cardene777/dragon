/** 使い方の頁の「枝分かれの図」の節の、commit を積む行と、当て直しと merge commit の語の段落 (#3347) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "git",
  ja: ["段の中では `commit <名札> on <枝>` で枝の先に commit を積み、`[hash: <hash>, note: <一言>]` で丸の外に hash と一言を添える。`copy <元>` を付けると元の commit を写した当て直しの commit に、`merge <枝>` を付けるとその枝の先端も親に持つ merge commit になる。"],
  en: ["Inside a step, `commit <id> on <branch>` adds a commit at the tip of the branch, and `[hash: <hash>, note: <note>]` puts a hash and a short note beside the circle. Add `copy <source>` for a replayed copy of another commit, or `merge <branch>` for a merge commit whose parents include the tip of that branch."],
};
