// @vitest-environment node
/**
 * 画面の枠 (`components/`) に出る文言が日本語であることの検証 (#1795)。
 *
 * #1785 / #1787 で画面の説明文の英語を日本語にしたが、対象は `pages/` 配下だった。
 * 編集画面の枠はその走査の外で、`同一 node fan の out edge Y を DSL で揃える` のような
 * 案内文が残っていた。 図の走査で見つかった注意を直す時に画面へ出る文で、
 * `node` / `edge` / `fan` はどれもこの repo の中の呼び名なので、外の読み手には
 * 何を直せばよいか取れない。
 *
 * 文言は 2 つの形で書かれている。 二重引用符の中に書く形 (`title` / `aria-label` / 定数) と、
 * JSX の地の文として書く形と。 **両方を見る** = 片方だけだともう片方に逃げられる。
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const 置き場 = fileURLToPath(new URL(".", import.meta.url));

/**
 * 日本語の文に残してよい語と、その理由。
 *
 * **理由を 1 語ずつ書く** = 理由を書けない語は開ける語で、一覧に足すこと自体が
 * 「直さない」 の言い換えになる。
 */
const 残してよい語: Record<string, string> = {
  URL: "定着した略語",
  SVG: "画像の形式の名前。 日本語の呼び名が無い",
  PNG: "画像の形式の名前。 日本語の呼び名が無い",
  PDF: "書類の形式の名前。 日本語の呼び名が無い",
  YAML: "記法の形式の名前。 日本語の呼び名が無い",
  JSON: "記法の形式の名前。 日本語の呼び名が無い",
  CDL: "この記法の名前",
  Esc: "鍵盤に刻まれている字そのもの",
  actors: "記法の項目の名前。 画面に出す記法と同じ綴りで書く必要がある",
  labelOffsetX: "記法の項目の名前。 画面に出す記法と同じ綴りで書く必要がある",
  labelOffsetY: "記法の項目の名前。 画面に出す記法と同じ綴りで書く必要がある",
  GitHub: "起票と取り込み依頼を受け付けている場所の名前",
  Notion: "書き置き場の名前",
  Keynote: "発表資料を作る道具の名前",
  Slack: "やり取りする場所の名前",
  Twitter: "やり取りする場所の名前",
  README: "取り決めで決まっている file の名前",
};

const 日本語の字 = /[ぁ-んァ-ヶ一-龯]/;
const 英単語 = /[A-Za-z][A-Za-z0-9_-]{1,}/g;

/** 画面に出ない文字列。 見た目の札 (`className`) と検査の目印 (`data-testid`) */
const 画面に出ない = /(?:className|class|classList|data-testid)\s*=\s*$/;

function 画面のfile一覧(拡張子: RegExp): string[] {
  const out: string[] = [];
  const 降りる = (dir: string): void => {
    for (const e of readdirSync(dir)) {
      const p = dir + e;
      if (statSync(p).isDirectory()) 降りる(p + "/");
      else if (拡張子.test(e) && !e.includes(".test.")) out.push(p);
    }
  };
  降りる(置き場);
  return out;
}

/**
 * コメントと記法の見本を外す。 中の英語は画面に出ない。
 *
 * **外すのは行をまたぐ `` ` `` の字だけ** = 記法の見本は複数行で書かれている。
 * 1 行に収まる `` ` `` の字は画面に出す文言 (`一括反映 (3) ✨` のような差し込みつきの文) なので残す。
 * 外した件数は検査が内訳に出す。
 */
function コメントを外す(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/gm, "$1");
}

/** 行をまたぐ `` ` `` の字を外す。 戻り値は外した後の字と、外した件数 */
export function 見本を外す(src: string): { 字: string; 外した: number } {
  let 外した = 0;
  const 字 = src.replace(/`[^`]*`/g, (m) => {
    if (!m.includes("\n")) return m;
    外した += 1;
    return " ";
  });
  return { 字, 外した };
}

/** 日本語の文に混じる、残してよい語以外の英単語を返す */
export function 開ける英単語(文: string): string[] {
  if (!日本語の字.test(文)) return [];
  return [...new Set(文.match(英単語) ?? [])].filter((w) => !(w in 残してよい語));
}

/**
 * 引用符の中の文言を取り出す。 本番と植え込み対照が同じ関数を使う。
 *
 * 二重引用符と、1 行に収まる `` ` `` の字の両方を見る。
 * 見た目の札と検査の目印は画面に出ないので外す。
 * `` ` `` の字の差し込み (`${...}`) は中身が識別子なので外す。
 *
 * **長さで絞るのは取り出した後**。 取り出す時に下限を課すと短い文字列 1 つを飛ばし、
 * その閉じ引用符と次の開き引用符が対になって、引用符の外側 (` title=`) を文言として拾う。
 */
export function 引用符の文言(src: string): string[] {
  const out: string[] = [];
  for (const ln of src.split("\n")) {
    for (const m of ln.matchAll(/"([^"\\\n]*)"|`([^`\\\n]*)`/g)) {
      if (画面に出ない.test(ln.slice(0, m.index))) continue;
      const v = (m[1] ?? m[2]!).replace(/\$\{[^}]*\}/g, " ");
      if (v.length >= 2 && v.length <= 120) out.push(v);
    }
  }
  return out;
}

/** JSX の地の文を取り出す。 本番と植え込み対照が同じ関数を使う */
export function 地の文(src: string): string[] {
  return [...src.matchAll(/>([^<>{}\n]{2,120})</g)].map((m) => m[1]!.trim()).filter((v) => v !== "");
}

describe("画面の枠の文言 (#1795)", () => {
  it("引用符の文言に開ける英単語が残っていない", () => {
    const files = 画面のfile一覧(/\.tsx?$/);
    expect(files.length, "画面 file を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(3);
    let 拾えた = 0;
    let 外した = 0;
    const 残る: string[] = [];
    for (const f of files) {
      const 見本外し = 見本を外す(コメントを外す(readFileSync(f, "utf8")));
      外した += 見本外し.外した;
      for (const 文 of 引用符の文言(見本外し.字)) {
        if (!日本語の字.test(文)) continue;
        拾えた += 1;
        const 語 = 開ける英単語(文);
        if (語.length > 0) {
          残る.push(`${f.slice(置き場.length)}: ${文} [${語.join(" ")}]`);
        }
      }
    }
    console.log(
      `[引用符] file=${files.length} 日本語の文言=${拾えた} 外した(行をまたぐ見本)=${外した} 開ける英単語が残る=${残る.length}`,
    );
    expect(拾えた, "日本語の文言を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(20);
    expect(残る, `引用符の文言に英語が残る:\n${残る.join("\n")}`).toEqual([]);
  });

  it("JSX の地の文に開ける英単語が残っていない", () => {
    const files = 画面のfile一覧(/\.tsx$/);
    expect(files.length, "画面 file を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(3);
    let 拾えた = 0;
    const 残る: string[] = [];
    for (const f of files) {
      for (const 文 of 地の文(見本を外す(コメントを外す(readFileSync(f, "utf8"))).字)) {
        if (!日本語の字.test(文)) continue;
        拾えた += 1;
        const 語 = 開ける英単語(文);
        if (語.length > 0) {
          残る.push(`${f.slice(置き場.length)}: ${文} [${語.join(" ")}]`);
        }
      }
    }
    console.log(`[地の文] file=${files.length} 日本語の地の文=${拾えた} 開ける英単語が残る=${残る.length}`);
    expect(拾えた, "日本語の地の文を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(3);
    expect(残る, `地の文に英語が残る:\n${残る.join("\n")}`).toEqual([]);
  });

  it("英語が混じる文言を拾える (植え込み対照)", () => {
    // 探し方が何にも当たらない形に壊れていると、上の 2 件は必ず通る
    const 元 = `  title="記法の側で直す"\n      <span>今の段の静止 1 こま</span>`;
    expect(引用符の文言(元).flatMap(開ける英単語)).toEqual([]);
    expect(地の文(元).flatMap(開ける英単語)).toEqual([]);
    const 植え = `  title="DSL 側で調整"\n      <span>現 phase の静止 1 frame</span>`;
    expect(引用符の文言(植え).flatMap(開ける英単語)).toEqual(["DSL"]);
    expect(地の文(植え).flatMap(開ける英単語)).toEqual(["phase", "frame"]);
  });

  it("1 行の差し込みつきの文も文言として拾う (植え込み対照)", () => {
    // 行をまたぐ見本だけを外す。 1 行に収まる形まで外すと、差し込みつきの文言に逃げられる
    const 差し込み = "                  ? `対応可 ${n} 件を DSL に反映`";
    expect(引用符の文言(差し込み).flatMap(開ける英単語)).toEqual(["DSL"]);
    const 見本 = "const s = `\ntitle: \"flow demo\"\ntype: flow\n`;";
    expect(見本を外す(見本).外した).toBe(1);
    expect(見本を外す(差し込み).外した).toBe(0);
  });

  it("見た目の札は画面に出ない字として外す (植え込み対照)", () => {
    // 外し方が効いていないと、`tok-色名` のような札が英語として数えられる
    const 札 = `      <code className="v4-editor-syntax-code tok-色名">`;
    expect(引用符の文言(札)).toEqual([]);
    // 同じ行でも札でない文字列は残す
    const 混在 = `      <button className="x" title="この画面を共有">`;
    expect(引用符の文言(混在)).toEqual(["この画面を共有"]);
  });

  it("残してよい語が理由を持っている", () => {
    const 語 = Object.entries(残してよい語);
    expect(語.length, "残してよい語が 1 つも無い (検査が空振りしている)").toBeGreaterThan(5);
    const 理由なし = 語.filter(([, 理由]) => 理由.trim().length < 5).map(([w]) => w);
    expect(理由なし, `理由を書いていない語: ${理由なし.join(", ")}`).toEqual([]);
  });
});
