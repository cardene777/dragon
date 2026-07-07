/**
 * i18n = catalog item name / topic の日本語表示 mapping SSOT。
 * DSL 側 (src/topics/catalog/*.cdl.ts) は英語 identifier 保持 (SSOT 汚さない)、
 * UI 表示層で以下 dictionary を経由して日本語 label 化する。
 *
 * useLocale hook で ja / en 切替可能、 default = ja。
 */

export type Locale = "ja" | "en";

/** catalog item title (英語 export name) → 日本語表示名 */
export const ITEM_NAME_JA: Record<string, string> = {
  // presets
  presetSwimlane: "スイムレーン",
  presetFlow: "フロー",
  presetSequence: "シーケンス",
  presetTopology: "トポロジー",
  presetEr: "ER 図",
  presetStateMachine: "ステート図",
  presetInfrastructure: "インフラ構成",
  presetClassDiagram: "クラス図",
  presetTree: "ツリー",
  presetUserJourney: "ユーザージャーニー",
  presetMindMap: "マインドマップ",
  presetMindMapRadial: "放射状マインドマップ",
  presetFunnel: "ファネル",
  presetQuadrant: "四象限マトリクス",
  presetChartPie: "円グラフ",
  presetChartLine: "折れ線グラフ",
  presetGantt: "ガントチャート",
  presetFlowchart: "フローチャート",
  presetNetwork: "ネットワーク図",
  presetStateMachine2: "ステート図 (拡張)",

  // patterns
  patternDirect: "直結",
  patternPassthrough: "貫通 (プロキシ)",
  patternCallReadWrite: "呼出 → 読取 → 書込",
  patternValidateProcess: "検証 → 処理",
  patternBranch: "分岐",
  patternLoop: "ループ",
  patternRollback: "ロールバック",
  patternFanOut: "ファンアウト (並列分配)",
  patternFanIn: "ファンイン (集約)",
  patternSchedule: "スケジューリング",
  patternHook: "フック",
  patternEmit: "イベント発火",

  // cookbook
  apiCall: "API 呼び出し",
  jwtAuth: "JWT 認証",
  oauthFlow: "OAuth フロー",
  crudCreate: "CRUD 作成",
  crudUpdate: "CRUD 更新",
  crudDelete: "CRUD 削除",
  crudRead: "CRUD 読取",
  cacheRead: "キャッシュ読取",
  cacheInvalidate: "キャッシュ無効化",
  rateLimit: "レート制限",
  csrfToken: "CSRF トークン",
  fileUpload: "ファイルアップロード",
  imageResize: "画像リサイズ",
  emailSend: "メール送信",
  pushNotification: "プッシュ通知",
  websocket: "WebSocket 双方向通信",
  webhook: "Webhook 受信",
  backgroundJob: "バックグラウンドジョブ",
  scheduledTask: "定期タスク",
  retryBackoff: "リトライ (指数バックオフ)",
  circuitBreaker: "サーキットブレーカー",
  paymentCharge: "決済",
  auditLog: "監査ログ",
  auditLogQuery: "監査ログ検索",
  sortFilter: "ソート・絞込",

  // text-dsl
  textDslSequence: "シーケンス (DSL)",
  textDslFlow: "フロー (DSL)",
  textDslSwimlane: "スイムレーン (DSL)",
  textDslStateMachine: "ステート図 (DSL)",
  textDslTopology: "トポロジー (DSL)",
  textDslEr: "ER 図 (DSL)",
  textDslGantt: "ガント (DSL)",
  textDslClass: "クラス (DSL)",
  textDslPie: "円グラフ (DSL)",
  textDslC4: "C4 (DSL)",
  textDslMind: "マインドマップ (DSL)",
  textDslCode: "コード (DSL)",

  // shape-driven basement 8 (CAR-1099)
  shapeFile: "ファイル (ドッグイア)",
  shapeFolder: "フォルダ (tab 付き)",
  shapeCloud: "クラウド (5 円合成)",
  shapeCylinder: "円柱 DB",
  shapeHexagon: "六角形 (component)",
  shapeDiamond: "ひし形 (判定)",
  shapeStack: "重ね rect (履歴/layer)",
  shapePerson: "人型 (actor)",

  // primitives
  kindActor: "actor (外部主体)",
  kindFunction: "function (関数呼び出し)",
  kindStorage: "storage (保存データ)",
  kindEvent: "event (イベント発火)",
  kindCard: "card (汎用カード)",

  // animation
  tweenSimple: "tween (数値線形補間)",
  setSwitch: "set (即時切替)",
  badgePerPhase: "badge (フェーズごと切替)",
  mixedTweenSet: "tween + set 併用",
  tweenChain: "tween 連鎖",

  // styles
  styleSolid: "solid スタイル (実線 + 矢頭)",
  styleDottedFlow: "dotted-flow スタイル (点線 + 粒子)",
  toneAccent: "accent トーン (主張色)",
  toneTeal: "teal トーン (青緑)",
  toneSuccess: "success トーン (緑)",
  toneError: "error トーン (赤)",
  toneWarning: "warning トーン (橙)",
  toneInfo: "info トーン (水色)",
  stateActive: "active 状態",
  stateInactive: "inactive 状態",
};

/**
 * catalog item の日本語表示名を返す。 未登録は英語 export name をそのまま返す (fallback)。
 */
export function itemNameJa(exportName: string): string {
  return ITEM_NAME_JA[exportName] ?? exportName;
}
