import{_ as e}from"./index-BuYVe_6H.js";import{a as o}from"./parts-catalog-e30MGwJj.js";import{部 as a}from"./parts.cdl-C82OebKU.js";const t=o(Object.values(a)),J="流れに沿って動かす",Y="部品を矢印で繋いだまま段で動かし、繋いだ先へ値を渡し、要素を名指しして層ごとに動かし、2 つの部品へ分け、2 つの部品から 1 つの箱へ集め、部品の段のままの部品と宿主が動かす部品を並べ、振り分け器の出口を合流点の入口へ繋ぎ、負荷分散器の出口 1 つを複製器へ繋いで分けると写すの違いを見せ、仕分け箱の出口 1 つをまとめ箱へ繋いで分けた分だけが溜まることを見せ、やり直しの輪の通るを切替器の入口へ繋いで戻る線を持つ部品も組めることを見せ、重なり消し箱の残すをまとめ箱へ繋いで減った分だけが溜まることを見せ、写し箱の 2 つの出口を待ち合わせ箱の左右へ 2 本の線で繋ぎ、待ち合わせ箱のそろった分を遮断器へ繋いで 2 段構えで減る形を見せる",s=`title: "入ってくる量を溜めて送り出す"
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
`,B=`{
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
}`,A=e(s,{partsCatalog:t}),n=`title: "在庫の上層へ積み、底層から出荷する"
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
`,z=`{
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
}`,j=e(n,{partsCatalog:t}),_=`title: "検査の結果を 2 つの計器へ分けて送る"
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
`,D=`{
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
}`,O=e(_,{partsCatalog:t}),l=`title: "2 つの計器の値をどちらも記録へ集める"
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
`,T=`{
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
}`,E=e(l,{partsCatalog:t}),b=`title: "部品の段のまま置く形と、宿主の段で動かす形を並べる"
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
`,F=`{
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
}`,G=e(b,{partsCatalog:t}),r=`title: "注文を 2 つの窓口へ振り分けてから 1 つにまとめる"
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
`,H=`{
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
}`,I=e(r,{partsCatalog:t}),i=`title: "3 つへ配った分のうち 1 つを 3 つの控えへ写す"
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
`,K=`{
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
}`,Q=e(i,{partsCatalog:t}),d=`title: "中身の種類で分けた注文だけを溜めてまとめて送る"
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
`,R=`{
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
}`,S=e(d,{partsCatalog:t}),p=`title: "やり直して通った分を送り、常用が落ちたら予備へ倒す"
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
`,U=`{
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
}`,V=e(p,{partsCatalog:t}),c=`title: "重なりを消した分だけを溜めて、満ちたらまとめて送る"
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
`,X=`{
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
}`,Z=e(c,{partsCatalog:t}),f=`title: "手元から返った分と奥から返った分がそろってから出す"
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
`,$=`{
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
}`,ee=e(f,{partsCatalog:t}),u=`title: "そろった分を送り、落ちる分が増えて遮断する"
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
`,te=`{
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
}`,oe=e(u,{partsCatalog:t}),w=`title: "割って増えた小分けを溜め直して送る"
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
`,ae=`{
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
}`,se=e(w,{partsCatalog:t}),m=`title: "割って数が増えた分を送ると後ろが詰まって入口が絞られる"
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
`,ne=`{
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
}`,_e=e(m,{partsCatalog:t}),g=`title: "そろった分を置き場に入れると古いものから押し出される"
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
`,le=`{
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
}`,be=e(g,{partsCatalog:t}),N=`title: "落ちた分を置いておくと時が過ぎて自分で消える"
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
`,re=`{
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
}`,ie=e(N,{partsCatalog:t}),P=`title: "鍵で偏った分を出口で釣り合わせる"
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
`,de=`{
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
}`,pe=e(P,{partsCatalog:t}),y=`title: "落ちた分を問い直すと同時の問いが 1 本にまとまる"
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
`,ce=`{
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
}`,fe=e(y,{partsCatalog:t}),k=`title: "番が来た分だけ順に戻して溜める"
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
`,ue=`{
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
}`,we=e(k,{partsCatalog:t}),h=`title: "交互に出した分を元の順に並べ直す"
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
`,me=`{
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
}`,ge=e(h,{partsCatalog:t}),v=`title: "やり直して通った分だけを溜めてまとめて送る"
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
`,Ne=`{
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
}`,Pe=e(v,{partsCatalog:t}),M=`title: "問い合わせだけを一度に一つずつ通す"
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
`,ye=`{
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
}`,ke=e(M,{partsCatalog:t}),q=`title: "控えを取っても先へ行く数と束の数は変わらない"
type: swimlane
viewport: { laneWidth: 200 }

lanes:
  控える: { label: "控える" }
  溜める: { label: "溜める" }

# そのまま先へ (上から 1 行目) と届く (上から 1 行目) で矢印が真横に引ける。
# 控え取り箱は段 0 / 1 / 2 を全て使い、まとめ箱は段 0 / 1 しか使わないので、
# **どちらも出入口が 1 行目に来る** (段の数字ではなく詰めた後の行で決まる、#2204 の実測)
actors:
  - st: { kind: sample-tap, phase: false, lane: 控える }
  - bt: { kind: batch-collector, phase: false, lane: 溜める }

# 控えに 3 件取っても先へ行くのは 16 件のまま。 束の数も控えのせいでは減らない
flow:
  - st -> bt: "全部" { fromPartNode: thruP, toPartNode: inP }

animation:
  - step: "1. 全部通る" 1.2s
    focus: [st__inP]
    badge: "到着"
    tween:
      st__inN: 0 -> 16
    body: "16 件が届く。 まだ 1 件も控えていない。"
  - step: "2. 一部を控える" 1.4s
    focus: [st]
    badge: "控え"
    tween:
      st__thruN: 0 -> 16
      st__keepN: 0 -> 3
    body: "3 件の写しが控えに残るが、先へ行くのは 16 件のまま。 本筋は 1 件も減らない。"
  - step: "3. 溜める" 1.4s
    focus: [st__thruP, bt__inP, "st -> bt"]
    badge: "受渡"
    tween:
      bt__inN: 0 -> 16
      bt__poolN: 0 -> 10
    body: "控えた分を引かずに 16 件が溜まり、10 件で溜まりが満ちる。"
  - step: "4. まとめて送る" 1.4s
    focus: [bt]
    badge: "送出"
    tween:
      bt__sendN: 0 -> 1
    body: "10 件で 1 回送る。 残る 6 件は次の束が満ちるまで出ない。 控えは束の数を変えていない。"
`,he=`{
  "title": "控えを取っても先へ行く数と束の数は変わらない",
  "type": "swimlane",
  "viewport": { "laneWidth": 200 },
  "lanes": {
    "控える": { "label": "控える" },
    "溜める": { "label": "溜める" }
  },
  "actors": [
    { "name": "st", "kind": "sample-tap", "phase": false, "lane": "控える" },
    { "name": "bt", "kind": "batch-collector", "phase": false, "lane": "溜める" }
  ],
  "flow": [
    { "from": "st", "to": "bt", "label": "全部", "fromPartNode": "thruP", "toPartNode": "inP" }
  ],
  "animation": [
    {
      "step": "1. 全部通る",
      "duration": 1.2,
      "focus": ["st__inP"],
      "badge": "到着",
      "tween": { "st__inN": [0, 16] },
      "body": "16 件が届く。 まだ 1 件も控えていない。"
    },
    {
      "step": "2. 一部を控える",
      "duration": 1.4,
      "focus": ["st"],
      "badge": "控え",
      "tween": { "st__thruN": [0, 16], "st__keepN": [0, 3] },
      "body": "3 件の写しが控えに残るが、先へ行くのは 16 件のまま。 本筋は 1 件も減らない。"
    },
    {
      "step": "3. 溜める",
      "duration": 1.4,
      "focus": ["st__thruP", "bt__inP", "st -> bt"],
      "badge": "受渡",
      "tween": { "bt__inN": [0, 16], "bt__poolN": [0, 10] },
      "body": "控えた分を引かずに 16 件が溜まり、10 件で溜まりが満ちる。"
    },
    {
      "step": "4. まとめて送る",
      "duration": 1.4,
      "focus": ["bt"],
      "badge": "送出",
      "tween": { "bt__sendN": [0, 1] },
      "body": "10 件で 1 回送る。 残る 6 件は次の束が満ちるまで出ない。 控えは束の数を変えていない。"
    }
  ]
}`,ve=e(q,{partsCatalog:t}),L=`title: "両方そろった分の受け取りだけ先に返す"
type: swimlane
viewport: { laneWidth: 200 }

lanes:
  待ち合わせ: { label: "待ち合わせ" }
  先に返す: { label: "先に返す" }

# そろった分 (上から 2 行目) と頼まれる (上から 2 行目) で矢印が真横に引ける。
# **どちらの部品も段 0 / 1 / 2 を全て使うので段は詰まらない** = 段の数字がそのまま行になる
actors:
  - ba: { kind: barrier-box, phase: false, lane: 待ち合わせ }
  - af: { kind: ack-first, phase: false, lane: 先に返す }

# そろうまで待つ箱の次に、待たせずに返す箱を置く。 待つ場所が前の箱に寄っている
flow:
  - ba -> af: "そろい" { fromPartNode: outP, toPartNode: inP }

animation:
  - step: "1. 左右から届く" 1.2s
    focus: [ba__aP, ba__bP]
    badge: "到着"
    tween:
      ba__aN: 0 -> 12
      ba__bN: 0 -> 7
    body: "左から 12 件、右から 7 件が届く。 まだ 1 組も出ていない。"
  - step: "2. そろった分だけ出す" 1.4s
    focus: [ba]
    badge: "待合"
    tween:
      ba__outN: 0 -> 7
    body: "相手が来た 7 組だけが出る。 左の残り 5 件は相手待ちで止まる。"
  - step: "3. 頼まれる" 1.4s
    focus: [ba__outP, af__inP, "ba -> af"]
    badge: "受渡"
    tween:
      af__inN: 0 -> 7
    body: "そろった 7 組が頼みごととして届く。 まだ 1 件も返事していない。"
  - step: "4. 受け取りだけ先に返す" 1.4s
    focus: [af]
    badge: "先返"
    tween:
      af__ackN: 0 -> 7
      af__doneN: 0 -> 3
    body: "7 件とも返事はすぐ返り、片づけが済んだのは 3 件。 待たせる場所が前の箱だけになる。"
`,Me=`{
  "title": "両方そろった分の受け取りだけ先に返す",
  "type": "swimlane",
  "viewport": { "laneWidth": 200 },
  "lanes": {
    "待ち合わせ": { "label": "待ち合わせ" },
    "先に返す": { "label": "先に返す" }
  },
  "actors": [
    { "name": "ba", "kind": "barrier-box", "phase": false, "lane": "待ち合わせ" },
    { "name": "af", "kind": "ack-first", "phase": false, "lane": "先に返す" }
  ],
  "flow": [
    { "from": "ba", "to": "af", "label": "そろい", "fromPartNode": "outP", "toPartNode": "inP" }
  ],
  "animation": [
    {
      "step": "1. 左右から届く",
      "duration": 1.2,
      "focus": ["ba__aP", "ba__bP"],
      "badge": "到着",
      "tween": { "ba__aN": [0, 12], "ba__bN": [0, 7] },
      "body": "左から 12 件、右から 7 件が届く。 まだ 1 組も出ていない。"
    },
    {
      "step": "2. そろった分だけ出す",
      "duration": 1.4,
      "focus": ["ba"],
      "badge": "待合",
      "tween": { "ba__outN": [0, 7] },
      "body": "相手が来た 7 組だけが出る。 左の残り 5 件は相手待ちで止まる。"
    },
    {
      "step": "3. 頼まれる",
      "duration": 1.4,
      "focus": ["ba__outP", "af__inP", "ba -> af"],
      "badge": "受渡",
      "tween": { "af__inN": [0, 7] },
      "body": "そろった 7 組が頼みごととして届く。 まだ 1 件も返事していない。"
    },
    {
      "step": "4. 受け取りだけ先に返す",
      "duration": 1.4,
      "focus": ["af"],
      "badge": "先返",
      "tween": { "af__ackN": [0, 7], "af__doneN": [0, 3] },
      "body": "7 件とも返事はすぐ返り、片づけが済んだのは 3 件。 待たせる場所が前の箱だけになる。"
    }
  ]
}`,qe=e(L,{partsCatalog:t});export{A as partsMotion,J as patternBase__partsMotion,qe as pattern__partsMotion__そろってから先に返す,be as pattern__partsMotion__そろってから押し出す,oe as pattern__partsMotion__そろってから遮断する,V as pattern__partsMotion__やり直してから倒す,Pe as pattern__partsMotion__よけてから溜める,S as pattern__partsMotion__仕分けてから溜める,ee as pattern__partsMotion__写してから待ち合わせる,O as pattern__partsMotion__分ける,se as pattern__partsMotion__割ってから溜める,_e as pattern__partsMotion__割ってから詰まらせる,ke as pattern__partsMotion__問い合わせを一人ずつ通す,I as pattern__partsMotion__振り分けて合流させる,ve as pattern__partsMotion__控えを取っても束は変わらない,ie as pattern__partsMotion__落ちた分が消える,fe as pattern__partsMotion__落ちた分が相乗りする,j as pattern__partsMotion__要素ごとに繋ぐ,G as pattern__partsMotion__部品の段を残す,Q as pattern__partsMotion__配ってから写す,Z as pattern__partsMotion__重なりを消してから溜める,ge as pattern__partsMotion__釣り合わせてから順に戻す,pe as pattern__partsMotion__鍵の偏りを釣り合わせる,E as pattern__partsMotion__集める,we as pattern__partsMotion__順に戻してから溜める,B as sourceJson__partsMotion,Me as sourceJson__pattern__partsMotion__そろってから先に返す,le as sourceJson__pattern__partsMotion__そろってから押し出す,te as sourceJson__pattern__partsMotion__そろってから遮断する,U as sourceJson__pattern__partsMotion__やり直してから倒す,Ne as sourceJson__pattern__partsMotion__よけてから溜める,R as sourceJson__pattern__partsMotion__仕分けてから溜める,$ as sourceJson__pattern__partsMotion__写してから待ち合わせる,D as sourceJson__pattern__partsMotion__分ける,ae as sourceJson__pattern__partsMotion__割ってから溜める,ne as sourceJson__pattern__partsMotion__割ってから詰まらせる,ye as sourceJson__pattern__partsMotion__問い合わせを一人ずつ通す,H as sourceJson__pattern__partsMotion__振り分けて合流させる,he as sourceJson__pattern__partsMotion__控えを取っても束は変わらない,re as sourceJson__pattern__partsMotion__落ちた分が消える,ce as sourceJson__pattern__partsMotion__落ちた分が相乗りする,z as sourceJson__pattern__partsMotion__要素ごとに繋ぐ,F as sourceJson__pattern__partsMotion__部品の段を残す,K as sourceJson__pattern__partsMotion__配ってから写す,X as sourceJson__pattern__partsMotion__重なりを消してから溜める,me as sourceJson__pattern__partsMotion__釣り合わせてから順に戻す,de as sourceJson__pattern__partsMotion__鍵の偏りを釣り合わせる,T as sourceJson__pattern__partsMotion__集める,ue as sourceJson__pattern__partsMotion__順に戻してから溜める,s as sourceYaml__partsMotion,L as sourceYaml__pattern__partsMotion__そろってから先に返す,g as sourceYaml__pattern__partsMotion__そろってから押し出す,u as sourceYaml__pattern__partsMotion__そろってから遮断する,p as sourceYaml__pattern__partsMotion__やり直してから倒す,v as sourceYaml__pattern__partsMotion__よけてから溜める,d as sourceYaml__pattern__partsMotion__仕分けてから溜める,f as sourceYaml__pattern__partsMotion__写してから待ち合わせる,_ as sourceYaml__pattern__partsMotion__分ける,w as sourceYaml__pattern__partsMotion__割ってから溜める,m as sourceYaml__pattern__partsMotion__割ってから詰まらせる,M as sourceYaml__pattern__partsMotion__問い合わせを一人ずつ通す,r as sourceYaml__pattern__partsMotion__振り分けて合流させる,q as sourceYaml__pattern__partsMotion__控えを取っても束は変わらない,N as sourceYaml__pattern__partsMotion__落ちた分が消える,y as sourceYaml__pattern__partsMotion__落ちた分が相乗りする,n as sourceYaml__pattern__partsMotion__要素ごとに繋ぐ,b as sourceYaml__pattern__partsMotion__部品の段を残す,i as sourceYaml__pattern__partsMotion__配ってから写す,c as sourceYaml__pattern__partsMotion__重なりを消してから溜める,h as sourceYaml__pattern__partsMotion__釣り合わせてから順に戻す,P as sourceYaml__pattern__partsMotion__鍵の偏りを釣り合わせる,l as sourceYaml__pattern__partsMotion__集める,k as sourceYaml__pattern__partsMotion__順に戻してから溜める,Y as subtitle__partsMotion};
