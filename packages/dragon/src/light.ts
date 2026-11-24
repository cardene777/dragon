/**
 * dragon の軽い入口 (`@cardenelabs/dragon/light`、#3248、#3349)。
 *
 * 既定の入口と同じ部品を出すが、cards、chart、cycle、er、flow、git、lineup、matrix、mind、pipe、sankey、state、time、tree、try、venn の描く部品と、その図の種類だけの個別ブロックの読み方を持たない。
 * コアブロックと、時系列図と構成図の個別ブロックの読み方は初めから持つ。
 *
 * - `loadFor(<記法か原本>)` を待つと、書いた図の種類の描く部品と、書いた図が使う個別ブロックの読み方だけを読む。原本の JSON を渡した時だけ、原本の形の検査も読む (#3400)
 * - `loadKind(<種類>)` を待つと、その種類の描く部品と、その種類の個別ブロックの読み方と、原本の形の検査を全て読む (裏で先に読む時に使う)
 * - `loadReadings(<記法か原本>)` を待つと、書いた図が使う個別ブロックの読み方だけを読み、描く部品は読まない (題と種類だけを引く時に使う)
 * - `diagramKind(<記法か原本>)` は、読む前に図の種類を返す。どの種類の `loadKind` を待つかを決める時に使う
 * - `definesBlocks(<記法>)` は、記法が足すブロックの定義の行 (`blocks 1`) を持つかを返す。持つ記法は `loadReadings` か `loadFor` を待ってから読む (#3399、#3407)
 * - `loadLine(<線の描き方>)` を待つと、その描き方で描くのに要る部品を読む。手描きの線 (`pen`、#3643) の時だけ、描き替える処理を読む
 * - `loadLook(<時系列図の見た目>)` を待つと、その見た目で並べて描く部品を読む。パイプ図の部品で描く見た目 (`pipe`、#3720) の時だけ読む。
 *   `loadFor` は、種類の行に `[shape: pipe]` を書いた時系列図の時にこれも待つ。`lookOf(<記法か原本>)` は図が選んだ見た目を返す
 * - `loadValidator()` を待つと、原本の形の検査だけを読む。`parseNotation` で記法から読んだ図は描く時に検査を省くので、原本の JSON を読む頁だけが要る (#3400)
 * - 箱と区画の `icon` に絵柄集の絵柄 (`tabler:<名前>`) を書いた図は、`loadFor` と `loadReadings` が絵柄集の表も読む。`iconSetLoaded("tabler")` は読んだかを返す (#3493)
 *
 * 読んだ後は既定の入口と同じ関数で、待たずに同じ図を読み、描き、書き戻す。
 * 読んでいない種類を描くと種類の名前を含む誤りで、読んでいない個別ブロックの行を読むとブロックの名前を含む誤りで止まる。
 * 最初に読む量を抑えたい頁を束ねる時に使い、この入口と既定の入口を 1 つの頁で混ぜない (混ぜると全ての部品が頁に入る)。
 */
// 時系列図と構成図の並べ方は初めから持つ。種類の登録の file が読み込みの時に登録簿へ登録する (#3763)
import "./kind-use/architecture";
import "./kind-use/sequence";

export * from "./api";
// 読む処理は script の1行の入口も直に使うので、別の file に置く (#3782)
export {
  blockLoaded,
  definesBlocks,
  diagramKind,
  iconSetLoaded,
  kindLoaded,
  LATER_BLOCKS,
  LATER_KINDS,
  type LaterKind,
  loadFor,
  loadKind,
  loadLine,
  loadLook,
  loadReadings,
  loadValidator,
} from "./light-load";
