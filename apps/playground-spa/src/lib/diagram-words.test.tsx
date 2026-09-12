/**
 * 見本帳の図に、英語の仮置きの字が残っていないこと (#1778 / #1859)。
 *
 * 見本の図は `User` `handler(...)` `Sign up` のような英語の仮置きのまま描かれていた。
 * 詳細画面の説明文 (#1777) と組み立て関数が書き足す字 (cdl#835) を日本語にしても、
 * 図そのものの字が英語のままでは見本として読めない。
 *
 * ## 何を見るか
 *
 * **描いた結果の字**。 組み立てた図を `CdlDiagramView` で描き、 要素の中身として表に出る字を
 * 集める (属性の値は読む人に見えないので見ない)。 図の data の欄を拾う形にすると、
 * 描く側が足す字 (札の既定値など) と描かない欄の区別が付かない。
 *
 * 描いた図は最初の段しか説明を出さないため、 段の題と説明と札は data から全段ぶん足す。
 * **足す欄は `段の字()` が一覧で持つ** (#1870) = 足し忘れた欄を後から確かめられるようにする。
 * 札が抜けていた間、札だけを英語に戻す変異が判定を素通りしていた。
 *
 * ## どこまで見るか (#1859)
 *
 * **見本帳の置き場にある `*.cdl.ts` を全部**。 #1778 では `presets.cdl.ts` だけを import して
 * おり、12 file 444 件のうち 21 件しか見ていなかった。 外した理由はどこにも書かれておらず、
 * 残り 423 件はどの検査からも読まれていなかった。
 *
 * file を手で並べる形は **書き手が思い付いた file が上限** になるので、置き場を走査して導く。
 *
 * 英語が残る file は `図の字の天井` に **いまの数** を置く。 外す / 入れるの 2 値にすると、
 * あと 3 語で 0 になる file も手付かずの file も同じ扱いになって、減った分が見えない。
 * 天井 0 の file は 1 語でも戻れば落ちる厳しい判定に回る。
 *
 * ## 残してよい英字
 *
 * 製品名 / 規格名 / 略語 (`CloudFront` `HTTPS` `API` など) は日本語に置き換える語を持たない。
 * 1 語ずつ理由を付けて `残してよい語` に載せる。
 *
 * **記法の綴りは一覧に載せない** (#1865)。 見本帳の図は記法そのものを見せる場所なので、
 * 箱や段の字に `fill` / `readout` / `dotted` がそのまま出る。 これは記法が配る名前から
 * 照合で引く (`記法が知る名前()` + `綴りの照合()`) = 画面の字 (#1825) と図の説明 (#1830) が
 * 既に引いている経路で、**図の中の字だけが引いていなかった**。
 *
 * 表と型の名前を見せる図 (ER 図とクラス図) は、 箱の題と行が SQL やコードに書く識別子そのもの。
 * `users` `bigint` `Money` を訳すと図の意味が変わるため、 箱の字は見ずに段の字だけを見る。
 */
import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, diagram, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { 記法が知る名前, 記法が配る図の型, 綴りの照合, 経路ごとの専有 } from "./notation-names";

/**
 * 記法が知っている綴り (#1865)。
 *
 * **見本帳の図は記法そのものを見せる場所**なので、箱や段の字に記法の綴りがそのまま出る
 * (`fill 進行` / `flow 通過` / `dotted`)。 訳した瞬間に図が別の意味になるので、
 * 「開くべき英語」 には数えない。
 *
 * 画面の字 (#1825 / #1827) と図の説明 (#1830) が同じ照合を引いており、
 * **図の中の字だけが引いていなかった**。 判定を 2 度書かないよう、同じ 2 つの関数に通す。
 */
const 記法の経路 = 記法が知る名前().経路;

/**
 * 記法が配る図の型の名前 (#1870)。
 *
 * 段の札は書き手が書くとは限らない = 見本の組み立て (`withSteps()`) が、記法の作った段の札を
 * `auto?.badge` で引き継ぐ。 その字は図の型そのもの (`journey` / `swimlane`) で、
 * 訳すと図の型が読めなくなる。
 *
 * **4 経路では引けない** = 型の一覧は集合 (`Set`) で配られており、経路の走査が中身を数えない
 * (#1842 で実測)。 経路を広げると種類の一覧 117 件まで一緒に入って照合が緩むので、
 * 型の一覧だけを別に引く。
 */
const 図の型 = 記法が配る図の型();

/**
 * 日本語に置き換える語を持たない英字。 語ごとに何の名前かを書く。
 *
 * **記法の綴りはここに置かない** (#1865) = 照合の経路が引く。 重ねて持つと、経路が
 * その語を落とした日に手書きの側が黙って覆い、気付けなくなる。 死蔵は検査が見る。
 */
const 残してよい語: Record<string, string> = {
  AWS: "クラウドの事業者名",
  CloudFront: "AWS の配信網の製品名",
  ALB: "AWS の負荷分散の製品名",
  RDS: "AWS のデータベースの製品名",
  ECS: "AWS のコンテナ実行の製品名",
  Redis: "一時保存の製品名",
  PostgreSQL: "データベースの製品名",
  PgBouncer: "PostgreSQL の接続を束ねる製品名",
  HTTPS: "通信の規格名",
  SQL: "問い合わせ言語の名前",
  TCP: "通信の規格名",
  VLAN: "ネットワークを論理的に分ける規格名",
  DMZ: "ネットワークの区画の略語",
  LAN: "ネットワークの区画の略語",
  API: "外部から呼ぶ口の略語",
  DB: "データベースの略語",
  POST: "HTTP の要求の種類",
  login: "`POST /login` の道筋の一部",
  SNS: "交流サイトの定着した略語。 日本語の文でもこの綴りで書く (#1861)",
  ms: "時間の単位の記号。 単位は綴りが決まっている (`ミリ秒` は読みであって単位ではない、#1861)",
  dragon: "この製品の名前 (#1861)",
};

/**
 * 記法が図の型ごとに段の札へ自動で付ける綴り (#1870)。
 *
 * 段の札は書き手が書くとは限らない。 見本の組み立て (`withSteps()`) が、記法の作った段の札を
 * `auto?.badge` で引き継ぐ。 その字は照合でも図の型の一覧でも引けない = **図の型の一覧とは
 * 別の綴りが札に出る** (一覧は `state` / `mind` だが、札は `fsm` / `mindmap` で出る)。
 *
 * **開くのではなく、綴りを型の一覧と揃えて外す** (#1872)。 図の型は記法に打ち込む字なので
 * 日本語にはしない。 描画側 (別 package) の札を `state` / `mind` に揃えれば、型の一覧で
 * 引けるようになってこの手書きの一覧は空になる。
 *
 * 一覧が死蔵にならないことは下の検査が見る (札に 1 度も現れない綴りが残ると、同じ字が
 * 仮置きとして戻った日に黙って通る)。
 */
const 記法が札に付ける綴り: Record<string, string> = {
  fsm: "状態の移り変わりの図の札。 型の一覧は `state` だが札は別の綴りで出る",
  mindmap: "考えの枝分かれの図の札。 型の一覧は `mind` だが札は別の綴りで出る",
  statemachine2: "2 つ目の状態の移り変わりの図の札。 型の一覧に対応する綴りが無い",
};

/**
 * 箱の字が識別子そのものの図。 段の題と説明だけを見る。
 * 鍵が実在することは下の検査が確かめる (消えた図の宣言を残さない)。
 */
const 識別子を見せる図: Record<string, string> = {
  presetEr: "表の名前と列の名前と型は SQL に書く識別子",
  presetErComplex: "表の名前と列の名前と型は SQL に書く識別子",
  presetClassDiagram: "クラスの名前と型はコードに書く識別子",
  presetClassComplex: "クラスの名前と型はコードに書く識別子",
};

const 描く時刻 = new Date("2026-01-01T00:00:00Z");

function 描いた字(d: CdlDiagram): string[] {
  vi.useFakeTimers();
  vi.setSystemTime(描く時刻);
  let s: string;
  try {
    // 詳細画面と同じ指定で描く (`PresetDetailPage`)。 見出しと段ごとの差分の表は画面が出さない
    s = renderToStaticMarkup(<CdlDiagramView hideMiniPhaseIndicator hideHeader diagram={layout(d)} />);
  } finally {
    vi.useRealTimers();
  }
  return s
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .split(/<[^>]*>/)
    .map((t) =>
      t
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&amp;/g, "&")
        .trim(),
    )
    .filter((t) => t !== "");
}

/**
 * 段が持つ字。 **描いた図が出さない欄を data から足す** (#1778 / #1870)。
 *
 * | 欄 | なぜ足すか |
 * |---|---|
 * | `title` / `body` | 描いた図は最初の段しか説明を出さない |
 * | `badge` | 描いた図に 1 度も現れない (実測 = `stateInactive` の描いた字は `["A","B","停止中"]` で、札の `矢印は停止中` が無い) |
 *
 * **足す欄を一覧にする** = 足し忘れた欄を後から確かめられるようにするため。 #1870 まで
 * `badge` が抜けており、札だけを英語に戻す変異が図の判定を素通りしていた (記法と図の一致を
 * 見る別の検査だけが落ちた)。
 */
function 段の字(d: CdlDiagram): string[] {
  return d.phases.flatMap((p) => [p.title, p.body, p.badge].filter((t): t is string => !!t));
}

/** 字に現れる英字の語。 1 文字の英字は語と見なさない (`スイッチ A` の区別や `Q1` の四半期) */
function 語の並び(t: string): string[] {
  return [...t.matchAll(/[A-Za-z][A-Za-z0-9]*/g)]
    .map((m) => m[0])
    .filter((語) => /[A-Za-z].*[A-Za-z]/.test(語));
}

/**
 * その綴りを記法が知っているか (#1865)。
 *
 * **判定は `綴りの照合()` に任せる** = 経路の見方を 2 度書かない。 1 語ずつ通すので
 * 結果を覚えておく (図 444 件を走査するため、同じ語を何度も引く)。
 */
const 記法が知るか = ((): ((語: string) => boolean) => {
  const 覚え = new Map<string, boolean>();
  return (語) => {
    let v = 覚え.get(語);
    if (v === undefined) {
      v = 綴りの照合([{ 元: 語, 綴り: 語 }], 記法の経路).無い.length === 0;
      覚え.set(語, v);
    }
    return v;
  };
})();

/**
 * 横棒 (`-`) で繋いだ英字の塊 (#1867)。
 *
 * 記法は横棒を値の一部として持つ (`dotted-flow` / `merkle-tree`) 一方、`語の並び()` は
 * 横棒を区切りとして扱う。 その食い違いで記法が知る値が断片に割れるので、塊を先に見る。
 */
const 横棒繋ぎの形 = /[A-Za-z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)+/g;

/**
 * 16 進の値 (#1874)。
 *
 * 語を拾う形は英字始まりの並びを取るので、`0x7b3f92c1` が `x7b3f92c1` に割れる。
 * **16 進は値であって英語ではない** = 日本語に開く先が無く、開くと図が別の値を指す。
 *
 * **`0x` の付かない形は外さない** = `af31c9d2` は普通の英字の並びと見分けが付かない。
 *
 * **大文字の接頭辞 (`0X`) も外さない**。 書き方の揺れとして `0[xX]` にする案を試したが、
 * 見本に `0X` の形が 0 件で、変異で外しても検査が 1 件も動かなかった (実測)。
 * 動かない分岐を置くと、壊れても気付けない守りが 1 つ増える。 `0X` で書かれた日は
 * その値が「開くべき英語」 に数えられて天井を超えるので、気付ける側に倒れる。
 */
const 十六進の形 = /0x[0-9a-fA-F]+/g;

/**
 * 語に割る前に字から外す並び (#1867 / #1874)。
 *
 * どちらも**語の形になってから判定しても手遅れ**なので、字の段階で外す。
 *
 * | 外す相手 | 語に割ると何が起きるか |
 * |---|---|
 * | 記法が知る横棒繋ぎ | `dotted-flow` が `dotted` と `flow` に割れ、照合を外れた断片が残る |
 * | 16 進の値 | `0x7b3f92c1` の `0` を飛ばして `x7b3f92c1` が英語の語として数えられる |
 *
 * **横棒を語の一部にするだけでは足りない** = `Sign-up` のような記法と無関係な綴りまで
 * 1 語になり、断片ごとに数えていた従来の結果が変わる。 外すのは記法が知る塊だけ。
 *
 * **塊の一部が記法の値でも、全体を知らなければ外さない** = `user-alice` を外すと
 * `alice` まで消える。
 */
function 語になる前に外す(t: string): string {
  return t.replace(十六進の形, " ").replace(横棒繋ぎの形, (塊) => (記法が知るか(塊) ? " " : 塊));
}

/** 字に現れる、記法が知っている横棒繋ぎの塊。 検査が母集団を実物から導くのに使う (#1867) */
function 記法が知る横棒繋ぎ(字: readonly string[]): string[] {
  const 出た = new Set<string>();
  for (const t of 字) {
    for (const m of t.matchAll(横棒繋ぎの形)) if (記法が知るか(m[0])) 出た.add(m[0]);
  }
  return [...出た].sort();
}

/** 字に現れる 16 進の値。 検査が母集団を実物から導くのに使う (#1874) */
function 字に出る十六進(字: readonly string[]): string[] {
  const 出た = new Set<string>();
  for (const t of 字) for (const m of t.matchAll(十六進の形)) 出た.add(m[0]);
  return [...出た].sort();
}

/**
 * その語を「開くべき英語」 から外すか。 **外す相手を 1 箇所に並べる** (#1870)。
 *
 * | 相手 | 何を外すか |
 * |---|---|
 * | `残してよい語` | 製品名 / 規格名 / 単位 (手書き、理由付き) |
 * | `記法が札に付ける綴り` | 記法が段の札へ自動で付ける字 (手書き、理由付き) |
 * | `許す語` | 識別子を見せる図で、図に描いた識別子 |
 * | `図の型` | 記法が配る図の型の名前 |
 * | `記法が知るか` | 記法が配る名前の 4 経路との照合 |
 */
function 開かない語(語: string, 許す語: ReadonlySet<string>): boolean {
  return (
    語 in 残してよい語 ||
    語 in 記法が札に付ける綴り ||
    許す語.has(語) ||
    図の型.has(語) ||
    記法が知るか(語)
  );
}

/** 字の並びから、 開かない語を除いた英語の語を拾う */
function 英語の語(字: readonly string[], 許す語: ReadonlySet<string> = new Set()): string[] {
  const 見つけた = new Set<string>();
  for (const t of 字) {
    for (const 語 of 語の並び(語になる前に外す(t))) {
      if (開かない語(語, 許す語)) continue;
      見つけた.add(`${語} (「${t}」)`);
    }
  }
  return [...見つけた];
}

/**
 * 識別子を見せる図は、 段の説明が図の中の識別子を呼ぶ (`manager_id は同じ表を指す`)。
 * **図に描いた識別子だけ** を許す = 図に無い英語の語は段の説明でも拾う。
 */
function 英語の残り(鍵: string, d: CdlDiagram): string[] {
  if (鍵 in 識別子を見せる図) {
    return 英語の語(段の字(d), new Set(描いた字(d).flatMap(語の並び)));
  }
  return 英語の語([...描いた字(d), ...段の字(d)]);
}

/**
 * 手書きの一覧のうち、記法の経路が既に覆っている語 (#1865)。
 *
 * 本番 (`残してよい語`) と植え込み対照の両方が通る。 探し方を 2 度書くと、
 * 片方だけ直して対照が本番と別のものを見る。
 */
function 経路と重なる語(一覧: readonly string[]): string[] {
  return 一覧.filter((語) => 記法が知るか(語));
}

/**
 * 見本帳の図から、判定が見る字を全部集める (#1867)。
 *
 * 識別子を見せる図は箱の字を見ない、という除外を **1 箇所に持つ**。
 * 走査を書き足すたびに同じ分岐を写すと、片方だけ直って母集団が食い違う。
 */
function 見本帳の字(): string[] {
  return 見本帳の図().件.flatMap((r) =>
    r.鍵 in 識別子を見せる図 ? 段の字(r.図) : [...描いた字(r.図), ...段の字(r.図)],
  );
}

/** 見本帳の図が持つ段の札。 一覧の死蔵を見る検査が母集団を実物から導くのに使う (#1870) */
function 見本帳の札(): string[] {
  return 見本帳の図().件.flatMap((r) =>
    r.図.phases.map((p) => p.badge).filter((b): b is string => !!b),
  );
}

/**
 * 図の字に実際に出ている、記法が知る綴り (#1865)。
 *
 * 経路の専有を測る相手。 **記法の一覧をそのまま渡さない** = 記法は数千の綴りを配っており、
 * その全部を相手にすると「図の字でどの経路が効いているか」 が読めなくなる。
 */
function 図に出る記法の綴り(): string[] {
  const 集 = new Set<string>();
  for (const t of 見本帳の字()) for (const 語 of 語の並び(t)) if (記法が知るか(語)) 集.add(語);
  return [...集];
}

/**
 * 見本帳の図の置き場にある file を全部読む (#1859)。
 *
 * `eager` で読むのは、走査の途中で待たないため。 444 件を描いて 555ms なので重くない。
 */
const 見本帳 = import.meta.glob<Record<string, unknown>>("../topics/catalog/*.cdl.ts", {
  eager: true,
});

/** 図とみなす export = 箱と段の並びを持つ object */
function 図か(v: unknown): v is CdlDiagram {
  return (
    typeof v === "object" &&
    v !== null &&
    Array.isArray((v as CdlDiagram).nodes) &&
    Array.isArray((v as CdlDiagram).phases)
  );
}

/**
 * 見本帳の図を file ごとに導く (#1859)。
 *
 * `file数` を返すのは、置き場を読めていない時に「図が 0 件」 と区別するため。
 */
function 見本帳の図(): { 件: { file: string; 鍵: string; 図: CdlDiagram }[]; file数: number } {
  const 件: { file: string; 鍵: string; 図: CdlDiagram }[] = [];
  for (const [path, mod] of Object.entries(見本帳)) {
    const file = path.slice(path.lastIndexOf("/") + 1);
    for (const [鍵, v] of Object.entries(mod)) if (図か(v)) 件.push({ file, 鍵, 図: v });
  }
  return { 件, file数: Object.keys(見本帳).length };
}

/**
 * file ごとの、英語が残る図と語の天井 (#1859)。
 *
 * **減った時も落とす** = 下回ったまま通すと、一度直した分がまた増えても気付けない。
 * 落ちた時の文で下げる先を出す。
 *
 * `presets.cdl.ts` が 0 なのは #1778 で全部日本語に直したから。 **0 の file は
 * 1 語でも戻れば落ちる厳しい判定に回る** (下の `it.each`)。
 *
 * `charts.cdl.ts` の 3 種のように 0 に近い file がある。 外す / 入れるの 2 値にすると
 * こういう file が手付かずの file と同じ扱いになるので、数で持つ。
 *
 * **天井の上下は、数え方が変わっただけの回と実物を直した回が混ざる**。 混ぜて読まない。
 *
 * | 回 | 向き | 何をしたか |
 * |---|---|---|
 * | #1861 | 下がる | `charts.cdl.ts` の 3 語を実際に日本語へ開いた |
 * | #1865 | 下がる | 記法の綴り (`fill` / `readout`) を照合で落とした |
 * | #1867 | 下がる | 横棒繋ぎの値 (`dotted-flow`) が断片に割れるのを止めた |
 * | #1869 | 下がる | `styles.cdl.ts` の 6 語を実際に日本語へ開いた |
 * | #1870 | **上がる** | 段の札を母集団に足した (いままで 1 度も見ていなかった) |
 * | #1874 | 下がる | 16 進の値 (`0x7b3f92c1`) が語に割れるのを止めた |
 */
const 図の字の天井: Record<string, { 図: number; 語: number; 延べ: number }> = {
  "animation.cdl.ts": { 図: 7, 語: 19, 延べ: 35 },
  "charts.cdl.ts": { 図: 0, 語: 0, 延べ: 0 },
  "cookbook.cdl.ts": { 図: 26, 語: 153, 延べ: 289 },
  "ethereum.cdl.ts": { 図: 2, 語: 9, 延べ: 11 },
  "interactive.cdl.ts": { 図: 114, 語: 693, 延べ: 1318 },
  "parts.cdl.ts": { 図: 14, 語: 17, 延べ: 18 },
  "patterns.cdl.ts": { 図: 12, 語: 75, 延べ: 140 },
  "presets.cdl.ts": { 図: 0, 語: 0, 延べ: 0 },
  "primitives-extra.cdl.ts": { 図: 21, 語: 52, 延べ: 92 },
  "primitives.cdl.ts": { 図: 89, 語: 448, 延べ: 981 },
  "styles.cdl.ts": { 図: 0, 語: 0, 延べ: 0 },
  "text-dsl.cdl.ts": { 図: 13, 語: 59, 延べ: 83 },
};

/** file ごとに、英語が残る図の数と語の種類と延べを数える */
function file別に数える(): Map<string, { 図: number; 語: Set<string>; 延べ: number }> {
  const 表 = new Map<string, { 図: number; 語: Set<string>; 延べ: number }>();
  for (const r of 見本帳の図().件) {
    const 行 = 表.get(r.file) ?? { 図: 0, 語: new Set<string>(), 延べ: 0 };
    const 残り = 英語の残り(r.鍵, r.図);
    if (残り.length > 0) {
      行.図 += 1;
      行.延べ += 残り.length;
      for (const w of 残り) 行.語.add(w.slice(0, w.indexOf(" (")));
    }
    表.set(r.file, 行);
  }
  return 表;
}

/**
 * 1 語でも英語が戻れば落ちる file の図。 **天井 0 の file から導く** =
 * file 名を 2 箇所に書くと片方だけ直って食い違う。
 */
const 見本: [string, CdlDiagram][] = 見本帳の図()
  .件.filter((r) => 図の字の天井[r.file]?.図 === 0)
  .map((r) => [r.鍵, r.図]);

/** 植え込み対照の土台。 見本帳の data に依らず、 日本語だけで組む */
function 土台(箱の題: string): CdlDiagram {
  return diagram("土台", { topic: "土台の図" })
    .lane("左", { width: 400, label: "受け付け" })
    .node("a", { lane: "左", stack: 0, kind: "function", title: 箱の題 })
    .phase("p1", { duration: 1000, title: "1. 受け付ける", body: "申請を受け付ける。" }, (p) =>
      p.activate("a"),
    )
    .build();
}

describe("英語が片付いた見本の図の字 (#1778)", () => {
  it("対象の見本を見つけている", () => {
    // 見本が 1 件も取れないと、 下の検査は何も見ずに通る
    expect(見本.length, "見本を 1 件も見つけていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(見本.map(([k]) => k)).toEqual(expect.arrayContaining(Object.keys(識別子を見せる図)));
  });

  it.each(見本)("%s の図に英語の仮置きの字が残っていない", (鍵, d) => {
    const 字 = 鍵 in 識別子を見せる図 ? 段の字(d) : 描いた字(d);
    expect(字.length, `${鍵} の字を 1 つも拾えていない (検査が空振りしている)`).toBeGreaterThan(0);
    expect(英語の残り(鍵, d)).toEqual([]);
  });

  it("残してよい語は、 どれかの図で実際に使われている", () => {
    // 使われない語が残ると、 同じ語が仮置きとして戻った時に黙って通る。
    // **見本帳の図を全部見る** (#1859) = 一覧は 12 file すべてに効くので、
    // 1 file の中だけで死蔵を判定すると別の file で生きている語を死蔵と読む
    const 全部の字 = 見本帳の図()
      .件.flatMap((r) => [...描いた字(r.図), ...段の字(r.図)])
      .join("\n");
    const 使われない = Object.keys(残してよい語).filter(
      (語) => !new RegExp(`(^|[^A-Za-z])${語}([^A-Za-z]|$)`).test(全部の字),
    );
    expect(使われない).toEqual([]);
  });
});

describe("見本帳の図に残る英語の歯止め (#1859)", () => {
  it("いまの天井を超えていない、下回ってもいない", () => {
    const { 件, file数 } = 見本帳の図();
    const 表 = file別に数える();
    console.log(
      `[図の字] file=${file数} 図=${件.length} / ` +
        [...表.entries()]
          .sort()
          .map(([f, r]) => `${f} 図=${r.図} 語=${r.語.size} 延べ=${r.延べ}`)
          .join(" / "),
    );
    // 空振り防止 = 置き場を読めていないと 3 つの数がそろって 0 になり、天井の下回りで落ちる。
    // それでも下限を置くのは、**落ちた時に直す先が違う** ため
    // (天井の下回りは「直したので下げる」、下限は「置き場の走査が壊れた」)
    expect(file数, "見本帳の file を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(5);
    expect(件.length, "図を 1 件も見つけていない (検査が空振りしている)").toBeGreaterThan(100);
    for (const [f, r] of [...表.entries()].sort()) {
      const 上 = 図の字の天井[f];
      expect(上, `天井の表に無い file がある: ${f} (表に 1 行足す)`).toBeDefined();
      for (const [名, いま, 天井] of [
        ["図", r.図, 上!.図],
        ["語", r.語.size, 上!.語],
        ["延べ", r.延べ, 上!.延べ],
      ] as const) {
        expect(
          いま,
          `${f} の ${名} が天井を超えた。 直すか、直せない理由を書く (${天井} → ${いま})`,
        ).toBeLessThanOrEqual(天井);
        expect(
          いま,
          `${f} の英語が減ったので天井を下げる (${名}: ${天井} → ${いま})`,
        ).toBeGreaterThanOrEqual(天井);
      }
    }
  });

  it("天井の表と走査した file が一致している (母集団の完全性)", () => {
    // 表に 1 行足し忘れた file は、上の検査が拾うまで気付けない。 逆に、消えた file の
    // 行が残ると **その行は永久に何も守らない**。 両方向を見る
    const 走査 = [...file別に数える().keys()].sort();
    expect(走査.length, "file を 1 つも走査していない (検査が空振りしている)").toBeGreaterThan(5);
    expect(走査, "天井の表と走査した file が食い違っている").toEqual(
      Object.keys(図の字の天井).sort(),
    );
  });

  it("天井 0 の file が実在し、厳しい判定に回っている (収容対照)", () => {
    // 直し終えた file が候補から消える形だと、直した先を 1 件も見ていないことになる
    const 零 = Object.entries(図の字の天井)
      .filter(([, r]) => r.図 === 0)
      .map(([f]) => f);
    expect(零, "天井 0 の file が 1 つも無い (厳しい判定の相手が居ない)").not.toEqual([]);
    const 走査 = file別に数える();
    for (const f of 零) {
      expect(走査.has(f), `天井 0 の file を走査していない: ${f}`).toBe(true);
      expect(
        見本帳の図().件.filter((r) => r.file === f).length,
        `${f} の図を 1 件も見つけていない`,
      ).toBeGreaterThan(0);
    }
    // 厳しい判定の相手が、天井 0 の file の図と同じ数になっている
    expect(見本.length).toBe(
      見本帳の図().件.filter((r) => 零.includes(r.file)).length,
    );
  });
});

describe("16 進の値を英語の語として数えない (#1874)", () => {
  it("図に出る 16 進の値が、断片に割れて数えられていない", () => {
    // **値だけを含む字を作って通す** = 他の語の影響を受けない
    const 値たち = 字に出る十六進(見本帳の字());
    expect(値たち.length, "16 進の値が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);
    console.log(`[16 進] ${値たち.length} 種 = ${値たち.join(" ")}`);
    const 残る = 値たち.filter((v) => 英語の語([v]).length > 0);
    expect(残る, "16 進の値が断片に割れて数えられている").toEqual([]);
  });

  it("`0x` の付かない英字の並びは、従来どおり数える (植え込み対照)", () => {
    // 0 件を期待する上の検査が恒真でないことを、逆向きの入力で見る
    expect(記法が知るか("af31c9d2"), "af31c9d2 を記法が知っている (対照の前提が崩れた)").toBe(
      false,
    );
    expect(英語の語(["af31c9d2"])).toEqual(["af31c9d2 (「af31c9d2」)"]);
  });

  it("16 進の後ろに続く英語は、従来どおり数える", () => {
    // 値だけを外す。 同じ字の中の別の語まで消すと判定が緩む
    expect(英語の語(["0x1234 の Alice"])).toEqual(["Alice (「0x1234 の Alice」)"]);
  });
});

describe("段の札も判定に入る (#1870)", () => {
  it("札にだけ英語を置いた図から拾う (植え込み対照)", () => {
    // 段の題と説明は日本語のまま。 札だけが英語の図を作り、判定が札を見ていることを確かめる
    const d = 土台("申請の受付");
    const 植えた = { ...d, phases: d.phases.map((p) => ({ ...p, badge: "Draft" })) };
    expect(英語の残り("土台", 植えた)).toEqual(["Draft (「Draft」)"]);
  });

  it("記法の綴りを札に置いても拾わない (対象外の対照)", () => {
    const d = 土台("申請の受付");
    expect(図の型.has("sequence"), "sequence が図の型の一覧に無い (対照が古い)").toBe(true);
    const 植えた = { ...d, phases: d.phases.map((p) => ({ ...p, badge: "sequence" })) };
    expect(英語の残り("土台", 植えた)).toEqual([]);
  });

  it("記法が札に付ける綴りが、どれかの図の札に実在する (死蔵の検査)", () => {
    // 札に 1 度も出ない綴りを一覧が持つと、同じ字が仮置きとして戻った日に黙って通る
    const 札 = 見本帳の札();
    expect(札.length, "札を 1 件も拾えていない (検査が空振りしている)").toBeGreaterThan(100);
    const 全部 = 札.join("\n");
    const 死蔵 = Object.keys(記法が札に付ける綴り).filter(
      (語) => !new RegExp(`(^|[^A-Za-z])${語}([^A-Za-z]|$)`).test(全部),
    );
    expect(死蔵, `札に実在しない綴りを一覧が持っている: ${死蔵.join(", ")}`).toEqual([]);
    // 植え込み対照 = 0 件を期待するので、探し方が本当に見つけるかを別に見る
    const 見つからない = ["ZzNoSuchBadge"].filter(
      (語) => !new RegExp(`(^|[^A-Za-z])${語}([^A-Za-z]|$)`).test(全部),
    );
    expect(見つからない, "死蔵の探し方が何も見つけない (検査が恒真)").toEqual(["ZzNoSuchBadge"]);
  });
});

describe("横棒で繋いだ記法の値を割らない (#1867)", () => {
  it("記法が知る塊を、断片に割って数えない", () => {
    // **塊だけを含む字を作って通す** = 他の語の影響を受けない。 同じ綴りが単独で別の図に
    // 出ている時の判定 (従来どおり数える / 通す) は、この検査の対象外
    const 塊たち = 記法が知る横棒繋ぎ(見本帳の字());
    expect(塊たち.length, "横棒繋ぎの塊が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);
    // 集めた塊が本当に横棒を含むこと。 塊の形が横棒を落とすと、記法が知る普通の語が
    // 塊として集まり、下の判定が素通りする (天井の検査だけが捕まえる形になる)
    for (const 塊 of 塊たち) {
      expect(塊, "横棒を含まない綴りが塊として集まっている").toContain("-");
    }
    console.log(`[横棒繋ぎ] 記法が知る塊 ${塊たち.length} 種 = ${塊たち.join(" ")}`);
    const 残る = 塊たち.filter((塊) => 英語の語([塊]).length > 0);
    expect(残る, "記法が知る塊が断片に割れて数えられている").toEqual([]);
  });

  it("記法が知らない横棒繋ぎは、従来どおり断片ごとに数える (植え込み対照)", () => {
    // 0 件を期待する上の検査が恒真でないことを、逆向きの入力で見る
    // 塊も断片も記法が知らない形を選ぶ (片方が記法の値だと、断片ごとに数えたことを示せない)
    for (const 語 of ["Alice-Bob", "Alice", "Bob"]) {
      expect(記法が知るか(語), `${語} を記法が知っている (対照の前提が崩れた)`).toBe(false);
    }
    expect(英語の語(["Alice-Bob"])).toEqual(["Alice (「Alice-Bob」)", "Bob (「Alice-Bob」)"]);
  });

  it("塊の一部だけが記法の値の形は、塊として飛ばさない", () => {
    // `user-alice` の全体を記法は知らない。 `user` が記法の値でも、
    // 塊ごと飛ばすと `alice` まで消える
    expect(記法が知るか("user-alice"), "user-alice を記法が知っている (対照の前提が崩れた)").toBe(
      false,
    );
    expect(英語の語(["user-alice"]).map((s) => s.slice(0, s.indexOf(" (")))).toContain("alice");
  });
});

describe("記法の綴りを開くべき英語に数えない (#1865)", () => {
  it("残してよい語が、記法の経路と重なっていない (死蔵の検査)", () => {
    // 経路が覆う語を手書きでも持つと、**経路がその語を落とした日に手書きの側が黙って覆う**。
    // 覆われている間は誰も赤を踏まないので、照合が壊れたことに気付けない
    const 語数 = [...記法の経路.values()].reduce((n, s) => n + s.size, 0);
    expect(語数, "記法の経路が 1 語も持っていない (検査が空振りしている)").toBeGreaterThan(100);
    const 重なり = 経路と重なる語(Object.keys(残してよい語));
    expect(
      重なり,
      `記法の経路が覆う語を手書きでも持っている。 一覧から外す: ${重なり.join(", ")}`,
    ).toEqual([]);
    // 植え込み対照 = 0 件を期待する検査なので、探し方が本当に見つけるかを別に見る。
    // 同じ `経路と重なる語()` に通す = 探し方を 2 度書かない
    expect(経路と重なる語(["fill"]), "重なりの探し方が何も見つけない (検査が恒真)").toEqual([
      "fill",
    ]);
  });

  it("4 経路それぞれが、図の字で守りを足している (経路の専有)", () => {
    // 抜いて何も落ちない経路は、図の字に対して守りを 1 つも足していない。
    // 探し方は本番と同じ `経路ごとの専有()` に通す = 2 度書かない
    const 綴り = 図に出る記法の綴り().map((w) => ({ 元: w, 綴り: w }));
    expect(綴り.length, "図の字に記法の綴りが 1 語も無い (照合が効いていない)").toBeGreaterThan(50);
    const 専有 = 経路ごとの専有(綴り, 記法の経路);
    console.log(
      `[図の字/経路の専有] 相手=${綴り.length} / ` +
        [...専有].map(([名, ws]) => `${名}=${ws.length}`).join(" / "),
    );
    expect([...専有.keys()].sort(), "経路の一覧が食い違っている").toEqual(
      [...記法の経路.keys()].sort(),
    );
    for (const [名, ws] of 専有) {
      expect(ws.length, `${名} が図の字に対して守りを 1 つも足していない`).toBeGreaterThan(0);
    }
  });
});

describe("拾い方の対照", () => {
  it("日本語だけの図からは何も拾わない", () => {
    expect(英語の残り("土台", 土台("申請の受付"))).toEqual([]);
  });

  it("記法の綴りを図に置いても拾わない (対象外の対照)", () => {
    // **対照の語を守りの実装から導かない** (#1863)。 導くと、照合を壊した瞬間に対照も
    // 一緒に壊れて恒真になる。 語を literal で持ち、記法が本当に知っていることを先に見る
    for (const 語 of ["fill", "readout"]) {
      expect(記法が知るか(語), `${語} を記法が知らない (対照が古い)`).toBe(true);
    }
    expect(英語の残り("土台", 土台("fill の進み"))).toEqual([]);
    expect(英語の残り("土台", 土台("readout の値"))).toEqual([]);
  });

  it("箱の題に置いた英語の語を拾う", () => {
    expect(英語の残り("土台", 土台("Submit request"))).toEqual([
      "Submit (「Submit request」)",
      "request (「Submit request」)",
    ]);
  });

  it("段の説明に置いた英語の語を拾う", () => {
    const d = 土台("申請の受付");
    const 植えた = { ...d, phases: d.phases.map((p) => ({ ...p, body: "申請を review する。" })) };
    expect(英語の残り("土台", 植えた)).toEqual(["review (「申請を review する。」)"]);
  });

  it("残してよい語は拾わない", () => {
    expect(英語の残り("土台", 土台("API の受付"))).toEqual([]);
  });
});
