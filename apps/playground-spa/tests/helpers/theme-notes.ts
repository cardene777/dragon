import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { THEMES, type DslTheme } from "@cardenelabs/dragon";

export const THEME_PORTS = [
  "ground",
  "face",
  "stripe",
  "frame",
  "ink",
  "type",
  "line",
  "own",
  "link",
] as const;

export type ThemePort = (typeof THEME_PORTS)[number];
export type ThemeValues = Record<ThemePort, string>;

export type ThemeNote =
  | { name: DslTheme; mode: "light-dark"; light: ThemeValues; dark: ThemeValues }
  | { name: DslTheme; mode: "fixed"; value: ThemeValues };

export type ThemeChartSeries = { roles: string[]; colors: string[] };
export type ThemeGroundText = { ink: string; type: string };
export type ThemeOutline = "frame" | "none";

/** 意匠帳の役の呼び名と CSS の口の対応。読む側は全てこの 1 表を使う (#2790)。 */
export const ROLE_TO_PORT = {
  台: "ground",
  行の面: "face",
  縞: "stripe",
  枠: "frame",
  字: "ink",
  型名: "type",
  線: "line",
  所有: "own",
  向きだけ: "link",
} as const satisfies Record<string, ThemePort>;

const ER_HEADINGS: Partial<Record<DslTheme, string>> = {
  kinari: "既定 — 生成りに茶",
  celadon: "指定した時だけ当たる — 青磁に墨",
};

const 読む = (rel: string): string =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

function 節を取る(本文: string, 見出し: string, 深さ: 2 | 3): string {
  const 印 = `${"#".repeat(深さ)} ${見出し}`;
  const 始め = 本文.indexOf(印);
  if (始め < 0) throw new Error(`意匠帳に「${印}」の節が無い`);
  const 次 = 本文.indexOf(`\n${"#".repeat(深さ)} `, 始め + 印.length);
  return 本文.slice(始め, 次 < 0 ? 本文.length : 次);
}

const 列に分ける = (行: string): string[] =>
  行.trim().replace(/^\||\|$/g, "").split("|").map((値) => 値.trim());

function 二列表を読む(節: string): Map<string, string> {
  const 行たち = 節.split("\n");
  const 見出し = 行たち.findIndex((行) => /^\|/.test(行) && 列に分ける(行)[0] === "役");
  if (見出し < 0) throw new Error("意匠帳の役の表が無い");

  const rows = new Map<string, string>();
  for (const 行 of 行たち.slice(見出し + 2)) {
    if (!行.trim().startsWith("|")) break;
    const 列 = 列に分ける(行);
    if (列.length !== 2) throw new Error(`意匠帳の「${列[0] ?? ""}」が ${列.length} 列ある (2 列が要る)`);
    rows.set(列[0] ?? "", 列[1] ?? "");
  }
  return rows;
}

function 表を読む(節: string): { columns: 2 | 3; rows: Map<ThemePort, string[]> } {
  const 行たち = 節.split("\n");
  const 見出し = 行たち.findIndex((行) => /^\|/.test(行) && 列に分ける(行)[0] === "役");
  if (見出し < 0) throw new Error("意匠帳の役の表が無い");
  const columns = 列に分ける(行たち[見出し] ?? "").length;
  if (columns !== 2 && columns !== 3) throw new Error(`意匠帳の表が ${columns} 列ある (2 列か 3 列が要る)`);

  const rows = new Map<ThemePort, string[]>();
  for (const 行 of 行たち.slice(見出し + 2)) {
    if (!行.trim().startsWith("|")) break;
    const 列 = 列に分ける(行);
    const 役 = 列[0] ?? "";
    if (!Object.hasOwn(ROLE_TO_PORT, 役)) continue;
    if (列.length !== columns) throw new Error(`意匠帳の「${役}」が ${列.length} 列ある`);
    const 値 = 列.slice(1).map((色) => {
      const m = /^`(#[0-9a-fA-F]{6})`$/.exec(色);
      if (!m) throw new Error(`意匠帳の「${役}」の値が #rrggbb ではない (${色})`);
      return m[1]!.toLowerCase();
    });
    rows.set(ROLE_TO_PORT[役 as keyof typeof ROLE_TO_PORT], 値);
  }
  return { columns, rows };
}

function 値を揃える(rows: Map<ThemePort, string[]>, index: number, name: string): ThemeValues {
  const out = {} as ThemeValues;
  for (const port of THEME_PORTS) {
    const value = rows.get(port)?.[index];
    if (value === undefined) throw new Error(`意匠帳の ${name} に ${port} の値が無い`);
    out[port] = value;
  }
  if (rows.size !== THEME_PORTS.length) {
    throw new Error(`意匠帳の ${name} の口が ${rows.size} 個ある (${THEME_PORTS.length} 個が要る)`);
  }
  return out;
}

/**
 * 全ての意匠帳を読む。3 列なら明暗、2 列なら固定と表の形から判定する。
 *
 * `overrides` は本文の変異試験用。file を書き換えず、同じ読み手へ変更した本文を渡せる。
 */
export function readThemeNotes(overrides: Partial<Record<DslTheme, string>> = {}): Map<DslTheme, ThemeNote> {
  const er = (): string => overrides.kinari ?? overrides.celadon ?? 読む("../../../../docs/design/er/note.md");
  const out = new Map<DslTheme, ThemeNote>();

  for (const name of THEMES) {
    const erHeading = ER_HEADINGS[name];
    const 本文 = overrides[name] ?? (erHeading ? er() : 読む(`../../../../docs/design/${name}/note.md`));
    const 節 = erHeading ? 節を取る(本文, erHeading, 3) : 節を取る(本文, "値", 2);
    const 表 = 表を読む(節);
    if (表.columns === 3) {
      out.set(name, {
        name,
        mode: "light-dark",
        light: 値を揃える(表.rows, 0, name),
        dark: 値を揃える(表.rows, 1, name),
      });
    } else {
      out.set(name, { name, mode: "fixed", value: 値を揃える(表.rows, 0, name) });
    }
  }

  if (out.size !== THEMES.length) {
    throw new Error(`意匠帳を ${out.size} 件しか読めない (${THEMES.length} 件が要る)`);
  }
  return out;
}

export function readThemeNoteText(name: DslTheme): string {
  const erHeading = ER_HEADINGS[name];
  return erHeading
    ? 読む("../../../../docs/design/er/note.md")
    : 読む(`../../../../docs/design/${name}/note.md`);
}

/** 固定の意匠の主役「一」を読む。行が無い意匠は線を主役として扱う。 */
export function readFixedThemeLead(
  overrides: Partial<Record<DslTheme, string>> = {},
): Map<DslTheme, string> {
  const out = new Map<DslTheme, string>();
  for (const [name, note] of readThemeNotes(overrides)) {
    if (note.mode !== "fixed") continue;
    const 本文 = overrides[name] ?? readThemeNoteText(name);
    const rows = 二列表を読む(節を取る(本文, "色以外の値", 3));
    const 一 = rows.get("一");
    if (一 === undefined) {
      out.set(name, note.value.line);
      continue;
    }
    const 色 = /^`(#[0-9a-fA-F]{6})`/.exec(一)?.[1];
    if (!色) throw new Error(`意匠帳の ${name} の「一」が #rrggbb で始まらない`);
    out.set(name, 色.toLowerCase());
  }
  return out;
}

/** 固定の意匠の「色以外の値」から、役の先頭に書いた色を読む。行が無い役は `undefined`。 */
export function readFixedThemeRoleColor(
  name: DslTheme,
  role: string,
  textOverride?: string,
): string | undefined {
  const note = readThemeNotes().get(name);
  if (note?.mode !== "fixed") return undefined;
  const rows = 二列表を読む(節を取る(textOverride ?? readThemeNoteText(name), "色以外の値", 3));
  const value = rows.get(role);
  if (value === undefined) return undefined;
  const color = /^`(#[0-9a-fA-F]{6})`/.exec(value)?.[1];
  if (!color) throw new Error(`意匠帳の ${name} の「${role}」が #rrggbb で始まらない`);
  return color.toLowerCase();
}

/** 固定の意匠で台の上だけに使う字を読む。2 行とも無い意匠は別の組を持たない。 */
export function readFixedThemeGroundText(
  overrides: Partial<Record<DslTheme, string>> = {},
): Map<DslTheme, ThemeGroundText> {
  const out = new Map<DslTheme, ThemeGroundText>();
  for (const [name, note] of readThemeNotes(overrides)) {
    if (note.mode !== "fixed") continue;
    const 本文 = overrides[name] ?? readThemeNoteText(name);
    const rows = 二列表を読む(節を取る(本文, "色以外の値", 3));
    const 地の字 = rows.get("地の字");
    const 地の薄 = rows.get("地の薄");
    if (地の字 === undefined && 地の薄 === undefined) continue;
    if (地の字 === undefined || 地の薄 === undefined) {
      throw new Error(`意匠帳の ${name} は「地の字」と「地の薄」を両方持つ必要がある`);
    }
    const ink = /^`(#[0-9a-fA-F]{6})`/.exec(地の字)?.[1];
    const type = /^`(#[0-9a-fA-F]{6})`/.exec(地の薄)?.[1];
    if (!ink) throw new Error(`意匠帳の ${name} の「地の字」が #rrggbb で始まらない`);
    if (!type) throw new Error(`意匠帳の ${name} の「地の薄」が #rrggbb で始まらない`);
    out.set(name, { ink: ink.toLowerCase(), type: type.toLowerCase() });
  }
  return out;
}

/** 固定の意匠で、描き手の値より優先する箱の枠の濃さを読む。 */
export function readFixedThemeFrameOpacity(
  overrides: Partial<Record<DslTheme, string>> = {},
): Map<DslTheme, number> {
  const out = new Map<DslTheme, number>();
  for (const [name, note] of readThemeNotes(overrides)) {
    if (note.mode !== "fixed") continue;
    const 本文 = overrides[name] ?? readThemeNoteText(name);
    const rows = 二列表を読む(節を取る(本文, "色以外の値", 3));
    const 値 = rows.get("枠の濃さ");
    if (値 === undefined) throw new Error(`意匠帳の ${name} に「枠の濃さ」が無い`);
    const number = /^(?:`)?(\d+(?:\.\d+)?)/.exec(値)?.[1];
    if (number === undefined) {
      throw new Error(`意匠帳の ${name} の「枠の濃さ」が数で始まらない`);
    }
    out.set(name, Number(number));
  }
  return out;
}

/** 固定の意匠の縁線を読む。行が無い意匠は従来どおり枠を描く。 */
export function readFixedThemeOutline(
  overrides: Partial<Record<DslTheme, string>> = {},
): Map<DslTheme, ThemeOutline> {
  const out = new Map<DslTheme, ThemeOutline>();
  for (const [name, note] of readThemeNotes(overrides)) {
    if (note.mode !== "fixed") continue;
    const 本文 = overrides[name] ?? readThemeNoteText(name);
    const rows = 二列表を読む(節を取る(本文, "色以外の値", 3));
    const value = rows.get("縁線");
    if (value === undefined) {
      out.set(name, "frame");
      continue;
    }
    if (value.startsWith("なし")) {
      out.set(name, "none");
      continue;
    }
    throw new Error(`意匠帳の ${name} の「縁線」は「なし」で始まるか、行を置かない必要がある`);
  }
  return out;
}

/** 固定の意匠の「図表の系列色」を、2 つの役の表から値へ解く。 */
export function readFixedThemeChartSeries(
  overrides: Partial<Record<DslTheme, string>> = {},
): Map<DslTheme, ThemeChartSeries> {
  const out = new Map<DslTheme, ThemeChartSeries>();
  for (const [name, note] of readThemeNotes(overrides)) {
    if (note.mode !== "fixed") continue;
    const 本文 = overrides[name] ?? readThemeNoteText(name);
    const 値の表 = 二列表を読む(節を取る(本文, "値", 2));
    const 色以外の表 = 二列表を読む(節を取る(本文, "色以外の値", 3));
    const 役から色 = new Map<string, string>();
    for (const [役, 内容] of [...値の表, ...色以外の表]) {
      const 色 = /^`(#[0-9a-fA-F]{6})`/.exec(内容)?.[1];
      if (色) 役から色.set(役, 色.toLowerCase());
    }

    const 並び = 色以外の表.get("図表の系列色");
    if (!並び) throw new Error(`意匠帳の ${name} に「図表の系列色」が無い`);
    const 番号から役 = new Map<number, string>();
    for (const m of 並び.matchAll(/(?:^|、)\s*(\d+)\s*=\s*([^、]+)/g)) {
      const 番号 = m[1];
      const 役 = m[2];
      if (!番号 || !役) throw new Error(`意匠帳の ${name} の図表の系列色を読めない`);
      番号から役.set(Number(番号), 役.trim());
    }

    const roles: string[] = [];
    const colors: string[] = [];
    for (let number = 1; number <= 6; number += 1) {
      const 役 = 番号から役.get(number);
      if (!役) throw new Error(`意匠帳の ${name} の図表に系列 ${number} の役が無い`);
      const 色 = 役から色.get(役);
      if (!色) throw new Error(`意匠帳の ${name} で図表の役「${役}」から値を引けない`);
      roles.push(役);
      colors.push(色);
    }
    if (番号から役.size !== 6) {
      throw new Error(`意匠帳の ${name} の図表に系列が ${番号から役.size} 個ある (6 個が要る)`);
    }
    out.set(name, { roles, colors });
  }
  return out;
}
