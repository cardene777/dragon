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

const カタログの置き場 = fileURLToPath(new URL(".", import.meta.url));

/**
 * 記法の本文 (`title: "..."`) と組立て済み (`"title": "..."`) の両方の形を拾う。
 *
 * **副題 (`subtitle`) も網に入る** = 末尾が `title` で一致するため。 意図して残している
 * (副題に `DSL` が出るのも同じく直す対象で、0 件を期待する検査なので広い側に倒す)。
 */
const 題の書き方 = /"?(?:sub)?title"?\s*:\s*"([^"]*)"/g;

function カタログのfile一覧(): string[] {
  return readdirSync(カタログの置き場).filter((f) => f.endsWith(".cdl.ts"));
}

/**
 * 本文から題を全件取り出す。 本番と植え込み対照が同じ関数を使う。
 */
export function 題を取り出す(src: string): string[] {
  return [...src.matchAll(題の書き方)].map((m) => m[1]!);
}

/**
 * 図そのものの題だけを拾う (副題を含めない)。 対応を見る側はこちらを使う。
 *
 * 副題まで混ぜると、副題が先に書かれた見本で「本文の題」 と「組立ての副題」 を
 * 突き合わせることになり、食い違いを見落とす。
 */
const 図の題の書き方 = /(?:^|[^a-z"])"?title"?\s*:\s*"([^"]*)"/;

function 図の題を取る(src: string): string | null {
  return 図の題の書き方.exec(src)?.[1] ?? null;
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
  for (const f of カタログのfile一覧()) {
    const src = readFileSync(カタログの置き場 + f, "utf8");
    for (const m of src.matchAll(/export const sourceYaml__([A-Za-z0-9_]+) = /g)) {
      const 鍵 = m[1]!;
      const y = 宣言の区間(src, `sourceYaml__${鍵}`);
      const j = 宣言の区間(src, `sourceJson__${鍵}`);
      if (!y || !j) continue;
      out.push({ file: f, 鍵, yaml: 図の題を取る(y), json: 図の題を取る(j) });
    }
  }
  return out;
}

describe("図の題の言葉 (#1792)", () => {
  it("図の題に DSL が残っていない", () => {
    const files = カタログのfile一覧();
    expect(files.length, "カタログの file を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(5);
    let 題の数 = 0;
    const 残る: string[] = [];
    for (const f of files) {
      for (const t of 題を取り出す(readFileSync(カタログの置き場 + f, "utf8"))) {
        題の数 += 1;
        if (t.includes("DSL")) 残る.push(`${f}: ${t}`);
      }
    }
    // 走査した数を出す。 0 件が「該当なし」 か「測っていない」 かを読み手が分けられるようにする
    console.log(`[図の題] file=${files.length} 題と副題=${題の数} DSL が残る=${残る.length}`);
    expect(題の数, "題を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(500);
    expect(残る, `図の題に DSL が残る:\n${残る.join("\n")}`).toEqual([]);
  });

  it("DSL を含む題を拾える (植え込み対照)", () => {
    // 探し方が何にも当たらない形に壊れていると、上は必ず通る
    const 元 = `title: "認証の流れ"\n  "title": "C4 の系統図"`;
    expect(題を取り出す(元).filter((t) => t.includes("DSL"))).toEqual([]);
    const 植え = `title: "認証フロー (DSL)"\n  "title": "C4 (DSL)"`;
    expect(題を取り出す(植え).filter((t) => t.includes("DSL"))).toHaveLength(2);
    // 副題も網に入ることを固定する (広い側に倒している理由が消えたら落ちる)
    expect(題を取り出す(`  "subtitle": "受け口 (DSL)"`).filter((t) => t.includes("DSL"))).toHaveLength(1);
  });

  it("対応を見る側は副題を題と取り違えない (植え込み対照)", () => {
    // 副題が題より先に書かれた形。 混ぜると「本文の題」 と「組立ての副題」 を突き合わせる
    expect(図の題を取る(`  "subtitle": "受け口"\n  "title": "系の構成"`)).toBe("系の構成");
    expect(図の題を取る(`title: "系の構成"`)).toBe("系の構成");
    expect(図の題を取る(`  "subtitle": "受け口"`)).toBeNull();
  });

  it("記法の本文と組立て済みの題が一致する", () => {
    const 対 = 本文と組立ての対();
    console.log(`[題の対応] 対=${対.length} 題を読めない=${対.filter((p) => !p.yaml).length}`);
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
