import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  CATALOG_SKELETON_KIND,
  FLOWCHART_SKELETON_PARTS,
  avoidCatalogSkeletonBadgeOverlaps,
  catalogSkeletonLineBadgePoint,
  catalogSkeletonPartBadgeTarget,
  catalogSkeletonPartTarget,
  type CatalogSkeletonBadge,
  type CatalogSkeletonPart,
  type CatalogSkeletonProperty,
} from "@/lib/catalog-skeleton-parts";

type PartValue = { kind: string; value: string };
type PartRow = { number: number; part: CatalogSkeletonPart; values: PartValue[] };
type Snapshot = { diagramType: string | null; rows: PartRow[]; badges: CatalogSkeletonBadge[] };

const EMPTY_SNAPSHOT: Snapshot = { diagramType: null, rows: [], badges: [] };
const VALUE_VARIABLE = /var\(--(?:cdl|dragon|er)-/;

function styleRules(rules: CSSRuleList, result: CSSStyleRule[] = []): CSSStyleRule[] {
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSStyleRule) {
      result.push(rule);
    } else if ("cssRules" in rule && rule.cssRules instanceof CSSRuleList) {
      styleRules(rule.cssRules, result);
    }
  }
  return result;
}

function documentStyleRules(): CSSStyleRule[] {
  const result: CSSStyleRule[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      styleRules(sheet.cssRules, result);
    } catch {
      // 別 origin の stylesheet は規則を読めない。描画済み要素の属性から読める値は続けて出す。
    }
  }
  return result;
}

function computedPartValues(
  svg: SVGSVGElement,
  part: CatalogSkeletonPart,
  rules: CSSStyleRule[],
): PartValue[] {
  const root = catalogSkeletonPartTarget(svg, part);
  if (!root) return [];

  const values = new Map<string, string>();
  if (part.selector === ":scope") {
    values.set(CATALOG_SKELETON_KIND["background-color"], getComputedStyle(svg).backgroundColor);
  }

  const elements =
    part.selector === ":scope"
      ? [svg]
      : [root, ...Array.from(root.querySelectorAll<SVGElement>("*"))].slice(0, 8);

  for (const element of elements) {
    const computed = getComputedStyle(element);
    const text = /^(text|tspan)$/i.test(element.tagName);
    const remember = (property: CatalogSkeletonProperty): void => {
      const kind = text && property === "fill" ? "字の色" : CATALOG_SKELETON_KIND[property];
      if (!values.has(kind)) values.set(kind, computed.getPropertyValue(property).trim());
    };

    for (const rule of rules) {
      let matches = false;
      try {
        matches = element.matches(rule.selectorText);
      } catch {
        matches = false;
      }
      if (!matches) continue;
      for (const property of Array.from(rule.style)) {
        if (!(property in CATALOG_SKELETON_KIND)) continue;
        if (!VALUE_VARIABLE.test(rule.style.getPropertyValue(property))) continue;
        remember(property as CatalogSkeletonProperty);
      }
    }

    for (const property of Object.keys(CATALOG_SKELETON_KIND) as CatalogSkeletonProperty[]) {
      const raw = element.getAttribute(property) ?? element.style.getPropertyValue(property);
      if (raw && VALUE_VARIABLE.test(raw)) remember(property);
    }
  }

  return [...values].map(([kind, value]) => ({ kind, value }));
}

function badgePosition(
  stage: HTMLElement,
  target: SVGElement,
  part: CatalogSkeletonPart,
  number: number,
): CatalogSkeletonBadge | null {
  const stageBox = stage.getBoundingClientRect();
  if (part.badgeTarget === "longest") {
    const point = catalogSkeletonLineBadgePoint(target);
    return point
      ? { number, left: point.x - stageBox.left - 12, top: point.y - stageBox.top - 12 }
      : null;
  }

  const box = target.getBoundingClientRect();
  let x = box.left + box.width / 2;
  let y = box.top + box.height / 2;

  if (part.anchor === "fixed") {
    x = stageBox.left + 22;
    y = stageBox.top + 22;
  } else if (part.anchor === "top-left") {
    x = box.left;
    y = box.top;
  } else if (part.anchor === "right") {
    x = box.right + 14;
  } else if (part.anchor === "top") {
    y = box.top - 14;
  }

  return {
    number,
    left: x - stageBox.left - 12,
    top: y - stageBox.top - 12,
  };
}

export function readSnapshot(skeletonStage: HTMLElement, designStage: HTMLElement): Snapshot {
  const skeletonSvg = skeletonStage.querySelector<SVGSVGElement>("svg[data-cdl-stage]");
  const designSvg = designStage.querySelector<SVGSVGElement>("svg[data-cdl-stage]");
  if (!skeletonSvg || !designSvg) return EMPTY_SNAPSHOT;

  const skeletonWasOn = designStage.getAttribute("data-catalog-skeleton") === "on";
  designStage.setAttribute("data-catalog-skeleton-reading", "");
  if (skeletonWasOn) designStage.removeAttribute("data-catalog-skeleton");

  try {
    const rules = documentStyleRules();
    const rows = FLOWCHART_SKELETON_PARTS.flatMap((part, index) => {
      if (!catalogSkeletonPartTarget(designSvg, part)) return [];
      const values = computedPartValues(designSvg, part, rules);
      return [{ number: index + 1, part, values: values.length > 0 ? values : [{ kind: "—", value: "—" }] }];
    });
    const badgeCandidates = rows.flatMap(({ number, part }) => {
      const target = catalogSkeletonPartBadgeTarget(skeletonSvg, part);
      const badge = target ? badgePosition(skeletonStage, target, part, number) : null;
      return badge ? [badge] : [];
    });
    const stageBox = skeletonStage.getBoundingClientRect();
    const badges = avoidCatalogSkeletonBadgeOverlaps(badgeCandidates, {
      width: stageBox.width,
      height: stageBox.height,
    });
    return {
      diagramType: designSvg.getAttribute("data-cdl-type"),
      rows,
      badges,
    };
  } finally {
    if (skeletonWasOn) designStage.setAttribute("data-catalog-skeleton", "on");
    // 骨組みへ戻る計算も読み取り印の下で確定し、線の transition を両方向とも走らせない。
    const line = designSvg.querySelector<SVGElement>('[data-cdl-role="edge-line"]');
    void getComputedStyle(line ?? designSvg).stroke;
    designStage.removeAttribute("data-catalog-skeleton-reading");
  }
}

function colorHex(value: string): string | null {
  if (/^#[\da-f]{6}$/i.test(value)) return value.toLowerCase();
  const match = value.match(/^rgba?\(([^)]+)\)$/i);
  if (!match) return null;
  const numbers = match[1]?.match(/[\d.]+/g)?.map(Number);
  if (!numbers || numbers.length < 3) return null;
  const hex = `#${numbers
    .slice(0, 3)
    .map((number) => Math.round(number).toString(16).padStart(2, "0"))
    .join("")}`;
  return numbers[3] !== undefined && numbers[3] < 1 ? `${hex} (濃さ ${numbers[3]})` : hex;
}

function shownValue(value: string): React.ReactElement {
  const hex = colorHex(value);
  if (hex) {
    return (
      <>
        <span className="catalog-skeleton-swatch" style={{ background: value }} />
        {hex}
      </>
    );
  }
  if (value.startsWith("linear-gradient")) return <>方眼</>;
  if (value === "none") return <>なし</>;
  const url = value.match(/url\(["']?#([^"')]+)["']?\)/);
  if (url) return <>型 {url[1]?.replace(/^dragon-/, "")}</>;
  return <>{value.length > 34 ? `${value.slice(0, 34)}…` : value}</>;
}

function markHighlightedPart(stage: HTMLElement, part: CatalogSkeletonPart | null): void {
  for (const element of stage.querySelectorAll("[data-catalog-skeleton-highlighted]")) {
    element.removeAttribute("data-catalog-skeleton-highlighted");
  }
  const svg = stage.querySelector<SVGSVGElement>("svg[data-cdl-stage]");
  if (!svg || !part || part.selector === ":scope") return;
  const target = catalogSkeletonPartTarget(svg, part);
  if (!target) return;
  for (const element of [target, ...Array.from(target.querySelectorAll<SVGElement>("*"))]) {
    if (!element.hasAttribute("data-catalog-skeleton-hidden")) {
      element.setAttribute("data-catalog-skeleton-highlighted", "");
    }
  }
}

export function CatalogSkeletonParts({
  skeletonStage,
  designStage,
  refreshKey,
}: {
  skeletonStage: HTMLElement | null;
  designStage: HTMLElement | null;
  refreshKey: string;
}): React.ReactElement | null {
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY_SNAPSHOT);
  const [highlighted, setHighlighted] = useState<CatalogSkeletonPart | null>(null);

  useLayoutEffect(() => {
    if (!skeletonStage || !designStage) return;

    let frame: number | null = null;
    const update = (): void => {
      frame = null;
      setSnapshot(readSnapshot(skeletonStage, designStage));
    };
    const schedule = (): void => {
      if (frame === null) frame = requestAnimationFrame(update);
    };
    const observer = new MutationObserver(schedule);
    const scrollContainers = new Set<HTMLElement>();
    for (const stage of new Set([skeletonStage, designStage])) {
      const inner = stage.querySelector(".catalog-preview-stage-inner");
      if (inner) {
        observer.observe(inner, {
          attributeFilter: ["data-cdl-palette"],
          attributes: true,
          childList: true,
          subtree: true,
        });
        if (inner instanceof HTMLElement) {
          inner.addEventListener("scroll", schedule, { passive: true });
          scrollContainers.add(inner);
        }
      }
    }
    const resize = new ResizeObserver(schedule);
    resize.observe(skeletonStage);
    const skeletonSvg = skeletonStage.querySelector("svg[data-cdl-stage]");
    if (skeletonSvg) resize.observe(skeletonSvg);
    schedule();

    return () => {
      observer.disconnect();
      resize.disconnect();
      for (const inner of scrollContainers) inner.removeEventListener("scroll", schedule);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [skeletonStage, designStage, refreshKey]);

  useLayoutEffect(() => {
    if (!skeletonStage) return;
    markHighlightedPart(skeletonStage, highlighted);
    return () => markHighlightedPart(skeletonStage, null);
  }, [skeletonStage, highlighted, snapshot]);

  if (!skeletonStage || !designStage || snapshot.diagramType === null) return null;

  const badges = createPortal(
    <div className="catalog-skeleton-badges" aria-hidden="true">
      {snapshot.badges.map((badge) => (
        <span
          key={badge.number}
          className="catalog-skeleton-badge"
          style={{ left: badge.left, top: badge.top }}
        >
          {badge.number}
        </span>
      ))}
    </div>,
    skeletonStage,
  );

  if (snapshot.diagramType !== "flowchart") {
    return (
      <section className="catalog-skeleton-parts" aria-label="骨組みの部品と、表が決めるもの">
        <p>この図の部品の一覧は、図ごとの作り直しで足す</p>
      </section>
    );
  }

  return (
    <section className="catalog-skeleton-parts" aria-labelledby="catalog-skeleton-parts-title">
      {badges}
      <h3 id="catalog-skeleton-parts-title">骨組みの部品と、表が決めるもの</h3>
      <div className="catalog-skeleton-table-wrap">
        <table>
          <thead>
            <tr>
              <th>番号</th>
              <th>部品</th>
              <th>表が決めるもの</th>
              <th>今の値</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.rows.flatMap(({ number, part, values }) =>
              values.map(({ kind, value }, index) => (
                <tr
                  key={`${number}-${kind}`}
                  className={highlighted === part ? "is-highlighted" : undefined}
                  onPointerEnter={() => setHighlighted(part)}
                  onPointerLeave={() => setHighlighted(null)}
                  onFocus={() => setHighlighted(part)}
                  onBlur={() => setHighlighted(null)}
                  tabIndex={0}
                >
                  {index === 0 && (
                    <>
                      <td rowSpan={values.length} className="catalog-skeleton-number">
                        <span>{number}</span>
                      </td>
                      <th rowSpan={values.length} scope="rowgroup">
                        {part.label}
                      </th>
                    </>
                  )}
                  <td>{kind}</td>
                  <td>{shownValue(value)}</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
