// @vitest-environment jsdom

/**
 * 図に重ねる段の表示の検査 (#1239)。
 *
 * `#1143` でエディタに作った表示を、画面をまたげる部品へ出した時に足した。 エディタ側の
 * 振る舞い (実画面での見え方 / 掴んで動かせるか) は `tests/editor-phase-chrome.spec.ts` が
 * 実ブラウザで見る。 こちらは **部品単体の判断** を固定する。
 *
 * | 見るもの | なぜ |
 * |---|---|
 * | 段が 1 つ以下なら何も出さない | 進み具合を示す先が無い。 出すと 1/1 の帯が常に満杯で意味を持たない |
 * | 札の中身が「今 / 全体 · 題」 | 設計 (`app.pen`) が描いている形。 数だけだとどの段か分からない |
 * | 帯が段の数だけ区切られ、過ぎた段だけ塗られる | 区切り数を実装が別途計算すると段が増えた時にずれる |
 * | 寄せる側が引数で変わる | 設計は画面ごとに左右を描き分けている |
 * | 段が進むと追随する | engine は React の外で属性を書き換えるので、見張りが効いているかを見る |
 */
import { afterEach, describe, it, expect } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import type { CdlPhase } from "@cardenelabs/cdl";
import { LocaleProvider } from "@/lib/useLocale";
import { PhaseChrome, PhaseNote, 段の呼び名 } from "./PhaseChrome";

afterEach(() => cleanup());

/** 検査に要る 3 field だけを持つ段。 残りは engine 側の都合で本部品は読まない */
function 段(id: string, title: string, duration = 1000): CdlPhase {
  return { id, title, duration, body: "", activate: [], tweens: [], sets: [] };
}

/** engine が属性を書く入れ物を作る。 `stage` はその親 */
function 舞台を作る(index = 0): HTMLElement {
  const stage = document.createElement("div");
  const inner = document.createElement("div");
  inner.setAttribute("data-cdl-diagram", "");
  inner.setAttribute("data-cdl-phase-index", String(index));
  stage.appendChild(inner);
  document.body.appendChild(stage);
  return stage;
}

describe("段の数で出すか決める (#1239)", () => {
  it("段が 0 なら何も出さない", () => {
    render(<PhaseChrome stage={null} phases={[]} />);
    expect(document.querySelector(".cdl-phase")).toBeNull();
  });

  it("段が 1 つでも何も出さない", () => {
    render(<PhaseChrome stage={null} phases={[段("p1", "だけ")]} />);
    expect(document.querySelector(".cdl-phase")).toBeNull();
  });

  it("段が 2 つ以上なら出す (陰性対照)", () => {
    // 上 2 件が「元から出ない」 のではなく、段の数で分かれていることを示す
    render(<PhaseChrome stage={null} phases={[段("p1", "一"), 段("p2", "二")]} />);
    expect(document.querySelector(".cdl-phase")).not.toBeNull();
  });

  it("段が未定義でも落ちない", () => {
    render(<PhaseChrome stage={null} phases={undefined} />);
    expect(document.querySelector(".cdl-phase")).toBeNull();
  });
});

describe("札と帯の中身 (#1239)", () => {
  it("札に今の段と全体の数と題が出る", () => {
    render(<PhaseChrome stage={null} phases={[段("p1", "受付"), 段("p2", "検査"), 段("p3", "完了")]} />);
    const chip = document.querySelector(".cdl-phase-chip");
    expect(chip?.textContent).toContain(`${段の呼び名} 1 / 3`);
    expect(chip?.textContent).toContain("受付");
  });

  it("題が空なら題だけ出さない", () => {
    render(<PhaseChrome stage={null} phases={[段("p1", ""), 段("p2", "二")]} />);
    expect(document.querySelector(".cdl-phase-title")).toBeNull();
    expect(document.querySelector(".cdl-phase-chip")?.textContent).toContain(`${段の呼び名} 1 / 2`);
  });

  it("帯は段の数だけ区切られる", () => {
    render(<PhaseChrome stage={null} phases={[段("p1", "一"), 段("p2", "二"), 段("p3", "三"), 段("p4", "四")]} />);
    expect(document.querySelectorAll(".cdl-phase-seg")).toHaveLength(4);
  });

  it("過ぎた段だけ塗られる", () => {
    render(<PhaseChrome stage={null} phases={[段("p1", "一"), 段("p2", "二"), 段("p3", "三")]} />);
    const segs = [...document.querySelectorAll(".cdl-phase-seg")];
    // 0 段目なので 1 本目だけ塗られる
    expect(segs.map((s) => s.className.includes("is-done"))).toEqual([true, false, false]);
  });

  it("段の長さが出る", () => {
    render(<PhaseChrome stage={null} phases={[段("p1", "一", 1500), 段("p2", "二")]} />);
    expect(document.querySelector(".cdl-phase-meta")?.textContent).toBe("1500ms · 繰り返し");
  });
});

describe("寄せる側 (#1239)", () => {
  it("既定は左", () => {
    render(<PhaseChrome stage={null} phases={[段("p1", "一"), 段("p2", "二")]} />);
    expect(document.querySelector(".cdl-phase-chip")?.className).toContain("is-left");
  });

  it("右を渡すと右に寄る", () => {
    render(<PhaseChrome stage={null} phases={[段("p1", "一"), 段("p2", "二")]} align="right" />);
    const cls = document.querySelector(".cdl-phase-chip")?.className ?? "";
    expect(cls).toContain("is-right");
    // 陰性対照。 両方付いていると CSS が後勝ちで決まり、引数が効いていないのと区別できない
    expect(cls).not.toContain("is-left");
  });
});

describe("段の進行に追随する (#1239)", () => {
  it("属性が変わると札と帯が追随する", async () => {
    const stage = 舞台を作る(0);
    render(<PhaseChrome stage={stage} phases={[段("p1", "受付"), 段("p2", "検査"), 段("p3", "完了")]} />);
    expect(document.querySelector(".cdl-phase-chip")?.textContent).toContain(`${段の呼び名} 1 / 3`);

    // engine と同じく React の外で属性を書き換える
    await act(async () => {
      stage.querySelector("[data-cdl-diagram]")?.setAttribute("data-cdl-phase-index", "2");
      // MutationObserver は microtask で届く
      await Promise.resolve();
    });

    expect(document.querySelector(".cdl-phase-chip")?.textContent).toContain(`${段の呼び名} 3 / 3`);
    const segs = [...document.querySelectorAll(".cdl-phase-seg")];
    expect(segs.map((s) => s.className.includes("is-done"))).toEqual([true, true, true]);
  });

  it("段の数を超えた属性は最後の段に丸める", async () => {
    // 図を差し替えた直後、属性が配列より先に更新される瞬間がある。 範囲外を読むと
    // 題名と長さが undefined になる
    const stage = 舞台を作る(0);
    render(<PhaseChrome stage={stage} phases={[段("p1", "一"), 段("p2", "二")]} />);

    await act(async () => {
      stage.querySelector("[data-cdl-diagram]")?.setAttribute("data-cdl-phase-index", "99");
      await Promise.resolve();
    });

    expect(document.querySelector(".cdl-phase-chip")?.textContent).toContain(`${段の呼び名} 2 / 2`);
  });

  it("数でない属性は 0 段目に倒す", async () => {
    const stage = 舞台を作る(1);
    render(<PhaseChrome stage={stage} phases={[段("p1", "一"), 段("p2", "二")]} />);

    await act(async () => {
      stage.querySelector("[data-cdl-diagram]")?.setAttribute("data-cdl-phase-index", "なにか");
      await Promise.resolve();
    });

    expect(document.querySelector(".cdl-phase-chip")?.textContent).toContain(`${段の呼び名} 1 / 2`);
  });
});

describe("画面に出す形 (#1239)", () => {
  it("重ねたものはマウスを受け取らない印を持つ", () => {
    // エディタの舞台はここを掴んで動かす。 受け取ると掴めなくなる
    render(<PhaseChrome stage={null} phases={[段("p1", "一"), 段("p2", "二")]} />);
    expect(document.querySelector(".cdl-phase")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("読み上げから外す", () => {
    // 段は 1 秒ごとに変わる。 読み上げに載せると図の説明が流れ続けて読めなくなる
    render(<PhaseChrome stage={null} phases={[段("p1", "一"), 段("p2", "二")]} />);
    expect(screen.queryByText(new RegExp(`${段の呼び名} 1 / 2`))?.closest("[aria-hidden='true']")).not.toBeNull();
  });
});

/**
 * 段の説明を図の枠の外に出す (#2609)。
 *
 * 説明はこれまで「コード」 のタブにしか出ていなかった。 いま光っている線が何を表すかを
 * 書いた文なので、図を見ている間に読めないと意味が薄れる。
 *
 * | 見るもの | なぜ |
 * |---|---|
 * | いま光っている段の説明だけが見える | 別の段の説明が見えると、絵と文が食い違う |
 * | 段が進むと入れ替わる | engine は React の外で属性を書き換える |
 * | 全ての説明を升に重ねる | 高さが最も長い説明で決まり、段が進んでも図の下が動かない |
 * | 1 つも説明が無ければ何も出さない | 空の隙間だけが残る |
 * | 英語では出さない | 説明は日本語の 1 本しか無く、段の題と同じ決まりで日本語へ落とさない |
 * | 重ね表示の中に入れない | 中に入れると図の描画領域を削る |
 */
describe("段の説明を枠の外に出す (#2609)", () => {
  /** 説明を持つ段。 上の `段()` は説明を空で作るので、こちらで足す */
  const 説明付き = (id: string, title: string, body: string): CdlPhase => ({
    ...段(id, title),
    body,
  });

  /** いま見えている説明。 重ねた升のうち `data-now` が付いた 1 つだけが見える */
  const 見えている説明 = (): string | null =>
    document.querySelector(".cdl-phase-note-line[data-now]")?.textContent ?? null;

  it("いま光っている段の説明だけが見える", () => {
    const stage = 舞台を作る(1);
    render(
      <PhaseNote
        stage={stage}
        phases={[説明付き("p1", "一", "はじめの説明"), 説明付き("p2", "二", "つぎの説明")]}
      />,
    );
    expect(見えている説明()).toBe("つぎの説明");
    // 見えていないほうは升に残る = 高さを決めるため
    expect(document.querySelectorAll(".cdl-phase-note-line")).toHaveLength(2);
  });

  it("段が進むと入れ替わる", async () => {
    const stage = 舞台を作る(0);
    render(
      <PhaseNote
        stage={stage}
        phases={[説明付き("p1", "一", "はじめの説明"), 説明付き("p2", "二", "つぎの説明")]}
      />,
    );
    expect(見えている説明()).toBe("はじめの説明");

    // engine と同じく React の外で属性を書き換える
    await act(async () => {
      stage.querySelector("[data-cdl-diagram]")?.setAttribute("data-cdl-phase-index", "1");
      // MutationObserver は microtask で届く
      await Promise.resolve();
    });
    expect(見えている説明()).toBe("つぎの説明");
  });

  it("説明の長さが変わっても升の数は段の数のまま", () => {
    // 高さを最も長い説明で決めるための升。 数が段と食い違うと高さが動く
    render(
      <PhaseNote
        stage={舞台を作る(0)}
        phases={[
          説明付き("p1", "一", "短い"),
          説明付き("p2", "二", "とても長い説明をここに書く。 二文目もある。"),
          説明付き("p3", "三", "中くらいの説明"),
        ]}
      />,
    );
    expect(document.querySelectorAll(".cdl-phase-note-line")).toHaveLength(3);
    expect(document.querySelectorAll(".cdl-phase-note-line[data-now]")).toHaveLength(1);
  });

  it("1 つも説明が無ければ何も出さない", () => {
    render(<PhaseNote stage={舞台を作る(0)} phases={[段("p1", "一"), 段("p2", "二")]} />);
    expect(document.querySelector(".cdl-phase-note")).toBeNull();
  });

  it("段が 1 つ以下なら何も出さない", () => {
    render(<PhaseNote stage={null} phases={[説明付き("p1", "だけ", "ある説明")]} />);
    expect(document.querySelector(".cdl-phase-note")).toBeNull();
  });

  it("英語では出さない", () => {
    render(
      <LocaleProvider 初期値="en">
        <PhaseNote
          stage={舞台を作る(0)}
          phases={[説明付き("p1", "一", "はじめの説明"), 説明付き("p2", "二", "つぎの説明")]}
        />
      </LocaleProvider>,
    );
    expect(document.querySelector(".cdl-phase-note")).toBeNull();
  });

  it("日本語では出す (陰性対照)", () => {
    // 上の 1 件が「元から出ない」 のではなく、言語で分かれていることを示す
    render(
      <LocaleProvider 初期値="ja">
        <PhaseNote
          stage={舞台を作る(0)}
          phases={[説明付き("p1", "一", "はじめの説明"), 説明付き("p2", "二", "つぎの説明")]}
        />
      </LocaleProvider>,
    );
    expect(document.querySelector(".cdl-phase-note")).not.toBeNull();
  });

  it("重ね表示の中に入らない", () => {
    // 中に入れると図の描画領域を削る。 枠の外に出ていることを親子関係で見る
    render(
      <div>
        <PhaseChrome stage={null} phases={[段("p1", "一"), 段("p2", "二")]} />
        <PhaseNote
          stage={舞台を作る(0)}
          phases={[説明付き("p1", "一", "はじめの説明"), 説明付き("p2", "二", "つぎの説明")]}
        />
      </div>,
    );
    const 説明 = document.querySelector(".cdl-phase-note");
    expect(説明).not.toBeNull();
    expect(説明?.closest(".cdl-phase")).toBeNull();
  });
});
