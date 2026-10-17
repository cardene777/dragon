// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { CdlDiagramView, computeStateValues, layout, type CdlDiagram } from "@cardenelabs/cdl";
import { jsonToDiagram, textDslToDiagram } from "@cardenelabs/dragon";
import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import * as Catalog from "@/topics/catalog/presets.cdl";
import { 図の配色を変える } from "./palette-switch";
import { 走査するfile, 未追跡のfile } from "../../../../test-support/scan-targets";

const ROOT = join(import.meta.dirname, "../../../..");

const 四つの見本 = [
  {
    key: "presetDeliveryRelations",
    title: "契約と荷物と配送状態の関係",
    people: ["契約", "法人契約", "個人契約", "荷物", "配送便", "営業所", "受付", "仕分け", "受付済", "集荷済", "配達中", "完了"],
    relations: ["である", "使う", "集める", "積む", "渡す"],
  },
  {
    key: "presetDeliveryClasses",
    title: "荷物を運ぶ型",
    people: ["荷主", "荷物", "配送便", "冷蔵荷物", "割れ物", "営業所"],
    relations: ["である", "集める", "持つ", "使う"],
  },
  {
    key: "presetDeliveryComponents",
    title: "配送システムの部品",
    people: ["荷主", "受付 API", "追跡", "地図サービス", "台帳", "位置の控え", "配送便の端末", "メール配信", "通知"],
    relations: ["頼む", "書く", "聞く", "送る", "読む", "道を聞く", "移す", "書いたら", "届く"],
  },
  {
    key: "presetDeliverySequence",
    title: "集荷から配達までの呼び出し順",
    people: ["荷主", "営業所", "台帳", "配送便"],
    relations: ["集荷を頼む", "送り状を起こす", "送り状番号", "棚を割り当てる", "便に積む", "受け付けた", "配達中にする"],
  },
] as const;

type CatalogModule = Record<string, unknown>;

type 四図の鍵 = (typeof 四つの見本)[number]["key"];

type 形の行 = {
  図: 四図の鍵;
  行: string;
  見本: number;
  今: number;
  selector: string;
  理由?: string;
};

const 形の要素: 形の行[] = [
  { 図: "presetDeliveryRelations", 行: "記録の箱", 見本: 11, 今: 11, selector: 'role+attr-not:node-body|fill="none"' },
  { 図: "presetDeliveryRelations", 行: "子を抱える箱", 見本: 1, 今: 1, selector: "node-nest-well" },
  { 図: "presetDeliveryRelations", 行: "箱名", 見本: 11, 今: 11, selector: "texts:契約|法人契約|個人契約|荷物|配送便|受付|仕分け|受付済|集荷済|配達中|完了" },
  { 図: "presetDeliveryRelations", 行: "行頭の目印", 見本: 15, 今: 15, selector: "node-row-glyph" },
  { 図: "presetDeliveryRelations", 行: "行の型", 見本: 15, 今: 15, selector: 'role+attr:node-row|text-anchor="end"' },
  { 図: "presetDeliveryRelations", 行: "主役色の行頭", 見本: 7, 今: 7, selector: 'role+attr:node-row-glyph|data-cdl-row-tone="primary"' },
  { 図: "presetDeliveryRelations", 行: "薄い行頭", 見本: 3, 今: 3, selector: 'role+attr:node-row-glyph|data-cdl-row-tone="muted"' },
  { 図: "presetDeliveryRelations", 行: "箱の足", 見本: 10, 今: 10, selector: "node-footer-divider" },
  { 図: "presetDeliveryRelations", 行: "記録を持たない注記", 見本: 3, 今: 3, selector: "node-row-empty" },
  { 図: "presetDeliveryRelations", 行: "主役の箱", 見本: 1, 今: 1, selector: 'role+attr:node-body|data-cdl-emphasis="primary"' },
  { 図: "presetDeliveryRelations", 行: "受け継ぐ線", 見本: 2, 今: 2, selector: 'edge+attr:data-cdl-tone="accent"' },
  { 図: "presetDeliveryRelations", 行: "であるの札", 見本: 1, 今: 1, selector: "role+texts:edge-label|である" },
  { 図: "presetDeliveryRelations", 行: "使う点線", 見本: 3, 今: 3, selector: 'edge+attr:data-cdl-tone="teal"' },
  { 図: "presetDeliveryRelations", 行: "使う線の始点の丸", 見本: 3, 今: 3, selector: 'role+attr:edge-line|marker-start="url(' },
  { 図: "presetDeliveryRelations", 行: "使うの札", 見本: 3, 今: 3, selector: "role+texts:edge-label|使う" },
  { 図: "presetDeliveryRelations", 行: "個数の札", 見本: 3, 今: 3, selector: "edge-end-label" },
  { 図: "presetDeliveryRelations", 行: "状態を移す線", 見本: 3, 今: 3, selector: 'edge+attr:data-cdl-tone="warning"' },
  { 図: "presetDeliveryRelations", 行: "状態を移す札", 見本: 3, 今: 3, selector: "role+texts:edge-label|集める|積む|渡す" },
  { 図: "presetDeliveryRelations", 行: "関係の 3 色", 見本: 3, 今: 3, selector: "unique-edge-tone" },
  { 図: "presetDeliveryRelations", 行: "囲いを説明する凡例注記", 見本: 1, 今: 1, selector: "legend-note" },

  { 図: "presetDeliveryClasses", 行: "型の箱", 見本: 6, 今: 6, selector: "node-body" },
  { 図: "presetDeliveryClasses", 行: "型名", 見本: 6, 今: 6, selector: "node-label" },
  { 図: "presetDeliveryClasses", 行: "中央寄せの型名", 見本: 6, 今: 6, selector: 'role+attr:node-label|text-anchor="middle"' },
  { 図: "presetDeliveryClasses", 行: "抽象の小見出し", 見本: 1, 今: 1, selector: "texts:抽象" },
  { 図: "presetDeliveryClasses", 行: "属性と操作の行頭", 見本: 19, 今: 19, selector: "node-row-glyph" },
  { 図: "presetDeliveryClasses", 行: "属性と操作の型", 見本: 19, 今: 19, selector: 'role+attr:node-row|text-anchor="end"' },
  { 図: "presetDeliveryClasses", 行: "操作の主役色", 見本: 8, 今: 8, selector: 'role+attr:node-row-glyph|data-cdl-row-tone="primary"' },
  { 図: "presetDeliveryClasses", 行: "属性と操作の区切り", 見本: 6, 今: 6, selector: "node-row-group-divider" },
  { 図: "presetDeliveryClasses", 行: "薄い任意の属性", 見本: 1, 今: 1, selector: 'role+attr:node-row-glyph|data-cdl-row-tone="muted"' },
  { 図: "presetDeliveryClasses", 行: "受け継ぐ線", 見本: 2, 今: 2, selector: 'edge+attr:data-cdl-tone="accent"' },
  { 図: "presetDeliveryClasses", 行: "であるの札", 見本: 1, 今: 1, selector: "role+texts:edge-label|である" },
  { 図: "presetDeliveryClasses", 行: "集める線", 見本: 1, 今: 1, selector: 'attr:data-cdl-edge-label="集める"' },
  { 図: "presetDeliveryClasses", 行: "持つ線", 見本: 1, 今: 1, selector: 'attr:data-cdl-edge-label="持つ"' },
  { 図: "presetDeliveryClasses", 行: "使う点線", 見本: 1, 今: 1, selector: 'attr:data-cdl-edge-label="使う"' },
  { 図: "presetDeliveryClasses", 行: "関係の札", 見本: 3, 今: 3, selector: "role+texts:edge-label|集める|持つ|使う" },
  { 図: "presetDeliveryClasses", 行: "個数の札", 見本: 3, 今: 3, selector: "edge-end-label" },
  { 図: "presetDeliveryClasses", 行: "関係の 3 色", 見本: 3, 今: 3, selector: "unique-edge-tone" },
  { 図: "presetDeliveryClasses", 行: "4 種の凡例", 見本: 4, 今: 4, selector: "legend-item" },
  { 図: "presetDeliveryClasses", 行: "端の形を示す凡例", 見本: 3, 今: 3, selector: "legend-end-mark" },
  { 図: "presetDeliveryClasses", 行: "凡例の 3 色", 見本: 3, 今: 3, selector: "unique-legend-tone" },

  { 図: "presetDeliveryComponents", 行: "部品の箱", 見本: 9, 今: 9, selector: "node-body" },
  { 図: "presetDeliveryComponents", 行: "共通の部品枠", 見本: 9, 今: 9, selector: "node-kind-icon" },
  { 図: "presetDeliveryComponents", 行: "部品名", 見本: 9, 今: 9, selector: "node-label" },
  { 図: "presetDeliveryComponents", 行: "部品の説明", 見本: 9, 今: 9, selector: "texts:集荷を頼む人|申し込みを受ける|荷物の今を答える|道順を返す|送り状を残す|最新の位置だけ持つ|運転手が持つ|知らせを届ける|着く前に知らせる" },
  { 図: "presetDeliveryComponents", 行: "人・台帳・外部の絵", 見本: 4, 今: 4, selector: 'role+attr-list:node-kind-icon|data-cdl-icon="person"|data-cdl-icon="database"|data-cdl-icon="cloud"' },
  { 図: "presetDeliveryComponents", 行: "サービス・控え・端末の絵", 見本: 5, 今: 5, selector: 'role+attr-list:node-kind-icon|data-cdl-icon="box"|data-cdl-icon="lightning"|data-cdl-icon="terminal"' },
  { 図: "presetDeliveryComponents", 行: "段の目印を持つ足", 見本: 9, 今: 9, selector: "node-footer-divider" },
  { 図: "presetDeliveryComponents", 行: "L2 の区画", 見本: 1, 今: 1, selector: "lane-container" },
  { 図: "presetDeliveryComponents", 行: "L2 の区画の補足", 見本: 1, 今: 1, selector: "lane-label-subtitle" },
  { 図: "presetDeliveryComponents", 行: "部品を結ぶ線", 見本: 10, 今: 10, selector: "edge-line" },
  { 図: "presetDeliveryComponents", 行: "外向きと夜間の点線", 見本: 4, 今: 4, selector: 'role+attr:edge-line|stroke-dasharray="10 8"' },
  { 図: "presetDeliveryComponents", 行: "接続の 3 色", 見本: 3, 今: 3, selector: "unique-edge-tone" },
  { 図: "presetDeliveryComponents", 行: "接続の札", 見本: 10, 今: 10, selector: "edge-label" },
  { 図: "presetDeliveryComponents", 行: "構成の凡例", 見本: 2, 今: 2, selector: "legend-item" },
  { 図: "presetDeliveryComponents", 行: "区画の凡例", 見本: 1, 今: 1, selector: 'role+attr:legend-mark|data-cdl-legend-mark="rounded-box"' },
  { 図: "presetDeliveryComponents", 行: "凡例の 2 色", 見本: 2, 今: 2, selector: "unique-legend-tone" },

  { 図: "presetDeliverySequence", 行: "参加者名", 見本: 4, 今: 4, selector: "sequence-actor" },
  { 図: "presetDeliverySequence", 行: "参加者の補足", 見本: 4, 今: 4, selector: "sequence-actor-subtitle" },
  { 図: "presetDeliverySequence", 行: "参加者の箱", 見本: 4, 今: 4, selector: "sequence-actor-box" },
  { 図: "presetDeliverySequence", 行: "頭の区切り", 見本: 1, 今: 1, selector: "sequence-rule" },
  { 図: "presetDeliverySequence", 行: "参加者の糸", 見本: 4, 今: 4, selector: "sequence-thread" },
  { 図: "presetDeliverySequence", 行: "動いている間の帯", 見本: 5, 今: 5, selector: "sequence-band" },
  { 図: "presetDeliverySequence", 行: "言づての名前", 見本: 7, 今: 7, selector: "sequence-label" },
  { 図: "presetDeliverySequence", 行: "言づての色印", 見本: 7, 今: 7, selector: "sequence-label-mark" },
  { 図: "presetDeliverySequence", 行: "呼ぶ・返す・投げるの字", 見本: 7, 今: 7, selector: "sequence-label-kind" },
  { 図: "presetDeliverySequence", 行: "呼ぶ言づて", 見本: 4, 今: 4, selector: 'role+attr:sequence-message|data-cdl-message-kind="call"' },
  { 図: "presetDeliverySequence", 行: "返す言づて", 見本: 2, 今: 2, selector: 'role+attr:sequence-message|data-cdl-message-kind="return"' },
  { 図: "presetDeliverySequence", 行: "投げる言づて", 見本: 1, 今: 1, selector: 'role+attr:sequence-message|data-cdl-message-kind="fire"' },
  { 図: "presetDeliverySequence", 行: "呼ぶ・返すの塗った矢", 見本: 6, 今: 6, selector: 'role+attr:sequence-head|data-cdl-head-fill="solid"' },
  { 図: "presetDeliverySequence", 行: "自分へ戻る角形", 見本: 1, 今: 1, selector: 'role+attr:sequence-line| V 561 H ' },
  { 図: "presetDeliverySequence", 行: "出どころの点", 見本: 7, 今: 7, selector: "sequence-source" },
  { 図: "presetDeliverySequence", 行: "言づての 3 種", 見本: 3, 今: 3, selector: "unique-message-kind" },
  { 図: "presetDeliverySequence", 行: "呼ぶ・返す・投げるの凡例", 見本: 3, 今: 3, selector: "legend-mark" },
  { 図: "presetDeliverySequence", 行: "凡例の 3 色", 見本: 3, 今: 3, selector: "unique-legend-tone" },
  { 図: "presetDeliverySequence", 行: "帯の凡例注記", 見本: 1, 今: 1, selector: "legend-note" },
];

const 最後を描く = (図: CdlDiagram): string => {
  const 配置済み = layout(図);
  const 最後の値 = computeStateValues(配置済み, Math.max(0, 配置済み.phases.length - 1), 1);
  const 静止図: CdlDiagram = {
    ...図,
    states: (図.states ?? []).map((状態) => ({ ...状態, initial: 最後の値[状態.id] ?? 状態.initial })),
    phases: [{ id: "最後", duration: 1, title: "最後", body: "", activate: [], tweens: [], sets: [] }],
  };
  return renderToStaticMarkup(<CdlDiagramView diagram={静止図} laid={layout(静止図)} hideHeader />);
};

const selectorの数 = (svg: string, selector: string): number => {
  const tags = svg.match(/<[^>]+>/gu) ?? [];
  if (selector.startsWith("role+attr:")) {
    const [role, attr] = selector.slice("role+attr:".length).split("|");
    return tags.filter((tag) => tag.includes(`data-cdl-role="${role}"`) && tag.includes(attr ?? "\0")).length;
  }
  if (selector.startsWith("role+attr-not:")) {
    const [role, attr] = selector.slice("role+attr-not:".length).split("|");
    return tags.filter((tag) => tag.includes(`data-cdl-role="${role}"`) && !tag.includes(attr ?? "\0")).length;
  }
  if (selector.startsWith("role+attr-list:")) {
    const [role, ...attrs] = selector.slice("role+attr-list:".length).split("|");
    return tags.filter((tag) => tag.includes(`data-cdl-role="${role}"`) && attrs.some((attr) => tag.includes(attr))).length;
  }
  if (selector.startsWith("role+texts:")) {
    const [role, ...texts] = selector.slice("role+texts:".length).split("|");
    const pattern = new RegExp(`<text[^>]*data-cdl-role="${role}"[^>]*>([^<]*)<\\/text>`, "gu");
    return [...svg.matchAll(pattern)].filter((match) => texts.includes(match[1] ?? "")).length;
  }
  if (selector.startsWith("attr:")) {
    const attr = selector.slice("attr:".length);
    return tags.filter((tag) => tag.includes(attr)).length;
  }
  if (selector.startsWith("edge+attr:")) {
    const attr = selector.slice("edge+attr:".length);
    return tags.filter((tag) => tag.includes("data-cdl-edge=") && tag.includes(attr)).length;
  }
  if (selector.startsWith("texts:")) {
    return selector.slice("texts:".length).split("|").reduce((count, value) => count + svg.split(`>${value}<`).length - 1, 0);
  }
  if (selector.startsWith("contains-list:")) {
    return selector.slice("contains-list:".length).split("|").reduce((count, value) => count + svg.split(value).length - 1, 0);
  }
  if (selector === "unique-edge-tone") {
    return new Set(tags.filter((tag) => tag.includes("data-cdl-edge=")).map((tag) => tag.match(/data-cdl-tone="([^"]+)"/u)?.[1]).filter(Boolean)).size;
  }
  if (selector === "unique-legend-tone") {
    return new Set(tags.filter((tag) => tag.includes('data-cdl-role="legend-mark"')).map((tag) => tag.match(/data-cdl-tone="([^"]+)"/u)?.[1]).filter(Boolean)).size;
  }
  if (selector === "unique-message-kind") {
    return new Set(tags.filter((tag) => tag.includes('data-cdl-role="sequence-message"')).map((tag) => tag.match(/data-cdl-message-kind="([^"]+)"/u)?.[1]).filter(Boolean)).size;
  }
  if (selector === "legend-note") {
    return tags.filter((tag) => tag.includes('data-cdl-role="legend-item"') && !tag.includes("data-cdl-legend-mark=")).length
      - tags.filter((tag) => tag.includes('data-cdl-role="legend-mark"')).length;
  }
  if (selector === "legend-end-mark") {
    return tags.filter((tag) => tag.includes('data-cdl-role="legend-mark"') && /data-cdl-legend-mark="line-(triangle|diamond)/u.test(tag)).length;
  }
  return tags.filter((tag) => tag.includes(`data-cdl-role="${selector}"`)).length;
};

const source = (prefix: "sourceYaml__" | "sourceJson__", key: string): string => {
  const value = (Catalog as CatalogModule)[`${prefix}${key}`];
  expect(value, `${prefix}${key} が無い`).toBeTypeOf("string");
  return String(value);
};

type 点 = { x: number; y: number };
type 枠 = { left: number; top: number; right: number; bottom: number };
type 崩れの数 = {
  行のはみ出し: number;
  入れ子のはみ出し: number;
  箱の重なり: number;
  線から離れた札: number;
  字の重なり: number;
  図の大きさ: number;
};

const 数 = (value: string | null | undefined, fallback = 0): number => {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : fallback;
};

const 平行移動 = (element: Element): 点 => {
  let x = 0;
  let y = 0;
  for (let current: Element | null = element; current; current = current.parentElement) {
    const transform = current.getAttribute("transform") ?? "";
    for (const match of transform.matchAll(/translate\(\s*(-?[\d.]+)(?:[ ,]+(-?[\d.]+))?\s*\)/gu)) {
      x += 数(match[1]);
      y += 数(match[2]);
    }
  }
  return { x, y };
};

const 交わる = (a: 枠, b: 枠): boolean =>
  Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 &&
  Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5;

const 実質的に交わる = (a: 枠, b: 枠): boolean =>
  Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 &&
  Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2;

const 含む = (outer: 枠, inner: 枠): boolean =>
  inner.left >= outer.left - 0.5 && inner.right <= outer.right + 0.5 &&
  inner.top >= outer.top - 0.5 && inner.bottom <= outer.bottom + 0.5;

const node枠 = (element: Element): 枠 => {
  const cx = 数(element.getAttribute("data-cdl-cx"));
  const cy = 数(element.getAttribute("data-cdl-cy"));
  const width = 数(element.getAttribute("data-cdl-w"));
  const height = 数(element.getAttribute("data-cdl-h"));
  return { left: cx - width / 2, top: cy - height / 2, right: cx + width / 2, bottom: cy + height / 2 };
};

const 文字枠 = (element: Element): 枠 => {
  const shift = 平行移動(element);
  const parentText = element.tagName.toLowerCase() === "tspan" ? element.closest("text") : null;
  const previous = element.previousElementSibling;
  const previousBox = previous?.tagName.toLowerCase() === "tspan" ? 文字枠(previous) : undefined;
  const x = previousBox === undefined
    ? 数(element.getAttribute("x") ?? parentText?.getAttribute("x")) + 数(element.getAttribute("dx")) + shift.x
    : previousBox.right + 数(element.getAttribute("dx"));
  const y = 数(element.getAttribute("y") ?? parentText?.getAttribute("y")) + 数(element.getAttribute("dy")) + shift.y;
  const size = 数(element.getAttribute("font-size") ?? element.getAttribute("fontSize"), 22);
  const width = Math.max(size * 0.55, (element.textContent ?? "").length * size * 0.55);
  const anchor = element.getAttribute("text-anchor");
  const left = anchor === "middle" ? x - width / 2 : anchor === "end" ? x - width : x;
  return { left, top: y - size * 0.82, right: left + width, bottom: y + size * 0.22 };
};

const rect枠 = (element: Element): 枠 => {
  const shift = 平行移動(element);
  const left = 数(element.getAttribute("x")) + shift.x;
  const top = 数(element.getAttribute("y")) + shift.y;
  return {
    left,
    top,
    right: left + 数(element.getAttribute("width")),
    bottom: top + 数(element.getAttribute("height")),
  };
};

const glyph枠 = (element: Element): 枠 => {
  if (element.tagName.toLowerCase() === "rect") return rect枠(element);
  const shift = 平行移動(element);
  const values = [...(element.getAttribute("d") ?? "").matchAll(/-?\d+(?:\.\d+)?/gu)].map((match) => 数(match[0]));
  const xs = values.filter((_, index) => index % 2 === 0).map((value) => value + shift.x);
  const ys = values.filter((_, index) => index % 2 === 1).map((value) => value + shift.y);
  return {
    left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys),
  };
};

const pathの点 = (d: string): 点[] => {
  const tokens = d.match(/[MLHVQCSZmlhvqcsz]|-?\d+(?:\.\d+)?/gu) ?? [];
  const points: 点[] = [];
  let index = 0;
  let command = "";
  let current = { x: 0, y: 0 };
  const next = () => 数(tokens[index++]);
  while (index < tokens.length) {
    if (/^[A-Za-z]$/u.test(tokens[index]!)) command = tokens[index++]!;
    const relative = command === command.toLowerCase();
    const base = { ...current };
    if (/[ML]/iu.test(command)) {
      const x = next() + (relative ? base.x : 0);
      const y = next() + (relative ? base.y : 0);
      current = { x, y };
      points.push(current);
      if (/[Mm]/u.test(command)) command = relative ? "l" : "L";
    } else if (/[H]/iu.test(command)) {
      current = { x: next() + (relative ? base.x : 0), y: base.y };
      points.push(current);
    } else if (/[V]/iu.test(command)) {
      current = { x: base.x, y: next() + (relative ? base.y : 0) };
      points.push(current);
    } else if (/[Q]/iu.test(command)) {
      const control = { x: next() + (relative ? base.x : 0), y: next() + (relative ? base.y : 0) };
      const end = { x: next() + (relative ? base.x : 0), y: next() + (relative ? base.y : 0) };
      for (let step = 1; step <= 12; step += 1) {
        const t = step / 12;
        points.push({
          x: (1 - t) ** 2 * base.x + 2 * (1 - t) * t * control.x + t ** 2 * end.x,
          y: (1 - t) ** 2 * base.y + 2 * (1 - t) * t * control.y + t ** 2 * end.y,
        });
      }
      current = end;
    } else if (/[C]/iu.test(command)) {
      const c1 = { x: next() + (relative ? base.x : 0), y: next() + (relative ? base.y : 0) };
      const c2 = { x: next() + (relative ? base.x : 0), y: next() + (relative ? base.y : 0) };
      const end = { x: next() + (relative ? base.x : 0), y: next() + (relative ? base.y : 0) };
      for (let step = 1; step <= 12; step += 1) {
        const t = step / 12;
        points.push({
          x: (1 - t) ** 3 * base.x + 3 * (1 - t) ** 2 * t * c1.x + 3 * (1 - t) * t ** 2 * c2.x + t ** 3 * end.x,
          y: (1 - t) ** 3 * base.y + 3 * (1 - t) ** 2 * t * c1.y + 3 * (1 - t) * t ** 2 * c2.y + t ** 3 * end.y,
        });
      }
      current = end;
    } else {
      break;
    }
  }
  return points;
};

const 線が枠を通る = (points: 点[], box: 枠): boolean =>
  points.slice(1).some((end, index) => {
    const start = points[index]!;
    if (start.x === end.x) {
      return start.x >= box.left && start.x <= box.right &&
        Math.max(Math.min(start.y, end.y), box.top) <= Math.min(Math.max(start.y, end.y), box.bottom);
    }
    if (start.y === end.y) {
      return start.y >= box.top && start.y <= box.bottom &&
        Math.max(Math.min(start.x, end.x), box.left) <= Math.min(Math.max(start.x, end.x), box.right);
    }
    return false;
  });

const 宅配の骨組み見本 = [
  Catalog.presetDeliveryComponents,
  Catalog.presetDeliveryRelations,
  Catalog.presetDeliveryClasses,
  Catalog.presetDeliveryStages,
] as const;

const 直線の線分 = (d: string): Array<{ start: 点; end: 点 }> => {
  const tokens = d.match(/[A-Za-z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/giu) ?? [];
  const segments: Array<{ start: 点; end: 点 }> = [];
  let index = 0;
  let command = "";
  let current = { x: 0, y: 0 };
  let subpathStart = { x: 0, y: 0 };
  const next = (): number => 数(tokens[index++]);
  const point = (x: number, y: number, relative: boolean, base: 点): 点 => ({
    x: x + (relative ? base.x : 0),
    y: y + (relative ? base.y : 0),
  });

  while (index < tokens.length) {
    if (/^[A-Za-z]$/u.test(tokens[index]!)) command = tokens[index++]!;
    const relative = command === command.toLowerCase();
    const base = { ...current };
    switch (command.toUpperCase()) {
      case "M": {
        current = point(next(), next(), relative, base);
        subpathStart = current;
        command = relative ? "l" : "L";
        break;
      }
      case "L": {
        current = point(next(), next(), relative, base);
        segments.push({ start: base, end: current });
        break;
      }
      case "H": {
        current = { x: next() + (relative ? base.x : 0), y: base.y };
        segments.push({ start: base, end: current });
        break;
      }
      case "V": {
        current = { x: base.x, y: next() + (relative ? base.y : 0) };
        segments.push({ start: base, end: current });
        break;
      }
      case "C": {
        next(); next(); next(); next();
        current = point(next(), next(), relative, base);
        break;
      }
      case "S":
      case "Q": {
        next(); next();
        current = point(next(), next(), relative, base);
        break;
      }
      case "T": {
        current = point(next(), next(), relative, base);
        break;
      }
      case "A": {
        next(); next(); next(); next(); next();
        current = point(next(), next(), relative, base);
        break;
      }
      case "Z": {
        current = subpathStart;
        command = "";
        break;
      }
      default:
        throw new Error(`読めない経路命令: ${command || tokens[index]}`);
    }
  }
  return segments;
};

const 固定意匠 = {
  blueprint: "図面",
  catalog: "図録",
  sketch: "手描き",
  letterpress: "活版",
  relief: "浮彫",
  terminal: "端末",
  neon: "電飾",
} as const;

const 線の札の見本幅 = {
  "である": 96,
  "使う": 74,
  "集める": 96,
  "積む": 74,
  "渡す": 74,
  "持つ": 74,
  "頼む": 74,
  "書く": 74,
  "聞く": 74,
  "送る": 74,
  "読む": 74,
  "道を聞く": 118,
  "移す": 74,
  "書いたら": 118,
  "届く": 74,
} as const;

type 見本の線 = { 線: 点[]; 印: 点[]; 印の先端: 点; 箱へ向かう: 点 };

const 見本の線を読む = (図: "関係" | "型" | "構成", 意匠: keyof typeof 固定意匠): 見本の線[] => {
  const html = readFileSync(join(ROOT, `docs/design/proposal/static/${図}-${固定意匠[意匠]}.html`), "utf8");
  return [...html.matchAll(/<g class="wire"[^>]*>([\s\S]*?)<\/g>/gu)].map((wire) => {
    const paths = [...(wire[1] ?? "").matchAll(/<path d="([^"]+)"/gu)].map((match) => pathの点(match[1] ?? ""));
    const 線 = paths[0] ?? [];
    const 印 = paths[1] ?? [];
    const 線の端 = 線.at(-1) ?? { x: 0, y: 0 };
    const 一つ前 = 線.at(-2) ?? 線の端;
    const dx = 線の端.x - 一つ前.x;
    const dy = 線の端.y - 一つ前.y;
    const 印の先端 = 印.reduce((best, point) => {
      const projection = (point.x - 線の端.x) * dx + (point.y - 線の端.y) * dy;
      const bestProjection = (best.x - 線の端.x) * dx + (best.y - 線の端.y) * dy;
      return projection > bestProjection ? point : best;
    }, 印[0] ?? 線の端);
    return { 線, 印, 印の先端, 箱へ向かう: { x: dx, y: dy } };
  });
};

const 点群の枠 = (points: 点[], shift: 点 = { x: 0, y: 0 }): 枠 => ({
  left: Math.min(...points.map((point) => point.x + shift.x)),
  top: Math.min(...points.map((point) => point.y + shift.y)),
  right: Math.max(...points.map((point) => point.x + shift.x)),
  bottom: Math.max(...points.map((point) => point.y + shift.y)),
});

const 印と箱の隙間 = (point: 点, toward: 点, box: 枠): number => {
  if (Math.abs(toward.x) > Math.abs(toward.y)) {
    return toward.x > 0 ? box.left - point.x : point.x - box.right;
  }
  return toward.y > 0 ? box.top - point.y : point.y - box.bottom;
};

const 点と線分の距離 = (point: 点, a: 点, b: 点): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length2 = dx * dx + dy * dy;
  const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length2));
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
};

/** 縁は許し、箱を 0.001 内側へ縮めた所へ線分が入る時だけ数える。 */
const 線分が箱の内側を通る = (a: 点, b: 点, box: 枠): boolean => {
  const inset = 0.001;
  const inner = {
    left: box.left + inset,
    top: box.top + inset,
    right: box.right - inset,
    bottom: box.bottom - inset,
  };
  let low = 0;
  let high = 1;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  for (const [p, q] of [
    [-dx, a.x - inner.left],
    [dx, inner.right - a.x],
    [-dy, a.y - inner.top],
    [dy, inner.bottom - a.y],
  ] as const) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const ratio = q / p;
    if (p < 0) low = Math.max(low, ratio);
    else high = Math.min(high, ratio);
    if (low > high) return false;
  }
  return true;
};

const 線の端を印の内側まで縮める = (points: 点[], side: "start" | "end", distance: number): 点[] => {
  const ordered = side === "start" ? [...points].reverse() : [...points];
  let remaining = distance;
  while (ordered.length >= 2 && remaining > 0) {
    const tip = ordered.at(-1)!;
    const previous = ordered.at(-2)!;
    const length = Math.hypot(tip.x - previous.x, tip.y - previous.y);
    if (length <= remaining) {
      ordered.pop();
      remaining -= length;
      continue;
    }
    const ratio = (length - remaining) / length;
    ordered[ordered.length - 1] = {
      x: previous.x + (tip.x - previous.x) * ratio,
      y: previous.y + (tip.y - previous.y) * ratio,
    };
    remaining = 0;
  }
  return side === "start" ? ordered.reverse() : ordered;
};

const 崩れを数える = (svg: string, diagram?: CdlDiagram): 崩れの数 => {
  const document = new JSDOM(svg, { contentType: "image/svg+xml" }).window.document;
  const nodes = [...document.querySelectorAll("[data-cdl-node][data-cdl-cx]")];
  const nodesById = new Map(nodes.map((node) => [node.getAttribute("data-cdl-node") ?? "", node]));
  let 行のはみ出し = 0;
  for (const node of nodes) {
    const body = node枠(node);
    const rows = [...node.querySelectorAll('[data-cdl-role="node-row"], [data-cdl-role="node-row-glyph"], text[data-cdl-role^="node-footer-"]')];
    for (const row of rows) {
      const box = row.tagName.toLowerCase() === "text" ? 文字枠(row) : glyph枠(row);
      if (!含む(body, box)) 行のはみ出し += 1;
    }
  }
  const 入れ子のはみ出し = nodes.filter((node) => {
    const parent = nodesById.get(node.getAttribute("data-cdl-nest-in") ?? "");
    return parent !== undefined && !含む(node枠(parent), node枠(node));
  }).length;
  let 箱の重なり = 0;
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i]!;
      const b = nodes[j]!;
      const parentChild = a.getAttribute("data-cdl-nest-in") === b.getAttribute("data-cdl-node") || b.getAttribute("data-cdl-nest-in") === a.getAttribute("data-cdl-node");
      if (!parentChild && 交わる(node枠(a), node枠(b))) 箱の重なり += 1;
    }
  }
  let 線から離れた札 = 0;
  for (const label of document.querySelectorAll("[data-cdl-edge-label-for]")) {
    const edgeId = label.getAttribute("data-cdl-edge-label-for");
    const edge = [...document.querySelectorAll("[data-cdl-edge]")].find(
      (candidate) => candidate.getAttribute("data-cdl-edge") === edgeId,
    );
    const path = edge?.querySelector('[data-cdl-role="edge-line"]');
    if (!path) continue;
    const pathShift = 平行移動(path);
    const points = pathの点(path.getAttribute("d") ?? "").map((point) => ({
      x: point.x + pathShift.x,
      y: point.y + pathShift.y,
    }));
    const center = 平行移動(label);
    const distances = points.slice(1).map((point, index) => ({
      distance: 点と線分の距離(center, points[index]!, point),
      a: points[index]!,
      b: point,
    }));
    const distance = Math.min(...distances.map((candidate) => candidate.distance));
    const authorPlaced = diagram?.edges.find((item) => item.id === edgeId)?.labelCollision === "author";
    if (distance > 40 && !authorPlaced) 線から離れた札 += 1;
  }
  const labels: Array<{ box: 枠; authorPlaced: boolean }> = [
    ...[...document.querySelectorAll('[data-cdl-role="edge-label-bg"]')].map((element) => {
      const edgeId = element.closest("[data-cdl-edge-label-for]")?.getAttribute("data-cdl-edge-label-for");
      return {
        box: rect枠(element),
        authorPlaced: diagram?.edges.find((item) => item.id === edgeId)?.labelCollision === "author",
      };
    }),
    ...[...document.querySelectorAll('[data-cdl-role="legend-text"], [data-cdl-role="lane-label"], [data-cdl-role="lane-label-subtitle"]')].map((element) => ({
      box: 文字枠(element),
      authorPlaced: false,
    })),
  ];
  let 字の重なり = 0;
  for (let i = 0; i < labels.length; i += 1) {
    const label = labels[i]!;
    const 構成の札も見る = diagram?.id === "delivery-components-demo";
    if (
      (構成の札も見る || !label.authorPlaced) &&
      nodes.some((node) => 実質的に交わる(label.box, node枠(node)))
    ) 字の重なり += 1;
    for (let j = i + 1; j < labels.length; j += 1) {
      if (交わる(label.box, labels[j]!.box)) 字の重なり += 1;
    }
  }
  const root = document.querySelector("svg[data-cdl-stage]");
  const viewBox = (root?.getAttribute("viewBox") ?? "").split(/\s+/u).map(Number);
  const width = viewBox[2] ?? 数(root?.getAttribute("width"));
  const height = viewBox[3] ?? 数(root?.getAttribute("height"));
  const 図の大きさ = Math.abs(width - 1800) / 1800 > 0.05 || Math.abs(height - 1100) / 1100 > 0.05 ? 1 : 0;
  return { 行のはみ出し, 入れ子のはみ出し, 箱の重なり, 線から離れた札, 字の重なり, 図の大きさ };
};

describe("宅配の関係・型・構成・順序の記法 (#2836)", () => {
  it("宅配の骨組み 4 見本は斜めの直線の線分を持たない", () => {
    let 確かめた線 = 0;
    for (const diagram of 宅配の骨組み見本) {
      for (const edge of layout(diagram).edges) {
        const diagonals = 直線の線分(edge.d).filter(({ start, end }) =>
          Math.abs(start.x - end.x) > 0.5 && Math.abs(start.y - end.y) > 0.5
        );
        expect(
          diagonals,
          `${diagram.id} / ${edge.id} に斜めの直線の線分がある: ${edge.d}`,
        ).toEqual([]);
        確かめた線 += 1;
      }
    }
    expect(確かめた線).toBe(31);
  });

  it("構成の全ての線分は c4-l2 の見出しを通らない", () => {
    const palettes = [
      "kinari", "celadon", "blueprint", "letterpress", "catalog",
      "terminal", "sketch", "neon", "relief", "site-colours",
    ] as const;
    let 確かめた見出し = 0;
    let 確かめた線 = 0;
    for (const palette of palettes) {
      const laid = layout(図の配色を変える(Catalog.presetDeliveryComponents, palette));
      const heading = laid.bboxes.find((box) => box.kind === "lane-label" && box.id === "c4-l2");
      expect(heading, `${palette} / c4-l2 の見出し`).toBeDefined();
      if (heading === undefined) continue;
      const box = {
        left: heading.x,
        top: heading.y,
        right: heading.x + heading.w,
        bottom: heading.y + heading.h,
      };
      for (const edge of laid.edges) {
        expect(
          線が枠を通る(pathの点(edge.d), box),
          `${palette} / ${edge.id}: ${edge.d} / ${JSON.stringify(box)}`,
        ).toBe(false);
        確かめた線 += 1;
      }
      確かめた見出し += 1;
    }
    expect(確かめた見出し).toBe(10);
    expect(確かめた線).toBe(100);
  });

  it("順序の列 610・帯 30 と、構成の「聞く」の直角経路を描き手へ渡す", () => {
    const sequence = Catalog.presetDeliverySequence.nodes.find((node) => node.kind === "sequence-board");
    expect(sequence?.sequenceData).toMatchObject({ sequenceGutter: 610, sequenceBandWidth: 30 });

    const edge = Catalog.presetDeliveryComponents.edges.find((item) => item.label === "聞く");
    expect(edge).toMatchObject({
      posX1: 128.2,
      posY1: 243.8,
      posX2: 1042.2,
      posY2: 245.8,
      waypoints: [{ x: 128.2, y: 131.8 }, { x: 1042.2, y: 131.8 }],
      labelOffsetX: 226,
      labelOffsetY: 24,
    });
  });

  it("関係の箱と固定線は全配色で浮彫由来の共通骨組みを保つ", () => {
    const palettes = [
      "kinari", "celadon", "blueprint", "letterpress", "catalog",
      "terminal", "sketch", "neon", "relief", "site-colours",
    ] as const;
    for (const palette of palettes) {
      const relation = 図の配色を変える(Catalog.presetDeliveryRelations, palette);
      expect(relation.nodes.find((node) => node.id === "契約"), palette).toMatchObject({
        h: 218.890625,
        posH: 218.890625,
        posY: 155.4453125,
        rowLayout: { titleBaseline: 48, rowTop: 108.9, rowPitch: 46.5 },
        rowStripe: palette !== "neon" && palette !== "relief",
      });
      expect(relation.nodes.find((node) => node.id === "受付"), palette).toMatchObject({
        h: 125,
        posH: 125,
        posY: 195.5,
        rowStripe: palette !== "neon" && palette !== "relief",
      });
      expect(relation.edges.find((edge) => edge.label === "である"), palette).toMatchObject({
        posX1: 232,
        posY1: 346,
        posX2: 360,
        posY2: 266.890625,
        waypoints: [{ x: 232, y: 308.4453125 }, { x: 360, y: 308.4453125 }],
        labelOffsetX: 152,
        labelOffsetY: 0,
      });
      expect(relation.edges.find((edge) => edge.label === "使う" && edge.from === "受付済"), palette).toMatchObject({
        posX1: 1452,
        posY1: 130.9453125,
        posX2: 1364,
        posY2: 332.265625,
        waypoints: [{ x: 1412, y: 130.9453125 }, { x: 1412, y: 332.265625 }],
        labelOffsetX: 62,
        labelOffsetY: 14,
      });
    }
  });

  it("型の箱と固定線は全配色で浮彫由来の共通骨組みを保つ", () => {
    const palettes = [
      "kinari", "celadon", "blueprint", "letterpress", "catalog",
      "terminal", "sketch", "neon", "relief", "site-colours",
    ] as const;
    for (const palette of palettes) {
      const diagram = 図の配色を変える(Catalog.presetDeliveryClasses, palette);
      expect(diagram.nodes.find((node) => node.id === "荷主"), palette).toMatchObject({
        h: 236.890625,
        posY: 188.4453125,
        rowLayout: { titleBaseline: 48, rowTop: 108.9, rowPitch: 46.5 },
        rowStripe: palette !== "neon" && palette !== "relief",
      });
      expect(diagram.nodes.find((node) => node.id === "荷物"), palette).toMatchObject({
        h: 353.890625,
        posY: 246.9453125,
        rowLayout: { titleBaseline: 73, rowTop: 133.9, rowPitch: 46.5 },
        rowStripe: palette !== "neon" && palette !== "relief",
      });
      expect(diagram.edges.find((edge) => edge.label === "である"), palette).toMatchObject({
        posX1: 530,
        posY1: 694,
        posX2: 750,
        posY2: 425.890625,
        waypoints: [{ x: 530, y: 561.9453125 }, { x: 750, y: 561.9453125 }],
      });
      expect(diagram.edges.find((edge) => edge.label === "集める"), palette).toMatchObject({
        posX1: 1332,
        posY1: 189.890625,
        posX2: 1024,
        posY2: 189.890625,
      });
      expect(diagram.edges.find((edge) => edge.label === "持つ"), palette).toMatchObject({
        posX1: 1544,
        posY1: 698,
        posX2: 1544,
        posY2: 356.890625,
      });
    }
  });

  it("関係・型・構成の線札は全配色で線と箱から 2 以上離れる", () => {
    const diagrams = [
      Catalog.presetDeliveryRelations,
      Catalog.presetDeliveryClasses,
      Catalog.presetDeliveryComponents,
    ];
    const palettes = [
      "kinari", "celadon", "blueprint", "letterpress", "catalog",
      "terminal", "sketch", "neon", "relief", "site-colours",
    ] as const;

    let 受付済の使う札 = 0;
    for (const sourceDiagram of diagrams) {
      for (const palette of palettes) {
        const laid = layout(図の配色を変える(sourceDiagram, palette));
        const 受付済 = laid.nodes.find((node) => node.id === "受付済");
        const 使う = laid.edges.find((edge) => edge.from === "受付済" && edge.to === "仕分け");
        for (const label of laid.bboxes.filter((box) => box.kind === "edge-label")) {
          const box = {
            left: label.x - 2,
            top: label.y - 2,
            right: label.x + label.w + 2,
            bottom: label.y + label.h + 2,
          };
          const nodeOverlap = laid.nodes.some((node) => 交わる(box, {
            left: node.cx - node.w / 2,
            top: node.cy - node.h / 2,
            right: node.cx + node.w / 2,
            bottom: node.cy + node.h / 2,
          }));
          const lineOverlap = laid.edges.some((edge) => 線が枠を通る(pathの点(edge.d), box));
          expect(nodeOverlap, `${sourceDiagram.id} / ${palette} / ${label.id}: 箱`).toBe(false);
          expect(lineOverlap, `${sourceDiagram.id} / ${palette} / ${label.id}: 線`).toBe(false);
          if (label.id === 使う?.id && 受付済 !== undefined) {
            受付済の使う札 += 1;
            expect(
              label.y - (受付済.cy + 受付済.h / 2),
              `${palette}: 受付済と「使う」の札の間`,
            ).toBeGreaterThanOrEqual(12);
          }
        }
      }
    }
    expect(受付済の使う札, "受付済から仕分けへの「使う」を見た配色数").toBe(10);
  });

  it("図録の宅配関係線は表の役を読み、見本帳の図だけで不透明にする", () => {
    const css = readFileSync(join(ROOT, "apps/playground-spa/src/styles/cdl-theme.css"), "utf8");
    const tableStart = css.indexOf('svg[data-cdl-stage][data-cdl-palette="catalog"] {');
    const tableEnd = css.indexOf('svg[data-cdl-stage][data-cdl-palette="terminal"] {', tableStart);
    const start = css.indexOf("/* 関係図の状態線と「使う」は、7 意匠それぞれの見本色を不透明で描く。 */");
    const end = css.indexOf("/* 浮彫の見本は意味色そのものを線へ使う。", start);
    expect(tableStart, "図録の値の表の始まり").toBeGreaterThan(-1);
    expect(tableEnd, "図録の値の表の終わり").toBeGreaterThan(tableStart);
    expect(start, "図録の宅配関係線の規則の始まり").toBeGreaterThan(-1);
    expect(end, "図録の宅配関係線の規則の終わり").toBeGreaterThan(start);
    const table = css.slice(tableStart, tableEnd);
    const rules = css.slice(start, end);

    expect(table).toContain("--dragon-delivery-relation-state: #e8705a;");
    expect(table).toContain("--dragon-delivery-relation-use: #4fae9a;");
    expect(rules).toContain('[data-cdl-diagram="delivery-relations-demo"]');
    expect(rules).toContain('--delivery-relation-state: var(--dragon-delivery-relation-state);');
    expect(rules).toContain('--delivery-relation-use: var(--dragon-delivery-relation-use);');
    expect(rules).toContain("stroke: var(--delivery-relation-state) !important;");
    expect(rules).toContain("stroke: var(--delivery-relation-use) !important;");
    expect(rules.match(/stroke-opacity: 1 !important;/g)).toHaveLength(2);
    expect(css).not.toContain('[data-cdl-diagram="契約と荷物と配送状態の関係"]');
  });

  it("関係・型の縞は元の8配色で描き、電飾・浮彫だけ描かない", () => {
    const css = readFileSync(join(ROOT, "apps/playground-spa/src/styles/cdl-theme.css"), "utf8");
    const tableStart = css.indexOf('svg[data-cdl-stage][data-cdl-palette="neon"] {');
    const tableEnd = css.indexOf('svg[data-cdl-stage][data-cdl-palette="relief"] {', tableStart);
    const start = css.indexOf("/* 電飾の表は均一な黒地");
    const end = css.indexOf("/* 順序図:", start);
    expect(tableStart, "電飾の値の表の始まり").toBeGreaterThan(-1);
    expect(tableEnd, "電飾の値の表の終わり").toBeGreaterThan(tableStart);
    expect(start, "電飾の表の規則の始まり").toBeGreaterThan(-1);
    expect(end, "電飾の表の規則の終わり").toBeGreaterThan(start);
    const table = css.slice(tableStart, tableEnd);
    const rules = css.slice(start, end);

    expect(table).toContain("--dragon-delivery-cyan-frame: #00e5ff;");
    expect(table).toContain("--dragon-delivery-violet-frame: #b26bff;");
    expect(table).toContain("--dragon-delivery-divider-width: 1px;");
    expect(table).toContain("--dragon-delivery-group-divider-width: 1.5px;");
    expect(rules).toContain("--delivery-neon-table-frame: var(--theme-lead);");
    expect(rules).toContain("--delivery-neon-table-frame: var(--dragon-delivery-cyan-frame);");
    expect(rules).toContain("--delivery-neon-table-frame: var(--dragon-delivery-violet-frame);");
    expect(rules).toContain("--delivery-neon-table-frame: var(--er-own);");
    expect(rules).toContain("color-mix(in srgb, var(--delivery-neon-table-frame) 32%, transparent)");
    expect(rules).toContain("color-mix(in srgb, var(--delivery-neon-table-frame) 24%, transparent)");
    expect(rules).toContain("stroke: var(--dragon-delivery-group-divider) !important;");
    expect(rules).toContain('[data-cdl-role="node-row-divider"] {\n  stroke:');
    expect(rules).toContain('[data-cdl-role="node-footer-divider"] {\n  stroke:');
    expect(rules).toContain('[data-cdl-role="node-row-group-divider"] {\n  stroke:');
    expect(rules).toContain("stroke-width: var(--dragon-delivery-divider-width) !important;");
    expect(rules).toContain("stroke-width: var(--dragon-delivery-group-divider-width) !important;");
    expect(rules).toContain("stroke-opacity: 1 !important;");
    expect(rules).toContain('[data-cdl-role="node-row-rule"] {\n  stroke: none !important;');
    expect(rules).not.toContain("node-row-stripe");

    const counts = (diagram: CdlDiagram) => {
      const document = new JSDOM(最後を描く(diagram), { contentType: "image/svg+xml" }).window.document;
      const count = (role: string): number => document.querySelectorAll(`[data-cdl-role="${role}"]`).length;
      return {
        title: count("node-row-divider"),
        footer: count("node-footer-divider"),
        group: count("node-row-group-divider"),
        rows: count("node-row-rule"),
        stripes: count("node-row-stripe"),
      };
    };

    const neonRelations = counts(図の配色を変える(Catalog.presetDeliveryRelations, "neon"));
    const neonClasses = counts(図の配色を変える(Catalog.presetDeliveryClasses, "neon"));
    expect(neonRelations.title, "関係の題の下の罫").toBeGreaterThan(0);
    expect(neonRelations.footer, "関係の足の上の罫").toBe(10);
    expect(neonRelations.stripes, "関係の縞").toBe(0);
    expect(neonClasses).toEqual({ title: 6, footer: 0, group: 6, rows: 7, stripes: 0 });

    for (const [sourceDiagram, visibleCount] of [
      [Catalog.presetDeliveryRelations, 6],
      [Catalog.presetDeliveryClasses, 11],
    ] as const) {
      const allThemes = ([
        "kinari", "celadon", "blueprint", "letterpress", "catalog",
        "terminal", "sketch", "neon", "relief", "site-colours",
      ] as const)
        .map((theme) => counts(図の配色を変える(sourceDiagram, theme)).stripes);
      expect(allThemes, `${sourceDiagram.id} の縞`).toEqual([
        visibleCount, visibleCount, visibleCount, visibleCount, visibleCount,
        visibleCount, visibleCount, 0, 0, visibleCount,
      ]);
    }
  });

  it("構成の区画と各箱は荷主を基準に見本の横位置へ置く", () => {
    const expectedLeftFromSender = {
      荷主: 0,
      "受付-api": 424,
      追跡: 884,
      地図サービス: 1374,
      "位置の控え": 884,
      台帳: 424,
      "配送便の端末": 1374,
      メール配信: 0,
      通知: 424,
    } as const;
    const themes = [
      "blueprint",
      "catalog",
      "sketch",
      "letterpress",
      "relief",
      "terminal",
      "neon",
    ] as const;
    const routes: Array<[string, CdlDiagram]> = [
      ["組み立て API", Catalog.presetDeliveryComponents],
      ["YAML", textDslToDiagram(source("sourceYaml__", "presetDeliveryComponents"))],
      [
        "JSON",
        jsonToDiagram(JSON.parse(source("sourceJson__", "presetDeliveryComponents")) as unknown),
      ],
    ];

    for (const [route, sourceDiagram] of routes) {
      const diagrams: ReadonlyArray<readonly [string, CdlDiagram]> = [
        ...themes.map((theme) => [theme, 図の配色を変える(sourceDiagram, theme)] as const),
        [
          "画面の色へ戻す",
          図の配色を変える(図の配色を変える(sourceDiagram, "relief"), "site-colours"),
        ],
      ];
      for (const [theme, diagram] of diagrams) {
        const laid = layout(diagram);
        const sender = laid.nodes.find((node) => node.id === "荷主");
        expect(sender, `${route} / ${theme} / 荷主`).toBeDefined();
        if (sender === undefined) continue;
        const senderLeft = sender.cx - sender.w / 2;
        const lane = laid.lanes.find((item) => item.id === "c4-l2");
        expect(lane, `${route} / ${theme} / c4-l2`).toBeDefined();
        if (lane !== undefined) {
          expect(
            Math.abs(lane.x - senderLeft - 374),
            `${route} / ${theme} / c4-l2: 荷主から ${lane.x - senderLeft}; ${JSON.stringify(laid.lanes.map((item) => ({ id: item.id, x: item.x, width: item.width })))}`,
          ).toBeLessThanOrEqual(2);
        }
        for (const [id, expected] of Object.entries(expectedLeftFromSender)) {
          const node = laid.nodes.find((item) => item.id === id);
          expect(node, `${route} / ${theme} / ${id}`).toBeDefined();
          if (node === undefined) continue;
          const actual = node.cx - node.w / 2 - senderLeft;
          expect(
            Math.abs(actual - expected),
            `${route} / ${theme} / ${id}: 荷主から ${actual} / 見本 ${expected}`,
          ).toBeLessThanOrEqual(2);
        }
        const tracking = laid.nodes.find((node) => node.id === "追跡");
        const ask = laid.edges.find((edge) => edge.label === "聞く");
        const move = laid.edges.find((edge) => edge.label === "移す");
        expect(tracking, `${route} / ${theme} / 追跡`).toBeDefined();
        expect(ask, `${route} / ${theme} / 聞く`).toBeDefined();
        expect(move, `${route} / ${theme} / 移す`).toMatchObject({
          posX1: 862.2,
          posY1: 600.8,
          posX2: 762.2,
          posY2: 600.8,
          labelOffsetX: 8,
        });
        expect(move?.overlay, `${route} / ${theme} / 移すの overlay`).toBeUndefined();
        if (tracking !== undefined && ask !== undefined) {
          expect(
            Math.abs((ask.posX2 ?? Number.NaN) - tracking.cx),
            `${route} / ${theme} / 聞くの終点 ${ask.posX2} / 追跡の中心 ${tracking.cx}`,
          ).toBeLessThanOrEqual(0.1);
        }
      }
    }
  });

  it("round-6d の構成座標では author 配置の札と箱の重なりを見逃さない", () => {
    const blueprint = 図の配色を変える(Catalog.presetDeliveryComponents, "blueprint");
    const l2 = new Set(["受付-api", "追跡", "位置の控え", "台帳", "通知"]);
    const right = new Set(["地図サービス", "配送便の端末"]);
    const round6d: CdlDiagram = {
      ...blueprint,
      lanes: blueprint.lanes.map((lane) =>
        lane.id === "c4-l2" ? { ...lane, x: 420, posX: 420 } : lane),
      nodes: blueprint.nodes.map((node) => {
        const dx = l2.has(node.id) ? 100 : right.has(node.id) ? 8 : 0;
        return dx === 0 ? node : { ...node, posX: (node.posX ?? 0) + dx };
      }),
      edges: blueprint.edges.map((edge) => {
        if (edge.label === "頼む") {
          return { ...edge, labelOffsetX: 19.8, labelOffsetY: 18.1453125 };
        }
        if (edge.label === "移す") {
          return { ...edge, labelOffsetX: -66.2, labelOffsetY: 18.1453125 };
        }
        return edge;
      }),
    };

    expect(崩れを数える(最後を描く(round6d), round6d).字の重なり).toBeGreaterThan(0);
  });

  it("28 図と画面の色で線の札を見本の大きさに保つ", () => {
    const 対象 = new Set<四図の鍵>([
      "presetDeliveryRelations",
      "presetDeliveryClasses",
      "presetDeliveryComponents",
    ]);
    const themes = Object.keys(固定意匠) as Array<keyof typeof 固定意匠>;
    let 描いた図 = 0;
    let 確かめた札 = 0;

    const 札を確かめる = (key: 四図の鍵, theme: string, diagram: CdlDiagram): void => {
      const document = new JSDOM(最後を描く(diagram), { contentType: "image/svg+xml" }).window.document;
      for (const edge of diagram.edges.filter((item) => item.label !== "")) {
        const label = edge.label as keyof typeof 線の札の見本幅;
        const expectedWidth = 線の札の見本幅[label];
        expect(expectedWidth, `${key} / ${theme} / ${edge.label} の見本幅`).toBeDefined();
        if (expectedWidth === undefined) continue;
        expect(edge.labelSize, `${key} / ${theme} / ${edge.label} の指定`).toEqual({
          width: expectedWidth,
          height: 40,
          fontSize: 21,
        });
        const group = [...document.querySelectorAll("[data-cdl-edge-label-for]")].find(
          (element) => element.getAttribute("data-cdl-edge-label-for") === edge.id,
        );
        const background = group?.querySelector('[data-cdl-role="edge-label-bg"]');
        const text = group?.querySelector('[data-cdl-role="edge-label"]');
        expect(background, `${key} / ${theme} / ${edge.label} の背景`).not.toBeNull();
        expect(text, `${key} / ${theme} / ${edge.label} の字`).not.toBeNull();
        if (background === null || background === undefined || text === null || text === undefined) continue;
        const width = 数(background.getAttribute("width"));
        const height = 数(background.getAttribute("height"));
        expect.soft(Math.abs(width - expectedWidth), `${key} / ${theme} / ${edge.label} の幅 ${width}`).toBeLessThanOrEqual(1);
        expect.soft(Math.abs(height - 40), `${key} / ${theme} / ${edge.label} の高さ ${height}`).toBeLessThanOrEqual(1);
        expect.soft(数(text.getAttribute("font-size")), `${key} / ${theme} / ${edge.label} の字`).toBe(21);
        expect.soft(数(background.getAttribute("x")) + width / 2, `${key} / ${theme} / ${edge.label} の中心 x`).toBe(0);
        expect.soft(数(background.getAttribute("y")) + height / 2, `${key} / ${theme} / ${edge.label} の中心 y`).toBe(0);
        確かめた札 += 1;
      }
    };

    for (const { key } of 四つの見本) {
      for (const theme of themes) {
        const diagram = 図の配色を変える((Catalog as CatalogModule)[key] as CdlDiagram, theme);
        renderToStaticMarkup(<CdlDiagramView diagram={diagram} laid={layout(diagram)} hideHeader />);
        描いた図 += 1;
        if (対象.has(key)) 札を確かめる(key, theme, diagram);
      }
    }
    for (const key of 対象) {
      const diagram = 図の配色を変える(
        図の配色を変える((Catalog as CatalogModule)[key] as CdlDiagram, "relief"),
        "site-colours",
      );
      札を確かめる(key, "site-colours", diagram);
      for (const [route, sourceDiagram] of [
        ["YAML", textDslToDiagram(source("sourceYaml__", key))],
        ["JSON", jsonToDiagram(JSON.parse(source("sourceJson__", key)) as unknown)],
      ] as const) {
        for (const edge of sourceDiagram.edges.filter((item) => item.label !== "")) {
          const label = edge.label as keyof typeof 線の札の見本幅;
          expect(edge.labelSize, `${key} / ${route} / ${edge.label} の指定`).toEqual({
            width: 線の札の見本幅[label],
            height: 40,
            fontSize: 21,
          });
        }
      }
    }

    expect(描いた図).toBe(28);
    expect(確かめた札).toBe(168);
  });

  it("構成の「道を聞く」の札を両側の箱から 4 以上離す", () => {
    const diagrams: ReadonlyArray<readonly [string, CdlDiagram]> = [
      ...(Object.keys(固定意匠) as Array<keyof typeof 固定意匠>).map((theme) => [
        theme,
        図の配色を変える(Catalog.presetDeliveryComponents, theme),
      ] as const),
      [
        "site-colours",
        図の配色を変える(図の配色を変える(Catalog.presetDeliveryComponents, "relief"), "site-colours"),
      ],
    ];

    for (const [theme, diagram] of diagrams) {
      const document = new JSDOM(最後を描く(diagram), { contentType: "image/svg+xml" }).window.document;
      const edge = diagram.edges.find((item) => item.label === "道を聞く");
      expect(edge, `${theme} / 道を聞く`).toBeDefined();
      if (edge === undefined) continue;
      const background = [...document.querySelectorAll('[data-cdl-role="edge-label-bg"]')].find(
        (element) => element.closest("[data-cdl-edge-label-for]")?.getAttribute("data-cdl-edge-label-for") === edge.id,
      );
      const tracking = document.querySelector('[data-cdl-node="追跡"][data-cdl-cx]');
      const map = document.querySelector('[data-cdl-node="地図サービス"][data-cdl-cx]');
      expect(background, `${theme} / 道を聞くの背景`).toBeDefined();
      expect(tracking, `${theme} / 追跡`).not.toBeNull();
      expect(map, `${theme} / 地図サービス`).not.toBeNull();
      if (background === undefined || tracking === null || map === null) continue;
      const labelBox = rect枠(background);
      const leftGap = labelBox.left - node枠(tracking).right;
      const rightGap = node枠(map).left - labelBox.right;
      expect.soft(leftGap, `${theme} / 追跡からの間隔 ${leftGap}`).toBeGreaterThanOrEqual(4);
      expect.soft(rightGap, `${theme} / 地図サービスからの間隔 ${rightGap}`).toBeGreaterThanOrEqual(4);
    }
  });

  it("28 図を描き、固定線の印と構成の札を確かめる", () => {
    const 図名: Partial<Record<四図の鍵, "関係" | "型" | "構成">> = {
      presetDeliveryRelations: "関係",
      presetDeliveryClasses: "型",
      presetDeliveryComponents: "構成",
    };
    let 描いた図 = 0;
    let 確かめた線 = 0;
    let 確かめた札 = 0;

    for (const { key } of 四つの見本) {
      for (const theme of Object.keys(固定意匠) as Array<keyof typeof 固定意匠>) {
        const diagram = 図の配色を変える((Catalog as CatalogModule)[key] as CdlDiagram, theme);
        const svg = renderToStaticMarkup(<CdlDiagramView diagram={diagram} laid={layout(diagram)} hideHeader />);
        描いた図 += 1;
        const 名前 = 図名[key];
        const fixedEdges = diagram.edges.filter((edge) =>
          edge.posX1 !== undefined && edge.posY1 !== undefined && edge.posX2 !== undefined && edge.posY2 !== undefined);
        if (名前 === undefined) {
          expect(fixedEdges, `${key} / ${theme}`).toEqual([]);
          continue;
        }

        const wires = 見本の線を読む(名前, "relief");
        const document = new JSDOM(svg, { contentType: "image/svg+xml" }).window.document;
        if (名前 === "構成") {
          for (const labelText of ["頼む", "移す"] as const) {
            const edge = diagram.edges.find((item) => item.label === labelText);
            expect(edge, `構成 / ${theme} / ${labelText} の線`).toBeDefined();
            if (edge === undefined) continue;
            const index = diagram.edges.indexOf(edge);
            const expected = wires[index];
            expect(expected, `構成 / ${theme} / ${labelText} の見本線`).toBeDefined();
            if (expected === undefined) continue;
            const edgeElement = [...document.querySelectorAll("[data-cdl-edge]")].find(
              (element) => element.getAttribute("data-cdl-edge") === edge.id,
            );
            const path = edgeElement?.querySelector('[data-cdl-role="edge-line"]');
            const label = [...document.querySelectorAll('[data-cdl-role="edge-label-bg"]')].find(
              (element) => element.closest("[data-cdl-edge-label-for]")?.getAttribute("data-cdl-edge-label-for") === edge.id,
            );
            expect(path, `構成 / ${theme} / ${labelText} の SVG path`).not.toBeNull();
            expect(label, `構成 / ${theme} / ${labelText} の札`).toBeDefined();
            if (path === null || path === undefined || label === undefined) continue;
            const points = pathの点(edgeElement?.getAttribute("data-cdl-path-d") ?? path.getAttribute("d") ?? "");
            const actualTip = points.at(-1);
            expect(actualTip, `構成 / ${theme} / ${labelText} の矢じりの先端`).toBeDefined();
            if (actualTip === undefined) continue;
            const actualLabel = rect枠(label);
            const actualArrow = 点群の枠(expected.印, {
              x: actualTip.x - expected.印の先端.x,
              y: actualTip.y - expected.印の先端.y,
            });
            expect(
              交わる(actualLabel, actualArrow),
              `構成 / ${theme} / ${labelText} の札 ${JSON.stringify(actualLabel)} と矢じり ${JSON.stringify(actualArrow)}`,
            ).toBe(false);
            確かめた札 += 1;
          }
        }
        for (const edge of fixedEdges) {
          const index = diagram.edges.indexOf(edge);
          const expected = wires[index];
          expect(expected, `${名前} / ${theme} / ${edge.from} -> ${edge.to}`).toBeDefined();
          if (expected === undefined) continue;

          const group = [...document.querySelectorAll("[data-cdl-edge]")].find(
            (element) => element.getAttribute("data-cdl-edge") === edge.id,
          );
          const path = group?.querySelector('[data-cdl-role="edge-line"]');
          expect(path, `${名前} / ${theme} / ${edge.id} の SVG path`).not.toBeNull();
          if (path === null || path === undefined) continue;
          const points = pathの点(group?.getAttribute("data-cdl-path-d") ?? path.getAttribute("d") ?? "");
          const headに印 = edge.head !== "none";
          const tailに印 = edge.tailHead !== undefined && edge.tailHead !== "none";
          expect(
            path.getAttribute("marker-end") !== null,
            `${名前} / ${theme} / ${edge.id} の to 側の印`,
          ).toBe(headに印);
          expect(
            path.getAttribute("marker-start") !== null,
            `${名前} / ${theme} / ${edge.id} の from 側の印`,
          ).toBe(tailに印);

          const actualTip = headに印 ? points.at(-1) : points[0];
          expect(actualTip, `${名前} / ${theme} / ${edge.id} の印の先端`).toBeDefined();
          if (actualTip === undefined) continue;
          if (名前 !== "構成") {
            const 箱へ進む軸 = Math.abs(expected.箱へ向かう.x) > Math.abs(expected.箱へ向かう.y) ? "x" : "y";
            expect(
              Math.abs(actualTip[箱へ進む軸] - expected.印の先端[箱へ進む軸]),
              `${名前} / ${theme} / ${edge.id} の箱へ進む軸 ${箱へ進む軸}`,
            ).toBeLessThanOrEqual(0.1);
          }
          const targetId = headに印 ? edge.to : edge.from;
          const target = document.querySelector(`[data-cdl-node="${targetId}"][data-cdl-cx]`);
          expect(target, `${名前} / ${theme} / ${edge.id} の相手 ${targetId}`).not.toBeNull();
          if (target === null) continue;
          const actualGap = 印と箱の隙間(actualTip, expected.箱へ向かう, node枠(target));
          let expectedGap = 印と箱の隙間(expected.印の先端, expected.箱へ向かう, node枠(target));
          if (名前 === "構成") expectedGap = edge.label === "移す" ? 0 : 2;
          expect(
            Math.abs(actualGap - expectedGap),
            `${名前} / ${theme} / ${edge.id} の隙間 今 ${actualGap} / 見本 ${expectedGap}`,
          ).toBeLessThanOrEqual(1);
          確かめた線 += 1;
        }
      }
    }

    expect(描いた図).toBe(28);
    expect(確かめた線).toBe(105);
    expect(確かめた札).toBe(14);
  });

  it("28 図と画面の色の全ての線を箱の縁で止め、箱の内側を通さない", () => {
    const themes = [undefined, ...(Object.keys(固定意匠) as Array<keyof typeof 固定意匠>)] as const;
    let 描いた図 = 0;
    let 確かめた線 = 0;

    for (const { key } of 四つの見本) {
      for (const theme of themes) {
        const sourceDiagram = (Catalog as CatalogModule)[key] as CdlDiagram;
        const diagram = theme === undefined ? sourceDiagram : 図の配色を変える(sourceDiagram, theme);
        const svg = renderToStaticMarkup(<CdlDiagramView diagram={diagram} laid={layout(diagram)} hideHeader />);
        const document = new JSDOM(svg, { contentType: "image/svg+xml" }).window.document;
        const nodes = [...document.querySelectorAll("[data-cdl-node][data-cdl-cx]")];
        描いた図 += 1;

        for (const edge of diagram.edges) {
          const group = [...document.querySelectorAll("[data-cdl-edge]")].find(
            (element) => element.getAttribute("data-cdl-edge") === edge.id,
          );
          const path = group?.querySelector('[data-cdl-role="edge-line"]');
          expect(path, `${key} / ${theme ?? "画面の色"} / ${edge.id} の線`).not.toBeNull();
          if (path === null || path === undefined) continue;
          const shift = 平行移動(path);
          const points = pathの点(group?.getAttribute("data-cdl-path-d") ?? path.getAttribute("d") ?? "")
            .map((point) => ({ x: point.x + shift.x, y: point.y + shift.y }));
          const source = nodes.find((node) => node.getAttribute("data-cdl-node") === edge.from);
          const target = nodes.find((node) => node.getAttribute("data-cdl-node") === edge.to);
          expect(source, `${edge.id} の出どころ ${edge.from}`).toBeDefined();
          expect(target, `${edge.id} の行き先 ${edge.to}`).toBeDefined();
          expect(points.length, `${edge.id} の道筋`).toBeGreaterThanOrEqual(2);
          if (source === undefined || target === undefined || points.length < 2) continue;

          const head = edge.head ?? "triangle";
          const markerSide = head !== "none" ? "end" : "start";
          const markerTarget = markerSide === "end" ? target : source;
          const endpoint = markerSide === "end" ? points.at(-1)! : points[0]!;
          const neighbour = markerSide === "end" ? points.at(-2)! : points[1]!;
          const length = Math.hypot(endpoint.x - neighbour.x, endpoint.y - neighbour.y);
          const direction = {
            x: (endpoint.x - neighbour.x) / length,
            y: (endpoint.y - neighbour.y) / length,
          };
          /* triangle / diamond は CSS の 2 倍描画による先端、open は cdl の 14 幅の marker 枠までを数える。 */
          const marker = markerSide === "end" ? head : edge.tailHead;
          const reach = marker === "triangle" || marker === "diamond"
            ? 2.8
            : marker === "dot" || marker === "open"
              ? 14
              : 0;
          const tip = { x: endpoint.x + direction.x * reach, y: endpoint.y + direction.y * reach };
          expect.soft(
            印と箱の隙間(tip, direction, node枠(markerTarget)),
            `${key} / ${theme ?? "画面の色"} / ${edge.id} の矢じり ${JSON.stringify(tip)}`,
          ).toBeLessThanOrEqual(2);

          const targetParent = target.getAttribute("data-cdl-nest-in");
          for (const node of nodes) {
            const nodeId = node.getAttribute("data-cdl-node") ?? "";
            /*
             * 行き先を抱える箱は、子へ届く線が必ず内側を通るため除く。
             * 区画も通過を許すが、lane-container は node の一覧へ入らないためここでは数えない。
             */
            if (nodeId === targetParent) continue;
            const visiblePoints = nodeId === edge.from
              ? 線の端を印の内側まで縮める(points, "start", 14)
              : nodeId === edge.to
                ? 線の端を印の内側まで縮める(points, "end", 14)
                : points;
            const crossed = visiblePoints.slice(1).some((point, index) =>
              線分が箱の内側を通る(visiblePoints[index]!, point, node枠(node)));
            expect.soft(
              crossed,
              `${key} / ${theme ?? "画面の色"} / ${edge.id} が ${nodeId}` +
                `${nodeId === edge.from ? " (出どころ)" : nodeId === edge.to ? " (行き先)" : " (別の箱)"} の内側を通る`,
            ).toBe(false);
          }
          確かめた線 += 1;
        }
      }
    }

    expect(描いた図).toBe(32);
    expect(確かめた線).toBe(184);
  });

  it.each(四つの見本)("$title は SVG 座標で数えた 6 種の崩れが 0", ({ key }) => {
    const diagram = (Catalog as CatalogModule)[key] as CdlDiagram;
    expect(崩れを数える(最後を描く(diagram), diagram), key).toEqual({
      行のはみ出し: 0,
      入れ子のはみ出し: 0,
      箱の重なり: 0,
      線から離れた札: 0,
      字の重なり: 0,
      図の大きさ: 0,
    });
  });

  it.each(四つの見本)("$title は 7 意匠へ切り替えた SVG でも 6 種の崩れが 0", ({ key }) => {
    const diagram = (Catalog as CatalogModule)[key] as CdlDiagram;
    const themes = ["blueprint", "catalog", "sketch", "letterpress", "relief", "terminal", "neon"] as const;
    expect(themes).toHaveLength(7);
    for (const theme of themes) {
      const themed = 図の配色を変える(diagram, theme);
      expect(崩れを数える(最後を描く(themed), themed), `${key} / ${theme}`).toEqual({
        行のはみ出し: 0,
        入れ子のはみ出し: 0,
        箱の重なり: 0,
        線から離れた札: 0,
        字の重なり: 0,
        図の大きさ: 0,
      });
    }
  });
  it("Phase 1 の形の要素 75 行を全て検査する", () => {
    expect(形の要素).toHaveLength(75);
    const svgs = new Map<四図の鍵, string>();
    for (const row of 形の要素) {
      const diagram = (Catalog as CatalogModule)[row.図] as CdlDiagram | undefined;
      expect(diagram, `${row.図} が無い`).toBeDefined();
      const svg = svgs.get(row.図) ?? 最後を描く(diagram!);
      svgs.set(row.図, svg);
      expect(selectorの数(svg, row.selector), `${row.図} / ${row.行}`).toBe(row.今);
      expect(row.今, `${row.図} / ${row.行} は見本と一致しない`).toBe(row.見本);
    }
  });

  it.each(四つの見本)("$title の組み立て API・YAML・JSON が同じ登場物と札を持つ", ({ key, title, people, relations }) => {
    const diagrams = [
      (Catalog as CatalogModule)[key],
      textDslToDiagram(source("sourceYaml__", key)),
      jsonToDiagram(JSON.parse(source("sourceJson__", key)) as unknown),
    ];

    for (const diagram of diagrams) {
      expect(diagram, `${key} が無い`).toBeDefined();
      const text = JSON.stringify(diagram);
      expect((diagram as { topic?: string }).topic).toBe(title);
      for (const person of people) expect(text, `${key} に ${person} が無い`).toContain(person);
      for (const relation of relations) expect(text, `${key} に ${relation} が無い`).toContain(relation);
      if (key === "presetDeliveryRelations") {
        const relationDiagram = diagram as CdlDiagram;
        const edge = relationDiagram.edges.find((item) => item.from === "受付済" && item.to === "仕分け");
        expect(edge, "受付済 -> 仕分け").toBeDefined();
        expect(edge?.overlay, "効き目の無い overlay を戻さない").toBeUndefined();
      }
    }
  });

  it("旧 id と旧題の名指しが履歴と proposal を除く repo に無い", () => {
    const oldNames = [
      ["preset", "Er"].join(""),
      ["preset", "Class", "Diagram"].join(""),
      ["preset", "Sequence"].join(""),
      ["テーブル間の関係", "を表す図"].join(""),
      ["クラスどうしの 6 種の関係", "を示す UML クラス図"].join(""),
      ["時系列のやり取り", "を縦の時間軸で並べる図"].join(""),
    ];
    const paths = [...new Set([...走査するfile(ROOT), ...未追跡のfile(ROOT)])]
      .filter((path) => path !== "CHANGELOG.md")
      .filter((path) => !path.startsWith("docs/design/proposal/"))
      .filter((path) => !path.startsWith("docs/design/notation/"));
    const hits: string[] = [];
    for (const path of paths) {
      let body = "";
      try {
        body = readFileSync(join(ROOT, path), "utf8");
      } catch {
        continue;
      }
      for (const [index, oldName] of oldNames.entries()) {
        const found = index < 3
          ? new RegExp(`${oldName}(?![A-Za-z0-9])`, "u").test(body)
          : body.includes(oldName);
        if (found) hits.push(`${path}: ${oldName}`);
      }
    }
    expect(hits, `旧名が残っている:\n${hits.join("\n")}`).toEqual([]);
  });
});
