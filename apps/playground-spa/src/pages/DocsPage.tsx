import { useEffect } from "react";
import { Link } from "react-router";
import { Blocks, BookOpen, Gift, Repeat, ScanEye, Timer } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { useLocale } from "@/lib/useLocale";

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
    題: { ja: "5 分で動かす", en: "Up and running in five minutes" },
    本文: {
      ja: [
        "入れる物は 2 つだけ。 記法を読む `@cardenelabs/dragon` と、 図を描く `@cardenelabs/cdl` を足せば、 その場で動く図が出る。 組み立ての設定も、 描画の下地も要らない。",
        "書くのは箇条書きに近い形の記法で、 題と種類と登場人物と流れの 4 つを並べる。 これを `textDslToDiagram` に渡すと図の形になり、 `CdlDiagramView` が画面に描く。 段の切替も、 線の光も、 進む点の波も、 書かなくても付く。",
        "何も入れずに試したい時は編集画面を開く。 左に記法を書くと右にその場で図が出るので、 書いた字と描かれた形の対応をその場で確かめられる。",
      ],
      en: [
        "There are only two things to install. Add `@cardenelabs/dragon`, which reads the notation, and `@cardenelabs/cdl`, which draws the diagram, and a moving diagram appears right away. No build configuration, no rendering scaffold.",
        "What you write is close to a bulleted list: a topic, a kind, the actors and the flow, four things in a row. Hand that to `textDslToDiagram` and it becomes a diagram, and `CdlDiagramView` paints it on screen. Phase switching, the glow along a line and the travelling pulse all come without being written.",
        "If you want to try it without installing anything, open the editor. Write notation on the left and the diagram appears on the right, so you can check what you wrote against what was drawn as you go.",
      ],
    },
    コード: `pnpm add @cardenelabs/dragon @cardenelabs/cdl react react-dom`,
    出口: { to: "/editor", 字: { ja: "編集画面で試す →", en: "Try it in the editor →" } },
  },
  {
    id: "feel",
    題: { ja: "30 秒で雰囲気を掴む", en: "A feel for it in thirty seconds" },
    本文: {
      ja: [
        "組み立ての形で書くと、 縦列を置き、 箱を並べ、 線で繋ぎ、 段で動かす、 の 4 手順になる。 下の記述はその最小の形で、 これだけで縦に 2 本の帯が立ち、 箱が 2 つ並び、 線が 1 本光る。",
        "段 (`phase`) は時間の単位で、 題と長さと、 その段で光らせるものを書く。 光らせる対象は箱の名前と線の名前で指すので、 座標を書かなくても意図した所が動く。",
      ],
      en: [
        "Written in the assembly form it is four steps: place the lanes, line up the boxes, connect them with edges, move them by phase. The code below is the smallest version of that, and on its own it stands up two vertical bands, places two boxes and lights one line.",
        "A phase (`phase`) is the unit of time. You write its title, its length and what it lights up. What gets lit is named by box and edge, so the right things move without you writing a single coordinate.",
      ],
    },
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
    出口: { to: "/editor", 字: { ja: "続き → 5 分で始める", en: "Next → start in five minutes" } },
  },
  {
    id: "primitives",
    題: { ja: "5 つの基本要素", en: "Five building blocks" },
    本文: {
      ja: [
        "覚えるのは 5 つだけ。 縦列 (`lane`) が場を区切り、 箱 (`node`) が登場する物を表し、 矢印 (`edge`) が関係を引き、 段 (`phase`) が時間を刻み、 値 (`readout`) が数の変化を見せる。 残りはこの 5 つの組合せで足りる。",
        "箱は用途ごとに種類を持つ。 人か、 仕組みか、 貯める所か、 判断する所かで形が変わるので、 種類を 1 語書けば読む人に役割が伝わる。 種類ごとに描ける項目が違い、 書いたのに出ない項目は編集画面で知らせが出る。",
        "この 5 つを先に掴んでおくと、 後の高位の書き方が「どの要素をまとめて置いてくれるのか」 として読める。",
      ],
      en: [
        "There are only five to learn. A lane (`lane`) divides the field, a box (`node`) stands for something that takes part, an arrow (`edge`) draws a relation, a phase (`phase`) marks time, and a readout (`readout`) shows a number changing. Everything else is a combination of those five.",
        "Boxes carry a kind for what they are for. A person, a system, a place that stores, a place that decides, each takes a different shape, so one word of kind tells the reader the role. Each kind draws a different set of fields, and a field you wrote that will not appear is reported in the editor.",
        "Take these five in first and the higher-level forms that follow read as \"which of these does it place for me\".",
      ],
    },
    コード: undefined,
    出口: { to: "/catalog/primitives", 字: { ja: "基本要素の見本を見る →", en: "See the building blocks →" } },
  },
  {
    id: "presets",
    題: { ja: "6 種類の高位 API", en: "Six higher-level kinds" },
    本文: {
      ja: [
        "「順序図が欲しい」 「ER 図で書きたい」 と決まっている時は、 種類を 1 行選ぶだけで骨格ができる。 縦列の位置も、 箱の並びも、 段の刻みも、 その種類に合った既定で埋まる。",
        "手を動かす前に完成形の当たりを付けたい時の最短経路になる。 出てきた骨格に手を入れるのは後からでよく、 気に入らない所だけを基本要素の書き方で上書きできる。",
        "種類を選んだ後に効く既定 (並ぶ向き、 縦列の幅、 箱の間隔) は書き換えられるので、 ひな形から始めても最後まで作り込める。",
      ],
      en: [
        "When you already know you want a sequence diagram, or that you will write an ER diagram, choosing the kind on one line gives you the skeleton. Lane positions, box order and phase timing are all filled in with defaults that suit that kind.",
        "It is the shortest route when you want a sense of the finished shape before doing the work. Reworking the skeleton comes later, and you can override only the parts you do not like with the building-block form.",
        "The defaults that take effect after you choose a kind (the direction things run, lane width, the gap between boxes) can all be rewritten, so starting from a template does not stop you finishing the job.",
      ],
    },
    コード: undefined,
    出口: { to: "/catalog/presets", 字: { ja: "ひな形の一覧を見る →", en: "See the templates →" } },
  },
  {
    id: "cookbook",
    題: { ja: "9 実用例", en: "Nine worked examples" },
    本文: {
      ja: [
        "本番でよく議論される要件を、 そのまま図にした集合がある。 認証の流れ、 記録の読み書き、 待たずに進む処理といった、 説明のたびに描き直していた形を動く図のまま写し取ってある。",
        "使い方は写して直すこと。 会議で「こういう流れ」 と口で言う代わりに動く図を出すと、 どこで止まるか、 どこが同時に走るかが一目で揃う。 議論の起点として置くのが本来の用途になる。",
        "どの例も名前を差し替えるだけで自分の題材になる。 登場人物の名前と線の字を書き換えれば、 段の刻みと光り方はそのまま残るので、 動きを作り直す手間は要らない。",
      ],
      en: [
        "There is a set of diagrams built straight from the requirements that come up most in production. Sign-in flows, reading and writing records, work that carries on without waiting: the shapes you redraw every time you explain them, captured as diagrams that already move.",
        "The way to use them is to copy and adjust. Put a moving diagram up instead of saying \"it goes something like this\" out loud in a meeting, and where it stalls and what runs at the same time line up at a glance. Being the starting point for the discussion is what they are for.",
        "Every example becomes yours by swapping the names. Rewrite the actor names and the edge labels and the phase timing and the way things light up stay as they were, so there is no animation to rebuild.",
      ],
    },
    コード: undefined,
    出口: { to: "/catalog/cookbook", 字: { ja: "実用例の一覧を見る →", en: "See the worked examples →" } },
  },
  {
    id: "mermaid",
    題: { ja: "Mermaid から移行", en: "Moving over from Mermaid" },
    本文: {
      ja: [
        "Mermaid で書いていた図は、 登場人物と流れをそのまま書き写せば動く。 どちらも字で書く記法で、 箱と矢印という骨格が同じだから、 1 対 1 で置き換えられる。",
        "置き換えて得られるのは動きになる。 Mermaid は静止した図までで、 段で状態が移る、 線が順に光る、 数が滑らかに動く、 といった時間の表現を持たない。 同じ面積に載る情報が変わる。",
        "移行の手順は、 まず静止したまま写して形が合うことを確かめ、 次に段を足して動かす、 の 2 段でよい。 1 段目で完成しているので、 動きは後から足せる。",
      ],
      en: [
        "A diagram you were writing in Mermaid will move once you copy the actors and the flow across. Both are notations you write as text, and the skeleton of boxes and arrows is the same, so it maps one to one.",
        "What you gain by moving over is motion. Mermaid stops at a still picture: it has no way to express time, no state moving on a phase, no line lighting in order, no number sliding smoothly. What fits in the same area of the page changes.",
        "The migration goes in two steps: first copy it across while it is still, and check the shape matches; then add phases and make it move. It is already finished after the first step, so the motion can come later.",
      ],
    },
    コード: undefined,
    出口: { to: "/catalog", 字: { ja: "図の一覧を見る →", en: "See every diagram →" } },
  },
  {
    id: "eye",
    題: { ja: "「目」 が検証する", en: "The \"eye\" checks your work" },
    本文: {
      ja: [
        "読めない図を書くと、 書いた時点で知らせが出る。 判定は言葉を読む仕組みに頼らず、 描かれた図の寸法と決まった規則だけで行うので、 同じ図には常に同じ答えが返る。",
        "見るのは 2 種類。 図の置き方 (箱が枠から出ていないか、 名札が線に重なっていないか、 画面の幅に収めた時に字が読める大きさに残るか) と、 記法の書き方 (図の説明に実装の書き方が入り込んでいないか、 無い部品を指していないか、 値が空の図表になっていないか) になる。",
        "編集画面では知らせがその場に出て、 直せるものは押すだけで記法に書き戻せる。 端末からは `pnpm lint:notation` で同じ検査を当てられる。",
      ],
      en: [
        "Write a diagram that cannot be read and you are told at the moment you write it. The judgement leans on no language model: it uses only the measurements of the drawn diagram and a fixed set of rules, so the same diagram always gets the same answer.",
        "It looks at two things. How the diagram is laid out (whether a box runs outside its frame, whether a label sits on top of a line, whether the text is still large enough to read once it is fitted to the screen width) and how the notation is written (whether implementation wording has crept into a diagram's description, whether it points at a part that does not exist, whether a chart has been left with no values).",
        "In the editor the report appears in place, and anything that can be fixed is written back into the notation with one press. From a terminal `pnpm lint:notation` runs the same checks.",
      ],
    },
    コード: undefined,
    出口: { to: "/catalog/animation", 字: { ja: "動く図の見本を見る →", en: "See the moving examples →" } },
  },
] as const;

/** 呼びかけの字。 節と札と同じく、言語で選ぶ形で持つ (#2452) */
const 呼びかけ = {
  前置き: { ja: "使い方の案内 · v0.5", en: "guide • v0.5" },
  題: { ja: "使い方", en: "Docs" },
  説明: {
    ja: "書き方の全体像を 1 枚にまとめた読み物。 最初の 5 分で動かし、 次の 30 分で 5 つの基本要素と 6 種類の高位 API を掴む。 Mermaid からの移行と、 「目」 による自動検証もここで扱う。",
    en: "One page that lays out how the notation works end to end. Get it running in the first five minutes, then take in the five building blocks and the six higher-level kinds over the next thirty. Moving over from Mermaid and the automatic checks done by the \"eye\" are covered here too.",
  },
  強い釦: { ja: "5 分で始める →", en: "Start in five minutes →" },
  弱い釦: { ja: "カタログで図を見る", en: "Browse the catalog" },
} as const;

/** 札。 `節` の `id` を指すので、節を消した札が残ることはない */
const 札 = [
  { id: "run", アイコン: Timer, 説明: { ja: "導入作業なし。 ブラウザで開いて貼るだけ。", en: "Nothing to set up. Open the browser and paste." } },
  { id: "cookbook", アイコン: BookOpen, 説明: { ja: "現場でよく出る形をそのまま図にした集合。", en: "The shapes that keep coming up, already drawn." } },
  { id: "primitives", アイコン: Blocks, 説明: { ja: "覚えるのは 5 つ。 残りは組合せで足りる。", en: "Five to learn. The rest is combinations." } },
  { id: "presets", アイコン: Gift, 説明: { ja: "種類を 1 行選ぶだけで骨格ができる。", en: "Choose a kind on one line and the skeleton appears." } },
  { id: "mermaid", アイコン: Repeat, 説明: { ja: "既存の記法を 1 対 1 で置き換えられる。", en: "Swap your existing notation across one to one." } },
  { id: "eye", アイコン: ScanEye, 説明: { ja: "読めない図を書いた時点で知らせが出る。", en: "A diagram that cannot be read is reported as you write it." } },
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

/** 言語で選ぶ字。 日本語と英語を必ず両方持つ (#2452) */
interface 二言語 {
  ja: string;
  en: string;
}

/** 開いている言語の側を取る */
const 選ぶ = (x: 二言語, isJa: boolean): string => (isJa ? x.ja : x.en);

/** 本文は段の並びで持つので、並びごと選ぶ */
const 選ぶ本文 = (x: { ja: readonly string[]; en: readonly string[] }, isJa: boolean): readonly string[] =>
  isJa ? x.ja : x.en;

/** 札から節の題を引く。 引けない札は組み立て時に落ちる */
const 節の題 = (id: string, isJa: boolean): string => {
  const 見つけた = 節.find((s) => s.id === id);
  if (見つけた === undefined) throw new Error("札が指す節が無い: " + id);
  return 選ぶ(見つけた.題, isJa);
};

export function DocsPage(): React.ReactElement {
  const [locale] = useLocale();
  const isJa = locale === "ja";
  useEffect(() => {
    document.body.classList.add("docs-body");
    return () => document.body.classList.remove("docs-body");
  }, []);
  return (
    <div className="docs-body">
      <SiteHeader />
      <main className="docs-hero-shell">
        <section className="docs-hero">
          <div className="docs-hero-eyebrow">{選ぶ(呼びかけ.前置き, isJa)}</div>
          <h1 className="docs-hero-title">{選ぶ(呼びかけ.題, isJa)}</h1>
          <p className="docs-hero-lead">{選ぶ(呼びかけ.説明, isJa)}</p>
          <div className="docs-hero-cta">
            <Link to="/editor" className="docs-hero-cta-primary">
              {選ぶ(呼びかけ.強い釦, isJa)}
            </Link>
            <Link to="/catalog" className="docs-hero-cta-secondary">
              {選ぶ(呼びかけ.弱い釦, isJa)}
            </Link>
          </div>
        </section>

        <section className="docs-hero-features">
          {札.map((c) => (
            <a key={c.id} href={"#" + c.id} className="docs-feature-card">
              <div className="docs-feature-icon">
                <c.アイコン size={17} />
              </div>
              <span className="docs-feature-name">{節の題(c.id, isJa)}</span>
              <p>{選ぶ(c.説明, isJa)}</p>
            </a>
          ))}
        </section>

        <div className="docs-sections">
          {節.map((s, i) => (
            <section key={s.id} id={s.id} className="docs-sec">
              <div className="docs-sec-head">
                <span className="docs-sec-no">{String(i + 1).padStart(2, "0")}</span>
                <h2>{選ぶ(s.題, isJa)}</h2>
              </div>
              {選ぶ本文(s.本文, isJa).map((p) => (
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
                {選ぶ(s.出口.字, isJa)}
              </Link>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
