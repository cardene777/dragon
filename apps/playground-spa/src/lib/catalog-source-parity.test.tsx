/**
 * preset の記法と組み立て API の一致検査 (#1237)。
 *
 * catalog の図の多くは記法 (`sourceYaml`) を持たず、画面で「コード」 を見られず
 * 「編集画面で開く」 も押せなかった。 記法を書き足すにあたり、**書いた記法が本当に同じ図に
 * なるか** を機械で確かめる。
 *
 * ## 何を一致とみなすか
 *
 * **骨格と中身**。 縦列 / 箱 / 矢印の数と、箱の題と、矢印の説明と、段の題。
 *
 * **id は見ない** (宣言した分を除く)。 記法は id を書けず、名前から導く規則を持つ
 * (`parser.ts`)。 一方 preset は組み立て API で明示 id を書いており (`{ id: "fn" }`)、
 * 名前と一致しないものが多い (`handler(...)` に対して `fn` 等)。 記法側で合わせる手段が無い。
 *
 * id が違っても、読む人が受け取るもの (同じ形と同じ字の図) は変わらない。 画面は組み立て済みの
 * 図を描き、エディタは記法から作った図を描く = 両者が id を突き合わせる場面が無い。
 *
 * それでも **偶然一致している分は固定する**。 `id が完全一致する` に宣言した preset は
 * id まで比べ、崩れたら落ちる。 宣言外で一致し始めたら宣言を足せる。
 *
 * ## 表せない中身は宣言する
 *
 * 宣言に無い差が出たら落ちる = 記法を書き換えて図がずれた時に気付ける。
 */
import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { textDslToDiagram } from "@cardenelabs/dragon";
import { CdlDiagramView, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import * as Presets from "@/topics/catalog/presets.cdl";
import { 一覧の記法つき, 差分 } from "./catalog-scope";
import { 記法つき, 記法を持つカタログ, 部品の一覧 } from "./catalog-source-cases";

/**
 * id まで完全に一致する preset。
 *
 * 記法の id 生成規則 (名前の slug) と preset の明示 id がたまたま揃っているもの。
 * 実測で確かめた分だけを載せる。
 *
 * **`animation:` を書くと矢印の id が変わる図種がある** (実測 = `type: state` は
 * `t0-idle-loading` だが、`animation:` を足すと `e0-idle-loading` になる)。 段を合わせるには
 * `animation:` が要るため、その図種は id 一致を諦めて骨格の一致で見る。
 *
 * **今は 1 件も無い** (cdl#578)。
 *
 * `presetSequence` を載せていたが、順序図は 1 つの箱が図を丸ごと描く形になり、その箱の id が
 * 組み立て API では書いた値 (`seq-demo`)、記法では題から導いた値になる = 一致しようがない。
 * 偶然一致していた縦線や名札の id も、その形ごと消えた。
 */
const id完全一致: readonly string[] = [];

/**
 * 縦列の見出しが合わないと分かっている preset。 1 件ずつ理由を書く。
 *
 * **今は 1 件も無い**。 `presetEr` を「この図種は縦列の見出しを描かない」 として宣言していたが、
 * **その判断は誤りだった** = 描いた絵を数えると記法側だけ表の名前が 2 度出ていた
 * (縦列の見出しと箱の題)。 #1241 で見出しを付けるのを `swimlane` だけに絞って解消した。
 *
 * 宣言を足す時は **描いた絵で確かめる**。 組み立て結果を見るだけだと「描かれるかどうか」 は
 * 分からない (この誤りはそこから生まれた)。
 */
const 縦列の見出しの既知の差: Record<string, string> = {};

/**
 * 記法で光らせ分けられない矢印を、**説明で** 宣言する (#1371)。
 *
 * `focus:` は `A -> B` の形しか受けない (`focus.ts`)。 同じ 2 者を結ぶ矢印が 2 本ある図は
 * どちらか一方だけを段ごとに光らせる書き方が無く、書くと両方が光る。
 *
 * 宣言した説明を持つ矢印を **両側から** 外して比べる = 残りの光らせ方は従来どおり見る。
 * 記法側だけを外すと、組立て API 側がその矢印を光らせなくなった変更に気付けない。
 */
const 光らせ分けられない矢印: Record<string, readonly string[]> = {
  // 「読む」 と「書く」 はどちらも `残数を減らす(...) -> 残数の表`。 記法では書き分けられない
  // (矢印の札で引くので、札を訳したらここも揃える。 #1888)
  patternCallReadWrite: ["読む", "書く"],
};

const 光らせる先の既知の差: Record<string, readonly string[]> = {
  // **今は 1 件も無い** (cdl#578)。
  //
  // 順序図は縦線と足元の箱を持たなくなった = 図が 1 つの箱になり、言づては箱の中の行に
  // なった。 `focus:` が受け付けない縦列の id を光らせる経路そのものが消えたので、
  // 宣言する差も無い。
};

type 図種の差 = {
  見本: string;
  記法経路: string;
  組み立て器経路: string;
  理由: string;
};

/**
 * dragon の記法では組み立て器と同じ図種で書けない見本。
 *
 * 書けない理由は 2 通りある = 記法に同名の図種が無い (`network` / `infrastructure`) か、
 * 図種は在っても その図に要る箱の形が無い (複雑な版の繰り返しの箱)。 理由の欄に書き分ける。
 */
const 図種の既知の差: Record<string, 図種の差> = {
  presetNetwork: {
    見本: "presetNetwork",
    記法経路: "flow",
    組み立て器経路: "network",
    理由: "dragon の記法に network が無く、flow として書くため",
  },
  presetInfrastructure: {
    見本: "presetInfrastructure",
    記法経路: "flow",
    組み立て器経路: "infrastructure",
    理由: "dragon の記法に infrastructure が無く、flow として書くため",
  },
  // 同じ見本の複雑な版 (#2143)。 簡単な版は #2521 で記法を揃えたが、この版は揃えられない
  pattern__presetFlowchart__複雑: {
    見本: "pattern__presetFlowchart__複雑",
    記法経路: "swimlane",
    組み立て器経路: "flowchart",
    理由:
      "繰り返しの箱 (「明細を 1 行ずつ見る」) を分かれ道の図の記法が持たないため、" +
      "この版だけ swimlane として書く (#2521)",
  },
  // 同じ見本の複雑な版 (#2139)。 差の理由は簡単な版と同じ
  pattern__presetInfrastructure__複雑: {
    見本: "pattern__presetInfrastructure__複雑",
    記法経路: "flow",
    組み立て器経路: "infrastructure",
    理由: "dragon の記法に infrastructure が無く、flow として書くため",
  },
};

/**
 * 組み立てが注意を出すことを宣言した見本 (#2421)。
 *
 * 注意はふつう取りこぼしの印なので、見本は 1 件も出さないのが既定。
 * ただし **注意そのものを見せる見本** はこの限りでない = 書いても図が変わらない形を
 * 一覧に載せる以上、その形が出す注意も一緒に出る。
 *
 * **宣言は種類まで書く**。 種類を見ずに「注意があってよい」 とだけ宣言すると、
 * 別の取りこぼし (`focus-target-missing` 等) が混ざっても落ちない。
 */
const 注意が出る見本: Record<string, { 種類: readonly string[]; 理由: string }> = {
  pattern__flowDirection__横に並べる: {
    種類: ["direction-same-as-default"],
    理由:
      "既定と同じ向きを明に書ける形を見せる見本。 この図は動きを書いているので向きの行を外しても同じ並びになり、" +
      "組み立てはそれを注意として伝える (#2421)。 #2424 でフローの既定が横になったので、宣言の相手が" +
      "「縦に積む」 から「横に並べる」 へ移った",
  },
};

/**
 * 差を宣言する一覧を 1 つに束ねる (#1563)。
 *
 * **鍵の実在を見る検査はここから導く**。 一覧を手で並べていた間、4 つのうち
 * `光らせ分けられない矢印` だけ検査を持っていなかった (実測)。 手で並べる形は、
 * 宣言を足したときに検査へ足すのを忘れても落ちない。
 *
 * 宣言を足す = この object に欄を足すことなので、検査は自動で追随する。
 *
 * **引く側もここを通す**。 素の定数から引いたままだと、束ねから欄を落としても呼出側が
 * 生きたままになり、検査だけが静かに消える。 束ね経由にすれば、落とした時点で型検査が落ちる。
 */
const 差の宣言 = {
  図種の既知の差,
  光らせる先の既知の差,
  縦列の見出しの既知の差,
  光らせ分けられない矢印,
  id完全一致,
  注意が出る見本,
} as const;

type Diagram = CdlDiagram;

const 対象 = 記法つき();

/**
 * id を「読む人に見える名前」 へ読み替える表 (Round 1 の指摘)。
 *
 * 箱は題、矢印は端の題と説明。 id は記法と組立て API で違うため直接は比べられないが、
 * **読み替えれば比べられる**。
 */
function 箱の見える名前(d: Diagram, id: string): string {
  const 箱 = d.nodes.find((n) => n.id === id);
  if (箱 === undefined) return `(無い箱:${id})`;
  const 縦列 = (d.lanes ?? []).find((l) => l.id === 箱.lane)?.label ?? "";
  return `箱:${箱.title ?? ""}|縦列:${縦列}|段:${箱.stack ?? ""}`;
}

function 見える名前の表(d: Diagram): Map<string, string> {
  const 表 = new Map<string, string>();
  for (const n of d.nodes) 表.set(n.id, 箱の見える名前(d, n.id));
  // 同じ説明の矢印が複数あっても、段が別の矢印を光らせた差を残す。
  for (const e of d.edges) {
    表.set(e.id, `矢印:${e.label ?? ""}|${箱の見える名前(d, e.from)}->${箱の見える名前(d, e.to)}`);
  }
  for (const l of d.lanes ?? []) 表.set(l.id, `縦列:${l.label ?? ""}`);
  return 表;
}

/**
 * 矢印がどの箱とどの箱を、どちら向きに繋ぐか (Round 1 の指摘)。
 *
 * **説明だけを比べても足りない**。 `User -> Order` を `Order -> User` に反転しても
 * 説明は変わらないため、向きの違う図が通っていた。
 */
const 矢印の両端 = (d: Diagram): string[] =>
  d.edges.map((e) => `${箱の見える名前(d, e.from)} -> ${箱の見える名前(d, e.to)}`);

/**
 * 段が光らせる先を、読む人に見える名前で並べる (Round 1 の指摘)。
 *
 * **数だけを比べても足りない**。 `User` の代わりに `Order` を光らせても数が同じなら
 * 通っていた。 名前で比べれば取り違えを落とせる。
 */
const 光らせる先 = (d: Diagram, 除く: ReadonlySet<string> = new Set()): string[][] => {
  const 表 = 見える名前の表(d);
  return d.phases.map((p) =>
    [
      ...new Set(
        p.activate.filter((id) => !除く.has(id)).map((id) => 表.get(id) ?? `(不明:${id})`),
      ),
    ].sort(),
  );
};

/**
 * 段が起点から描く先を、読む人に見える名前で並べる (#1351)。
 *
 * `光らせる先` と同じ理由で id のままでは比べられない。 記法は箱の識別子を題から導き
 * (`時系列データの推移を線で示す折れ線グラフ-chart`)、組み立て API は明示に書く
 * (`chart-line-demo-chart`) ため、同じ箱を指していても文字列が違う。
 *
 * **欄の有無まで見る**。 描く指定を書いた段と書いていない段で JSON の形が変わる
 * (書かない段には欄ごと付かない) ので、`[]` と「欄が無い」 を同じ空配列に潰さず、
 * 段ごとの並びとして比べる。
 */
const 描く先 = (d: Diagram): string[][] => {
  const 表 = 見える名前の表(d);
  return d.phases.map((p) =>
    [...new Set((p.draw ?? []).map((id) => 表.get(id) ?? `(不明:${id})`))].sort(),
  );
};

describe("矢印と段の表示要素への読み替え", () => {
  it("題のない箱でも、矢印の向きを区別する", () => {
    // **順序図では確かめられなくなった** (cdl#578)。 言づてが箱の中の行になり矢印を持たない。
    // 題を持たない箱を含む図として、格子に置いたクラス図で見る
    const 元 = Presets.presetClassDiagram;
    const 反転 = {
      ...元,
      edges: 元.edges.map((e, i) => (i === 0 ? { ...e, from: e.to, to: e.from } : e)),
    };
    expect(矢印の両端(反転)).not.toEqual(矢印の両端(元));
  });

  it("どの段も光らせない矢印の向きは、両端の比較だけが捕まえる", () => {
    // **2 つの検査は役割が違う**。 向きの違いはどちらも捕まえるが、それは段がその矢印を
    // 光らせている時だけ。 光らせない矢印では両端の比較だけが残る = 片方に寄せられない
    const 元 = Presets.presetEr;
    const 光らせない = { ...元, phases: 元.phases.map((p) => ({ ...p, activate: [] })) };
    const 反転 = {
      ...光らせない,
      edges: 光らせない.edges.map((e, i) => (i === 0 ? { ...e, from: e.to, to: e.from } : e)),
    };
    expect(矢印の両端(反転), "両端の比較が向きを見ていない").not.toEqual(矢印の両端(光らせない));
    expect(光らせる先(反転), "光らせる先が向きを見てしまっている").toEqual(光らせる先(光らせない));
  });

  it("同じ説明の矢印が 2 本ある時、光らせる先が取り違えを捕まえる", () => {
    // 逆に、説明だけで名乗らせると同じ説明の矢印を区別できない = 両端を名前に含める理由
    const 元 = Presets.presetEr;
    const 先頭 = 元.edges[0];
    if (先頭 === undefined) throw new Error("矢印を持たない preset では確かめられない");
    const 二本 = {
      ...元,
      edges: [...元.edges, { ...先頭, id: "dup", from: 先頭.to, to: 先頭.from }],
      phases: 元.phases.map((p, i) => (i === 0 ? { ...p, activate: [先頭.id] } : p)),
    };
    const 取違え = {
      ...二本,
      phases: 二本.phases.map((p, i) => (i === 0 ? { ...p, activate: ["dup"] } : p)),
    };
    expect(光らせる先(取違え), "同じ説明の矢印を区別できていない").not.toEqual(光らせる先(二本));
  });

  it("題のない箱でも、段が光らせる位置を区別する", () => {
    const 元 = Presets.presetClassDiagram;
    const 取違え = {
      ...元,
      phases: 元.phases.map((p, i) =>
        i === 0 ? { ...p, activate: p.activate.map((id) => (id === "User" ? "Sku" : id)) } : p,
      ),
    };
    expect(光らせる先(取違え)).not.toEqual(光らせる先(元));
  });
});

/**
 * 描いた図のうち、**見た目を決める部分だけ** (#1273)。
 *
 * id は記法と組立て API で作り方が違う (本 file 冒頭)。 id を載せる欄と、id を埋め込む
 * 塗り (`url(#tree-root-grad-...)`) を落とす。 座標 / 大きさ / 色 / 文字はすべて残すので、
 * 見た目に出る差は落とした後も残る。
 *
 * 光らせているかどうか (`data-cdl-active`) も落とす。 光らせ方は
 * `段が光らせる先が一致する` が宣言付きで見る = 二重に見ると宣言が効かなくなる。
 */
const 見た目を決めない欄 = [
  "data-cdl-edge",
  "data-cdl-node",
  "data-cdl-lane",
  "data-cdl-from",
  "data-cdl-to",
  "data-cdl-edge-label-for",
  // 行き先の端の字が載る矢印 (#1769)。 字の位置は矢印の形から決まるので、別の矢印に載れば座標で差が出る
  "data-cdl-edge-end-label-for",
  "data-cdl-edge-label",
  "data-cdl-edge-sub",
  "id",
  "marker-end",
  "aria-label",
  "data-cdl-active",
] as const;

const 落とす式 = new RegExp(` (${見た目を決めない欄.join("|")})="[^"]*"`, "g");

/**
 * 粒子が載る矢印の参照 (`data-cdl-particle` / `data-cdl-particle-path-ref` / `mpath` の `href`)。
 *
 * **落とさず読み替える**。 中身は矢印の id なので記法と組立て API で文字列が違うが、
 * 落とすと **粒子が別の矢印に載っている図** まで一致になる (参照先が消えるため)。
 * 読む人に見える名前へ直せば、載せ違いは差として残る。
 */
function 粒子の参照を読み替える(s: string, 表: Map<string, string>): string {
  return s
    .replace(
      / data-cdl-particle="([^"]*)"/g,
      (_m, id: string) => ` data-cdl-particle="${表.get(id) ?? `(不明:${id})`}"`,
    )
    .replace(
      / data-cdl-particle-path-ref="#cdl-edge-([^"]*)"/g,
      (_m, id: string) => ` data-cdl-particle-path-ref="${表.get(id) ?? `(不明:${id})`}"`,
    )
    .replace(
      / href="#cdl-edge-([^"]*)"/g,
      (_m, id: string) => ` href="${表.get(id) ?? `(不明:${id})`}"`,
    );
}

/**
 * 描く時刻を止める (#1374)。
 *
 * 波の図形 (`shape: { kind: wave }`) は水面の位相を時計から決めるため、**同じ図を 2 度
 * 描くと違う絵になる** (実測 = `M 40.0 126.4` と `M 40.0 126.5`)。 止めずに比べると、
 * 記法と組み立て API が完全に同じでも 0.1 の差で落ちる。
 *
 * 止める時刻は固定値にする。 2 つの絵が同じ瞬間を見れば、時計に依らない差だけが残る。
 */
const 描く時刻 = new Date("2026-01-01T00:00:00Z");

function 時刻を止めて描く<T>(描く: () => T): T {
  vi.useFakeTimers();
  vi.setSystemTime(描く時刻);
  try {
    return 描く();
  } finally {
    vi.useRealTimers();
  }
}

function 見た目(
  d: Diagram,
  光らせる先から外す: ReadonlySet<string> = new Set(),
  図種を外す = false,
): string {
  const 対象 =
    光らせる先から外す.size === 0
      ? d
      : {
          ...d,
          phases: d.phases.map((p) => ({
            ...p,
            activate: p.activate.filter((id) => !光らせる先から外す.has(id)),
          })),
        };
  const s = 時刻を止めて描く(() => renderToStaticMarkup(<CdlDiagramView diagram={layout(対象)} />));
  const 始 = s.indexOf("<svg");
  const 終 = s.lastIndexOf("</svg>");
  if (始 < 0 || 終 <= 始) throw new Error("図が描かれていない");
  const svg = s
    .slice(始, 終 + 6)
    .replace(落とす式, "")
    .replace(/url\(#[^)]*\)/g, "url(#)");
  return 粒子の参照を読み替える(
    図種を外す ? svg.replace(/ data-cdl-type="[^"]*"/, "") : svg,
    見える名前の表(d),
  );
}

/**
 * 描いた図の大きさ。 `見た目` が返した絵の `<svg>` の `viewBox` を読む。
 *
 * **中身ではなく絵で見る**。 箱の大きさや矢印の回し方は中身の比較に現れないが、
 * 読む人には図の大きさとして届く。
 *
 * **描き直さない**。 描画側は `<svg>` の `viewBox` と外側の `data-cdl-viewbox` を同じ値から作るため、
 * 絵から読めば大きさのためだけにもう 1 度描く必要が無い。
 */
function 描いた大きさ(絵: string): string {
  return 絵.match(/^<svg[^>]*\sviewBox="([^"]+)"/u)?.[1] ?? "(読めない)";
}
const ids = (a: readonly { id: string }[] | undefined): string[] => (a ?? []).map((x) => x.id);
const 題 = (a: readonly { title?: string }[] | undefined): string[] =>
  (a ?? []).map((x) => x.title ?? "");
const 説明 = (a: readonly { label?: string }[] | undefined): string[] =>
  (a ?? []).map((x) => x.label ?? "");

/**
 * **比べる欄を列挙しない** (#1273)。
 *
 * 列挙する形にしていた間、欄が増えても検査は増えず、見ていない欄が黙って素通りしていた。
 * 直近 4 件の指摘 (#1244 縦列の幅 / #1258 図表の値 / #1260 描いた大きさ / #1267 矢印の
 * `overlay`) はすべてこの形で、実測すると 15 欄が比較対象から漏れていた。
 *
 * 反転して **比べない欄を宣言する**。 宣言に無い欄が実物に現れたら、
 * 「宣言していない欄が増えていない」 の検査が落ちる = 増えた欄は必ず判断を通る。
 *
 * 宣言は 2 種類ある。
 *
 * | 種類 | 意味 |
 * |---|---|
 * | 比べない | 記法側で合わせる手段が無い、または別の検査が担う |
 * | 読み替える | そのままでは比べられないが、読む人に見える形へ直せば比べられる |
 */
type 欄の宣言 = {
  /** 比べない欄と、その理由 */
  比べない: Record<string, string>;
  /** 読み替えてから比べる欄 */
  読み替える?: Record<string, string>;
};

const 箱の宣言: 欄の宣言 = {
  比べない: {
    id: "記法と組立て API で作り方が違う (本 file 冒頭)。 読む人に見える名前へ直した上で `光らせる先` が使う",
    // 大きさは書いていない側が既定に落ちるだけで、描いた図は変わらない。
    // 実測 = 組立て API 側から `w` を落として描くと出力が 1 文字も変わらない
    // (`presetEr` 13305 byte / `presetStateMachine` 16185 byte がいずれも同一)。
    // **変わる場合は `描いた図が一致する` が捕まえる**
    w: "書かない側は既定に落ちる。 描画に出るかは `描いた図が一致する` が見る",
    h: "同上",
  },
  読み替える: {
    lane: "縦列の id は作り方が違う。 読む人に見えるのは見出しなので、見出しへ直して比べる",
    chartData: "図表の項目の id は記法で書けない。 並び順から作る名前へ直して比べる",
    funnelData: "同上",
    ganttData: "同上",
    quadrantData: "同上",
    journeyData: "同上",
    treeData: "同上",
    mindData: "同上",
  },
};

const 矢印の宣言: 欄の宣言 = {
  比べない: {
    id: "記法と組立て API で作り方が違う",
    // 0 と書かないことは描画上まったく同じ。 実測 = `presetInfrastructure` から
    // `labelOffsetX` / `labelOffsetY` を落として描くと 21601 byte が 1 文字も変わらない
    labelOffsetX: "0 と未指定で描画が変わらない。 描画に出るかは `描いた図が一致する` が見る",
    labelOffsetY: "同上",
  },
  読み替える: {
    from: "箱の id は作り方が違う。 読む人に見える名前へ直して比べる",
    to: "同上",
  },
};

const 縦列の宣言: 欄の宣言 = {
  比べない: {
    id: "記法と組立て API で作り方が違う。 見出しと幅で比べる",
  },
};

const 段の宣言: 欄の宣言 = {
  比べない: {
    id: "記法と組立て API で作り方が違う",
    activate: "光らせる先は id の列。 読む人に見える名前へ直して `光らせる先が一致する` が比べる",
    draw: "描く先も id の列。 読む人に見える名前へ直して `描く先が一致する` が比べる (#1351)",
  },
};

const 状態の宣言: 欄の宣言 = { 比べない: {} };

const 図の直下の宣言: 欄の宣言 = {
  比べない: {
    id: "記法と組立て API で作り方が違う",
    // 検索結果に構造化データとして載せるかを決める欄で、描いた図には出ない。
    // 記法に書く欄が無いため、記法側から合わせる手段がない (#1376)
    structuredData: "SEO の構造化データに載せるかだけを決める。 記法に欄が無く、描いた図にも出ない",
    nodes: "箱として別に比べる",
    edges: "矢印として別に比べる",
    lanes: "縦列として別に比べる",
    phases: "段として別に比べる",
    states: "状態として別に比べる",
  },
  読み替える: {
    eventBindings:
      "出来事が指す相手の id は作り方が違う (#1393)。 読む人に見える名前へ直して比べる",
  },
};

/**
 * 図表の中身の識別子を、並び順から作る名前に置き換える。
 *
 * **識別子は記法で書けない**。 記法は図表の項目の識別子を名前から導く (`Sign up` なら
 * `sign-up`) 一方、preset は組み立て API で明示 識別子 を書いている (`signup`)。 節の題は
 * 「読む人が受け取るもの」 として比べるが、識別子はどこにも描かれない。
 *
 * 箱の識別子を比べない理由 (本 file の冒頭) と同じ。 そちらは宣言した preset だけ識別子まで
 * 見るが、図表の項目には宣言の仕組みを置かない = 記法側で合わせる手段が無いため。
 *
 * ## 落とすのではなく置き換える (Round 1 の指摘)
 *
 * `id` だけを落として `parent` を残すと、**指す先が居ない木が一致とみなされる**。
 * 木や放射の図は `parent` が他の項目の識別子を指すため、識別子を消すと参照の正しさを
 * 見る手掛かりが無くなる (実測 = `parent` に無い名前を書いても比較を通った)。
 *
 * そこで並び順から名前を作り (`#0` / `#1` ...)、**指す側も同じ名前に読み替える**。
 *
 * | 入力 | 置き換え後 |
 * |---|---|
 * | 識別子の付け方だけが違う同じ木 | 一致する |
 * | 親の違う木 | 一致しない |
 * | 居ない項目を指す木 | `未解決:<書かれた名前>` になり、解決できる木と一致しない |
 *
 * 中心 (`rootId`) は項目の並びに居ないため `#root` として別に名前を作る。
 */
const 参照する欄 = ["parent", "rootId", "dependsOn"] as const;

function 識別子を並び順に読み替える(v: unknown): unknown {
  if (Array.isArray(v)) {
    const 表 = 識別子の表(v);
    return v.map((x, i) => 項目を読み替える(x, 表, `#${i}`));
  }
  if (v === null || typeof v !== "object") return v;
  const o = v as Record<string, unknown>;
  // 放射の図は `{ rootId, rootTitle, branches: [...] }` の形。 中心は枝の並びに居ない
  if (Array.isArray(o.branches)) {
    const 表 = 識別子の表(o.branches);
    if (typeof o.rootId === "string") {
      if (表.has(o.rootId)) throw new Error(`放射の中心と枝で識別子 "${o.rootId}" が重複している`);
      表.set(o.rootId, "#root");
    }
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(o)) {
      if (k === "branches") {
        out[k] = (x as unknown[]).map((b, i) => 項目を読み替える(b, 表, `#${i}`));
      } else if ((参照する欄 as readonly string[]).includes(k)) {
        out[k] = 読み替えた参照(x, 表);
      } else {
        out[k] = x;
      }
    }
    return out;
  }
  const out: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(o)) out[k] = 識別子を並び順に読み替える(x);
  return out;
}

/** 並びの中の識別子から、並び順の名前への表を作る */
function 識別子の表(items: readonly unknown[]): Map<string, string> {
  const 表 = new Map<string, string>();
  items.forEach((x, i) => {
    if (x === null || typeof x !== "object") return;
    const id = (x as { id?: unknown }).id;
    if (typeof id === "string") {
      if (表.has(id)) throw new Error(`図表の識別子 "${id}" が重複している`);
      表.set(id, `#${i}`);
    }
  });
  return 表;
}

function 項目を読み替える(x: unknown, 表: Map<string, string>, 自分: string): unknown {
  if (x === null || typeof x !== "object") return x;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(x as Record<string, unknown>)) {
    if (k === "id") out[k] = 自分;
    else if ((参照する欄 as readonly string[]).includes(k)) out[k] = 読み替えた参照(v, 表);
    else out[k] = 識別子を並び順に読み替える(v);
  }
  return out;
}

/** 指す先を並び順の名前に読み替える。 居ない項目を指していたらそれと分かる形にする */
function 読み替えた参照(v: unknown, 表: Map<string, string>): unknown {
  if (typeof v !== "string") return v;
  return 表.get(v) ?? `未解決:${v}`;
}

type 中身の欄 = Record<string, unknown>;

/** 実物に現れた欄の和集合。 **両側から取る** = 片側にしか無い欄も差として出す */
function 現れた欄(左: readonly 中身の欄[], 右: readonly 中身の欄[]): string[] {
  const s = new Set<string>();
  for (const x of [...左, ...右]) for (const k of Object.keys(x)) s.add(k);
  return [...s].sort();
}

/**
 * 宣言に従って比べる形を作る。 **比べる欄は実物から決まる**。
 *
 * `undefined` は `null` に寄せる。 書いていない欄と `undefined` を書いた欄は
 * 読む人から見て同じなので、片方だけ落とすと差が出る。
 */
function 比べる形(
  xs: readonly 中身の欄[],
  相手: readonly 中身の欄[],
  宣言: 欄の宣言,
  読み替え: (欄名: string, 値: unknown) => unknown,
): string[] {
  const 見る欄 = 現れた欄(xs, 相手).filter((k) => !(k in 宣言.比べない));
  return xs.map((x) =>
    JSON.stringify(
      Object.fromEntries(見る欄.map((k) => [k, 読み替え(k, x[k] === undefined ? null : x[k])])),
    ),
  );
}

const 図表の欄 = new Set([
  "chartData",
  "funnelData",
  "ganttData",
  "quadrantData",
  "journeyData",
  "treeData",
  "mindData",
]);

/**
 * 箱の中身。 図表の項目の id は並び順から作る名前へ直す。
 *
 * 題だけを比べると、行や小見出しが落ちた記法を通してしまう (実測 = `er` の行を 1 つ削っても
 * 題は変わらず素通りした)。 読む人が見るのは中身なので、そこまで比べる。
 *
 * 縦列の読み替えは呼出側が渡す。 図を持たない検査 (図表の中身だけを見る下の describe) は
 * 縦列を持たないため、既定は素通しにする。
 */
function 中身(
  a: readonly 中身の欄[] | undefined,
  相手: readonly 中身の欄[] = a ?? [],
  縦列の見出し: (id: unknown) => unknown = (v) => v,
): string[] {
  return 比べる形(a ?? [], 相手, 箱の宣言, (k, v) => {
    if (k === "lane") return 縦列の見出し(v);
    if (図表の欄.has(k)) return 識別子を並び順に読み替える(v);
    return v;
  });
}

/** 図の縦列の id から見出しを引く。 見出しが無い縦列は id が分かる形で残す */
function 縦列の見出しを引く(d: Diagram): (id: unknown) => unknown {
  return (id) =>
    typeof id === "string"
      ? ((d.lanes ?? []).find((l) => l.id === id)?.label ?? `(見出し無し)`)
      : id;
}

/** 矢印の中身。 両端は読む人に見える名前へ直す */
function 矢印の中身(d: Diagram, 相手: Diagram): string[] {
  return 比べる形(d.edges, 相手.edges, 矢印の宣言, (k, v) =>
    (k === "from" || k === "to") && typeof v === "string" ? 箱の見える名前(d, v) : v,
  );
}

/** 縦列。 見出し / 幅 / 内包 / 生命線 をまとめて比べる */
function 縦列の中身(d: Diagram, 相手: Diagram): string[] {
  return 比べる形(d.lanes ?? [], 相手.lanes ?? [], 縦列の宣言, (_k, v) => v);
}

/** 段の中身と動き。 光らせる先は id の列なので別に比べる */
function 段の中身(d: Diagram, 相手: Diagram): string[] {
  return 比べる形(d.phases, 相手.phases, 段の宣言, (_k, v) => v);
}

/** 図の状態 (図表の値の入れ物)。 初期値が違うと最初に描かれる図が変わる */
function 状態(a: readonly 中身の欄[] | undefined, 相手: readonly 中身の欄[] = a ?? []): string[] {
  return 比べる形(a ?? [], 相手, 状態の宣言, (_k, v) => v);
}

/**
 * 出来事が指す相手を、読む人に見える名前へ直す (#1393)。
 *
 * 記法は識別子を書けないため、相手を名前で指して組み立てが識別子へ直す。 その識別子は
 * 組み立て API 側の識別子とは作り方が違う (実測 = `btn` に対し記法は `button`)。
 * 箱の id と同じ理由で、直接は比べられない。
 */
function 出来事の見える名前(d: Diagram, v: unknown): unknown {
  if (!Array.isArray(v)) return v;
  const 表 = 見える名前の表(d);
  return v.map((e) => {
    const o = e as { target?: { kind?: string; id?: string } };
    const t = o.target;
    if (!t || t.kind === "diagram" || typeof t.id !== "string") return e;
    return { ...o, target: { kind: t.kind, id: 表.get(t.id) ?? `(不明:${t.id})` } };
  });
}

/** 図の直下 (題など)。 まとまりは対象ごとに別で比べる */
function 図の直下(d: Diagram, 相手: Diagram, 図種を外す = false): string {
  const 宣言: 欄の宣言 = 図種を外す
    ? {
        ...図の直下の宣言,
        比べない: {
          ...図の直下の宣言.比べない,
          type: "組み立て器が図種を持つ見本は専用検査で比べる",
        },
      }
    : 図の直下の宣言;
  return (
    比べる形([d], [相手], 宣言, (k, v) =>
      k === "eventBindings" ? 出来事の見える名前(d, v) : v,
    )[0] ?? ""
  );
}

/**
 * 実物に現れた欄が、すべて宣言を通っているか (#1273)。
 *
 * **比べる欄を列挙していた頃の穴を塞ぐ検査**。 比べ方を反転しても、新しい欄が増えた時に
 * 誰も気付かなければ同じことが起きる。 実物から欄を集め、比べる / 読み替える / 比べない の
 * どれにも入っていない欄があれば落とす。
 *
 * 「比べる」 は宣言に列挙しない (それをやめたのが本 Issue) ので、ここで見るのは
 * **読み替えと比べないの宣言が実物と食い違っていないか** になる。 具体的には、
 * 宣言に書いたのに実物に無い欄を落とす = 消えた欄の宣言が残り続けるのを防ぐ。
 */
function 実物に無い宣言(実物: readonly 中身の欄[], 宣言: 欄の宣言): string[] {
  const ある = new Set(実物.flatMap((x) => Object.keys(x)));
  const 宣言した = [...Object.keys(宣言.比べない), ...Object.keys(宣言.読み替える ?? {})];
  return 宣言した.filter((k) => !ある.has(k)).sort();
}

describe("図表と状態の一致検査", () => {
  it.each([
    "chartData",
    "funnelData",
    "ganttData",
    "quadrantData",
    "journeyData",
    "treeData",
    "mindData",
  ] as const)("%s の差を検出する", (field) => {
    // **`id` で差をつけてはいけない**。 `id` は比較から落としているため、それで差をつけると
    // 検査が常に通り、比較関数が壊れても気付けない (実測で恒真になった)。 描かれる欄で見る
    expect(中身([{ [field]: [{ title: "a" }] }])).not.toEqual(
      中身([{ [field]: [{ title: "b" }] }]),
    );
  });

  it.each([
    "chartData",
    "funnelData",
    "ganttData",
    "quadrantData",
    "journeyData",
    "treeData",
    "mindData",
  ] as const)("%s の id だけの差は見ない", (field) => {
    // 落としていることを検査でも残す。 記法は図表の項目の id を名前から導くため
    // (`Sign up` なら `sign-up`)、preset の明示 id (`signup`) と揃える手段が無い。
    // **この判断は目に見えないところで効くので、意図として固定しておく**
    expect(中身([{ [field]: [{ id: "a", title: "x" }] }])).toEqual(
      中身([{ [field]: [{ id: "b", title: "x" }] }]),
    );
  });

  it("入れ子の中の id も落とす", () => {
    // 放射の図は `mindData: { rootId, rootTitle, branches: [{ id, ... }] }` の形で、
    // 落とす対象が 1 段深い所にも出る
    expect(中身([{ mindData: { rootId: "r", branches: [{ id: "x", title: "枝" }] } }])).toEqual(
      中身([{ mindData: { rootId: "r", branches: [{ id: "y", title: "枝" }] } }]),
    );
    expect(中身([{ mindData: { branches: [{ id: "x", title: "枝" }] } }])).not.toEqual(
      中身([{ mindData: { branches: [{ id: "x", title: "別" }] } }]),
    );
  });

  it("居ない項目を指す木は、指す先のある木と一致しない (Round 1 の指摘)", () => {
    // 識別子を落とすだけだと、`parent` の指す先が居なくても比較を通ってしまう。
    // 並び順に読み替えることで、解決できない参照が `未解決:` として残り差になる
    const 指す先あり = {
      treeData: [
        { id: "a", title: "親" },
        { id: "b", title: "子", parent: "a" },
      ],
    };
    const 指す先なし = {
      treeData: [
        { id: "a", title: "親" },
        { id: "b", title: "子", parent: "居ない" },
      ],
    };
    expect(中身([指す先あり])).not.toEqual(中身([指す先なし]));
  });

  it("重複する識別子で参照先が曖昧な木を通さない (Round 2 の指摘)", () => {
    // Map の後勝ちにすると、`x` は 2 番目の親を指す形へ読み替わり、正常な木と一致してしまう。
    // 描画側では同じ識別子の親が 2 つあり参照先を一意に決められないため、比較前に落とす
    const 重複あり = {
      treeData: [
        { id: "x", title: "親 1" },
        { id: "x", title: "親 2" },
        { id: "child", title: "子", parent: "x" },
      ],
    };
    expect(() => 中身([重複あり])).toThrow('図表の識別子 "x" が重複している');
  });

  it("放射の中心と枝で識別子が重なる形を通さない", () => {
    const 重複あり = {
      mindData: { rootId: "same", branches: [{ id: "same", title: "枝", parent: "same" }] },
    };
    expect(() => 中身([重複あり])).toThrow('放射の中心と枝で識別子 "same" が重複している');
  });

  it("識別子の付け方だけが違う同じ木は一致する", () => {
    // 記法は名前から識別子を導き (`Sign up` なら `sign-up`)、preset は明示 識別子 を書く。
    // 形が同じなら通す = これが通らないと記法を書けない
    const 記法ふう = {
      treeData: [
        { id: "eng-manager", title: "親" },
        { id: "ops", title: "子", parent: "eng-manager" },
      ],
    };
    const 見本ふう = {
      treeData: [
        { id: "eng", title: "親" },
        { id: "op", title: "子", parent: "eng" },
      ],
    };
    expect(中身([記法ふう])).toEqual(中身([見本ふう]));
  });

  it("放射の図でも中心を指す枝が読み替わる", () => {
    const 記法ふう = {
      mindData: { rootId: "theme", branches: [{ id: "f", title: "枝", parent: "theme" }] },
    };
    const 見本ふう = {
      mindData: { rootId: "root", branches: [{ id: "feat", title: "枝", parent: "root" }] },
    };
    expect(中身([記法ふう])).toEqual(中身([見本ふう]));
  });

  it("放射の図で枝の親が違えば一致しない", () => {
    // 中心の直下に並べた形と、枝の下に入れ子にした形を分ける = mind の記法が書けない差そのもの
    const 平ら = {
      mindData: {
        rootId: "r",
        branches: [
          { id: "a", title: "A", parent: "r" },
          { id: "b", title: "B", parent: "r" },
        ],
      },
    };
    const 入れ子 = {
      mindData: {
        rootId: "r",
        branches: [
          { id: "a", title: "A", parent: "r" },
          { id: "b", title: "B", parent: "a" },
        ],
      },
    };
    expect(中身([平ら])).not.toEqual(中身([入れ子]));
  });

  it("工程の前後関係も読み替える", () => {
    // **識別子の付け方だけが違う形で見る**。 指す先が居ない形との差だけを見ると、
    // 読み替えを外しても文字列が違うまま通ってしまい、検査が空振りする (変異試験で判明)
    const 記法ふう = {
      ganttData: [
        { id: "design", title: "設計" },
        { id: "build", title: "作る", dependsOn: "design" },
      ],
    };
    const 見本ふう = {
      ganttData: [
        { id: "d", title: "設計" },
        { id: "b", title: "作る", dependsOn: "d" },
      ],
    };
    expect(中身([記法ふう]), "識別子の付け方だけで差になる").toEqual(中身([見本ふう]));
  });

  it("工程の前後関係が違えば一致しない", () => {
    const 順に並ぶ = {
      ganttData: [
        { id: "a", title: "1" },
        { id: "b", title: "2", dependsOn: "a" },
      ],
    };
    const 前後なし = {
      ganttData: [
        { id: "a", title: "1" },
        { id: "b", title: "2" },
      ],
    };
    const 指す先なし = {
      ganttData: [
        { id: "a", title: "1" },
        { id: "b", title: "2", dependsOn: "居ない" },
      ],
    };
    expect(中身([順に並ぶ])).not.toEqual(中身([前後なし]));
    expect(中身([順に並ぶ])).not.toEqual(中身([指す先なし]));
  });

  it.each([
    ["rootId", { mindData: { rootId: "a" } }, { mindData: { rootId: "b" } }],
    [
      "parent",
      { mindData: { branches: [{ title: "枝", parent: "a" }] } },
      { mindData: { branches: [{ title: "枝", parent: "b" }] } },
    ],
    [
      "treeData の parent",
      { treeData: [{ title: "子", parent: "a" }] },
      { treeData: [{ title: "子", parent: "b" }] },
    ],
  ] as const)("%s の差は残る (図の形が変わるため)", (_name, 左, 右) => {
    // **指す側の欄は消さない**。 `rootId` / `parent` / `dependsOn` は他の項目を指して
    // 親子関係や前後関係を作るため、消すと **形の違う木が一致とみなされる**
    expect(中身([左])).not.toEqual(中身([右]));
  });

  it("状態の id と初期値の差を検出する", () => {
    expect(状態([{ id: "value", initial: 1 }])).not.toEqual(状態([{ id: "other", initial: 1 }]));
    expect(状態([{ id: "value", initial: 1 }])).not.toEqual(状態([{ id: "value", initial: 2 }]));
  });
});

/** 矢印が読む人に見せる中身。 説明 / 補足 / 色 / 線種 */
describe("記法が組み立て API と同じ図になる (#1237)", () => {
  it("対象を 1 件以上見つけている", () => {
    // 0 件だと以下の検査が空回りする = 記法を 1 つも書いていないのに全部通る
    expect(対象.length, "`sourceYaml__<key>` を持つ見本が 1 件も無い").toBeGreaterThan(0);

    // **module ごとに 1 件以上見ている**。 全体の件数だけだと、片方の module の import を
    // 落としても残り側の件数で通ってしまう (実測で patterns を外しても通った)
    for (const [名, mod] of 記法を持つカタログ) {
      const 件数 = Object.keys(mod).filter((k) => k.startsWith("sourceYaml__")).length;
      expect(件数, `${名} に記法つきの見本が 1 件も無い (検査が空振りしている)`).toBeGreaterThan(0);
    }
  });

  it("宣言した欄が実物に残っている", () => {
    // **宣言が古くなったまま残らないようにする** (#1273)。 比べる欄を列挙するのをやめても、
    // 比べない / 読み替える の宣言が実物と食い違えば同じ穴が開く = 消えた欄の宣言が残ると、
    // 同じ名前の欄が別の意味で復活した時に黙って比較から外れる。
    //
    // 逆向き (実物にあって宣言に無い欄) は宣言が要らない。 反転したので、宣言していない欄は
    // **既定で比べる** = 増えた欄は必ず比較に入る。
    const 全部 = [
      ...対象.map((t) => t.built),
      ...対象.map((t) => textDslToDiagram(t.yaml, { partsCatalog: 部品の一覧 })),
    ];
    const 対象ごと: [string, 中身の欄[], 欄の宣言][] = [
      ["箱", 全部.flatMap((d) => d.nodes), 箱の宣言],
      ["矢印", 全部.flatMap((d) => d.edges), 矢印の宣言],
      ["縦列", 全部.flatMap((d) => d.lanes ?? []), 縦列の宣言],
      ["段", 全部.flatMap((d) => d.phases), 段の宣言],
      ["状態", 全部.flatMap((d) => d.states ?? []), 状態の宣言],
      ["図の直下", 全部, 図の直下の宣言],
    ];
    for (const [名, 実物, 宣言] of 対象ごと) {
      expect(実物.length, `${名} が 1 件も無い (検査が空振りしている)`).toBeGreaterThan(0);
      expect(実物に無い宣言(実物, 宣言), `${名} の宣言に、実物に無い欄がある`).toEqual([]);
    }
  });

  for (const t of 対象) {
    describe(t.key, () => {
      // 部品を箱に使う見本 (#1973) は部品の一覧を渡して書き出してあるので、同じ一覧を渡す。
      // 注意もこの 1 回で集める = 注意を受け取っても組み立ての結果は変わらない
      const 注意: string[] = [];
      const 記法 = textDslToDiagram(t.yaml, {
        partsCatalog: 部品の一覧,
        onNotice: (n) => 注意.push(`${n.kind}: ${n.message}`),
      });

      it("箱の中身が一致する", () => {
        // **題を先に比べる**。 中身は題も比べるので、題が違えば中身も違う。 先に比べるのは
        // 落ちた時に題の並びだけの差を読めるようにするため
        expect(題(記法.nodes), "箱の数か題が違う").toEqual(題(t.built.nodes));
        // 題だけを見ていると、行や小見出しが落ちた記法を通してしまう (実測 = er の行を
        // 1 つ削っても題は変わらず素通りした)。 読む人が見るのは中身なので、そこまで比べる
        expect(中身(記法.nodes, t.built.nodes, 縦列の見出しを引く(記法))).toEqual(
          中身(t.built.nodes, 記法.nodes, 縦列の見出しを引く(t.built)),
        );
      });

      it("図の状態が一致する", () => {
        // 図表は値を状態に持たせて段で動かす。 初期値が違うと最初に描かれる図が変わる
        expect(状態(記法.states, t.built.states)).toEqual(状態(t.built.states, 記法.states));
      });

      it("矢印の中身が一致する", () => {
        // **説明を先に比べる**。 矢印の中身は説明も比べるので、説明が違えば中身も違う。
        // 先に比べるのは落ちた時に説明の並びだけの差を読めるようにするため
        expect(説明(記法.edges), "矢印の数か説明が違う").toEqual(説明(t.built.edges));
        expect(矢印の中身(記法, t.built)).toEqual(矢印の中身(t.built, 記法));
      });

      it("矢印の両端と向きが一致する", () => {
        // **説明だけを比べても足りない** (Round 1 の指摘)。 `User -> Order` を
        // `Order -> User` に反転しても説明は変わらないため、向きの違う図が通っていた
        expect(矢印の両端(記法), "矢印の向きか繋ぎ先が違う").toEqual(矢印の両端(t.built));
      });

      it("描いた図が一致する", () => {
        // **大きさだけを比べても足りない** (#1273)。 枠は同じで中身が違う図が通っていた
        // (実測 = 順序図の生命線が組立て API は `y2=848`、記法は `y2=948` で 100 長かった。
        // 原因は footer の `role` 欠落で、枠の大きさには出ない)。
        //
        // **欄を 1 つずつ比べる形では追いつかない**。 比べる欄を列挙していた間に 15 欄が
        // 漏れており、欄が増えるたびに同じことが起きる。 描いた図そのものを比べれば、
        // どの欄が増えても見た目に出る差は必ず捕まる。
        //
        // id は記法と組立て API で作り方が違うため落とす (本 file 冒頭)。 落とすのは
        // id を載せる欄と、id を埋め込む塗り (`url(#...)`) だけで、座標も色も残す。
        // 光らせる先に宣言した差がある図は、その差が枠線の太さと色に出る。
        // **図ごと飛ばすと、その図だけ描画の比較が丸ごと抜ける** (Round 1 の指摘)。
        // 宣言した id を光らせる先から外してから比べれば、光らせ方以外は見られる。
        // 光らせ方の差そのものは `段が光らせる先が一致する` が宣言付きで見る
        const 外す = new Set(差の宣言.光らせる先の既知の差[t.key] ?? []);
        // 組み立て器が図種を持たない見本と、記法に同じ図種が無い見本は、SVG の属性だけを
        // 外す。図種そのものの契約は下の専用検査と catalog-diagram-type が分担して見る
        const 図種を外す = t.built.type == null || t.key in 差の宣言.図種の既知の差;
        const 記法の絵 = 見た目(記法, new Set(), 図種を外す);
        const 組立の絵 = 見た目(t.built, 外す, 図種を外す);

        // **大きさを先に比べる** (#1260)。 箱の題も矢印も段も同じなのに、描くと大きさの違う図が
        // 7 件通っていた (実測 = viewBox が 785x488 対 712x600 等)。 原因は図表の箱の大きさと、
        // 後ろへ戻る矢印の回し方の 2 系統で、どちらも中身の比較には現れない。
        //
        // 大きさは絵に含まれるので、絵が一致すれば大きさも一致する。 先に比べるのは、落ちた時に
        // 絵の全文ではなく 4 つの数の差を読めるようにするため。 読めないまま通さない
        expect(描いた大きさ(組立の絵), "組立て API 側の絵から大きさを読めない").not.toBe("(読めない)");
        expect(描いた大きさ(記法の絵), "描いた図の大きさが違う").toBe(描いた大きさ(組立の絵));
        expect(記法の絵, "描いた図が違う").toBe(組立の絵);
      });

      it("縦列の中身が一致する", () => {
        // 幅が違うと箱の並ぶ間隔が変わる = 配置が変わる。 見出しと違って画面に直接出る
        // (実測 = 入れ子の状態遷移図は元 280 に対し記法経由で 320 になり、レビューで指摘された)。
        //
        // 自動生成される縦列の id は hyphen を含む (`lane-idle` 等)。 #1241 で `lanes:` ブロックが
        // その形を受けるようになったため、**記法側で幅を書き直せる** (`presetStateMachine` が
        // 370 をそう書いている)。
        //
        // **幅だけを見ていた** (#1273)。 内包 (`contain`) と生命線 (`lifeline`) は
        // どちらも描画に出るのに比較対象から漏れていた。 id 以外をまとめて見る。
        // 見出しは既知の差の宣言を持つため、下の検査が別に見る
        const 見出しを外す = (a: string[]): string[] =>
          a.map((x) =>
            JSON.stringify({ ...(JSON.parse(x) as Record<string, unknown>), label: null }),
          );
        expect(見出しを外す(縦列の中身(記法, t.built))).toEqual(
          見出しを外す(縦列の中身(t.built, 記法)),
        );
      });

      it("縦列の数と見出しが一致する (既知の差は宣言したものだけ)", () => {
        // 数だけを見ていると、見出し (`Authentication Flow` 等) が落ちた記法を通してしまう。
        // 縦列の見出しは画面に出る字なので、そこまで比べる。 id は名前から導かれるため見ない
        const 見出し = (a: readonly { label?: string }[] | undefined): string[] =>
          (a ?? []).map((x) => x.label ?? "");
        if (t.key in 差の宣言.縦列の見出しの既知の差) {
          // 見出しは違っても **数は合わせる** = 縦列が増減したら画面の配置が変わる
          expect((記法.lanes ?? []).length).toBe((t.built.lanes ?? []).length);
          // 宣言した差が解消したら落とす = 宣言が古くなったまま残らない
          expect(見出し(記法.lanes), `${t.key} の差が解消している。 宣言から外すこと`).not.toEqual(
            見出し(t.built.lanes),
          );
          return;
        }
        expect(見出し(記法.lanes)).toEqual(見出し(t.built.lanes));
      });

      it("図の直下が一致する", () => {
        // 題 (`topic`) は画面の見出しに出るのに比較対象から漏れていた (#1273)。
        // まとまり (箱 / 矢印 / 縦列 / 段 / 状態) は対象ごとに別で比べる
        // 汎用の `diagram()` は図種を持たないため相手がある時だけ比べる。両経路が図種を
        // 持つのに一致しない 3 件だけは、下の差の宣言を通して外す
        const 図種を外す = t.built.type == null || t.key in 差の宣言.図種の既知の差;
        expect(図の直下(記法, t.built, 図種を外す)).toBe(図の直下(t.built, 記法, 図種を外す));
      });

      it("組み立て器が種類を持つ時は、記法経路の種類と一致する (既知の差は宣言したものだけ)", () => {
        const 図種の差 = 差の宣言.図種の既知の差[t.key];
        if (図種の差 !== undefined) {
          expect(t.key, "図種の差に書いた見本名が鍵と違う").toBe(図種の差.見本);
          expect(記法.type, `${t.key} の記法経路の種類が宣言と違う`).toBe(図種の差.記法経路);
          expect(t.built.type, `${t.key} の組み立て器経路の種類が宣言と違う`).toBe(
            図種の差.組み立て器経路,
          );
          expect(記法.type, `${t.key} の図種差が解消している。 宣言から外すこと`).not.toBe(
            t.built.type,
          );
          return;
        }
        if (t.built.type != null) {
          expect(記法.type, `${t.key} の図の種類が違う`).toBe(t.built.type);
        }
      });

      it("段の中身が並びごと一致する", () => {
        expect(段の中身(記法, t.built)).toEqual(段の中身(t.built, 記法));
      });

      it("段が描く先が一致する", () => {
        // 描く先が違うと、線が伸びる図と静止したままの図に分かれる。
        // id は作り方が違うため、見える名前へ直してから比べる (#1351)
        expect(描く先(記法)).toEqual(描く先(t.built));
      });

      it("段が光らせる先が一致する (既知の差は宣言したものだけ)", () => {
        // **数だけを比べても足りない** (Round 1 の指摘)。 `User` の代わりに `Order` を
        // 光らせても数が同じなら通っていた。 読む人に見える名前へ読み替えて比べる
        // 記法で光らせ分けられない矢印は **両側から** 外す (#1371)
        const 外す説明 = 差の宣言.光らせ分けられない矢印[t.key] ?? [];
        const 説明が合う矢印 = (d: Diagram): Set<string> =>
          new Set(d.edges.filter((e) => 外す説明.includes(e.label ?? "")).map((e) => e.id));
        const 記法から外す = 説明が合う矢印(記法);
        const 組立から外す = 説明が合う矢印(t.built);
        if (外す説明.length > 0) {
          // 宣言した説明の矢印が両側に実在すること = 説明を書き換えたら宣言が空振りする
          expect(記法から外す.size, `${t.key} の宣言した説明の矢印が記法側に無い`).toBe(
            外す説明.length,
          );
          expect(組立から外す.size, `${t.key} の宣言した説明の矢印が組立て API 側に無い`).toBe(
            外す説明.length,
          );
          // 宣言した差が解消したら落とす = 宣言が古くなったまま残らない
          expect(
            光らせる先(記法),
            `${t.key} の矢印の光らせ分けの差が解消している。 宣言から外すこと`,
          ).not.toEqual(光らせる先(t.built));
        }
        const 記法側 = 光らせる先(記法, 記法から外す);
        if (t.key in 差の宣言.光らせる先の既知の差) {
          const 既知の差 = new Set(差の宣言.光らせる先の既知の差[t.key]);
          const 組立側の全対象 = new Set(t.built.phases.flatMap((p) => p.activate));
          const 宣言したが光らない対象 = [...既知の差].filter((id) => !組立側の全対象.has(id));
          expect(
            宣言したが光らない対象,
            `${t.key} の既知の差に、実際には光らない対象がある`,
          ).toEqual([]);

          const 組立側 = 光らせる先(t.built, new Set([...既知の差, ...組立から外す]));
          expect(記法側, `${t.key} で宣言外の光らせる先が違う`).toEqual(組立側);
          // 宣言した差が解消したら落とす = 宣言が古くなったまま残らない
          expect(記法側, `${t.key} の差が解消している。 宣言から外すこと`).not.toEqual(
            光らせる先(t.built),
          );
          // 解決できていない形 (全段 0) は差ではなく壊れなので、別に落とす
          expect(
            記法側.some((a) => a.length > 0),
            `${t.key} で focus が 1 つも解決していない`,
          ).toBe(true);
          return;
        }
        const 組立側 = 光らせる先(t.built, 組立から外す);
        expect(記法側).toEqual(組立側);
      });

      it("記法の組み立てが注意を 1 件も出さない", () => {
        // **注意は画面に出ない**。 一覧は組み立て時の注意を受け取らないため、
        // 光らせ忘れ (`focus-target-missing`) のような取りこぼしが黙って残る。
        //
        // 実測 = 箱の名前に空白があると `focus: [働き手 1]` が 2 つの名前として読まれ、
        // どちらも実在しないので何も光らない。 記法は全件を引用符付きで書く。
        const 宣言 = 差の宣言.注意が出る見本[t.key];
        if (宣言 === undefined) {
          expect(注意, `${t.key} の記法が注意を出している`).toEqual([]);
          return;
        }
        // 宣言した種類と実物が食い違ったら落とす = 別の取りこぼしが宣言に紛れ込まない
        expect(
          注意.map((s) => s.split(":")[0]).sort(),
          `${t.key} の注意が宣言した種類と違う`,
        ).toEqual([...宣言.種類].sort());
        // 注意が出なくなったら落とす = 宣言が古くなったまま残らない
        expect(注意.length, `${t.key} の注意が出なくなっている。 宣言から外すこと`).toBeGreaterThan(0);
      });

      if (差の宣言.id完全一致.includes(t.key)) {
        it("id まで完全に一致する", () => {
          expect(ids(記法.nodes)).toEqual(ids(t.built.nodes));
          expect(ids(記法.edges)).toEqual(ids(t.built.edges));
          expect(ids(記法.lanes)).toEqual(ids(t.built.lanes));
        });
      }
    });
  }

  /** 宣言 1 つ分の鍵。 並びはそのまま、表は鍵の集まり */
  const 宣言の鍵 = (v: Record<string, unknown> | readonly string[]): readonly string[] =>
    Array.isArray(v) ? v : Object.keys(v);

  it("宣言が全て実在する preset を指す", () => {
    // 宣言だけ残って対象が消えた形を落とす
    const 実在 = new Set(対象.map((t) => t.key));
    // 0 件だと下の照合が「対象なし」 で素通りする
    expect(実在.size, "記法を持つ preset が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);
    const 並び = Object.entries(差の宣言);
    expect(並び.length, "差の宣言が 1 つも無い (束ねが空)").toBeGreaterThan(0);
    // 全部が空だと、鍵を見る経路が 1 度も走らない
    expect(
      並び.reduce((n, [, v]) => n + 宣言の鍵(v).length, 0),
      "宣言が 1 件も無い (鍵を見る経路が走っていない)",
    ).toBeGreaterThan(0);

    const 幽霊: string[] = [];
    for (const [名, v] of 並び) {
      for (const k of 宣言の鍵(v)) if (!実在.has(k)) 幽霊.push(`${名}: ${k}`);
    }
    expect(幽霊, "宣言されているが記法を持たない preset").toEqual([]);
  });
});

/**
 * 一覧に載る記法が 1 つ残らず対象に入っているか (#1403)。
 *
 * 対象 (`記法を持つカタログ`) は手で並べるため、ページを足した時に **ここへ足し忘れる**。
 * 忘れても本 file は通る = 検査の件数が減るだけで、何も落ちない。
 *
 * 実際 `charts` と `text-dsl` が一覧に載りながら漏れており、記法から作った図が組み立ての
 * 図と一致するかを **誰も確かめていなかった**。
 *
 * **件数は書かない**。 見本が増えれば動く値で、書くと必ずずれる
 * (`rules/quality.md § 導出可能記述は人手で書かない`)。 実際どれだけ漏れているかは
 * 下の検査が名指しで並べる。
 *
 * ## 一覧を SSOT にする
 *
 * 画面が読む一覧 (`CATALOG_ITEMS`) が「どの見本が記法を持つか」 の実物になる。
 * そこから導いて対象と突き合わせれば、次にページを足した時も漏れが落ちる。
 *
 * ## 両方向で見る
 *
 * 一覧にあって対象に無いのが漏れ。 逆に対象にあって一覧に無いのは、画面に出ない見本を
 * 比べている形で、宣言 (`比べない` / `読み替える`) が意図しない図に効く元になる。
 */
describe("一覧に載る記法が 1 つ残らず対象に入っている (#1403)", () => {
  it("一覧の記法つき見本が 1 件以上ある", async () => {
    // 空振り防止。 一覧を読めていないと下の 2 件が両方とも「差が無い」 で通る
    const 一覧 = await 一覧の記法つき();
    expect(一覧.length, "一覧から記法つきの見本を 1 件も集められていない").toBeGreaterThan(0);
  });

  it("一覧にあって対象に無い見本が無い", async () => {
    const 漏れ = 差分(
      await 一覧の記法つき(),
      対象.map((t) => t.key),
    );
    expect(漏れ, "一覧に記法があるのに一致検査の対象に入っていない見本").toEqual([]);
  });

  it("対象にあって一覧に無い見本が無い", async () => {
    const 余り = 差分(
      対象.map((t) => t.key),
      await 一覧の記法つき(),
    );
    expect(余り, "一致検査の対象だが一覧に出ない見本").toEqual([]);
  });
});
