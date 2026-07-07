import { diagram } from "@cardenelabs/cdl";
import type { PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Catalog - Primitives ... lane / node の基本パーツ。
 * 全 card で lane width 440 統一 = SVG viewBox 同サイズ = catalog grid 整列。
 */

const W = 440;

/** 1. NodeKind 全 5 種 (actor / function / storage / event / card) */
export const kindActor = diagram("kind-actor", { topic: "kind: actor (外部主体)" })
  .lane("l", { x: 0, width: W })
  .node("a", { lane: "l", stack: 0, kind: "actor", title: "Client", eyebrow: "外部主体", value: "42 users" })
  .phase("p", { duration: 1500, title: "actor", body: "外部主体 (Client / 利用者 等)。 数値 value 表示可。" }, (p: PhaseBuilder) => p.activate("a").badge("active"))
  .build();

export const kindFunction = diagram("kind-function", { topic: "kind: function (関数呼び出し)" })
  .lane("l", { x: 0, width: W })
  .node("fn", { lane: "l", stack: 0, kind: "function", title: "handler(req)", eyebrow: "関数呼び出し", subtitle: "-> Result<Order, ValidationError>" })
  .phase("p", { duration: 1500, title: "function", body: "Service の関数。 mono 等幅 title + subtitle で署名表示。" }, (p: PhaseBuilder) => p.activate("fn").badge("active"))
  .build();

export const kindStorage = diagram("kind-storage", { topic: "kind: storage (保存データ)" })
  .lane("l", { x: 0, width: W })
  .node("s", { lane: "l", stack: 0, kind: "storage", title: "users", eyebrow: "保存データ", rows: ["id: PK", "email: text"] })
  .phase("p", { duration: 1500, title: "storage", body: "DB の table。 rows で複数 column 表示。" }, (p: PhaseBuilder) => p.activate("s").badge("active"))
  .build();

export const kindEvent = diagram("kind-event", { topic: "kind: event (イベントログ)" })
  .lane("l", { x: 0, width: W })
  .node("e", { lane: "l", stack: 0, kind: "event", title: "OrderCreated", eyebrow: "イベント", subtitle: "(orderId, userId, total)" })
  .phase("p", { duration: 1500, title: "event", body: "emit された event。 event bus / log が読む。" }, (p: PhaseBuilder) => p.activate("e").badge("active"))
  .build();

export const kindCard = diagram("kind-card", { topic: "kind: card (汎用情報)" })
  .lane("l", { x: 0, width: W })
  .node("c", { lane: "l", stack: 0, kind: "card", title: "備考", eyebrow: "汎用カード", subtitle: "汎用の説明カード" })
  .phase("p", { duration: 1500, title: "card", body: "kind に当てはまらない補足情報。" }, (p: PhaseBuilder) => p.activate("c").badge("active"))
  .build();

/** 2. Lane バリエーション */
export const laneSingle = diagram("lane-single", { topic: "lane: 1 本" })
  .lane("only", { x: 0, width: W })
  .node("a", { lane: "only", stack: 0, kind: "actor", title: "A" })
  .node("b", { lane: "only", stack: 1, kind: "function", title: "B" })
  .phase("p", { duration: 1500, title: "1 lane", body: "1 lane に複数 node を縦 stack。" }, (p: PhaseBuilder) => p.activate("a", "b").badge("OK"))
  .build();

export const laneMulti = diagram("lane-multi", { topic: "lane: 3 本 (横並び)" })
  .lane("l1", { width: 240 })
  .lane("l2", { width: 240 })
  .lane("l3", { width: 240 })
  .node("a", { lane: "l1", stack: 0, kind: "function", title: "A" })
  .node("b", { lane: "l2", stack: 0, kind: "function", title: "B" })
  .node("c", { lane: "l3", stack: 0, kind: "event", title: "C" })
  .phase("p", { duration: 1500, title: "3 lane", body: "lane を横並びで責務分担 (Client / Service / Event)。" }, (p: PhaseBuilder) => p.activate("a", "b", "c").badge("OK"))
  .build();

export const laneContain = diagram("lane-contain", { topic: "lane: contain (枠囲み)" })
  .lane("inner", { x: 0, width: W, contain: true })
  .node("fn", { lane: "inner", stack: 0, kind: "function", title: "internal fn" })
  .node("st", { lane: "inner", stack: 1, kind: "storage", title: "storage" })
  .phase("p", { duration: 1500, title: "contain", body: "lane.contain=true で lane 自体を枠で囲み、 内部を境界明示。" }, (p: PhaseBuilder) => p.activate("fn", "st").badge("OK"))
  .build();

/** 3. Node stack バリエーション */
export const stackPair = diagram("stack-pair", { topic: "stack: 縦 2 段" })
  .lane("l", { x: 0, width: W })
  .node("top", { lane: "l", stack: 0, kind: "actor", title: "上" })
  .node("bot", { lane: "l", stack: 1, kind: "actor", title: "下" })
  .phase("p", { duration: 1500, title: "stack 0/1", body: "同 lane 内で stack で縦並びを制御。" }, (p: PhaseBuilder) => p.activate("top", "bot").badge("OK"))
  .build();

export const stackTriple = diagram("stack-triple", { topic: "stack: 縦 3 段" })
  .lane("l", { x: 0, width: W })
  .node("a", { lane: "l", stack: 0, kind: "actor", title: "stack 0" })
  .node("b", { lane: "l", stack: 1, kind: "function", title: "stack 1" })
  .node("c", { lane: "l", stack: 2, kind: "storage", title: "stack 2" })
  .phase("p", { duration: 1500, title: "stack 0/1/2", body: "stack の数を増やして縦展開、 row_gap で間隔自動。" }, (p: PhaseBuilder) => p.activate("a", "b", "c").badge("OK"))
  .build();

/** 4. Shape-driven basement 8 (CAR-1099) ... 要素形状自体が意味を持つ SVG path node */
export const shapeFile = diagram("shape-file", { topic: "shape: file (ドッグイア rect、 ファイル / document 表現)" })
  .lane("l", { x: 0, width: W })
  .node("f", { lane: "l", stack: 0, kind: "shape-file", title: "report.pdf", eyebrow: "file", subtitle: "PDF 1.2 MB" })
  .phase("p", { duration: 1500, title: "file", body: "右上がドッグイアで折り返された rect。 ファイル / 文書 / レポート等" }, (p: PhaseBuilder) => p.activate("f").badge("shape"))
  .build();

export const shapeFolder = diagram("shape-folder", { topic: "shape: folder (tab 付き rect、 フォルダ / パッケージ)" })
  .lane("l", { x: 0, width: W })
  .node("f", { lane: "l", stack: 0, kind: "shape-folder", title: "src/", eyebrow: "folder", subtitle: "24 files" })
  .phase("p", { duration: 1500, title: "folder", body: "上端に tab のある rect。 ディレクトリ / package / モジュール群等" }, (p: PhaseBuilder) => p.activate("f").badge("shape"))
  .build();

export const shapeCloud = diagram("shape-cloud", { topic: "shape: cloud (5 円 合成、 クラウド / SaaS 表現)" })
  .lane("l", { x: 0, width: W })
  .node("c", { lane: "l", stack: 0, kind: "shape-cloud", title: "AWS", eyebrow: "cloud" })
  .phase("p", { duration: 1500, title: "cloud", body: "5 円 合成の cloud shape。 AWS / GCP / SaaS / 外部 API 等" }, (p: PhaseBuilder) => p.activate("c").badge("shape"))
  .build();

export const shapeCylinder = diagram("shape-cylinder", { topic: "shape: cylinder (円柱、 DB / storage 表現)" })
  .lane("l", { x: 0, width: W })
  .node("c", { lane: "l", stack: 0, kind: "shape-cylinder", title: "PostgreSQL", eyebrow: "database", subtitle: "500 GB SSD" })
  .phase("p", { duration: 1500, title: "cylinder", body: "円柱 (top + side + bottom ellipse)。 DB / 永続 storage / volume 等" }, (p: PhaseBuilder) => p.activate("c").badge("shape"))
  .build();

export const shapeHexagon = diagram("shape-hexagon", { topic: "shape: hexagon (六角形、 component / service)" })
  .lane("l", { x: 0, width: W })
  .node("h", { lane: "l", stack: 0, kind: "shape-hexagon", title: "AuthService", eyebrow: "component" })
  .phase("p", { duration: 1500, title: "hexagon", body: "六角形。 microservice / ドメインコンポーネント / モジュール表現" }, (p: PhaseBuilder) => p.activate("h").badge("shape"))
  .build();

export const shapeDiamond = diagram("shape-diamond", { topic: "shape: diamond (ひし形、 decision / 判定)" })
  .lane("l", { x: 0, width: W })
  .node("d", { lane: "l", stack: 0, kind: "shape-diamond", title: "valid?", eyebrow: "decision" })
  .phase("p", { duration: 1500, title: "diamond", body: "ひし形。 判定分岐 / choice / gateway 表現" }, (p: PhaseBuilder) => p.activate("d").badge("shape"))
  .build();

export const shapeStack = diagram("shape-stack", { topic: "shape: stack (重ね rect、 layer / history)" })
  .lane("l", { x: 0, width: W })
  .node("s", { lane: "l", stack: 0, kind: "shape-stack", title: "v3.2.0", eyebrow: "release" })
  .phase("p", { duration: 1500, title: "stack", body: "重なった 3 段の rect。 バージョン履歴 / layer / snapshot 群等" }, (p: PhaseBuilder) => p.activate("s").badge("shape"))
  .build();

export const shapePerson = diagram("shape-person", { topic: "shape: person (人型 figure、 actor / user 表現)" })
  .lane("l", { x: 0, width: W })
  .node("p", { lane: "l", stack: 0, kind: "shape-person", title: "エンドユーザ", eyebrow: "actor" })
  .phase("p", { duration: 1500, title: "person", body: "人型 figure (円頭 + 台形 body + 腕 curve)。 actor / user / 担当者" }, (p: PhaseBuilder) => p.activate("p").badge("shape"))
  .build();

/** 5. Shape-driven hardware 6 (CAR-1111 Phase 2-C) ... ハードウェア / IoT / エッジ領域の視覚要素 */
export const shapeServerRack = diagram("shape-server-rack", { topic: "shape: server-rack (19 inch rack、 物理サーバ)" })
  .lane("l", { x: 0, width: W })
  .node("s", { lane: "l", stack: 0, kind: "shape-server-rack", title: "web-01", eyebrow: "server", subtitle: "3 U rack mount" })
  .phase("p", { duration: 1500, title: "server-rack", body: "外枠 + 3 段 slot の rack。 物理サーバ / データセンター / on-prem 機器" }, (p: PhaseBuilder) => p.activate("s").badge("shape"))
  .build();

export const shapeNetworkNode = diagram("shape-network-node", { topic: "shape: network-node (network hub、 router / switch)" })
  .lane("l", { x: 0, width: W })
  .node("n", { lane: "l", stack: 0, kind: "shape-network-node", title: "core-router", eyebrow: "network", subtitle: "L3 gateway" })
  .phase("p", { duration: 1500, title: "network-node", body: "中央 circle + 4 方向 line。 router / switch / hub / L3 gateway 等" }, (p: PhaseBuilder) => p.activate("n").badge("shape"))
  .build();

export const shapeMobileDevice = diagram("shape-mobile-device", { topic: "shape: mobile-device (スマホ、 モバイル端末)" })
  .lane("l", { x: 0, width: W })
  .node("m", { lane: "l", stack: 0, kind: "shape-mobile-device", title: "iPhone", eyebrow: "mobile", subtitle: "iOS client" })
  .phase("p", { duration: 1500, title: "mobile-device", body: "speaker + screen + home button のスマホ。 mobile app / client 端末" }, (p: PhaseBuilder) => p.activate("m").badge("shape"))
  .build();

export const shapeIotSensor = diagram("shape-iot-sensor", { topic: "shape: iot-sensor (IoT beacon、 電波発信)" })
  .lane("l", { x: 0, width: W })
  .node("s", { lane: "l", stack: 0, kind: "shape-iot-sensor", title: "温度センサー", eyebrow: "iot", subtitle: "BLE beacon" })
  .phase("p", { duration: 1500, title: "iot-sensor", body: "sensor 円 + 3 波紋 arc。 IoT beacon / センサー / ZigBee / LoRa 端末" }, (p: PhaseBuilder) => p.activate("s").badge("shape"))
  .build();

export const shapeRobotArm = diagram("shape-robot-arm", { topic: "shape: robot-arm (ロボアーム、 産業機器)" })
  .lane("l", { x: 0, width: W })
  .node("r", { lane: "l", stack: 0, kind: "shape-robot-arm", title: "組立ライン", eyebrow: "robot", subtitle: "6-axis arm" })
  .phase("p", { duration: 1500, title: "robot-arm", body: "base + 2 関節 + gripper のロボアーム。 産業機器 / 自動化 / 制御対象" }, (p: PhaseBuilder) => p.activate("r").badge("shape"))
  .build();

export const shapeSatellite = diagram("shape-satellite", { topic: "shape: satellite (人工衛星、 エッジ通信)" })
  .lane("l", { x: 0, width: W })
  .node("s", { lane: "l", stack: 0, kind: "shape-satellite", title: "Starlink", eyebrow: "satellite", subtitle: "LEO 通信衛星" })
  .phase("p", { duration: 1500, title: "satellite", body: "中央 body + 左右 solar panel + アンテナ。 人工衛星 / 宇宙 / エッジ通信" }, (p: PhaseBuilder) => p.activate("s").badge("shape"))
  .build();
