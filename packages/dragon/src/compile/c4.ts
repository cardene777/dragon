import { diagram } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import type { DslDocument } from "../types";
import { 描ける種別 } from "./kinds";
import { 段を読み取る } from "./rows";
import { slugify } from "./slug";
/**
 * C4 preset (C4 model 階層 system context 専用 layout)
 *
 * 設計 ... actor.subtitle の先頭に "L1" / "L2" / "L3" を置き、 階層 lane を生成。
 * - L1 = 全体の見取り図 (C4 model の System Context)
 * - L2 = 動かす単位 (同 Container = 単体で動かす application や保管庫)
 * - L3 = 部品 (同 Component)
 *
 * 実装 ... **中身のある段だけ** lane を作り、 使う段を左から順に詰めて横並び (contain: true で
 * 囲む) 配置する。 3 lane を常に作ると中身のない枠が画面に残り、 描かれ損ねたように見える (#1078)。
 * 同 lane 内の actor は内部 stack で縦並びになる (横並びは layout 制約上不可、
 * 段の区別が視覚的に最重要)。 subtitle marker 未指定なら L1 fallback。
 *
 * flow ... actor 間の関係を edge で表現。
 */
export function compileC4(doc: DslDocument): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title, type: "infrastructure" });
  const LANE_W = 400;
  const LANE_GAP = 80;
  // 段の名前は **枠に描く字** で、記法に打ち込む識別子ではない (#1886)。 打ち込む字は目印
  // (`L1` / `L2` / `L3`) の側で、そちらは綴りを変えない
  const 段の名前: Record<number, string> = { 1: "全体の見取り図", 2: "動かす単位", 3: "部品" };

  // 段は **先頭一致** で読み、 読んだ目印は説明から落とす (`段を読み取る` の説明を参照)
  const 割当 = doc.actors.map((a, idx) => {
    const { 段, 説明 } = 段を読み取る(a.subtitle);
    return { 段, 説明, id: slugify(a.name) || `n${idx}`, actor: a };
  });

  // **中身のある段だけ枠を作る**。 3 段を必ず作ると、 書いていない段が空の点線枠として残り、
  // 見た人には「何かが描かれ損ねた」 ようにしか見えない
  const 使う段 = [1, 2, 3].filter((lv) => 割当.some((x) => x.段 === lv));
  使う段.forEach((lv, i) => {
    b.lane(`c4-l${lv}`, {
      // 空の段を飛ばした分だけ左に詰める。 飛ばした位置に隙間を残すと、 やはり
      // 「何かが抜けている」 ように見える
      x: i * (LANE_W + LANE_GAP),
      width: LANE_W,
      label: 段の名前[lv]!,
      contain: true,
    });
  });

  const stackPerLane: Record<string, number> = { "c4-l1": 0, "c4-l2": 0, "c4-l3": 0 };
  for (const x of 割当) {
    const lid = `c4-l${x.段}`;
    const stack = stackPerLane[lid]!;
    stackPerLane[lid] = stack + 1;
    b.node(x.id, {
      lane: lid,
      stack,
      kind: 描ける種別(x.actor.kind),
      title: x.actor.name,
    });
  }

  for (const s of doc.flow) {
    const fromId = slugify(s.from);
    const toId = slugify(s.to);
    b.edge(fromId, toId, {
      label: s.label,
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.side ? { side: s.side } : {}),

      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
    });
  }

  return b.build();
}
