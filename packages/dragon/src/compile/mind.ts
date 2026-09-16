import { diagram } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import type { DslActor, DslDocument } from "../types";
import { 図表の大きさ } from "./chart-fields";
import { 矢印から親を決める, 放射に出す文字 } from "./hierarchy";
import type { CompileNotice } from "./notice";
import { slugify } from "./slug";
import { truncateForMessage, 図の小見出し } from "./subtitle";
/**
 * 記法の `type: mind` を放射の図に直す (#2031 で `compile.ts` から移した)。
 *
 * 中心 1 つと枝の並びを 1 つの箱 (`mind-map`) に載せる。 枝の親は矢印で決まり、
 * 規則は `type: tree` と共有する (`矢印から親を決める`)。
 *
 * 放射だけが使う小道具もここへ一緒に移した。 `compile.ts` に残していた間、
 * 「放射で描けるか描けないか」 の割り当てが `compileMind` から 250 行離れており、
 * 欄を足す人が両方を見つけにくかった。
 */

/**
 * 1 箱で描く放射が **描ける欄**。 これ以外は書いても出ない (#1177 Round 3)。
 *
 * 数え上げは 3 度直した。 副題 / 値 / 行 → 位置 / 大きさ → 種類 / 枠 / 積む順 …と、 見落とした
 * 欄が review のたびに出た。 数え漏らしても検査は通ってしまう = 「書いたのに出ない」 が黙って
 * 残る形が繰り返し発生した。
 *
 * そこで **`DslActor` の全ての欄を、 描ける側か描けない側のどちらかに必ず割り当てる**。
 * 欄が増えた時に両方へ入れ忘れると型検査が落ちるので、 「描けるのか描けないのか」 を必ず
 * 判断することになる (`rules/quality.md § 多層 SSOT 経路の全 registration 保証` と同じ形)。
 */
type 放射で描ける欄 =
  /** 中心の名前 / 枝の名前になる */
  | "name"
  /** 名前と分けて中心 / 枝に出す題。 書かなければ名前を出す */
  | "title"
  /**
   * 名前とは分けて補足に出す 2 欄。
   *
   * `- 描く量を減らす: "{draw} ms"` の形は副題として解析されるため、 値の欄だけを見ると
   * 記法で最も普通な書き方が届かない (#1230 で実測)。 明示的に書いた値の欄も同じ場所へ出す。
   *
   * 描画側は枝の `subtitle` と中心の `rootSubtitle` を名前とは別の行に描く。 2 欄を
   * `放射に出す文字` で 1 つの補足にまとめ、 名前とは分けて渡す。
   */
  | "subtitle"
  | "value"
  /** 枝の色 (`MindBranchNode.tone`)。 中心は持てないので `描けない欄` が別に見る */
  | "tone"
  /** 見本は放射に載せず、 見本の中身だけを描く (別経路で伝える) */
  | "partId"
  /** 種類を書いたかどうかの印。 `kind` と対で見るので単独では扱わない */
  | "kindWritten"
  /** 本文の行番号。 知らせに載せるために使う */
  | "pos";

/** 放射では描けない欄。 書かれていたら伝える */
type 放射で描けない欄 =
  | "kind"
  | "eyebrow"
  | "touchpoint"
  | "opportunity"
  | "owner"
  | "end"
  | "rows"
  | "marks"
  | "lane"
  | "stack"
  | "initial"
  | "final"
  // 前の時点の値 (#1450)。 放射の枝は 1 時点しか描かない = 2 本目の帯に当たるものが無い
  | "previous"
  | "colorHex"
  // 部品に書いた色の名前 (#1973)。 色番号と同じく部品にしか残らない
  | "partColorName"
  | "stateOverride"
  | "posX"
  | "posY"
  | "posW"
  | "posH"
  | "scale"
  | "scaleKeys"
  | "posRel"
  | "layoutPos"
  // 箱の中に描く図形 (#1374)。 放射の枝は箱の中に図形を持たない
  | "shape"
  // 出す条件 (#1381)。 放射の枝は個別に出し分けられない
  | "visibleIf"
  // 値に追随する 5 欄 (#1392)。 放射の枝は大きさも位置も中心からの配置で決まる
  | "wBind"
  | "hBind"
  | "opacity"
  | "renderOffsetX"
  | "renderOffsetY";

/** 引数が `never` でなければ型検査が落ちる */
type 空であること<T extends never> = T;

/** `DslActor` に割り当て漏れの欄があると落ちる */
export type _放射の欄を覆えている = 空であること<
  Exclude<keyof DslActor, 放射で描ける欄 | 放射で描けない欄>
>;

/** `DslActor` に無い欄を割り当てていると落ちる */
export type _放射の欄に余りがない = 空であること<
  Exclude<放射で描ける欄 | 放射で描けない欄, keyof DslActor>
>;

/** 描ける側と描けない側が重なっていると落ちる */
export type _放射の欄が重なっていない = 空であること<Extract<放射で描ける欄, 放射で描けない欄>>;

/**
 * 描けない欄と、 知らせに出す名前。
 *
 * **欄ごとに式を持たせない** (Round 5 の指摘)。 `{ 説明, 書いたか }` の形にすると、 項目名と式が
 * 型で結ばれず `scale: { 書いたか: () => false }` のように **判定を骨抜きにしても型検査が通る**。
 * 名前だけを持ち、 書かれていたかは下の 1 つの式で見る。
 *
 * `Record<放射で描けない欄, string>` なので、 欄を足すと項目も要る。 判定の側は欄ごとに書く所が
 * 無いため、 書き忘れも骨抜きも起きない。
 *
 * 表示の名前は複数の欄で同じでよい (`posX` と `posY` はどちらも「位置 (座標)」)。 出す時に
 * 重複を除く。
 */
const 放射で描けない欄の名前: Record<放射で描けない欄, string> = {
  kind: "種類",
  eyebrow: "上の小見出し",
  touchpoint: "場所 (体験の道筋の欄)",
  opportunity: "改善の余地 (体験の道筋の欄)",
  owner: "担当 (工程の並びの欄)",
  end: "終わる時期 (工程の並びの欄)",
  rows: "行",
  marks: "印",
  lane: "枠の指定",
  stack: "積む順",
  initial: "始まり / 終わり の印",
  final: "始まり / 終わり の印",
  previous: "前の時点の値",
  colorHex: "色番号",
  partColorName: "色の名前",
  stateOverride: "状態の上書き",
  // 位置は「登場人物ごとの箱をどこに置くか」 の指定で、 箱が 1 つの図では置く先が無い
  posX: "位置 (座標)",
  posY: "位置 (座標)",
  posW: "大きさ",
  posH: "大きさ",
  scale: "倍率",
  scaleKeys: "倍率",
  posRel: "位置 (相対)",
  layoutPos: "配置のずらし",
  shape: "箱の中の図形",
  visibleIf: "出す条件",
  wBind: "値に追随する大きさ",
  hBind: "値に追随する大きさ",
  opacity: "濃さ",
  renderOffsetX: "描く時のずらし",
  renderOffsetY: "描く時のずらし",
};

/**
 * その欄が書かれていたか。 **全ての欄をこの 1 つの式で見る**。
 *
 * 欄ごとに式を持たせると、 1 つだけ骨抜きにしても型検査が通る (Round 5 の指摘)。 1 つにすれば
 * 骨抜きにした時点で全ての欄の検査が落ちる。
 *
 * 例外は種類だけ。 既定値 (`actor`) が必ず入るので、 書いたかどうかの印 (`kindWritten`) で見る。
 * 真偽を持つ欄 (`initial` / `final`) は `false` を「書いていない」 として扱う = 既定と同じ意味で、
 * 伝えると書いていない人にも出る。
 */
function 放射で描けない欄を書いたか(a: DslActor, 欄: 放射で描けない欄): boolean {
  if (欄 === "kind") return a.kindWritten === true;
  const v = a[欄];
  if (typeof v === "boolean") return v;
  return v !== undefined;
}

/**
 * 放射と木の箱に出す名前と補足 (#1332)。
 *
 * **連結しない**。 描画側は名前と補足を別々に受け取れば箱の中で 2 行に積む。 1 つの文字列に
 * すると 1 行に全部入り、箱幅を超えて末尾が切られる (実測 = 箱 120px に対し文字 163px)。
 *
 * `subtitle` と `value` の両方が書かれた場合は空白で繋いで 1 つの補足にする。 描画側の
 * 補足は 1 行なので、2 つを別々の行にはできない。
 */
export function compileMind(
  doc: DslDocument,
  onNotice?: (n: CompileNotice) => void,
): CdlDiagram {
  // 図の型は描画側の組み立て関数 `mindMap()` と同じ綴り (cdl 0.63.0 で `mindmap` から `mind` に揃った)
  const b = diagram(slugify(doc.title), { topic: doc.title, type: "mind" });
  const { w: W, h: H } = 図表の大きさ.mind;

  const 伝える = (kind: CompileNotice["kind"], 名: string, message: string, line = 0): void => {
    onNotice?.({ kind, actor: 名, line, message });
    if (typeof console !== "undefined" && console.warn) console.warn(`[dragon] ${message}`);
  };

  // **見本 (`parts`) を重ねた登場人物は中心にも枝にもしない** (review 指摘)。 後段の
  // `mergePartsFromActors` が見本の中身を別の箱として足すため、 こちらにも載せると同じ
  // 登場人物が 2 箇所に描かれる。 中心だけ外し忘れると、 中心が見本の記法で二重になる
  const 見本でない: DslActor[] = [];
  for (const a of doc.actors) {
    if (a.partId !== undefined) {
      伝える(
        "part-not-drawn",
        a.name,
        `type: mind では見本 (${a.partId}) を中心にも枝にもできません。 見本はそのまま描き、 放射には載せません`,
        a.pos?.line ?? 0,
      );
      continue;
    }
    見本でない.push(a);
  }
  // 枝の親は矢印で決まる (#1251)。 書かなければ全て中心の直下 = 従来と同じ図になる。
  // 規則は `type: tree` と共有する = 同じ本文で図種だけ変えた時に親子の解釈が割れない。
  //
  // **早期 return より前に置く** = 見本しか居ない記法で矢印を書いた時、 枝が 1 本も無いため
  // どの矢印も親にできない。 後ろに置くと、その形で矢印が黙って消える (Round 3 の指摘と同じ理由)
  const 枝の名前 = new Set(見本でない.map((a) => slugify(a.name)));
  const 親 = 矢印から親を決める(doc, "mind", 枝の名前, (名, message, line) =>
    // 親にできなかった矢印は描かれない。 知らせの種別も「矢印を落とした」 にする
    伝える("chart-edge-dropped", 名, message, line ?? 0),
  );

  // 放射に載る登場人物が 0 人なら枠も作らない。 中身の無い枠が 1 つ残るのを避ける (#1096)。
  // **枠を作る前に見る** = 見本しか居ない記法で作ると、 見本だけが描かれた図に空の枠が残る
  if (見本でない.length === 0) return b.build();

  b.lane("chart", { width: W + 64 });

  // **同じ slug になる名前を先に見る** (`type: tree` と同じ理由)。 違う名前が同じ id に潰れると、
  // 枝が 1 本消えたり、 枝の親を見る規則が別の枝を指したりする
  const slug別 = new Map<string, string[]>();
  for (const a of 見本でない) {
    const k = slugify(a.name);
    slug別.set(k, [...(slug別.get(k) ?? []), a.name]);
  }
  for (const [k, 群] of slug別) {
    if (群.length > 1) {
      伝える(
        "chart-value-unreadable",
        群[0]!,
        `type: mind で ${群.join(" / ")} が同じ id (${k}) になります。 名前を変えてください`,
      );
    }
  }

  const root = 見本でない[0]!;
  const rootId = slugify(root.name) || "root";

  // **中心を子にする矢印は表せない** (#1251 Round 1 の指摘)。 中心は枝の並びに居ないため
  // 親を持てず、 解決はできても誰にも読まれずに消える。 黙って捨てると「書いたのに
  // 図が変わらない」 が手掛かりなしで起きるので、 行番号付きで伝える
  for (const f of doc.flow) {
    if (slugify(f.to) !== rootId) continue;
    伝える(
      "chart-edge-dropped",
      f.to,
      `type: mind で中心 (${truncateForMessage(f.to)}) を子にはできません (${truncateForMessage(f.from)} -> ${truncateForMessage(f.to)} を使いません)。 中心は放射の真ん中に置く 1 つだけです`,
      f.pos?.line ?? 0,
    );
  }

  // **1 箱で描く種別が持てる欄は限られる**。 枝は名前と色、 中心は名前だけ。 書いても描けない
  // 欄は伝える = 箱ごとに描いていた頃は載っていた欄で、 黙って消すと「書いたのに出ない」 が残る
  const 描けない欄 = (a: DslActor): string[] => {
    const out: string[] = [];
    for (const 欄 of Object.keys(放射で描けない欄の名前) as 放射で描けない欄[]) {
      if (!放射で描けない欄を書いたか(a, 欄)) continue;
      const 名前 = 放射で描けない欄の名前[欄];
      // 同じ名前を持つ欄 (`posX` と `posY`) は 1 度だけ出す
      if (!out.includes(名前)) out.push(名前);
    }
    return out;
  };
  const 消えた欄 = new Map<string, string[]>();
  const 記録する = (a: DslActor): void => {
    const 欄 = 描けない欄(a);
    if (欄.length > 0) 消えた欄.set(a.name, 欄);
  };

  const branches: NonNullable<CdlDiagram["nodes"][number]["mindData"]>["branches"] = [];
  const 使った = new Set<string>([rootId]);
  記録する(root);
  // 中心は色の欄を持たない (`MindBranchPayload` に `tone` が無い)
  if (root.tone)
    消えた欄.set(root.name, [...(消えた欄.get(root.name) ?? []), "色 (中心は持てない)"]);

  見本でない.slice(1).forEach((a, i) => {
    const id = slugify(a.name) || `leaf-${i}`;
    if (使った.has(id)) {
      伝える(
        "chart-value-unreadable",
        a.name,
        `type: mind で ${a.name} が既にある id (${id}) と重なります (枝に載せません)`,
        a.pos?.line ?? 0,
      );
      return;
    }
    使った.add(id);
    記録する(a);
    // 矢印を書かなかった枝は中心の直下。 中心を親に指した矢印も同じ値になる
    // (中心は `見本でない` の先頭なので、 その名前の slug が `rootId` そのもの)
    // 枝は色を持てる (`MindBranchNode.tone`)
    branches.push({
      id,
      ...放射に出す文字(a),
      parent: 親.get(id) ?? rootId,
      ...(a.tone ? { tone: a.tone } : {}),
    });
  });

  if (消えた欄.size > 0) {
    const 一覧 = [...消えた欄].map(([名, 欄]) => `${名} の${欄.join(" / ")}`).join("、 ");
    伝える(
      "chart-value-unreadable",
      [...消えた欄.keys()][0]!,
      `type: mind は名前と副題 / 値、 枝の色しか描けません (描かない欄: ${一覧})。 これらを描くなら type: tree か type: flow を使ってください`,
    );
  }

  b.node(`${slugify(doc.title) || "mind"}-chart`, {
    lane: "chart",
    stack: 0,
    kind: "mind-map",
    title: doc.title,
    ...図の小見出し(doc),
    w: W,
    h: H,
    mindData: (() => {
      const 中心 = 放射に出す文字(root);
      return {
        rootId,
        rootTitle: 中心.title,
        ...(中心.subtitle === undefined ? {} : { rootSubtitle: 中心.subtitle }),
        branches,
      };
    })(),
  });
  return b.build();
}
