import type { CdlDiagram } from "@cardenelabs/cdl";
import type { DslActor, DslDocument, PresetType } from "../types";
import { 図種の作り } from "./kinds";
import type { CompileNotice } from "./notice";
import { ID_MAX, slugify } from "./slug";
import { truncateForMessage } from "./subtitle";
/**
 * 名前の重なりを解く (#2036 で `compile.ts` から移した)。
 *
 * 違う名前が同じ id に潰れると、箱が 1 つ消えたり、矢印が別の箱を指したりする。
 * 潰れる前に名前を作り替え、図を組み立てた後で元へ戻す。
 *
 * 外へ出す口は 3 つ。 作り替える `disambiguateActorIds`、作り替えた相手を控える
 * `collectRenamedTargets`、元へ戻す `restoreActorNames`。 いずれも入口が呼ぶ。
 */

/**
 * 名前から作る id の重なりを解く (#1220)。
 *
 * 箱と枠の id は登場人物の名前から作る (`slugify`)。 **違う名前が同じ id に潰れる** と、
 * どちらも正しく書いているのに図が組み立たない (実測 = `foo-bar` と `Foo Bar` を書くと
 * 9 図種が `duplicate-id` で落ちる)。 知らせも出ない = どちらの名前も `actors` に在るため。
 *
 * ## なぜ名前を作り替えるのか
 *
 * id を作る所は 90 箇所を超え、 さらに **cdl 側の組み立てが名前から id を作る経路** がある
 * (`swimlane()` / `er()` は渡した名札から lane id を作る)。 dragon 側だけを直しても届かない。
 *
 * そこで **渡す名前を変え、 最後に表示だけ戻す**。 作り替えた名前は組み立ての間だけ使い、
 * 出口で `nodes[].title` と `lanes[].label` を元に戻す (`restoreActorNames`)。
 *
 * ## 尾は名前から作る
 *
 * 書き順で決めると、 登場人物を並べ替えただけで id が入れ替わる。 元の名前だけから決まる
 * 短い値を尾に付ければ、 並べ替えても同じ id になる。
 *
 * ## まったく同じ名前は畳む
 *
 * 名前が 1 文字も違わない登場人物は区別できない。 2 つの箱に同じ題が付くだけなので、
 * 先に書いた方を残して知らせる。
 */
function 名前の尾(name: string): string {
  // FNV-1a。 短くて名前だけから決まればよく、 衝突しても下の検査が拾う
  let h = 0x811c9dc5;
  for (const c of name) {
    h ^= c.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0").slice(0, 6);
}

/**
 * cdl 側が名札から id を作る時の規則 (`presets.ts` の `slugify`)。
 *
 * **dragon の規則と違う**。 dragon は `-` と `_` を残し `NFKC` で揃え 64 字で切るが、 cdl は
 * どちらも `-` に潰し、 長さも切らない。 このため `a_b` と `a-b` は **dragon では別 id、 cdl では
 * 同じ id** になる (実測 = 動きを書かない `sequence` / `solidity` が `duplicate-id` で落ちる)。
 *
 * ここに写している = cdl は `slugify` を公開していない。 **ずれると衝突を見落とす** ので、
 * 下の検査が既知の組で対応を固定する。
 */
function cdl側のslug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9぀-ゟ゠-ヿ一-龯]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * cdl 側が「形が空になった名前」 に付ける id の頭 (#1220 Round 2 / 3)。
 *
 * cdl は形が空になった時に並びの位置へ逃げる。 逃げ先を鍵に入れないと、 逃げ先と同じ名前の
 * 登場人物が居る図で重なる (実測 = `sequence` の `😀` と `actor-0`)。
 *
 * **図種ごとに違う** (Round 3 の指摘)。 両方を入れると、 その図種では使われない逃げ先まで
 * 衝突とみなして **重なっていない図の id を変える**。 実測した対応は次のとおり。
 *
 * | 図種 | `😀` だけを書いた時に付く id |
 * |---|---|
 * | `sequence` / `solidity` | 枠 `actor-0` (cdl の `sequence()`) |
 * | `swimlane` | 枠 `lane-0` (cdl の `swimlane()`) |
 * | 残る 6 図種 | 箱 `n` (dragon 側の逃げ先。 cdl の逃げ道を通らない) |
 *
 * 空配列は「cdl の逃げ道を通らない」 を表す。 1 箱で描く図種はここに来ない (作り替え自体を
 * しない) が、 図種を足した時に決め忘れないよう全種を並べる。
 *
 * **この表が効くのは動きを書いていない図だけ** (Round 4 の指摘)。 動きを書くと組み立てが別経路に
 * 切り替わり、 id は dragon 側の規則で作られる = cdl の逃げ道を通らない。 使う側で条件を見る。
 */
const 空の形の逃げ先: Record<PresetType, string[]> = {
  sequence: ["actor-"],
  solidity: ["actor-"],
  swimlane: ["lane-"],
  // 分かれ道の図も縦列を持ち、 描画側は縦列の名前から箱を作る (`swimlane` と同じ逃げ先)
  flowchart: ["lane-"],
  flow: [],
  er: [],
  state: [],
  topology: [],
  class: [],
  c4: [],
  // 図全体を 1 箱で描く群 (作り替えないのでここは使わない)
  gantt: [],
  pie: [],
  bar: [],
  line: [],
  gauge: [],
  radial: [],
  stat: [],
  waffle: [],
  stacked: [],
  slope: [],
  funnel: [],
  tree: [],
  journey: [],
  quadrant: [],
  mind: [],
};

/**
 * その名前が下流で id になりうる形。 どれか 1 つでも重なれば衝突する。
 *
 * 位置と逃げ先が分からない時 (作り替えた候補を確かめる時) は逃げ先を数えない。 作り替えた
 * 名前は尾が付いて形が空にならないので、 そもそも逃げ道を通らない。
 */
function idになる形(name: string, 位置?: number, 逃げ先の頭: string[] = []): string[] {
  const cdl = cdl側のslug(name);
  const out = [slugify(name), cdl];
  if (cdl === "" && 位置 !== undefined) {
    for (const 頭 of 逃げ先の頭) out.push(`${頭}${位置}`);
  }
  return out;
}

export function disambiguateActorIds(
  doc: DslDocument,
  onNotice?: (notice: CompileNotice) => void,
): { doc: DslDocument; 元の名前: Map<string, string> } {
  const 元の名前 = new Map<string, string>();
  if (図種の作り[doc.type] !== "登場人物ごとに箱") return { doc, 元の名前 };

  // 1. まったく同じ名前を畳む
  const 見た = new Set<string>();
  const 残す: DslActor[] = [];
  for (const a of doc.actors) {
    if (見た.has(a.name)) {
      onNotice?.({
        kind: "chart-value-unreadable",
        actor: a.name,
        line: a.pos?.line ?? 0,
        message: `"${truncateForMessage(a.name)}" を 2 度書いています (先に書いた方だけ描きます)`,
        hint: "違う名前にするか、 1 つにまとめる",
      });
      continue;
    }
    見た.add(a.name);
    残す.push(a);
  }

  // 2. どの名前が重なるかを見る。 **両方の規則で見る** = 片方だけだと cdl 側の経路で落ちる
  const 形ごとの名前 = new Map<string, Set<string>>();
  const 位置 = new Map<string, number>();
  残す.forEach((a, i) => 位置.set(a.name, i));
  // **動きを書いた図では cdl の逃げ道を通らない** (Round 4 の指摘)。 動きがあると組み立てが
  // 別経路 (`compileGenericWithAnimate` / `compileSequenceWithAnimate`) に切り替わり、 id は
  // dragon 側の規則で作られる (実測 = `😀` は 枠 `n` / `lane-n` になり、 位置を使わない)。
  //
  // 逃げ先を鍵に入れたままにすると、 その経路で **重なっていない図の id を変える**。
  // dragon 側の規則で作る分は、 1 つ目の鍵 (`slugify`) が既に見ている。
  const 動きを書いた = (doc.animate?.phases.length ?? 0) > 0;
  const 逃げ先の頭 = 動きを書いた ? [] : 空の形の逃げ先[doc.type];
  for (const a of 残す) {
    for (const 形 of idになる形(a.name, 位置.get(a.name), 逃げ先の頭)) {
      const 群 = 形ごとの名前.get(形) ?? new Set<string>();
      群.add(a.name);
      形ごとの名前.set(形, 群);
    }
  }
  const 重なる = (name: string): boolean =>
    idになる形(name, 位置.get(name), 逃げ先の頭).some(
      (形) => (形ごとの名前.get(形)?.size ?? 0) > 1,
    );

  // **見本 (`parts`) を重ねた登場人物は作り替えない**。 見本の中身は `別名__元の id` の形で
  // 名前空間を持ち、 別名は名前から作るため、 作り替えると見本の id が総入れ替えになる。
  //
  // ただし **重なりの判定には数える** (Round 1 の指摘)。 数えないと、 素の登場人物と見本が
  // 同じ id の仮置きを共有し、 見本を片付ける時に素の登場人物の箱まで消える。
  const 作り替える = 残す.filter((a) => a.partId === undefined && 重なる(a.name));

  // 3. 名前から決まる尾を付ける。 **できあがる id が一意になるまで見る**
  //
  // 尾は元の名前だけから決まる = 並べ替えても同じ id になる。 それでも重なる時 (尾そのものが
  // 重なる形) は、 名前を並べ替えた順で番号を足す = ここも書き順に依らない
  const 使う形 = new Set<string>();
  for (const a of 残す) {
    if (作り替える.some((b) => b.name === a.name)) continue;
    for (const 形 of idになる形(a.name)) 使う形.add(形);
  }
  const 新しい名前 = new Map<string, string>();
  // 名前で並べてから配る = 書いた順に依らない
  for (const a of [...作り替える].sort((x, y) =>
    x.name < y.name ? -1 : x.name > y.name ? 1 : 0,
  )) {
    const 尾 = 名前の尾(a.name);
    // **id の長さの上限のぶん、 元の名前を先に切る** (Round 1 の指摘)。 切らないと尾が
    // 64 字で落ちて、 同じ頭を持つ長い名前どうしが元のまま重なる
    const 余地 = ID_MAX - (尾.length + 1);
    const 基底 = a.name.slice(0, 余地);
    let 候補 = `${基底} ${尾}`;
    let n = 0;
    while (idになる形(候補).some((形) => 使う形.has(形))) {
      n += 1;
      候補 = `${基底.slice(0, 余地 - String(n).length)} ${尾}${n}`;
    }
    for (const 形 of idになる形(候補)) 使う形.add(形);
    新しい名前.set(a.name, 候補);
    元の名前.set(候補, a.name);
  }

  if (新しい名前.size === 0 && 残す.length === doc.actors.length) return { doc, 元の名前 };

  const 直す = (名: string): string => 新しい名前.get(名) ?? 名;
  const 次: DslDocument = {
    ...doc,
    actors: 残す.map((a) => (新しい名前.has(a.name) ? { ...a, name: 直す(a.name) } : a)),
    flow: doc.flow.map((s) => {
      const from = 直す(s.from);
      const to = 直す(s.to);
      return from === s.from && to === s.to ? s : { ...s, from, to };
    }),
    events: doc.events?.map((event) => {
      const target = event.target;
      if (target.kind === "node") {
        const name = 直す(target.name);
        return name === target.name ? event : { ...event, target: { ...target, name } };
      }
      if (target.kind === "edge") {
        const from = 直す(target.from);
        const to = 直す(target.to);
        return from === target.from && to === target.to
          ? event
          : { ...event, target: { ...target, from, to } };
      }
      // sequence 系の縦列は登場人物から作るため、同じ名前の読み替えが必要。
      if (target.kind === "lane" && (doc.type === "sequence" || doc.type === "solidity")) {
        const name = 直す(target.name);
        return name === target.name ? event : { ...event, target: { ...target, name } };
      }
      return event;
    }),
  };
  // 光らせる指定と位置の基準も名前で書くので、 同じ表で直す
  if (次.animate) {
    次.animate = {
      ...次.animate,
      phases: 次.animate.phases.map((ph) =>
        ph.highlight ? { ...ph, highlight: ph.highlight.map((h) => 直す(h)) } : ph,
      ),
    };
  }
  次.actors = 次.actors.map((a) =>
    a.posRel ? { ...a, posRel: { ...a.posRel, anchor: 直す(a.posRel.anchor) } } : a,
  );
  return { doc: 次, 元の名前 };
}

/**
 * 作り替えた名前を持つ箱と枠を控える (#1220)。
 *
 * **組み立て直後に控える** (Round 1 の指摘)。 出口で題の文字だけを見て戻すと、 後から足された
 * 見本の中の箱がたまたま同じ題を持っていた時に、 その表示まで書き換えてしまう。
 */
export function collectRenamedTargets(
  diagram: CdlDiagram,
  元の名前: Map<string, string>,
): { 箱: Set<string>; 枠: Set<string> } {
  const 箱 = new Set<string>();
  const 枠 = new Set<string>();
  if (元の名前.size === 0) return { 箱, 枠 };
  for (const n of diagram.nodes) if (元の名前.has(n.title)) 箱.add(n.id);
  for (const l of diagram.lanes) if (l.label !== undefined && 元の名前.has(l.label)) 枠.add(l.id);
  return { 箱, 枠 };
}

/**
 * 作り替えた名前を、 図の表示だけ元に戻す (#1220)。
 *
 * 戻すのは題と名札だけ。 id は作り替えたまま = 分けるために作り替えたので、 戻すと元の
 * 重なりに帰る。
 */
export function restoreActorNames(
  diagram: CdlDiagram,
  元の名前: Map<string, string>,
  対象: { 箱: Set<string>; 枠: Set<string> },
): void {
  if (元の名前.size === 0) return;
  for (const n of diagram.nodes) {
    if (!対象.箱.has(n.id)) continue;
    const 元 = 元の名前.get(n.title);
    if (元 !== undefined) n.title = 元;
  }
  for (const l of diagram.lanes) {
    if (!対象.枠.has(l.id) || l.label === undefined) continue;
    const 元 = 元の名前.get(l.label);
    if (元 !== undefined) l.label = 元;
  }
}
