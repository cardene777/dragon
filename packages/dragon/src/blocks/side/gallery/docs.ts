/**
 * 使い方の頁の、部品を横に並べる行の段落 (#3429)。
 * 使い方の頁の試す図の節は、部品をまたいで説明する段落だけを持ち、side の行は試す図の節の段落が書く
 */
import type { BlockDocs, None } from "../../gallery";

export const docs: BlockDocs | None = { none: "使い方の頁の試す図の節は部品をまたぐ段落だけで、side の行はその段落が書く" };
