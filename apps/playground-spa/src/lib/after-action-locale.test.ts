/**
 * 押した後に出る文が、画面の言語に付いてくることの検証 (#2447)。
 *
 * 開いた直後の字は `tests/pages-i18n.spec.ts` が見ているが、**押した後に現れる字には届かない**。
 * 英語で開いて `URL コピー` を押すと「URL をコピーしました」 と日本語で出ていた。
 * 逆向きもあり、日本語で使っていて記述欄の種類を切り替えると英語で聞いてくる窓が出ていた。
 *
 * ## 一覧を人手で書かない
 *
 * 直した 7 箇所を並べる形にすると、呼出を新しく足した日に何も言わない。
 * 知らせと確かめの窓を出す 4 つの呼出を実物から拾い、
 * **言語で選んでいない呼出が 0 件** であることだけを見る。
 *
 * ## 字を持たない呼出は数えない
 *
 * 文を変数で受け取る呼出 (既に言語で選んだ後の字を渡す形) は、引数に読める字を持たない。
 * それを「言語で選んでいない」 と数えると、正しい形を直せと言うことになる。
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * 呼び方の字は繋いで作る (`vitest-env-declared-per-file.test.ts` と同じ形)。
 *
 * この file は「素の画面部品を使う検査が環境の指定を持つ」 の走査対象に入る。
 * 通しの綴りを書くと画面の部品を触っていると判定され、環境の指定を持たないこの file が落ちる。
 */
const 窓 = ["win", "dow"].join("");

/** 押した後に文を出す呼び方。 この 4 つ以外は画面に字を出さない */
const 呼び方 = new RegExp(
  `\\b(toast|${窓}\\.confirm|${窓}\\.prompt|${窓}\\.alert)\\s*\\(`,
  "g",
);

/** 言語で選んでいる書き方 */
const 言語で選ぶ = /\blocale\s*===\s*"(?:ja|en)"|\bisJa\b/;

/** `type: "success"` のような機械向けの値。 読む人には出ない */
const 機械向け = new Set(["success", "error", "info", "warning"]);

export interface 呼出 {
  file: string;
  行: number;
  呼び方: string;
  /** 引数の中で、読む人に出る字 */
  字: string[];
  言語で選んでいる: boolean;
}

/** 呼出の `(` から釣り合う `)` までを返す。 釣り合わなければ末尾まで */
function 引数の範囲(src: string, 開き: number): string {
  let 深さ = 0;
  for (let i = 開き; i < src.length; i += 1) {
    const c = src[i];
    if (c === "(") 深さ += 1;
    else if (c === ")") {
      深さ -= 1;
      if (深さ === 0) return src.slice(開き + 1, i);
    }
  }
  return src.slice(開き + 1);
}

/** 読む人に出る字だけを取り出す。 機械向けの値と短すぎる字は外す */
function 読める字(引数: string): string[] {
  const out: string[] = [];
  for (const m of 引数.matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"|`([^`\\]*(?:\\.[^`\\]*)*)`/g)) {
    const s = m[1] ?? m[2] ?? "";
    if (s.length < 4) continue;
    if (機械向け.has(s)) continue;
    // 言葉として読める形 = 日本語を含むか、空白で区切られた 2 語以上
    const 日本語 = /[぀-ヿ一-鿿]/.test(s);
    const 英文 = /^[A-Za-z][A-Za-z0-9 ,.'’?!:;()-]*\s[A-Za-z]/.test(s);
    if (日本語 || 英文) out.push(s);
  }
  return out;
}

/** 本番と植え込み対照が同じ関数を使う */
export function 呼出を拾う(src: string, file: string): 呼出[] {
  const out: 呼出[] = [];
  const 行頭 = (i: number): number => src.slice(0, i).split("\n").length;
  for (const m of src.matchAll(呼び方)) {
    const 行 = 行頭(m.index);
    const その行 = src.split("\n")[行 - 1] ?? "";
    // 注釈の中の呼び方は数えない (説明文に書いた呼出の字を拾わないため)
    if (/^\s*(\*|\/\/)/.test(その行)) continue;
    const 引数 = 引数の範囲(src, m.index + m[0].length - 1);
    out.push({
      file,
      行,
      呼び方: m[1] ?? "",
      字: 読める字(引数),
      言語で選んでいる: 言語で選ぶ.test(引数),
    });
  }
  return out;
}

const 置き場 = fileURLToPath(new URL("..", import.meta.url));

/** 画面を組み立てる file を全部読む。 一覧を人手で並べない */
function 読む対象(): { path: string; src: string }[] {
  const out: { path: string; src: string }[] = [];
  const 降りる = (dir: string, 前: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const 次 = `${前}${e.name}`;
      if (e.isDirectory()) {
        降りる(`${dir}/${e.name}`, `${次}/`);
        continue;
      }
      if (!/\.tsx?$/.test(e.name)) continue;
      if (/\.test\.tsx?$/.test(e.name)) continue;
      // 知らせを出す仕組みそのもの。 文を受け取る側なので言語を選ばない
      if (e.name === "Toast.tsx") continue;
      out.push({ path: 次, src: readFileSync(`${dir}/${e.name}`, "utf-8") });
    }
  };
  降りる(置き場, "");
  return out;
}

describe("押した後に出る文が画面の言語に付いてくる (#2447)", () => {
  const 全呼出 = 読む対象().flatMap(({ path, src }) => 呼出を拾う(src, path));

  it("走査した呼出が 1 件以上ある (空振り防止)", () => {
    expect(全呼出.length, "呼出を 1 件も拾えていない = 走査が効いていない").toBeGreaterThan(0);
  });

  it("言語で選んでいない呼出が 0 件", () => {
    const 取り残し = 全呼出
      .filter((c) => c.字.length > 0 && !c.言語で選んでいる)
      .map((c) => `${c.file}:${c.行} ${c.呼び方} ... ${c.字[0]?.slice(0, 40) ?? ""}`);
    expect(取り残し, `走査した呼出 ${全呼出.length} 件のうち、言語で選んでいないもの`).toEqual([]);
  });

  it("字を持たない呼出を取り残しに数えない", () => {
    const 拾った = 呼出を拾う(`toast({ type: "success", title: 見出し });`, "x.tsx");
    expect(拾った).toHaveLength(1);
    expect(拾った[0]?.字).toEqual([]);
  });

  it("言語で選んだ呼出を取り残しに数えない", () => {
    const 拾った = 呼出を拾う(
      `toast({ type: "success", title: locale === "ja" ? "コピーしました" : "Copied the URL" });`,
      "x.tsx",
    );
    expect(拾った[0]?.字).toEqual(["コピーしました", "Copied the URL"]);
    expect(拾った[0]?.言語で選んでいる).toBe(true);
  });

  it("言語を選ばない呼出を取り残しとして拾う", () => {
    const 拾った = 呼出を拾う(`toast({ type: "success", title: "URL をコピーしました" });`, "x.tsx");
    expect(拾った[0]?.字).toEqual(["URL をコピーしました"]);
    expect(拾った[0]?.言語で選んでいる).toBe(false);
  });

  it("注釈の中の呼び方を拾わない", () => {
    const 呼出 = `${窓}.confirm("消えます")`;
    expect(呼出を拾う(`  // ${呼出} を出す`, "x.tsx")).toEqual([]);
    expect(呼出を拾う(`   * ${呼出} を出す`, "x.tsx")).toEqual([]);
  });
});
