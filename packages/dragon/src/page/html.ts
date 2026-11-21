/**
 * mdから書き出す頁 (#3755) の HTML を組む。
 *
 * 頁は入口と項目の頁を `data-page` の要素に持ち、見ていない頁は `hidden` で隠す。入口の場所の名前は空の字。
 * 組み立て `entry` は入口に全体の図と段ごとの項目の札を並べ、札を押すと項目の頁へ移り、項目の頁の戻る link で入口へ戻る。
 * `sidebar` は左の目次と右の頁、`tabs` は上の段のタブと段の中の項目のタブで項目を選ぶ。
 * 項目の頁の中は `####` の見出しのタブ (`data-level="4"`)、その中は `#####` の見出しのタブ (`data-level="5"`) に分ける。
 *
 * 図は頁の script の1行の入口が jsDelivr から読む dragon が描き、版の範囲は書き出した dragon の版の上 2 つの数で決める。
 * 見せる頁とタブを選ぶ処理 (`RUNTIME`) は頁に埋めた短い script で、外へ通信しない。
 * 色と字は dragon の図と同じ紙の色味 (`paper` の明るい色) と同梱の字を使う。
 */
import { PALETTES, COLOR_ORDER, FONT_STACK_VARS } from "../look/values";
import { escapeHtml } from "./markdown";
import type { Layout, PageHeader } from "./read";
import { type PageLang, WORDS } from "./text";

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
:root{color-scheme:light;${COLORS};${FONT_STACK_VARS};--r:12px}
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

/**
 * 頁の帯の設定の塊 (`<script type="application/json" id="dragon-header">`、#3789)。設定が無い頁には書かない。
 * 値に `<` が混ざっても塊を閉じないよう、JSON の字の `<` を逃がす
 */
const headerBlock = (header: PageHeader | undefined): string =>
  header ? `<script type="application/json" id="dragon-header">${JSON.stringify(header).replaceAll("<", "\\u003c")}</script>\n` : "";

/** 頁の HTML の全文 */
export function pageHtml(page: RenderedPage): string {
  const counter = { n: 1 };
  const body = page.layout === "sidebar" ? sidebarLayout(page, counter) : page.layout === "tabs" ? tabsLayout(page, counter) : entryLayout(page, counter);
  const style = STYLE + (page.layout === "sidebar" ? STYLE_SIDEBAR : page.layout === "tabs" ? STYLE_TABS : "");
  return (
    `<!doctype html>\n<html lang="${page.lang}">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n` +
    `<title>${escapeHtml(page.titleText)}</title>\n<style>${style.trim()}</style>\n${headerBlock(page.header)}<script type="module" src="${cdnScript()}"></script>\n</head>\n` +
    `<body class="pg pg-layout-${page.layout}">\n${body}\n<script>${RUNTIME}</script>\n</body>\n</html>\n`
  );
}
