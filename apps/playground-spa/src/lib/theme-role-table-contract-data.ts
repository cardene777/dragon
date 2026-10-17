export const THEME_ROLE_TABLE_CONTRACT_SELECTORS = {
  forbiddenAttributeSelectors: [
    'stroke^="var(--cdl-tone',
    'fill-opacity="1"',
  ],
  boxFrame: '[data-cdl-role="node-body"]',
  fixedTimelineStage: 'svg[data-cdl-stage][data-cdl-palette]:not( :where([data-cdl-palette="site-colours"], [data-cdl-palette="kinari"], [data-cdl-palette="celadon"]) ):has([data-cdl-role="timeline-axis"])',
  carryoverTimelineStage: 'svg[data-cdl-stage]:is([data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"], [data-cdl-palette="terminal"], [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"]):has([data-cdl-role="timeline-axis"])',
} as const;

export const MIGRATED_RULE_CONTRACT_SELECTORS = {
  chartNumericRole: '[data-cdl-role="chart-bar-tick"]',
  edgeLabel: '[data-cdl-role="edge-label"]',
  edgeLabelBackground: '[data-cdl-role="edge-label-bg"]',
  figureFrame: '> [data-cdl-frame]',
  figureHead: ':has([data-cdl-role="figure-head"])',
  figureTitle: ':has([data-cdl-role="figure-title"])',
  forbiddenEndpointCoordinate: '[x="',
  nonTerminalPalette: ':not([data-cdl-palette="terminal"])',
  stageCard: '[data-cdl-kind="card"]',
  stageColumn: ':has([data-cdl-role="stage-column"])',
  timelineAxis: ':has([data-cdl-role="timeline-axis"])',
  lineEndpoint: '[data-cdl-role="chart-line-value"][data-cdl-series="1"]',
} as const;

export const CATALOG_THEME_FORBIDDEN_RULES = {
  coordinateAttribute: /\[(?:x|y|cx|cy|width|height)=/u,
  figureRoleSelectors: [
    '[data-cdl-role="chart-bar-top"]',
    '[data-cdl-role="chart-bar-bottom"]',
    '[data-cdl-role="chart-stacked-bar-slice"]',
    '[data-cdl-role="funnel-proportional-bar"]',
    '[data-cdl-role="gantt-bar"]',
  ],
  forbiddenSourceFragments: [
    "--catalog-line-series-matrix",
    "--catalog-line-grid-matrix",
    "--catalog-line-tick-x",
    "--catalog-line-label-y",
    "var(--cdl-figure-content-inset-filter)",
  ],
  slopeText: '[data-cdl-kind="chart-slope"] text',
  reliefPalette: '[data-cdl-palette="relief"]',
  reliefJourney: '[data-cdl-node="荷主の気持ち-chart"][data-cdl-kind="journey-map"]',
  journeyStep: '[data-cdl-role="journey-step"]',
  stageName: '[data-cdl-role="stage-name"]',
  neonPalette: '[data-cdl-palette="neon"]',
  neonPieSlice: '[data-cdl-role="chart-pie-slice"]',
  lineLabel: '[data-cdl-role="chart-line-label"]',
  metroRouting: '[data-cdl-routing="metro"]',
  metroLegend: '[data-cdl-role="legend"]',
} as const;

export const FIXED_THEME_NAME_SELECTOR = /\[data-cdl-palette="(?:blueprint|letterpress|catalog|terminal|sketch|neon|relief)"\]/;
export const COMMON_THEME_RULE_SOURCE = String.raw`svg\[data-cdl-stage\]\[data-cdl-palette\]:not\(\s*:where\([^)]*\)\s*\)`;
export const COMMON_PALETTE_SCOPE = /\[data-cdl-palette\]:not\(\s*:where\(/;
export const NAMED_PALETTE_CAPTURE = /\[data-cdl-palette="([^"]+)"\]/g;
export const NAMED_DIAGRAM_RULE = /data-cdl-diagram="|data-cdl-node="[^"]*-chart"/;

export const THEME_SHAPE_DECLARATION_ALLOWLIST = [
  {
    selector: `svg[data-cdl-stage][data-cdl-type="flowchart"]:is([data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"], [data-cdl-palette="terminal"], [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"]) [data-cdl-role="edge-arrowhead"]:is([data-cdl-edge-head="triangle"], :not([data-cdl-edge-head]))`,
    property: "transform",
    value: "scale(1.2142857143, 1.3571428571)",
  },
  {
    selector: `svg[data-cdl-stage]:is([data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"], [data-cdl-palette="terminal"], [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"]):has([data-cdl-role="stage-column"]) [data-cdl-role="edge-arrowhead"]:is([data-cdl-edge-head="triangle"], :not([data-cdl-edge-head]))`,
    property: "transform",
    value: "scale(1.2142857143, 1.3571428571)",
  },
  {
    selector: `svg[data-cdl-stage]:is([data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"], [data-cdl-palette="terminal"], [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"]):has([data-cdl-role="timeline-axis"]) marker:not([id$="-sm"]) > [data-cdl-role="edge-arrowhead"][data-cdl-edge-head="triangle"]`,
    property: "transform",
    value: "scale(var(--theme-timeline-arrow-scale-x), var(--theme-timeline-arrow-scale-y))",
  },
  {
    selector: `svg[data-cdl-stage]:is([data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"], [data-cdl-palette="terminal"], [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"]):has([data-cdl-role="timeline-axis"]) marker[id$="-sm"] > [data-cdl-role="edge-arrowhead"][data-cdl-edge-head="triangle"]`,
    property: "transform",
    value: "scale(var(--theme-timeline-small-arrow-scale-x), var(--theme-timeline-small-arrow-scale-y))",
  },
  {
    selector: `svg[data-cdl-stage]:is(
      [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"],
      [data-cdl-palette="terminal"], [data-cdl-palette="neon"], [data-cdl-palette="relief"]
    ) [data-cdl-role="gantt-bar-hatch"]`,
    property: "display",
    value: "none",
  },
  {
    selector: `svg[data-cdl-stage][data-cdl-palette="blueprint"] :is([data-cdl-role="chart-pie-table-mark"], [data-cdl-role="chart-waffle-item-mark"])`,
    property: "transform",
    value: "rotate(45deg)",
  },
  {
    selector: `svg[data-cdl-stage]:is([data-cdl-palette="catalog"], [data-cdl-palette="neon"], [data-cdl-palette="relief"]) :is([data-cdl-role="chart-pie-table-rule"], [data-cdl-role="chart-waffle-item-rule"])`,
    property: "display",
    value: "none",
  },
  {
    selector: `svg[data-cdl-stage]:is(
      [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"],
      [data-cdl-palette="terminal"], [data-cdl-palette="neon"], [data-cdl-palette="relief"]
    ) :is([data-cdl-role="funnel-stage-hatch"], [data-cdl-role="chart-stacked-bar-slice-hatch"])`,
    property: "display",
    value: "none",
  },
  {
    selector: `svg[data-cdl-stage][data-cdl-palette]:has([data-cdl-routing="metro"]) [data-cdl-mark="metro-return-arrow"]`,
    property: "transform",
    value: "none",
  },
  {
    selector: `svg[data-cdl-stage]:is(
      [data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"],
      [data-cdl-palette="catalog"], [data-cdl-palette="sketch"],
      [data-cdl-palette="neon"], [data-cdl-palette="relief"]
    ) :is(
      [data-cdl-role="terminal-window-control"],
      [data-cdl-role="terminal-cursor"],
      [data-cdl-role="terminal-row-ordinal"]
    )`,
    property: "display",
    value: "none",
  },
  {
    selector: `svg[data-cdl-stage][data-cdl-palette="terminal"] [data-cdl-role="terminal-row-ordinal"]`,
    property: "transform",
    value: "translateX(-30px)",
    reason: "端末だけが足す行番号を共通の一覧行から左へ離し、色印との間に 14px の隙間を保つ。",
  },
  {
    selector: `svg[data-cdl-stage]:not([data-cdl-palette="sketch"]) [data-cdl-corner-variant="handdraw"]`,
    property: "display",
    value: "none",
  },
  {
    selector: `svg[data-cdl-stage][data-cdl-palette="sketch"] [data-cdl-corner-variant="uniform"]`,
    property: "display",
    value: "none",
  },
  {
    selector: `svg[data-cdl-stage][data-cdl-palette="sketch"] [data-cdl-corner-variant="handdraw"]`,
    property: "display",
    value: "inline",
  },
  {
    selector: `svg[data-cdl-stage][data-cdl-palette="sketch"] pattern#dragon-sketch-pen-primary`,
    property: "width",
    value: "var(--dragon-chart-primary-pattern-size)",
  },
  {
    selector: `svg[data-cdl-stage][data-cdl-palette="sketch"] pattern#dragon-sketch-pen-primary`,
    property: "height",
    value: "var(--dragon-chart-primary-pattern-size)",
  },
  {
    selector: `svg[data-cdl-stage][data-cdl-palette="sketch"] pattern#dragon-sketch-pen-primary > rect`,
    property: "width",
    value: "var(--dragon-chart-primary-pattern-mark-width)",
  },
  {
    selector: `:is([data-cdl-diagram="delivery-relations-demo"], [data-cdl-diagram="delivery-classes-demo"]) svg[data-cdl-stage][data-cdl-palette="blueprint"] [data-cdl-role="node-row-glyph"]`,
    property: "transform",
    value: "rotate(45deg) !important",
  },
  {
    selector: `[data-cdl-diagram="delivery-sequence-demo"] svg[data-cdl-stage][data-cdl-palette="blueprint"] [data-cdl-role="sequence-label-mark"]`,
    property: "transform",
    value: "rotate(45deg) !important",
  },
] as const;

export const CARRYOVER_SELECTOR_FRAGMENTS = {
  flowTransform: '[data-cdl-type="flowchart"]:is([data-cdl-palette="blueprint"]',
  globalTransform: '[data-cdl-role="edge-arrowhead"]:is(',
  stageTransform: '[data-cdl-role="stage-column"]',
  timeline: '[data-cdl-role="timeline-axis"]',
  timelineMarker: 'marker:not(',
  timelineSmallMarker: 'marker[id$="-sm"]',
  radiusRule: /\[data-cdl-role="edge-flow"\] circle\[r="(?:12|18|28)"\]/,
  deliveryRelations: '[data-cdl-diagram="delivery-relations-demo"]',
  deliveryGlyph: '[data-cdl-role="node-row-glyph"]',
  deliverySequence: '[data-cdl-diagram="delivery-sequence-demo"]',
  sequenceMark: '[data-cdl-role="sequence-label-mark"]',
  ganttHatch: '[data-cdl-role="gantt-bar-hatch"]',
  pieMark: '[data-cdl-role="chart-pie-table-mark"]',
  pieRule: '[data-cdl-role="chart-pie-table-rule"]',
  funnelHatch: '[data-cdl-role="funnel-stage-hatch"]',
  metroReturn: '[data-cdl-mark="metro-return-arrow"]',
  terminalControl: '[data-cdl-role="terminal-window-control"]',
  terminalOrdinal: '[data-cdl-role="terminal-row-ordinal"]',
  nonSketchPalette: ':not([data-cdl-palette="sketch"])',
  handdrawCorner: '[data-cdl-corner-variant="handdraw"]',
  sketchPalette: '[data-cdl-palette="sketch"]',
  uniformCorner: '[data-cdl-corner-variant="uniform"]',
} as const;

export const exactThemeTableSelector = (theme: string): string =>
  `svg[data-cdl-stage][data-cdl-palette="${theme}"]`;

export const THEME_ROLE_TABLE_CARRYOVER_RULES = [
      `[data-cdl-role="edge-arrowhead"]:is(
        [data-cdl-edge-head="triangle"],
        [data-cdl-edge-head="diamond"],
        [data-cdl-edge-head="open"],
        :not([data-cdl-edge-head])
      ) { transform: scale(2); transform-origin: 9px 5px; }`,
      `[data-cdl-role="edge-arrowhead"][data-cdl-edge-head="crow"] {
        transform: scale(2); transform-origin: 10px 5px;
      }`,
      `[data-cdl-role="edge-glow"] { display: none !important; }`,
      `svg[data-cdl-stage][data-cdl-type="flowchart"]:is([data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"], [data-cdl-palette="terminal"], [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"]) [data-cdl-role="edge-arrowhead"]:is([data-cdl-edge-head="triangle"], :not([data-cdl-edge-head])) {
        transform: scale(1.2142857143, 1.3571428571); transform-origin: 9px 5px;
      }`,
      `svg[data-cdl-stage]:is([data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"], [data-cdl-palette="terminal"], [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"]):has([data-cdl-role="stage-column"]) [data-cdl-role="edge-arrowhead"]:is([data-cdl-edge-head="triangle"], :not([data-cdl-edge-head])) {
        transform: scale(1.2142857143, 1.3571428571); transform-origin: 9px 5px;
      }`,
      `svg[data-cdl-stage][data-cdl-palette] [data-cdl-role="edge-flow"] circle[r="12"] {
        fill: var(--er-line) !important; stroke: var(--er-ground) !important;
        stroke-width: 3.5px; filter: drop-shadow(0 0 6px var(--er-line));
      }`,
      `svg[data-cdl-stage][data-cdl-palette] [data-cdl-role="edge-flow"] circle[r="28"] {
        fill: none !important; stroke: var(--er-line) !important; filter: blur(1.2px);
        animation: running-dot-wave-outer 1.4s linear infinite;
      }`,
      `svg[data-cdl-stage][data-cdl-palette] [data-cdl-role="edge-flow"] circle[r="18"] {
        fill: none !important; stroke: var(--er-line) !important; filter: blur(0.6px);
        animation: running-dot-wave-inner 1.4s linear infinite -0.7s;
      }`,
      `from { opacity: 0; translate: 0 22px; scale: 0.985; }`,
      `to { translate: 0 0; scale: 1; }`,
      `svg[data-cdl-stage]:is([data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"], [data-cdl-palette="terminal"], [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"]):has([data-cdl-role="timeline-axis"])
        marker:not([id$="-sm"])
        > [data-cdl-role="edge-arrowhead"][data-cdl-edge-head="triangle"] {
        transform: scale(var(--theme-timeline-arrow-scale-x), var(--theme-timeline-arrow-scale-y));
        transform-origin: 9px 5px;
      }`,
      `svg[data-cdl-stage]:is([data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"], [data-cdl-palette="terminal"], [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"]):has([data-cdl-role="timeline-axis"])
        marker[id$="-sm"]
        > [data-cdl-role="edge-arrowhead"][data-cdl-edge-head="triangle"] {
        transform: scale(var(--theme-timeline-small-arrow-scale-x), var(--theme-timeline-small-arrow-scale-y));
        transform-origin: 9px 5px;
      }`,
      `:is([data-cdl-diagram="delivery-relations-demo"], [data-cdl-diagram="delivery-classes-demo"])
        svg[data-cdl-stage][data-cdl-palette="blueprint"] [data-cdl-role="node-row-glyph"] {
        rx: var(--dragon-delivery-row-glyph-radius);
        ry: var(--dragon-delivery-row-glyph-radius);
        transform-box: fill-box;
        transform-origin: center;
        transform: rotate(45deg) !important;
      }`,
      `[data-cdl-diagram="delivery-sequence-demo"]
        svg[data-cdl-stage][data-cdl-palette="blueprint"] [data-cdl-role="sequence-label-mark"] {
        transform: rotate(45deg) !important;
      }`,
      `svg[data-cdl-stage]:is(
        [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"],
        [data-cdl-palette="terminal"], [data-cdl-palette="neon"], [data-cdl-palette="relief"]
      ) [data-cdl-role="gantt-bar-hatch"] { display: none; }`,
      `svg[data-cdl-stage][data-cdl-palette="blueprint"]
        :is([data-cdl-role="chart-pie-table-mark"], [data-cdl-role="chart-waffle-item-mark"]) {
        transform: rotate(45deg);
      }`,
      `svg[data-cdl-stage]:is([data-cdl-palette="catalog"], [data-cdl-palette="neon"], [data-cdl-palette="relief"])
        :is([data-cdl-role="chart-pie-table-rule"], [data-cdl-role="chart-waffle-item-rule"]) {
        display: none;
      }`,
      `svg[data-cdl-stage]:is(
        [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"],
        [data-cdl-palette="terminal"], [data-cdl-palette="neon"], [data-cdl-palette="relief"]
      ) :is([data-cdl-role="funnel-stage-hatch"], [data-cdl-role="chart-stacked-bar-slice-hatch"]) {
        display: none;
      }`,
      `svg[data-cdl-stage][data-cdl-palette]:has([data-cdl-routing="metro"]) [data-cdl-mark="metro-return-arrow"] {
        transform: none;
      }`,
      `svg[data-cdl-stage]:is(
        [data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"],
        [data-cdl-palette="catalog"], [data-cdl-palette="sketch"],
        [data-cdl-palette="neon"], [data-cdl-palette="relief"]
      ) :is(
        [data-cdl-role="terminal-window-control"],
        [data-cdl-role="terminal-cursor"],
        [data-cdl-role="terminal-row-ordinal"]
      ) { display: none; }`,
      `svg[data-cdl-stage]:not([data-cdl-palette="sketch"]) [data-cdl-corner-variant="handdraw"] {
        display: none;
      }`,
      `svg[data-cdl-stage][data-cdl-palette="sketch"] [data-cdl-corner-variant="uniform"] {
        display: none;
      }`,

] as const;

