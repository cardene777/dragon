import{_ as t}from"./index-BuYVe_6H.js";import{a as n}from"./parts-catalog-e30MGwJj.js";import{部 as o}from"./parts.cdl-C82OebKU.js";const a=n(Object.values(o)),u="書かない",b="部品の名前を種類に書いて箱として置き、状態と倍率と色番号を書き換え、縦列に置き、部品の中の要素へ矢印を繋ぎ、2 つの部品へ矢印を分け、部品どうしを繋ぎ、高さの違う部品どうしも繋ぎ、2 つの部品から同じ箱へ集め、流れの途中に置き、名前を添えて並べ、部品を基準にして箱を置く",e=`title: "部品を箱に置き何も書き換えない"
type: flow

actors:
  - 設備の稼働: { kind: state-indicator }
`,g=`{
  "title": "部品を箱に置き何も書き換えない",
  "type": "flow",
  "actors": [
    { "name": "設備の稼働", "kind": "state-indicator" }
  ],
  "flow": []
}`,h=t(e,{partsCatalog:a}),r=`title: "部品の塗りの割合を 4 割で止める"
type: flow

actors:
  - 設備の稼働: { kind: state-indicator, state: { lvl: 0.4, phase: false } }
`,C=`{
  "title": "部品の塗りの割合を 4 割で止める",
  "type": "flow",
  "actors": [
    { "name": "設備の稼働", "kind": "state-indicator", "state": { "lvl": 0.4, "phase": false } }
  ],
  "flow": []
}`,J=t(r,{partsCatalog:a}),_=`title: "部品を 0.6 倍に縮めて置く"
type: flow

actors:
  - 設備の稼働: { kind: state-indicator, scale: 0.6 }
`,Y=`{
  "title": "部品を 0.6 倍に縮めて置く",
  "type": "flow",
  "actors": [
    { "name": "設備の稼働", "kind": "state-indicator", "scale": 0.6 }
  ],
  "flow": []
}`,L=t(_,{partsCatalog:a}),s=`title: "部品の塗りを赤の色番号にする"
type: flow

actors:
  - 設備の稼働: { kind: state-indicator, color: "#d9534f" }
`,N=`{
  "title": "部品の塗りを赤の色番号にする",
  "type": "flow",
  "actors": [
    { "name": "設備の稼働", "kind": "state-indicator", "color": "#d9534f" }
  ],
  "flow": []
}`,P=t(s,{partsCatalog:a}),i=`title: "設備の稼働を出荷の縦列に置く"
type: swimlane

lanes:
  受付: { label: "受付" }
  出荷: { label: "出荷" }

actors:
  - 注文を受ける: { kind: card, lane: 受付 }
  - 梱包する: { kind: card, lane: 出荷 }
  - 設備の稼働: { kind: state-indicator, lane: 出荷 }
`,v=`{
  "title": "設備の稼働を出荷の縦列に置く",
  "type": "swimlane",
  "lanes": {
    "受付": { "label": "受付" },
    "出荷": { "label": "出荷" }
  },
  "actors": [
    { "name": "注文を受ける", "kind": "card", "lane": "受付" },
    { "name": "梱包する", "kind": "card", "lane": "出荷" },
    { "name": "設備の稼働", "kind": "state-indicator", "lane": "出荷" }
  ],
  "flow": []
}`,D=t(i,{partsCatalog:a}),c=`title: "点検の結果を部品に送り、部品から保全へ知らせる"
type: swimlane

actors:
  - 点検: { kind: card }
  - 設備の稼働: { kind: state-indicator }
  - 保全: { kind: card }

flow:
  - 点検 -> 設備の稼働: "結果を送る"
  - 設備の稼働 -> 保全: "異常を知らせる"
`,R=`{
  "title": "点検の結果を部品に送り、部品から保全へ知らせる",
  "type": "swimlane",
  "actors": [
    { "name": "点検", "kind": "card" },
    { "name": "設備の稼働", "kind": "state-indicator" },
    { "name": "保全", "kind": "card" }
  ],
  "flow": [
    { "from": "点検", "to": "設備の稼働", "label": "結果を送る" },
    { "from": "設備の稼働", "to": "保全", "label": "異常を知らせる" }
  ]
}`,j=t(c,{partsCatalog:a}),l=`title: "受注から在庫の上層へ、在庫の底層から出荷へ矢印を繋ぐ"
type: swimlane

actors:
  - 受注: { kind: card }
  - 在庫の内訳: { kind: stacked-layer }
  - 出荷: { kind: card }

flow:
  - 受注 -> 在庫の内訳: "上層から引き当てる" { toPartNode: topL }
  - 在庫の内訳 -> 出荷: "底層を出す" { fromPartNode: botL }
`,O=`{
  "title": "受注から在庫の上層へ、在庫の底層から出荷へ矢印を繋ぐ",
  "type": "swimlane",
  "actors": [
    { "name": "受注", "kind": "card" },
    { "name": "在庫の内訳", "kind": "stacked-layer" },
    { "name": "出荷", "kind": "card" }
  ],
  "flow": [
    { "from": "受注", "to": "在庫の内訳", "label": "上層から引き当てる", "toPartNode": "topL" },
    { "from": "在庫の内訳", "to": "出荷", "label": "底層を出す", "fromPartNode": "botL" }
  ]
}`,T=t(l,{partsCatalog:a}),d=`title: "検査の結果を設備の稼働と炉の温度へ分けて送る"
type: swimlane

actors:
  - 検査: { kind: card }
  - 成形機: { kind: state-indicator }
  - 乾燥炉の温度: { kind: thermometer }

flow:
  - 検査 -> 成形機: "稼働を確かめる"
  - 検査 -> 乾燥炉の温度: "温度を読む"
`,q=`{
  "title": "検査の結果を設備の稼働と炉の温度へ分けて送る",
  "type": "swimlane",
  "actors": [
    { "name": "検査", "kind": "card" },
    { "name": "成形機", "kind": "state-indicator" },
    { "name": "乾燥炉の温度", "kind": "thermometer" }
  ],
  "flow": [
    { "from": "検査", "to": "成形機", "label": "稼働を確かめる" },
    { "from": "検査", "to": "乾燥炉の温度", "label": "温度を読む" }
  ]
}`,z=t(d,{partsCatalog:a}),p=`title: "成形機の稼働から塗装機の稼働へ、部品どうしを矢印で繋ぐ"
type: swimlane

actors:
  - 検査: { kind: card }
  - 成形機: { kind: state-indicator }
  - 塗装機: { kind: state-indicator }

flow:
  - 検査 -> 成形機: "稼働を確かめる"
  - 成形機 -> 塗装機: "次の工程へ回す"
`,A=`{
  "title": "成形機の稼働から塗装機の稼働へ、部品どうしを矢印で繋ぐ",
  "type": "swimlane",
  "actors": [
    { "name": "検査", "kind": "card" },
    { "name": "成形機", "kind": "state-indicator" },
    { "name": "塗装機", "kind": "state-indicator" }
  ],
  "flow": [
    { "from": "検査", "to": "成形機", "label": "稼働を確かめる" },
    { "from": "成形機", "to": "塗装機", "label": "次の工程へ回す" }
  ]
}`,E=t(p,{partsCatalog:a}),m=`title: "成形機の稼働から乾燥炉の温度へ、高さの違う部品どうしを矢印で繋ぐ"
type: swimlane

actors:
  - 検査: { kind: card }
  - 成形機: { kind: state-indicator }
  - 乾燥炉の温度: { kind: thermometer }

flow:
  - 検査 -> 成形機: "稼働を確かめる"
  - 成形機 -> 乾燥炉の温度: "炉の温度を読む"
`,F=`{
  "title": "成形機の稼働から乾燥炉の温度へ、高さの違う部品どうしを矢印で繋ぐ",
  "type": "swimlane",
  "actors": [
    { "name": "検査", "kind": "card" },
    { "name": "成形機", "kind": "state-indicator" },
    { "name": "乾燥炉の温度", "kind": "thermometer" }
  ],
  "flow": [
    { "from": "検査", "to": "成形機", "label": "稼働を確かめる" },
    { "from": "成形機", "to": "乾燥炉の温度", "label": "炉の温度を読む" }
  ]
}`,G=t(m,{partsCatalog:a}),k=`title: "成形機と塗装機の稼働を、どちらも記録へ集める"
type: swimlane

actors:
  - 検査: { kind: card }
  - 成形機: { kind: state-indicator }
  - 塗装機: { kind: state-indicator }
  - 記録: { kind: card }

flow:
  - 検査 -> 成形機: "稼働を確かめる"
  - 検査 -> 塗装機: "稼働を確かめる"
  - 成形機 -> 記録: "稼働を残す"
  - 塗装機 -> 記録: "稼働を残す"
`,H=`{
  "title": "成形機と塗装機の稼働を、どちらも記録へ集める",
  "type": "swimlane",
  "actors": [
    { "name": "検査", "kind": "card" },
    { "name": "成形機", "kind": "state-indicator" },
    { "name": "塗装機", "kind": "state-indicator" },
    { "name": "記録", "kind": "card" }
  ],
  "flow": [
    { "from": "検査", "to": "成形機", "label": "稼働を確かめる" },
    { "from": "検査", "to": "塗装機", "label": "稼働を確かめる" },
    { "from": "成形機", "to": "記録", "label": "稼働を残す" },
    { "from": "塗装機", "to": "記録", "label": "稼働を残す" }
  ]
}`,K=t(k,{partsCatalog:a}),f=`title: "注文を受けてから出荷するまでの間に設備の稼働を置く"
type: flow

actors:
  - 注文を受ける: { kind: card }
  - 設備の稼働: { kind: state-indicator }
  - 出荷する: { kind: card }

flow:
  - 注文を受ける -> 出荷する: "引き渡す"
`,M=`{
  "title": "注文を受けてから出荷するまでの間に設備の稼働を置く",
  "type": "flow",
  "actors": [
    { "name": "注文を受ける", "kind": "card" },
    { "name": "設備の稼働", "kind": "state-indicator" },
    { "name": "出荷する", "kind": "card" }
  ],
  "flow": [
    { "from": "注文を受ける", "to": "出荷する", "label": "引き渡す" }
  ]
}`,Q=t(f,{partsCatalog:a}),w=`title: "製造ラインの設備 3 台と乾燥炉の温度、工場の回線を並べる"
type: flow

actors:
  - 成形機: { kind: state-indicator }
  - 塗装機: { kind: state-indicator }
  - 乾燥炉: { kind: state-indicator, color: "#d9534f" }
  - 乾燥炉の温度: { kind: thermometer }
  - 工場の回線: { kind: bandwidth-meter }
`,S=`{
  "title": "製造ラインの設備 3 台と乾燥炉の温度、工場の回線を並べる",
  "type": "flow",
  "actors": [
    { "name": "成形機", "kind": "state-indicator" },
    { "name": "塗装機", "kind": "state-indicator" },
    { "name": "乾燥炉", "kind": "state-indicator", "color": "#d9534f" },
    { "name": "乾燥炉の温度", "kind": "thermometer" },
    { "name": "工場の回線", "kind": "bandwidth-meter" }
  ],
  "flow": []
}`,U=t(w,{partsCatalog:a}),x=`title: "設備の稼働の右に受付を置き、受付の右に乾燥炉の温度を置く"
type: topology

lanes:
  main: { contain: false }

actors:
  - 設備の稼働: { kind: state-indicator }
  - 受付:
      kind: card
      位置: 設備の稼働 の右 200
  - 乾燥炉の温度:
      kind: thermometer
      位置: 受付 の右 200
`,V=`{
  "title": "設備の稼働の右に受付を置き、受付の右に乾燥炉の温度を置く",
  "type": "topology",
  "lanes": { "main": { "contain": false } },
  "actors": [
    { "name": "設備の稼働", "kind": "state-indicator" },
    {
      "name": "受付",
      "kind": "card",
      "posRel": { "anchor": "設備の稼働", "dir": "right", "gap": 200 }
    },
    {
      "name": "乾燥炉の温度",
      "kind": "thermometer",
      "posRel": { "anchor": "受付", "dir": "right", "gap": 200 }
    }
  ],
  "flow": []
}`,W=t(x,{partsCatalog:a});export{h as partInBox,u as patternBase__partInBox,U as pattern__partInBox__並べる,L as pattern__partInBox__倍率を変える,Q as pattern__partInBox__流れの途中に置く,J as pattern__partInBox__状態を上書き,z as pattern__partInBox__矢印を分ける,j as pattern__partInBox__矢印を繋ぐ,K as pattern__partInBox__矢印を集める,D as pattern__partInBox__縦列に置く,T as pattern__partInBox__繋ぐ要素を名指しする,P as pattern__partInBox__色番号を変える,E as pattern__partInBox__部品どうしを繋ぐ,W as pattern__partInBox__部品を基準にする,G as pattern__partInBox__高さの違う部品どうしを繋ぐ,g as sourceJson__partInBox,S as sourceJson__pattern__partInBox__並べる,Y as sourceJson__pattern__partInBox__倍率を変える,M as sourceJson__pattern__partInBox__流れの途中に置く,C as sourceJson__pattern__partInBox__状態を上書き,q as sourceJson__pattern__partInBox__矢印を分ける,R as sourceJson__pattern__partInBox__矢印を繋ぐ,H as sourceJson__pattern__partInBox__矢印を集める,v as sourceJson__pattern__partInBox__縦列に置く,O as sourceJson__pattern__partInBox__繋ぐ要素を名指しする,N as sourceJson__pattern__partInBox__色番号を変える,A as sourceJson__pattern__partInBox__部品どうしを繋ぐ,V as sourceJson__pattern__partInBox__部品を基準にする,F as sourceJson__pattern__partInBox__高さの違う部品どうしを繋ぐ,e as sourceYaml__partInBox,w as sourceYaml__pattern__partInBox__並べる,_ as sourceYaml__pattern__partInBox__倍率を変える,f as sourceYaml__pattern__partInBox__流れの途中に置く,r as sourceYaml__pattern__partInBox__状態を上書き,d as sourceYaml__pattern__partInBox__矢印を分ける,c as sourceYaml__pattern__partInBox__矢印を繋ぐ,k as sourceYaml__pattern__partInBox__矢印を集める,i as sourceYaml__pattern__partInBox__縦列に置く,l as sourceYaml__pattern__partInBox__繋ぐ要素を名指しする,s as sourceYaml__pattern__partInBox__色番号を変える,p as sourceYaml__pattern__partInBox__部品どうしを繋ぐ,x as sourceYaml__pattern__partInBox__部品を基準にする,m as sourceYaml__pattern__partInBox__高さの違う部品どうしを繋ぐ,b as subtitle__partInBox};
