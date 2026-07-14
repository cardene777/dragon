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
  // oauthFlow: 実例に redesign 済 (iter 8 wave 8-B、 下記 v2 mapping 参照)
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

  // interactive (4 generic examples、 domain-neutral、 CAR #231)
  inputSliderBar: "スライダー → バー幅",
  formulaTextBind: "計算式 → テキスト",
  scrollNarrative: "スクロール駆動",
  clickToggle: "クリック切替",
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

  // shape-driven software 6 (CAR-1111 Phase 2-B)
  shapeWindow: "ウィンドウ (GUI アプリ)",
  shapeTerminal: "端末 (CLI shell)",
  shapeCodeBlock: "コード block (snippet)",
  shapeKanbanCard: "kanban ticket",
  shapeMessageBubble: "吹き出し (message)",
  shapeGear: "歯車 (config / process engine)",

  // shape-driven hardware 6 (CAR-1111 Phase 2-C)
  shapeServerRack: "サーバラック (19 inch)",
  shapeNetworkNode: "network hub (router)",
  shapeMobileDevice: "スマホ (mobile)",
  shapeIotSensor: "IoT センサー",
  shapeRobotArm: "ロボアーム (産業機器)",
  shapeSatellite: "人工衛星 (satellite)",

  // shape-driven blockchain / web3 6 (CAR-1111 Phase 2-D)
  shapeSmartContract: "スマートコントラクト",
  shapeBlockchainBlock: "ブロックチェーン block",
  shapeRpcNode: "RPC ノード",
  shapeWallet: "ウォレット",
  shapeNft: "NFT",
  shapeToken: "トークン (硬貨)",

  // shape-driven finance 6 (CAR-1111 Phase 2-D)
  shapeBank: "銀行",
  shapeTrustBank: "信託銀行",
  shapePaymentProvider: "決済業者 (POS)",
  shapeBrokerage: "証券会社",
  shapeExchange: "取引所",
  shapeAtm: "ATM",

  // shape-driven commerce / web 6 (CAR-1111 Phase 2-D)
  shapeWebsite: "Web サイト",
  shapeStorefront: "実店舗",
  shapeWarehouse: "倉庫",
  shapeOnlineShop: "オンラインショップ",
  shapeCdnEdge: "CDN エッジ",
  shapeApiGateway: "API ゲートウェイ",

  // shape-driven people 6 (CAR-1111 Phase 2-D)
  shapeAuditor: "監査人",
  shapeRegulator: "規制当局",
  shapeNotary: "公証人",
  shapeLawyer: "弁護士",
  shapeTrader: "トレーダー",
  shapeCustomerService: "カスタマーサポート",

  // shape-driven blockchain 4 追加 + credit-card 分離 (CAR-1111 Phase 2-D 追加分)
  shapeBlockchain: "ブロックチェーン (汎用)",
  shapeBitcoinChain: "Bitcoin ブロックチェーン",
  shapeEthereumChain: "Ethereum ブロックチェーン",
  shapeBlockchainNode: "ブロックチェーンノード",
  shapeCreditCard: "クレジットカード",

  // scenes (実シーン 30 例)
  sceneCryptoTransfer: "crypto 送金 (wallet → exchange → chain)",
  sceneLegalNotarization: "法務 (弁護士 → 公証人 → 登記)",
  sceneBankingFlow: "銀行送金 (ATM → 銀行 → EC)",
  sceneIotOnchain: "IoT オンチェーン (sensor → RPC → contract)",
  sceneAuditFlow: "監査 (auditor → 帳簿 → regulator)",
  sceneStockTrading: "証券取引 (trader → 証券会社 → 取引所)",
  sceneSupportFlow: "問い合わせ (CS → ticket → 開発)",
  scenePaymentSettlement: "決済 (provider → クレカ → 銀行)",
  sceneWebInfra: "web infra (website → CDN → server)",
  sceneNftMint: "NFT mint (wallet → contract → NFT)",
  sceneTokenBridge: "token bridge (chain A → bridge → chain B)",
  sceneDefiLending: "DeFi lending (wallet → contract → token)",
  sceneBitcoinTx: "bitcoin tx (wallet → BTC chain → node)",
  sceneEcOrder: "EC 注文 (customer → shop → warehouse)",
  sceneMobileApi: "mobile app (mobile → API gateway → server)",
  sceneFactoryLine: "工場ライン (robot → sensor → DB)",
  sceneSatelliteChain: "satellite (satellite → RPC → chain)",
  sceneDevOps: "DevOps (code → CI → cloud)",
  sceneTaskFlow: "task flow (kanban → terminal → file)",
  sceneNotification: "通知 (message → service → app)",
  sceneTrustAsset: "信託資産 (trader → trust bank → 帳簿)",
  sceneConsensus: "consensus (node → block → chain)",
  sceneTokenDeploy: "token deploy (dev → contract → token)",
  sceneCompliance: "規制対応 (regulator → 帳簿 → bank)",
  sceneNftMarketplace: "NFT 売買 (buyer → marketplace → NFT)",
  sceneNetworkPath: "network (router → hub → server)",
  sceneCheckout: "checkout (site → provider → card)",
  sceneEdgeCompute: "edge compute (mobile → CDN → cloud)",
  sceneVersionDeploy: "version deploy (stack → gear → site)",
  sceneAuditChain: "audit chain (auditor → file → regulator)",

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

  // interactive iteration 7 (15 catalog、 混合 5 テーマ)
  // wave 1 messaging
  voiceMessagePlayback: "音声メッセージ再生 (波形 + 進捗)",
  teamThreadSummary: "チームスレッド概要 (未読 + 参加者)",
  dmReadReceipt: "DM 既読状態 (送信 → 配信 → 既読)",
  // wave 2 form
  formPasswordCheck: "パスワード強度チェック (5 段階)",
  loginOtpVerify: "OTP ログイン検証 (6 桁入力)",
  profileAvatarUpload: "プロフィール画像アップロード",
  // wave 3 monitoring
  prodLogTail: "本番ログ tail (レベル別)",
  opsAlertBanner: "運用アラートバナー (重要度切替)",
  serviceHealthGrid: "サービス健全性グリッド",
  // wave 4 ecommerce
  checkoutCartSummary: "カート集計 (小計 + 送料 + 合計)",
  saasPricingTier: "SaaS 料金プラン比較",
  checkoutCouponApply: "クーポン適用フロー",
  // wave 5 editorial
  blogArticlePreview: "ブログ記事プレビュー",
  docsTocNav: "ドキュメント TOC ナビ",
  socialShareButtons: "SNS シェアボタン",

  // iteration 7 catalog redesign § PR-B exemplar (実シナリオ + readout 連動 + 動き付与、 pattern SSOT)
  exemplarPaymentFlow: "実例: 決済フロー (受付 → 決済 → 完了)",
  exemplarLoginFlow: "実例: ログイン認証 (要求 → 検証 → セッション発行)",
  exemplarNotificationFlow: "実例: push 通知配信 (event → 配信 → リトライ)",

  // iteration 8 wave 8-A redesign (fintech / crypto 実シナリオ、 exemplar v2 pattern 適用)
  eip1559GasFlow: "実例: Ethereum EIP-1559 gas 動的計算 (署名 → mempool → 採掘 → 確定)",
  portfolioDonut: "実例: 四半期 portfolio リバランス (現状 → 判定 → 執行 → 反映)",
  cryptoWallet: "実例: DeFi wallet 日次モニター (確認 → 市場更新 → 詳細 → 集計)",
  revenueKpiCard: "実例: SaaS 月次 revenue クロージング (前月 → 当月 → 前年比 → 判断)",
  priceCandlestick: "実例: 個人投資家 日次 trading (寄付 → 上昇 → 押し目 → 引け)",
  productPriceTag: "実例: EC ブラックフライデー ダイナミック プライシング (通常 → セール → 深化 → 在庫連動)",
  oauthFlow: "実例: Google Sign-In (OAuth 2.0 + PKCE) (click → consent → code → token → API)",
  kpiDashboard: "実例: 週次 CEO KPI レビュー (表示 → 因果分析 → 目標対比 → 判断)",
  decisionTree: "実例: 医療 triage 臨床決定木 (受付 → 一次 → 二次 → 転帰)",
  perfBubbleChart: "実例: production infra 週次 capacity planning (取得 → 分析 → 判定 → 最適化)",
  abTestResult: "実例: EC checkout A/B test 4 週実験 (開始 → split → 集計 → 有意判定)",
  skillRadar: "実例: エンジニア半年 skill 成長 review (初回 → 学習 → 中間 → 成長確認)",
  projectGantt: "実例: モバイル新機能 10 日 sprint (Design → Impl → Test → Ship)",
  sprintKanbanBoard: "実例: 2 週 sprint daily stand-up (start → 3 日目 → 7 日目 → 完了)",
  userAvatar: "実例: SNS 新規 onboarding avatar (作成 → デフォルト → upload → 反映)",
  teamAttendanceGrid: "実例: リモートチーム週次出勤 (月曜 → 中間 → 週末 → 給与連携)",
  teamKpiComparison: "実例: 2 チーム四半期 velocity 対決 (期首 → 月次 → 中間 → 最終)",
  postReactions: "実例: X バズ投稿 24h reaction 時系列 (投稿 → 初動 → バズ → 落ち着き)",
  techPills: "実例: CTO 技術選定 (要件 → 候補 → PoC → 確定)",
  reviewerStack: "実例: 大規模 PR code review (PR open → 依頼 → review → merge)",
  alertNotification: "実例: 本番 deploy 障害検知 escalation (開始 → 警告 → 障害 → 復旧)",
  commitDiffCounter: "実例: PR diff サイズ推移 (初期 → 拡張 → refactor → 最終)",
  featurePoll: "実例: SaaS 機能要望投票 (開始 → 拡散 → 中間 → 最終)",
  buildStatusTrafficLight: "実例: CI build 進行 (commit → 実行 → 失敗 → 修正 pass)",
  deploySpinner: "実例: 金曜夜 production deploy (build → canary → 全体 → 完了)",
  serverEventLog: "実例: 朝ピーク incident 検知 (通常 → CPU 上昇 → DB error → 復旧)",
  weekWeather: "実例: 屋外イベント週次天気モニター (予測 → 悪化 → 中止 → 再開)",
  shippingOrderStatus: "実例: EC 家具配送追跡 (梱包 → 出荷 → 配達中 → 完了)",
  monthCalendarView: "実例: PM 月次スケジューリング Q1 launch 前月 (計画 → 中間 → 週次 → 振返り)",
  resourceTreemap: "実例: CFO 年間予算配分レビュー (期初 → Q1 → 中期 → 期末)",
  trafficSankey: "実例: D2C EC marketing 施策 (開始 → 集客 → CVR → ROI)",
  mlConfidenceMeter: "実例: 医療画像診断 AI (撮影 → 推論 → 医師確認 → 診断確定)",
  gitCommitList: "実例: OSS 週次リリース commit review (発生 → 集約 → review → tag)",
  audioPlayer: "実例: ポッドキャスト通勤聴取 (再生 → CM → skip → 完聴)",
  cliTerminalSession: "実例: 開発者朝 CLI ritual (repo → git → test → docker)",

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
