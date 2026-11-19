/**
 * 配管の図の組んだ並べ方を生成物に収め、描く時に道を探さずに使う (#3748)。
 *
 * 収めた並べ方は鍵に、原本 (畳んだ箱を開いた後の図) と言葉と code の指紋を持つ。鍵が合う並べ方だけを使い、合わない時はその場で組む。
 * 重い描き比べ (配管の原本の全てと、新しい process の 1 回目) は準備の file (`pipe-stored-layout.prepare.ts`) が済ませる。
 * ここで描く図は小さな見本 (畳んだ箱を 1 つか 2 つ持つ) だけにする。
 *
 * 収めた並べ方を使ったかは、並べ方に付けた印の欄 (`__probe`) が描いた並べ方に残るかで見る。
 */
import { mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { planPage } from "../src/export/page";
import { pageHtml } from "../src/export/html";
import { renderDiagram } from "../src/index";
import { parts } from "../src/kinds/pipe";
import * as pipeLayout from "../src/kinds/pipe/layout";
import { parseNotation } from "../src/parser";
import type prepare from "./pipe-stored-layout.prepare";
import { prepared } from "./prepared";
import { CASES, ONE_FOLD, REPO, TWO_FOLDS } from "./pipe-stored-layout-support";

const PROBE = "stored-layout-probe";
type Stored = { key: string; layout: Record<string, unknown> };
type Collect = <T>(run: () => T) => { value: T; layouts: Stored[] };
type KeyOf = (diagram: unknown, options?: Record<string, unknown>, code?: string) => string;
type Laid = { svg: string; layout: Record<string, unknown> & { folds?: { call: number }[] } };

const built = (): Awaited<ReturnType<typeof prepare>> => prepared(import.meta.url);
const render = (source: unknown, options: Record<string, unknown>): Laid => renderDiagram(source, options) as unknown as Laid;
const exported = pipeLayout as unknown as { collectPipeLayouts?: Collect; pipeLayoutKey?: KeyOf };

function read(text: string, lang: "ja" | "en" = "ja"): Record<string, unknown> {
  const parsed = parseNotation(text, { lang });
  expect(parsed.ok, "見本の記法を読めない").toBe(true);
  return (parsed as unknown as { diagram: Record<string, unknown> }).diagram;
}

function collect(): Collect {
  expect(exported.collectPipeLayouts, "描いた時に組んだ並べ方を集める collectPipeLayouts が kinds/pipe/layout.ts に無い").toBeTypeOf("function");
  return exported.collectPipeLayouts as Collect;
}

/** `run` が描いた時に組んだ並べ方を、頁に収めた時と同じく JSON を通して返し、使ったかを見る印を付ける */
function probed(run: () => unknown): Stored[] {
  const { layouts } = collect()(run);
  return (JSON.parse(JSON.stringify(layouts)) as Stored[]).map((s) => ({ ...s, layout: { ...s.layout, __probe: PROBE } }));
}
const usedStored = (drawn: Laid): boolean => drawn.layout.__probe === PROBE;

describe("収めた並べ方で描く (#3748)", () => {
  it("stored-layout-draws-without-route", () => {
    const { first } = built();
    expect(first.error, "新しい process で 1 回目に描けない").toBeUndefined();
    expect(first.composed?.routeCalls, "並べ方を渡さずに描いた 1 回目は道を探す").toBeGreaterThan(0);
    expect(first.stored?.routeCalls, "収めた並べ方を渡して新しい process で 1 回目に描いた時に道を探した回数").toBe(0);
  });

  it.each(CASES)("stored-layout-matches-composed", ({ id }) => {
    const result = built().cases[id];
    expect(result, `${id} を描き比べていない`).toBeDefined();
    expect(result?.error, `${id} を描き比べられない`).toBeUndefined();
    const forms = result?.forms ?? [];
    expect(forms.length, `${id} の描いた形の数`).toBeGreaterThan(0);
    expect(result?.stored, `${id} で集めた並べ方の数が、描いた形の数と違う`).toBe(forms.length);
    for (const form of forms) {
      const name = `${id} 開いた箱 [${form.open.join(",")}]`;
      expect(form.usedStored, `${name} で収めた並べ方を使わなかった`).toBe(true);
      expect(form.sameLayout, `${name} の描いた並べ方 (管の道と札の場所) が、収めずに描いた時と違う`).toBe(true);
      expect(form.sameSvg, `${name} の SVG が、収めずに描いた時と違う`).toBe(true);
    }
    expect(result?.routeCalls, `${id} を収めた並べ方で描き直した時に道を探した回数`).toBe(0);
  });

  it("stored-layout-ignored-after-source-change", () => {
    const before = read(ONE_FOLD);
    const stored = probed(() => render(before, { lang: "ja" }));
    expect(usedStored(render(before, { lang: "ja", layouts: stored })), "原本を変えない時に収めた並べ方を使わない").toBe(true);
    const changed = ONE_FOLD.replace("hold pool: 10 WETH", "hold pool: 12 WETH");
    expect(changed, "原本を変えられない").not.toBe(ONE_FOLD);
    const after = read(changed);
    const drawn = render(after, { lang: "ja", layouts: stored });
    expect(usedStored(drawn), "原本を変えた後に、変える前の並べ方を使った").toBe(false);
    expect(drawn.svg, "原本を変えた後の図が、その場で組んだ並べ方の図と違う").toBe(render(after, { lang: "ja" }).svg);
  });

  it("stored-layout-ignored-for-other-words", () => {
    const source = read(ONE_FOLD);
    const stored = probed(() => render(source, { lang: "ja" }));
    expect(usedStored(render(source, { lang: "ja", layouts: stored })), "同じ言葉で描く時に収めた並べ方を使わない").toBe(true);
    expect(usedStored(render(source, { lang: "en", layouts: stored })), "収めた時と違う言葉 (en) で、収めた並べ方を使った").toBe(false);
    const words = { pipe: { io: { in: "入る" } } };
    expect(usedStored(render(source, { lang: "ja", words, layouts: stored })), "収めた時と違う語を渡した時に、収めた並べ方を使った").toBe(false);
  });

  it("stored-layout-ignored-for-other-code", () => {
    const source = read(ONE_FOLD);
    expect(exported.pipeLayoutKey, "収めた並べ方の鍵を作る pipeLayoutKey が kinds/pipe/layout.ts に無い").toBeTypeOf("function");
    const keyOf = exported.pipeLayoutKey as KeyOf;
    // 並べ方の関数が受けた図 (畳んだ箱を開いた後の図) を捕まえる
    let model: unknown;
    const layout = parts.layout;
    parts.layout = ((diagram, ...rest) => {
      model = diagram;
      return layout(diagram, ...rest);
    }) as typeof layout;
    let stored: Stored[];
    try {
      stored = probed(() => render(source, { lang: "ja" }));
    } finally {
      parts.layout = layout;
    }
    const [first] = stored;
    expect(first, "並べ方を集められない").toBeDefined();
    const withKey = (key: string): Stored[] => [{ key, layout: (first as Stored).layout }];
    expect(usedStored(render(source, { lang: "ja", layouts: withKey(keyOf(model, { lang: "ja" })) })), "今の code の指紋の鍵の並べ方を使わない").toBe(true);
    expect(usedStored(render(source, { lang: "ja", layouts: withKey(keyOf(model, { lang: "ja" }, "another-src")) })), "別の code の指紋の鍵の並べ方を使った").toBe(false);
  });

  it("src-fingerprint-covers-every-src-file", async () => {
    const entry = join(REPO, "packages/dragon/scripts/src-fingerprint.mjs");
    const mod = (await import(/* @vite-ignore */ entry).catch(() => undefined)) as { srcFingerprint?: (dir: string) => string } | undefined;
    expect(mod?.srcFingerprint, "src の全ての file から指紋を作る srcFingerprint が scripts/src-fingerprint.mjs に無い").toBeTypeOf("function");
    const fingerprint = mod?.srcFingerprint as (dir: string) => string;
    const dir = mkdtempSync(join(tmpdir(), "dragon-src-fingerprint-"));
    try {
      const files = ["a.ts", "nested/b.ts", "nested/deep/c.json", "d.css"];
      for (const file of files) {
        mkdirSync(join(dir, file, ".."), { recursive: true });
        writeFileSync(join(dir, file), `// ${file}\n`);
      }
      const first = fingerprint(dir);
      expect(first, "指紋が SHA-256 の 16 進 64 字でない").toMatch(/^[0-9a-f]{64}$/u);
      for (const file of files) {
        const path = join(dir, file);
        const text = readFileSync(path, "utf8");
        writeFileSync(path, `${text}x`);
        expect(fingerprint(dir), `${file} を変えても指紋が変わらない`).not.toBe(first);
        writeFileSync(path, text);
        expect(fingerprint(dir), `${file} を元に戻しても指紋が戻らない`).toBe(first);
      }
      writeFileSync(join(dir, "nested/new.ts"), "");
      expect(fingerprint(dir), "file を足しても指紋が変わらない").not.toBe(first);
      rmSync(join(dir, "nested/new.ts"));
      renameSync(join(dir, "a.ts"), join(dir, "e.ts"));
      expect(fingerprint(dir), "file の名前を変えても指紋が変わらない").not.toBe(first);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
    expect(fingerprint(join(REPO, "packages/dragon/src")), "package の src の指紋").toMatch(/^[0-9a-f]{64}$/u);
    const config = readFileSync(join(REPO, "packages/dragon/tsup.config.ts"), "utf8");
    expect(config, "build が src の指紋を `__DRAGON_SRC_FINGERPRINT__` に埋めない").toMatch(/__DRAGON_SRC_FINGERPRINT__:\s*JSON\.stringify\(srcFingerprint\(/u);
  });
});

describe("書き出しに収める並べ方 (#3748)", () => {
  /** `source` を最初に見える形と、`opens` の組で開いた形に描いた時の並べ方の鍵 */
  const keysOf = (source: unknown, opens: number[][]): string[] =>
    collect()(() => {
      for (const open of opens) render(source, { lang: "ja", open });
    }).layouts.map((s) => s.key);
  const foldsOf = (source: unknown): number[] => (render(source, { lang: "ja" }).layout.folds ?? []).map((f) => f.call);

  it("export-stores-pipe-layouts", () => {
    const one = planPage(read(ONE_FOLD), { lang: "ja" }) as unknown as { layouts?: Stored[]; source: unknown };
    expect(one.layouts?.length, "畳んだ箱を 1 つ持つ図で収めた並べ方の数").toBe(2);
    const two = planPage(read(TWO_FOLDS), { lang: "ja" }) as unknown as Parameters<typeof pageHtml>[0] & { layouts?: Stored[]; source: unknown };
    expect(two.layouts?.length, "畳んだ箱を 2 つ持つ図で収めた並べ方の数").toBe(3);
    const folds = foldsOf(two.source);
    expect(folds.length, "見本の図の畳んだ箱の数").toBe(2);
    const want = keysOf(two.source, [[], ...folds.map((call) => [call])]);
    expect(new Set(two.layouts?.map((s) => s.key)), "収めた並べ方が、最初に見える形と箱を 1 つだけ開いた形の並べ方でない").toEqual(new Set(want));
    const html = pageHtml(two, "", "");
    const embedded = /<script type="application\/json" id="dragon-layouts">([^<]*)<\/script>/u.exec(html);
    expect(embedded, "書き出した HTML に収めた並べ方の要素 (`#dragon-layouts`) が無い").not.toBeNull();
    expect((JSON.parse(embedded?.[1] ?? "[]") as Stored[]).map((s) => s.key), "HTML に収めた並べ方の鍵").toEqual(two.layouts?.map((s) => s.key));
    expect(html, "頁が収めた並べ方を再生の部品へ渡さない").toMatch(/mountDiagram\([^;]*dragon-layouts/u);
  });

  it("export-skips-multi-open-layouts", () => {
    const two = planPage(read(TWO_FOLDS), { lang: "ja" }) as unknown as { layouts?: Stored[]; source: unknown };
    expect(two.layouts?.length, "畳んだ箱を 2 つ持つ図で収めた並べ方の数").toBe(3);
    const folds = foldsOf(two.source);
    const [both] = keysOf(two.source, [folds]);
    expect(both, "2 つの箱を開いた形の鍵を作れない").toBeDefined();
    expect(two.layouts?.map((s) => s.key), "2 つの箱を開いた組の並べ方を収めた").not.toContain(both);
  });
});
