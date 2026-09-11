// @vitest-environment node
/**
 * 図の題に英語の呼び名が残っていないことの検証 (#1792)。
 *
 * #1787 で画面の説明文から、#1790 で見本の名前から `DSL` を外した。
 * 図そのものに焼き付いた題だけが `認証フロー (DSL)` のまま残っていた。
 *
 * 題は 2 つの経路で画面に出る。 図の上の見出しとしてそのまま出るのと、
 * 題から導いた `id` が見本一覧の 2 行目に出るのと。 後者は小文字化して
 * 英数字と仮名漢字以外を `-` に潰した形なので、`認証フロ-dsl` のような読めない字になる。
 *
 * **題は記法の本文と組立て済みの `sourceJson__*` の 2 箇所に書かれている**。
 * 片方だけ直すと記法の頁と図の見出しが食い違うため、対応も併せて見る。
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const 見本帳の置き場 = fileURLToPath(new URL(".", import.meta.url));

/** 記法の本文 (`title: "..."`) と組立て済み (`"title": "..."`) の両方の形を拾う */
const 題の書き方 = /"?title"?\s*:\s*"([^"]*)"/g;

function 見本帳のfile一覧(): string[] {
  return readdirSync(見本帳の置き場).filter((f) => f.endsWith(".cdl.ts"));
}

/**
 * 本文から題を全件取り出す。 本番と植え込み対照が同じ関数を使う。
 */
export function 題を取り出す(src: string): string[] {
  return [...src.matchAll(題の書き方)].map((m) => m[1]!);
}

/** `export const <名> = ` から次の `export const` までを切り出す */
function 宣言の区間(src: string, 名: string): string | null {
  const 頭 = src.indexOf(`export const ${名} = `);
  if (頭 < 0) return null;
  const 次 = src.indexOf("\nexport const ", 頭 + 1);
  return src.slice(頭, 次 < 0 ? src.length : 次);
}

/** 記法の本文と組立て済みが対になっている見本を、題つきで列挙する */
function 本文と組立ての対(): { file: string; 鍵: string; yaml: string | null; json: string | null }[] {
  const out: { file: string; 鍵: string; yaml: string | null; json: string | null }[] = [];
  for (const f of 見本帳のfile一覧()) {
    const src = readFileSync(見本帳の置き場 + f, "utf8");
    for (const m of src.matchAll(/export const sourceYaml__([A-Za-z0-9_]+) = /g)) {
      const 鍵 = m[1]!;
      const y = 宣言の区間(src, `sourceYaml__${鍵}`);
      const j = 宣言の区間(src, `sourceJson__${鍵}`);
      if (!y || !j) continue;
      out.push({ file: f, 鍵, yaml: 題を取り出す(y)[0] ?? null, json: 題を取り出す(j)[0] ?? null });
    }
  }
  return out;
}

describe("図の題の言葉 (#1792)", () => {
  it("図の題に DSL が残っていない", () => {
    const files = 見本帳のfile一覧();
    expect(files.length, "見本帳の file を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(5);
    let 題の数 = 0;
    const 残る: string[] = [];
    for (const f of files) {
      for (const t of 題を取り出す(readFileSync(見本帳の置き場 + f, "utf8"))) {
        題の数 += 1;
        if (t.includes("DSL")) 残る.push(`${f}: ${t}`);
      }
    }
    expect(題の数, "題を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(500);
    expect(残る, `図の題に DSL が残る:\n${残る.join("\n")}`).toEqual([]);
  });

  it("DSL を含む題を拾える (植え込み対照)", () => {
    // 探し方が何にも当たらない形に壊れていると、上は必ず通る
    const 元 = `title: "認証の流れ"\n  "title": "C4 の系統図"`;
    expect(題を取り出す(元).filter((t) => t.includes("DSL"))).toEqual([]);
    const 植え = `title: "認証フロー (DSL)"\n  "title": "C4 (DSL)"`;
    expect(題を取り出す(植え).filter((t) => t.includes("DSL"))).toHaveLength(2);
  });

  it("記法の本文と組立て済みの題が一致する", () => {
    const 対 = 本文と組立ての対();
    expect(対.length, "本文と組立ての対を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(400);
    const 食い違う = 対
      .filter((p) => p.yaml !== p.json)
      .map((p) => `${p.file} ${p.鍵}: 本文=${p.yaml} 組立て=${p.json}`);
    expect(食い違う, `本文と組立ての題が食い違う:\n${食い違う.join("\n")}`).toEqual([]);
  });

  it("記法の見本の題を全件読めている", () => {
    // 直す対象が母集団に入っていることを固定する。
    // `text-dsl.cdl.ts` の対だけを数え、走査の網から外れていないことを見る
    const 記法の対 = 本文と組立ての対().filter((p) => p.file === "text-dsl.cdl.ts");
    expect(記法の対.length, "記法の見本を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(10);
    const 題なし = 記法の対.filter((p) => !p.yaml).map((p) => p.鍵);
    expect(題なし, `題を読めない記法の見本: ${題なし.join(", ")}`).toEqual([]);
  });
});
