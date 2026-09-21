import { useEffect } from "react";
import { Link } from "react-router";
import { Blocks, BookOpen, Gift, Repeat, ScanEye, Timer } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * 使い方の入口。 見た目の SSOT = docs/design/app.pen の 05 使い方、
 * class の中身は src/styles/docs-site.css。
 * 要点は枠で囲わず、 頭の罫線だけで区切る。
 * CSS selectors は `body.docs-body` を前提とするため、 mount 時に document.body に class 付与。
 *
 * ## 札は入口で、節が本文を持つ (#2439)
 *
 * 設計 (`docs/design/specs/screens.md` § 5) は、この画面を **長文を読み続けられること** が
 * 最も大事な読み物と定める。 以前は 7 つの節のうち 6 つが他の画面へ飛ぶ札で、
 * 本文を持つ節は `30 秒で雰囲気を掴む` の 1 つだけだった。
 *
 * 札は残したまま、飛び先を同じ画面の節へ変えた。 本文はこの画面で読み切れる。
 * もっと見たい人のために、各節の末尾からカタログの該当する分類へ出る。
 *
 * **札の題は見出しにしない**。 節と札で同じ題が 2 度 `h2` に出ると、
 * 仕様書と突き合わせる検査 (`spec-matches-impl.spec.ts`) が 7 件のはずの見出しを 13 件読む。
 * 札は行き先の名前なので `span` で持つ。
 */

/** 節の並び。 番号と `id` はこの並びから作るので、数を書き写さない */
const 節 = [
  {
    id: "run",
    題: "5 分で動かす",
    本文: [
      "入れる物は 2 つだけ。 記法を読む `@cardenelabs/dragon` と、 図を描く `@cardenelabs/cdl` を足せば、 その場で動く図が出る。 組み立ての設定も、 描画の下地も要らない。",
      "書くのは箇条書きに近い形の記法で、 題と種類と登場人物と流れの 4 つを並べる。 これを `textDslToDiagram` に渡すと図の形になり、 `CdlDiagramView` が画面に描く。 段の切替も、 線の光も、 進む点の波も、 書かなくても付く。",
      "何も入れずに試したい時は編集画面を開く。 左に記法を書くと右にその場で図が出るので、 書いた字と描かれた形の対応をその場で確かめられる。",
    ],
    コード: `pnpm add @cardenelabs/dragon @cardenelabs/cdl react react-dom`,
    出口: { to: "/editor", 字: "編集画面で試す →" },
  },
  {
    id: "feel",
    題: "30 秒で雰囲気を掴む",
    本文: [
      "組み立ての形で書くと、 縦列を置き、 箱を並べ、 線で繋ぎ、 段で動かす、 の 4 手順になる。 下の記述はその最小の形で、 これだけで縦に 2 本の帯が立ち、 箱が 2 つ並び、 線が 1 本光る。",
      "段 (`phase`) は時間の単位で、 題と長さと、 その段で光らせるものを書く。 光らせる対象は箱の名前と線の名前で指すので、 座標を書かなくても意図した所が動く。",
    ],
    コード: `import { diagram } from "@cardenelabs/cdl";
import { CdlDiagramView } from "@cardenelabs/cdl/react";

const hello = diagram("hello", { topic: "Hello world" })
  .lane("left",  { x: 0,   width: 320 })
  .lane("right", { x: 460, width: 320 })
  .nodes([
    { id: "a", lane: "left",  title: "Client" },
    { id: "b", lane: "right", title: "Server" },
  ])
  .edge("a-b", "a", "b", { label: "greet()" })
  .phase("call", { duration: 1500, title: "Call", body: "Client が greet を呼ぶ。" },
    (p) => p.activate("a", "b", "a-b"))
  .build();

export const App = () => <CdlDiagramView diagram={hello} />;`,
    出口: { to: "/editor", 字: "続き → 5 分で始める" },
  },
  {
    id: "primitives",
    題: "5 つの基本要素",
    本文: [
      "覚えるのは 5 つだけ。 縦列 (`lane`) が場を区切り、 箱 (`node`) が登場する物を表し、 矢印 (`edge`) が関係を引き、 段 (`phase`) が時間を刻み、 値 (`readout`) が数の変化を見せる。 残りはこの 5 つの組合せで足りる。",
      "箱は用途ごとに種類を持つ。 人か、 仕組みか、 貯める所か、 判断する所かで形が変わるので、 種類を 1 語書けば読む人に役割が伝わる。 種類ごとに描ける項目が違い、 書いたのに出ない項目は編集画面で知らせが出る。",
      "この 5 つを先に掴んでおくと、 後の高位の書き方が「どの要素をまとめて置いてくれるのか」 として読める。",
    ],
    コード: undefined,
    出口: { to: "/catalog/primitives", 字: "基本要素の見本を見る →" },
  },
  {
    id: "presets",
    題: "6 種類の高位 API",
    本文: [
      "「順序図が欲しい」 「ER 図で書きたい」 と決まっている時は、 種類を 1 行選ぶだけで骨格ができる。 縦列の位置も、 箱の並びも、 段の刻みも、 その種類に合った既定で埋まる。",
      "手を動かす前に完成形の当たりを付けたい時の最短経路になる。 出てきた骨格に手を入れるのは後からでよく、 気に入らない所だけを基本要素の書き方で上書きできる。",
      "種類を選んだ後に効く既定 (並ぶ向き、 縦列の幅、 箱の間隔) は書き換えられるので、 ひな形から始めても最後まで作り込める。",
    ],
    コード: undefined,
    出口: { to: "/catalog/presets", 字: "ひな形の一覧を見る →" },
  },
  {
    id: "cookbook",
    題: "9 実用例",
    本文: [
      "本番でよく議論される要件を、 そのまま図にした集合がある。 認証の流れ、 記録の読み書き、 待たずに進む処理といった、 説明のたびに描き直していた形を動く図のまま写し取ってある。",
      "使い方は写して直すこと。 会議で「こういう流れ」 と口で言う代わりに動く図を出すと、 どこで止まるか、 どこが同時に走るかが一目で揃う。 議論の起点として置くのが本来の用途になる。",
      "どの例も名前を差し替えるだけで自分の題材になる。 登場人物の名前と線の字を書き換えれば、 段の刻みと光り方はそのまま残るので、 動きを作り直す手間は要らない。",
    ],
    コード: undefined,
    出口: { to: "/catalog/cookbook", 字: "実用例の一覧を見る →" },
  },
  {
    id: "mermaid",
    題: "Mermaid から移行",
    本文: [
      "Mermaid で書いていた図は、 登場人物と流れをそのまま書き写せば動く。 どちらも字で書く記法で、 箱と矢印という骨格が同じだから、 1 対 1 で置き換えられる。",
      "置き換えて得られるのは動きになる。 Mermaid は静止した図までで、 段で状態が移る、 線が順に光る、 数が滑らかに動く、 といった時間の表現を持たない。 同じ面積に載る情報が変わる。",
      "移行の手順は、 まず静止したまま写して形が合うことを確かめ、 次に段を足して動かす、 の 2 段でよい。 1 段目で完成しているので、 動きは後から足せる。",
    ],
    コード: undefined,
    出口: { to: "/catalog", 字: "図の一覧を見る →" },
  },
  {
    id: "eye",
    題: "「目」 が検証する",
    本文: [
      "読めない図を書くと、 書いた時点で知らせが出る。 判定は言葉を読む仕組みに頼らず、 描かれた図の寸法と決まった規則だけで行うので、 同じ図には常に同じ答えが返る。",
      "見るのは 2 種類。 図の置き方 (箱が枠から出ていないか、 名札が線に重なっていないか、 画面の幅に収めた時に字が読める大きさに残るか) と、 記法の書き方 (図の説明に実装の書き方が入り込んでいないか、 無い部品を指していないか、 値が空の図表になっていないか) になる。",
      "編集画面では知らせがその場に出て、 直せるものは押すだけで記法に書き戻せる。 端末からは `pnpm lint:notation` で同じ検査を当てられる。",
    ],
    コード: undefined,
    出口: { to: "/catalog/animation", 字: "動く図の見本を見る →" },
  },
] as const;

/** 札。 `節` の `id` を指すので、節を消した札が残ることはない */
const 札 = [
  { id: "run", アイコン: Timer, 説明: "導入作業なし。 ブラウザで開いて貼るだけ。" },
  { id: "cookbook", アイコン: BookOpen, 説明: "現場でよく出る形をそのまま図にした集合。" },
  { id: "primitives", アイコン: Blocks, 説明: "覚えるのは 5 つ。 残りは組合せで足りる。" },
  { id: "presets", アイコン: Gift, 説明: "種類を 1 行選ぶだけで骨格ができる。" },
  { id: "mermaid", アイコン: Repeat, 説明: "既存の記法を 1 対 1 で置き換えられる。" },
  { id: "eye", アイコン: ScanEye, 説明: "読めない図を書いた時点で知らせが出る。" },
] as const;

/**
 * 本文の中の `` ` `` で囲んだ語を `<code>` にする。
 *
 * 本文は字として書くので、囲みの印をそのまま出すと画面に `` ` `` が見えてしまう。
 * 奇数番目 (0 から数えて 1, 3, 5...) が囲みの中身になる。
 */
function 文を組む(文: string): React.ReactNode[] {
  return 文.split("`").map((部分, i) =>
    i % 2 === 1 ? <code key={i}>{部分}</code> : <span key={i}>{部分}</span>,
  );
}

/** 札から節の題を引く。 引けない札は組み立て時に落ちる */
const 節の題 = (id: string): string => {
  const 見つけた = 節.find((s) => s.id === id);
  if (見つけた === undefined) throw new Error("札が指す節が無い: " + id);
  return 見つけた.題;
};

export function DocsPage(): React.ReactElement {
  useEffect(() => {
    document.body.classList.add("docs-body");
    return () => document.body.classList.remove("docs-body");
  }, []);
  return (
    <div className="docs-body">
      <SiteHeader />
      <main className="docs-hero-shell">
        <section className="docs-hero">
          <div className="docs-hero-eyebrow">使い方の案内 · v0.5</div>
          <h1 className="docs-hero-title">使い方</h1>
          <p className="docs-hero-lead">
            書き方の全体像を 1 枚にまとめた読み物。 最初の 5 分で動かし、 次の 30 分で 5 つの基本要素と
            6 種類の高位 API を掴む。 Mermaid からの移行と、 「目」 による自動検証もここで扱う。
          </p>
          <div className="docs-hero-cta">
            <Link to="/editor" className="docs-hero-cta-primary">
              5 分で始める →
            </Link>
            <Link to="/catalog" className="docs-hero-cta-secondary">
              カタログで図を見る
            </Link>
          </div>
        </section>

        <section className="docs-hero-features">
          {札.map((c) => (
            <a key={c.id} href={"#" + c.id} className="docs-feature-card">
              <div className="docs-feature-icon">
                <c.アイコン size={17} />
              </div>
              <span className="docs-feature-name">{節の題(c.id)}</span>
              <p>{c.説明}</p>
            </a>
          ))}
        </section>

        <div className="docs-sections">
          {節.map((s, i) => (
            <section key={s.id} id={s.id} className="docs-sec">
              <div className="docs-sec-head">
                <span className="docs-sec-no">{String(i + 1).padStart(2, "0")}</span>
                <h2>{s.題}</h2>
              </div>
              {s.本文.map((p) => (
                <p key={p.slice(0, 12)} className="docs-sec-text">
                  {文を組む(p)}
                </p>
              ))}
              {s.コード !== undefined && (
                <pre>
                  <code>{s.コード}</code>
                </pre>
              )}
              <Link to={s.出口.to} className="docs-sec-cta">
                {s.出口.字}
              </Link>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
