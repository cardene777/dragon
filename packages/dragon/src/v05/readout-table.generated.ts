// このファイルは自動生成です。 手で編集しないでください。
//
// 出どころ = 描画側 (`@cardenelabs/cdl`) の型定義 `CdlReadout`。
// 作り直す = `node packages/dragon/scripts/gen-readout-table.mjs`
// ずれの検知 = `packages/dragon/test/readout-table-generated.test.ts`

import type { 図形の定義 } from "./parser-types";

/** 記法が受ける部品と、その欄 (`CdlReadout` の全種を覆う) */
export const 部品の表: Record<string, 図形の定義> = {
  "activity-feed": {
    必須: ["source"],
    欄: {
      source: "文字列",
      max: "数",
      color: "文字列",
      label: "文字列",
    },
  },
  "alert-banner": {
    必須: ["source"],
    欄: {
      source: "文字列",
      label: "文字列",
    },
  },
  "array-bar": {
    必須: ["source", "min", "max"],
    欄: {
      source: "文字列",
      min: "数",
      max: "数",
      color: "文字列",
      label: "文字列",
    },
  },
  "array-list": {
    必須: ["source"],
    欄: {
      source: "文字列",
      itemTemplate: "文字列",
      max: "数",
      label: "文字列",
    },
  },
  "article-preview": {
    必須: ["source"],
    欄: {
      source: "文字列",
      colorAccent: "文字列",
      label: "文字列",
    },
  },
  "attendance-grid": {
    必須: ["source", "membersSource"],
    欄: {
      source: "文字列",
      membersSource: "文字列",
      color: "文字列",
      label: "文字列",
    },
  },
  avatar: {
    必須: ["source"],
    欄: {
      source: "文字列",
      size: "数",
      color: "文字列",
      label: "文字列",
    },
  },
  badge: {
    必須: ["source"],
    欄: {
      source: "文字列",
      colorSource: "文字列",
      map: "組の並び",
      label: "文字列",
    },
  },
  bar: {
    必須: ["source", "min", "max"],
    欄: {
      source: "文字列",
      min: "数",
      max: "数",
      color: "文字列",
      label: "文字列",
    },
  },
  breadcrumb: {
    必須: ["source"],
    欄: {
      source: "文字列",
      currentSource: "文字列",
      color: "文字列",
      label: "文字列",
    },
  },
  "bubble-chart": {
    必須: ["source", "xMin", "xMax", "yMin", "yMax", "rMin", "rMax"],
    欄: {
      source: "文字列",
      xMin: "数",
      xMax: "数",
      yMin: "数",
      yMax: "数",
      rMin: "数",
      rMax: "数",
      viewW: "数",
      viewH: "数",
      color: "文字列",
      label: "文字列",
    },
  },
  "bullet-chart": {
    必須: ["source", "targetSource", "max"],
    欄: {
      source: "文字列",
      targetSource: "文字列",
      max: "数",
      rangeBad: "数",
      rangeAvg: "数",
      viewW: "数",
      viewH: "数",
      colorActual: "文字列",
      label: "文字列",
    },
  },
  "calendar-heatmap": {
    必須: ["source", "max"],
    欄: {
      source: "文字列",
      max: "数",
      cellSize: "数",
      cellGap: "数",
      colors: "文字列の並び",
      label: "文字列",
    },
  },
  "calendar-month": {
    必須: ["source"],
    欄: {
      source: "文字列",
      monthName: "文字列",
      color: "文字列",
      label: "文字列",
    },
  },
  "calendar-week": {
    必須: ["source"],
    欄: {
      source: "文字列",
      cellSize: "数",
      color: "文字列",
      label: "文字列",
    },
  },
  candlestick: {
    必須: ["source", "min", "max"],
    欄: {
      source: "文字列",
      min: "数",
      max: "数",
      viewW: "数",
      viewH: "数",
      colorUp: "文字列",
      colorDown: "文字列",
      label: "文字列",
    },
  },
  "cart-summary": {
    必須: ["source"],
    欄: {
      source: "文字列",
      currency: "文字列",
      colorTotal: "文字列",
      label: "文字列",
    },
  },
  "chat-bubble": {
    必須: ["source"],
    欄: {
      source: "文字列",
      max: "数",
      colorSelf: "文字列",
      colorOther: "文字列",
      label: "文字列",
    },
  },
  checklist: {
    必須: ["source"],
    欄: {
      source: "文字列",
      color: "文字列",
      label: "文字列",
    },
  },
  "chess-board": {
    必須: ["source"],
    欄: {
      source: "文字列",
      cellSize: "数",
      label: "文字列",
    },
  },
  "circular-gauge": {
    必須: ["source", "min", "max"],
    欄: {
      source: "文字列",
      min: "数",
      max: "数",
      viewW: "数",
      viewH: "数",
      color: "文字列",
      unit: "文字列",
      label: "文字列",
    },
  },
  "commit-list": {
    必須: ["source"],
    欄: {
      source: "文字列",
      max: "数",
      color: "文字列",
      label: "文字列",
    },
  },
  "confidence-meter": {
    必須: ["source"],
    欄: {
      source: "文字列",
      lowThreshold: "数",
      highThreshold: "数",
      viewW: "数",
      viewH: "数",
      label: "文字列",
    },
  },
  countup: {
    必須: ["source"],
    欄: {
      source: "文字列",
      durationMs: "数",
      decimals: "数",
      unit: "文字列",
      label: "文字列",
    },
  },
  "coupon-code": {
    必須: ["source"],
    欄: {
      source: "文字列",
      colorApplied: "文字列",
      label: "文字列",
    },
  },
  delta: {
    必須: ["source"],
    欄: {
      source: "文字列",
      decimals: "数",
      unit: "文字列",
      label: "文字列",
    },
  },
  "diff-counter": {
    必須: ["additionsSource", "deletionsSource"],
    欄: {
      additionsSource: "文字列",
      deletionsSource: "文字列",
      colorAdd: "文字列",
      colorDel: "文字列",
      label: "文字列",
    },
  },
  donut: {
    必須: ["source"],
    欄: {
      source: "文字列",
      viewW: "数",
      viewH: "数",
      colors: "文字列の並び",
      innerRatio: "数",
      label: "文字列",
    },
  },
  "event-log": {
    必須: ["source"],
    欄: {
      source: "文字列",
      max: "数",
      label: "文字列",
    },
  },
  "file-dropzone": {
    必須: ["source"],
    欄: {
      source: "文字列",
      colorActive: "文字列",
      label: "文字列",
    },
  },
  "form-summary": {
    必須: ["source"],
    欄: {
      source: "文字列",
      color: "文字列",
      label: "文字列",
    },
  },
  "fuel-bar": {
    必須: ["source"],
    欄: {
      source: "文字列",
      segments: "数",
      lowThreshold: "数",
      highThreshold: "数",
      viewW: "数",
      viewH: "数",
      label: "文字列",
    },
  },
  funnel: {
    必須: ["source"],
    欄: {
      source: "文字列",
      viewW: "数",
      viewH: "数",
      colorTop: "文字列",
      colorBottom: "文字列",
      label: "文字列",
    },
  },
  gantt: {
    必須: ["source", "min", "max"],
    欄: {
      source: "文字列",
      min: "数",
      max: "数",
      viewW: "数",
      viewH: "数",
      color: "文字列",
      label: "文字列",
    },
  },
  gauge: {
    必須: ["source", "min", "max"],
    欄: {
      source: "文字列",
      min: "数",
      max: "数",
      color: "文字列",
      label: "文字列",
    },
  },
  grade: {
    必須: ["source"],
    欄: {
      source: "文字列",
      max: "数",
      label: "文字列",
    },
  },
  "heat-cell": {
    必須: ["source", "min", "max"],
    欄: {
      source: "文字列",
      min: "数",
      max: "数",
      colors: "文字列の並び",
      label: "文字列",
    },
  },
  "icon-tile": {
    必須: ["source"],
    欄: {
      source: "文字列",
      color: "文字列",
      label: "文字列",
    },
  },
  "kanban-board": {
    必須: ["source"],
    欄: {
      source: "文字列",
      columnWidth: "数",
      max: "数",
      label: "文字列",
    },
  },
  "kpi-card": {
    必須: ["source", "historySource", "comparisonSource"],
    欄: {
      source: "文字列",
      historySource: "文字列",
      comparisonSource: "文字列",
      unit: "文字列",
      colorPos: "文字列",
      colorNeg: "文字列",
      label: "文字列",
    },
  },
  "kpi-comparison": {
    必須: ["source"],
    欄: {
      source: "文字列",
      max: "数",
      colorA: "文字列",
      colorB: "文字列",
      label: "文字列",
    },
  },
  "kpi-trend-tile": {
    必須: ["source", "prevSource", "historySource"],
    欄: {
      source: "文字列",
      prevSource: "文字列",
      historySource: "文字列",
      unit: "文字列",
      colorPos: "文字列",
      colorNeg: "文字列",
      label: "文字列",
    },
  },
  leaderboard: {
    必須: ["source"],
    欄: {
      source: "文字列",
      max: "数",
      color: "文字列",
      label: "文字列",
    },
  },
  "line-chart": {
    必須: ["source", "min", "max"],
    欄: {
      source: "文字列",
      min: "数",
      max: "数",
      viewW: "数",
      viewH: "数",
      color: "文字列",
      fill: "真偽",
      label: "文字列",
    },
  },
  "log-stream": {
    必須: ["source"],
    欄: {
      source: "文字列",
      label: "文字列",
    },
  },
  "map-pin": {
    必須: ["source", "xMin", "xMax", "yMin", "yMax"],
    欄: {
      source: "文字列",
      xMin: "数",
      xMax: "数",
      yMin: "数",
      yMax: "数",
      viewW: "数",
      viewH: "数",
      color: "文字列",
      label: "文字列",
    },
  },
  matrix: {
    必須: ["source", "min", "max"],
    欄: {
      source: "文字列",
      min: "数",
      max: "数",
      cellSize: "数",
      colors: "文字列の並び",
      showValue: "真偽",
      label: "文字列",
    },
  },
  "media-player": {
    必須: ["source", "durationSource", "playingSource"],
    欄: {
      source: "文字列",
      durationSource: "文字列",
      playingSource: "文字列",
      color: "文字列",
      viewW: "数",
      label: "文字列",
    },
  },
  "metrics-grid": {
    必須: ["source"],
    欄: {
      source: "文字列",
      color: "文字列",
      label: "文字列",
    },
  },
  "mini-map": {
    必須: ["source", "canvasW", "canvasH"],
    欄: {
      source: "文字列",
      canvasW: "数",
      canvasH: "数",
      viewW: "数",
      viewH: "数",
      color: "文字列",
      label: "文字列",
    },
  },
  notification: {
    必須: ["kindSource", "titleSource"],
    欄: {
      kindSource: "文字列",
      titleSource: "文字列",
      bodySource: "文字列",
      label: "文字列",
    },
  },
  "number-board": {
    必須: ["source"],
    欄: {
      source: "文字列",
      prefix: "文字列",
      suffix: "文字列",
      size: "数",
      color: "文字列",
      caption: "文字列",
      label: "文字列",
    },
  },
  "order-status": {
    必須: ["source", "stepsSource"],
    欄: {
      source: "文字列",
      stepsSource: "文字列",
      color: "文字列",
      label: "文字列",
    },
  },
  "org-chart-mini": {
    必須: ["source"],
    欄: {
      source: "文字列",
      color: "文字列",
      label: "文字列",
    },
  },
  "otp-input": {
    必須: ["source"],
    欄: {
      source: "文字列",
      colorFocus: "文字列",
      label: "文字列",
    },
  },
  "password-strength": {
    必須: ["source"],
    欄: {
      source: "文字列",
      colorStrong: "文字列",
      colorWeak: "文字列",
      label: "文字列",
    },
  },
  "path-progress": {
    必須: ["source", "pathD"],
    欄: {
      source: "文字列",
      pathD: "文字列",
      viewW: "数",
      viewH: "数",
      strokeWidth: "数",
      color: "文字列",
      max: "数",
      label: "文字列",
    },
  },
  "percent-ring": {
    必須: ["source", "max"],
    欄: {
      source: "文字列",
      max: "数",
      color: "文字列",
      label: "文字列",
    },
  },
  "pill-group": {
    必須: ["source"],
    欄: {
      source: "文字列",
      color: "文字列",
      label: "文字列",
    },
  },
  podium: {
    必須: ["source"],
    欄: {
      source: "文字列",
      viewW: "数",
      viewH: "数",
      label: "文字列",
    },
  },
  "polar-area": {
    必須: ["source", "max"],
    欄: {
      source: "文字列",
      max: "数",
      viewW: "数",
      viewH: "数",
      colors: "文字列の並び",
      labelSource: "文字列",
      label: "文字列",
    },
  },
  "poll-bar": {
    必須: ["source"],
    欄: {
      source: "文字列",
      color: "文字列",
      colorWinner: "文字列",
      label: "文字列",
    },
  },
  "price-tag": {
    必須: ["oldSource", "newSource"],
    欄: {
      oldSource: "文字列",
      newSource: "文字列",
      currency: "文字列",
      colorNew: "文字列",
      colorOld: "文字列",
      colorDiscount: "文字列",
      label: "文字列",
    },
  },
  "pricing-tier": {
    必須: ["source"],
    欄: {
      source: "文字列",
      colorAccent: "文字列",
      currency: "文字列",
      label: "文字列",
    },
  },
  "priority-badge": {
    必須: ["source"],
    欄: {
      source: "文字列",
      textSource: "文字列",
      label: "文字列",
    },
  },
  "progress-group": {
    必須: ["source", "max"],
    欄: {
      source: "文字列",
      max: "数",
      labelSource: "文字列",
      color: "文字列",
      label: "文字列",
    },
  },
  "quick-poll-emoji": {
    必須: ["source"],
    欄: {
      source: "文字列",
      colorWinner: "文字列",
      label: "文字列",
    },
  },
  radar: {
    必須: ["source", "max"],
    欄: {
      source: "文字列",
      max: "数",
      viewW: "数",
      viewH: "数",
      color: "文字列",
      labelSource: "文字列",
      label: "文字列",
    },
  },
  rating: {
    必須: ["source"],
    欄: {
      source: "文字列",
      count: "数",
      color: "文字列",
      label: "文字列",
    },
  },
  "rating-thumb": {
    必須: ["source"],
    欄: {
      source: "文字列",
      colorUp: "文字列",
      colorDown: "文字列",
      label: "文字列",
    },
  },
  "reaction-bar": {
    必須: ["source"],
    欄: {
      source: "文字列",
      color: "文字列",
      label: "文字列",
    },
  },
  "read-receipt": {
    必須: ["source"],
    欄: {
      source: "文字列",
      colorRead: "文字列",
      colorPending: "文字列",
      label: "文字列",
    },
  },
  roadmap: {
    必須: ["source"],
    欄: {
      source: "文字列",
      viewW: "数",
      viewH: "数",
      label: "文字列",
    },
  },
  sankey: {
    必須: ["source"],
    欄: {
      source: "文字列",
      viewW: "数",
      viewH: "数",
      colors: "文字列の並び",
      label: "文字列",
    },
  },
  "search-result": {
    必須: ["source"],
    欄: {
      source: "文字列",
      max: "数",
      color: "文字列",
      label: "文字列",
    },
  },
  "sequence-timeline": {
    必須: ["source", "min", "max"],
    欄: {
      source: "文字列",
      min: "数",
      max: "数",
      viewW: "数",
      viewH: "数",
      color: "文字列",
      label: "文字列",
    },
  },
  "service-health": {
    必須: ["source"],
    欄: {
      source: "文字列",
      label: "文字列",
    },
  },
  "share-buttons": {
    必須: ["source"],
    欄: {
      source: "文字列",
      label: "文字列",
    },
  },
  slope: {
    必須: ["source", "min", "max"],
    欄: {
      source: "文字列",
      min: "数",
      max: "数",
      viewW: "数",
      viewH: "数",
      colorUp: "文字列",
      colorDown: "文字列",
      label: "文字列",
    },
  },
  "song-queue": {
    必須: ["source"],
    欄: {
      source: "文字列",
      currentSource: "文字列",
      max: "数",
      color: "文字列",
      label: "文字列",
    },
  },
  sparkline: {
    必須: ["source"],
    欄: {
      source: "文字列",
      history: "数",
      color: "文字列",
      label: "文字列",
    },
  },
  spinner: {
    必須: ["source", "textSource"],
    欄: {
      source: "文字列",
      textSource: "文字列",
      color: "文字列",
      label: "文字列",
    },
  },
  "stacked-bar": {
    必須: ["sourceA", "sourceB", "min", "max"],
    欄: {
      sourceA: "文字列",
      sourceB: "文字列",
      min: "数",
      max: "数",
      colorA: "文字列",
      colorB: "文字列",
      label: "文字列",
    },
  },
  stat: {
    必須: ["source"],
    欄: {
      source: "文字列",
      caption: "文字列",
      unit: "文字列",
      label: "文字列",
    },
  },
  "status-dot": {
    必須: ["source", "map"],
    欄: {
      source: "文字列",
      map: "組の並び",
      label: "文字列",
    },
  },
  "status-timeline": {
    必須: ["source"],
    欄: {
      source: "文字列",
      colorMap: "組の並び",
      max: "数",
      label: "文字列",
    },
  },
  "step-indicator": {
    必須: ["source", "stepsSource"],
    欄: {
      source: "文字列",
      stepsSource: "文字列",
      viewW: "数",
      viewH: "数",
      colorActive: "文字列",
      colorPending: "文字列",
      label: "文字列",
    },
  },
  "step-progress": {
    必須: ["source", "stepsSource"],
    欄: {
      source: "文字列",
      stepsSource: "文字列",
      color: "文字列",
      label: "文字列",
    },
  },
  stopwatch: {
    必須: ["source"],
    欄: {
      source: "文字列",
      runningSource: "文字列",
      size: "数",
      color: "文字列",
      label: "文字列",
    },
  },
  "tag-cloud": {
    必須: ["source"],
    欄: {
      source: "文字列",
      minSize: "数",
      maxSize: "数",
      colors: "文字列の並び",
      label: "文字列",
    },
  },
  terminal: {
    必須: ["source"],
    欄: {
      source: "文字列",
      max: "数",
      color: "文字列",
      label: "文字列",
    },
  },
  thermometer: {
    必須: ["source", "min", "max"],
    欄: {
      source: "文字列",
      min: "数",
      max: "数",
      viewW: "数",
      viewH: "数",
      color: "文字列",
      unit: "文字列",
      label: "文字列",
    },
  },
  "thread-summary": {
    必須: ["source"],
    欄: {
      source: "文字列",
      colorUnread: "文字列",
      label: "文字列",
    },
  },
  "timeline-vertical": {
    必須: ["source"],
    欄: {
      source: "文字列",
      color: "文字列",
      max: "数",
      label: "文字列",
    },
  },
  "timezone-clock": {
    必須: ["source"],
    欄: {
      source: "文字列",
      color: "文字列",
      label: "文字列",
    },
  },
  "toc-nav": {
    必須: ["source"],
    欄: {
      source: "文字列",
      colorActive: "文字列",
      label: "文字列",
    },
  },
  "token-list": {
    必須: ["source"],
    欄: {
      source: "文字列",
      colorUp: "文字列",
      colorDown: "文字列",
      label: "文字列",
    },
  },
  "traffic-light": {
    必須: ["source"],
    欄: {
      source: "文字列",
      viewW: "数",
      viewH: "数",
      label: "文字列",
    },
  },
  treemap: {
    必須: ["source"],
    欄: {
      source: "文字列",
      viewW: "数",
      viewH: "数",
      colors: "文字列の並び",
      label: "文字列",
    },
  },
  typewriter: {
    必須: ["source"],
    欄: {
      source: "文字列",
      charMs: "数",
      label: "文字列",
    },
  },
  "user-presence": {
    必須: ["source"],
    欄: {
      source: "文字列",
      max: "数",
      label: "文字列",
    },
  },
  "user-stack": {
    必須: ["source"],
    欄: {
      source: "文字列",
      max: "数",
      size: "数",
      label: "文字列",
    },
  },
  venn: {
    必須: ["source"],
    欄: {
      source: "文字列",
      viewW: "数",
      viewH: "数",
      colorA: "文字列",
      colorB: "文字列",
      labelA: "文字列",
      labelB: "文字列",
      label: "文字列",
    },
  },
  "video-card": {
    必須: ["source"],
    欄: {
      source: "文字列",
      max: "数",
      color: "文字列",
      label: "文字列",
    },
  },
  "voice-message": {
    必須: ["source"],
    欄: {
      source: "文字列",
      progressSource: "文字列",
      duration: "数",
      colorPlay: "文字列",
      colorBar: "文字列",
      label: "文字列",
    },
  },
  waterfall: {
    必須: ["source", "min", "max"],
    欄: {
      source: "文字列",
      min: "数",
      max: "数",
      viewW: "数",
      viewH: "数",
      colorPos: "文字列",
      colorNeg: "文字列",
      label: "文字列",
    },
  },
  "weather-forecast": {
    必須: ["source"],
    欄: {
      source: "文字列",
      label: "文字列",
    },
  },
};

/** 組の並びを取る欄の、1 組ごとの欄 */
export const 部品の組の表: Record<string, Record<string, 図形の定義>> = {
  badge: {
    map: {
      必須: ["value", "color"],
      欄: {
        value: "文字列",
        color: "文字列",
      },
    },
  },
  "status-dot": {
    map: {
      必須: ["value", "color"],
      欄: {
        value: "文字列",
        color: "文字列",
        label: "文字列",
      },
    },
  },
  "status-timeline": {
    colorMap: {
      必須: ["status", "color"],
      欄: {
        status: "文字列",
        color: "文字列",
      },
    },
  },
};
