#!/usr/bin/env node
/**
 * interactive catalog の touchable element 同士の overlap を検出する diagnostic script。
 *
 * SPA を起動した状態で `node apps/playground-spa/scripts/detect-overlap.mjs` を実行、
 * /catalog/interactive の全 diagram を巡回して以下を検査する:
 *
 *   - 触れる要素 (input / button / [data-cdl-input] / [data-cdl-node] /
 *     .cdl-ip-toggle-slot / .cdl-ip-xypad-pad / .cdl-ip-stepper-btn /
 *     .cdl-ip-radio-option) の bounding box を測定
 *   - pairwise で 2 要素 rect の交差面積を計算
 *   - 親子関係でなく面積が閾値超えで overlap と判定、 報告する
 *
 * 使い方: 別 terminal で dev server 起動 (`pnpm --filter dragon-playground-spa dev`) してから
 *   `node apps/playground-spa/scripts/detect-overlap.mjs [--url http://localhost:4323]`
 *
 * 出力 = 各 diagram について overlap ペアの一覧、 深刻度 (重複面積 / 小さい要素面積の比率)。
 */

import { chromium } from "playwright";

const args = new Map(
  process.argv
    .slice(2)
    .map((a, i, arr) => (a.startsWith("--") ? [a.slice(2), arr[i + 1]] : null))
    .filter(Boolean),
);
const URL = args.get("url") ?? "http://localhost:4323";
const CATALOG_URL = `${URL}/catalog/interactive`;

/** overlap 検出の閾値。 交差面積が小さい要素の面積の 5% を超えると overlap 判定。 */
const OVERLAP_AREA_RATIO_THRESHOLD = 0.05;
/** 最小 overlap 面積 (px^2)、 これ未満は誤差扱いで無視 */
const MIN_OVERLAP_AREA_PX = 4;

// interactive panel 内の touchable のみを対象、 sidebar / navbar / catalog-* は対象外
const TOUCHABLE_SELECTOR = [
  ".cdl-ip-root input:not([type='hidden'])",
  ".cdl-ip-root button",
  ".cdl-ip-root select",
  ".cdl-ip-root textarea",
  ".cdl-ip-root [role='button']",
  ".cdl-ip-root [data-cdl-input]",
  "[data-cdl-node]",
  ".cdl-ip-toggle",
  ".cdl-ip-toggle-slot",
  ".cdl-ip-xypad-pad",
  ".cdl-ip-stepper-btn",
  ".cdl-ip-radio-option",
  ".cdl-ip-color-input",
  ".cdl-ip-tabs-btn",
  ".cdl-ip-multi-select-chip",
  ".cdl-ip-timeline-btn",
].join(",");

async function detectForDiagram(page, diagramId) {
  // sidebar の item を click して切替
  const btns = await page.$$("button.catalog-list-item");
  let clicked = false;
  for (const btn of btns) {
    const idEl = await btn.$(".catalog-list-item-id");
    const text = idEl ? await idEl.textContent() : "";
    if (text && text.includes(diagramId)) {
      await btn.click();
      clicked = true;
      break;
    }
  }
  if (!clicked) return { diagramId, error: "diagram not found in sidebar" };
  await page.waitForTimeout(600);

  const result = await page.evaluate(
    ({ selector, minAreaPx, ratioThreshold }) => {
      const elems = Array.from(document.querySelectorAll(selector));
      const items = elems
        .map((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.width < 1 || rect.height < 1) return null;
          const style = window.getComputedStyle(el);
          if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
            return null;
          }
          return {
            el,
            rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
            id: el.id || "",
            tag: el.tagName.toLowerCase(),
            classes: el.className && typeof el.className === "string" ? el.className : "",
            cdlInput: el.getAttribute("data-cdl-input") || "",
            cdlNode: el.getAttribute("data-cdl-node") || "",
          };
        })
        .filter(Boolean);

      const overlaps = [];
      const findings = [];
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i];
          const b = items[j];
          if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
          const ix = Math.max(a.rect.x, b.rect.x);
          const iy = Math.max(a.rect.y, b.rect.y);
          const iw = Math.min(a.rect.x + a.rect.w, b.rect.x + b.rect.w) - ix;
          const ih = Math.min(a.rect.y + a.rect.h, b.rect.y + b.rect.h) - iy;
          if (iw <= 0 || ih <= 0) continue;
          const area = iw * ih;
          if (area < minAreaPx) continue;
          const areaA = a.rect.w * a.rect.h;
          const areaB = b.rect.w * b.rect.h;
          const smaller = Math.min(areaA, areaB);
          const ratio = area / smaller;
          if (ratio < ratioThreshold) continue;
          overlaps.push({
            kind: "rect-overlap",
            a: brief(a),
            b: brief(b),
            overlapArea: Math.round(area),
            severity: Number(ratio.toFixed(3)),
          });
        }
      }

      // elementFromPoint 経路 = 各 touchable の中心点で hit test して、 想定 element が
      // 実際に click 可能か検査。 別 touchable が hit するなら visual overlap suspect。
      // ─ さらに 8 sample 点 (中心 + 上下左右 + 四隅) で hit test して pointer 通過 check
      for (const it of items) {
        const cx = it.rect.x + it.rect.w / 2;
        const cy = it.rect.y + it.rect.h / 2;
        // 中心点
        const samples = [
          [cx, cy, "center"],
          [it.rect.x + 3, cy, "left"],
          [it.rect.x + it.rect.w - 3, cy, "right"],
          [cx, it.rect.y + 3, "top"],
          [cx, it.rect.y + it.rect.h - 3, "bottom"],
        ];
        for (const [x, y, pos] of samples) {
          const hit = document.elementFromPoint(x, y);
          if (!hit) continue;
          if (hit === it.el) continue;
          if (it.el.contains(hit) || hit.contains(it.el)) continue;
          // hit が別の touchable element (or その子孫) か
          const hitTouchable = hit.closest(selector);
          if (!hitTouchable || hitTouchable === it.el) continue;
          if (it.el.contains(hitTouchable) || hitTouchable.contains(it.el)) continue;
          // 別 touchable が pointer 経路上にある = visual overlap suspect
          const hitRect = hitTouchable.getBoundingClientRect();
          findings.push({
            kind: "pointer-hit-mismatch",
            expected: brief(it),
            actual: {
              tag: hitTouchable.tagName.toLowerCase(),
              classes: typeof hitTouchable.className === "string" ? hitTouchable.className : "",
              cdlInput: hitTouchable.getAttribute("data-cdl-input") || "",
              cdlNode: hitTouchable.getAttribute("data-cdl-node") || "",
              rect: { x: hitRect.x, y: hitRect.y, w: hitRect.width, h: hitRect.height },
            },
            samplePoint: pos,
          });
          break; // 1 element につき 1 finding
        }
      }

      // container overflow 検査 = 子 touchable が親 item の可視 rect を超えていないか
      // (例 = xypad thumb が pad の外に出ている / stepper button が controls container 外)
      const containers = document.querySelectorAll(".cdl-ip-item");
      for (const c of containers) {
        const crect = c.getBoundingClientRect();
        const kids = c.querySelectorAll(
          "input,button,.cdl-ip-xypad-thumb,.cdl-ip-slider-track,.cdl-ip-stepper-btn",
        );
        for (const k of kids) {
          const kr = k.getBoundingClientRect();
          if (kr.width === 0 || kr.height === 0) continue;
          const overflowLeft = crect.x - kr.x;
          const overflowRight = kr.x + kr.width - (crect.x + crect.width);
          const overflowTop = crect.y - kr.y;
          const overflowBottom = kr.y + kr.height - (crect.y + crect.height);
          const maxOverflow = Math.max(overflowLeft, overflowRight, overflowTop, overflowBottom);
          if (maxOverflow > 4) {
            findings.push({
              kind: "container-overflow",
              child: {
                tag: k.tagName.toLowerCase(),
                classes: typeof k.className === "string" ? k.className : "",
              },
              container: {
                classes: typeof c.className === "string" ? c.className : "",
              },
              overflowPx: Math.round(maxOverflow),
            });
          }
        }
      }

      // visual-proximity 検査 = interactive panel が card 内の text (h1 / h2 / p の
      // subtitle / description) と近すぎ or 重なっていないか。 panel の top edge と直上
      // text bottom edge の距離が 8px 未満なら「crowded」 警告。
      const panels = document.querySelectorAll(".cdl-ip-root");
      for (const panel of panels) {
        const pr = panel.getBoundingClientRect();
        if (pr.width === 0 || pr.height === 0) continue;
        // 直上 100px 内にある text-bearing element を探す
        const nearbyTexts = Array.from(
          document.querySelectorAll(
            ".catalog-preview-title,.catalog-preview-sub,.catalog-preview-id,h1,h2,h3,p",
          ),
        ).filter((t) => {
          const tr = t.getBoundingClientRect();
          if (tr.width === 0 || tr.height === 0) return false;
          if (panel.contains(t) || t.contains(panel)) return false;
          const gap = pr.y - (tr.y + tr.height);
          const horizOverlap = tr.x < pr.x + pr.width && tr.x + tr.width > pr.x;
          return gap >= -tr.height && gap < 8 && horizOverlap;
        });
        for (const t of nearbyTexts) {
          const tr = t.getBoundingClientRect();
          const gap = pr.y - (tr.y + tr.height);
          findings.push({
            kind: "text-proximity",
            panel: { rect: { x: pr.x, y: pr.y, w: pr.width, h: pr.height } },
            text: {
              tag: t.tagName.toLowerCase(),
              classes: typeof t.className === "string" ? t.className : "",
              content: (t.textContent ?? "").trim().slice(0, 60),
              rect: { x: tr.x, y: tr.y, w: tr.width, h: tr.height },
            },
            gapPx: Math.round(gap),
          });
        }
      }

      // panel と SVG diagram の 重なり検査 = 実際に overlap する時のみ flag
      // (0px 接触は border-bottom 経路で意図的に隣接する design pattern)
      const svgs = document.querySelectorAll("svg[data-cdl-theme]");
      for (const panel of panels) {
        const pr = panel.getBoundingClientRect();
        for (const svg of svgs) {
          const sr = svg.getBoundingClientRect();
          if (sr.width === 0 || sr.height === 0) continue;
          const gap = sr.y - (pr.y + pr.height);
          if (gap < -2) {
            findings.push({
              kind: "panel-svg-overlap",
              gapPx: Math.round(gap),
              note: "panel bottom と SVG top が実 overlap している",
            });
          }
        }
      }

      function brief(item) {
        return {
          tag: item.tag,
          classes: item.classes,
          cdlInput: item.cdlInput,
          cdlNode: item.cdlNode,
          rect: item.rect,
        };
      }
      return {
        elementCount: items.length,
        overlaps: overlaps.sort((x, y) => y.severity - x.severity),
        findings,
      };
    },
    { selector: TOUCHABLE_SELECTOR, minAreaPx: MIN_OVERLAP_AREA_PX, ratioThreshold: OVERLAP_AREA_RATIO_THRESHOLD },
  );

  return { diagramId, ...result };
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto(CATALOG_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // sidebar から diagram id をすべて拾う
  const diagramIds = await page.$$eval("button.catalog-list-item .catalog-list-item-id", (nodes) =>
    nodes.map((n) => (n.textContent ?? "").trim()).filter(Boolean),
  );

  const report = [];
  for (const id of diagramIds) {
    if (!id.startsWith("interactive-")) continue;
    const r = await detectForDiagram(page, id);
    report.push(r);
  }

  await browser.close();

  // 出力
  let totalIssues = 0;
  for (const d of report) {
    if (d.error) {
      console.log(`❌ ${d.diagramId}: ${d.error}`);
      continue;
    }
    const overlaps = d.overlaps ?? [];
    const findings = d.findings ?? [];
    const issues = overlaps.length + findings.length;
    totalIssues += issues;
    if (issues === 0) {
      console.log(`✅ ${d.diagramId} (elements: ${d.elementCount})`);
      continue;
    }
    console.log(`⚠️  ${d.diagramId} (elements: ${d.elementCount}, issues: ${issues})`);
    for (const o of overlaps) {
      console.log(
        `    [rect ${(o.severity * 100).toFixed(0)}%] ${describe(o.a)}  <>  ${describe(o.b)}  (${o.overlapArea}px²)`,
      );
    }
    for (const f of findings) {
      if (f.kind === "pointer-hit-mismatch") {
        console.log(
          `    [pointer ${f.samplePoint}] expected=${describe(f.expected)} but hit=${describe(f.actual)}`,
        );
      } else if (f.kind === "container-overflow") {
        console.log(
          `    [overflow ${f.overflowPx}px] ${f.child.tag}.${f.child.classes.slice(0, 40)} outside ${f.container.classes.slice(0, 40)}`,
        );
      } else if (f.kind === "text-proximity") {
        console.log(
          `    [text-close ${f.gapPx}px] panel top too close to ${f.text.tag}.${f.text.classes.slice(0, 40)}: "${f.text.content}"`,
        );
      } else if (f.kind === "panel-svg-overlap") {
        console.log(`    [panel-svg ${f.gapPx}px] ${f.note}`);
      }
    }
  }

  console.log("");
  console.log("─".repeat(60));
  console.log(`total diagrams: ${report.length}`);
  console.log(`total issues: ${totalIssues}`);
  if (errors.length > 0) {
    console.log(`page errors: ${errors.length}`);
    errors.forEach((e) => console.log(`  - ${e}`));
  }
  if (totalIssues > 0) process.exit(1);
}

function describe(item) {
  if (item.cdlInput) return `input(${item.cdlInput})`;
  if (item.cdlNode) return `node(${item.cdlNode})`;
  const cls = item.classes
    .split(/\s+/)
    .filter((c) => c.startsWith("cdl-ip-") || c === "cdl-ip-toggle" || c === "cdl-ip-xypad")
    .slice(0, 2)
    .join(".");
  return cls ? `${item.tag}.${cls}` : item.tag;
}

main().catch((e) => {
  console.error("fatal:", e);
  process.exit(2);
});
