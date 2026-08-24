/**
 * 記法が受ける部品 (`readouts:`) の表を、描画側の型定義から生成する (#1385)。
 *
 * ## なぜ生成するか
 *
 * 描画側は 107 種の部品を持ち、欄は合わせて 510 個ある。 手で写すと `rules/quality.md`
 * の「導出可能記述は人手で書かない」 に正面から当たり、写し間違いと描画側の変更への
 * drift が残る。
 *
 * **描画側は実行時の表を公開していない**。 公開しているのは型定義だけなので、そこから取る。
 *
 * ## 使い方
 *
 * ```
 * node packages/dragon/scripts/gen-readout-table.mjs          # 生成して書き出す
 * node packages/dragon/scripts/gen-readout-table.mjs --check  # 実物とずれていないか見る
 * ```
 *
 * `--check` は検査 (`readout-table-generated.test.ts`) が使う。 ずれていれば非 0 で終わる。
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ここ = dirname(fileURLToPath(import.meta.url));
const 出力先 = join(ここ, "../src/v05/readout-table.generated.ts");

/**
 * 型定義の file を探す。
 *
 * **file 名を固定しない**。 描画側の束ね file は `render-B5JHcUrb.d.ts` のように内容の
 * ハッシュを名前に持ち、描画側を作り直すたびに変わる。 名前で決め打ちすると、その時に
 * 生成が黙って止まる。
 *
 * 見つからない / 2 つ以上ある形はどちらも誤りとして止める = 1 つに決まらないまま進むと、
 * どの定義から出したのかが後から辿れない。
 */
function 型定義を探す() {
  const dist = join(ここ, "../node_modules/@cardenelabs/cdl/dist");
  const 当たり = readdirSync(dist)
    .filter((f) => f.endsWith(".d.ts"))
    .map((f) => join(dist, f))
    .filter((p) => readFileSync(p, "utf8").includes("type CdlReadout = {"));
  if (当たり.length !== 1) {
    throw new Error(
      `部品の型定義を持つ file が 1 つに決まりません (${当たり.length} 件)。 ` +
        `描画側の作り方が変わった可能性があります: ${当たり.join(", ")}`,
    );
  }
  return 当たり[0];
}

/** `type CdlReadout = { ... } | { ... }` の全体を取る */
function 記法の並びを切り出す(src) {
  const 始 = src.indexOf("type CdlReadout = {");
  if (始 < 0) throw new Error("型定義に CdlReadout がありません");
  const 開き = src.indexOf("{", 始);
  let 深さ = 0;
  let i = 開き;
  while (i < src.length) {
    const c = src[i];
    if (c === "{") 深さ += 1;
    else if (c === "}") {
      深さ -= 1;
      if (深さ === 0) {
        // 次が `| {` なら union が続く。 間に説明の塊が挟まることがある
        const 残り = src.slice(i + 1, i + 400);
        const m = 残り.match(/^\s*(?:\/\*\*(?:[^*]|\*(?!\/))*\*\/\s*)?\|\s*\{/);
        if (!m) break;
        i += m[0].length - 1;
      }
    }
    i += 1;
  }
  return src.slice(開き, i + 1);
}

/** union の中の、深さ 1 の中括弧を種類ごとに切り出す */
function 種類ごとに割る(union) {
  const 塊 = [];
  let 深さ = 0;
  let 始 = -1;
  for (let i = 0; i < union.length; i += 1) {
    const c = union[i];
    if (c === "{") {
      if (深さ === 0) 始 = i;
      深さ += 1;
    } else if (c === "}") {
      深さ -= 1;
      if (深さ === 0) 塊.push(union.slice(始 + 1, i));
    }
  }
  return 塊;
}

/**
 * 中括弧の中身から、指定した字下げの欄を並べる。
 *
 * **`;` で切ってはいけない**。 組の並びを取る欄の型は複数行の object で、中に `;` を持つ
 * (`readonly { value: string; color: string }[]`)。 `;` で切ると型が途中で千切れ、中身を
 * 取れなくなる (実測 = `badge.map` / `status-dot.map` / `status-timeline.colorMap` の 3 件)。
 *
 * 括弧の深さを数えて、深さ 0 の `;` だけを区切りにする。
 */
function 欄を並べる(中身, 字下げ) {
  const 出 = [];
  const 頭 = new RegExp(`(?:^|\\n)\\s{${字下げ}}(\\w+)(\\??):\\s*`, "g");
  let m;
  while ((m = 頭.exec(中身)) !== null) {
    let i = m.index + m[0].length;
    let 深さ = 0;
    let 終 = 中身.length;
    for (; i < 中身.length; i += 1) {
      const c = 中身[i];
      if (c === "{" || c === "<" || c === "[") 深さ += 1;
      else if (c === "}" || c === ">" || c === "]") 深さ -= 1;
      else if (c === ";" && 深さ <= 0) {
        終 = i;
        break;
      }
    }
    出.push({ 名: m[1], 任意: m[2], 型: 中身.slice(m.index + m[0].length, 終) });
    頭.lastIndex = 終;
  }
  return 出;
}

/** 型の書き方を、記法の欄の形へ読み替える */
const 形の表 = {
  string: "文字列",
  number: "数",
  "readonly string[]": "文字列の並び",
  boolean: "真偽",
};

function 形にする(型) {
  const t = 型.trim();
  if (形の表[t]) return 形の表[t];
  // `readonly { value: string; ... }[]` / `Array<{ status: string; ... }>` はどちらも組の並び
  if (t.startsWith("readonly {") || t.startsWith("Array<{")) return "組の並び";
  return undefined;
}

/**
 * 組の並びの、1 組ごとの欄を取る。
 *
 * **中身まで取る**。 「object の並び」 までしか持たないと、JSON の検査が組の中身を見られず、
 * 知らない欄と足りない必須の欄が素通りする (#1381 の review で実際に指摘された)。
 */
function 組の中身を取る(型) {
  const t = 型.trim();
  const 開き = t.indexOf("{");
  const 閉じ = t.lastIndexOf("}");
  if (開き < 0 || 閉じ <= 開き) return undefined;
  const 中 = t.slice(開き + 1, 閉じ);
  const 欄 = {};
  const 必須 = [];
  for (const m of 中.matchAll(/(\w+)(\??):\s*([^;\n]+)/g)) {
    const [, 名, 任意, 型2] = m;
    const 形 = 形にする(型2.replace(/[\s;,]+$/, ""));
    if (形 === undefined) return undefined;
    欄[名] = 形;
    if (任意 === "") 必須.push(名);
  }
  return Object.keys(欄).length > 0 ? { 必須, 欄 } : undefined;
}

export function 表を作る() {
  const src = readFileSync(型定義を探す(), "utf8");
  const 塊 = 種類ごとに割る(記法の並びを切り出す(src));
  const 表 = {};
  const 組の表 = {};
  const 読めない欄 = [];
  for (const b of 塊) {
    const km = b.match(/kind:\s*"([a-z-]+)"/);
    if (!km) continue;
    const kind = km[1];
    const 欄 = {};
    const 必須 = [];
    for (const { 名, 任意, 型 } of 欄を並べる(b, 4)) {
      // `id` と `kind` は表の外で扱う (`部品として読む` が種類の判定と id の付与を持つ)
      if (名 === "id" || 名 === "kind") continue;
      const 形 = 形にする(型);
      if (形 === undefined) {
        読めない欄.push(`${kind}.${名}: ${型.trim().slice(0, 60)}`);
        continue;
      }
      欄[名] = 形;
      if (任意 === "") 必須.push(名);
      if (形 === "組の並び") {
        const 中身 = 組の中身を取る(型);
        if (中身 === undefined) {
          読めない欄.push(`${kind}.${名} の組の中身: ${型.trim().slice(0, 60)}`);
          continue;
        }
        組の表[kind] = { ...(組の表[kind] ?? {}), [名]: 中身 };
      }
    }
    表[kind] = { 必須, 欄 };
  }
  // **読めない型を黙って落とさない**。 落とすと、その欄を書いた記法が「知らない項目」 として
  // 誤りになり、原因が型定義の側にあることが分からない
  if (読めない欄.length > 0) {
    throw new Error(
      `型が記法の欄の形に読み替えられません (${読めない欄.length} 件):\n  ${読めない欄.join("\n  ")}\n` +
        `形の表 (${Object.keys(形の表).join(" / ")} と組の並び) を広げてください。`,
    );
  }
  if (Object.keys(表).length === 0) throw new Error("部品の種類を 1 つも取れませんでした");
  return { 表, 組の表 };
}

function 書き出す({ 表, 組の表 }) {
  const 行 = [];
  行.push("// このファイルは自動生成です。 手で編集しないでください。");
  行.push("//");
  行.push("// 出どころ = 描画側 (`@cardenelabs/cdl`) の型定義 `CdlReadout`。");
  行.push("// 作り直す = `node packages/dragon/scripts/gen-readout-table.mjs`");
  行.push("// ずれの検知 = `packages/dragon/test/readout-table-generated.test.ts`");
  行.push("");
  行.push('import type { 図形の定義 } from "./parser-types";');
  行.push("");
  行.push("/** 記法が受ける部品と、その欄 (`CdlReadout` の全種を覆う) */");
  行.push("export const 部品の表: Record<string, 図形の定義> = {");
  for (const kind of Object.keys(表).sort()) {
    const { 必須, 欄 } = 表[kind];
    const 名 = /^[a-z][a-z0-9]*$/.test(kind) ? kind : JSON.stringify(kind);
    行.push(`  ${名}: {`);
    行.push(`    必須: [${必須.map((x) => JSON.stringify(x)).join(", ")}],`);
    行.push(`    欄: {`);
    for (const [n, f] of Object.entries(欄)) 行.push(`      ${n}: ${JSON.stringify(f)},`);
    行.push(`    },`);
    行.push(`  },`);
  }
  行.push("};");
  行.push("");
  行.push("/** 組の並びを取る欄の、1 組ごとの欄 */");
  行.push("export const 部品の組の表: Record<string, Record<string, 図形の定義>> = {");
  for (const kind of Object.keys(組の表).sort()) {
    const 名 = /^[a-z][a-z0-9]*$/.test(kind) ? kind : JSON.stringify(kind);
    行.push(`  ${名}: {`);
    for (const [欄名, 定義] of Object.entries(組の表[kind])) {
      行.push(`    ${欄名}: {`);
      行.push(`      必須: [${定義.必須.map((x) => JSON.stringify(x)).join(", ")}],`);
      行.push(`      欄: {`);
      for (const [n, f] of Object.entries(定義.欄)) 行.push(`        ${n}: ${JSON.stringify(f)},`);
      行.push(`      },`);
      行.push(`    },`);
    }
    行.push(`  },`);
  }
  行.push("};");
  行.push("");
  return 行.join("\n");
}

const 中身 = 書き出す(表を作る());

if (process.argv.includes("--check")) {
  let 実物 = "";
  try {
    実物 = readFileSync(出力先, "utf8");
  } catch {
    console.error(`生成した表がありません: ${出力先}`);
    process.exit(1);
  }
  if (実物 !== 中身) {
    console.error(
      "生成した表が実物とずれています。 `node packages/dragon/scripts/gen-readout-table.mjs` で作り直してください。",
    );
    process.exit(1);
  }
  console.log("生成した表は実物と一致しています。");
} else {
  writeFileSync(出力先, 中身);
  const 種類数 = Object.keys(表を作る().表).length;
  console.log(`部品の表を書き出しました (${種類数} 種): ${出力先}`);
}
