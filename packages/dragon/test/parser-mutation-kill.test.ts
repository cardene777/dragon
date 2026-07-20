import { describe, it, expect } from "vitest";
import { parseTextDsl } from "../src/parser";

/**
 * parser.ts mutation-kill test。
 *
 * Stryker mutation run で生存した mutant (出力値 / pos.line / error 文言 / trim /
 * tone・sub 使い分け / highlight 分割 / state・set・tween 値 / block indent 境界) を、
 * 実 DSL 入力の精密 assertion で殺す。
 * 既存 parser-branches.test.ts は「分岐に到達するか」 中心で、 到達後の出力値そのものを
 * 検証していなかったため StringLiteral→"" / ObjectLiteral→{} / trim 削除 / 値の取り違えが
 * silent survive していた。 ここでは値の正しさを直接 assert する。
 *
 * この test 追加で parser.ts の mutation score は 72.0% → 89.89% に到達した。
 * 残存 48 mutant の大半は等価 mutant (test で殺せない) だが、 「全て等価」 とは断定しない。
 * 末尾・先頭にゴミを付けた入力で観測差が出る anchor mutant (actor の ^- / tone・tween の $ 等) は
 * § regex anchor の厳格性 で個別に殺した。 残存の主な分類:
 *   - trim() 削除 (MethodExpression 16): 行 trim + splitKv の key/value trim + regex の \s* 消費が
 *     二重・三重に効くため、 内側の .trim() を消しても出力が変わらない (L68/194/195/196/257 等)
 *   - guard 条件の true 方向 (ConditionalExpression 7): `if (resolved)` 等、 条件を true 固定しても
 *     代入値が同一 or 後続の null guard が受けるため副作用が無い (L60/89/203/265/290 等)
 *   - regex quantifier / anchor の一部 (Regex 23): 行 trim 済 + `.+?` greedy backtrack で入力空間上
 *     差が観測できない位置 (kill 可能な anchor は上記 § で殺し済み、 残りは精査の上 等価と判断)
 */

function ok(src: string) {
  const r = parseTextDsl(src);
  if (!r.ok) throw new Error("parse 失敗 (成功を期待): " + JSON.stringify(r.errors));
  return r.doc;
}
function fail(src: string) {
  const r = parseTextDsl(src);
  if (r.ok) throw new Error("parse 成功したが失敗を期待");
  return r.errors;
}
function findErr(src: string, needle: string) {
  const e = fail(src).find((x) => x.message.includes(needle));
  if (!e) throw new Error(`error "${needle}" が見つからない: ${JSON.stringify(fail(src))}`);
  return e;
}

const HEAD = "タイトル: T\n種類: sequence\n登場人物:\n  - A\n  - B\n流れ:\n  1. A → B: ok";

// ── pos.line: 各 node が正しい宣言行を持つ (L48 lineNo / L160/176/226/261/285/326/341 pos ObjectLiteral) ──
describe("pos.line — 各 node の宣言行番号", () => {
  it("doc.pos.line は 1 (L160)", () => {
    expect(ok(HEAD).pos.line).toBe(1);
  });
  it("actor の pos.line は宣言行 4 / 5 (L48 lineNo, L176 pos)", () => {
    const d = ok(HEAD);
    expect(d.actors[0]!.pos.line).toBe(4);
    expect(d.actors[1]!.pos.line).toBe(5);
  });
  it("step の pos.line は宣言行 7 (L226 pos)", () => {
    expect(ok(HEAD).flow[0]!.pos.line).toBe(7);
  });
  it("state の pos.line は宣言行 9 (L261 pos)", () => {
    const d = ok(`${HEAD}\nアニメーション:\n  状態: 残高 = 100`);
    expect(d.animate!.states[0]!.pos.line).toBe(9);
  });
  it("phase の pos.line は step 宣言行 9 (L285 pos)", () => {
    const d = ok(`${HEAD}\nアニメーション:\n  ステップ「s」 1秒:`);
    expect(d.animate!.phases[0]!.pos.line).toBe(9);
  });
  it("tween / set の pos.line は sub 行 10 / 11 (L326 / L341 pos)", () => {
    const d = ok(`${HEAD}\nアニメーション:\n  ステップ「s」 1秒:\n    遷移: 残高: 100 → 90\n    切替: st: done`);
    expect(d.animate!.phases[0]!.tweens![0]!.pos.line).toBe(10);
    expect(d.animate!.phases[0]!.sets![0]!.pos.line).toBe(11);
  });
});

// ── error message / hint: 文言の精密検証 (大量の StringLiteral→"" survive を kill) ──
describe("error 文言 — message / hint", () => {
  it("未知の種類 — message + PRESET 列挙 hint (L104)", () => {
    const e = findErr("タイトル: T\n種類: bogus\n登場人物:\n  - A\n流れ:\n  1. A → A: x", "未知の種類");
    expect(e.message).toContain('未知の種類 "bogus"');
    expect(e.hint).toContain("sequence / flow / swimlane / er / state / topology");
  });
  it("タイトル欠落 — message + hint + line 1 (L146)", () => {
    const e = findErr("種類: sequence\n登場人物:\n  - A\n流れ:\n  1. A → A: x", "タイトル");
    expect(e.message).toBe("タイトル: が見つかりません");
    expect(e.hint).toContain("ファイル先頭に");
    expect(e.hint).toContain("タイトル: <名前>");
    expect(e.line).toBe(1);
  });
  it("種類欠落 — message + hint (L147)", () => {
    const e = findErr("タイトル: T\n登場人物:\n  - A\n流れ:\n  1. A → A: x", "種類");
    expect(e.message).toBe("種類: が見つかりません");
    expect(e.hint).toContain("種類: sequence");
  });
  it("登場人物欠落 — message + hint (L148)", () => {
    const e = findErr("タイトル: T\n種類: sequence\n流れ:\n  1. A → A: x", "ブロックが空");
    expect(e.message).toBe("登場人物: ブロックが空または見つかりません");
    expect(e.hint).toContain("- 名前 (種類)");
  });
  it("actor 書式エラー — message + hint (L168)", () => {
    const e = findErr("タイトル: T\n種類: sequence\n登場人物:\n  @\n流れ:\n  1. A → A: x", "書式");
    expect(e.message).toContain("登場人物の書式エラー");
    expect(e.hint).toContain("- 名前 (種類)");
  });
  it("step 書式エラー (番号なし) — message + hint (L183)", () => {
    const e = findErr("タイトル: T\n種類: sequence\n登場人物:\n  - A\n流れ:\n  A → A: x", "流れの書式");
    expect(e.message).toContain("流れの書式エラー");
    expect(e.hint).toContain("番号. <from> → <to>: <ラベル>");
  });
  it("矢印なし — message + hint (L191)", () => {
    const e = findErr("タイトル: T\n種類: sequence\n登場人物:\n  - A\n流れ:\n  1. A A ラベル", "矢印");
    expect(e.message).toContain("矢印または ラベル なし");
    expect(e.hint).toContain("<from> → <to>: <ラベル>");
  });
  it("未知 from actor — message + hint に actor 名 (L220)", () => {
    const e = findErr("タイトル: T\n種類: sequence\n登場人物:\n  - A\n流れ:\n  1. XX → A: ok", "XX");
    expect(e.message).toBe('"XX" が登場人物にいません');
    expect(e.hint).toContain('"- XX"');
    expect(e.hint).toContain("を追加");
  });
  it("未知 to actor — message + hint に actor 名 (L223)", () => {
    const e = findErr("タイトル: T\n種類: sequence\n登場人物:\n  - A\n流れ:\n  1. A → YY: ok", "YY");
    expect(e.message).toBe('"YY" が登場人物にいません');
    expect(e.hint).toContain('"- YY"');
  });
  it("状態 書式エラー — message + hint (L255)", () => {
    const e = findErr(`${HEAD}\nアニメーション:\n  状態: 残高 100`, "状態 書式");
    expect(e.message).toContain("状態 書式エラー");
    expect(e.hint).toContain("状態: <名前> = <初期値>");
  });
  it("ステップ 書式エラー — message + hint (L275)", () => {
    const e = findErr(`${HEAD}\nアニメーション:\n  ステップ 名前括弧なし 1秒:`, "ステップ 書式");
    expect(e.message).toContain("ステップ 書式エラー");
    expect(e.hint).toContain("ステップ「<名前>」 <時間>:");
  });
  it("時間 解釈不能 — message + hint (L282)", () => {
    const e = findErr(`${HEAD}\nアニメーション:\n  ステップ「送信」 ながさ:`, "時間");
    expect(e.message).toContain("時間 解釈不能");
    expect(e.hint).toContain("1.5 秒");
    expect(e.hint).toContain("1500ms");
  });
  it("遷移 書式エラー — message + hint (L318)", () => {
    const e = findErr(`${HEAD}\nアニメーション:\n  ステップ「s」 1秒:\n    遷移: 残高 100`, "遷移 書式");
    expect(e.message).toContain("遷移 書式エラー");
    expect(e.hint).toContain("遷移: <state>: <from> → <to>");
  });
  it("切替 書式エラー — message + hint (L334)", () => {
    const e = findErr(`${HEAD}\nアニメーション:\n  ステップ「s」 1秒:\n    切替: ステータス`, "切替 書式");
    expect(e.message).toContain("切替 書式エラー");
    expect(e.hint).toContain("切替: <state>: <値>");
  });
});

// ── error の line 番号 (L48 lineNo が i+1 であること) ──
describe("error.line — 発生行番号", () => {
  it("step 書式エラーの line は step 行 (6)", () => {
    const e = findErr("タイトル: T\n種類: sequence\n登場人物:\n  - A\n流れ:\n  こわれ", "流れの書式");
    expect(e.line).toBe(6);
  });
  it("未知 actor error の line は step 行", () => {
    // 1: タイトル 2: 種類 3: 登場人物 4: -A 5: 流れ 6: 1.XX→A
    const e = findErr("タイトル: T\n種類: sequence\n登場人物:\n  - A\n流れ:\n  1. XX → A: ok", "XX");
    expect(e.line).toBe(6);
  });
});

// ── tone / sub 使い分けと label 切り出し (L200/203/205/212/214 + regex) ──
describe("tone / sub — 末尾 () の解釈と label 切り出し", () => {
  it("tone alias 一致 → tone 設定 + label から () 除去 (L203/L205)", () => {
    const d = ok("タイトル: T\n種類: sequence\n登場人物:\n  - A\n  - B\n流れ:\n  1. A → B: 送信 (成功)");
    expect(d.flow[0]!.tone).toBe("success");
    expect(d.flow[0]!.label).toBe("送信");
    expect(d.flow[0]!.sub).toBeUndefined();
  });
  it("tone alias 不一致 → sub 設定 + label から () 除去 (L212/L214)", () => {
    const d = ok("タイトル: T\n種類: sequence\n登場人物:\n  - A\n  - B\n流れ:\n  1. A → B: 送信 (補足メモ)");
    expect(d.flow[0]!.tone).toBeUndefined();
    expect(d.flow[0]!.sub).toBe("補足メモ");
    expect(d.flow[0]!.label).toBe("送信");
  });
  it("() なし → tone/sub なし, label そのまま", () => {
    const d = ok("タイトル: T\n種類: sequence\n登場人物:\n  - A\n  - B\n流れ:\n  1. A → B: ただの送信");
    expect(d.flow[0]!.label).toBe("ただの送信");
    expect(d.flow[0]!.tone).toBeUndefined();
    expect(d.flow[0]!.sub).toBeUndefined();
  });
});

// ── from / to / label の trim と値 (L194/L196 trim, L189 arrow regex) ──
describe("step から / へ / ラベル の切り出し", () => {
  it("from の先頭空白は trim される (L194)", () => {
    const d = ok("タイトル: T\n種類: sequence\n登場人物:\n  - A\n  - B\n流れ:\n  1.    A → B: x");
    expect(d.flow[0]!.from).toBe("A");
  });
  it("label 末尾空白は trim される (L196)", () => {
    const d = ok("タイトル: T\n種類: sequence\n登場人物:\n  - A\n  - B\n流れ:\n  1. A → B: 送信内容   ");
    expect(d.flow[0]!.label).toBe("送信内容");
  });
  it("from / to / label が正しく分割される", () => {
    const d = ok("タイトル: T\n種類: sequence\n登場人物:\n  - A\n  - B\n流れ:\n  1. A → B: こんにちは");
    expect(d.flow[0]!.from).toBe("A");
    expect(d.flow[0]!.to).toBe("B");
    expect(d.flow[0]!.label).toBe("こんにちは");
  });
});

// ── step 番号 parse (L181 regex + parseInt) ──
describe("step 番号", () => {
  it("2 桁番号を number で保持 (L181 \\d+)", () => {
    const d = ok("タイトル: T\n種類: sequence\n登場人物:\n  - A\n  - B\n流れ:\n  12. A → B: x");
    expect(d.flow[0]!.no).toBe(12);
  });
  it("番号で始まらない行は書式エラー (L181 ^ アンカー)", () => {
    // 途中に数字がある非番号始まり行を step 化しない
    const errors = fail("タイトル: T\n種類: sequence\n登場人物:\n  - A\n  - B\n流れ:\n  x 5. A → B: y");
    expect(errors.some((e) => e.message.includes("流れの書式"))).toBe(true);
  });
});

// ── actor kind alias 解決 (L171/172 paren 有無, L173 NODE_KIND_ALIAS) ──
describe("actor kind — alias 解決と default", () => {
  it("paren なし → default kind actor (L172)", () => {
    const d = ok("タイトル: T\n種類: sequence\n登場人物:\n  - A\n流れ:\n  1. A → A: x");
    expect(d.actors[0]!.kind).toBe("actor");
    expect(d.actors[0]!.name).toBe("A");
  });
  it("paren 日本語 alias → 解決した kind (L173)", () => {
    const d = ok("タイトル: T\n種類: sequence\n登場人物:\n  - DB (ストレージ)\n流れ:\n  1. DB → DB: x");
    expect(d.actors[0]!.kind).toBe("storage");
  });
  it("paren 英語そのまま → その kind", () => {
    const d = ok("タイトル: T\n種類: sequence\n登場人物:\n  - S (service)\n流れ:\n  1. S → S: x");
    expect(d.actors[0]!.kind).toBe("service");
  });
});

// ── state initial の型変換 (L253 regex, L257 name trim, L259 isNaN/parseFloat, L260 quote strip) ──
describe("state initial — 型変換と引用符除去", () => {
  it("数値 initial は number (L259)", () => {
    const d = ok(`${HEAD}\nアニメーション:\n  状態: 残高 = 100`);
    expect(d.animate!.states[0]!.name).toBe("残高");
    expect(d.animate!.states[0]!.initial).toBe(100);
  });
  it("文字列 initial は引用符除去した string (L260)", () => {
    const d = ok(`${HEAD}\nアニメーション:\n  状態: st = "待機中"`);
    expect(d.animate!.states[0]!.initial).toBe("待機中");
  });
  it("state 名の前後空白は trim (L257)", () => {
    const d = ok(`${HEAD}\nアニメーション:\n  状態:  残高  = 100`);
    expect(d.animate!.states[0]!.name).toBe("残高");
  });
});

// ── set value 型変換 (L332 regex, L337 state trim, L339 isNaN/parseFloat) ──
describe("set — state / value の切り出しと型", () => {
  it("数値 value は number (L339)", () => {
    const d = ok(`${HEAD}\nアニメーション:\n  ステップ「s」 1秒:\n    切替: cnt: 42`);
    expect(d.animate!.phases[0]!.sets![0]!.state).toBe("cnt");
    expect(d.animate!.phases[0]!.sets![0]!.value).toBe(42);
  });
  it("文字列 value は string", () => {
    const d = ok(`${HEAD}\nアニメーション:\n  ステップ「s」 1秒:\n    切替: status: 完了`);
    expect(d.animate!.phases[0]!.sets![0]!.value).toBe("完了");
  });
});

// ── tween from / to (L316 regex, L322-327 parseFloat) ──
describe("tween — state / from / to", () => {
  it("from / to を number で保持 (L316)", () => {
    const d = ok(`${HEAD}\nアニメーション:\n  ステップ「s」 1秒:\n    遷移: 残高: 100 → 90`);
    const tw = d.animate!.phases[0]!.tweens![0]!;
    expect(tw.state).toBe("残高");
    expect(tw.from).toBe(100);
    expect(tw.to).toBe(90);
  });
  it("小数 tween も保持", () => {
    const d = ok(`${HEAD}\nアニメーション:\n  ステップ「s」 1秒:\n    遷移: v: 1.5 → 0.25`);
    const tw = d.animate!.phases[0]!.tweens![0]!;
    expect(tw.from).toBe(1.5);
    expect(tw.to).toBe(0.25);
  });
});

// ── highlight 分割 (L310 split/map trim/filter Boolean) ──
describe("highlight — カンマ分割 + trim + 空要素除去", () => {
  it("カンマ分割 + 各要素 trim + 空要素除去 (L310)", () => {
    const d = ok(`${HEAD}\nアニメーション:\n  ステップ「s」 1秒:\n    強調: A , B ,, C`);
    expect(d.animate!.phases[0]!.highlight).toEqual(["A", "B", "C"]);
  });
  it("単一要素 highlight", () => {
    const d = ok(`${HEAD}\nアニメーション:\n  ステップ「s」 1秒:\n    強調: OnlyOne`);
    expect(d.animate!.phases[0]!.highlight).toEqual(["OnlyOne"]);
  });
});

// ── body / badge の値保持と未知 sub の無視 (L344/L348 cond + 値) ──
describe("body / badge / 未知 sub", () => {
  it("body / badge の値を保持 (L345/L348)", () => {
    const d = ok(`${HEAD}\nアニメーション:\n  ステップ「s」 1秒:\n    説明: これは説明\n    バッジ: NEW`);
    expect(d.animate!.phases[0]!.body).toBe("これは説明");
    expect(d.animate!.phases[0]!.badge).toBe("NEW");
  });
  it("未知 sub 行は badge を設定しない (L348 cond)", () => {
    const d = ok(`${HEAD}\nアニメーション:\n  ステップ「s」 1秒:\n    未知キー: 値`);
    expect(d.animate!.phases[0]!.badge).toBeUndefined();
    expect(d.animate!.phases[0]!.body).toBeUndefined();
  });
});

// ── block indent 境界: EOF まで読む (L113/L124 の while 条件) + tab indent (L34) ──
describe("block indent 境界", () => {
  it("actor block が EOF まで続く (流れ省略, L113 境界)", () => {
    const d = ok("タイトル: T\n種類: sequence\n登場人物:\n  - A\n  - B");
    expect(d.actors.length).toBe(2);
    expect(d.flow.length).toBe(0);
  });
  it("flow block が EOF まで続く (L124 境界)", () => {
    const d = ok("タイトル: T\n種類: sequence\n登場人物:\n  - A\n流れ:\n  1. A → A: x\n  2. A → A: y");
    expect(d.flow.length).toBe(2);
    expect(d.flow[1]!.no).toBe(2);
  });
  it("tab indent の actor block を読む (L34 tab カウント)", () => {
    const d = ok("タイトル: T\n種類: sequence\n登場人物:\n\t- A\n\t- B");
    expect(d.actors.length).toBe(2);
  });
});

// ── 空白なし記法でも parse (regex の \s* → \s / \s* → 削除 系 mutant kill) ──
describe("空白なし記法", () => {
  it("番号 . 矢印 コロン すべて空白なし 1.A→B:ok (L181/L189)", () => {
    const d = ok("タイトル: T\n種類: sequence\n登場人物:\n  - A\n  - B\n流れ:\n  1.A→B:ok");
    expect(d.flow[0]!.no).toBe(1);
    expect(d.flow[0]!.from).toBe("A");
    expect(d.flow[0]!.to).toBe("B");
    expect(d.flow[0]!.label).toBe("ok");
  });
  it("tone 括弧 空白なし 送信(成功) (L200)", () => {
    const d = ok("タイトル: T\n種類: sequence\n登場人物:\n  - A\n  - B\n流れ:\n  1. A → B: 送信(成功)");
    expect(d.flow[0]!.tone).toBe("success");
    expect(d.flow[0]!.label).toBe("送信");
  });
  it("state = 前後空白なし x=100 (L253)", () => {
    const d = ok(`${HEAD}\nアニメーション:\n  状態: x=100`);
    expect(d.animate!.states[0]!.name).toBe("x");
    expect(d.animate!.states[0]!.initial).toBe(100);
  });
  it("tween : と → 前後空白なし v:100→90 (L316)", () => {
    const d = ok(`${HEAD}\nアニメーション:\n  ステップ「s」 1秒:\n    遷移: v:100→90`);
    const tw = d.animate!.phases[0]!.tweens![0]!;
    expect(tw.state).toBe("v");
    expect(tw.from).toBe(100);
    expect(tw.to).toBe(90);
  });
  it("set : 前後空白なし st:done (L332)", () => {
    const d = ok(`${HEAD}\nアニメーション:\n  ステップ「s」 1秒:\n    切替: st:done`);
    expect(d.animate!.phases[0]!.sets![0]!.state).toBe("st");
    expect(d.animate!.phases[0]!.sets![0]!.value).toBe("done");
  });
  it("ステップ名 括弧直後に時間 空白最小 「s」1秒 (L273)", () => {
    const d = ok(`${HEAD}\nアニメーション:\n  ステップ「送信」1500ms:`);
    expect(d.animate!.phases[0]!.name).toBe("送信");
    expect(d.animate!.phases[0]!.durationMs).toBe(1500);
  });
});

// ── regex anchor (^ / $) を末尾・先頭ゴミ入力で kill (L66 ^- / L200 $ / L316 $) ──
describe("regex anchor の厳格性", () => {
  it("actor 行は先頭が - で始まらないと書式エラー (L66 ^ アンカー)", () => {
    // "x - A" は途中に - があるが先頭が - でない → 書式エラーであるべき (name="A" にしない)
    const errors = fail("タイトル: T\n種類: sequence\n登場人物:\n  x - A\n流れ:\n  1. A → A: x");
    expect(errors.some((e) => e.message.includes("登場人物の書式"))).toBe(true);
  });
  it("tone () の後ろにゴミがあれば tone 扱いしない (L200 $ アンカー)", () => {
    const d = ok("タイトル: T\n種類: sequence\n登場人物:\n  - A\n  - B\n流れ:\n  1. A → B: 送信 (成功) 余分");
    expect(d.flow[0]!.tone).toBeUndefined();
    expect(d.flow[0]!.label).toContain("(成功)");
  });
  it("tween の数値の後ろにゴミがあれば書式エラー (L316 $ アンカー)", () => {
    const errors = fail(`${HEAD}\nアニメーション:\n  ステップ「s」 1秒:\n    遷移: v:100→90x`);
    expect(errors.some((e) => e.message.includes("遷移 書式"))).toBe(true);
  });
  it("複数文字の from / to を正しく分割 (L189 .+?)", () => {
    const d = ok("タイトル: T\n種類: sequence\n登場人物:\n  - AB\n  - CD\n流れ:\n  1. AB → CD: msg");
    expect(d.flow[0]!.from).toBe("AB");
    expect(d.flow[0]!.to).toBe("CD");
    expect(d.flow[0]!.label).toBe("msg");
  });
  it("日本語 state 名も保持 (L253 name capture)", () => {
    const d = ok(`${HEAD}\nアニメーション:\n  状態: 残高=100`);
    expect(d.animate!.states[0]!.name).toBe("残高");
    expect(d.animate!.states[0]!.initial).toBe(100);
  });
});

// ── コメント除去 (L43 regex): # 以降を除去 + indent は # 前の空白基準 ──
describe("コメント除去", () => {
  it("行末 # コメントを除去 (L43)", () => {
    const d = ok("タイトル: T # これは題名\n種類: sequence\n登場人物:\n  - A\n流れ:\n  1. A → A: x");
    expect(d.title).toBe("T");
  });
  it("長いコメントも全て除去 (L43 .* アンカー)", () => {
    const d = ok("タイトル: MyTitle # very long trailing comment with many words here\n種類: sequence\n登場人物:\n  - A\n流れ:\n  1. A → A: x");
    expect(d.title).toBe("MyTitle");
  });
  it("空白なしで # 直結のコメントも除去 (L43 \\s* → \\s)", () => {
    const d = ok("タイトル: X#すぐコメント\n種類: sequence\n登場人物:\n  - A\n流れ:\n  1. A → A: x");
    expect(d.title).toBe("X");
  });
});

// ── splitKv 境界 (L60 idx<0, L61 key trim) ──
describe("header key: value の分割", () => {
  it("値なしヘッダーでも key は解決される", () => {
    // "タイトル:" のみ (値空) → title = "" だが header 判定は通る
    const r = parseTextDsl("タイトル:\n種類: sequence\n登場人物:\n  - A\n流れ:\n  1. A → A: x");
    // title が空文字なので必須チェックで error (title falsy)
    expect(r.ok).toBe(false);
  });
});

// ── 正常な full DSL の end-to-end 値 (総合 sanity) ──
describe("full DSL 総合", () => {
  it("title / type / actors / flow / animate を全て保持", () => {
    const d = ok(HEAD);
    expect(d.title).toBe("T");
    expect(d.type).toBe("sequence");
    expect(d.actors.map((a) => a.name)).toEqual(["A", "B"]);
    expect(d.flow[0]!.from).toBe("A");
    expect(d.flow[0]!.to).toBe("B");
    expect(d.flow[0]!.label).toBe("ok");
    expect(d.flow[0]!.no).toBe(1);
  });
  it("type は小文字化される (L100/L107 toLowerCase)", () => {
    const d = ok("タイトル: T\n種類: SEQUENCE\n登場人物:\n  - A\n流れ:\n  1. A → A: x");
    expect(d.type).toBe("sequence");
  });
});

// ── 未知 top-level 行の skip (L142 index++, L93 kv&&indent, L133 header 分岐) ──
describe("未知 top-level 行の skip", () => {
  it("先頭の未知行 (: なし) を skip して正常 parse (L142/L93)", () => {
    const d = ok("これは不明な行です\nタイトル: T\n種類: sequence\n登場人物:\n  - A\n流れ:\n  1. A → A: x");
    expect(d.title).toBe("T");
    expect(d.actors.length).toBe(1);
  });
  it("未知 header (: ありだが未知キー) を skip (L133 animate 分岐)", () => {
    const d = ok("謎キー: 値\nタイトル: T\n種類: sequence\n登場人物:\n  - A\n流れ:\n  1. A → A: x");
    expect(d.title).toBe("T");
    expect(d.actors.length).toBe(1);
    expect(d.animate).toBeUndefined();
  });
});

// ── block 内の空行 skip (L89 actor, L125 flow, L239 animate) ──
describe("block 内の空行を skip", () => {
  it("actor block 内の空行を挟んでも有効 actor のみ読む (L89)", () => {
    const d = ok("タイトル: T\n種類: sequence\n登場人物:\n  - A\n\n  - B\n流れ:\n  1. A → B: x");
    expect(d.actors.map((a) => a.name)).toEqual(["A", "B"]);
  });
  it("flow block 内の空行を挟んでも全 step 読む (L125)", () => {
    const d = ok("タイトル: T\n種類: sequence\n登場人物:\n  - A\n流れ:\n  1. A → A: x\n\n  2. A → A: y");
    expect(d.flow.length).toBe(2);
    expect(d.flow[1]!.no).toBe(2);
  });
  it("animate block 内の空行を挟んでも state / phase 読む (L239)", () => {
    const d = ok(`${HEAD}\nアニメーション:\n\n  状態: 残高 = 100\n\n  ステップ「s」 1秒:`);
    expect(d.animate!.states.length).toBe(1);
    expect(d.animate!.phases.length).toBe(1);
  });
});

// ── phase sub-line の indent 境界 (L289 > phaseBaseIndent) ──
describe("phase sub-line の indent 境界", () => {
  it("phase と同 indent の行は sub でなく animate 直下扱い (L289 境界)", () => {
    // ステップ indent 2, 強調 indent 4 (sub), 状態 indent 2 (animate 直下 state)
    const d = ok(`${HEAD}\nアニメーション:\n  ステップ「s」 1秒:\n    強調: A\n  状態: x = 1`);
    expect(d.animate!.phases[0]!.highlight).toEqual(["A"]);
    expect(d.animate!.states.length).toBe(1);
    expect(d.animate!.states[0]!.name).toBe("x");
  });
  it("phase sub-line が複数行 (深い indent で連続)", () => {
    const d = ok(`${HEAD}\nアニメーション:\n  ステップ「s」 1秒:\n    強調: A\n    説明: 本文\n    バッジ: B`);
    const p = d.animate!.phases[0]!;
    expect(p.highlight).toEqual(["A"]);
    expect(p.body).toBe("本文");
    expect(p.badge).toBe("B");
  });
});

// ── animate の pos.line と block 内の非 kv 行 skip (L234 pos, L299 index++, L307 applyPhaseSubLine) ──
describe("animate pos と 非 kv 行の skip", () => {
  it("animate.pos.line は先頭 content 行 (L234 pos + startIdx+1)", () => {
    // HEAD 7 行 → アニメーション 8 行目 → content 開始 9 行目
    const d = ok(`${HEAD}\nアニメーション:\n  状態: 残高 = 100`);
    expect(d.animate!.pos.line).toBe(9);
  });
  it("animate block 内の非 kv 行 (コロンなし) を skip (L299 index++)", () => {
    const d = ok(`${HEAD}\nアニメーション:\n  状態: 残高 = 100\n  ただのメモ`);
    expect(d.animate!.states.length).toBe(1);
    expect(d.animate!.states[0]!.name).toBe("残高");
  });
  it("phase sub-line の非 kv 行 (コロンなし) を skip (L307 !kv return)", () => {
    const d = ok(`${HEAD}\nアニメーション:\n  ステップ「s」 1秒:\n    強調: A\n    メモだけ`);
    expect(d.animate!.phases[0]!.highlight).toEqual(["A"]);
  });
});

// ── animate ブロックの終端 (indent 0 で top-level 復帰) (L241 break) ──
describe("animate ブロックの終端", () => {
  it("animate の後に来る top-level header を再解釈する (L241 break)", () => {
    // アニメーション を 流れ より前に置く。 L241 の break が無いと 流れ: が animate に
    // 飲み込まれて step が 0 になる。
    const src =
      "タイトル: T\n種類: sequence\n登場人物:\n  - A\n  - B\n" +
      "アニメーション:\n  ステップ「s」 1秒:\n    強調: A\n" +
      "流れ:\n  1. A → B: x";
    const d = ok(src);
    expect(d.animate!.phases.length).toBe(1);
    expect(d.flow.length).toBe(1);
    expect(d.flow[0]!.from).toBe("A");
  });
});
