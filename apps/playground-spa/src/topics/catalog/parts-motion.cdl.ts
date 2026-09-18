import { textDslToDiagram } from "@cardenelabs/dragon";

import { 部品の一覧を作る } from "../../lib/parts-catalog";
import * as 部品 from "./parts.cdl";

/**
 * Catalog - 部品を繋いで動かす見本 (#2125)。
 *
 * 部品を矢印で繋ぎ、**繋いだまま段で動かす**。 繋ぎ方だけを見せる頁 (`parts-in-box.cdl.ts`) は
 * 段を 1 つも持たず、動く部品の頁 (`parts.cdl.ts`) は矢印を 1 本も持たない。 どちらの頁でも
 * 「繋いだ先へ値が渡っていく」 絵は出ないため、その 1 点だけを見せる頁として分ける。
 *
 * ## 宿主の段が部品の中の値を動かす
 *
 * 部品を箱として置くと、部品の中の値は `{部品の名前}__{値の名前}` という名前で図に入る
 * (spec の § 2.5)。 宿主の段の `tween` にその名前を書くと、部品の中の値が宿主の段で動く。
 *
 * **部品の名前は英字で書く**。 値の名前は英字と `_` しか受け付けない
 * (`packages/dragon/src/value-syntax.ts` の `VALUE_NAME_RE`)。 日本語の名前を付けた部品は
 * 矢印で繋ぐことはできるが、`在庫__lv` は値の名前として読めないので宿主の段から動かせない。
 * 繋ぐだけの箱 (`受注` / `記録`) は日本語のままでよい。
 *
 * ## `phase: false` と組にする
 *
 * 部品は自分の段を持ち、既定では宿主の段と番号ごとに並行合成される。 宿主が同じ値を動かすと
 * 部品の段と宿主の段が同じ値を取り合うため、動かす部品には `phase: false` を書いて部品の段を
 * 空にする。 最後の切替だけは、この 2 つの形を並べて違いそのものを見せるので書かない。
 *
 * ## 図の種類は `swimlane`
 *
 * `flow` と `topology` は部品を他の箱の下の格子に置くため、矢印が間の箱を貫く (#1979 の実測)。
 * 繋ぎ方の頁と同じ理由で `swimlane` を使う。
 *
 * ## 切替の一覧
 *
 * 数は書かない = 切替を足すたびに動く (実数は `parts-motion-content.test.ts` が名前で持つ)。
 *
 * | 切替 | 見せること |
 * |---|---|
 * | 流れに沿って動かす | 繋いだ順に値が渡る。 段ごとに矢印を光らせ、受け手の値を同じ段で動かす |
 * | 要素ごとに繋ぐ | 要素を 3 つ持つ部品で、上層と底層を名指しして繋ぎ、その層の値だけを動かす |
 * | 分ける | 1 つの箱から 2 つの部品へ分け、同じ段で 2 つの値を別々に動かす |
 * | 集める | 2 つの部品から 1 つの箱へ集め、集める段で 2 本の矢印を同時に光らせる |
 * | 部品の段を残す | 部品の段のままの部品と、宿主が動かす部品を並べる |
 * | 振り分けて合流させる | 振り分け器の出口 A / B を合流点の入口 A / B へ繋ぎ、段で入口だけ・出口と入口だけを名指しして光らせる (#2149 / #2151) |
 * | 配ってから写す | 負荷分散器の出口 3 つのうち真ん中の 1 つだけを複製器の発行へ繋ぎ、分けると写すの違いを 1 枚で見せる (#2159) |
 * | 仕分けてから溜める | 仕分け箱の 3 つの出口のうち「注文」 だけをまとめ箱の届くへ繋ぎ、分けた分だけが溜まることを見せる (#2173) |
 * | やり直してから倒す | やり直しの輪の通るを切替器の入口へ繋ぎ、戻る線を持つ部品も他の部品と組めることを見せる (#2175) |
 * | 重なりを消してから溜める | 重なり消し箱の残すをまとめ箱の届くへ繋ぎ、減った分だけが溜まって送る回数が減ることを見せる (#2195) |
 * | 写してから待ち合わせる | 写し箱の 2 つの出口を待ち合わせ箱の左右へ繋ぎ、2 本の線で受ける唯一の形を見せる (#2195) |
 * | そろってから遮断する | 待ち合わせ箱のそろった分を遮断器の入口へ繋ぎ、2 段構えで減る形を見せる (#2195) |
 * | 割ってから溜める | 割り箱の小さい荷物をまとめ箱の届くへ繋ぎ、割って増えた分を溜め直す形を見せる (#2204) |
 * | 割ってから詰まらせる | 割り箱の小さい荷物を押し戻し箱の送るへ繋ぎ、増えた分が後ろを詰まらせる形を見せる (#2204) |
 * | そろってから押し出す | 待ち合わせ箱のそろった分を押し出し箱の届くへ繋ぎ、置き場に入り切らない分が出る形を見せる (#2204) |
 * | 落ちた分が消える | 遮断器の落ちるを期限切れ箱の置くへ繋ぎ、誰も消しに行かないのに減る形を見せる (#2204) |
 * | 鍵の偏りを釣り合わせる | 鍵割り箱の 2 つの先を釣り合い箱の送り主 2 人へ繋ぎ、鍵が作った偏りが出口で均される形を見せる (#2210) |
 * | 落ちた分が相乗りする | 遮断器の落ちるを相乗り箱の問いへ繋ぎ、いっせいの問い直しが 1 本にまとまる形を見せる (#2210) |
 * | 順に戻してから溜める | 順番戻し箱の出せるをまとめ箱の届くへ繋ぎ、番が来た分だけが束になる形を見せる (#2210) |
 * | 釣り合わせてから順に戻す | 釣り合い箱の出すを順番戻し箱の届くへ繋ぎ、交互に出すと元の順でなくなる形を見せる (#2210) |
 * | よけてから溜める | よけ道箱の先へ進むをまとめ箱の届くへ繋ぎ、諦めた分が次の箱へ渡らない形を見せる (#2218) |
 * | 問い合わせを一人ずつ通す | 仕分け箱の問い合わせを一人ずつ箱の同時に来るへ繋ぎ、分けた先で順番待ちが起きる形を見せる (#2218) |
 *
 * ## 繋ぐ先の段は数字ではなく詰めた後の並びで決まる (#2204 の実測)
 *
 * まとめ箱の「まとめて送る」 (段 1) を押し戻し箱の「送る」 (段 1) へ繋ぐと、矢印が折れた
 * (実測 `M 601 513 L 725 513 Q 739 513, 739 499 L 739 277 Q 739 263, 753 263 L 877 263`)。
 * **段の数字は同じでも、部品が使っていない段は詰められる**。 まとめ箱は段 0 と 1 を使うので
 * 「まとめて送る」 は上から 2 行目に、押し戻し箱は段 1 と 2 を使うので「送る」 は上から 1 行目に来る。
 *
 * 指摘は拡大の器でも一覧の器でも 0 件で、板の大きさも 1587 × 672 と普通だった。
 * 気付けるのは `両端の要素を名指しして繋いだ矢印は折れない` (#2159) の道筋の検査だけ。
 * 繋ぐ組を選ぶ時は、段の数字ではなく **その部品が使っている段を上から数え直した位置** を見る。
 *
 * ## 分けると集めるを箱と計器の 1 枚にまとめない
 *
 * 箱と計器の 4 つで「1 → 2 → 1」 を 1 枚に書くと、縦列が 4 本になって図が 2634 × 780 になり、
 * 一覧の器 (1150 × 630) に収めた時に箱の題が 9.6px まで縮む (下限 12px、実測)。
 * 3 本ずつの 2 枚に割ると 1 枚あたりの縦列が 3 本になり、どちらも指摘 0 件で収まる。
 *
 * 繋ぐ部品の縦列の本数も同じ理由で選ぶ。 縦列 3 本の部品 (流量制限 / 優先度の並べ替え) を混ぜると
 * 縦列が 5 本以上になり、一覧の器で箱の題が 9.6px まで縮む (実測)。 縦列の幅 (`viewport.laneWidth`)
 * を 240 から 150 まで下げても横幅は 2033 から 2013 までしか縮まないので、本数で収める。
 * 「配ってから写す」 は縦列 2 本の部品 2 枚で 4 本に収め、幅 200 で 1515 × 922 になる。
 * 「仕分けてから溜める」 も同じ 4 本で、幅 200 で 1587 × 922 になる。 幅 240 だと 1607 に伸び、
 * 一覧の器で箱の題が 12.0px の境に乗る (実測)。
 * 「やり直してから倒す」 は札を 3 字にして 1533 × 960 に収めた。 4 字の「通った分」 だと 1605 に伸び、
 * 同じ境に乗る (実測)。
 * **5 字の札が 1 つあると板が 1659 に伸びる。 部品の中でも繋ぐ線でも同じ** (#2195 / #2210 の実測)。
 * 写し箱の中の札が 5 字 (「写しがある」) の時、繋いだ板は 1659 に伸びて箱の題が 11.6px になった。
 * 札を 4 字 (「写しあり」) にすると部品そのものが 764 から 740 に縮み、繋いだ板も 1587 に収まった。
 * 繋ぐ線の札でも同じで、5 字 (「順に出た分」) で 1659、4 字 (「出せた分」) で 1587 になる (#2210)。
 *
 * #2195 の時点では「繋ぐ側の札を短くしても変わらない」 と書いていたが、それはあの図で
 * **部品の中にもっと長い札があった** ためで、繋ぐ線が幅に効かないという意味ではない。
 * 効くのは **その列で一番長い札** で、部品の中か繋ぐ線かは問わない。 帯の札は幅を変えない
 * (「並べ直す」 を「戻す」 にしても 1659 のまま、実測)。
 * 札の字も短くする = 負荷分散器の札を「真ん中へ」 にすると図が 1659 に伸び、一覧の器で
 * 箱の題が 11.6px になった (実測)。 幅は 1602 までなら 12px に届く。
 *
 * 「振り分けて合流させる」 は 1 枚で「1 → 2 → 1」 を描く。 振り分け器と合流点は 1 つの部品が
 * 入口と出口の 2 本の縦列を持ち、縦列の幅が 200 と狭いため、4 本の縦列でも図が 1475 × 922 に収まり、
 * どちらの器でも指摘 0 件になる (実測)。 2 つの部品は同じ 3 段に要素を置く (振り分け器は入口を、
 * 合流点は出口を真ん中の段、#2154) ので、出口 A と入口 A、出口 B と入口 B が同じ高さに並び、
 * 部品どうしの矢印が真横に引ける。 部品の中の線の札は数字にしない = 振り分け器が「7 割」 を
 * 送った先で合流点が「6 割」 と書く食い違いが出るため、割合は箱の上の読み取りに任せる。
 *
 * ## 段で部品の中を名指しして光らせる
 *
 * 部品の名前を `focus` に書くと部品の要素と中の線が全て光る (#2150)。 1 段目は入口だけ、3 段目は
 * 渡す出口と受ける入口だけを見せたいので、`split__inP` のように `{部品の名前}__{要素}` で名指しする
 * (#2151)。 2 段目と 4 段目は部品の中で値が動くので、部品の名前で全体を光らせる。
 *
 * 右側の計器に温度計 (`thermometer`) を使うと図の高さが 780 から 2279 に跳ね、
 * 矢印の札が隣の縦列の境を貫く (実測)。 幅 220 の部品と幅 360 の部品が横に並ぶ形を避け、
 * 同じ幅 (360) の `state-indicator` と `arc-gauge` を組にする。
 */

const 部品の一覧 = 部品の一覧を作る(Object.values(部品));

export const patternBase__partsMotion = "流れに沿って動かす";

export const subtitle__partsMotion =
  "部品を矢印で繋いだまま段で動かし、繋いだ先へ値を渡し、要素を名指しして層ごとに動かし、2 つの部品へ分け、2 つの部品から 1 つの箱へ集め、部品の段のままの部品と宿主が動かす部品を並べ、振り分け器の出口を合流点の入口へ繋ぎ、負荷分散器の出口 1 つを複製器へ繋いで分けると写すの違いを見せ、仕分け箱の出口 1 つをまとめ箱へ繋いで分けた分だけが溜まることを見せ、やり直しの輪の通るを切替器の入口へ繋いで戻る線を持つ部品も組めることを見せ、重なり消し箱の残すをまとめ箱へ繋いで減った分だけが溜まることを見せ、写し箱の 2 つの出口を待ち合わせ箱の左右へ 2 本の線で繋ぎ、待ち合わせ箱のそろった分を遮断器へ繋いで 2 段構えで減る形を見せる";

export const sourceYaml__partsMotion = `title: "入ってくる量を溜めて送り出す"
type: swimlane

# 部品の名前は英字。 宿主の段が動かす値の名前 (inflow__pv) が英字しか受け付けないため
actors:
  - inflow: { kind: horizontal-bar, phase: false }
  - tank: { kind: wave-gauge, phase: false }
  - outflow: { kind: arc-gauge, phase: false }

flow:
  - inflow -> tank: "溜める"
  - tank -> outflow: "送り出す"

animation:
  - step: "1. 入ってくる" 1.2s
    focus: [inflow]
    badge: "流量"
    tween:
      inflow__pv: 0 -> 85
    body: "受け入れの棒が 85% まで伸びる。 まだ溜めていない。"
  - step: "2. 溜まる" 1.2s
    focus: [inflow, tank, "inflow -> tank"]
    badge: "水位"
    tween:
      tank__lv: 0 -> 72
    body: "入ってきた分が槽に移る。 水位が 72% まで上がる。"
  - step: "3. 送り出す" 1.2s
    focus: [tank, outflow, "tank -> outflow"]
    badge: "放出"
    tween:
      tank__lv: 72 -> 28
      outflow__v: 0 -> 95
    body: "槽が 28% まで減り、送り出しの弧が 95% まで回る。"
  - step: "4. 落ち着く" 1.2s
    focus: [inflow, tank, outflow]
    badge: "定常"
    tween:
      inflow__pv: 85 -> 35
      outflow__v: 95 -> 35
    body: "入る量と出る量が 35% で釣り合い、水位が動かなくなる。"
`;

export const sourceJson__partsMotion = `{
  "title": "入ってくる量を溜めて送り出す",
  "type": "swimlane",
  "actors": [
    { "name": "inflow", "kind": "horizontal-bar", "phase": false },
    { "name": "tank", "kind": "wave-gauge", "phase": false },
    { "name": "outflow", "kind": "arc-gauge", "phase": false }
  ],
  "flow": [
    { "from": "inflow", "to": "tank", "label": "溜める" },
    { "from": "tank", "to": "outflow", "label": "送り出す" }
  ],
  "animation": [
    {
      "step": "1. 入ってくる",
      "duration": 1.2,
      "focus": ["inflow"],
      "badge": "流量",
      "tween": { "inflow__pv": [0, 85] },
      "body": "受け入れの棒が 85% まで伸びる。 まだ溜めていない。"
    },
    {
      "step": "2. 溜まる",
      "duration": 1.2,
      "focus": ["inflow", "tank", "inflow -> tank"],
      "badge": "水位",
      "tween": { "tank__lv": [0, 72] },
      "body": "入ってきた分が槽に移る。 水位が 72% まで上がる。"
    },
    {
      "step": "3. 送り出す",
      "duration": 1.2,
      "focus": ["tank", "outflow", "tank -> outflow"],
      "badge": "放出",
      "tween": { "tank__lv": [72, 28], "outflow__v": [0, 95] },
      "body": "槽が 28% まで減り、送り出しの弧が 95% まで回る。"
    },
    {
      "step": "4. 落ち着く",
      "duration": 1.2,
      "focus": ["inflow", "tank", "outflow"],
      "badge": "定常",
      "tween": { "inflow__pv": [85, 35], "outflow__v": [95, 35] },
      "body": "入る量と出る量が 35% で釣り合い、水位が動かなくなる。"
    }
  ]
}`;

export const partsMotion = textDslToDiagram(sourceYaml__partsMotion, {
  partsCatalog: 部品の一覧,
});

export const sourceYaml__pattern__partsMotion__要素ごとに繋ぐ = `title: "在庫の上層へ積み、底層から出荷する"
type: swimlane

actors:
  - 受注: { kind: card }
  - stock: { kind: stacked-layer, phase: false }
  - 出荷: { kind: card }

flow:
  - 受注 -> stock: "上層へ積む" { toPartNode: topL }
  - stock -> 出荷: "底層から出す" { fromPartNode: botL }

animation:
  - step: "1. 受ける" 1.0s
    focus: [受注]
    badge: "受注"
    body: "注文が届く。 在庫はまだ動かない。"
  - step: "2. 上層へ積む" 1.2s
    focus: [受注, stock, "受注 -> stock"]
    badge: "入庫"
    tween:
      stock__top: 20 -> 55
    body: "矢印が上層に刺さり、上層だけが 20 から 55 へ増える。"
  - step: "3. 中層へ回す" 1.2s
    focus: [stock]
    badge: "移動"
    tween:
      stock__top: 55 -> 30
      stock__mid: 15 -> 40
    body: "上層から中層へ 25 だけ移る。 合計は変わらない。"
  - step: "4. 底層から出す" 1.2s
    focus: [stock, 出荷, "stock -> 出荷"]
    badge: "出庫"
    tween:
      stock__bot: 40 -> 12
    body: "矢印が底層から出る。 底層だけが 40 から 12 へ減る。"
`;

export const sourceJson__pattern__partsMotion__要素ごとに繋ぐ = `{
  "title": "在庫の上層へ積み、底層から出荷する",
  "type": "swimlane",
  "actors": [
    { "name": "受注", "kind": "card" },
    { "name": "stock", "kind": "stacked-layer", "phase": false },
    { "name": "出荷", "kind": "card" }
  ],
  "flow": [
    { "from": "受注", "to": "stock", "label": "上層へ積む", "toPartNode": "topL" },
    { "from": "stock", "to": "出荷", "label": "底層から出す", "fromPartNode": "botL" }
  ],
  "animation": [
    {
      "step": "1. 受ける",
      "duration": 1.0,
      "focus": ["受注"],
      "badge": "受注",
      "body": "注文が届く。 在庫はまだ動かない。"
    },
    {
      "step": "2. 上層へ積む",
      "duration": 1.2,
      "focus": ["受注", "stock", "受注 -> stock"],
      "badge": "入庫",
      "tween": { "stock__top": [20, 55] },
      "body": "矢印が上層に刺さり、上層だけが 20 から 55 へ増える。"
    },
    {
      "step": "3. 中層へ回す",
      "duration": 1.2,
      "focus": ["stock"],
      "badge": "移動",
      "tween": { "stock__top": [55, 30], "stock__mid": [15, 40] },
      "body": "上層から中層へ 25 だけ移る。 合計は変わらない。"
    },
    {
      "step": "4. 底層から出す",
      "duration": 1.2,
      "focus": ["stock", "出荷", "stock -> 出荷"],
      "badge": "出庫",
      "tween": { "stock__bot": [40, 12] },
      "body": "矢印が底層から出る。 底層だけが 40 から 12 へ減る。"
    }
  ]
}`;

export const pattern__partsMotion__要素ごとに繋ぐ = textDslToDiagram(
  sourceYaml__pattern__partsMotion__要素ごとに繋ぐ,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partsMotion__分ける = `title: "検査の結果を 2 つの計器へ分けて送る"
type: swimlane

actors:
  - 検査: { kind: card }
  - press: { kind: state-indicator, phase: false }
  - oven: { kind: arc-gauge, phase: false }

flow:
  - 検査 -> press: "稼働を確かめる"
  - 検査 -> oven: "温度を読む"

animation:
  - step: "1. 検査する" 1.0s
    focus: [検査]
    badge: "検査"
    body: "検査が始まる。 2 つの計器はまだ動かない。"
  - step: "2. 2 つへ分かれる" 1.3s
    focus: [検査, press, oven, "検査 -> press", "検査 -> oven"]
    badge: "測定"
    tween:
      press__lvl: 0 -> 0.9
      oven__v: 0 -> 62
    body: "1 つの段で 2 つの計器が別々に動く。 稼働は 90%、炉は 62%。"
`;

export const sourceJson__pattern__partsMotion__分ける = `{
  "title": "検査の結果を 2 つの計器へ分けて送る",
  "type": "swimlane",
  "actors": [
    { "name": "検査", "kind": "card" },
    { "name": "press", "kind": "state-indicator", "phase": false },
    { "name": "oven", "kind": "arc-gauge", "phase": false }
  ],
  "flow": [
    { "from": "検査", "to": "press", "label": "稼働を確かめる" },
    { "from": "検査", "to": "oven", "label": "温度を読む" }
  ],
  "animation": [
    {
      "step": "1. 検査する",
      "duration": 1.0,
      "focus": ["検査"],
      "badge": "検査",
      "body": "検査が始まる。 2 つの計器はまだ動かない。"
    },
    {
      "step": "2. 2 つへ分かれる",
      "duration": 1.3,
      "focus": ["検査", "press", "oven", "検査 -> press", "検査 -> oven"],
      "badge": "測定",
      "tween": { "press__lvl": [0, 0.9], "oven__v": [0, 62] },
      "body": "1 つの段で 2 つの計器が別々に動く。 稼働は 90%、炉は 62%。"
    }
  ]
}`;

export const pattern__partsMotion__分ける = textDslToDiagram(
  sourceYaml__pattern__partsMotion__分ける,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partsMotion__集める = `title: "2 つの計器の値をどちらも記録へ集める"
type: swimlane

actors:
  - press: { kind: state-indicator, phase: false }
  - oven: { kind: arc-gauge, phase: false }
  - 記録: { kind: card }

flow:
  - press -> 記録: "稼働を残す"
  - oven -> 記録: "温度を残す"

animation:
  - step: "1. 測る" 1.3s
    focus: [press, oven]
    badge: "測定"
    tween:
      press__lvl: 0 -> 0.9
      oven__v: 0 -> 62
    body: "2 つの計器が別々に動く。 まだどちらも記録していない。"
  - step: "2. 記録へ集める" 1.3s
    focus: [press, oven, 記録, "press -> 記録", "oven -> 記録"]
    badge: "記録"
    tween:
      oven__v: 62 -> 48
    body: "2 本の矢印が同じ箱へ入る。 炉は記録の間に 48% まで下がる。"
`;

export const sourceJson__pattern__partsMotion__集める = `{
  "title": "2 つの計器の値をどちらも記録へ集める",
  "type": "swimlane",
  "actors": [
    { "name": "press", "kind": "state-indicator", "phase": false },
    { "name": "oven", "kind": "arc-gauge", "phase": false },
    { "name": "記録", "kind": "card" }
  ],
  "flow": [
    { "from": "press", "to": "記録", "label": "稼働を残す" },
    { "from": "oven", "to": "記録", "label": "温度を残す" }
  ],
  "animation": [
    {
      "step": "1. 測る",
      "duration": 1.3,
      "focus": ["press", "oven"],
      "badge": "測定",
      "tween": { "press__lvl": [0, 0.9], "oven__v": [0, 62] },
      "body": "2 つの計器が別々に動く。 まだどちらも記録していない。"
    },
    {
      "step": "2. 記録へ集める",
      "duration": 1.3,
      "focus": ["press", "oven", "記録", "press -> 記録", "oven -> 記録"],
      "badge": "記録",
      "tween": { "oven__v": [62, 48] },
      "body": "2 本の矢印が同じ箱へ入る。 炉は記録の間に 48% まで下がる。"
    }
  ]
}`;

export const pattern__partsMotion__集める = textDslToDiagram(
  sourceYaml__pattern__partsMotion__集める,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partsMotion__部品の段を残す = `title: "部品の段のまま置く形と、宿主の段で動かす形を並べる"
type: swimlane

actors:
  - own: { kind: horizontal-bar }
  - host: { kind: horizontal-bar, phase: false }

flow:
  - own -> host: "同じ部品"

animation:
  - step: "1. 部品の段で満ちる" 1.2s
    focus: [own]
    badge: "部品の段"
    body: "左は部品が持つ段で 0% から 100% まで満ちる。 右はまだ 0%。"
  - step: "2. 宿主の段で満ちる" 1.2s
    focus: [own, host, "own -> host"]
    badge: "宿主の段"
    tween:
      host__pv: 0 -> 85
    body: "右は部品の段を外したので、この段に書いた 85% まで満ちる。"
  - step: "3. 右だけ戻す" 1.2s
    focus: [host]
    badge: "宿主の段"
    tween:
      host__pv: 85 -> 20
    body: "宿主が動かす側は 20% まで戻せる。 左は部品の段が終わった 100% で止まる。"
`;

export const sourceJson__pattern__partsMotion__部品の段を残す = `{
  "title": "部品の段のまま置く形と、宿主の段で動かす形を並べる",
  "type": "swimlane",
  "actors": [
    { "name": "own", "kind": "horizontal-bar" },
    { "name": "host", "kind": "horizontal-bar", "phase": false }
  ],
  "flow": [{ "from": "own", "to": "host", "label": "同じ部品" }],
  "animation": [
    {
      "step": "1. 部品の段で満ちる",
      "duration": 1.2,
      "focus": ["own"],
      "badge": "部品の段",
      "body": "左は部品が持つ段で 0% から 100% まで満ちる。 右はまだ 0%。"
    },
    {
      "step": "2. 宿主の段で満ちる",
      "duration": 1.2,
      "focus": ["own", "host", "own -> host"],
      "badge": "宿主の段",
      "tween": { "host__pv": [0, 85] },
      "body": "右は部品の段を外したので、この段に書いた 85% まで満ちる。"
    },
    {
      "step": "3. 右だけ戻す",
      "duration": 1.2,
      "focus": ["host"],
      "badge": "宿主の段",
      "tween": { "host__pv": [85, 20] },
      "body": "宿主が動かす側は 20% まで戻せる。 左は部品の段が終わった 100% で止まる。"
    }
  ]
}`;

export const pattern__partsMotion__部品の段を残す = textDslToDiagram(
  sourceYaml__pattern__partsMotion__部品の段を残す,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partsMotion__振り分けて合流させる = `title: "注文を 2 つの窓口へ振り分けてから 1 つにまとめる"
type: swimlane
viewport: { laneWidth: 240 }

# 縦列の見出しは日本語で書き、部品の名前 (値の名前の前置き) は英字のままにする
lanes:
  振り分け: { label: "振り分け" }
  合流: { label: "合流" }

actors:
  - split: { kind: split-router, phase: false, lane: 振り分け }
  - merge: { kind: merge-junction, phase: false, lane: 合流 }

# 振り分け器の出口 A / B を、合流点の入口 A / B へそれぞれ繋ぐ
flow:
  - split -> merge: "A 便" { fromPartNode: outA, toPartNode: inA }
  - split -> merge: "B 便" { fromPartNode: outB, toPartNode: inB }

animation:
  - step: "1. 注文が入る" 1.2s
    focus: [split__inP]
    badge: "受付"
    tween:
      split__inLv: 0 -> 100
    body: "振り分け器の入口に注文が溜まる。 光るのは入口だけ。"
  - step: "2. 2 つの窓口へ分ける" 1.4s
    focus: [split]
    badge: "振り分け"
    tween:
      split__inLv: 100 -> 0
      split__aLv: 0 -> 70
      split__bLv: 0 -> 30
    body: "入口の注文が出口 A へ 70、出口 B へ 30 に分かれる。 振り分け器の全体が光る。"
  - step: "3. 合流点へ渡す" 1.4s
    focus: [split__outA, split__outB, merge__inA, merge__inB, "split -> merge"]
    badge: "受け渡し"
    tween:
      split__aLv: 70 -> 0
      split__bLv: 30 -> 0
      merge__aLv: 0 -> 70
      merge__bLv: 0 -> 30
    body: "出口 A は合流点の入口 A へ、出口 B は入口 B へ渡る。 光るのは渡す出口と受ける入口と 2 本の矢印。"
  - step: "4. 1 つにまとめる" 1.4s
    focus: [merge]
    badge: "合流"
    tween:
      merge__aLv: 70 -> 0
      merge__bLv: 30 -> 0
      merge__sumLv: 0 -> 100
    body: "2 つの入口の分が合流点の出口で 100 にまとまる。 合流点の全体が光る。"
`;

export const sourceJson__pattern__partsMotion__振り分けて合流させる = `{
  "title": "注文を 2 つの窓口へ振り分けてから 1 つにまとめる",
  "type": "swimlane",
  "viewport": { "laneWidth": 240 },
  "lanes": {
    "振り分け": { "label": "振り分け" },
    "合流": { "label": "合流" }
  },
  "actors": [
    { "name": "split", "kind": "split-router", "phase": false, "lane": "振り分け" },
    { "name": "merge", "kind": "merge-junction", "phase": false, "lane": "合流" }
  ],
  "flow": [
    { "from": "split", "to": "merge", "label": "A 便", "fromPartNode": "outA", "toPartNode": "inA" },
    { "from": "split", "to": "merge", "label": "B 便", "fromPartNode": "outB", "toPartNode": "inB" }
  ],
  "animation": [
    {
      "step": "1. 注文が入る",
      "duration": 1.2,
      "focus": ["split__inP"],
      "badge": "受付",
      "tween": { "split__inLv": [0, 100] },
      "body": "振り分け器の入口に注文が溜まる。 光るのは入口だけ。"
    },
    {
      "step": "2. 2 つの窓口へ分ける",
      "duration": 1.4,
      "focus": ["split"],
      "badge": "振り分け",
      "tween": { "split__inLv": [100, 0], "split__aLv": [0, 70], "split__bLv": [0, 30] },
      "body": "入口の注文が出口 A へ 70、出口 B へ 30 に分かれる。 振り分け器の全体が光る。"
    },
    {
      "step": "3. 合流点へ渡す",
      "duration": 1.4,
      "focus": ["split__outA", "split__outB", "merge__inA", "merge__inB", "split -> merge"],
      "badge": "受け渡し",
      "tween": {
        "split__aLv": [70, 0],
        "split__bLv": [30, 0],
        "merge__aLv": [0, 70],
        "merge__bLv": [0, 30]
      },
      "body": "出口 A は合流点の入口 A へ、出口 B は入口 B へ渡る。 光るのは渡す出口と受ける入口と 2 本の矢印。"
    },
    {
      "step": "4. 1 つにまとめる",
      "duration": 1.4,
      "focus": ["merge"],
      "badge": "合流",
      "tween": { "merge__aLv": [70, 0], "merge__bLv": [30, 0], "merge__sumLv": [0, 100] },
      "body": "2 つの入口の分が合流点の出口で 100 にまとまる。 合流点の全体が光る。"
    }
  ]
}`;

export const pattern__partsMotion__振り分けて合流させる = textDslToDiagram(
  sourceYaml__pattern__partsMotion__振り分けて合流させる,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partsMotion__配ってから写す = `title: "3 つへ配った分のうち 1 つを 3 つの控えへ写す"
type: swimlane
# 縦列の幅は 200 にする。 240 だと図が 1607 になり、一覧の器 (幅 874) で箱の題が 12px を割る
viewport: { laneWidth: 200 }

lanes:
  配る: { label: "配る" }
  写す: { label: "写す" }

actors:
  - balance: { kind: load-balancer, phase: false, lane: 配る }
  - copy: { kind: fanout-copy, phase: false, lane: 写す }

# 繋ぐのは真ん中の出口 (out2)。 端の出口だと段がずれて矢印が折れる
flow:
  - balance -> copy: "中の分" { fromPartNode: out2, toPartNode: pubP }

animation:
  - step: "1. 届く" 1.2s
    focus: [balance__inP]
    badge: "受付"
    tween:
      balance__inLv: 0 -> 90
    body: "負荷分散器の入口に 90 件/秒が届く。 光るのは入口だけ。"
  - step: "2. 3 つへ配る" 1.4s
    focus: [balance]
    badge: "配る"
    tween:
      balance__inLv: 90 -> 0
      balance__o1: 0 -> 30
      balance__o2: 0 -> 30
      balance__o3: 0 -> 30
    body: "入口の分が 3 つの出口へ 30 件/秒ずつ分かれる。 配った後も合計は 90 のまま。"
  - step: "3. 控えへ渡す" 1.4s
    focus: [balance__out2, copy__pubP, "balance -> copy"]
    badge: "受け渡し"
    tween:
      copy__pub: 0 -> 30
    body: "真ん中の出口が受けた 30 件を複製器の発行へ渡す。 光るのは渡す出口と受ける発行と矢印。"
  - step: "4. 3 つの控えへ写す" 1.4s
    focus: [copy]
    badge: "写す"
    tween:
      copy__s1: 0 -> 30
      copy__s2: 0 -> 30
      copy__s3: 0 -> 30
    body: "発行の 30 件が控え 3 つへ 30 件ずつ写る。 分けた時と違い、合計は 90 に増える。"
`;

export const sourceJson__pattern__partsMotion__配ってから写す = `{
  "title": "3 つへ配った分のうち 1 つを 3 つの控えへ写す",
  "type": "swimlane",
  "viewport": { "laneWidth": 200 },
  "lanes": {
    "配る": { "label": "配る" },
    "写す": { "label": "写す" }
  },
  "actors": [
    { "name": "balance", "kind": "load-balancer", "phase": false, "lane": "配る" },
    { "name": "copy", "kind": "fanout-copy", "phase": false, "lane": "写す" }
  ],
  "flow": [
    { "from": "balance", "to": "copy", "label": "中の分", "fromPartNode": "out2", "toPartNode": "pubP" }
  ],
  "animation": [
    {
      "step": "1. 届く",
      "duration": 1.2,
      "focus": ["balance__inP"],
      "badge": "受付",
      "tween": { "balance__inLv": [0, 90] },
      "body": "負荷分散器の入口に 90 件/秒が届く。 光るのは入口だけ。"
    },
    {
      "step": "2. 3 つへ配る",
      "duration": 1.4,
      "focus": ["balance"],
      "badge": "配る",
      "tween": { "balance__inLv": [90, 0], "balance__o1": [0, 30], "balance__o2": [0, 30], "balance__o3": [0, 30] },
      "body": "入口の分が 3 つの出口へ 30 件/秒ずつ分かれる。 配った後も合計は 90 のまま。"
    },
    {
      "step": "3. 控えへ渡す",
      "duration": 1.4,
      "focus": ["balance__out2", "copy__pubP", "balance -> copy"],
      "badge": "受け渡し",
      "tween": { "copy__pub": [0, 30] },
      "body": "真ん中の出口が受けた 30 件を複製器の発行へ渡す。 光るのは渡す出口と受ける発行と矢印。"
    },
    {
      "step": "4. 3 つの控えへ写す",
      "duration": 1.4,
      "focus": ["copy"],
      "badge": "写す",
      "tween": { "copy__s1": [0, 30], "copy__s2": [0, 30], "copy__s3": [0, 30] },
      "body": "発行の 30 件が控え 3 つへ 30 件ずつ写る。 分けた時と違い、合計は 90 に増える。"
    }
  ]
}`;

export const pattern__partsMotion__配ってから写す = textDslToDiagram(
  sourceYaml__pattern__partsMotion__配ってから写す,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partsMotion__仕分けてから溜める = `title: "中身の種類で分けた注文だけを溜めてまとめて送る"
type: swimlane
# 縦列の幅は 200 にする。 240 だと図が 1607 になり、一覧の器 (幅 874) で箱の題が 12.0px の境に乗る
viewport: { laneWidth: 200 }

lanes:
  仕分ける: { label: "仕分ける" }
  溜める: { label: "溜める" }

actors:
  - so: { kind: content-sorter, phase: false, lane: 仕分ける }
  - bt: { kind: batch-collector, phase: false, lane: 溜める }

# 繋ぐのは 3 つの出口のうち「注文」 だけ。 3 つとも繋ぐと「種類で分ける」 と「全部を溜める」 が
# 同じ絵になり、仕分けた意味が消える
flow:
  - so -> bt: "注文の分" { fromPartNode: outA, toPartNode: inP }

animation:
  - step: "1. 中身を見る" 1.2s
    focus: [so__inP]
    badge: "受付"
    tween:
      so__inN: 0 -> 20
    body: "20 件が届く。 まだどの行き先にも分かれていない。"
  - step: "2. 種類で分ける" 1.4s
    focus: [so]
    badge: "仕分け"
    tween:
      so__aN: 0 -> 11
      so__bN: 0 -> 6
      so__cN: 0 -> 3
    body: "注文 11 件、問い合わせ 6 件、その他 3 件に分かれる。 棒の高さが揃わない。"
  - step: "3. 注文だけ渡す" 1.4s
    focus: [so__outA, bt__inP, "so -> bt"]
    badge: "受け渡し"
    tween:
      bt__inN: 0 -> 11
    body: "注文の 11 件だけがまとめ箱へ渡る。 他の 2 つの行き先は渡らない。"
  - step: "4. 溜めてまとめて送る" 1.4s
    focus: [bt]
    badge: "まとめ"
    tween:
      bt__poolN: 0 -> 10
      bt__sendN: 0 -> 1
    body: "10 件たまったところで 1 回送る。 残る 1 件は次の分を待つ。"
`;

export const sourceJson__pattern__partsMotion__仕分けてから溜める = `{
  "title": "中身の種類で分けた注文だけを溜めてまとめて送る",
  "type": "swimlane",
  "viewport": { "laneWidth": 200 },
  "lanes": {
    "仕分ける": { "label": "仕分ける" },
    "溜める": { "label": "溜める" }
  },
  "actors": [
    { "name": "so", "kind": "content-sorter", "phase": false, "lane": "仕分ける" },
    { "name": "bt", "kind": "batch-collector", "phase": false, "lane": "溜める" }
  ],
  "flow": [
    { "from": "so", "to": "bt", "label": "注文の分", "fromPartNode": "outA", "toPartNode": "inP" }
  ],
  "animation": [
    {
      "step": "1. 中身を見る",
      "duration": 1.2,
      "focus": ["so__inP"],
      "badge": "受付",
      "tween": { "so__inN": [0, 20] },
      "body": "20 件が届く。 まだどの行き先にも分かれていない。"
    },
    {
      "step": "2. 種類で分ける",
      "duration": 1.4,
      "focus": ["so"],
      "badge": "仕分け",
      "tween": { "so__aN": [0, 11], "so__bN": [0, 6], "so__cN": [0, 3] },
      "body": "注文 11 件、問い合わせ 6 件、その他 3 件に分かれる。 棒の高さが揃わない。"
    },
    {
      "step": "3. 注文だけ渡す",
      "duration": 1.4,
      "focus": ["so__outA", "bt__inP", "so -> bt"],
      "badge": "受け渡し",
      "tween": { "bt__inN": [0, 11] },
      "body": "注文の 11 件だけがまとめ箱へ渡る。 他の 2 つの行き先は渡らない。"
    },
    {
      "step": "4. 溜めてまとめて送る",
      "duration": 1.4,
      "focus": ["bt"],
      "badge": "まとめ",
      "tween": { "bt__poolN": [0, 10], "bt__sendN": [0, 1] },
      "body": "10 件たまったところで 1 回送る。 残る 1 件は次の分を待つ。"
    }
  ]
}`;

export const pattern__partsMotion__仕分けてから溜める = textDslToDiagram(
  sourceYaml__pattern__partsMotion__仕分けてから溜める,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partsMotion__やり直してから倒す = `title: "やり直して通った分を送り、常用が落ちたら予備へ倒す"
type: swimlane
viewport: { laneWidth: 200 }

lanes:
  やり直す: { label: "やり直す" }
  倒す: { label: "倒す" }

# 繋ぐ向きはやり直しの輪から切替器にする。 逆向き (切替器の予備 -> やり直しの輪の試す) は、
# 予備が段 2 で試すが段 0 のため組み立て器が 2 枚を縦にずらして置き、図が 1605x1502 に伸びる
# (拡大の器で箱の題が 9.2px、下限 12px)。 通る (段 1) と入口 (段 1) は同じ段なので 960 に収まる
actors:
  - rt: { kind: retry-loop, phase: false, lane: やり直す }
  - sw: { kind: failover-switch, phase: false, lane: 倒す }

# 札は 3 字にする。 「通った分」 だと図が 1605 に伸び、一覧の器で箱の題が 12.0px の境に乗る
flow:
  - rt -> sw: "通る分" { fromPartNode: okP, toPartNode: inP }

animation:
  - step: "1. 試す" 1.2s
    focus: [rt__tryP]
    badge: "試行"
    tween:
      rt__tryN: 0 -> 12
    body: "12 件を試す。 まだ通ったか落ちたかは分かれていない。"
  - step: "2. 落ちた分を戻す" 1.4s
    focus: [rt]
    badge: "やり直し"
    tween:
      rt__okN: 0 -> 9
      rt__ngN: 0 -> 3
      rt__againN: 0 -> 3
    body: "9 件が通り、3 件が落ちてやり直す箱へ戻る。"
  - step: "3. 通った分を送る" 1.4s
    focus: [rt__okP, sw__inP, "rt -> sw"]
    badge: "受け渡し"
    tween:
      rt__okN: 9 -> 12
    body: "やり直した 3 件も通り、12 件が切替器の入口へ入る。"
  - step: "4. 予備へ倒れる" 1.4s
    focus: [sw]
    badge: "切替"
    tween:
      sw__mainLv: 100 -> 0
      sw__subLv: 0 -> 100
    body: "常用が 0% まで落ち、同じ量が予備へ倒れる。 入口の量は変わらない。"
`;

export const sourceJson__pattern__partsMotion__やり直してから倒す = `{
  "title": "やり直して通った分を送り、常用が落ちたら予備へ倒す",
  "type": "swimlane",
  "viewport": { "laneWidth": 200 },
  "lanes": {
    "やり直す": { "label": "やり直す" },
    "倒す": { "label": "倒す" }
  },
  "actors": [
    { "name": "rt", "kind": "retry-loop", "phase": false, "lane": "やり直す" },
    { "name": "sw", "kind": "failover-switch", "phase": false, "lane": "倒す" }
  ],
  "flow": [
    { "from": "rt", "to": "sw", "label": "通る分", "fromPartNode": "okP", "toPartNode": "inP" }
  ],
  "animation": [
    {
      "step": "1. 試す",
      "duration": 1.2,
      "focus": ["rt__tryP"],
      "badge": "試行",
      "tween": { "rt__tryN": [0, 12] },
      "body": "12 件を試す。 まだ通ったか落ちたかは分かれていない。"
    },
    {
      "step": "2. 落ちた分を戻す",
      "duration": 1.4,
      "focus": ["rt"],
      "badge": "やり直し",
      "tween": { "rt__okN": [0, 9], "rt__ngN": [0, 3], "rt__againN": [0, 3] },
      "body": "9 件が通り、3 件が落ちてやり直す箱へ戻る。"
    },
    {
      "step": "3. 通った分を送る",
      "duration": 1.4,
      "focus": ["rt__okP", "sw__inP", "rt -> sw"],
      "badge": "受け渡し",
      "tween": { "rt__okN": [9, 12] },
      "body": "やり直した 3 件も通り、12 件が切替器の入口へ入る。"
    },
    {
      "step": "4. 予備へ倒れる",
      "duration": 1.4,
      "focus": ["sw"],
      "badge": "切替",
      "tween": { "sw__mainLv": [100, 0], "sw__subLv": [0, 100] },
      "body": "常用が 0% まで落ち、同じ量が予備へ倒れる。 入口の量は変わらない。"
    }
  ]
}`;

export const pattern__partsMotion__やり直してから倒す = textDslToDiagram(
  sourceYaml__pattern__partsMotion__やり直してから倒す,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partsMotion__重なりを消してから溜める = `title: "重なりを消した分だけを溜めて、満ちたらまとめて送る"
type: swimlane
viewport: { laneWidth: 200 }

lanes:
  消す: { label: "消す" }
  溜める: { label: "溜める" }

# 残す箱 (段 0) をまとめ箱の届く (段 0) へ繋ぐ。 段が揃わないと矢印が折れる (#2159)。
# 残す箱は段 0 なので、入口が段 1 の部品 (遮断器 / 写し箱) とは組めない
actors:
  - dd: { kind: dedupe-box, phase: false, lane: 消す }
  - bt: { kind: batch-collector, phase: false, lane: 溜める }

# 30 件が 18 件に減り、10 件ごとに 1 回で出るので送るのは 1 回だけ。 減った分だけが溜まる
flow:
  - dd -> bt: "残る分" { fromPartNode: keepP, toPartNode: inP }

animation:
  - step: "1. 届く" 1.2s
    focus: [dd__inP]
    badge: "到着"
    tween:
      dd__inN: 0 -> 30
    body: "30 件が届く。 まだ初めてか二度目かは分かれていない。"
  - step: "2. 重なりを消す" 1.4s
    focus: [dd]
    badge: "重複"
    tween:
      dd__keepN: 0 -> 18
      dd__dropN: 0 -> 12
    body: "初めての 18 件を残し、二度目の 12 件を捨てる。 捨てた分はどこへも行かない。"
  - step: "3. 残った分を送る" 1.4s
    focus: [dd__keepP, bt__inP, "dd -> bt"]
    badge: "受渡"
    tween:
      bt__inN: 0 -> 18
    body: "残った 18 件だけがまとめ箱へ入る。 捨てた 12 件はここに来ない。"
  - step: "4. 満ちたら送る" 1.4s
    focus: [bt]
    badge: "一括"
    tween:
      bt__poolN: 0 -> 8
      bt__sendN: 0 -> 1
    body: "10 件たまった所で 1 回送り、残る 8 件は次の回を待つ。 消さなければ 3 回送っていた。"
`;

export const sourceJson__pattern__partsMotion__重なりを消してから溜める = `{
  "title": "重なりを消した分だけを溜めて、満ちたらまとめて送る",
  "type": "swimlane",
  "viewport": { "laneWidth": 200 },
  "lanes": {
    "消す": { "label": "消す" },
    "溜める": { "label": "溜める" }
  },
  "actors": [
    { "name": "dd", "kind": "dedupe-box", "phase": false, "lane": "消す" },
    { "name": "bt", "kind": "batch-collector", "phase": false, "lane": "溜める" }
  ],
  "flow": [
    { "from": "dd", "to": "bt", "label": "残る分", "fromPartNode": "keepP", "toPartNode": "inP" }
  ],
  "animation": [
    {
      "step": "1. 届く",
      "duration": 1.2,
      "focus": ["dd__inP"],
      "badge": "到着",
      "tween": { "dd__inN": [0, 30] },
      "body": "30 件が届く。 まだ初めてか二度目かは分かれていない。"
    },
    {
      "step": "2. 重なりを消す",
      "duration": 1.4,
      "focus": ["dd"],
      "badge": "重複",
      "tween": { "dd__keepN": [0, 18], "dd__dropN": [0, 12] },
      "body": "初めての 18 件を残し、二度目の 12 件を捨てる。 捨てた分はどこへも行かない。"
    },
    {
      "step": "3. 残った分を送る",
      "duration": 1.4,
      "focus": ["dd__keepP", "bt__inP", "dd -> bt"],
      "badge": "受渡",
      "tween": { "bt__inN": [0, 18] },
      "body": "残った 18 件だけがまとめ箱へ入る。 捨てた 12 件はここに来ない。"
    },
    {
      "step": "4. 満ちたら送る",
      "duration": 1.4,
      "focus": ["bt"],
      "badge": "一括",
      "tween": { "bt__poolN": [0, 8], "bt__sendN": [0, 1] },
      "body": "10 件たまった所で 1 回送り、残る 8 件は次の回を待つ。 消さなければ 3 回送っていた。"
    }
  ]
}`;

export const pattern__partsMotion__重なりを消してから溜める = textDslToDiagram(
  sourceYaml__pattern__partsMotion__重なりを消してから溜める,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partsMotion__写してから待ち合わせる = `title: "手元から返った分と奥から返った分がそろってから出す"
type: swimlane
viewport: { laneWidth: 200 }

lanes:
  写す: { label: "写す" }
  待つ: { label: "待つ" }

# 2 枚の間に線を 2 本引く唯一の切替。 手元から (段 0) を左から (段 0) へ、
# 奥から (段 2) を右から (段 2) へ繋ぐと、どちらも真横に引ける
actors:
  - ca: { kind: cache-box, phase: false, lane: 写す }
  - bw: { kind: barrier-box, phase: false, lane: 待つ }

flow:
  - ca -> bw: "手元分" { fromPartNode: hitP, toPartNode: aP }
  - ca -> bw: "奥分" { fromPartNode: missP, toPartNode: bP }

animation:
  - step: "1. 問う" 1.2s
    focus: [ca__askP]
    badge: "問合"
    tween:
      ca__askN: 0 -> 18
    body: "18 件を問う。 まだ手元で返るか奥まで行くかは分かれていない。"
  - step: "2. 写しで分かれる" 1.4s
    focus: [ca]
    badge: "写し"
    tween:
      ca__hitN: 0 -> 12
      ca__missN: 0 -> 6
    body: "12 件が手元の写しで返り、6 件だけが奥まで行く。"
  - step: "3. 両方を送る" 1.4s
    focus: [ca__hitP, ca__missP, bw__aP, bw__bP, "ca -> bw"]
    badge: "受渡"
    tween:
      bw__aN: 0 -> 12
      bw__bN: 0 -> 6
    body: "手元からの 12 件が左へ、奥からの 6 件が右へ入る。 同じ上限 12 の目盛りで比べる。"
  - step: "4. そろった分だけ出る" 1.4s
    focus: [bw]
    badge: "そろい"
    tween:
      bw__outN: 0 -> 6
    body: "両方そろった 6 組だけが出る。 左に残る 6 件は相手が来るまで出ない。"
`;

export const sourceJson__pattern__partsMotion__写してから待ち合わせる = `{
  "title": "手元から返った分と奥から返った分がそろってから出す",
  "type": "swimlane",
  "viewport": { "laneWidth": 200 },
  "lanes": {
    "写す": { "label": "写す" },
    "待つ": { "label": "待つ" }
  },
  "actors": [
    { "name": "ca", "kind": "cache-box", "phase": false, "lane": "写す" },
    { "name": "bw", "kind": "barrier-box", "phase": false, "lane": "待つ" }
  ],
  "flow": [
    { "from": "ca", "to": "bw", "label": "手元分", "fromPartNode": "hitP", "toPartNode": "aP" },
    { "from": "ca", "to": "bw", "label": "奥分", "fromPartNode": "missP", "toPartNode": "bP" }
  ],
  "animation": [
    {
      "step": "1. 問う",
      "duration": 1.2,
      "focus": ["ca__askP"],
      "badge": "問合",
      "tween": { "ca__askN": [0, 18] },
      "body": "18 件を問う。 まだ手元で返るか奥まで行くかは分かれていない。"
    },
    {
      "step": "2. 写しで分かれる",
      "duration": 1.4,
      "focus": ["ca"],
      "badge": "写し",
      "tween": { "ca__hitN": [0, 12], "ca__missN": [0, 6] },
      "body": "12 件が手元の写しで返り、6 件だけが奥まで行く。"
    },
    {
      "step": "3. 両方を送る",
      "duration": 1.4,
      "focus": ["ca__hitP", "ca__missP", "bw__aP", "bw__bP", "ca -> bw"],
      "badge": "受渡",
      "tween": { "bw__aN": [0, 12], "bw__bN": [0, 6] },
      "body": "手元からの 12 件が左へ、奥からの 6 件が右へ入る。 同じ上限 12 の目盛りで比べる。"
    },
    {
      "step": "4. そろった分だけ出る",
      "duration": 1.4,
      "focus": ["bw"],
      "badge": "そろい",
      "tween": { "bw__outN": [0, 6] },
      "body": "両方そろった 6 組だけが出る。 左に残る 6 件は相手が来るまで出ない。"
    }
  ]
}`;

export const pattern__partsMotion__写してから待ち合わせる = textDslToDiagram(
  sourceYaml__pattern__partsMotion__写してから待ち合わせる,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partsMotion__そろってから遮断する = `title: "そろった分を送り、落ちる分が増えて遮断する"
type: swimlane
viewport: { laneWidth: 200 }

lanes:
  待つ: { label: "待つ" }
  遮る: { label: "遮る" }

# そろった分 (段 1) を遮断器の入口 (段 1) へ繋ぐ。 どちらも真ん中の段なので矢印が真横に引ける
actors:
  - bw: { kind: barrier-box, phase: false, lane: 待つ }
  - cb: { kind: circuit-breaker, phase: false, lane: 遮る }

# 待ち合わせで減り、遮断でもう一度減る。 2 段構えで減る形は 1 枚では描けない
flow:
  - bw -> cb: "そろい" { fromPartNode: outP, toPartNode: inP }

animation:
  - step: "1. 届く" 1.2s
    focus: [bw__aP, bw__bP]
    badge: "到着"
    tween:
      bw__aN: 0 -> 12
      bw__bN: 0 -> 7
    body: "左から 12 件、右から 7 件が届く。 まだ 1 組も出ていない。"
  - step: "2. そろう" 1.4s
    focus: [bw]
    badge: "そろい"
    tween:
      bw__outN: 0 -> 7
    body: "両方そろった 7 組だけが出る。 左に残る 5 件は相手が来るまで出ない。"
  - step: "3. そろった分を送る" 1.4s
    focus: [bw__outP, cb__inP, "bw -> cb"]
    badge: "受渡"
    tween:
      cb__inN: 0 -> 7
    body: "そろった 7 組が遮断器の入口へ入る。 出なかった 5 件はここに来ない。"
  - step: "4. 遮断する" 1.4s
    focus: [cb]
    badge: "遮断"
    tween:
      cb__okN: 0 -> 2
      cb__ngN: 0 -> 2
      cb__cutN: 0 -> 3
    body: "2 組が通り 2 組が落ちた所で遮断し、残る 3 組を試さずに断る。 届いた 19 件のうち相手に渡ったのは 2 組。"
`;

export const sourceJson__pattern__partsMotion__そろってから遮断する = `{
  "title": "そろった分を送り、落ちる分が増えて遮断する",
  "type": "swimlane",
  "viewport": { "laneWidth": 200 },
  "lanes": {
    "待つ": { "label": "待つ" },
    "遮る": { "label": "遮る" }
  },
  "actors": [
    { "name": "bw", "kind": "barrier-box", "phase": false, "lane": "待つ" },
    { "name": "cb", "kind": "circuit-breaker", "phase": false, "lane": "遮る" }
  ],
  "flow": [
    { "from": "bw", "to": "cb", "label": "そろい", "fromPartNode": "outP", "toPartNode": "inP" }
  ],
  "animation": [
    {
      "step": "1. 届く",
      "duration": 1.2,
      "focus": ["bw__aP", "bw__bP"],
      "badge": "到着",
      "tween": { "bw__aN": [0, 12], "bw__bN": [0, 7] },
      "body": "左から 12 件、右から 7 件が届く。 まだ 1 組も出ていない。"
    },
    {
      "step": "2. そろう",
      "duration": 1.4,
      "focus": ["bw"],
      "badge": "そろい",
      "tween": { "bw__outN": [0, 7] },
      "body": "両方そろった 7 組だけが出る。 左に残る 5 件は相手が来るまで出ない。"
    },
    {
      "step": "3. そろった分を送る",
      "duration": 1.4,
      "focus": ["bw__outP", "cb__inP", "bw -> cb"],
      "badge": "受渡",
      "tween": { "cb__inN": [0, 7] },
      "body": "そろった 7 組が遮断器の入口へ入る。 出なかった 5 件はここに来ない。"
    },
    {
      "step": "4. 遮断する",
      "duration": 1.4,
      "focus": ["cb"],
      "badge": "遮断",
      "tween": { "cb__okN": [0, 2], "cb__ngN": [0, 2], "cb__cutN": [0, 3] },
      "body": "2 組が通り 2 組が落ちた所で遮断し、残る 3 組を試さずに断る。 届いた 19 件のうち相手に渡ったのは 2 組。"
    }
  ]
}`;

export const pattern__partsMotion__そろってから遮断する = textDslToDiagram(
  sourceYaml__pattern__partsMotion__そろってから遮断する,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partsMotion__割ってから溜める = `title: "割って増えた小分けを溜め直して送る"
type: swimlane
viewport: { laneWidth: 200 }

lanes:
  割る: { label: "割る" }
  溜める: { label: "溜める" }

# 小さい荷物も届くも、それぞれの部品で上から 1 行目に来るので矢印が真横に引ける
actors:
  - sp: { kind: split-box, phase: false, lane: 割る }
  - bt: { kind: batch-collector, phase: false, lane: 溜める }

# 増えた数をもう一度まとめ直す。 割り箱だけが出る数を入る数より多くできる
flow:
  - sp -> bt: "小分け" { fromPartNode: smallP, toPartNode: inP }

animation:
  - step: "1. 届く" 1.2s
    focus: [sp__bigP]
    badge: "到着"
    tween:
      sp__bigN: 0 -> 3
    body: "3 個の大きい荷物が届く。 まだ 1 個も割れていない。"
  - step: "2. 割れる" 1.4s
    focus: [sp]
    badge: "分割"
    tween:
      sp__smallN: 0 -> 20
      sp__tagN: 0 -> 20
    body: "20 個の小さい荷物に割れ、貼り直す札も 20 枚に増える。 3 個が 20 個になった。"
  - step: "3. 溜める" 1.4s
    focus: [sp__smallP, bt__inP, "sp -> bt"]
    badge: "受渡"
    tween:
      bt__inN: 0 -> 20
      bt__poolN: 0 -> 10
    body: "20 個が 1 個ずつ溜まり、10 個で溜まりが満ちる。"
  - step: "4. まとめて送る" 1.4s
    focus: [bt]
    badge: "送出"
    tween:
      bt__sendN: 0 -> 2
    body: "10 個ずつ 2 回でまとめて送る。 3 個で届いたものが 20 個に割れ、2 回にまとまった。"
`;

export const sourceJson__pattern__partsMotion__割ってから溜める = `{
  "title": "割って増えた小分けを溜め直して送る",
  "type": "swimlane",
  "viewport": { "laneWidth": 200 },
  "lanes": {
    "割る": { "label": "割る" },
    "溜める": { "label": "溜める" }
  },
  "actors": [
    { "name": "sp", "kind": "split-box", "phase": false, "lane": "割る" },
    { "name": "bt", "kind": "batch-collector", "phase": false, "lane": "溜める" }
  ],
  "flow": [
    { "from": "sp", "to": "bt", "label": "小分け", "fromPartNode": "smallP", "toPartNode": "inP" }
  ],
  "animation": [
    {
      "step": "1. 届く",
      "duration": 1.2,
      "focus": ["sp__bigP"],
      "badge": "到着",
      "tween": { "sp__bigN": [0, 3] },
      "body": "3 個の大きい荷物が届く。 まだ 1 個も割れていない。"
    },
    {
      "step": "2. 割れる",
      "duration": 1.4,
      "focus": ["sp"],
      "badge": "分割",
      "tween": { "sp__smallN": [0, 20], "sp__tagN": [0, 20] },
      "body": "20 個の小さい荷物に割れ、貼り直す札も 20 枚に増える。 3 個が 20 個になった。"
    },
    {
      "step": "3. 溜める",
      "duration": 1.4,
      "focus": ["sp__smallP", "bt__inP", "sp -> bt"],
      "badge": "受渡",
      "tween": { "bt__inN": [0, 20], "bt__poolN": [0, 10] },
      "body": "20 個が 1 個ずつ溜まり、10 個で溜まりが満ちる。"
    },
    {
      "step": "4. まとめて送る",
      "duration": 1.4,
      "focus": ["bt"],
      "badge": "送出",
      "tween": { "bt__sendN": [0, 2] },
      "body": "10 個ずつ 2 回でまとめて送る。 3 個で届いたものが 20 個に割れ、2 回にまとまった。"
    }
  ]
}`;

export const pattern__partsMotion__割ってから溜める = textDslToDiagram(
  sourceYaml__pattern__partsMotion__割ってから溜める,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partsMotion__割ってから詰まらせる = `title: "割って数が増えた分を送ると後ろが詰まって入口が絞られる"
type: swimlane
viewport: { laneWidth: 200 }

lanes:
  割る: { label: "割る" }
  詰まる: { label: "詰まる" }

# 押し戻し箱は段 1 と 2 しか使わないので、送るが上から 1 行目に来る。 小さい荷物と同じ行になる
actors:
  - sp: { kind: split-box, phase: false, lane: 割る }
  - bp: { kind: backpressure, phase: false, lane: 詰まる }

# 割ってから溜めるの裏返し。 同じ出口が、繋ぐ相手で逆の結果になる
flow:
  - sp -> bp: "小分け" { fromPartNode: smallP, toPartNode: inP }

animation:
  - step: "1. 届く" 1.2s
    focus: [sp__bigP]
    badge: "到着"
    tween:
      sp__bigN: 0 -> 2
    body: "2 個の大きい荷物が届く。 受け側の待ちはまだ空いている。"
  - step: "2. 割れる" 1.4s
    focus: [sp]
    badge: "分割"
    tween:
      sp__smallN: 0 -> 20
      sp__tagN: 0 -> 20
    body: "20 個の小さい荷物に割れ、札も 20 枚に増える。 送る数が 10 倍になった。"
  - step: "3. 積む" 1.4s
    focus: [sp__smallP, bp__inP, bp__qP, "sp -> bp"]
    badge: "受渡"
    tween:
      bp__qLv: 0 -> 100
    body: "増えた 20 個が送られ、受け側の待ちが 100% まで積む。"
  - step: "4. 絞られる" 1.4s
    focus: [bp]
    badge: "抑制"
    tween:
      bp__inLv: 100 -> 40
    body: "送る側が 100% から 40% へ絞られる。 出す側は 40% のまま動かない。 割った側が自分で減らされた。"
`;

export const sourceJson__pattern__partsMotion__割ってから詰まらせる = `{
  "title": "割って数が増えた分を送ると後ろが詰まって入口が絞られる",
  "type": "swimlane",
  "viewport": { "laneWidth": 200 },
  "lanes": {
    "割る": { "label": "割る" },
    "詰まる": { "label": "詰まる" }
  },
  "actors": [
    { "name": "sp", "kind": "split-box", "phase": false, "lane": "割る" },
    { "name": "bp", "kind": "backpressure", "phase": false, "lane": "詰まる" }
  ],
  "flow": [
    { "from": "sp", "to": "bp", "label": "小分け", "fromPartNode": "smallP", "toPartNode": "inP" }
  ],
  "animation": [
    {
      "step": "1. 届く",
      "duration": 1.2,
      "focus": ["sp__bigP"],
      "badge": "到着",
      "tween": { "sp__bigN": [0, 2] },
      "body": "2 個の大きい荷物が届く。 受け側の待ちはまだ空いている。"
    },
    {
      "step": "2. 割れる",
      "duration": 1.4,
      "focus": ["sp"],
      "badge": "分割",
      "tween": { "sp__smallN": [0, 20], "sp__tagN": [0, 20] },
      "body": "20 個の小さい荷物に割れ、札も 20 枚に増える。 送る数が 10 倍になった。"
    },
    {
      "step": "3. 積む",
      "duration": 1.4,
      "focus": ["sp__smallP", "bp__inP", "bp__qP", "sp -> bp"],
      "badge": "受渡",
      "tween": { "bp__qLv": [0, 100] },
      "body": "増えた 20 個が送られ、受け側の待ちが 100% まで積む。"
    },
    {
      "step": "4. 絞られる",
      "duration": 1.4,
      "focus": ["bp"],
      "badge": "抑制",
      "tween": { "bp__inLv": [100, 40] },
      "body": "送る側が 100% から 40% へ絞られる。 出す側は 40% のまま動かない。 割った側が自分で減らされた。"
    }
  ]
}`;

export const pattern__partsMotion__割ってから詰まらせる = textDslToDiagram(
  sourceYaml__pattern__partsMotion__割ってから詰まらせる,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partsMotion__そろってから押し出す = `title: "そろった分を置き場に入れると古いものから押し出される"
type: swimlane
viewport: { laneWidth: 200 }

lanes:
  待つ: { label: "待つ" }
  置く: { label: "置く" }

# そろった分 (上から 2 行目) と届く (上から 2 行目) で矢印が真横に引ける
actors:
  - bw: { kind: barrier-box, phase: false, lane: 待つ }
  - ev: { kind: evict-box, phase: false, lane: 置く }

# 待ち合わせで減った分が、置き場の大きさでもう一度減る。 減る理由が 2 回とも違う
flow:
  - bw -> ev: "そろい" { fromPartNode: outP, toPartNode: inP }

animation:
  - step: "1. 両方届く" 1.2s
    focus: [bw__aP, bw__bP]
    badge: "到着"
    tween:
      bw__aN: 0 -> 12
      bw__bN: 0 -> 9
    body: "左から 12 件、右から 9 件が届く。 まだ 1 組も出ていない。"
  - step: "2. そろう" 1.4s
    focus: [bw]
    badge: "そろい"
    tween:
      bw__outN: 0 -> 9
    body: "両方そろった 9 組が出る。 左に残る 3 件は相手が来るまで出ない。"
  - step: "3. 置き場へ" 1.4s
    focus: [bw__outP, ev__inP, "bw -> ev"]
    badge: "受渡"
    tween:
      ev__inN: 0 -> 18
    body: "9 組を 1 件ずつに戻した 18 件が置き場に届く。"
  - step: "4. 押し出される" 1.4s
    focus: [ev]
    badge: "押出"
    tween:
      ev__keepN: 0 -> 10
      ev__pushN: 0 -> 8
    body: "置けるのは 10 件だけで、古い 8 件が押し出される。 そろえた分の半分近くがここで消える。"
`;

export const sourceJson__pattern__partsMotion__そろってから押し出す = `{
  "title": "そろった分を置き場に入れると古いものから押し出される",
  "type": "swimlane",
  "viewport": { "laneWidth": 200 },
  "lanes": {
    "待つ": { "label": "待つ" },
    "置く": { "label": "置く" }
  },
  "actors": [
    { "name": "bw", "kind": "barrier-box", "phase": false, "lane": "待つ" },
    { "name": "ev", "kind": "evict-box", "phase": false, "lane": "置く" }
  ],
  "flow": [
    { "from": "bw", "to": "ev", "label": "そろい", "fromPartNode": "outP", "toPartNode": "inP" }
  ],
  "animation": [
    {
      "step": "1. 両方届く",
      "duration": 1.2,
      "focus": ["bw__aP", "bw__bP"],
      "badge": "到着",
      "tween": { "bw__aN": [0, 12], "bw__bN": [0, 9] },
      "body": "左から 12 件、右から 9 件が届く。 まだ 1 組も出ていない。"
    },
    {
      "step": "2. そろう",
      "duration": 1.4,
      "focus": ["bw"],
      "badge": "そろい",
      "tween": { "bw__outN": [0, 9] },
      "body": "両方そろった 9 組が出る。 左に残る 3 件は相手が来るまで出ない。"
    },
    {
      "step": "3. 置き場へ",
      "duration": 1.4,
      "focus": ["bw__outP", "ev__inP", "bw -> ev"],
      "badge": "受渡",
      "tween": { "ev__inN": [0, 18] },
      "body": "9 組を 1 件ずつに戻した 18 件が置き場に届く。"
    },
    {
      "step": "4. 押し出される",
      "duration": 1.4,
      "focus": ["ev"],
      "badge": "押出",
      "tween": { "ev__keepN": [0, 10], "ev__pushN": [0, 8] },
      "body": "置けるのは 10 件だけで、古い 8 件が押し出される。 そろえた分の半分近くがここで消える。"
    }
  ]
}`;

export const pattern__partsMotion__そろってから押し出す = textDslToDiagram(
  sourceYaml__pattern__partsMotion__そろってから押し出す,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partsMotion__落ちた分が消える = `title: "落ちた分を置いておくと時が過ぎて自分で消える"
type: swimlane
viewport: { laneWidth: 200 }

lanes:
  遮る: { label: "遮る" }
  置く: { label: "置く" }

# 落ちる (上から 2 行目) と置く (上から 2 行目) で矢印が真横に引ける
actors:
  - cb: { kind: circuit-breaker, phase: false, lane: 遮る }
  - tt: { kind: expire-box, phase: false, lane: 置く }

# 遮断器の 3 つの出口のうち、落ちる分だけを置き場へ送る。 通った分と断った分はここに来ない
flow:
  - cb -> tt: "落ちた分" { fromPartNode: ngP, toPartNode: putP }

animation:
  - step: "1. 試す" 1.2s
    focus: [cb__inP]
    badge: "到着"
    tween:
      cb__inN: 0 -> 20
    body: "20 件を試す。 まだ通るか落ちるかは分かれていない。"
  - step: "2. 分かれる" 1.4s
    focus: [cb]
    badge: "遮断"
    tween:
      cb__okN: 0 -> 6
      cb__ngN: 0 -> 8
      cb__cutN: 0 -> 6
    body: "6 件が通り 8 件が落ちた所で遮断し、残る 6 件は試さずに断る。"
  - step: "3. 置いておく" 1.4s
    focus: [cb__ngP, tt__putP, "cb -> tt"]
    badge: "受渡"
    tween:
      tt__putN: 0 -> 8
    body: "落ちた 8 件だけを置いておく。 通った 6 件と断った 6 件はここに来ない。"
  - step: "4. 時が過ぎる" 1.4s
    focus: [tt]
    badge: "期限"
    tween:
      tt__liveN: 0 -> 3
      tt__goneN: 0 -> 5
    body: "時が来た 5 件が自分で消え、3 件だけ残る。 誰も消しに行っていないのに減った。"
`;

export const sourceJson__pattern__partsMotion__落ちた分が消える = `{
  "title": "落ちた分を置いておくと時が過ぎて自分で消える",
  "type": "swimlane",
  "viewport": { "laneWidth": 200 },
  "lanes": {
    "遮る": { "label": "遮る" },
    "置く": { "label": "置く" }
  },
  "actors": [
    { "name": "cb", "kind": "circuit-breaker", "phase": false, "lane": "遮る" },
    { "name": "tt", "kind": "expire-box", "phase": false, "lane": "置く" }
  ],
  "flow": [
    { "from": "cb", "to": "tt", "label": "落ちた分", "fromPartNode": "ngP", "toPartNode": "putP" }
  ],
  "animation": [
    {
      "step": "1. 試す",
      "duration": 1.2,
      "focus": ["cb__inP"],
      "badge": "到着",
      "tween": { "cb__inN": [0, 20] },
      "body": "20 件を試す。 まだ通るか落ちるかは分かれていない。"
    },
    {
      "step": "2. 分かれる",
      "duration": 1.4,
      "focus": ["cb"],
      "badge": "遮断",
      "tween": { "cb__okN": [0, 6], "cb__ngN": [0, 8], "cb__cutN": [0, 6] },
      "body": "6 件が通り 8 件が落ちた所で遮断し、残る 6 件は試さずに断る。"
    },
    {
      "step": "3. 置いておく",
      "duration": 1.4,
      "focus": ["cb__ngP", "tt__putP", "cb -> tt"],
      "badge": "受渡",
      "tween": { "tt__putN": [0, 8] },
      "body": "落ちた 8 件だけを置いておく。 通った 6 件と断った 6 件はここに来ない。"
    },
    {
      "step": "4. 時が過ぎる",
      "duration": 1.4,
      "focus": ["tt"],
      "badge": "期限",
      "tween": { "tt__liveN": [0, 3], "tt__goneN": [0, 5] },
      "body": "時が来た 5 件が自分で消え、3 件だけ残る。 誰も消しに行っていないのに減った。"
    }
  ]
}`;

export const pattern__partsMotion__落ちた分が消える = textDslToDiagram(
  sourceYaml__pattern__partsMotion__落ちた分が消える,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partsMotion__鍵の偏りを釣り合わせる = `title: "鍵で偏った分を出口で釣り合わせる"
type: swimlane
viewport: { laneWidth: 200 }

lanes:
  割る: { label: "割る" }
  釣り合わせる: { label: "釣り合わせる" }

# 2 枚の間に線を 2 本引く 2 つ目の切替。 鍵の先 (上から 1 行目と 3 行目) を
# 送り主 2 人 (同じ 1 行目と 3 行目) へ繋ぐと、どちらも真横に引ける
actors:
  - kr: { kind: key-router, phase: false, lane: 割る }
  - fq: { kind: fair-queue, phase: false, lane: 釣り合わせる }

# 鍵が作った偏りを出口が均す。 偏りを作る側と均す側を 1 枚に並べる
flow:
  - kr -> fq: "多い方" { fromPartNode: aP, toPartNode: bigP }
  - kr -> fq: "少ない方" { fromPartNode: bP, toPartNode: smallP }

animation:
  - step: "1. 届く" 1.2s
    focus: [kr__inP]
    badge: "到着"
    tween:
      kr__inN: 0 -> 24
    body: "24 件が届く。 まだどちらの鍵へ行くかは分かれていない。"
  - step: "2. 鍵で偏る" 1.4s
    focus: [kr]
    badge: "偏り"
    tween:
      kr__aN: 0 -> 18
      kr__bN: 0 -> 6
    body: "鍵で 18 件と 6 件に分かれる。 割合を変えても直せない偏りができた。"
  - step: "3. 出口へ送る" 1.4s
    focus: [kr__aP, kr__bP, fq__bigP, fq__smallP, "kr -> fq"]
    badge: "受渡"
    tween:
      fq__bigN: 0 -> 18
      fq__smallN: 0 -> 6
    body: "多い方が 18 件、少ない方が 6 件で出口に並ぶ。 同じ上限 30 の目盛りで比べる。"
  - step: "4. 釣り合う" 1.4s
    focus: [fq]
    badge: "均し"
    tween:
      fq__outN: 0 -> 12
    body: "どちらからも 6 件ずつで 12 件が出る。 多い方に残る 12 件は次の順番まで待つ。"
`;

export const sourceJson__pattern__partsMotion__鍵の偏りを釣り合わせる = `{
  "title": "鍵で偏った分を出口で釣り合わせる",
  "type": "swimlane",
  "viewport": { "laneWidth": 200 },
  "lanes": {
    "割る": { "label": "割る" },
    "釣り合わせる": { "label": "釣り合わせる" }
  },
  "actors": [
    { "name": "kr", "kind": "key-router", "phase": false, "lane": "割る" },
    { "name": "fq", "kind": "fair-queue", "phase": false, "lane": "釣り合わせる" }
  ],
  "flow": [
    { "from": "kr", "to": "fq", "label": "多い方", "fromPartNode": "aP", "toPartNode": "bigP" },
    { "from": "kr", "to": "fq", "label": "少ない方", "fromPartNode": "bP", "toPartNode": "smallP" }
  ],
  "animation": [
    {
      "step": "1. 届く",
      "duration": 1.2,
      "focus": ["kr__inP"],
      "badge": "到着",
      "tween": { "kr__inN": [0, 24] },
      "body": "24 件が届く。 まだどちらの鍵へ行くかは分かれていない。"
    },
    {
      "step": "2. 鍵で偏る",
      "duration": 1.4,
      "focus": ["kr"],
      "badge": "偏り",
      "tween": { "kr__aN": [0, 18], "kr__bN": [0, 6] },
      "body": "鍵で 18 件と 6 件に分かれる。 割合を変えても直せない偏りができた。"
    },
    {
      "step": "3. 出口へ送る",
      "duration": 1.4,
      "focus": ["kr__aP", "kr__bP", "fq__bigP", "fq__smallP", "kr -> fq"],
      "badge": "受渡",
      "tween": { "fq__bigN": [0, 18], "fq__smallN": [0, 6] },
      "body": "多い方が 18 件、少ない方が 6 件で出口に並ぶ。 同じ上限 30 の目盛りで比べる。"
    },
    {
      "step": "4. 釣り合う",
      "duration": 1.4,
      "focus": ["fq"],
      "badge": "均し",
      "tween": { "fq__outN": [0, 12] },
      "body": "どちらからも 6 件ずつで 12 件が出る。 多い方に残る 12 件は次の順番まで待つ。"
    }
  ]
}`;

export const pattern__partsMotion__鍵の偏りを釣り合わせる = textDslToDiagram(
  sourceYaml__pattern__partsMotion__鍵の偏りを釣り合わせる,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partsMotion__落ちた分が相乗りする = `title: "落ちた分を問い直すと同時の問いが 1 本にまとまる"
type: swimlane
viewport: { laneWidth: 200 }

lanes:
  遮る: { label: "遮る" }
  相乗り: { label: "相乗り" }

# 落ちる (上から 2 行目) と問い (上から 2 行目) で矢印が真横に引ける
actors:
  - cb: { kind: circuit-breaker, phase: false, lane: 遮る }
  - sf: { kind: single-flight, phase: false, lane: 相乗り }

# 落ちた分がいっせいに問い直す形。 遮断だけでは奥への本数が減らないことを見せる
flow:
  - cb -> sf: "落ちた分" { fromPartNode: ngP, toPartNode: askP }

animation:
  - step: "1. 試す" 1.2s
    focus: [cb__inP]
    badge: "到着"
    tween:
      cb__inN: 0 -> 20
    body: "20 件を試す。 まだ通るか落ちるかは分かれていない。"
  - step: "2. 落ちる" 1.4s
    focus: [cb]
    badge: "遮断"
    tween:
      cb__okN: 0 -> 4
      cb__ngN: 0 -> 12
      cb__cutN: 0 -> 4
    body: "4 件が通り 12 件が落ち、残る 4 件は試さずに断る。"
  - step: "3. 問い直す" 1.4s
    focus: [cb__ngP, sf__askP, "cb -> sf"]
    badge: "受渡"
    tween:
      sf__askN: 0 -> 12
    body: "落ちた 12 件がいっせいに問い直す。 このままだと奥へ 12 本行く。"
  - step: "4. 相乗りする" 1.4s
    focus: [sf]
    badge: "相乗"
    tween:
      sf__oneN: 0 -> 2
      sf__allN: 0 -> 12
    body: "12 件が 2 本にまとまって奥へ行き、返った答えは 12 件へ配られる。 1 件も捨てていない。"
`;

export const sourceJson__pattern__partsMotion__落ちた分が相乗りする = `{
  "title": "落ちた分を問い直すと同時の問いが 1 本にまとまる",
  "type": "swimlane",
  "viewport": { "laneWidth": 200 },
  "lanes": {
    "遮る": { "label": "遮る" },
    "相乗り": { "label": "相乗り" }
  },
  "actors": [
    { "name": "cb", "kind": "circuit-breaker", "phase": false, "lane": "遮る" },
    { "name": "sf", "kind": "single-flight", "phase": false, "lane": "相乗り" }
  ],
  "flow": [
    { "from": "cb", "to": "sf", "label": "落ちた分", "fromPartNode": "ngP", "toPartNode": "askP" }
  ],
  "animation": [
    {
      "step": "1. 試す",
      "duration": 1.2,
      "focus": ["cb__inP"],
      "badge": "到着",
      "tween": { "cb__inN": [0, 20] },
      "body": "20 件を試す。 まだ通るか落ちるかは分かれていない。"
    },
    {
      "step": "2. 落ちる",
      "duration": 1.4,
      "focus": ["cb"],
      "badge": "遮断",
      "tween": { "cb__okN": [0, 4], "cb__ngN": [0, 12], "cb__cutN": [0, 4] },
      "body": "4 件が通り 12 件が落ち、残る 4 件は試さずに断る。"
    },
    {
      "step": "3. 問い直す",
      "duration": 1.4,
      "focus": ["cb__ngP", "sf__askP", "cb -> sf"],
      "badge": "受渡",
      "tween": { "sf__askN": [0, 12] },
      "body": "落ちた 12 件がいっせいに問い直す。 このままだと奥へ 12 本行く。"
    },
    {
      "step": "4. 相乗りする",
      "duration": 1.4,
      "focus": ["sf"],
      "badge": "相乗",
      "tween": { "sf__oneN": [0, 2], "sf__allN": [0, 12] },
      "body": "12 件が 2 本にまとまって奥へ行き、返った答えは 12 件へ配られる。 1 件も捨てていない。"
    }
  ]
}`;

export const pattern__partsMotion__落ちた分が相乗りする = textDslToDiagram(
  sourceYaml__pattern__partsMotion__落ちた分が相乗りする,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partsMotion__順に戻してから溜める = `title: "番が来た分だけ順に戻して溜める"
type: swimlane
viewport: { laneWidth: 200 }

lanes:
  並べ直す: { label: "並べ直す" }
  溜める: { label: "溜める" }

# 出せる (上から 1 行目) と届く (上から 1 行目) で矢印が真横に引ける。
# 繋ぐ札は 4 字まで = 5 字にすると板が 1659 に伸びて箱の題が 11.6px になる (#2210 の実測)
actors:
  - ro: { kind: reorder-box, phase: false, lane: 並べ直す }
  - bt: { kind: batch-collector, phase: false, lane: 溜める }

# 順番で減り、束の大きさでもう一度減る。 減る理由が 2 回とも違う
flow:
  - ro -> bt: "出せた分" { fromPartNode: outP, toPartNode: inP }

animation:
  - step: "1. ばらばらに届く" 1.2s
    focus: [ro__inP]
    badge: "到着"
    tween:
      ro__inN: 0 -> 20
    body: "20 件がばらばらの順で届く。 まだ 1 件も出せていない。"
  - step: "2. 番で分かれる" 1.4s
    focus: [ro]
    badge: "順番"
    tween:
      ro__outN: 0 -> 12
      ro__holdN: 0 -> 8
    body: "番が来た 12 件が出せ、前を待つ 8 件は捨てられずに残る。"
  - step: "3. 溜める" 1.4s
    focus: [ro__outP, bt__inP, "ro -> bt"]
    badge: "受渡"
    tween:
      bt__inN: 0 -> 12
      bt__poolN: 0 -> 10
    body: "順に出た 12 件が 1 件ずつ溜まり、10 件で溜まりが満ちる。"
  - step: "4. まとめて送る" 1.4s
    focus: [bt]
    badge: "送出"
    tween:
      bt__sendN: 0 -> 1
    body: "10 件で 1 回送る。 残る 2 件は次の束が満ちるまで出ない。"
`;

export const sourceJson__pattern__partsMotion__順に戻してから溜める = `{
  "title": "番が来た分だけ順に戻して溜める",
  "type": "swimlane",
  "viewport": { "laneWidth": 200 },
  "lanes": {
    "並べ直す": { "label": "並べ直す" },
    "溜める": { "label": "溜める" }
  },
  "actors": [
    { "name": "ro", "kind": "reorder-box", "phase": false, "lane": "並べ直す" },
    { "name": "bt", "kind": "batch-collector", "phase": false, "lane": "溜める" }
  ],
  "flow": [
    { "from": "ro", "to": "bt", "label": "出せた分", "fromPartNode": "outP", "toPartNode": "inP" }
  ],
  "animation": [
    {
      "step": "1. ばらばらに届く",
      "duration": 1.2,
      "focus": ["ro__inP"],
      "badge": "到着",
      "tween": { "ro__inN": [0, 20] },
      "body": "20 件がばらばらの順で届く。 まだ 1 件も出せていない。"
    },
    {
      "step": "2. 番で分かれる",
      "duration": 1.4,
      "focus": ["ro"],
      "badge": "順番",
      "tween": { "ro__outN": [0, 12], "ro__holdN": [0, 8] },
      "body": "番が来た 12 件が出せ、前を待つ 8 件は捨てられずに残る。"
    },
    {
      "step": "3. 溜める",
      "duration": 1.4,
      "focus": ["ro__outP", "bt__inP", "ro -> bt"],
      "badge": "受渡",
      "tween": { "bt__inN": [0, 12], "bt__poolN": [0, 10] },
      "body": "順に出た 12 件が 1 件ずつ溜まり、10 件で溜まりが満ちる。"
    },
    {
      "step": "4. まとめて送る",
      "duration": 1.4,
      "focus": ["bt"],
      "badge": "送出",
      "tween": { "bt__sendN": [0, 1] },
      "body": "10 件で 1 回送る。 残る 2 件は次の束が満ちるまで出ない。"
    }
  ]
}`;

export const pattern__partsMotion__順に戻してから溜める = textDslToDiagram(
  sourceYaml__pattern__partsMotion__順に戻してから溜める,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partsMotion__釣り合わせてから順に戻す = `title: "交互に出した分を元の順に並べ直す"
type: swimlane
viewport: { laneWidth: 200 }

lanes:
  釣り合わせる: { label: "釣り合わせる" }
  並べ直す: { label: "並べ直す" }

# 出す (上から 2 行目) と届く (上から 2 行目) で矢印が真横に引ける
actors:
  - fq: { kind: fair-queue, phase: false, lane: 釣り合わせる }
  - ro: { kind: reorder-box, phase: false, lane: 並べ直す }

# 釣り合い箱は渡す側にも受ける側にもなる (「鍵の偏りを釣り合わせる」 では受ける側)
flow:
  - fq -> ro: "交互の分" { fromPartNode: outP, toPartNode: inP }

animation:
  - step: "1. 送り主が並ぶ" 1.2s
    focus: [fq__bigP, fq__smallP]
    badge: "到着"
    tween:
      fq__bigN: 0 -> 30
      fq__smallN: 0 -> 6
    body: "30 件送る人と 6 件送る人が並ぶ。 まだ 1 件も出ていない。"
  - step: "2. 交互に出る" 1.4s
    focus: [fq]
    badge: "均し"
    tween:
      fq__outN: 0 -> 12
    body: "どちらからも 6 件ずつで 12 件が出る。 多く送る人の棒は満杯のまま動かない。"
  - step: "3. 並べ直しへ" 1.4s
    focus: [fq__outP, ro__inP, "fq -> ro"]
    badge: "受渡"
    tween:
      ro__inN: 0 -> 12
    body: "交互に出た 12 件は元の順ではないので、並べ直しへ入る。"
  - step: "4. 番が来た分だけ出す" 1.4s
    focus: [ro]
    badge: "順番"
    tween:
      ro__outN: 0 -> 7
      ro__holdN: 0 -> 5
    body: "番が来た 7 件が出せ、前を待つ 5 件は残る。 釣り合わせた代わりに順が乱れた。"
`;

export const sourceJson__pattern__partsMotion__釣り合わせてから順に戻す = `{
  "title": "交互に出した分を元の順に並べ直す",
  "type": "swimlane",
  "viewport": { "laneWidth": 200 },
  "lanes": {
    "釣り合わせる": { "label": "釣り合わせる" },
    "並べ直す": { "label": "並べ直す" }
  },
  "actors": [
    { "name": "fq", "kind": "fair-queue", "phase": false, "lane": "釣り合わせる" },
    { "name": "ro", "kind": "reorder-box", "phase": false, "lane": "並べ直す" }
  ],
  "flow": [
    { "from": "fq", "to": "ro", "label": "交互の分", "fromPartNode": "outP", "toPartNode": "inP" }
  ],
  "animation": [
    {
      "step": "1. 送り主が並ぶ",
      "duration": 1.2,
      "focus": ["fq__bigP", "fq__smallP"],
      "badge": "到着",
      "tween": { "fq__bigN": [0, 30], "fq__smallN": [0, 6] },
      "body": "30 件送る人と 6 件送る人が並ぶ。 まだ 1 件も出ていない。"
    },
    {
      "step": "2. 交互に出る",
      "duration": 1.4,
      "focus": ["fq"],
      "badge": "均し",
      "tween": { "fq__outN": [0, 12] },
      "body": "どちらからも 6 件ずつで 12 件が出る。 多く送る人の棒は満杯のまま動かない。"
    },
    {
      "step": "3. 並べ直しへ",
      "duration": 1.4,
      "focus": ["fq__outP", "ro__inP", "fq -> ro"],
      "badge": "受渡",
      "tween": { "ro__inN": [0, 12] },
      "body": "交互に出た 12 件は元の順ではないので、並べ直しへ入る。"
    },
    {
      "step": "4. 番が来た分だけ出す",
      "duration": 1.4,
      "focus": ["ro"],
      "badge": "順番",
      "tween": { "ro__outN": [0, 7], "ro__holdN": [0, 5] },
      "body": "番が来た 7 件が出せ、前を待つ 5 件は残る。 釣り合わせた代わりに順が乱れた。"
    }
  ]
}`;

export const pattern__partsMotion__釣り合わせてから順に戻す = textDslToDiagram(
  sourceYaml__pattern__partsMotion__釣り合わせてから順に戻す,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partsMotion__よけてから溜める = `title: "やり直して通った分だけを溜めてまとめて送る"
type: swimlane
viewport: { laneWidth: 200 }

lanes:
  よける: { label: "よける" }
  溜める: { label: "溜める" }

# 先へ進む (上から 1 行目) と届く (上から 1 行目) で矢印が真横に引ける。
# 繋ぐ札は 4 字まで = 5 字にすると板が 1659 に伸びて箱の題が 11.6px になる (#2210 の実測)
actors:
  - dl: { kind: dead-letter, phase: false, lane: よける }
  - bt: { kind: batch-collector, phase: false, lane: 溜める }

# 脇へ出た分は次の箱へ渡らない。 減る理由が「諦めた」 と「束が満ちていない」 で 2 回とも違う
flow:
  - dl -> bt: "通った分" { fromPartNode: okP, toPartNode: inP }

animation:
  - step: "1. 何度もやり直す" 1.2s
    focus: [dl__inP]
    badge: "再試"
    tween:
      dl__inN: 0 -> 24
    body: "24 件が何度もやり直されている。 まだ行き先は決まっていない。"
  - step: "2. 諦めた分が分かれる" 1.4s
    focus: [dl]
    badge: "よけ"
    tween:
      dl__okN: 0 -> 21
      dl__deadN: 0 -> 3
    body: "21 件はやり直して通り、3 件は脇へ出る。 脇の 3 件は入口へ戻らない。"
  - step: "3. 溜める" 1.4s
    focus: [dl__okP, bt__inP, "dl -> bt"]
    badge: "受渡"
    tween:
      bt__inN: 0 -> 21
      bt__poolN: 0 -> 10
    body: "通った 21 件が 1 件ずつ溜まり、10 件で溜まりが満ちる。"
  - step: "4. まとめて送る" 1.4s
    focus: [bt]
    badge: "送出"
    tween:
      bt__sendN: 0 -> 2
    body: "10 件ずつ 2 回送る。 残る 1 件は次の束が満ちるまで出ない。"
`;

export const sourceJson__pattern__partsMotion__よけてから溜める = `{
  "title": "やり直して通った分だけを溜めてまとめて送る",
  "type": "swimlane",
  "viewport": { "laneWidth": 200 },
  "lanes": {
    "よける": { "label": "よける" },
    "溜める": { "label": "溜める" }
  },
  "actors": [
    { "name": "dl", "kind": "dead-letter", "phase": false, "lane": "よける" },
    { "name": "bt", "kind": "batch-collector", "phase": false, "lane": "溜める" }
  ],
  "flow": [
    { "from": "dl", "to": "bt", "label": "通った分", "fromPartNode": "okP", "toPartNode": "inP" }
  ],
  "animation": [
    {
      "step": "1. 何度もやり直す",
      "duration": 1.2,
      "focus": ["dl__inP"],
      "badge": "再試",
      "tween": { "dl__inN": [0, 24] },
      "body": "24 件が何度もやり直されている。 まだ行き先は決まっていない。"
    },
    {
      "step": "2. 諦めた分が分かれる",
      "duration": 1.4,
      "focus": ["dl"],
      "badge": "よけ",
      "tween": { "dl__okN": [0, 21], "dl__deadN": [0, 3] },
      "body": "21 件はやり直して通り、3 件は脇へ出る。 脇の 3 件は入口へ戻らない。"
    },
    {
      "step": "3. 溜める",
      "duration": 1.4,
      "focus": ["dl__okP", "bt__inP", "dl -> bt"],
      "badge": "受渡",
      "tween": { "bt__inN": [0, 21], "bt__poolN": [0, 10] },
      "body": "通った 21 件が 1 件ずつ溜まり、10 件で溜まりが満ちる。"
    },
    {
      "step": "4. まとめて送る",
      "duration": 1.4,
      "focus": ["bt"],
      "badge": "送出",
      "tween": { "bt__sendN": [0, 2] },
      "body": "10 件ずつ 2 回送る。 残る 1 件は次の束が満ちるまで出ない。"
    }
  ]
}`;

export const pattern__partsMotion__よけてから溜める = textDslToDiagram(
  sourceYaml__pattern__partsMotion__よけてから溜める,
  { partsCatalog: 部品の一覧 },
);

export const sourceYaml__pattern__partsMotion__問い合わせを一人ずつ通す = `title: "問い合わせだけを一度に一つずつ通す"
type: swimlane
viewport: { laneWidth: 200 }

lanes:
  仕分ける: { label: "仕分ける" }
  一人ずつ: { label: "一人ずつ" }

# 問い合わせ (上から 2 行目) と同時に来る (上から 2 行目) で矢印が真横に引ける。
# **どちらの部品も段 0 / 1 / 2 を全て使うので段は詰まらない** = 段の数字がそのまま行になる
# (詰まる形は #2204 の実測)。 繋ぐ札は 4 字まで = 5 字にすると板が 1659 に伸びる (#2210 の実測)
actors:
  - cs: { kind: content-sorter, phase: false, lane: 仕分ける }
  - lg: { kind: lock-gate, phase: false, lane: 一人ずつ }

# 中身で 3 つに分かれた 1 つだけが戸へ向かう。 戸の中に入れるのは何件来ても 1 件だけ
flow:
  - cs -> lg: "問合せ" { fromPartNode: outB, toPartNode: inP }

animation:
  - step: "1. 中身を見る" 1.2s
    focus: [cs__inP]
    badge: "到着"
    tween:
      cs__inN: 0 -> 20
    body: "20 件が届く。 中身はまだ見ていないので、行き先は決まっていない。"
  - step: "2. 種類で分かれる" 1.4s
    focus: [cs]
    badge: "仕分"
    tween:
      cs__aN: 0 -> 11
      cs__bN: 0 -> 6
      cs__cN: 0 -> 3
    body: "注文 11 件、問い合わせ 6 件、その他 3 件に分かれる。 合わせて 20 件で入った分と合う。"
  - step: "3. 戸へ向かう" 1.4s
    focus: [cs__outB, lg__inP, "cs -> lg"]
    badge: "受渡"
    tween:
      lg__inN: 0 -> 6
    body: "問い合わせの 6 件が戸の前へ同時に着く。 まだ 1 件も中に入っていない。"
  - step: "4. 一度に一つだけ入る" 1.4s
    focus: [lg]
    badge: "排他"
    tween:
      lg__nowN: 0 -> 1
      lg__waitN: 0 -> 5
    body: "中に入れるのは 1 件だけ。 残る 5 件は捨てられず戸の前で待ち、順に入る。"
`;

export const sourceJson__pattern__partsMotion__問い合わせを一人ずつ通す = `{
  "title": "問い合わせだけを一度に一つずつ通す",
  "type": "swimlane",
  "viewport": { "laneWidth": 200 },
  "lanes": {
    "仕分ける": { "label": "仕分ける" },
    "一人ずつ": { "label": "一人ずつ" }
  },
  "actors": [
    { "name": "cs", "kind": "content-sorter", "phase": false, "lane": "仕分ける" },
    { "name": "lg", "kind": "lock-gate", "phase": false, "lane": "一人ずつ" }
  ],
  "flow": [
    { "from": "cs", "to": "lg", "label": "問合せ", "fromPartNode": "outB", "toPartNode": "inP" }
  ],
  "animation": [
    {
      "step": "1. 中身を見る",
      "duration": 1.2,
      "focus": ["cs__inP"],
      "badge": "到着",
      "tween": { "cs__inN": [0, 20] },
      "body": "20 件が届く。 中身はまだ見ていないので、行き先は決まっていない。"
    },
    {
      "step": "2. 種類で分かれる",
      "duration": 1.4,
      "focus": ["cs"],
      "badge": "仕分",
      "tween": { "cs__aN": [0, 11], "cs__bN": [0, 6], "cs__cN": [0, 3] },
      "body": "注文 11 件、問い合わせ 6 件、その他 3 件に分かれる。 合わせて 20 件で入った分と合う。"
    },
    {
      "step": "3. 戸へ向かう",
      "duration": 1.4,
      "focus": ["cs__outB", "lg__inP", "cs -> lg"],
      "badge": "受渡",
      "tween": { "lg__inN": [0, 6] },
      "body": "問い合わせの 6 件が戸の前へ同時に着く。 まだ 1 件も中に入っていない。"
    },
    {
      "step": "4. 一度に一つだけ入る",
      "duration": 1.4,
      "focus": ["lg"],
      "badge": "排他",
      "tween": { "lg__nowN": [0, 1], "lg__waitN": [0, 5] },
      "body": "中に入れるのは 1 件だけ。 残る 5 件は捨てられず戸の前で待ち、順に入る。"
    }
  ]
}`;

export const pattern__partsMotion__問い合わせを一人ずつ通す = textDslToDiagram(
  sourceYaml__pattern__partsMotion__問い合わせを一人ずつ通す,
  { partsCatalog: 部品の一覧 },
);
