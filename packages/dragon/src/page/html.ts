/**
 * mdから書き出す頁 (#3755) の HTML を組む。
 *
 * 頁は入口と項目の頁を `data-page` の要素に持ち、見ていない頁は `hidden` で隠す。入口の場所の名前は空の字。
 * 組み立て `entry` は入口に全体の図と段ごとの項目の札を並べ、札を押すと項目の頁へ移り、項目の頁の戻る link で入口へ戻る。
 * `sidebar` は左の目次と右の頁、`tabs` は上の段のタブと段の中の項目のタブで項目を選ぶ。
 * 項目の頁の中は `####` の見出しのタブ (`data-level="4"`)、その中は `#####` の見出しのタブ (`data-level="5"`) に分ける。
 * `guide` (#3876、#3961) は頁の頭から左の列に目次を置き、頁の題と全ての話題と問いを並べる。右の列に頁の題と頭の中身と全体像と、話題と番号つきの節を続けて積む。
 * 話題が2つ以上の`guide`は、頁の題と頭の中身と全体像の頭の頁と、問いごとの頁 (問いを持たない話題は話題ごとの頁) に分け、1度に1つの頁だけを見せる。
 * 話題が2つ以上の説明の頁は、頁の上に全体像と話題ごとのタブを並べ、タブの終わりに前と次の話題へのlinkを置き、タブとlinkは URL の `#` の後ろを話題の場所の名前にして、再読み込みせずに切り替える (#3983、#3991)。
 * 問いの番号は話題ごとに1から数え直し、`話題の番号-問いの番号` (`1-1`、`2-1`) で出す。用語の話題は番号を持たない (#3969)。
 * 目次は広い画面で画面に留まり、読んでいる節の問いに印 (`aria-current`) を付ける。携帯の幅では全体像の下、本文の上に畳み、釦で開く。
 * 頭の中身に図を書いた頁は、頁の頭にその図と、図の後に書いた頭の中身と、話題を書いた順に並べた道筋を全体像として置き、目次の最初の行を全体像にする (#3969)。
 * 用語の札は押した下線のすぐ下に開き、見た目と開け閉めは図の箱の札 (`blocks/pop/cards.ts`) の値 (`LOOK.note`、`TYPE.note*`) に揃える。
 * 印刷の形では、用語の札を節の終わりに全て開いて並べ、確かめる問いの答えを全て開く。
 *
 * 図は頁の script の1行の入口が jsDelivr から読む dragon が描き、版の範囲は書き出した dragon の版の上 2 つの数で決める。
 * 見せる頁とタブを選ぶ処理 (`RUNTIME`) は頁に埋めた短い script で、外へ通信しない。
 * 色と字は dragon の図と同じ紙の色味 (`paper` の明るい色) と同梱の字を使う。
 */
import { PALETTES, COLOR_ORDER, FONT_VARS, LOOK, TYPE, type TextStyle } from "../look/values";
import { escapeHtml } from "./markdown";
import type { Layout, PageHeader } from "./read";
import { LANG_NAMES, type PageLang, WORDS } from "./text";

/** package の版。build が入れる (`tsup.config.ts`) */
declare const __DRAGON_VERSION__: string;

/** HTML にした見出しの下の中身 */
export interface RenderedTab {
  id: string;
  /** 見出しの字の HTML */
  name: string;
  body: string;
  tabs: RenderedTab[];
}

export interface RenderedPart {
  lead: string;
  tabs: RenderedTab[];
}

export interface RenderedItem extends RenderedPart {
  id: string;
  name: string;
  /** 札に書く、最初の段落の字の HTML。link を持たない */
  summary: string;
  group: number;
}

export interface RenderedGroup {
  name: string;
  lead: string;
  /** 札と目次に書く、最初の段落の字の HTML。link を持たない */
  summary: string;
  items: RenderedItem[];
}

/** 用語の札の中身 (#3876)。`key` は下線と札を結ぶ名前、`entry` は「用語」のタブの中の場所の名前、`label` は読み上げの名前の字 */
export interface RenderedTerm {
  key: string;
  entry: string;
  label: string;
  name: string;
  text: string;
  example?: string;
}

/** 説明の頁の節の図 (#3998)。`id` は図の塊の場所の名前、`title` は図の記法の頭の行の題 */
export interface RenderedFigure {
  id: string;
  title: string;
}

/** 説明の頁の節の`####`の見出し (#4010)。`id` は見出しの場所の名前、`html` は見出しの中身 */
export interface RenderedHead {
  id: string;
  html: string;
}

/**
 * 説明の頁の節。`terms` は節の中の下線が開く札、`menu` は左の目次に出す短い名前 (#3961)、`figures` は題を持つ図を書いた順に並べた物 (#3998)、
 * `heads` は`####`の見出しを書いた順に並べた物 (#4010)
 */
export interface RenderedSection {
  id: string;
  name: string;
  menu?: string;
  answer?: string;
  body: string;
  terms: RenderedTerm[];
  figures?: RenderedFigure[];
  heads?: RenderedHead[];
}

/** 説明の頁の話題。`glossary` を持つ話題は用語の話題で、節を持たない */
export interface RenderedTopic {
  id: string;
  name: string;
  lead: string;
  leadTerms: RenderedTerm[];
  sections: RenderedSection[];
  glossary?: RenderedTerm[];
}

/**
 * 説明の頁。`overview` は頭の中身の最初の図のHTML、`overviewId` は全体像の場所の名前で、図が無い頁はどちらも空の字 (#3961)。
 * `overviewText` は頭の中身のうち図の後に書いた中身のHTMLで、`overviewTerms` はその中の下線が開く札 (#3969)
 */
export interface RenderedGuide {
  lead: string;
  leadTerms: RenderedTerm[];
  overview: string;
  overviewText: string;
  overviewTerms: RenderedTerm[];
  overviewId: string;
  topics: RenderedTopic[];
}

export interface RenderedPage {
  /** 頁の題の HTML と、`<title>` に書く字 */
  title: string;
  titleText: string;
  layout: Layout;
  /** 頁の帯の設定。mdの頭に `header-` の行を書いた時だけ持つ (#3789) */
  header?: PageHeader;
  lang: PageLang;
  entry: RenderedPart;
  groups: RenderedGroup[];
  /** `layout: guide` の頁だけが持つ */
  guide?: RenderedGuide;
}

/** 頁が読む dragon の入口。版の範囲 (`@0.77`) で読み、同じ範囲の直した版が届く */
export const cdnScript = (): string => {
  const range = __DRAGON_VERSION__.split(".").slice(0, 2).join(".");
  return `https://cdn.jsdelivr.net/npm/@cardenelabs/dragon@${range}/dist/cdn/dragon.js`;
};

/** 頁の色の変数。dragon の図と同じ紙の明るい色味から引く */
const COLORS = (() => {
  const light = PALETTES.paper?.light ?? {};
  const keys = ["page", "bg", "surf", "sunk", "ink", "ink2", "mute", "hair", "line", ...COLOR_ORDER.flatMap((c) => [`c-${c}`, `t-${c}`])];
  return keys.map((key) => `--pg-${key}:${light[key] ?? "inherit"}`).join(";");
})();

/** 段の色。dragon が区画に配る順に配る */
const groupColor = (n: number): string => {
  const color = COLOR_ORDER[n % COLOR_ORDER.length] ?? "blue";
  return `--c:var(--pg-t-${color});--cc:var(--pg-c-${color})`;
};

const STYLE = `
:root{color-scheme:light;${COLORS};${FONT_VARS};--r:12px}
*{box-sizing:border-box}
[hidden]{display:none!important}
body{margin:0;background:var(--pg-bg);color:var(--pg-ink);font:15px/1.8 var(--sans);overflow-wrap:break-word}
a{color:var(--pg-t-blue)}
code{font:.87em var(--mono);background:var(--pg-sunk);padding:1px 5px;border-radius:4px}
pre{overflow-x:auto;background:var(--pg-sunk);padding:12px 14px;border-radius:10px;font-size:12.5px;line-height:1.6;margin:10px 0}
pre code{background:none;padding:0;font-size:inherit}
p{margin:6px 0}
img{max-width:100%;height:auto;border-radius:8px}
hr{border:0;border-top:1px solid var(--pg-hair);margin:20px 0}
ul,ol{padding-left:1.5em;margin:6px 0}
blockquote{margin:10px 0;padding:2px 16px;border-left:3px solid var(--pg-line);color:var(--pg-ink2)}
.pg-h{line-height:1.5;margin:16px 0 6px}
h1.pg-h{font-size:22px}h2.pg-h{font-size:19px}h3.pg-h{font-size:17px}h4.pg-h,h5.pg-h,h6.pg-h{font-size:15px}
.pg-wrap{max-width:1180px;margin:0 auto;padding:0 24px 48px}
.pg-top{padding:28px 0 10px}
.pg-top h1{font-size:26px;line-height:1.4;margin:0 0 6px}
.pg-lead{color:var(--pg-ink2);max-width:880px}
.pg-figure{margin:10px 0;padding:12px;border-radius:var(--r);background:var(--pg-page)}
.pg-figure.pg-kind-flow{padding:12px max(12px,calc((100% - 760px) / 2))}
.pg-figure pre.dragon{margin:0;background:none;padding:0}
.pg-table{overflow-x:auto;margin:10px 0;background:var(--pg-surf);border:1px solid var(--pg-hair);border-radius:var(--r)}
table{border-collapse:collapse;width:100%;font-size:14px}
th,td{border-bottom:1px solid var(--pg-hair);padding:8px 12px;text-align:left;vertical-align:top}
tr:last-child td{border-bottom:0}
th{background:var(--pg-sunk);font-size:13px}
.pg-alert{margin:10px 0 14px;background:var(--pg-surf);border:1px solid var(--pg-hair);border-left:4px solid var(--a);border-radius:0 var(--r) var(--r) 0;padding:10px 18px}
.pg-alert-title{font-size:12.5px;font-weight:700;color:var(--a);margin:0 0 2px}
.pg-alert-note,.pg-alert-tip{--a:var(--pg-t-blue)}.pg-alert-important{--a:var(--pg-t-violet)}.pg-alert-warning{--a:var(--pg-t-amber)}.pg-alert-caution{--a:var(--pg-t-rose)}
.pg-include{margin:10px 0}
.pg-include-name{font-size:12.5px;font-weight:700;color:var(--pg-ink2);margin:0 0 4px}
.pg-include pre{margin:0}
.pg-doc{background:var(--pg-surf);border:1px solid var(--pg-hair);border-radius:var(--r);padding:8px 24px;font-size:14px}
.pg-doc h1.pg-h{font-size:19px}.pg-doc h2.pg-h{font-size:16px}.pg-doc h3.pg-h,.pg-doc h4.pg-h{font-size:15px}
.pg-tablist{display:flex;flex-wrap:wrap;gap:2px;margin:6px 0 16px}
.pg-tablist [role="tab"]{font:inherit;cursor:pointer;color:var(--pg-ink2);border:0;background:transparent}
.pg-tablist-4{display:inline-flex;padding:3px;background:var(--pg-sunk);border-radius:10px}
.pg-tablist-4 [role="tab"]{padding:6px 16px;border-radius:8px;font-size:14px}
.pg-tablist-4 [role="tab"][aria-selected="true"]{background:var(--pg-surf);color:var(--pg-ink);font-weight:600;box-shadow:0 1px 2px var(--pg-hair)}
.pg-tablist-5{gap:6px}
.pg-tablist-5 [role="tab"]{padding:4px 14px;border:1px solid var(--pg-hair);border-radius:999px;background:var(--pg-surf);font-size:13.5px}
.pg-tablist-5 [role="tab"][aria-selected="true"]{border-color:var(--c,var(--pg-t-blue));color:var(--c,var(--pg-t-blue));font-weight:600}
.pg-pills [role="tab"]{padding:6px 16px;border:1px solid var(--pg-hair);border-radius:999px;background:var(--pg-surf);box-shadow:none;font-size:13.5px}
.pg-pills{display:flex;gap:6px;padding:0;background:none}
.pg-pills [role="tab"][aria-selected="true"]{background:var(--pg-surf);border-color:var(--pg-t-blue);color:var(--pg-t-blue);box-shadow:none}
.pg-tablist [role="tab"]:focus-visible,.pg-card:focus-visible,.pg-nav a:focus-visible{outline:2px solid var(--pg-t-blue);outline-offset:2px}
.pg-page:not([hidden]){animation:pg-page .28s ease}
.pg-panel:not([hidden]){animation:pg-panel .22s ease}
@keyframes pg-page{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes pg-panel{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.pg-page:not([hidden]),.pg-panel:not([hidden]){animation:none}}
.pg-choose{font-size:19px;margin:28px 0 8px}
.pg-groups-grid{display:flex;flex-direction:column;gap:10px}
.pg-group{display:grid;grid-template-columns:200px minmax(0,1fr);gap:12px;align-items:start;background:var(--pg-surf);border:1px solid var(--pg-hair);border-left:4px solid var(--cc);border-radius:var(--r);padding:12px 14px}
.pg-group-name{display:block;color:var(--c);font-size:15px;font-weight:700}
.pg-group-lead{font-size:12.5px;color:var(--pg-ink2);line-height:1.6}
.pg-cards{display:flex;flex-wrap:wrap;gap:8px;min-width:0}
.pg-card{display:flex;flex-direction:column;align-items:flex-start;max-width:100%;border:1px solid var(--pg-hair);background:var(--pg-bg);border-radius:10px;padding:8px 14px;line-height:1.4;text-decoration:none;color:var(--pg-ink)}
.pg-card:hover{border-color:var(--cc)}
.pg-card-name{font-weight:600;font-size:14px;color:var(--c)}
.pg-card-name code{background:none;padding:0;font-weight:600}
.pg-card-lead{font-size:12.5px;color:var(--pg-ink2)}
.pg-crumbs{display:flex;align-items:center;flex-wrap:wrap;gap:10px;padding:22px 0 16px;font-size:13px;color:var(--pg-ink2)}
.pg-back{border:1px solid var(--pg-hair);background:var(--pg-surf);border-radius:999px;padding:5px 14px;font-weight:600;color:var(--pg-ink);text-decoration:none}
.pg-back:hover{border-color:var(--pg-t-blue);color:var(--pg-t-blue)}
.pg-crumbs span+span::before{content:"\\203A";margin-right:10px;color:var(--pg-mute)}
.pg-crumbs span:last-child{color:var(--pg-ink)}
.pg-item-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap;padding:0 0 4px}
.pg-item-name{margin:0;font-size:22px;line-height:1.4;color:var(--c)}
.pg-item-name code{background:none;padding:0;font-weight:700}
.pg-item-count{font-size:13px;color:var(--pg-ink2)}
.pg-item-count span{margin-right:8px}
.pg-item-lead{margin:0 0 10px}
.pg-pager{display:flex;justify-content:space-between;gap:12px;margin:22px 0 8px}
.pg-pager a{border:1px solid var(--pg-hair);background:var(--pg-surf);border-radius:999px;padding:7px 16px;font-size:13px;font-weight:600;color:var(--pg-ink);text-decoration:none;min-width:0}
.pg-pager a:hover{border-color:var(--pg-t-blue);color:var(--pg-t-blue)}
.pg-pager code{background:none;padding:0}
@media (max-width:760px){.pg-wrap{padding:0 16px 40px}.pg-group{grid-template-columns:minmax(0,1fr)}.pg-top h1{font-size:22px}}
`;

const STYLE_SIDEBAR = `
.pg-bar{position:sticky;top:0;z-index:5;background:var(--pg-bg);border-bottom:1px solid var(--pg-hair)}
.pg-bar-in{max-width:1360px;margin:0 auto;padding:12px 24px}
.pg-bar h1{font-size:18px;margin:0;line-height:1.4}
.pg-layout{max-width:1360px;margin:0 auto;padding:0 24px 48px;display:grid;grid-template-columns:260px minmax(0,1fr);gap:28px}
.pg-toc{position:sticky;top:64px;align-self:start;max-height:calc(100vh - 80px);overflow:auto;padding:20px 0;display:flex;flex-direction:column;gap:14px}
.pg-toc a{display:block;border-radius:8px;padding:6px 10px;line-height:1.4;text-decoration:none;color:var(--pg-ink)}
.pg-toc a:hover{background:var(--pg-sunk)}
.pg-toc-top{font-weight:700}
.pg-toc a[aria-current="page"]{background:var(--pg-surf);box-shadow:inset 3px 0 0 var(--c,var(--pg-t-blue))}
.pg-toc-name{font-size:13px;font-weight:700;color:var(--c);padding:0 10px 4px}
.pg-toc-group a .pg-card-lead{display:block}
.pg-toc-group a[aria-current="page"] .pg-card-name{color:var(--c)}
.pg-toc-group .pg-card-name{color:var(--pg-ink)}
.pg-main{padding:20px 0 0;min-width:0}
.pg-main>.pg-lead{margin:0 0 18px;font-size:14px}
.pg-page-title{font-size:22px;margin:0 0 12px}
@media (max-width:860px){
.pg-bar-in{padding:12px 16px}
.pg-layout{grid-template-columns:minmax(0,1fr);gap:0;padding:0 16px 40px}
.pg-toc{position:static;max-height:none;flex-direction:row;overflow-x:auto;padding:12px 0;gap:10px}
.pg-toc>*{flex:0 0 auto}
.pg-toc-group{display:flex;align-items:center;gap:2px}
.pg-toc-name{padding:0 6px}
.pg-toc .pg-card-lead{display:none!important}
}
`;

const STYLE_TABS = `
.pg-groups{display:flex;gap:0;border-bottom:1px solid var(--pg-hair);margin:8px 0 22px;overflow-x:auto}
.pg-groups a{--c:var(--pg-ink);flex:1 1 0;min-width:120px;text-align:left;padding:10px 14px 12px;border-bottom:3px solid transparent;text-decoration:none;color:var(--pg-ink)}
.pg-groups a:hover{background:var(--pg-sunk)}
.pg-groups .pg-t{display:block;font-size:16px;font-weight:700}
.pg-groups .pg-s{display:block;font-size:12px;color:var(--pg-ink2)}
.pg-groups a[aria-selected="true"]{border-bottom-color:var(--cc,var(--pg-ink))}
.pg-groups a[aria-selected="true"] .pg-t{color:var(--c)}
.pg-stage-lead{margin:0 0 10px;color:var(--pg-ink2)}
.pg-stage-lead b{color:var(--c);font-size:16px;margin-right:12px}
.pg-chips{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 22px}
.pg-chips a{display:flex;flex-direction:column;align-items:flex-start;max-width:100%;border:1px solid var(--pg-hair);background:var(--pg-surf);border-radius:10px;padding:7px 14px;line-height:1.4;text-decoration:none;color:var(--pg-ink)}
.pg-chips a[aria-selected="true"]{border-color:var(--cc);box-shadow:inset 0 0 0 1px var(--cc)}
.pg-chips a[aria-selected="true"] .pg-card-name{color:var(--c)}
.pg-chips .pg-card-name{color:var(--pg-ink)}
`;

/** 用語の札の値。図の箱の札 (`player.ts` の `.dg-nc`) と同じ値から引く */
const N = LOOK.note;
const font = (t: TextStyle): string => `font-size:${t.size}px;font-weight:${t.weight}`;

const STYLE_GUIDE = `
body{font-size:16px}
.pg-guide{max-width:1180px;--dragon-step-no:none}
.pg-guide .pg-top h1{font-size:30px;line-height:1.35;margin:0 0 16px;padding:16px 20px;border-radius:6px;background:var(--pg-ink);color:var(--pg-surf);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pg-guide h4.pg-h:not(.pg-doc *){font-size:18px;line-height:1.45;margin:36px 0 12px;padding:8px 14px;border-radius:4px;background:var(--pg-sunk);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pg-guide h5.pg-h:not(.pg-doc *){font-size:17px;margin:28px 0 8px;padding:0 0 4px;border-bottom:1px dashed var(--pg-line)}
.pg-guide h6.pg-h:not(.pg-doc *){font-size:16px}
.pg-top .pg-lead{position:relative}
.pg-overview{margin:6px 0 26px}
.pg-overview .pg-figure{margin:0 0 12px}
.pg-overview-text{position:relative;margin:0 0 14px;color:var(--pg-ink2);max-width:880px}
.pg-route{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.pg-route li{display:flex;align-items:center;gap:8px;min-width:0}
.pg-route li+li::before{content:"\\2192";color:var(--pg-mute)}
.pg-route a{display:block;min-width:0;border:1px solid var(--pg-hair);border-left:4px solid var(--cc);border-radius:10px;background:var(--pg-surf);padding:6px 14px;font-size:14px;font-weight:600;line-height:1.5;color:var(--c);text-decoration:none}
.pg-route a:hover{border-color:var(--cc)}
.pg-has-menu{display:grid;grid-template-columns:250px minmax(0,1fr);grid-template-rows:auto auto 1fr;grid-template-areas:"menu top" "menu over" "menu main";column-gap:36px;align-items:start}
.pg-tabs{grid-area:tabs;position:sticky;top:0;z-index:8;display:flex;gap:4px;overflow-x:auto;margin:0 0 4px;padding:10px 0 0;background:var(--pg-bg);border-bottom:1px solid var(--pg-hair);scrollbar-width:thin}
.pg-tab{flex:none;display:flex;align-items:center;gap:8px;padding:9px 14px 11px;border-radius:10px 10px 0 0;border-bottom:3px solid transparent;margin-bottom:-1px;font-size:14.5px;font-weight:700;line-height:1.4;color:var(--pg-ink2);text-decoration:none;white-space:nowrap}
.pg-tab:hover{background:var(--pg-sunk);color:var(--pg-ink)}
.pg-tab[aria-current="page"]{background:var(--pg-surf);color:var(--c,var(--pg-ink));border-bottom-color:var(--cc,var(--pg-ink))}
.pg-tab:focus-visible{outline:2px solid var(--pg-t-blue);outline-offset:-2px}
.pg-map{margin:0 0 30px}
.pg-map-figure{margin:0 0 14px}
.pg-map-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.pg-map-list a{display:grid;row-gap:2px;align-items:start;border:1px solid var(--pg-hair);border-left:4px solid var(--cc);border-radius:10px;background:var(--pg-surf);padding:10px 14px;color:var(--pg-ink);text-decoration:none}
.pg-map-list a:hover{border-color:var(--cc)}
.pg-map-list a:focus-visible{outline:2px solid var(--pg-t-blue);outline-offset:2px}
.pg-map-name{font-size:15px;font-weight:700;line-height:1.5}
.pg-map-answer{font-size:14px;line-height:1.6;color:var(--pg-ink2)}
.pg-has-menu>.pg-top{grid-area:top}
.pg-has-menu>.pg-overview,.pg-has-menu>.pg-start{grid-area:over}
.pg-has-menu>.pg-main{grid-area:main}
.pg-menu{grid-area:menu;position:sticky;top:0;z-index:7;max-height:100vh;overflow:auto;padding:28px 4px 24px 0;font-size:16px;line-height:1.6}
.pg-menu-title{margin:0 0 12px;padding:0 8px 12px;border-bottom:1px solid var(--pg-hair);font-size:15px;font-weight:700;line-height:1.5;color:var(--pg-ink)}
.pg-menu-toggle{display:none}
.pg-menu-list{display:flex;flex-direction:column;gap:12px}
.pg-menu-group ol{list-style:none;margin:2px 0 0;padding:0}
.pg-menu-over{display:block;padding:7px 12px;border-radius:4px;font-weight:700;color:var(--pg-ink2);text-decoration:none}
.pg-menu-over[aria-current="true"]{background:color-mix(in srgb,var(--pg-ink) 7%,transparent);color:var(--pg-ink)}
.pg-menu-topic{display:block;padding:3px 12px;font-size:15px;font-weight:700;color:var(--pg-ink);text-decoration:none}
.pg-menu-topic[aria-current="true"]{text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:4px}
.pg-menu-q{display:block;padding:7px 12px;border-radius:4px;color:var(--pg-ink2);text-decoration:none}
.pg-menu-q[aria-current="true"],.pg-menu-q[data-open]{background:color-mix(in srgb,var(--pg-ink) 7%,transparent);color:var(--pg-ink);font-weight:700}
.pg-menu-group .pg-menu-figs{margin:2px 0 6px;padding:0}
.pg-menu-fig,.pg-menu-head{display:block;padding:5px 12px 5px 28px;border-radius:4px;font-size:15px;line-height:1.5;color:var(--pg-ink2);text-decoration:none}
.pg-menu-fig[aria-current="true"],.pg-menu-head[aria-current="true"]{color:var(--pg-ink);font-weight:700}
.pg-menu-over:hover,.pg-menu-q:hover,.pg-menu-fig:hover,.pg-menu-head:hover{background:color-mix(in srgb,var(--pg-ink) 5%,transparent);color:var(--pg-ink)}
.pg-menu a:focus-visible,.pg-menu-toggle:focus-visible,.pg-route a:focus-visible,.pg-term:focus-visible,.pg-q-btn:focus-visible,.pg-tc-x:focus-visible{outline:2px solid var(--pg-t-blue);outline-offset:2px}
.pg-main{min-width:0;padding:14px 0 0}
.pg-topic{margin:0 0 36px;scroll-margin-top:12px}
.pg-topic-title{font-size:25px;line-height:1.35;margin:0 0 20px;padding:0 0 10px;color:var(--pg-ink);border-bottom:2px solid var(--pg-ink)}
.pg-topic-lead{position:relative;margin:0 0 14px}
.pg-sec{position:relative;margin:0 0 34px;scroll-margin-top:12px}
.pg-figure{scroll-margin-top:12px}
.pg-sec-title{display:flex;gap:10px;align-items:center;font-size:22px;line-height:1.4;margin:0 0 12px;padding:2px 0 2px 14px;border-left:4px solid var(--cc,var(--pg-ink))}
.pg-answer{margin:0 0 14px}
.pg-term{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;font-weight:600;text-decoration:underline;text-decoration-color:var(--pg-t-blue);text-decoration-thickness:2px;text-underline-offset:4px}
.pg-term[aria-expanded="true"]{color:var(--pg-t-blue)}
.pg-tc{display:none;position:absolute;z-index:6;box-sizing:border-box;width:${N.card}px;max-width:100%;padding:${N.padY}px ${N.padX}px;border:1px solid var(--pg-line);border-radius:${N.radius}px;background:var(--pg-surf);color:var(--pg-ink);box-shadow:0 ${N.shadowY}px ${N.shadow}px color-mix(in srgb,var(--pg-ink) ${N.shadowMix}%,transparent);text-align:start;overflow:hidden;line-height:${N.bodyLine}}
.pg-tc[data-open]{display:block}
.pg-tc p,.pg-gl p{margin:0;overflow-wrap:anywhere}
.pg-tc .pg-tc-n,.pg-gl .pg-gl-n{${font(TYPE.noteName)};color:var(--pg-mute);margin:0 ${N.close}px ${N.nameGap}px 0}
.pg-tc-t,.pg-gl-t{${font(TYPE.noteBody)};overflow-wrap:anywhere}
.pg-tc-t p+p,.pg-gl-t p+p{margin-top:6px}
.pg-tc-e,.pg-gl-e{${font(TYPE.noteExample)};margin:${N.exampleGap}px -${N.padX}px -${N.padY}px;padding:${N.exampleGap}px ${N.padX}px;background:var(--pg-sunk);color:var(--pg-ink2);overflow-wrap:anywhere}
.pg-tc-x{position:absolute;top:${N.padY / 2}px;right:${N.padY / 2}px;width:${N.close}px;height:${N.close}px;padding:0;border:0;border-radius:${N.close / 2}px;background:none;color:var(--pg-mute);cursor:pointer;display:grid;place-items:center}
.pg-tc-x:hover{color:var(--pg-ink);background:var(--pg-sunk)}
.pg-tc-x svg{width:${N.icon}px;height:${N.icon}px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
.pg-glossary{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,${N.card}px),1fr));gap:12px;margin:0 0 24px}
.pg-gl{background:var(--pg-surf);border:1px solid var(--pg-hair);border-radius:${N.radius}px;padding:${N.padY}px ${N.padX}px;overflow:hidden;line-height:${N.bodyLine};scroll-margin-top:12px}
.pg-gl .pg-gl-n{${font(TYPE.noteBody)};font-weight:700;color:var(--pg-ink);margin-right:0}
.pg-quiz{background:var(--pg-surf);border:1px solid var(--pg-hair);border-radius:var(--r);padding:10px 14px;margin:12px 0}
.pg-quiz-h{font-size:14px;font-weight:700;margin:0 0 4px}
.pg-q{display:flex;gap:6px 10px;align-items:baseline;flex-wrap:wrap;font-size:14px;padding:6px 0;border-top:1px solid var(--pg-hair)}
.pg-quiz-h+.pg-q{border-top:0}
.pg-q{position:relative;padding-left:30px}
.pg-q::before{content:"";position:absolute;left:0;top:9px;width:20px;height:20px;box-sizing:border-box;border:2px solid var(--pg-line);border-radius:50%}
.pg-q[data-done]::before{border-color:var(--pg-t-green);background:var(--pg-t-green) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12.5l4.5 4.5L19 7.5'/%3E%3C/svg%3E") center/13px no-repeat}
.pg-map-list a[data-quiz]{position:relative;padding-right:52px}
.pg-map-list a[data-quiz]::after{content:"";position:absolute;right:16px;top:50%;width:22px;height:22px;margin-top:-11px;box-sizing:border-box;border:2px solid var(--pg-line);border-radius:50%}
.pg-menu a.pg-menu-q[data-quiz]{position:relative;padding-right:38px}
.pg-menu a.pg-menu-q[data-quiz]::after{content:"";position:absolute;right:10px;top:50%;width:18px;height:18px;margin-top:-9px;box-sizing:border-box;border:2px solid var(--pg-line);border-radius:50%}
.pg-map-list a[data-done]::after,.pg-menu a.pg-menu-q[data-done]::after{border-color:var(--pg-t-green);background:var(--pg-t-green) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12.5l4.5 4.5L19 7.5'/%3E%3C/svg%3E") center/62% no-repeat}
.pg-checks-clear{display:flex;justify-content:flex-end;margin:10px 0 0}
.pg-checks-clear button{font:inherit;font-size:13px;line-height:1.6;border:1px solid var(--pg-hair);background:var(--pg-surf);color:var(--pg-ink2);border-radius:999px;padding:4px 14px;cursor:pointer}
.pg-checks-clear button:hover{border-color:var(--pg-line);color:var(--pg-ink)}
.pg-checks-clear button:focus-visible{outline:2px solid var(--pg-t-blue);outline-offset:2px}
.pg-q-text{margin:0;flex:1 1 12em;min-width:0}
.pg-q-btn{font:inherit;font-size:12.5px;border:1px solid var(--pg-hair);background:var(--pg-sunk);color:var(--pg-ink);border-radius:999px;padding:1px 12px;cursor:pointer}
.pg-q-a{flex-basis:100%;color:var(--pg-t-green);font-weight:600}
.pg-q-a p{margin:2px 0}
.pg-start{margin:6px 0 26px}
.pg-pager{display:flex;justify-content:space-between;align-items:stretch;gap:12px;margin:28px 0 0;padding:16px 0 0;border-top:1px solid var(--pg-hair)}
.pg-pager a{display:flex;flex-direction:column;gap:4px;min-width:0;max-width:48%;box-sizing:border-box;border:1px solid var(--pg-hair);border-radius:10px;background:var(--pg-surf);padding:8px 14px;color:var(--pg-ink);text-decoration:none}
.pg-pager a:hover{border-color:var(--cc,var(--pg-t-blue))}
.pg-pager a:focus-visible{outline:2px solid var(--pg-t-blue);outline-offset:2px}
.pg-pager .pg-pager-next{margin-left:auto;align-items:flex-end;text-align:right}
.pg-pager-dir{font-size:12.5px;line-height:1.4;color:var(--pg-mute)}
.pg-pager-to{display:flex;gap:8px;align-items:flex-start;font-size:14.5px;font-weight:600;line-height:1.5;overflow-wrap:anywhere}
.pg-head{position:sticky;top:0;z-index:30;display:flex;flex-wrap:wrap;align-items:stretch;column-gap:48px;padding:0 36px;background:var(--pg-surf);border-bottom:1px solid var(--pg-hair)}
.pg-head-title{display:flex;align-items:center;min-height:60px;font-size:18px;font-weight:700;line-height:1.4;color:var(--pg-ink);white-space:nowrap;text-decoration:none}
.pg-head-tabs{display:flex;flex:0 0 auto;max-width:100%;overflow-x:auto;scrollbar-width:none}
.pg-head-tabs::-webkit-scrollbar{display:none}
.pg-head-tabs a{display:flex;align-items:center;min-height:60px;padding:0 14px;font-size:16px;line-height:1.4;color:var(--pg-ink2);text-decoration:none;white-space:nowrap}
.pg-head-tabs a:hover{background:color-mix(in srgb,var(--pg-ink) 4%,transparent);color:var(--pg-ink)}
.pg-head-tabs a[aria-current="true"]{color:var(--pg-ink);font-weight:700;box-shadow:inset 0 -2px 0 var(--pg-ink)}
.pg-head[data-wrap] .pg-head-title{min-height:52px}
.pg-head[data-wrap] .pg-head-tabs{margin:0 -14px;max-width:calc(100% + 28px)}
.pg-head[data-wrap] .pg-head-tabs a{min-height:46px}
.pg-head a:focus-visible{outline:2px solid var(--pg-t-blue);outline-offset:-2px}
body:has(.pg-split){background:var(--pg-surf)}
.pg-split[data-bare]>.pg-menu{display:none}
@media screen{.pg-split [data-off]{display:none!important}.pg-split>.pg-top h1{display:none}.pg-split .pg-topic,.pg-split .pg-sec,.pg-split .pg-gl,.pg-split .pg-figure[id],.pg-split .pg-sec h4[id]{scroll-margin-top:calc(var(--pg-head-h,61px) + 16px)}}
@media (min-width:861px){
.pg-split{max-width:none;margin:0;padding:0 40px 48px 0;grid-template-columns:300px minmax(0,1fr);column-gap:56px}
.pg-split>.pg-top,.pg-split>.pg-overview,.pg-split>.pg-start,.pg-split>.pg-main{width:100%;max-width:880px}
.pg-split>.pg-menu{top:var(--pg-head-h,61px);max-height:calc(100vh - var(--pg-head-h,61px));min-height:calc(100vh - var(--pg-head-h,61px));padding:20px 16px 40px 24px;background:var(--pg-sunk);border-right:1px solid var(--pg-hair)}
.pg-split[data-bare]{padding:0 40px 48px;grid-template-columns:minmax(0,880px);grid-template-areas:"top" "over" "main";justify-content:center}
}
.pg-sx{position:relative;display:flex;align-items:center;align-self:center;flex:0 0 260px;max-width:100%;margin-left:auto;min-width:0}
.pg-sx-box{position:relative;display:flex;align-items:center;width:100%}
.pg-sx-box svg,.pg-sx-open svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
.pg-sx-box svg{position:absolute;left:11px;color:var(--pg-mute);pointer-events:none}
.pg-sx-in{width:100%;height:40px;box-sizing:border-box;margin:0;padding:0 12px 0 36px;border:1px solid var(--pg-line);border-radius:8px;background:var(--pg-bg);font:inherit;font-size:15px;color:var(--pg-ink);outline:none}
.pg-sx-in::placeholder{color:var(--pg-mute)}
.pg-sx-in:focus{border-color:var(--pg-t-blue);box-shadow:0 0 0 3px color-mix(in srgb,var(--pg-t-blue) 18%,transparent)}
.pg-sx-list{position:absolute;z-index:40;top:calc(100% + 6px);right:0;width:440px;max-width:calc(100vw - 32px);max-height:min(70vh,520px);overflow:auto;box-sizing:border-box;padding:6px;background:var(--pg-surf);border:1px solid var(--pg-line);border-radius:10px;box-shadow:0 12px 32px color-mix(in srgb,var(--pg-ink) 16%,transparent);text-align:left;font-size:15px;line-height:1.5}
.pg-sx-h{padding:8px 10px 4px;font-size:13px;font-weight:700;line-height:1.4;color:var(--pg-mute)}
.pg-sx-g[data-kind="q"] .pg-sx-h span{color:var(--c)}
.pg-sx-r{display:block;margin:2px 0;padding:8px 12px;border-left:3px solid transparent;border-radius:6px;color:var(--pg-ink);text-decoration:none}
.pg-sx-g[data-kind="q"] .pg-sx-r{border-left-color:var(--cc)}
.pg-sx-r:hover,.pg-sx-r[aria-selected="true"]{background:color-mix(in srgb,var(--pg-ink) 6%,transparent)}
.pg-sx-n{display:block;font-weight:600}
.pg-sx-s{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:13px;line-height:1.55;color:var(--pg-ink2)}
.pg-sx mark{padding:0 1px;border-radius:2px;background:color-mix(in srgb,var(--pg-t-amber) 30%,transparent);color:inherit}
.pg-sx-none{margin:0;padding:14px 12px;font-size:14px;color:var(--pg-ink2)}
.pg-sx-open{display:none;place-items:center;width:40px;height:40px;padding:0;align-self:center;margin-left:auto;border:1px solid var(--pg-line);border-radius:8px;background:var(--pg-bg);color:var(--pg-ink2);cursor:pointer}
.pg-sx-open:focus-visible{outline:2px solid var(--pg-t-blue);outline-offset:2px}
@media (min-width:861px){.pg-head[data-wrap] .pg-sx{order:1}.pg-head[data-wrap] .pg-head-tabs{order:2}}
.pg-menu .pg-sx{flex:none;width:100%;margin:0 0 16px}
.pg-menu .pg-sx-list{position:fixed;right:auto}
.pg-gl:target{border-color:var(--pg-t-blue);box-shadow:0 0 0 1px var(--pg-t-blue)}
@media (max-width:860px){
.pg-has-menu{display:flex;flex-direction:column;align-items:stretch}
.pg-has-menu>.pg-tabs{order:0;position:static;padding-top:6px}
.pg-has-menu>.pg-top{order:1}
.pg-has-menu>.pg-overview,.pg-has-menu>.pg-start{order:2}
.pg-has-menu>.pg-main{order:4}
.pg-menu{order:3;max-height:none;overflow:visible;padding:8px 0;background:var(--pg-bg);border-bottom:1px solid var(--pg-hair)}
.pg-menu-title{display:none}
.pg-menu-toggle{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;font:inherit;font-size:16px;font-weight:700;color:var(--pg-ink);background:var(--pg-sunk);border:1px solid var(--pg-hair);border-radius:6px;padding:12px 14px;cursor:pointer}
.pg-menu-toggle svg{flex:none;width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.pg-menu-toggle[aria-expanded="true"] svg{transform:rotate(180deg)}
.pg-menu-toggle[aria-expanded="false"]+.pg-menu-list{display:none}
.pg-menu-list{max-height:calc(100vh - 72px);overflow:auto;padding:10px 0 4px}
.pg-topic,.pg-sec,.pg-gl,.pg-figure[id],.pg-sec h4[id]{scroll-margin-top:68px}
.pg-head{padding:0 16px}
.pg-head-title{white-space:normal}
.pg-split{padding:0 16px 40px}
.pg-split>.pg-menu{position:static;padding:16px 0 4px;background:none;border:0}
}
@media (max-width:860px){
.pg-sx-open{display:grid;order:1}
.pg-head .pg-sx{order:2;flex:0 0 100%;margin:0;padding:0 0 10px}
.pg-head:not([data-search]) .pg-sx{display:none}
.pg-head .pg-head-tabs{order:3;flex-basis:calc(100% + 28px)}
.pg-head .pg-sx-list{left:0;right:0;width:auto;max-width:none;top:calc(100% - 4px)}
}
@media (max-width:760px){.pg-guide .pg-top h1{font-size:25px}.pg-topic-title{font-size:22px}.pg-sec-title{font-size:20px}}
@media print{
.pg-tcards{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px;margin:10px 0}
.pg-tc{display:block;position:static;width:auto!important;max-width:none;box-shadow:none;break-inside:avoid}
.pg-tc-x,.pg-q-btn,.pg-pager,.pg-tabs{display:none}
.pg-q-a[hidden]{display:block!important}
.pg-menu,.pg-menu-toggle,.pg-head,.pg-sx,.pg-sx-open{display:none!important}
.pg-q{padding-left:0}
.pg-q::before,.pg-map-list a::after,.pg-menu a::after,.pg-checks-clear{display:none!important}
.pg-has-menu{display:block}
.pg-topic+.pg-topic{break-before:page}
.pg-topic-title,.pg-sec-title,.pg-answer,.pg-sec p:has(+.pg-figure){break-after:avoid}
}
`;

/**
 * 2つの言葉を持つ説明の頁だけの見た目 (#3899)。ヘッダーの探す欄の右に地球の印と今の言葉の釦を置き、押すと下に2つの言葉の一覧を開く。
 * 携帯の幅では釦を虫眼鏡と同じ大きさの地球の印だけにし、題が残りの幅を取る。ヘッダーの無い頁は目次の頭で探す欄の右に置く。印刷の形には出さない
 */
const STYLE_LANG = `
.pg-lang{position:relative;align-self:center;flex:none;margin-left:-36px}
.pg-lang-btn{display:flex;align-items:center;gap:6px;height:40px;box-sizing:border-box;margin:0;padding:0 8px 0 11px;border:1px solid var(--pg-line);border-radius:8px;background:var(--pg-bg);font:inherit;font-size:14px;line-height:1;color:var(--pg-ink);cursor:pointer;white-space:nowrap}
.pg-lang-btn svg{flex:none;width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.pg-lang-btn svg:last-child{width:15px;height:15px;color:var(--pg-mute)}
.pg-lang-btn:focus-visible,.pg-lang-list button:focus-visible{outline:2px solid var(--pg-t-blue);outline-offset:2px}
.pg-lang-list{position:absolute;z-index:40;right:0;top:calc(100% + 6px);min-width:170px;box-sizing:border-box;padding:6px;background:var(--pg-surf);border:1px solid var(--pg-line);border-radius:10px;box-shadow:0 12px 32px color-mix(in srgb,var(--pg-ink) 16%,transparent)}
.pg-lang-list button{display:block;width:100%;margin:0;padding:9px 12px;border:0;border-radius:6px;background:none;font:inherit;font-size:15px;line-height:1.4;text-align:left;color:var(--pg-ink);cursor:pointer}
.pg-lang-list button:hover{background:color-mix(in srgb,var(--pg-ink) 4%,transparent)}
.pg-lang-list button[aria-checked="true"]{font-weight:700;background:color-mix(in srgb,var(--pg-ink) 6%,transparent)}
.pg-menu-top{display:flex;align-items:center;gap:8px;margin:0 0 16px}
.pg-menu-top .pg-sx{flex:1 1 auto;width:auto;min-width:0;margin:0}
.pg-menu-top .pg-lang{margin-left:0}
@media (min-width:861px){.pg-head[data-wrap] .pg-lang{order:1}}
@media (max-width:860px){
.pg-head .pg-head-title{flex:1 1 0;min-width:0}
.pg-head .pg-lang{order:1}
.pg-lang-btn{width:40px;padding:0;justify-content:center}
.pg-lang-btn span,.pg-lang-btn svg:last-child{display:none}
}
@media print{.pg-lang{display:none!important}}
`;

/**
 * 説明の頁の script (#3876、#3961)。左の目次が印を付ける行 (`data-spy`。全体像と問いと、問いを持たない話題) のうち、
 * 上の縁が画面の上の縁から80pxの線を過ぎた最後の物に印 (`aria-current="true"`) を1つだけ付け、どれも過ぎていない時は最初の行に付ける。
 * 線は節へ移った時の節の上の余白 (`scroll-margin-top`) より下に置き、移った節に印が付くようにする。携帯の幅では、線を本文の上に留めた目次の釦の下から測る。目次のlinkと図の箱のlinkは頁の中の場所へ移り、頁のURLに場所の名前を残す。
 * 頁を開いた時とURLの場所の名前が変わった時は、その場所へ移る。携帯の幅の目次は釦で開け閉めし、目次のlinkを押すと畳む。
 * 用語の下線を押すと、その節の札を下線のすぐ下に開き、札の外か閉じるのアイコンか同じ下線を押すと閉じる。確かめる問いの釦は答えを開けて閉じる。
 * 話題ごとの頁に分けた説明の頁 (`pg-split`、#3983、#3991) は、URLの場所の名前が指す要素を含む話題を1つの頁として見せ、ほかの話題と頭の頁に`data-off`を付けて隠す。
 * 名前が無いか頭の頁の中を指す時は頭の頁 (全体像) を見せる。頁の上のヘッダー (`pg-head`、#4024) のタブのうち、見せている話題か全体像のタブに印 (`aria-current="true"`) を付け、
 * タブの段が横に送れる時は印の付いたタブを段の真ん中へ送る。タブが題の横に入らない幅では、タブの段を題の下へ移す印 (`data-wrap`) をヘッダーに付け、ヘッダーの高さを`--pg-head-h`に書く。
 * 左の目次は見せている話題の問いの並び (`pg-menu-group[data-topic]`) だけを出し、並びを持たない頁 (全体像と用語と問いの無い話題) は目次を出さない印 (`data-bare`) を付ける。
 * 場所の名前が話題を指す時はタブの頭へ戻り、話題の中の要素 (問いの節や用語の説明) を指す時はその要素へ移る。頁の終わりまで送った時は、見えている最後の行に印を付ける。
 * 話題のタブの中は問いごとの頁に分ける (#3998)。場所の名前が話題を指す時は話題の頭の地図の頁 (`pg-topic-head`) だけを見せ、問いの節か節の中の図を指す時はその節だけを見せ、話題の題を隠す。
 * 目次は開いた問いの行に`data-open`を付け、開いた問いの下の頁の見出しか図の題を出す (#4010)。読んでいる所の印は見出しか図の題に付け、問いの行には付けない。
 * 開いた時はブラウザがURLの場所の要素まで送るので、読み込みが終わった時にもう一度場所へ移る。
 * 検索の欄 (`pg-sx`、#3897) に語を打つと、問いの題と目次の短い名前と1文の答え、用語の名前と説明を、大文字と小文字、全角と半角を区別せずに探し、
 * 当たった問いと用語を話題ごとにまとめた一覧を欄の下に組んで、打った語の全ての所に印 (`mark`) を付ける。行を押すかEnterでその問いか用語の札へ移り、
 * ↓と↑で選ぶ行を移し、Escか欄の外を押すと一覧を閉じる。携帯の幅ではヘッダーの虫眼鏡の釦で欄を開け閉めし、欄の高さの分だけヘッダーの高さを書き直す。
 * 確かめる問いの答えを開くと、その問いを節の場所の名前と問いの字の組で覚えて印 (`data-done`) を付け、頁の置き場ごとに端末の頁の記録 (`localStorage`) に残す (#3898)。
 * 確かめる問いを持つ節の一覧と目次の行には`data-quiz`を付け、節の全ての問いに印が付くとその行にも印を付ける。印が1つでも在る時だけ印を消す釦を出し、押すと全ての印を消す。
 * 頁の記録を読み書きできない時は、印をその頁を開いている間だけ持つ。
 * `S`は見張りの設定 (`{signal}`) で、2つの言葉を持つ頁 (#3899) は言葉を替えるたびに前の見張りを外して回し直す。回し直す時は、前の回が目次に付けた印と開いた札と探す一覧を外してから始める。
 * 確かめる問いが`data-key`を持つ時は、それを覚える名前にする
 */
const GUIDE_START = `(S)=>{
const decode=(h)=>{try{return decodeURIComponent(h)}catch(e){return h}};
let opened=null;
const close=()=>{if(!opened)return;opened.card.removeAttribute("data-open");opened.term.setAttribute("aria-expanded","false");opened=null};
const open=(term)=>{const again=opened&&opened.term===term;close();if(again)return;const box=term.closest("[data-terms]");const card=box&&[...box.querySelectorAll(".pg-tc")].find((c)=>c.dataset.term===term.dataset.term);if(!card)return;const f=box.getBoundingClientRect();const r=term.getBoundingClientRect();const w=Math.min(${N.card},f.width);card.style.width=w+"px";card.style.left=Math.max(0,Math.min(r.left+r.width/2-f.left-w/2,f.width-w))+"px";card.style.top=(r.bottom-f.top+${N.gap})+"px";card.dataset.open="";term.setAttribute("aria-expanded","true");opened={term,card}};
const menu=document.querySelector(".pg-menu");
const toggle=document.querySelector(".pg-menu-toggle");
const wrap=document.querySelector(".pg-split");
const head=document.querySelector(".pg-head");
const title=head?head.querySelector(".pg-head-title"):null;
const row=head?head.querySelector(".pg-head-tabs"):null;
const tabs=row?[...row.querySelectorAll("a")]:[];
const links=menu?[...menu.querySelectorAll("a[data-spy]")]:[];
const targets=links.map((a)=>document.getElementById(decode(a.getAttribute("href").slice(1))));
const phone=matchMedia("(max-width:860px)");
const fold=(on)=>{if(toggle)toggle.setAttribute("aria-expanded",String(!on))};
let marked=null;
const main=wrap?wrap.querySelector(":scope>.pg-main"):null;
const heads=wrap?[...wrap.querySelectorAll(":scope>.pg-top,:scope>.pg-overview,:scope>.pg-start")]:[];
const off=(el,on)=>{if(on)el.setAttribute("data-off","");else el.removeAttribute("data-off")};
const idOf=(a)=>decode(a.getAttribute("href").slice(1));
const groups=menu&&wrap?[...menu.querySelectorAll(".pg-menu-group[data-topic]")]:[];
const pages=menu&&wrap?[...menu.querySelectorAll(".pg-menu-q")]:[];
const topicOf=(el)=>!el||!main||!main.contains(el)?null:el.closest(".pg-topic");
const sx=document.querySelector(".pg-sx");
const sxIn=sx?sx.querySelector("input"):null;
const sxList=sx?sx.querySelector(".pg-sx-list"):null;
const sxOpen=document.querySelector(".pg-sx-open");
const sxMenu=!!(sx&&sx.closest(".pg-menu"));
for(const a of links)a.removeAttribute("aria-current");for(const c of document.querySelectorAll(".pg-tc[data-open]"))c.removeAttribute("data-open");for(const b of document.querySelectorAll('.pg-term[aria-expanded="true"]'))b.setAttribute("aria-expanded","false");if(sxList)sxList.hidden=true;
const layoutHead=()=>{if(!head||!row||!title)return;head.removeAttribute("data-wrap");const below=!sxMenu&&!!sx&&sx.offsetParent!==null&&sx.offsetTop>=title.offsetTop+title.offsetHeight-4;if(row.offsetTop>title.offsetTop+4||below)head.setAttribute("data-wrap","");document.documentElement.style.setProperty("--pg-head-h",head.offsetHeight+"px")};
const showTab=()=>{const now=tabs.find((a)=>a.getAttribute("aria-current")==="true");if(!now||row.scrollWidth<=row.clientWidth)return;const r=row.getBoundingClientRect();const c=now.getBoundingClientRect();row.scrollLeft+=c.left-r.left-(r.width-c.width)/2};
const show=(topic,sec)=>{for(const h of heads)off(h,!!topic);off(main,!topic);for(const t of main.querySelectorAll(":scope>.pg-topic"))off(t,t!==topic);
if(topic){const name=topic.querySelector(":scope>.pg-topic-title");if(name)off(name,!!sec);const map=topic.querySelector(":scope>.pg-topic-head");if(map)off(map,!!sec);for(const s of topic.querySelectorAll(":scope>.pg-sec"))off(s,s!==sec)}
for(const g of groups)g.hidden=!topic||g.dataset.topic!==topic.id;wrap.toggleAttribute("data-bare",!groups.some((g)=>!g.hidden));
for(const a of pages){const on=!!sec&&idOf(a)===sec.id;a.toggleAttribute("data-open",on);const list=a.nextElementSibling;if(list)list.hidden=!on}
const at=topic?topic.id:tabs[0]?idOf(tabs[0]):"";for(const a of tabs){if(idOf(a)===at)a.setAttribute("aria-current","true");else a.removeAttribute("aria-current")}showTab()};
const spy=()=>{const line=(phone.matches&&toggle&&!wrap?toggle.offsetHeight+16:0)+(head?head.offsetHeight:0)+(wrap?120:80);const shown=links.map((a,i)=>[a,targets[i]]).filter(([,t])=>t&&!(wrap&&t.closest("[data-off]")));let now=shown.length>0?shown[0][0]:null;for(const [a,t] of shown)if(t.getBoundingClientRect().top<=line)now=a;
if(wrap&&shown.length>0&&innerHeight+scrollY>=document.documentElement.scrollHeight-2)now=shown[shown.length-1][0];if(now===marked)return;if(marked)marked.removeAttribute("aria-current");marked=now;if(!now)return;now.setAttribute("aria-current","true");if(phone.matches)return;const m=menu.getBoundingClientRect();const r=now.getBoundingClientRect();if(r.top<m.top||r.bottom>m.bottom)menu.scrollTop+=r.top-m.top-m.height/3};
let queued=false;
addEventListener("scroll",()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;spy();sxPlace()})},{passive:true,...S});
addEventListener("resize",()=>{layoutHead();showTab();spy();sxPlace()},S);
const go=()=>{const h=decode(location.hash.slice(1));const target=h?document.getElementById(h):null;
if(wrap&&main){const topic=topicOf(target);const sec=topic&&target!==topic?target.closest(".pg-sec"):null;show(topic,sec);if(target&&topic&&target!==topic&&target!==sec)target.scrollIntoView();else scrollTo(0,0);spy();return}
if(target)target.scrollIntoView();spy()};
const norm=(text)=>{let out="";const at=[];const end=[];let i=0;for(const ch of text){const n=ch.normalize("NFKC").toLowerCase();for(let k=0;k<n.length;k++){out+=n[k];at.push(i);end.push(i+ch.length)}i+=ch.length}return{out,at,end}};
const paint=(el,text,q)=>{const n=norm(text);let from=0;let last=0;for(;;){const a=n.out.indexOf(q,from);if(a<0)break;const s=n.at[a];const e=n.end[a+q.length-1];if(s>=last){if(s>last)el.append(text.slice(last,s));const m=document.createElement("mark");m.textContent=text.slice(s,e);el.append(m);last=e}from=a+q.length}if(last<text.length)el.append(text.slice(last))};
const textOf=(el)=>el?el.textContent.replace(/\\s+/g," ").trim():"";
const sxGroups=[];
if(sx)for(const topic of document.querySelectorAll(".pg-main .pg-topic")){const items=[];
for(const sec of topic.querySelectorAll(".pg-sec")){const short=menu?[...menu.querySelectorAll("a.pg-menu-q")].find((a)=>idOf(a)===sec.id):null;const name=textOf(sec.querySelector(".pg-sec-title"));const answer=textOf(sec.querySelector(":scope>.pg-answer"));items.push({id:sec.id,name,sub:answer,keys:[name,textOf(short&&short.querySelector(".pg-menu-name")),answer].map((k)=>norm(k).out)})}
for(const card of topic.querySelectorAll(".pg-gl")){const name=textOf(card.querySelector(".pg-gl-n"));const meaning=textOf(card.querySelector(".pg-gl-t"));items.push({id:card.id,name,sub:meaning,keys:[name,meaning].map((k)=>norm(k).out)})}
if(items.length>0)sxGroups.push({name:textOf(topic.querySelector(":scope>.pg-topic-title")),style:topic.getAttribute("style")||"",kind:topic.querySelector(".pg-gl")?"t":"q",items})}
let sxRows=[];let sxAt=-1;
const sxPlace=()=>{if(!sxMenu||!sxList||sxList.hidden)return;const r=sxIn.getBoundingClientRect();sxList.style.left=r.left+"px";sxList.style.top=(r.bottom+6)+"px";sxList.style.width=Math.max(0,Math.min(440,innerWidth-r.left-16))+"px"};
const sxShow=(on)=>{sxList.hidden=!on;sxIn.setAttribute("aria-expanded",String(on));if(on)sxPlace();else{sxAt=-1;sxIn.removeAttribute("aria-activedescendant")}};
const sxPick=(i)=>{sxAt=i;sxRows.forEach((r,k)=>r.setAttribute("aria-selected",String(k===i)));const r=sxRows[i];if(!r)return;sxIn.setAttribute("aria-activedescendant",r.id);r.scrollIntoView({block:"nearest"})};
const sxFind=()=>{const word=sxIn.value.trim();const q=norm(word).out;sxList.replaceChildren();sxRows=[];if(!q){sxShow(false);return}
let g=0;for(const group of sxGroups){const hits=group.items.filter((it)=>it.keys.some((k)=>k.includes(q)));if(hits.length===0)continue;
const box=document.createElement("div");box.className="pg-sx-g";box.setAttribute("role","group");box.dataset.kind=group.kind;if(group.style)box.setAttribute("style",group.style);
const h=document.createElement("div");h.className="pg-sx-h";h.id="pg-sx-h"+g;g+=1;box.setAttribute("aria-labelledby",h.id);const name=document.createElement("span");name.textContent=group.name;h.append(name," "+hits.length);box.append(h);
for(const it of hits){const a=document.createElement("a");a.className="pg-sx-r";a.setAttribute("role","option");a.id="pg-sx-o"+sxRows.length;a.href="#"+it.id;a.tabIndex=-1;const n=document.createElement("span");n.className="pg-sx-n";paint(n,it.name,q);a.append(n);if(it.sub){const d=document.createElement("span");d.className="pg-sx-s";paint(d,it.sub,q);a.append(d)}box.append(a);sxRows.push(a)}
sxList.append(box)}
if(sxRows.length===0){const none=document.createElement("p");none.className="pg-sx-none";none.textContent=sx.dataset.none.replace("{}",()=>word);sxList.append(none)}
sxShow(true);sxPick(sxRows.length>0?0:-1)};
const sxFold=(on)=>{head.toggleAttribute("data-search",!on);sxOpen.setAttribute("aria-expanded",String(!on));layoutHead();if(!on)sxIn.focus()};
if(sxIn){sxIn.addEventListener("input",sxFind,S);sxIn.addEventListener("focus",()=>{if(sxIn.value.trim())sxFind()},S);
sxIn.addEventListener("keydown",(event)=>{const k=event.key;
if(k==="ArrowDown"||k==="ArrowUp"){event.preventDefault();if(sxList.hidden){sxFind();return}if(sxRows.length>0)sxPick(k==="ArrowDown"?Math.min(sxAt+1,sxRows.length-1):Math.max(sxAt-1,0));return}
if(k==="Enter"){event.preventDefault();const r=sxRows[sxAt];if(r&&!sxList.hidden)r.click();return}
if(k==="Escape"){event.preventDefault();event.stopPropagation();if(!sxList.hidden)sxShow(false);else if(phone.matches&&!sxMenu)sxFold(true)}},S)}
if(sxMenu)menu.addEventListener("scroll",sxPlace,{passive:true,...S});
const store="dragon-guide-checks:"+location.pathname;
const quizRows=[...document.querySelectorAll(".pg-q")];
const quizKey=(row)=>row.dataset.key||((row.closest(".pg-sec,.pg-topic")||{id:""}).id+"\\n"+textOf(row.querySelector(".pg-q-text")));
const checks=(()=>{let saved=[];try{const v=JSON.parse(localStorage.getItem(store)||"[]");if(Array.isArray(v))saved=v}catch(e){}const known=new Set(quizRows.map(quizKey));return new Set(saved.filter((k)=>known.has(k)))})();
const saveChecks=()=>{try{if(checks.size>0)localStorage.setItem(store,JSON.stringify([...checks]));else localStorage.removeItem(store)}catch(e){}};
const paintChecks=()=>{for(const row of quizRows)row.toggleAttribute("data-done",checks.has(quizKey(row)));
const rows=[...document.querySelectorAll(".pg-map-list a,.pg-menu a.pg-menu-q")];
for(const sec of document.querySelectorAll(".pg-sec")){const qs=[...sec.querySelectorAll(".pg-q")];if(qs.length===0)continue;const done=qs.every((q)=>q.hasAttribute("data-done"));for(const a of rows)if(idOf(a)===sec.id){a.setAttribute("data-quiz","");a.toggleAttribute("data-done",done)}}
for(const c of document.querySelectorAll(".pg-checks-clear"))c.hidden=checks.size===0};
paintChecks();
document.addEventListener("click",(event)=>{const t=event.target;
if(sx){const pick=t.closest?.(".pg-sx-r");if(pick){sxShow(false);if(phone.matches&&!sxMenu)sxFold(true);if(idOf(pick)===decode(location.hash.slice(1))){event.preventDefault();go()}}
else if(t.closest?.(".pg-sx-open")){sxFold(head.hasAttribute("data-search"));return}
else if(!t.closest?.(".pg-sx"))sxShow(false)}
const term=t.closest?.(".pg-term");if(term){open(term);return}
if(opened&&(t.closest?.(".pg-tc-x")||!opened.card.contains(t)))close();
const q=t.closest?.(".pg-q-btn");if(q){const a=document.getElementById(q.getAttribute("aria-controls"));const on=a.hidden;a.hidden=!on;q.setAttribute("aria-expanded",String(on));q.textContent=on?q.dataset.hide:q.dataset.show;const row=q.closest(".pg-q");if(on&&row){checks.add(quizKey(row));saveChecks();paintChecks()}return}
if(t.closest?.(".pg-checks-clear button")){checks.clear();saveChecks();paintChecks();return}
if(t.closest?.(".pg-menu-toggle")){fold(toggle.getAttribute("aria-expanded")==="true");return}
if(t.closest?.(".pg-menu a"))fold(true)},S);
document.addEventListener("keydown",(event)=>{if(event.key==="Escape"){close();fold(true)}},S);
document.addEventListener("dragon-scene",(event)=>{const name=event.detail?.scene;const sec=event.target.closest?.(".pg-sec");if(!name||!sec)return;
for(const fig of sec.querySelectorAll(".dragon-figure")){const root=fig.querySelector(".dragon-frame")?.shadowRoot??fig;
const player=[...root.querySelectorAll('[data-dragon="player"]')].find((p)=>[...p.querySelectorAll('[data-dragon="scene"]')].some((s)=>s.dataset.scene===name));if(!player)continue;
const behavior=matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth";
const panel=player.dataset.scenes==="stack"?[...player.querySelectorAll('[data-dragon="scene"]')].find((s)=>s.dataset.scene===name):null;
if(panel)panel.scrollIntoView({behavior,block:"center"});else(fig.closest(".pg-figure")??fig).scrollIntoView({behavior,block:"start"});
player.dispatchEvent(new CustomEvent("dragon-follow",{detail:{scene:name}}));return}},S);
addEventListener("hashchange",go,S);
layoutHead();
go();
if(wrap)addEventListener("load",()=>{layoutHead();go()},S);
}`;

/** 1つの言葉の説明の頁の script。見張りを外す印 (`signal`) を渡さずに1度だけ回す */
const RUNTIME_GUIDE = `(${GUIDE_START})({});`;

/**
 * 日本語と英語を持つ説明の頁の script (#3899)。頁の中身は1つの言葉の分だけを置き、もう一方は`<template id="pg-lang-other">`に持つ。
 * 開いた時は、URLの場所の名前を持つ言葉、覚えた言葉 (`localStorage`の`dragon-guide-lang:<置き場>`)、ブラウザの言葉の順に言葉を決め、図を描く前に中身を入れ替える。
 * 確かめる問いは、先に渡した言葉の問いの覚える名前を両方の言葉の同じ何番目の問いに`data-key`で付け、印を2つの言葉で同じにする。
 * ヘッダーか目次の頭の釦 (`pg-lang-btn`) を押すと一覧を開け閉めし、一覧の外を押すかEscで閉じる。言葉を選ぶと、読んでいる所 (ヘッダーの下の線を過ぎた最後の問いの節、
 * `####`の見出し、題を持つ図、用語の説明。URLの場所の名前が指す要素が画面に見えていて、それより後ならそれ) を話題と節と見出しの何番目かで覚え、
 * 中身を入れ替えてもう一方の言葉の同じ所の場所の名前をURLに書き、説明の頁の script を回し直す。図を描くscriptへ`dragon-blocks`を送り、差し込んだ図を描かせる。
 * 図が描けて高さが変わる間は、見出しか図か用語へ移った所を画面の上に保つ。頁を読み直さない
 */
const RUNTIME_PAIR = `(()=>{
const start=${GUIDE_START};
const tpl=document.getElementById("pg-lang-other");
const root=document.documentElement;
const other=tpl.dataset.lang;
const decode=(h)=>{try{return decodeURIComponent(h)}catch(e){return h}};
const store="dragon-guide-lang:"+location.pathname;
const kept={[other]:[...tpl.content.childNodes]};
const titles={[root.lang]:document.title,[other]:tpl.dataset.title||document.title};
const textOf=(el)=>el?el.textContent.replace(/\\s+/g," ").trim():"";
const firstRows=[...document.querySelectorAll(".pg-q")];
const keys=firstRows.map((row)=>(row.closest(".pg-sec,.pg-topic")||{id:""}).id+"\\n"+textOf(row.querySelector(".pg-q-text")));
firstRows.forEach((row,i)=>{row.dataset.key=keys[i]});
[...tpl.content.querySelectorAll(".pg-q")].forEach((row,i)=>{if(keys[i]!==undefined)row.dataset.key=keys[i]});
const live=()=>{const nodes=[];for(let n=document.body.firstChild;n&&n!==tpl;n=n.nextSibling)nodes.push(n);return nodes};
const swap=(to)=>{const from=root.lang;if(to===from||!kept[to])return;const now=live();for(const n of now)n.remove();for(const n of kept[to])document.body.insertBefore(n,tpl);kept[from]=now;root.lang=to;document.title=titles[to]};
const topics=()=>[...document.querySelectorAll(".pg-main>.pg-topic")];
const seen=(el)=>!!el&&el.checkVisibility();
const here=()=>{const head=document.querySelector(".pg-head");const line=(seen(head)?head.getBoundingClientRect().bottom:0)+24;let pick=null;
for(const el of document.querySelectorAll(".pg-main .pg-sec,.pg-main .pg-sec h4[id],.pg-main .pg-figure[id],.pg-main .pg-gl"))if(seen(el)&&el.getBoundingClientRect().top<=line)pick=el;
const h=decode(location.hash.slice(1));const t=h?document.getElementById(h):null;
if(seen(t)){const r=t.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0&&(!pick||pick===t||pick.compareDocumentPosition(t)&Node.DOCUMENT_POSITION_FOLLOWING))return t}
return pick||(seen(t)?t:null)||topics().find(seen)||document.querySelector(".pg-overview")};
const where=(el)=>{const topic=el?el.closest(".pg-main>.pg-topic"):null;if(!topic)return el&&el.closest(".pg-overview")?["o"]:[];const i=topics().indexOf(topic);if(el===topic)return ["t",i];
const gl=el.closest(".pg-gl");if(gl)return ["g",i,[...topic.querySelectorAll(".pg-gl")].indexOf(gl)];
const sec=el.closest(".pg-sec");if(!sec)return ["t",i];const j=[...topic.querySelectorAll(":scope>.pg-sec")].indexOf(sec);
if(el.matches("h4[id]"))return ["h",i,j,[...sec.querySelectorAll("h4[id]")].indexOf(el)];
if(el.matches(".pg-figure[id]"))return ["f",i,j,[...sec.querySelectorAll(".pg-figure[id]")].indexOf(el)];return ["s",i,j]};
const find=(at)=>{if(at[0]==="o")return (document.querySelector(".pg-overview")||{id:""}).id;const topic=topics()[at[1]];if(!topic)return "";if(at[0]==="t")return topic.id;
if(at[0]==="g")return ([...topic.querySelectorAll(".pg-gl")][at[2]]||topic).id;const sec=[...topic.querySelectorAll(":scope>.pg-sec")][at[2]];if(!sec)return topic.id;
const inner=at[0]==="h"?[...sec.querySelectorAll("h4[id]")][at[3]]:at[0]==="f"?[...sec.querySelectorAll(".pg-figure[id]")][at[3]]:null;return (inner||sec).id};
const hold=(id)=>{const t=id?document.getElementById(id):null;if(!t||t.matches(".pg-sec,.pg-topic,.pg-overview")||typeof ResizeObserver!=="function")return;
const ro=new ResizeObserver(()=>t.scrollIntoView());ro.observe(document.querySelector(".pg-main")||document.body);
const stop=()=>{ro.disconnect();for(const k of ["wheel","touchstart","keydown"])removeEventListener(k,stop)};for(const k of ["wheel","touchstart","keydown"])addEventListener(k,stop,{passive:true});setTimeout(stop,3000)};
let ac=null;
const run=()=>{if(ac)ac.abort();ac=new AbortController();start({signal:ac.signal})};
const fold=(shut)=>{const b=document.querySelector(".pg-lang-btn");const l=document.querySelector(".pg-lang-list");if(!b||!l)return;b.setAttribute("aria-expanded",String(!shut));l.hidden=shut};
const choose=(to)=>{fold(true);if(to===root.lang||!kept[to])return;const at=where(here());swap(to);const id=find(at);
history.replaceState(history.state,"",id?"#"+id:location.pathname+location.search);try{localStorage.setItem(store,to)}catch(e){}
run();document.dispatchEvent(new Event("dragon-blocks"));hold(id)};
const first=(()=>{const h=decode(location.hash.slice(1));if(h){if(document.getElementById(h))return root.lang;if(tpl.content.getElementById(h))return other}
let saved=null;try{saved=localStorage.getItem(store)}catch(e){}if(saved===root.lang||saved===other)return saved;
const nav=((navigator.languages&&navigator.languages[0])||navigator.language||"").toLowerCase();return nav.startsWith("ja")?"ja":"en"})();
swap(first);
document.addEventListener("click",(event)=>{const t=event.target;if(t.closest?.(".pg-lang-btn")){fold(document.querySelector(".pg-lang-btn").getAttribute("aria-expanded")==="true");return}
const row=t.closest?.(".pg-lang-list [lang]");if(row){choose(row.getAttribute("lang"));return}if(!t.closest?.(".pg-lang"))fold(true)});
document.addEventListener("keydown",(event)=>{if(event.key==="Escape")fold(true)});
run();
})();`;

/**
 * 見せる頁とタブを選ぶ script。頁のURLの `#` の後ろの `項目/タブ/中のタブ` を読み、無い場所の名前は入口を開く。
 * 頁の link (`href="#…"`) は URL を変えて頁を移り、タブを押すと URL を書き換えて履歴を増やさない。
 * 見ていない頁とタブは `hidden` で隠し、図は見えた時に頁の script の1行の入口が描く
 */
const RUNTIME = `(()=>{
const pages=[...document.querySelectorAll("[data-page]")];
const byId=new Map(pages.map((p)=>[p.dataset.page,p]));
const path=()=>{let h=location.hash.slice(1);try{h=decodeURIComponent(h)}catch(e){}return h.split("/")};
const listIn=(scope,level)=>scope&&scope.querySelector('[role="tablist"][data-level="'+level+'"]');
const panelOf=(tab)=>document.getElementById(tab.getAttribute("aria-controls"));
const select=(tab)=>{for(const t of tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')){const on=t===tab;t.setAttribute("aria-selected",String(on));t.tabIndex=on?0:-1;panelOf(t).hidden=!on}};
const chain=(page)=>{const names=[];let scope=page;for(const level of [4,5]){const tab=listIn(scope,level)?.querySelector('[aria-selected="true"]');if(!tab)break;names.push(tab.dataset.tab);scope=panelOf(tab)}return names};
const mark=(id)=>{const group=byId.get(id).dataset.group;for(const a of document.querySelectorAll(".pg-toc a[data-to]")){if(a.dataset.to===id)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")}for(const a of document.querySelectorAll(".pg-groups a"))a.setAttribute("aria-selected",String(a.dataset.group===undefined?id==="":a.dataset.group===group))};
const route=(first)=>{const [asked="",...rest]=path();const id=byId.has(asked)?asked:"";const page=byId.get(id);if(page.hidden){for(const p of pages)p.hidden=p!==page;if(!first)scrollTo(0,0)}let scope=page;for(const [n,name] of (id===asked?rest:[]).entries()){const tab=[...(listIn(scope,4+n)?.querySelectorAll('[role="tab"]')??[])].find((t)=>t.dataset.tab===name);if(!tab)break;select(tab);scope=panelOf(tab)}mark(id)};
document.addEventListener("click",(event)=>{const tab=event.target.closest?.('.pg-tablist [role="tab"]');if(!tab)return;select(tab);const page=tab.closest("[data-page]");history.replaceState(null,"","#"+[page.dataset.page,...chain(page)].join("/"))});
document.addEventListener("keydown",(event)=>{const tab=event.target.closest?.('.pg-tablist [role="tab"]');if(!tab)return;const tabs=[...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')];const i=tabs.indexOf(tab);const to={ArrowRight:i+1,ArrowLeft:i-1,Home:0,End:tabs.length-1}[event.key];if(to===undefined)return;event.preventDefault();const next=tabs[(to+tabs.length)%tabs.length];next.focus();next.click()});
addEventListener("hashchange",()=>route(false));
route(true);
})();`;

/** link を持たない HTML にする。札は link なので、中に link を入れない */
export const withoutLinks = (html: string): string => html.replace(/<\/?a\b[^>]*>/gu, "");

/** タブの並びと中身。`counter` は頁の中で重ならない要素の名前を配る */
function tabsHtml(tabs: readonly RenderedTab[], level: 4 | 5, counter: { n: number }, pills = false): string {
  if (tabs.length === 0) return "";
  const named = tabs.map((tab) => ({ tab, n: counter.n++ }));
  const buttons = named
    .map(({ tab, n }, i) => `<button type="button" role="tab" id="pg-t${n}" aria-controls="pg-p${n}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-tab="${escapeHtml(tab.id)}">${tab.name}</button>`)
    .join("");
  const panels = named
    .map(({ tab, n }, i) => `<div role="tabpanel" class="pg-panel" id="pg-p${n}" aria-labelledby="pg-t${n}" data-level="${level}" data-tab="${escapeHtml(tab.id)}"${i === 0 ? "" : " hidden"}>${tab.body}${level === 4 ? tabsHtml(tab.tabs, 5, counter) : ""}</div>`)
    .join("");
  return `<div class="pg-tabs"><div role="tablist" data-level="${level}" class="pg-tablist pg-tablist-${level}${pills ? " pg-pills" : ""}">${buttons}</div>${panels}</div>`;
}

/** 入口の段ごとの項目の札 */
function cardsHtml(page: RenderedPage): string {
  const words = WORDS[page.lang];
  const rows = page.groups
    .map((group, g) => {
      const cards = group.items.map((item) => `<a class="pg-card" href="#${escapeHtml(item.id)}"><span class="pg-card-name">${withoutLinks(item.name)}</span>${item.summary ? `<span class="pg-card-lead">${item.summary}</span>` : ""}</a>`).join("");
      return `<div class="pg-group" style="${groupColor(g)}"><div><span class="pg-group-name">${group.name}</span>${group.lead ? `<div class="pg-group-lead">${group.lead}</div>` : ""}</div><div class="pg-cards">${cards}</div></div>`;
    })
    .join("");
  return page.groups.length === 0 ? "" : `<h2 class="pg-choose">${escapeHtml(words.choose)}</h2><div class="pg-groups-grid">${rows}</div>`;
}

/** 項目の頁の中身。題と最初の段落と `####` のタブと、前と次の項目への link */
function itemHtml(page: RenderedPage, item: RenderedItem, counter: { n: number }, before = ""): string {
  const all = page.groups.flatMap((g) => g.items);
  const at = all.indexOf(item);
  const prev = all[at - 1];
  const next = all[at + 1];
  const group = page.groups[item.group] as RenderedGroup;
  const link = (to: RenderedItem | undefined, text: (name: string) => string): string => (to ? `<a href="#${escapeHtml(to.id)}">${text(withoutLinks(to.name))}</a>` : "<span></span>");
  return (
    `<section class="pg-page pg-item" data-page="${escapeHtml(item.id)}" data-group="${item.group}" style="${groupColor(item.group)}" hidden>` +
    before +
    `<div class="pg-item-head"><h2 class="pg-item-name">${item.name}</h2><span class="pg-item-count"><span>${withoutLinks(group.name)}</span> ${at + 1} / ${all.length}</span></div>` +
    (item.lead ? `<div class="pg-item-lead">${item.lead}</div>` : "") +
    tabsHtml(item.tabs, 4, counter) +
    `<nav class="pg-pager">${link(prev, (name) => `← ${name}`)}${link(next, (name) => `${name} →`)}</nav></section>`
  );
}

function entryLayout(page: RenderedPage, counter: { n: number }): string {
  const words = WORDS[page.lang];
  const entry =
    `<section class="pg-page pg-entry" data-page=""><header class="pg-top"><h1>${page.title}</h1>${page.entry.lead ? `<div class="pg-lead">${page.entry.lead}</div>` : ""}</header>` +
    tabsHtml(page.entry.tabs, 4, counter, true) +
    cardsHtml(page) +
    "</section>";
  const items = page.groups
    .flatMap((group) => group.items.map((item) => itemHtml(page, item, counter, `<nav class="pg-crumbs"><a class="pg-back" href="#">← ${escapeHtml(words.overview)}</a><span>${withoutLinks(group.name)}</span><span>${withoutLinks(item.name)}</span></nav>`)))
    .join("");
  return `<div class="pg-wrap">${entry}${items}</div>`;
}

function sidebarLayout(page: RenderedPage, counter: { n: number }): string {
  const words = WORDS[page.lang];
  const groups = page.groups
    .map((group, g) => {
      const links = group.items.map((item) => `<a href="#${escapeHtml(item.id)}" data-to="${escapeHtml(item.id)}"><span class="pg-card-name">${withoutLinks(item.name)}</span>${item.summary ? `<span class="pg-card-lead">${item.summary}</span>` : ""}</a>`).join("");
      return `<div class="pg-toc-group" style="${groupColor(g)}"><div class="pg-toc-name">${withoutLinks(group.name)}</div>${links}</div>`;
    })
    .join("");
  const toc = `<nav class="pg-toc pg-nav" aria-label="${escapeHtml(words.contents)}"><a class="pg-toc-top" href="#" data-to="" aria-current="page">${escapeHtml(words.overview)}</a>${groups}</nav>`;
  const entry = `<section class="pg-page pg-entry" data-page=""><h2 class="pg-page-title">${escapeHtml(words.overview)}</h2>${tabsHtml(page.entry.tabs, 4, counter, true)}</section>`;
  const items = page.groups.flatMap((group) => group.items.map((item) => itemHtml(page, item, counter))).join("");
  return (
    `<header class="pg-bar"><div class="pg-bar-in"><h1>${page.title}</h1></div></header>` +
    `<div class="pg-layout">${toc}<main class="pg-main">${page.entry.lead ? `<div class="pg-lead">${page.entry.lead}</div>` : ""}${entry}${items}</main></div>`
  );
}

function tabsLayout(page: RenderedPage, counter: { n: number }): string {
  const words = WORDS[page.lang];
  const total = page.groups.reduce((n, g) => n + g.items.length, 0);
  const groupTabs = page.groups
    .map((group, g) => {
      const first = group.items[0];
      return first
        ? `<a role="tab" href="#${escapeHtml(first.id)}" data-group="${g}" aria-selected="false" style="${groupColor(g)}"><span class="pg-t">${withoutLinks(group.name)}</span><span class="pg-s">${escapeHtml(words.count(group.items.length))}</span></a>`
        : "";
    })
    .join("");
  const nav = `<nav class="pg-groups pg-nav" role="tablist"><a role="tab" href="#" data-to="" aria-selected="true"><span class="pg-t">${escapeHtml(words.overview)}</span><span class="pg-s">${escapeHtml(words.count(total))}</span></a>${groupTabs}</nav>`;
  const entry = `<section class="pg-page pg-entry" data-page="">${tabsHtml(page.entry.tabs, 4, counter, true)}${cardsHtml(page)}</section>`;
  const items = page.groups
    .flatMap((group, g) =>
      group.items.map((item) => {
        const chips = group.items
          .map((other) => `<a role="tab" href="#${escapeHtml(other.id)}" aria-selected="${other === item}"><span class="pg-card-name">${withoutLinks(other.name)}</span>${other.summary ? `<span class="pg-card-lead">${other.summary}</span>` : ""}</a>`)
          .join("");
        const lead = `<p class="pg-stage-lead"><b>${withoutLinks(group.name)}</b>${group.summary}</p>`;
        return itemHtml(page, item, counter, `${lead}<nav class="pg-chips" role="tablist" style="${groupColor(g)}">${chips}</nav>`);
      }),
    )
    .join("");
  return `<div class="pg-wrap"><header class="pg-top"><h1>${page.title}</h1>${page.entry.lead ? `<div class="pg-lead">${page.entry.lead}</div>` : ""}</header>${nav}${entry}${items}</div>`;
}

/** 閉じるのアイコンの線 (24 の升の中の 2 本の斜めの線)。図の箱の札の閉じるのアイコンと同じ */
const CLOSE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>';

/** 下線が開く用語の札を並べた所。画面では押した札だけを下線の下に開き、印刷の形では全てを並べて開く */
function termCards(terms: readonly RenderedTerm[], lang: PageLang): string {
  if (terms.length === 0) return "";
  const close = escapeHtml(WORDS[lang].close);
  const cards = terms
    .map(
      (term) =>
        `<div class="pg-tc" role="dialog" aria-label="${escapeHtml(term.label)}" data-term="${escapeHtml(term.key)}">` +
        `<button type="button" class="pg-tc-x" aria-label="${close}" title="${close}">${CLOSE_ICON}</button>` +
        `<p class="pg-tc-n">${term.name}</p><div class="pg-tc-t">${term.text}</div>${term.example === undefined ? "" : `<div class="pg-tc-e">${term.example}</div>`}</div>`,
    )
    .join("");
  return `<div class="pg-tcards">${cards}</div>`;
}

/** 携帯の幅で目次を開け閉めする釦の矢印 (24の升の中の下向きの折れ線) */
/** 検索の欄と、携帯の幅で欄を開く釦の虫眼鏡 (#3897) */
const SEARCH_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>';

/** 言葉を替える釦の地球の印 (#3899) */
const GLOBE_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.2 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.2-3.6-8.5S9.6 5.8 12 3.5z"/></svg>';

/**
 * 説明の頁の検索の欄 (#3897)。欄 (`role="combobox"`) と、欄に打った語で頁の script が組む一覧 (`role="listbox"`)。
 * 当たる物が無い時の字は`data-none`に持ち、`{}`を打った語に置き換える
 */
function searchHtml(lang: PageLang): string {
  const words = WORDS[lang];
  const label = escapeHtml(words.search);
  return (
    `<div class="pg-sx" id="pg-sx" data-none="${escapeHtml(words.searchNone)}"><div class="pg-sx-box">${SEARCH_ICON}` +
    `<input type="search" class="pg-sx-in" placeholder="${label}" aria-label="${label}" role="combobox" aria-expanded="false" aria-controls="pg-sx-list" aria-autocomplete="list" autocomplete="off" spellcheck="false"></div>` +
    `<div class="pg-sx-list" id="pg-sx-list" role="listbox" aria-label="${label}" hidden></div></div>`
  );
}

/** 携帯の幅で、ヘッダーの題の右に置いて検索の欄を開く釦 (#3897) */
const searchOpenHtml = (lang: PageLang): string => {
  const label = escapeHtml(WORDS[lang].search);
  return `<button type="button" class="pg-sx-open" aria-label="${label}" title="${label}" aria-expanded="false" aria-controls="pg-sx">${SEARCH_ICON}</button>`;
};

const FOLD_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6"/></svg>';

/**
 * 2つの言葉を持つ頁の、言葉を替える釦と一覧 (#3899)。釦は地球の印と今の言葉の名前と下向きの矢印を持ち、押すと2つの言葉の行を開く。
 * 行は言葉の名前をその言葉で書き、`lang`に言葉を持つ。今の言葉の行は`aria-checked="true"`
 */
function langHtml(lang: PageLang): string {
  const label = escapeHtml(WORDS[lang].language);
  const rows = (["ja", "en"] as const)
    .map((to) => `<button type="button" role="menuitemradio" lang="${to}" aria-checked="${to === lang}">${LANG_NAMES[to]}</button>`)
    .join("");
  return (
    `<div class="pg-lang"><button type="button" class="pg-lang-btn" aria-haspopup="menu" aria-expanded="false" aria-controls="pg-lang-list" aria-label="${label} ${LANG_NAMES[lang]}" title="${label}">` +
    `${GLOBE_ICON}<span>${LANG_NAMES[lang]}</span>${FOLD_ICON}</button><div class="pg-lang-list" id="pg-lang-list" role="menu" aria-label="${label}" hidden>${rows}</div></div>`
  );
}

/** 字の飾りだけを残し、link と下線の釦を外した HTML。一覧の行は link なので、中に押せる物を入れない */
const plainInline = (html: string): string => html.replace(/<(?!\/?(?:code|strong|em|b|i)\b)[^>]*>/gu, "");

/** 図の塊の HTML (`figureHtml`) から、逃がした図の原本の字を取り出す。図の無い時は空の字 */
const figureSource = (html: string): string => /<pre class="dragon"[^>]*>([\s\S]*?)<\/pre>/u.exec(html)?.[1] ?? "";

/** 図の原本の中に、箱の飛び先 (`link:`、#3199) が `#<場所の名前>` を指す行が在るか。原本は HTML に逃がした字のまま読む */
function linksTo(source: string, id: string): boolean {
  const place = escapeHtml(`#${id}`).replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  return new RegExp(`\\blink:\\s*(?:&quot;)?${place}(?:&quot;)?\\s*[,\\]]`, "u").test(source);
}

/**
 * 話題のタブの頭の地図 (#3991)。全体像の図のうちこの話題への`link:`を持つ箱だけに色を残した止め絵と、問いの目次の名前と答えの1文を順に並べた一覧。番号は付けない (#4024)。
 * 止め絵は全体像の図と同じ原本を`data-still`と`data-focus`で描き、この話題を指す箱が無い時は置かない。問いを持たない話題は地図を持たない
 */
function mapHtml(topic: RenderedTopic, lang: PageLang, overview: string): string {
  if (topic.sections.length === 0) return "";
  const source = figureSource(overview);
  // 全体像の図が箱の説明を札で見せる (`note: pop`) 時は、止め絵も箱の説明を箱の下に書かずに全体像と同じ大きさの箱で描く
  const pop = /<pre class="dragon"[^>]*\sdata-note="pop"/u.test(overview) ? ' data-note="pop"' : "";
  const still = source && linksTo(source, topic.id) ? `<div class="pg-map-figure"><pre class="dragon" data-still${pop} data-focus="${escapeHtml(`#${topic.id}`)}">${source}</pre></div>` : "";
  const rows = topic.sections
    .map(
      (section) =>
        `<li><a href="#${escapeHtml(section.id)}"><span class="pg-map-name">${plainInline(section.menu ?? section.name)}</span>` +
        `${section.answer === undefined ? "" : `<span class="pg-map-answer">${plainInline(section.answer)}</span>`}</a></li>`,
    )
    .join("");
  const clear = `<div class="pg-checks-clear" hidden><button type="button">${escapeHtml(WORDS[lang].clearChecks)}</button></div>`;
  return `<div class="pg-map">${still}<ol class="pg-map-list" aria-label="${escapeHtml(WORDS[lang].questions)}">${rows}</ol>${clear}</div>`;
}

/**
 * 話題のタブに分けた頁の、1つの話題の頁の組み立て (#3991、#3998)。`map`は話題の頭の地図、`head`は地図の頁の終わりの前と次のlink、
 * `ends`は問いの節ごとの頁の終わりの前と次のlink
 */
interface TopicPaging {
  map: string;
  head: string;
  ends: readonly string[];
}

/**
 * 話題の中身。頭に話題の題を置き、用語の話題は用語ごとの説明と例を並べ、ほかの話題は節を縦に積む。節の題に番号は付けない (#4024)。
 * 話題のタブに分けた頁 (`paging`、#3998) は、話題の題の後に地図と頭の中身と前と次のlinkを地図の頁 (`pg-topic-head`) にまとめ、問いの節の終わりにも前と次のlinkを置く
 */
function topicHtml(topic: RenderedTopic, lang: PageLang, paging?: TopicPaging): string {
  const title = `<h2 class="pg-topic-title">${withoutLinks(topic.name)}</h2>`;
  if (topic.glossary) {
    const entries = topic.glossary
      .map((term) => `<div class="pg-gl" id="${escapeHtml(term.entry)}"><p class="pg-gl-n">${term.name}</p><div class="pg-gl-t">${term.text}</div>${term.example === undefined ? "" : `<div class="pg-gl-e">${term.example}</div>`}</div>`)
      .join("");
    return `${title}<div class="pg-glossary">${entries}</div>${paging?.head ?? ""}`;
  }
  const lead = topic.lead || topic.leadTerms.length > 0 ? `<div class="pg-topic-lead" data-terms>${topic.lead}${termCards(topic.leadTerms, lang)}</div>` : "";
  const sections = topic.sections
    .map(
      (section, n) =>
        `<section class="pg-sec" id="${escapeHtml(section.id)}" data-terms><h3 class="pg-sec-title"><span>${section.name}</span></h3>` +
        `${section.answer === undefined ? "" : `<p class="pg-answer">${section.answer}</p>`}${section.body}${termCards(section.terms, lang)}${paging?.ends[n] ?? ""}</section>`,
    )
    .join("");
  if (!paging) return title + lead + sections;
  return `${title}<div class="pg-topic-head">${paging.map}${lead}${paging.head}</div>${sections}`;
}

/**
 * 左の目次 (#3961)。頭に頁の題を置き、全体像の在る頁は最初の行を全体像にする。話題ごとに話題の名前と、目次の名前
 * (`[menu: 短い名前]` の名前か問いの全文) の問いを番号を付けずに並べる (#3969、#3998)。用語の話題は問いを持たない。読んでいる所の印を付ける行は `data-spy` を持つ。
 * 話題ごとの頁に分けた頁 (`split`) は、題と全体像と話題の名前を頁の上のヘッダーに置くので目次には置かず、問いを持つ話題ごとに問いの並び (`data-topic`) を置く (#4024)。
 * 問いの下にその頁の`####`の見出しを、見出しを持たない問いはその問いの図の題を並べる (#3998、#4010)。並びは開いている話題と開いた問いの下だけを出す。
 * 2つの言葉を持つ頁 (`langs`、#3899) で頁に分けない時は、頭の探す欄の右に言葉を替える釦を並べる
 */
function menuHtml(page: RenderedPage, guide: RenderedGuide, split: boolean, langs: boolean): string {
  const words = WORDS[page.lang];
  const groups = guide.topics
    .map((topic) => {
      const questions = topic.sections
        .map((section) => {
          const name = withoutLinks(section.menu ?? section.name);
          if (!split) return `<li><a class="pg-menu-q" href="#${escapeHtml(section.id)}" data-spy><span class="pg-menu-name">${name}</span></a></li>`;
          const link = `<a class="pg-menu-q" href="#${escapeHtml(section.id)}"><span class="pg-menu-name">${name}</span></a>`;
          const rows =
            section.heads && section.heads.length > 0
              ? section.heads.map((head) => `<li><a class="pg-menu-head" href="#${escapeHtml(head.id)}" data-spy>${withoutLinks(head.html)}</a></li>`)
              : (section.figures ?? []).map((figure) => `<li><a class="pg-menu-fig" href="#${escapeHtml(figure.id)}" data-spy>${escapeHtml(figure.title)}</a></li>`);
          return rows.length === 0 ? `<li>${link}</li>` : `<li>${link}<ol class="pg-menu-figs" hidden>${rows.join("")}</ol></li>`;
        })
        .join("");
      if (split) return questions ? `<div class="pg-menu-group" data-topic="${escapeHtml(topic.id)}" hidden><ol class="pg-menu-qs">${questions}</ol></div>` : "";
      const name = `<a class="pg-menu-topic" href="#${escapeHtml(topic.id)}"${questions ? "" : " data-spy"}>${withoutLinks(topic.name)}</a>`;
      return `<div class="pg-menu-group">${name}${questions ? `<ol>${questions}</ol>` : ""}</div>`;
    })
    .join("");
  const label = escapeHtml(words.contents);
  const title = split ? "" : `<p class="pg-menu-title">${withoutLinks(page.title)}</p>`;
  const over = guide.overview && !split ? `<a class="pg-menu-over" href="#${escapeHtml(guide.overviewId)}" data-spy>${escapeHtml(words.whole)}</a>` : "";
  return (
    `<nav class="pg-menu" aria-label="${label}">${title}` +
    `<button type="button" class="pg-menu-toggle" aria-expanded="false" aria-controls="pg-menu-list"><span>${label}</span>${FOLD_ICON}</button>` +
    `<div class="pg-menu-list" id="pg-menu-list">${split ? "" : langs ? `<div class="pg-menu-top">${searchHtml(page.lang)}${langHtml(page.lang)}</div>` : searchHtml(page.lang)}${over}${groups}</div></nav>`
  );
}

/**
 * 頁の頭の全体像 (#3961)。頭の中身の最初の図と、図の後に書いた頭の中身 (#3969) と、`##` の話題を書いた順に並べた道筋。図の無い頁は空の字。
 * 図の後の中身は下線が開く札を持ち、札をすぐ下に開く置き場 (`data-terms`) に入れる
 */
function overviewHtml(guide: RenderedGuide, lang: PageLang, after = ""): string {
  if (!guide.overview) return "";
  const words = WORDS[lang];
  const text = guide.overviewText || guide.overviewTerms.length > 0 ? `<div class="pg-overview-text" data-terms>${guide.overviewText}${termCards(guide.overviewTerms, lang)}</div>` : "";
  return `<section class="pg-overview" id="${escapeHtml(guide.overviewId)}" aria-label="${escapeHtml(words.whole)}">${guide.overview}${text}${routeHtml(guide, lang)}${after}</section>`;
}

/** `##` の話題 (用語の話題を除く) を書いた順に並べた道筋。話題が無い頁は空の字 */
function routeHtml(guide: RenderedGuide, lang: PageLang): string {
  const route = guide.topics
    .flatMap((topic, i) => (topic.glossary ? [] : [`<li style="${groupColor(i)}"><a href="#${escapeHtml(topic.id)}">${withoutLinks(topic.name)}</a></li>`]))
    .join("");
  return route ? `<ol class="pg-route" aria-label="${escapeHtml(WORDS[lang].topics)}">${route}</ol>` : "";
}

/** 話題ごとのタブに分けた説明の頁の1つのタブ (#3983、#3991)。`id`は場所の名前 (全体像の無い頭のタブは空の字)、`name`は話題の名前、`color`は話題の色 */
interface GuidePage {
  id: string;
  name: string;
  color: string;
}

/** タブの終わりの前と次のlink。前のタブが無い時は次のlinkを右に寄せる */
function pagerHtml(lang: PageLang, prev: GuidePage | undefined, next: GuidePage | undefined): string {
  const words = WORDS[lang];
  const link = (to: GuidePage, rel: "prev" | "next"): string =>
    `<a class="pg-pager-${rel}" href="#${escapeHtml(to.id)}"${to.color ? ` style="${to.color}"` : ""}><span class="pg-pager-dir">${escapeHtml(rel === "prev" ? words.prev : words.next)}</span>` +
    `<span class="pg-pager-to"><span>${to.name}</span></span></a>`;
  return `<nav class="pg-pager" aria-label="${escapeHtml(words.pages)}">${prev ? link(prev, "prev") : ""}${next ? link(next, "next") : ""}</nav>`;
}

/**
 * 説明の頁 (#3876、#3961)。左の列の目次と、右の列の頁の題と頭の中身、全体像、続けて積む話題。
 * 話題が2つ以上の頁 (`pg-split`) は、頁の題と頭の中身と全体像と話題の道筋を頭の頁にし、話題ごとに1つの頁にする (#3991)。頁の上のヘッダーに題と全体像と話題のタブを並べ、左の目次には開いている話題の問いだけを並べる (#4024)。
 * 話題のタブの頭に地図を置き、話題のタブの中は地図の頁と問いごとの頁に分ける (#3998)。頁は全体像、話題ごとの地図と問いを書いた順に並べ、地図と問いの頁の終わりに前と次の頁へのlinkを置く。
 * 全体像の無い頁は、頭の中身の後に話題の道筋と最初の話題へのlinkを置く (#3983)。
 * 印刷の形では目次とヘッダーを出さずに全ての話題を書いた順に並べ、2つ目からの話題を新しい紙から始め、どの話題も紙の上に話題の名前の見出しを出す (#3956)。
 * 2つの言葉を持つ頁 (`langs`、#3899) は、ヘッダーの探す欄の右か、ヘッダーの無い頁は目次の頭に、言葉を替える釦を置く
 */
function guideLayout(page: RenderedPage, langs = false): string {
  const guide = page.guide ?? { lead: "", leadTerms: [], overview: "", overviewText: "", overviewTerms: [], overviewId: "", topics: [] };
  const lead = guide.lead || guide.leadTerms.length > 0 ? `<div class="pg-lead" data-terms>${guide.lead}${termCards(guide.leadTerms, page.lang)}</div>` : "";
  // 話題が2つ以上の頁は、頭のタブと話題ごとのタブに分ける (#3983、#3991)
  const split = guide.topics.length >= 2;
  const pages: GuidePage[] = split
    ? guide.topics.map((topic, i) => ({ id: topic.id, name: withoutLinks(topic.name), color: groupColor(i) }))
    : [];
  const head: GuidePage = { id: guide.overview ? guide.overviewId : "", name: escapeHtml(WORDS[page.lang].whole), color: "" };
  // 頁の並び。全体像の後に、話題ごとに地図の頁とその話題の問いの頁を書いた順に並べる (#3998)
  const order: GuidePage[] = [head];
  if (split) {
    guide.topics.forEach((topic, i) => {
      const tab = pages[i];
      if (tab) order.push(tab);
      if (topic.glossary) return;
      for (const section of topic.sections) order.push({ id: section.id, name: withoutLinks(section.menu ?? section.name), color: groupColor(i) });
    });
  }
  const end = (id: string): string => {
    const at = order.findIndex((p) => p.id === id);
    return pagerHtml(page.lang, order[at - 1], order[at + 1]);
  };
  const topics = guide.topics
    .map((topic, i) => {
      const paging = split ? { map: mapHtml(topic, page.lang, guide.overview), head: end(topic.id), ends: topic.sections.map((section) => end(section.id)) } : undefined;
      return `<section class="pg-topic" id="${escapeHtml(topic.id)}" style="${groupColor(i)}">${topicHtml(topic, page.lang, paging)}</section>`;
    })
    .join("");
  const menu = guide.topics.length === 0 ? "" : menuHtml(page, guide, split, langs);
  const main = guide.topics.length === 0 ? "" : `<main class="pg-main">${topics}</main>`;
  const go = split ? pagerHtml(page.lang, undefined, order[1]) : "";
  const start = guide.overview ? overviewHtml(guide, page.lang, go) : split ? `<div class="pg-start">${routeHtml(guide, page.lang)}${go}</div>` : "";
  // 頁に分けた頁は、題と全体像と話題のタブを頁の上のヘッダーに並べる (#4024)。全体像は目次を出さないので、目次を出さない印を付けて始める
  const header = split
    ? `<header class="pg-head"><a class="pg-head-title" href="#${escapeHtml(head.id)}">${withoutLinks(page.title)}</a>` +
      `<nav class="pg-head-tabs" aria-label="${escapeHtml(WORDS[page.lang].chapters)}">${[head, ...pages].map((tab) => `<a href="#${escapeHtml(tab.id)}">${tab.name}</a>`).join("")}</nav>` +
      `${searchHtml(page.lang)}${searchOpenHtml(page.lang)}${langs ? langHtml(page.lang) : ""}</header>`
    : "";
  return `${header}<div class="pg-wrap pg-guide${menu ? " pg-has-menu" : ""}${split ? " pg-split" : ""}"${split ? " data-bare" : ""}>${menu}<header class="pg-top"><h1>${page.title}</h1>${lead}</header>${start}${main}</div>`;
}

/**
 * 頁の帯の設定の塊 (`<script type="application/json" id="dragon-header">`、#3789)。設定が無い頁には書かない。
 * 値に `<` が混ざっても塊を閉じないよう、JSON の字の `<` を逃がす
 */
const headerBlock = (header: PageHeader | undefined): string =>
  header ? `<script type="application/json" id="dragon-header">${JSON.stringify(header).replaceAll("<", "\\u003c")}</script>\n` : "";

/** 頁の HTML の全文の骨組み。`body` は頁の中身、`script` は頁の終わりに置く script */
const documentHtml = (page: RenderedPage, style: string, body: string, script: string): string =>
  `<!doctype html>\n<html lang="${page.lang}">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n` +
  `<title>${escapeHtml(page.titleText)}</title>\n<style>${style.trim()}</style>\n${headerBlock(page.header)}<script type="module" src="${cdnScript()}"></script>\n</head>\n` +
  `<body class="pg pg-layout-${page.layout}">\n${body}\n<script>${script}</script>\n</body>\n</html>\n`;

/** 頁の HTML の全文 */
export function pageHtml(page: RenderedPage): string {
  const counter = { n: 1 };
  const guide = page.layout === "guide";
  const body = guide ? guideLayout(page) : page.layout === "sidebar" ? sidebarLayout(page, counter) : page.layout === "tabs" ? tabsLayout(page, counter) : entryLayout(page, counter);
  const style = STYLE + (page.layout === "sidebar" ? STYLE_SIDEBAR : page.layout === "tabs" ? STYLE_TABS : guide ? STYLE_GUIDE : "");
  return documentHtml(page, style, body, guide ? RUNTIME_GUIDE : RUNTIME);
}

/**
 * 日本語と英語の説明の頁を1つにした HTML の全文 (#3899)。頁の言葉と中身は先に渡した頁 (`first`) で、もう一方の言葉の中身は
 * `<template id="pg-lang-other">` に持ち、`data-lang` にその言葉、`data-title` にその題を書く。頁の script が開いた時と釦を押した時に中身を入れ替える
 */
export function pairPageHtml(first: RenderedPage, second: RenderedPage): string {
  const other = `<template id="pg-lang-other" data-lang="${second.lang}" data-title="${escapeHtml(second.titleText)}">${guideLayout(second, true)}</template>`;
  return documentHtml(first, STYLE + STYLE_GUIDE + STYLE_LANG, `${guideLayout(first, true)}\n${other}`, RUNTIME_PAIR);
}
