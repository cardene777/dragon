/**
 * catalog の記法から、図 1 つを出すのに要る宣言を抜き出す。
 *
 * 画面を開く側 (`design-export.mjs`) と分けてあるのは、こちらが file も playwright も
 * 持たない純関数で単体で確かめられるから。
 *
 * 行を数える形では切れない (#1545)。 「id を含む行から前後へ `const` を探す」 と、
 * 宣言が複数に分かれる図では途中だけを拾い、次の塊にコメントが付く図では他人の
 * コメントまで含める。 深さを数えて宣言の塊で切る。
 */

/** 深さ 0 で始まる宣言の頭。 `const` / `export const` / `function` を見る */
const 宣言の頭 = /^(export\s+)?(const|let|function)\s+([A-Za-z_$][\w$]*)/;

/** 行の中の括弧を数える。 文字列と注釈の中は数えない = 数えると塊の境界がずれる */
function 深さの差(line) {
  let d = 0;
  let 囲み = null;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (囲み) {
      if (c === "\\") i += 1;
      else if (c === 囲み) 囲み = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      囲み = c;
      continue;
    }
    if (c === "/" && line[i + 1] === "/") break;
    if (c === "(" || c === "[" || c === "{") d += 1;
    if (c === ")" || c === "]" || c === "}") d -= 1;
  }
  return d;
}

/** 注釈だけの行か。 塊の直前に続く注釈はその塊のものとして連れて行く */
function 注釈行(line) {
  const t = line.trim();
  return t.startsWith("//") || t.startsWith("/*") || t.startsWith("*") || t.endsWith("*/");
}

/**
 * 深さ 0 の宣言ごとに切る。
 *
 * 塊は「直前に続く注釈 + 宣言の本体」。 宣言と宣言の間にある空行は、後ろの塊の側に付ける
 * = 前に付けると、末尾に他人の前置きが混ざる元の欠陥に戻る。
 */
export function 塊に切る(text) {
  const lines = String(text ?? "").split("\n");
  const 塊 = [];
  let depth = 0;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (depth === 0) {
      const m = 宣言の頭.exec(line);
      if (m) {
        // 直前に続く注釈 (と その間の空行) を頭に付ける
        let 頭 = i;
        while (頭 > 0) {
          const 前 = lines[頭 - 1] ?? "";
          if (注釈行(前)) 頭 -= 1;
          else break;
        }
        // 既に前の塊が食べた行は取り返さない
        const 前の尻 = 塊.length > 0 ? 塊[塊.length - 1].end : -1;
        if (頭 <= 前の尻) 頭 = 前の尻 + 1;

        let d = 0;
        let j = i;
        for (; j < lines.length; j += 1) {
          d += 深さの差(lines[j] ?? "");
          if (d <= 0 && j > i) break;
          if (d <= 0 && j === i && /;\s*(\/\/.*)?$/.test((lines[j] ?? "").trim())) break;
        }
        塊.push({ name: m[3], exported: Boolean(m[1]), start: 頭, end: Math.min(j, lines.length - 1) });
        i = Math.min(j, lines.length - 1) + 1;
        continue;
      }
    }
    depth += 深さの差(line);
    if (depth < 0) depth = 0;
    i += 1;
  }
  return 塊.map((c) => ({ ...c, text: lines.slice(c.start, c.end + 1).join("\n").replace(/\s+$/, "") }));
}

/** 語として現れるか。 部分一致で無関係な塊を巻き込まないため境界を見る */
function 語として含む(text, name) {
  return new RegExp(`(^|[^\\w$])${name.replace(/\$/g, "\\$")}([^\\w$]|$)`).test(text);
}

/**
 * 図 1 つを出すのに要る塊を、記法の並び順で返す。
 *
 * id を含む塊が `export` でなければ、その名前を使う `export const` まで辿る = 組み立てを
 * 途中の変数で止めると、段の宣言が落ちて記法として読めない。
 *
 * 辿った塊が参照する名前のうち、前に宣言された塊があれば併せて含める。
 * 参照はさらに参照を持つので、増えなくなるまで繰り返す。
 */
export function 図の塊(text, diagramId) {
  const 全部 = 塊に切る(text);
  if (全部.length === 0) return [];
  const 起点 = 全部.findIndex((c) => c.text.includes(`id: "${diagramId}"`));
  if (起点 < 0) return [];

  const 選ぶ = new Set([起点]);
  // 組み立てて使う側まで辿る (起点が export でない時)
  if (!全部[起点].exported) {
    for (let i = 起点 + 1; i < 全部.length; i += 1) {
      if (全部[i].exported && 語として含む(全部[i].text, 全部[起点].name)) {
        選ぶ.add(i);
        break;
      }
    }
  }
  // 参照する塊を前から集める。 増えなくなるまで回す
  for (let 回 = 0; 回 < 全部.length; 回 += 1) {
    const 前の数 = 選ぶ.size;
    for (const i of [...選ぶ]) {
      for (let j = 0; j < 全部.length; j += 1) {
        if (選ぶ.has(j)) continue;
        if (語として含む(全部[i].text, 全部[j].name)) 選ぶ.add(j);
      }
    }
    if (選ぶ.size === 前の数) break;
  }
  return [...選ぶ].sort((a, b) => a - b).map((i) => 全部[i]);
}

/** 抜き出した記法。 塊の間は空行 1 つで繋ぐ */
export function 抜き出す(text, diagramId) {
  return 図の塊(text, diagramId).map((c) => c.text).join("\n\n");
}

/**
 * 抜き出しから落ちた名前。
 *
 * 同じ file の深さ 0 で宣言されていて、抜き出しが語として参照しているのに含まれない名前を
 * 返す。 0 件でないなら、写しても動かない記法を納めることになる。
 */
export function 落ちた名前(text, diagramId) {
  const 全部 = 塊に切る(text);
  const 選んだ = 図の塊(text, diagramId);
  const 選んだ名 = new Set(選んだ.map((c) => c.name));
  const 本文 = 選んだ.map((c) => c.text).join("\n");
  return 全部
    .filter((c) => !選んだ名.has(c.name) && 語として含む(本文, c.name))
    .map((c) => c.name);
}
