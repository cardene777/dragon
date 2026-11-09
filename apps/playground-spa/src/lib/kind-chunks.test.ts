/**
 * 図の種類の描く部品を、頁が最初に読む script から外して後から読む (#3248)。
 *
 * git、time、state、tree、lineup の部品は種類ごとの塊にし、最初の画面を描いた後に裏で読み始める。
 * 時系列図と構成図は概要の頁が待たずに描くので、最初に読む script に残す。
 * 塊が届かない間は図の場所に決まった高さの枠と「読み込み中」を出し、読めなかった時は読み直す釦を出す。編集画面は前の図を残す。
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { builtDir, firstLoadFiles, root } from "./playground-support";

const SRC = join(root, "packages/dragon/src");

/** 置き場の定義の file の字。無ければ空 */
const defOf = (path: string): string => (existsSync(path) ? readFileSync(path, "utf8") : "");

/** 図の種類の置き場と個別ブロックの置き場の外で、後から読む種類だけが読む file。試す図の再生の部品 */
const KIND_EXTRA: Readonly<Record<string, readonly string[]>> = { try: ["try-player.ts"] };

/**
 * 後から読む種類と、その種類だけの描く部品の file。手で並べず、置き場から導く (#3350)。
 * 後から読む種類は図の種類の置き場の `kind.ts` が `later: true` を名乗る種類で、並べ方は図の種類の置き場に、
 * その種類の描き方は `render/<種類>.ts` に、その種類だけのブロックの描き方は個別ブロックの置き場 (`only` がその種類) に在る (#3347、#3348)。
 * 共通の描き方 (`render/draw.ts`) が読む個別ブロックの描き方は、最初に読む script に入るので数えない
 */
function laterKinds(): Readonly<Record<string, readonly string[]>> {
  const common = defOf(join(SRC, "render/draw.ts"));
  const blocks = readdirSync(join(SRC, "blocks")).filter((name) => statSync(join(SRC, "blocks", name)).isDirectory());
  const kinds = readdirSync(join(SRC, "kinds")).filter((kind) => /\blater:\s*true\b/u.test(defOf(join(SRC, "kinds", kind, "kind.ts"))));
  return Object.fromEntries(
    kinds.map((kind) => [
      kind,
      [
        `kinds/${kind}/layout.ts`,
        ...(existsSync(join(SRC, "render", `${kind}.ts`)) ? [`render/${kind}.ts`] : []),
        ...blocks
          .filter((name) => /only:\s*"([a-z]+)"/u.exec(defOf(join(SRC, "blocks", name, "block.ts")))?.[1] === kind)
          .filter((name) => existsSync(join(SRC, "blocks", name, "draw.ts")) && !common.includes(`"../blocks/${name}/draw"`))
          .map((name) => `blocks/${name}/draw.ts`),
        ...(KIND_EXTRA[kind] ?? []),
      ],
    ]),
  );
}
const LATER_KINDS = laterKinds();
/** 後から読む塊の小さすぎる字数。部品が最初に読む側へ漏れると、塊は入口だけの大きさになる */
const CHUNK_AT_LEAST = 2_000;

function sourcesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourcesUnder(path);
    return /\.ts$/u.test(name) ? [path] : [];
  });
}

/**
 * その種類の部品の file だけが持つ字の並び。minify しても字の並びは残るので、script の中に部品が入っているかを字の並びで見る。
 * 手で選ぶと部品を直した時に空振りするので、元の file から導く
 */
function markersOf(kind: string): string[] {
  const own = (LATER_KINDS[kind] ?? []).map((file) => join(SRC, file));
  const others = sourcesUnder(SRC)
    .filter((path) => !own.includes(path))
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  const found = own.flatMap((path) => {
    const code = readFileSync(path, "utf8")
      .replace(/\/\*[\s\S]*?\*\//gu, "")
      .split("\n")
      .filter((line) => !/^\s*(\/\/|import )/u.test(line))
      .join("\n");
    return [...code.matchAll(/["`]([^"`\\\n$]*data-[^"`\\\n$]*)["`]/gu)].map((m) => m[1] ?? "");
  });
  return [...new Set(found)].filter((text) => text.trim().length > 0 && !others.includes(text));
}

/**
 * 後から読む種類の個別ブロックの読み方 (`blocks/<名前>/read.ts`) だけが持つ誤りの文の字の並び (#3349)。
 * 読み方は書いた図が使う時に読むので、最初に読む script に在ってはいけない。誤りの文は minify しても残るので、字の並びで見る。
 * どのブロックが後から読む種類の個別ブロックかは、置き場の定義 (`block.ts`) の付け方の `only` から導く
 */
function readingMarkers(): { block: string; markers: string[] }[] {
  const blocksDir = join(SRC, "blocks");
  const later = readdirSync(blocksDir).filter((name) => {
    const path = join(blocksDir, name, "block.ts");
    const only = /only:\s*"([a-z]+)"/u.exec(statSync(join(blocksDir, name)).isDirectory() ? readFileSync(path, "utf8") : "")?.[1];
    return only !== undefined && Object.hasOwn(LATER_KINDS, only);
  });
  return later.map((block) => {
    const own = join(blocksDir, block, "read.ts");
    // 束ねた script は注釈を残さないので、注釈を外した字から探す
    const code = readFileSync(own, { encoding: "utf8", flag: "r" }).replace(/\/\*[\s\S]*?\*\//gu, "").replace(/^\s*\/\/.*$/gmu, "");
    const others = sourcesUnder(SRC)
      .filter((path) => path !== own)
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    // 字の並びは、誤りの文の引用の中の、引用の始まりか `${...}` の後ろから、次の `${` か引用の終わりまでの 8 字以上の日本語を含む部分
    const found = [...code.matchAll(/[`"}]([^`"$\\\n]*[\u3040-\u30ff\u4e00-\u9fff][^`"$\\\n]*)/gu)].map((m) => (m[1] ?? "").trim());
    return { block, markers: [...new Set(found)].filter((text) => text.length >= 8 && !others.includes(text)) };
  });
}

const assets = (): string => join(builtDir(), "assets");
/** その種類の塊の file の名前。無ければ `undefined` */
const chunkOf = (kind: string): string | undefined => {
  const first = new Set(firstLoadFiles(builtDir()));
  return readdirSync(assets()).find((name) => name.startsWith(`${kind}-`) && name.endsWith(".js") && !first.has(name));
};

/** その種類の塊の名前。無ければ落とす */
function chunkNamed(kind: string): string {
  const name = chunkOf(kind);
  expect(name, `${kind} の部品を持つ後から読む塊が無い`).toBeDefined();
  return name ?? "";
}

describe("図の種類の描く部品を後から読む (#3248)", () => {

  it("first-load-leaves-later-kinds-out", () => {
    const first = firstLoadFiles(builtDir())
      .filter((name) => name.endsWith(".js"))
      .map((name) => readFileSync(join(assets(), name), "utf8"))
      .join("\n");
    for (const kind of Object.keys(LATER_KINDS)) {
      const chunk = readFileSync(join(assets(), chunkNamed(kind)), "utf8");
      expect(chunk.length, `${kind} の塊の字数`).toBeGreaterThan(CHUNK_AT_LEAST);
      const markers = markersOf(kind);
      // state の部品は置き場所の計算だけで字の並びを持たない。部品の在り処は塊の字数で見る
      if (kind === "state") continue;
      expect(markers.length, `${kind} の部品だけが持つ字の並びを導けない (走査の空振り)`).toBeGreaterThan(0);
      expect(
        markers.filter((text) => first.includes(text)),
        `最初に読む script に在る ${kind} の部品の字の並び`,
      ).toEqual([]);
      expect(
        markers.filter((text) => chunk.includes(text)).length,
        `${kind} の塊に在る ${kind} の部品の字の並びの数`,
      ).toBeGreaterThan(0);
    }
  });

  it("first-load-leaves-later-blocks-out", () => {
    const first = firstLoadFiles(builtDir())
      .filter((name) => name.endsWith(".js"))
      .map((name) => readFileSync(join(assets(), name), "utf8"))
      .join("\n");
    const later = readdirSync(assets())
      .filter((name) => name.endsWith(".js") && !firstLoadFiles(builtDir()).includes(name))
      .map((name) => readFileSync(join(assets(), name), "utf8"))
      .join("\n");
    const blocks = readingMarkers();
    expect(blocks.length, "後から読む種類の個別ブロックが無い (走査の空振り)").toBeGreaterThan(0);
    for (const { block, markers } of blocks) {
      expect(markers.length, `${block} の読み方だけが持つ字の並びを導けない (走査の空振り)`).toBeGreaterThan(0);
      expect(
        markers.filter((text) => first.includes(text)),
        `最初に読む script に在る ${block} の読み方の字の並び`,
      ).toEqual([]);
      expect(
        markers.filter((text) => later.includes(text)).length,
        `後から読む塊に在る ${block} の読み方の字の並びの数`,
      ).toBeGreaterThan(0);
    }
  });
});
