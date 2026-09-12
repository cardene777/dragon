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
  posX: "記法の項目の名前。 画面に出す記法と同じ綴りで書く必要がある",
  posY: "記法の項目の名前。 画面に出す記法と同じ綴りで書く必要がある",
  ms: "時間の単位の記号。 数の直後に付けて書く形 (`320ms`) で、間に字を挟めない",
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

/**
 * 差し込み (`{件数}` / `{isJa ? "あ" : "い"}`)。 入れ子は 1 段まで取る。
 *
 * 行をまたぐ記法の見本は `見本を外す` が先に中身を空にするので、
 * ここでは中括弧の対だけを見れば足りる。
 */
const 差し込み = /\{(?:[^{}]|\{[^{}]*\})*\}/;

/** `>` から `<` までの区間。 差し込みを含む字も 1 つの区間として取る (#1812) */
const 要素の中身 = />((?:[^<>{}]|\{(?:[^{}]|\{[^{}]*\})*\})+)</g;

/**
 * コードとみなして外す印 (#1812)。
 *
 * 改行を許すと型の指定 (`ReturnType<…>`) や矢印の `>` が区間の始まりになり、
 * 画面に出ないコードが入る。 実測で入った 4 件は、打ち終わりか等値の比較か
 * 関数の宣言のいずれかを含んでいた。
 *
 * **等号だけでは外さない**。 等号を含むというだけで画面に出る字が落ちることを #1809 で実測した。
 */
const コード風 = /;|===|\bfunction\b/;

/**
 * JSX の地の文を取り出す。 本番と植え込み対照が同じ関数を使う。
 *
 * **改行と差し込みを区間の切れ目にしない** (#1812)。 JSX は要素の中身を改行して書くので、
 * 切れ目にすると複数行に渡る字が丸ごと候補から外れる
 * (実測 = 9 file で 8 件しか見ておらず、実際は 20 件あった)。
 *
 * 差し込みそのものは値が入る所なので字としては読まず、前後の地の字に割る。
 */
export function 地の文(src: string): { 文: string[]; またぐ: number } {
  const 文: string[] = [];
  let またぐ = 0;
  for (const m of src.matchAll(要素の中身)) {
    // 数えるのは区間の側。 取り出した字は前後の空白を落とすので、
    // 拾えた字に改行は残らず、字の側では複数行だったことが分からない
    const 複数行 = m[1]!.includes("\n");
    let 取れた = 0;
    for (const 片 of m[1]!.split(差し込み)) {
      const v = 片.trim();
      if (v === "" || v.length > 200 || コード風.test(v)) continue;
      文.push(v);
      取れた += 1;
    }
    if (複数行 && 取れた > 0) またぐ += 1;
  }
  return { 文, またぐ };
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
    let またぐ = 0;
    const 残る: string[] = [];
    for (const f of files) {
      const r = 地の文(見本を外す(コメントを外す(readFileSync(f, "utf8"))).字);
      またぐ += r.またぐ;
      for (const 文 of r.文) {
        if (!日本語の字.test(文)) continue;
        拾えた += 1;
        const 語 = 開ける英単語(文);
        if (語.length > 0) {
          残る.push(`${f.slice(置き場.length)}: ${文} [${語.join(" ")}]`);
        }
      }
    }
    console.log(
      `[地の文] file=${files.length} 日本語の地の文=${拾えた} 改行をまたぐ区間=${またぐ} 開ける英単語が残る=${残る.length}`,
    );
    expect(拾えた, "日本語の地の文を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(3);
    // 改行をまたぐ字を 1 つも拾えていないなら、#1812 で直した経路が死んでいる。
    // 件数ではなく「その形を見ているか」 を見るので、下限は 1 に置く
    expect(またぐ, "改行をまたぐ地の文を 1 つも拾えていない (#1812 の経路が死んでいる)").toBeGreaterThan(0);
    expect(残る, `地の文に英語が残る:\n${残る.join("\n")}`).toEqual([]);
  });

  it("改行をまたぐ字と差し込みを含む字を拾える (植え込み対照、#1812)", () => {
    // 改行を区間の切れ目として扱うと、複数行に渡る字が丸ごと候補から消えて検査が素通りする
    const 元 = `<div className="h">\n              押すと 1 行足します。 位置は記法で変えます。\n            </div>`;
    expect(地の文(元).文, "改行をまたぐ字を拾えていない").toEqual([
      "押すと 1 行足します。 位置は記法で変えます。",
    ]);
    expect(地の文(元).またぐ, "改行をまたぐ区間を数えていない").toBe(1);
    const 英語 = `<div className="h">\n              押すと 1 行足します。 位置は DSL で変えます。\n            </div>`;
    expect(地の文(英語).文.flatMap(開ける英単語)).toEqual(["DSL"]);

    // 差し込みは値が入る所なので字として読まず、前後の地の字に割る
    const 差し込みつき = `<div className="m">{Math.round(d)}ms · 繰り返し</div>`;
    expect(地の文(差し込みつき).文).toEqual(["ms · 繰り返し"]);
    expect(地の文(差し込みつき).またぐ, "1 行の区間を複数行として数えている").toBe(0);
  });

  it("コードを地の文として拾わない (対象外の対照、#1812)", () => {
    // 改行を許すと型の指定や矢印の `>` が区間の始まりになる。 実測で入った 3 形を置く
    expect(地の文(`>\n  const x = 1;\n  const 件数 = 2;\n<`).文, "打ち終わりを含む字を拾っている").toEqual(
      [],
    );
    expect(
      地の文(`>\n  s.種類 === undefined ? (\n    s.文字\n  ) : (\n<`).文,
      "等値の比較を拾っている",
    ).toEqual([]);
    expect(
      地の文(`>\nexport function 区間のspan(\n  区間の並び: ReturnType\n<`).文,
      "関数の宣言を拾っている",
    ).toEqual([]);
    // 等号だけでは外さない (画面に出る字にも等号は出る、#1809)
    expect(地の文(`<span className="t">1 件 = 1 つの話題</span>`).文).toEqual(["1 件 = 1 つの話題"]);
  });

  it("直した字が母集団に残る (収容対照、#1812)", () => {
    // 直すと候補から消える探し方だと、直した file を 1 件も見ていないのと同じになる
    const files = 画面のfile一覧(/\.tsx$/);
    const 全文 = files.flatMap(
      (f) => 地の文(見本を外す(コメントを外す(readFileSync(f, "utf8"))).字).文,
    );
    const 該当 = 全文.filter((t) => t.includes("変えたい時は記法に posX / posY を書きます"));
    expect(該当, "英語を直した字が母集団から消えている").toHaveLength(1);
    expect(開ける英単語(該当[0]!), "直した字に開ける英語が残っている").toEqual([]);
  });

  it("残してよい語が実際に画面で使われている (#1812)", () => {
    // 使わない語を並べておくと、一覧がそのまま英語を通す抜け道になる
    const files = 画面のfile一覧(/\.tsx?$/);
    const 使った = new Set<string>();
    for (const f of files) {
      const 字 = 見本を外す(コメントを外す(readFileSync(f, "utf8"))).字;
      for (const 文 of [...引用符の文言(字), ...地の文(字).文]) {
        for (const w of 文.match(英単語) ?? []) 使った.add(w);
      }
    }
    const 使わない = Object.keys(残してよい語).filter((w) => !使った.has(w));
    expect(使わない, `残してよい語に挙げたが画面で使っていない: ${使わない.join(", ")}`).toEqual([]);
  });

  it("英語が混じる文言を拾える (植え込み対照)", () => {
    // 探し方が何にも当たらない形に壊れていると、上の 2 件は必ず通る
    const 元 = `  title="記法の側で直す"\n      <span>今の段の静止 1 こま</span>`;
    expect(引用符の文言(元).flatMap(開ける英単語)).toEqual([]);
    expect(地の文(元).文.flatMap(開ける英単語)).toEqual([]);
    const 植え = `  title="DSL 側で調整"\n      <span>現 phase の静止 1 frame</span>`;
    expect(引用符の文言(植え).flatMap(開ける英単語)).toEqual(["DSL"]);
    expect(地の文(植え).文.flatMap(開ける英単語)).toEqual(["phase", "frame"]);
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
