/**
 * 動く見本 (`interactive.cdl.ts`) の区分 (#2318)。
 *
 * 同じ区分の一覧を 2 つの検査が別々に持っており、`pathProgressDemo` の 1 件だけ食い違って
 * いた (`catalog-box-binding.test.ts` は段が動かす側、`catalog-scenario-form.test.ts` は
 * 入力欄が握る側に置いていた)。 片方だけ直した日に 2 つの検査が違う答えを出すので、
 * 一覧はここが持ち、読む側は名前で引く。
 *
 * ## 区分は導出ではなく宣言
 *
 * 図から導く規則を 2 通り試して実測した (#2318 の comment)。 `段が動かす見本` は
 * 導出 78 件に対し宣言 72 件、`入力欄が握る見本` は導出 30 件に対し宣言 16 件で、
 * 導出の外に在る宣言も 2 件あった。 この 2 つは **その Issue が足した分の一覧** で、
 * 「条件に当てはまる図すべて」 ではない。 導出に置き換えると検査の対象が変わる。
 *
 * 一方 `表示部品を持たない見本` は図から導ける (`readouts` が空)。 そちらは
 * `catalog-phase-progress.test.ts` が導出と宣言を両方向で突き合わせる。
 */

/**
 * 段で表示部品を動かす見本 (#1032 / #1033 の対象)。
 *
 * 表示部品が見る状態を入力欄も計算式も持たないため、段の `tween` / `set` がそのまま表示に届く。
 */
export const 段が動かす見本 = [
  "arraySignalHistogram", "arrayLineChart", "arrayStackedBar", "arrayWaterfall",
  "eip1559GasFlow", "interactiveOauthFlow", "portfolioDonut", "abTestResult",
  "canvasMiniMap",
  // #1032 の 1 本目 (表示部品の見本、いずれも入力欄も計算式も持たない)
  "matrixHeatmap", "taskProgressGroup", "skillRadar", "perfBubbleChart",
  "contributionHeatmap", "priceCandlestick", "userVenn", "scoreSlope",
  "salesFunnel", "projectGantt", "resourceTreemap", "trafficSankey",
  "activityPolar",
  // #1032 の 2 本目
  "playerLeaderboard", "techTagCloud", "teamActivityFeed", "supportChat",
  "sprintChecklist",
  // #1032 の 3 本目 (いずれも表示部品が見る配列を入力欄も計算式も持たない)
  "postReactions", "techPills", "dashboardMetricsGrid", "kpiIconTile",
  "cryptoWallet", "worldMapPins", "tournamentPodium", "featurePoll",
  "reviewerStack", "gitCommitList", "serverEventLog", "searchResults",
  "yearRoadmap", "weekWeather",
  // #1032 の 4 本目
  "tutorialVideoCards", "teamAttendanceGrid", "globalTimezoneClock", "signupFormSummary",
  "monthCalendarView", "cliTerminalSession", "chessStartingBoard", "sprintKanbanBoard",
  "docsBreadcrumb", "dayScheduleTimeline", "serverUptimeStatus", "weekCalendarView",
  "teamKpiComparison", "publishWorkflowSteps",
  // #1032 の 5 本目 (残り 17 件、 これで 84 件が完了)
  "teamPresenceStatus", "feedbackThumbRating", "startupOrgChart", "npsTrendKpi",
  "postReactionPoll", "voiceMessagePlayback", "teamThreadSummary", "loginOtpVerify",
  "prodLogTail", "opsAlertBanner", "serviceHealthGrid", "checkoutCartSummary",
  "saasPricingTier", "checkoutCouponApply", "blogArticlePreview", "docsTocNav",
  "socialShareButtons",
] as const;

/**
 * 表示部品が見る状態を **入力欄または計算式** が握っている見本。
 *
 * `interactive-panel.tsx` は signals (入力欄) と computeds (計算式) を `stateOverrides` として返し、
 * `render.tsx` がそれを段の値に重ねる。 どちらが持つ状態も段で動かしても効かない。
 * これらは #1034 と同じ基準 (段ごとに注目する箱が変わる) を使う。
 */
export const 入力欄が握る見本 = [
  "visualBindBar", "visualBindOpacity", "xypadNavigate", "stepperControl",
  "numberSparkline", "radioSelect", "colorPickerTheme", "dynamicReadouts",
  "timelineDrive", "readoutVariety", "gridLayoutMatrix", "pathProgressDemo",
  "kpiDashboard", "revenueKpiCard", "kpiBullet", "buildStatusTrafficLight",
] as const;

/**
 * 束ねの検査だけを当てる見本 (#2318)。
 *
 * `pathProgressDemo` は入力欄 1 件と計算式 1 件を持ち、段で動かす状態を 1 つも持たない =
 * 区分としては `入力欄が握る見本`。 それでも束ね (`{...}`) の解決は段と無関係に効くので、
 * `catalog-box-binding.test.ts` の束ねの検査だけは当てる。
 *
 * 段ごとに表示が変わることを見る検査は、入力欄が握る状態を飛ばすので当たらない
 * (飛ばした結果は同 file が母数として出す)。
 */
export const 束ねだけ見る見本 = ["pathProgressDemo"] as const;

/**
 * 表示部品を持たない見本を図から導く (#2318)。
 *
 * この区分だけは図から読める (`readouts` が空)。 読む側は導いた一覧と宣言した一覧を
 * **両方向で** 突き合わせる = 以前は宣言に在る名前が実在することしか見ておらず、
 * 実在するのに宣言に無い 4 件が 6 つの検査の外に居た。
 *
 * 導出だけにしない。 宣言が在ることで、見本を足した時に人が区分を見る機会が残る。
 */
export function 表示部品を持たない見本(mod: Record<string, unknown>): string[] {
  const 図か = (v: unknown): v is { readouts?: unknown[]; nodes?: unknown[]; lanes?: unknown[] } =>
    typeof v === "object" &&
    v !== null &&
    Array.isArray((v as { nodes?: unknown }).nodes) &&
    Array.isArray((v as { lanes?: unknown }).lanes);
  return Object.entries(mod)
    .filter(([, v]) => 図か(v) && (v.readouts ?? []).length === 0)
    .map(([k]) => k)
    .sort();
}
