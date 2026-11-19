// @vitest-environment jsdom
/**
 * 見本帳の build が、見本帳の頁の描く配管の図の並べ方を収め、`LiveFigure` が描く時に渡す (#3748)。
 *
 * build は記法の字ごとに、最初に見える形と畳んだ箱を 1 つだけ開いた形の並べ方を 1 つの JSON の file に収める (`vite-pipe-layouts.ts`)。
 * `LiveFigure` は配管の図を描く前にその file を読み、再生の部品 (`mountDiagram`) へ渡す。
 * 渡した並べ方で道を探さずに描くかは、並べ方に付けた印の欄 (`__probe`) が描いた並べ方に残るかで見る。
 * 並べ方を組む仕事と、build した package を読む仕事は重いので、file を読み込む段で済ませる (#3738)。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { atLoad } from "../../../../packages/dragon/test/at-load";

type Stored = { key: string; layout: Record<string, unknown> };
type Assets = (files: { text: string; lang: "ja" | "en" }[]) => Promise<{ fileName: string; source: string }[]>;

const seen = vi.hoisted(() => ({ options: [] as Record<string, unknown>[] }));
vi.mock("@cardenelabs/dragon/light", async (original) => {
  const light = await original<typeof import("@cardenelabs/dragon/light")>();
  return {
    ...light,
    mountDiagram: (host: HTMLElement, diagram: unknown, options: Record<string, unknown>) => {
      seen.options.push(options);
      return light.mountDiagram(host, diagram, options);
    },
  };
});

/** repo の根。検査は repo の根で回す */
const REPO = process.cwd();
const TEXT = readFileSync(join(REPO, "apps/playground-spa/src/docs/examples/pipe.dragon"), "utf8");
const PROBE = "site-layout-probe";

const BUILT = await atLoad("見本帳の build の部品で並べ方を組み、build した描く部品で描く", async () => {
  const entry = join(REPO, "apps/playground-spa/vite-pipe-layouts.ts");
  const plugin = (await import(/* @vite-ignore */ entry).catch(() => undefined)) as { pipeLayoutAssets?: Assets } | undefined;
  if (typeof plugin?.pipeLayoutAssets !== "function") return { missing: true as const };
  const assets = await plugin.pipeLayoutAssets([{ text: TEXT, lang: "ja" }]);
  const stored = JSON.parse(assets[0]?.source ?? "[]") as Stored[];
  // build した描く部品が、収めた並べ方で道を探さずに描くかを見る
  const light = await import("@cardenelabs/dragon/light");
  await light.loadFor(TEXT);
  const parsed = light.parseNotation(TEXT);
  if (!parsed.ok) return { missing: false as const, assets, stored, parsed: false };
  // `LiveFigure` と同じく、読んだ図の見せ方を直に替える。写すと記法から読んだ図の印が消え、原本の形の検査を求められる (#3400)
  const diagram = parsed.diagram;
  diagram.view = "fixed";
  const probed = stored.map((s) => ({ ...s, layout: { ...s.layout, __probe: PROBE } }));
  const drawn = light.renderDiagram(diagram,{ lang: "ja", layouts: probed } as unknown as Parameters<typeof light.renderDiagram>[1]) as unknown as { layout: Record<string, unknown> };
  const { LiveFigure } = await import("../site/LiveFigure");
  return { missing: false as const, assets, stored, parsed: true, probe: drawn.layout.__probe, LiveFigure };
});

afterEach(() => {
  vi.unstubAllGlobals();
  seen.options.length = 0;
  document.body.innerHTML = "";
});

describe("見本帳の配管の図 (#3748)", () => {
  it("site-draws-pipe-with-stored-layouts", async () => {
    const built = BUILT.get();
    expect(built.missing, "記法の字ごとの並べ方の file を組む pipeLayoutAssets が vite-pipe-layouts.ts に無い").toBe(false);
    if (built.missing) return;
    const [asset, ...rest] = built.assets;
    expect(rest, "1 つの記法の字に収めた file の数").toEqual([]);
    expect(asset?.fileName, "並べ方の file の置き場").toMatch(/^pipe-layouts\/[0-9a-f]+\.json$/u);
    expect(built.stored.length, "畳んだ箱を 1 つ持つ見本の図に収めた並べ方の数").toBe(2);
    expect(built.parsed, "見本の記法を読めない").toBe(true);
    expect(built.probe, "build した描く部品が、見本帳に収めた並べ方を使わない").toBe(PROBE);

    // LiveFigure が並べ方の file を読み、再生の部品へ渡す
    const fetched: string[] = [];
    vi.stubGlobal("fetch", (url: string) => {
      fetched.push(String(url));
      return Promise.resolve(String(url).endsWith(asset?.fileName ?? "-") ? new Response(asset?.source ?? "[]") : new Response("", { status: 404 }));
    });
    const { LiveFigure } = built;
    expect(LiveFigure, "LiveFigure を読めない").toBeDefined();
    if (!LiveFigure) return;
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
      await act(() => {
        root.render(createElement(LiveFigure, { notation: TEXT, lang: "ja", theme: "light", palette: "paper", whole: true }));
        return Promise.resolve();
      });
      for (let i = 0; i < 100 && seen.options.length === 0; i++) await act(async () => new Promise((done) => setTimeout(done, 10)));
      expect(fetched.some((url) => url.endsWith(asset?.fileName ?? "-")), "LiveFigure が配管の図の並べ方の file を読まない").toBe(true);
      const [options] = seen.options;
      expect(options, "LiveFigure が配管の図を描かない").toBeDefined();
      expect((options?.layouts as Stored[] | undefined)?.map((s) => s.key), "LiveFigure が収めた並べ方を再生の部品へ渡さない").toEqual(built.stored.map((s) => s.key));
    } finally {
      await act(() => {
        root.unmount();
        return Promise.resolve();
      });
    }
  });
});
