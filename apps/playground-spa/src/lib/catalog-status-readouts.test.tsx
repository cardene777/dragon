// @vitest-environment jsdom
/**
 * カタログの稼働の時系列と在席の状態が、画面の言語で状態の字を描くこと (#1922)。
 *
 * 描画エンジン `0.62.0` (cdl#857) は、色を選ぶための状態の語を図の言語の辞書で引き、描いた状態の値を
 * `data-cdl-status` / `data-cdl-presence-status` に綴りのまま出す。 画面は図を描く直前に言語を当てる
 * (`図に画面の言語を当てる`) ので、同じ手順で描いて字と目印の両方を見る。
 *
 * 英語の天井 (`diagram-words.test.tsx`) は英語が残っていないことしか見ない。 字が消えていても通るので、
 * 日本語の字が出ていることはここで見る。
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { CATALOG_ITEMS } from "./catalog-items";
import { 図に画面の言語を当てる } from "./diagram-lang";

function 見本の図(題: string): CdlDiagram {
  const item = CATALOG_ITEMS.interactive!.find((i) => i.title === 題);
  expect(item, `カタログに ${題} が無い`).toBeDefined();
  return item!.diagram;
}

/** 目印の属性を持つ要素ごとに、綴りの値と、その要素の中の字の節を描いた順に `|` でつないで読む */
function 状態を読む(d: CdlDiagram, 目印: string): { 値: string; 字: string }[] {
  const 器 = document.createElement("div");
  器.innerHTML = renderToStaticMarkup(
    <CdlDiagramView hideMiniPhaseIndicator hideHeader diagram={図に画面の言語を当てる(d, "ja")} />,
  );
  return [...器.querySelectorAll(`[${目印}]`)].map((el) => {
    const 字の節 = [...el.querySelectorAll("text")];
    return {
      値: el.getAttribute(目印) ?? "",
      字: 字の節.map((t) => t.textContent ?? "").join("|"),
    };
  });
}

describe("カタログの状態の字 (#1922)", () => {
  it("`serverUptimeStatus` は区間を状態の名前で描き、目印に綴りの値を出す", () => {
    const 区間 = 状態を読む(見本の図("serverUptimeStatus"), "data-cdl-status");
    expect(区間.length, "区間を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(0);
    const 名前 = { active: "稼働", idle: "待機", error: "異常" } as const;
    for (const x of 区間) {
      expect(Object.keys(名前), `知らない状態の値: ${x.値}`).toContain(x.値);
      expect(x.字.split("|")[0], `${x.値} の区間の字`).toBe(名前[x.値 as keyof typeof 名前]);
    }
    expect(区間.map((x) => x.字).join(" ")).not.toMatch(/ACTI|IDLE|ERROR/);
  });

  it("`teamPresenceStatus` は在席の状態を名前で描き、目印に綴りの値を出す", () => {
    const 行 = 状態を読む(見本の図("teamPresenceStatus"), "data-cdl-presence-status");
    expect(行.length, "行を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(0);
    const 名前 = { online: "オンライン", away: "離席", offline: "オフライン" } as const;
    for (const x of 行) {
      expect(Object.keys(名前), `知らない状態の値: ${x.値}`).toContain(x.値);
      expect(x.字.split("|")[1], `${x.値} の行の字`).toBe(名前[x.値 as keyof typeof 名前]);
    }
    expect(行.map((x) => x.値)).toContain("offline");
  });
});
