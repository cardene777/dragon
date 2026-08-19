/**
 * preset の記法と組み立て API の一致検査 (#1237)。
 *
 * catalog の図の多くは記法 (`sourceYaml`) を持たず、画面で「コード」 を見られず
 * 「エディタで開く」 も押せなかった。 記法を書き足すにあたり、**書いた記法が本当に同じ図に
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
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "@cardenelabs/dragon";
import type { CdlDiagram } from "@cardenelabs/cdl";
import * as Presets from "@/topics/catalog/presets.cdl";

/**
 * id まで完全に一致する preset。
 *
 * 記法の id 生成規則 (名前の slug) と preset の明示 id がたまたま揃っているもの。
 * 実測で確かめた分だけを載せる。
 *
 * **`animation:` を書くと矢印の id が変わる図種がある** (実測 = `type: state` は
 * `t0-idle-loading` だが、`animation:` を足すと `e0-idle-loading` になる)。 段を合わせるには
 * `animation:` が要るため、その図種は id 一致を諦めて骨格の一致で見る。
 */
const id完全一致: readonly string[] = ["presetSequence"];

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

const 光らせる先の既知の差: Record<string, string> = {
  // 順序図の縦線 (`user-header` 等) は `focus:` が受け付けない (`focus.ts` が縦列の id を
  // 意図的に拒否する)。 組み立て API は最初の段から縦線を光らせて「誰の時間軸か」 を
  // 読ませているが、記法には書く手段が無い。 骨格と字は一致する。
  presetSequence: "縦線を光らせる指定が記法に無い",
};

type Diagram = CdlDiagram;

/** `sourceYaml__<key>` を持つ preset を集める */
function 記法つき(): { key: string; yaml: string; built: Diagram }[] {
  const mod = Presets as unknown as Record<string, unknown>;
  const out: { key: string; yaml: string; built: Diagram }[] = [];
  for (const [k, v] of Object.entries(mod)) {
    if (!k.startsWith("sourceYaml__") || typeof v !== "string") continue;
    const key = k.slice("sourceYaml__".length);
    const built = mod[key];
    // 記法だけあって図が無い形を落とす。 通すと「比べる相手が無いのに通った」 になる
    if (built === null || typeof built !== "object") {
      throw new Error(`sourceYaml__${key} に対応する preset export が無い`);
    }
    out.push({ key, yaml: v, built: built as Diagram });
  }
  return out;
}

const 対象 = 記法つき();
const ids = (a: readonly { id: string }[] | undefined): string[] => (a ?? []).map((x) => x.id);
const 題 = (a: readonly { title?: string }[] | undefined): string[] => (a ?? []).map((x) => x.title ?? "");
const 説明 = (a: readonly { label?: string }[] | undefined): string[] => (a ?? []).map((x) => x.label ?? "");

/**
 * 箱が読む人に見せる中身。 種類 / 小見出し / 上の小見出し / 行 / 値。
 *
 * 題だけを比べると、行や小見出しが落ちた記法を通してしまう (実測 = `er` の行を 1 つ削っても
 * 題は変わらず素通りした)。 読む人が見るのは中身なので、そこまで比べる。
 *
 * 座標と色は見ない = 組み立て API 側の既定に依存し、記法で書かない限り一致する保証が無い。
 */
type 箱の中身 = {
  kind?: string;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  value?: string;
  rows?: string[];
  /**
   * 図表の中身。 図表の preset は箱を 1 つだけ作り、そこに配列を丸ごと載せる
   * (`presets.cdl.ts` の `bindFirstNode`)。 **ここを比べないと図表の記法は素通りする** =
   * 箱の題と種類だけ合わせれば、中身が空でも一致とみなされる
   */
  chartData?: unknown;
  funnelData?: unknown;
  ganttData?: unknown;
  quadrantData?: unknown;
  journeyData?: unknown;
  treeData?: unknown;
  mindData?: unknown;
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

const 中身 = (a: readonly 箱の中身[] | undefined): string[] =>
  (a ?? []).map((x) =>
    JSON.stringify({
      kind: x.kind ?? "",
      title: x.title ?? "",
      subtitle: x.subtitle ?? "",
      eyebrow: x.eyebrow ?? "",
      value: x.value ?? "",
      rows: x.rows ?? [],
      chartData: 識別子を並び順に読み替える(x.chartData ?? null),
      funnelData: 識別子を並び順に読み替える(x.funnelData ?? null),
      ganttData: 識別子を並び順に読み替える(x.ganttData ?? null),
      quadrantData: 識別子を並び順に読み替える(x.quadrantData ?? null),
      journeyData: 識別子を並び順に読み替える(x.journeyData ?? null),
      treeData: 識別子を並び順に読み替える(x.treeData ?? null),
      mindData: 識別子を並び順に読み替える(x.mindData ?? null),
    }),
  );

/** 図の状態 (図表の値の入れ物)。 初期値が違うと最初に描かれる図が変わる */
const 状態 = (a: readonly { id: string; initial: unknown }[] | undefined): string[] =>
  (a ?? []).map((x) => JSON.stringify({ id: x.id, initial: x.initial }));

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
    expect(中身([{ [field]: [{ title: "a" }] }])).not.toEqual(中身([{ [field]: [{ title: "b" }] }]));
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
    const 指す先あり = { treeData: [{ id: "a", title: "親" }, { id: "b", title: "子", parent: "a" }] };
    const 指す先なし = { treeData: [{ id: "a", title: "親" }, { id: "b", title: "子", parent: "居ない" }] };
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
    const 記法ふう = { treeData: [{ id: "eng-manager", title: "親" }, { id: "ops", title: "子", parent: "eng-manager" }] };
    const 見本ふう = { treeData: [{ id: "eng", title: "親" }, { id: "op", title: "子", parent: "eng" }] };
    expect(中身([記法ふう])).toEqual(中身([見本ふう]));
  });

  it("放射の図でも中心を指す枝が読み替わる", () => {
    const 記法ふう = { mindData: { rootId: "theme", branches: [{ id: "f", title: "枝", parent: "theme" }] } };
    const 見本ふう = { mindData: { rootId: "root", branches: [{ id: "feat", title: "枝", parent: "root" }] } };
    expect(中身([記法ふう])).toEqual(中身([見本ふう]));
  });

  it("放射の図で枝の親が違えば一致しない", () => {
    // 中心の直下に並べた形と、枝の下に入れ子にした形を分ける = mind の記法が書けない差そのもの
    const 平ら = { mindData: { rootId: "r", branches: [{ id: "a", title: "A", parent: "r" }, { id: "b", title: "B", parent: "r" }] } };
    const 入れ子 = { mindData: { rootId: "r", branches: [{ id: "a", title: "A", parent: "r" }, { id: "b", title: "B", parent: "a" }] } };
    expect(中身([平ら])).not.toEqual(中身([入れ子]));
  });

  it("工程の前後関係も読み替える", () => {
    // **識別子の付け方だけが違う形で見る**。 指す先が居ない形との差だけを見ると、
    // 読み替えを外しても文字列が違うまま通ってしまい、検査が空振りする (変異試験で判明)
    const 記法ふう = { ganttData: [{ id: "design", title: "設計" }, { id: "build", title: "作る", dependsOn: "design" }] };
    const 見本ふう = { ganttData: [{ id: "d", title: "設計" }, { id: "b", title: "作る", dependsOn: "d" }] };
    expect(中身([記法ふう]), "識別子の付け方だけで差になる").toEqual(中身([見本ふう]));
  });

  it("工程の前後関係が違えば一致しない", () => {
    const 順に並ぶ = { ganttData: [{ id: "a", title: "1" }, { id: "b", title: "2", dependsOn: "a" }] };
    const 前後なし = { ganttData: [{ id: "a", title: "1" }, { id: "b", title: "2" }] };
    const 指す先なし = { ganttData: [{ id: "a", title: "1" }, { id: "b", title: "2", dependsOn: "居ない" }] };
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
const 矢印の中身 = (
  a: readonly { label?: string; sub?: string; tone?: string; style?: string }[] | undefined,
): string[] =>
  (a ?? []).map((x) =>
    JSON.stringify({ label: x.label ?? "", sub: x.sub ?? "", tone: x.tone ?? "", style: x.style ?? "" }),
  );

/** 段が読む人に見せる中身と動き。 光らせる先は id 差があるので別に比べる */
const 段の中身 = (a: Diagram["phases"]): string[] =>
  a.map((x) =>
    JSON.stringify({
      duration: x.duration,
      title: x.title,
      body: x.body,
      badge: x.badge ?? "",
      tweens: x.tweens,
      sets: x.sets,
    }),
  );

describe("記法が組み立て API と同じ図になる (#1237)", () => {
  it("対象を 1 件以上見つけている", () => {
    // 0 件だと以下の検査が空回りする = 記法を 1 つも書いていないのに全部通る
    expect(対象.length, "`sourceYaml__<key>` を持つ preset が 1 件も無い").toBeGreaterThan(0);
  });

  for (const t of 対象) {
    describe(t.key, () => {
      const 記法 = textDslToDiagram(t.yaml);

      it("箱の数と題が一致する", () => {
        expect(題(記法.nodes)).toEqual(題(t.built.nodes));
      });

      it("箱の中身が一致する", () => {
        // 題だけを見ていると、行や小見出しが落ちた記法を通してしまう (実測 = er の行を
        // 1 つ削っても題は変わらず素通りした)。 読む人が見るのは中身なので、そこまで比べる
        expect(中身(記法.nodes)).toEqual(中身(t.built.nodes));
      });

      it("図の状態が一致する", () => {
        // 図表は値を状態に持たせて段で動かす。 初期値が違うと最初に描かれる図が変わる
        expect(状態(記法.states)).toEqual(状態(t.built.states));
      });

      it("矢印の数と説明が一致する", () => {
        expect(説明(記法.edges)).toEqual(説明(t.built.edges));
      });

      it("矢印の中身が一致する", () => {
        expect(矢印の中身(記法.edges)).toEqual(矢印の中身(t.built.edges));
      });

      it("縦列の幅が一致する", () => {
        // 幅が違うと箱の並ぶ間隔が変わる = 配置が変わる。 見出しと違って画面に直接出る
        // (実測 = 拡張ステート図は元 280 に対し記法経由で 320 になり、レビューで指摘された)。
        // 自動生成される縦列の id は hyphen を含みうるが、記法の `lanes:` ブロックは
        // 英数字と下線しか受けないため、その図種では幅を書き直せない
        const 幅 = (a: readonly { width?: number }[] | undefined): (number | undefined)[] =>
          (a ?? []).map((x) => x.width);
        expect(幅(記法.lanes)).toEqual(幅(t.built.lanes));
      });

      it("縦列の数と見出しが一致する (既知の差は宣言したものだけ)", () => {
        // 数だけを見ていると、見出し (`Authentication Flow` 等) が落ちた記法を通してしまう。
        // 縦列の見出しは画面に出る字なので、そこまで比べる。 id は名前から導かれるため見ない
        const 見出し = (a: readonly { label?: string }[] | undefined): string[] =>
          (a ?? []).map((x) => x.label ?? "");
        if (t.key in 縦列の見出しの既知の差) {
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

      it("段の中身が並びごと一致する", () => {
        expect(段の中身(記法.phases)).toEqual(段の中身(t.built.phases));
      });

      it("段が光らせる先の数が一致する (既知の差は宣言したものだけ)", () => {
        // id は違いうるので数で見る。 0 と非 0 の取り違え (`focus:` が解決できていない形) は
        // これで落ちる
        const 記法側 = 記法.phases.map((p) => p.activate.length);
        const 組立側 = t.built.phases.map((p) => p.activate.length);
        if (t.key in 光らせる先の既知の差) {
          // 宣言した差が解消したら落とす = 宣言が古くなったまま残らない
          expect(記法側, `${t.key} の差が解消している。 宣言から外すこと`).not.toEqual(組立側);
          // 解決できていない形 (全段 0) は差ではなく壊れなので、別に落とす
          expect(記法側.some((n) => n > 0), `${t.key} で focus が 1 つも解決していない`).toBe(true);
          return;
        }
        expect(記法側).toEqual(組立側);
      });

      if (id完全一致.includes(t.key)) {
        it("id まで完全に一致する", () => {
          expect(ids(記法.nodes)).toEqual(ids(t.built.nodes));
          expect(ids(記法.edges)).toEqual(ids(t.built.edges));
          expect(ids(記法.lanes)).toEqual(ids(t.built.lanes));
        });
      }
    });
  }

  it("宣言が全て実在する preset を指す", () => {
    const 実在2 = new Set(対象.map((t) => t.key));
    const 幽霊2 = Object.keys(光らせる先の既知の差).filter((k) => !実在2.has(k));
    expect(幽霊2, "光らせる先の既知の差に宣言されているが記法を持たない preset").toEqual([]);
    const 幽霊4 = Object.keys(縦列の見出しの既知の差).filter((k) => !実在2.has(k));
    expect(幽霊4, "縦列の見出しの既知の差に宣言されているが記法を持たない preset").toEqual([]);
  });

  it("id 完全一致の宣言が全て実在する preset を指す", () => {
    // 宣言だけ残って対象が消えた形を落とす
    const 実在 = new Set(対象.map((t) => t.key));
    const 幽霊 = id完全一致.filter((k) => !実在.has(k));
    expect(幽霊, "id 完全一致に宣言されているが記法を持たない preset").toEqual([]);
  });
});
