/**
 * 図の種類の描く部品を後から読む軽い入口 (`@cardenelabs/dragon/light`、#3248)。
 *
 * 既定の入口は全ての種類を持ったまま、待たずに描ける。軽い入口は git、time、state、tree、lineup の部品を持たず、
 * `loadKind` を待った後に、既定の入口と同じ関数で同じ図を描く。
 * 読んでいない種類を描くと、その種類の名前を含む誤りで止まる。
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const EXAMPLES = join(ROOT, "examples");

const ALL_KINDS = ["architecture", "git", "lineup", "sequence", "state", "time", "tree"];
const LATER_KINDS = ["git", "lineup", "state", "time", "tree"];

interface Rendered {
  svg: string;
  timeline: { stills: number[] };
}
interface Entry {
  parseNotation(text: string): { ok: true; diagram: { kind?: string } } | { ok: false; errors: unknown[] };
  renderDiagram(diagram: unknown, options?: Record<string, unknown>): Rendered;
  chooseView(rendered: Rendered, width: number): { mode: string };
}
interface LightEntry extends Entry {
  loadKind(kind: string): Promise<void>;
}

const name = "@cardenelabs/dragon";
const importEntry = <T>(path: string): Promise<T | undefined> => (import(/* @vite-ignore */ path) as Promise<T>).catch(() => undefined);

/** 見本の全ての記法。種類を読む */
function examples(entry: Entry): { file: string; kind: string; diagram: unknown }[] {
  return readdirSync(EXAMPLES)
    .filter((file) => file.endsWith(".dragon"))
    .sort()
    .map((file) => {
      const parsed = entry.parseNotation(readFileSync(join(EXAMPLES, file), "utf8"));
      expect(parsed.ok, `見本 ${file} の記法を読めない`).toBe(true);
      const diagram = parsed.ok ? parsed.diagram : {};
      return { file, kind: diagram.kind ?? "architecture", diagram };
    });
}

/** 新しい Node で軽い入口を読み、中で回した結果を受け取る。登録は読み込みごとに 1 度なので、読んでいない形は別の process でしか作れない */
function inFreshNode<T>(body: string): T {
  const code = `const light = await import("${name}/light");\nconst out = {};\n${body}\nconsole.log(JSON.stringify(out));`;
  const stdout = execFileSync(process.execPath, ["--input-type=module", "-e", code], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return JSON.parse(stdout) as T;
}

describe("図の種類の部品を後から読む軽い入口 (#3248)", () => {
  it("light-entry-draws-same-svg", async () => {
    const light = await importEntry<LightEntry>(`${name}/light`);
    expect(light, "軽い入口を読めない").toBeDefined();
    if (!light) return;
    const whole = await importEntry<Entry>(name);
    expect(whole, "既定の入口を読めない").toBeDefined();
    if (!whole) return;
    const samples = examples(whole);
    // どの種類も見本を持つ (走査が空振りしていない)
    expect([...new Set(samples.map((s) => s.kind))].sort(), "見本が描く種類").toEqual(ALL_KINDS);
    for (const options of [{}, { theme: "dark", still: true, lang: "en" }]) {
      for (const { file, kind, diagram } of samples) {
        await light.loadKind(kind);
        expect(light.renderDiagram(diagram, options).svg, `${file} (${JSON.stringify(options)}) を軽い入口で描いた SVG が既定の入口と違う`).toBe(whole.renderDiagram(diagram, options).svg);
      }
    }
  });

  it("light-entry-refuses-unloaded-kind", () => {
    let out: { refused: Record<string, string[]>; kept: string[]; loaded: string[] } | undefined;
    try {
      out = inFreshNode(`
        const fs = await import("node:fs");
        const read = (file) => light.parseNotation(fs.readFileSync(new URL("./examples/" + file, "file://${ROOT}/"), "utf8")).diagram;
        const later = { git: "rebase.dragon", lineup: "auction.dragon", state: "order.dragon", time: "finality.dragon", tree: "merkle.dragon" };
        const kept = { sequence: "api.dragon", architecture: "ccip.dragon" };
        const host = { ownerDocument: { defaultView: null } };
        const message = (run) => { try { run(); return "描けた"; } catch (e) { return e.message; } };
        out.refused = {}; out.kept = []; out.loaded = [];
        for (const [kind, file] of Object.entries(later)) {
          const diagram = read(file);
          out.refused[kind] = [message(() => light.renderDiagram(diagram)), message(() => light.mountDiagram(host, diagram))];
          await light.loadKind(kind);
          if (message(() => light.renderDiagram(diagram)) === "描けた") out.loaded.push(kind);
        }
        for (const [kind, file] of Object.entries(kept)) if (message(() => light.renderDiagram(read(file))) === "描けた") out.kept.push(kind);
      `);
    } catch {
      out = undefined;
    }
    expect(out, "軽い入口を新しい Node で読めない").toBeDefined();
    if (!out) return;
    for (const kind of LATER_KINDS) {
      for (const message of out.refused[kind] ?? []) expect(message, `読んでいない ${kind} を描いた時の誤り`).toContain(kind);
    }
    expect(out.loaded, "loadKind を待った後に描けた種類").toEqual(LATER_KINDS);
    expect(out.kept, "loadKind を呼ばずに描けた種類").toEqual(["sequence", "architecture"]);
  });

  it("default-entry-draws-every-kind", async () => {
    const whole = await importEntry<Entry>(name);
    expect(whole, "既定の入口を読めない").toBeDefined();
    if (!whole) return;
    const samples = examples(whole);
    expect([...new Set(samples.map((s) => s.kind))].sort(), "見本が描く種類").toEqual(ALL_KINDS);
    for (const { file, diagram } of samples) {
      // bitsumi と同じ呼び方。読んだ後に待たずに続けて描き、SVG と段の時刻と見せ方を読む
      const rendered = whole.renderDiagram(diagram, { palette: "night", theme: "dark", still: true });
      expect(rendered.svg, `${file} の SVG`).toContain('data-dragon="figure"');
      expect(rendered.timeline.stills.length, `${file} の段の時刻`).toBeGreaterThan(0);
      expect(["fixed", "follow"], `${file} の見せ方`).toContain(whole.chooseView(rendered, 1280).mode);
    }
  });
});
