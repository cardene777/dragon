import { diagram, classDiagram } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import type { DslDocument } from "../types";

import { 箱の題 } from "./node-title";

import { slugify } from "./slug";

/**
 * クラス図の組み立て。
 *
 * 各クラスを 1 つの箱 (`storage`) にする。 描画側は題 (クラス名) と区切り線と行
 * (項目 / 手続き) を UML のクラス箱として描く。
 *
 * **クラスごとに縦列を 1 本作り、横に並べる** (#1263)。 組立て API 側がそう並べており、
 * 1 本にまとめると同じ内容でも横並びが縦並びになる (実測 = 見本は 3 縦列 450 幅)。
 * 縦列に見出しは付けない = クラスの名前は箱が既に描いており、縦列は並べるための入れ物
 * (`er` / `state` と同じ扱い、#1241)。
 *
 * 箱の種類は `storage` に強制する。 行と小見出しは `applyV05Extensions` が後から載せる。
 *
 * 矢印は継承や保有を表す (`extends` / `aggregates` 等を書き手が説明に書く)。
 */
export function compileClass(doc: DslDocument): CdlDiagram {
  /*
   * **組み立て器 (`classDiagram`) に渡す** (#1466)。
   *
   * 以前は箱と矢印を直に組んでいたため、行頭の印・端の塗り・印が付く側・段の配置が
   * 1 つも出なかった = 画面の図と記法の図が別物になっていた。 組み立て器へ渡せば、
   * 意匠の決まり (`CLASS_RELATION_LOOK`) を 1 箇所から引ける。
   */
  const b = classDiagram({ id: slugify(doc.title), topic: doc.title });
  // 登場人物が 0 人なら枠も作らない。 先に作ると中身の無い枠が 1 つ残る (#1096)
  if (doc.actors.length === 0)
    return diagram(slugify(doc.title), { topic: doc.title, type: "class" }).build();

  /*
   * 縦列は `lane:` の順、段は `stack:` で決まる (#1466)。
   *
   * 書かない図は宣言した順に横 1 列 = 従来どおり。 1 つでも書けば格子に置く =
   * **箱の 1 つの辺には関係を 1 本まで** を守るには段が要る。
   */
  const 列番号 = new Map<string, number>();
  for (const a of doc.actors) {
    if (a.lane === undefined) continue;
    if (!列番号.has(a.lane)) 列番号.set(a.lane, 列番号.size);
  }

  for (const a of doc.actors) {
    /*
     * 行を持ち物と振る舞いに割る (#1466)。 **1 行ずつ括弧の有無で見る**。
     *
     * 区切りの行 (`───`) の位置では割らない = 振る舞いしか持たない箱は区切りを書けず、
     * 全部が持ち物に落ちる (実測 = `Auditable` の `audit()` が四角の印で出た)。
     * 区切りの行そのものは、組み立て器が群の間を空の行で作るので捨てる。
     */
    const rows = (a.rows ?? []).filter((r) => !/^[─-]+$/.test(r.trim()));
    const 振る舞い = (r: string): boolean => r.includes("(");
    const attributes = rows.filter((r) => !振る舞い(r));
    const methods = rows.filter(振る舞い);
    b.class({
      id: slugify(a.name),
      title: 箱の題(a),
      ...(attributes.length > 0 ? { attributes: [...attributes] } : {}),
      ...(methods.length > 0 ? { methods: [...methods] } : {}),
      ...(a.eyebrow ? { stereotype: a.eyebrow } : {}),
      ...(a.lane !== undefined ? { col: 列番号.get(a.lane) ?? 0 } : {}),
      ...(a.stack !== undefined ? { row: a.stack } : {}),
    });
  }

  for (const s2 of doc.flow) {
    b.relation({
      from: slugify(s2.from),
      to: slugify(s2.to),
      // 種類を書かない矢印は「使う」 扱い = 端が開いた矢になり、線と印の組が最も素直
      type: s2.relation ?? "uses",
      ...(s2.label ? { label: s2.label } : {}),
      ...(s2.sub ? { cardinality: s2.sub } : {}),
      // 出どころ側の多重度 (#1771)。 engine が出どころの端に添える (cdl#825)
      ...(s2.tailSub ? { tailCardinality: s2.tailSub } : {}),
      ...(s2.head ? { head: s2.head } : {}),
      ...(s2.headFill ? { headFill: s2.headFill } : {}),
      ...(s2.tailHead ? { tailHead: s2.tailHead } : {}),
    });
  }

  const built = b.build();
  宣言した縦列の名前へ付け替える(built, 列番号, doc.lanes);
  /*
   * 記法が段を書いた図では、組み立て器が作る 1 つの段を捨てる (#1466)。
   *
   * 段の注入 (`injectPhasesFallback`) は「段が 1 つも無い」 図にだけ効く。 組み立て器へ
   * 渡すようにしたことで自動の段が 1 つ付き、書いた段が届かなくなった (実測 = 6 段書いた
   * 図が 1 段で出た)。
   */
  const 書いた段がある = (doc.animate?.phases.length ?? 0) > 0;
  return 書いた段がある ? { ...built, phases: [] } : built;
}

/**
 * 組み立て器が作った列の名前を、宣言した縦列の名前へ付け替える (#2350)。
 *
 * クラス図は `lane:` を列の番号として読み、自分で `col-0` / `col-1` の列を作る。
 * 書いた名前 (`c0`) はどこにも残らないため、`lanes:` で宣言すると **その名前の列が
 * 別に作られ、空のまま図に残る** (実測 = 宣言ありで列が 2 本から 4 本に増え、
 * 書いた幅 320 は箱の入っていない方に付き、箱の入る列は既定の 450 のままだった)。
 *
 * 名前を付け替えると、後から `lanes:` を重ねる経路が同じ列を見つけるので、
 * 書いた幅と横位置がそのまま効き、「どの箱も入らない縦列です」 の知らせも消える。
 *
 * **付け替えるのは宣言した名前だけ**。 `lanes:` に書いていない名前は重ねる相手が
 * 居ないので、付け替えても図は 1 つも変わらない = 宣言しない図の列の名前を
 * 変えない側に倒す。
 *
 * **2 段で付け替える**。 宣言した名前が組み立て器の名前と重なることがあるため
 * (`lane: col-1` を 1 つ目の列に書いた形)、いきなり書き換えると 2 つの列が同じ名前になる。
 * 一度ぶつからない名前へ逃がしてから入れ直す。
 */
function 宣言した縦列の名前へ付け替える(
  diagram: CdlDiagram,
  列番号: ReadonlyMap<string, number>,
  宣言: DslDocument["lanes"],
): void {
  if (列番号.size === 0 || 宣言 === undefined) return;
  const 仮の名 = (i: number): string => `__class-col-${i}__`;
  const 対応 = [...列番号]
    .filter(([書いた名]) => Object.hasOwn(宣言, 書いた名))
    .map(([書いた名, i]) => ({ 組み立て器の名: `col-${i}`, 書いた名, 仮: 仮の名(i) }));
  for (const { 組み立て器の名, 仮 } of 対応) {
    for (const lane of diagram.lanes) if (lane.id === 組み立て器の名) lane.id = 仮;
    for (const node of diagram.nodes) if (node.lane === 組み立て器の名) node.lane = 仮;
  }
  for (const { 仮, 書いた名 } of 対応) {
    for (const lane of diagram.lanes) if (lane.id === 仮) lane.id = 書いた名;
    for (const node of diagram.nodes) if (node.lane === 仮) node.lane = 書いた名;
  }
}
