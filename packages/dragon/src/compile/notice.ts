/**
 * 組み立てが出す知らせの形 (#2030 で `compile.ts` から移した)。
 *
 * 図種ごとの file が受け取り口の型として使い、`compile.ts` が再輸出して外へ出す。
 *
 * **葉に置く** = 型そのものは消えるが、TypeScript の取り込みの輪は残る。 輪があると
 * 読む順で解決が変わるため、型でも輪を作らない。
 */

/** 図は出せるが書いた通りにならなかった、 という知らせ。 */
export type CompileNotice = {
  kind:
    | "relative-position-ignored"
    | "focus-target-missing"
    | "state-override-rejected"
    | "external-paint-dropped"
    // 図の中に描く部品を持たない見本を重ねた (#1017)
    | "part-not-drawn"
    // 向きが効かない形で `向き:` を書いた (#1494)
    | "direction-not-honored"
    // `倍率:` を書いた見本が、同じ名前の状態も持っていた (#1026)
    | "scale-reserved"
    // 部品に書いた色が効かない (#1973)。 色番号を入れる状態を 1 つも持たない部品に色番号を
    // 書いた時と、色番号でなく色の名前を書いた時
    | "part-color-ignored"
    // 部品に、部品が持たない状態の名前で値を書いた (#1976)。 綴り違いと、外した欄 (`nodes`) を書いた時
    | "part-state-missing"
    // 部品へ引いた矢印を、部品の中のどの要素にも繋げず外した (#1979)。 要素が 2 つ以上あり名指しが無い時、
    // 名指しした要素が部品に無い時、部品を取り込まなかった時
    | "part-edge-dropped"
    // 種類 (`kind`) に書いた名前が、箱の種類にも渡された部品の一覧にも無い (#2113)。 箱の種類の綴り違いも
    // 部品の名前とみなされてここに来る。 部品の一覧を渡さない組み立てでは出さない
    | "part-not-found"
    // 矢印に部品の要素の名指し (`fromPartNode` / `toPartNode`) を書いたが、その端が部品でない (#1979)
    | "part-node-ignored"
    // 縦列に置くはずの部品が他の箱の位置の基準になっていて、縦列に置けなかった (#1980)
    | "part-lane-ignored"
    // 箱ごとの値や時期を読んで 1 つの図に描く図種で、読めない項目があった (#1154)。 使う図種は
    // 各図種の組み立て (`compile/*.ts`) が決める
    | "chart-value-unreadable"
    // 同じ図種で、書いた矢印を描かなかった (#1154)。 関係を描かない図種と、端を描けない矢印 (工程表で
    // 時期の無い項目を指す等、#2111)
    | "chart-edge-dropped"
    // 同じ名前を `states` と `values` の両方に書いた (#1162)
    | "value-shadows-state"
    // 式を解けず、その値を止めた (輪 / 無い名前 / 読めない式 / 数として読めない値、 #1162)
    | "value-unresolved"
    // 同じ名前を `values` に 2 度書いた。 先に書いた式を使う (#1162)
    | "value-duplicate"
    // 矢印が `actors` に無い名前を指した (#1209)
    | "flow-actor-missing"
    // きっかけ形の値を段に畳めなかった (段が無い / 相手が境目を通らない / 段からはみ出す、 #1161)
    | "value-trigger-unresolved"
    // 箱に `lane:` を書いたが、 縦列は図種が決めるため効かなかった (#1246)
    | "lane-not-honored"
    // `lanes:` に書いた縦列に箱が 1 つも入らなかった (#1241)
    | "lane-declared-empty"
    // 最上位に `eyebrow:` を書いたが、 箱ごとに分かれる図種で相手が決まらなかった (#1247)
    | "eyebrow-not-honored"
    // 静止した `type: flow` で、書いた矢印の端が使われなかった (#1269)
    | "flow-endpoint-not-honored"
    // 起点から描く動きを持たない図種で段に `draw:` を書いた (#1312)
    | "draw-not-honored"
    // `draw:` の語がその図種と食い違う (`type: bar` に `draw: pie`、 #1314)
    | "draw-target-mismatch"
    // 式が、どこにも書かれていない名前を読んだ (#1391)
    | "formula-unresolved"
    // 出来事が指す相手が図に無い (#1393)。 書いた名前が本文のどこにも無い時に出す = 書き直せば直る
    | "event-target-missing"
    // 出来事が指す名前は本文に在るが、この図種はそれを箱 / 矢印にしない (#2336)。
    // 値を並べる図種は図全体で 1 つの箱になり、 順序図と solidity は 1 枚の板になる。
    // `event-target-missing` と分けるのは、こちらが **書き直しても直らない** 側だから
    | "event-target-not-honored"
    // 順序図で面に種類を書いたが、板は名前と呼び名しか描かない (#1466)
    | "actor-kind-not-honored"
    // 箱に、その図種が描かない指定を書いた (#2360)。 木の図は位置も大きさも親子関係から決めるため
    // 箱ごとの飾りを載せる先が無い。 板の 2 図種は `actor-kind-not-honored` が受け持つ
    | "actor-option-not-honored"
    // 順序図の言づてに、板が描かない飾りを書いた (#1466)。 数える飾りは `reportMessageOptionNotHonored` の一覧が持つ
    | "message-option-not-honored"
    // 位置のずらし (`pos` / `offsetX` / `offsetY`) を載せる相手が無いか、書いた量だけ動かせなかった (#1971)
    | "position-offset-ignored"
    // 組 (`groups:`) が束ねる縦列が図に無い (#1972)
    | "group-lane-missing"
    // 組が束ねる縦列の間に、束ねない縦列を挟んでいる (#1972)
    | "group-lanes-apart"
    // 矢印に書いた多重度 (`cardinality`) から端の形を描けない (#2107)。 `er` で端の形が決まる 6 語以外を
    // 書き、端を両方は書いていない時と、`er` 以外の図種に書いた時
    | "cardinality-not-honored"
    // 矢印に、その図種が描かない飾り (文字 / 色 / 線種 / 多重度) を書いた (#2111)。 工程表の矢印は
    // 前後の関係だけを使う
    | "edge-option-not-honored"
    // 工程表の項目の終わりが始まりより前か、状態で決まる終わりが始まりより前の値を取る (#2111)
    | "gantt-end-before-start";
  /** 対象の名前。 光らせる相手なら書かれた指定そのまま */
  actor: string;
  /** 書かれていた行 */
  line: number;
  message: string;
  hint?: string;
};
