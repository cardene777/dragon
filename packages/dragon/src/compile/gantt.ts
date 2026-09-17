import { diagram } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import type { DslDocument } from "../types";

import { actorRefTable } from "./actors";
import { 書いた多重度を読む } from "./er-relation";
import type { CompileNotice } from "./notice";
import { slugify } from "./slug";
import { 箱の題 } from "./node-title";
import { truncateForMessage, 図の小見出し } from "./subtitle";
/**
 * 工程表 (`type: gantt`) の組み立て (#2030 で `compile.ts` から移した)。
 */

export function compileGantt(doc: DslDocument, onNotice?: (n: CompileNotice) => void): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title, type: "gantt" });
  const CHART_W = 720;
  b.lane("gantt", { width: CHART_W });

  /**
   * 書いたのに効かない形を伝える。 **`console.warn` だけにしない** (#2111) = 編集画面は知らせだけを
   * 画面に出すため、log だけだと書いている人に理由が見えない。 値の図 (`value-chart.ts`) と同じ形
   */
  const 伝える = (種類: CompileNotice["kind"], 名前: string, message: string, line = 0): void => {
    onNotice?.({ kind: 種類, actor: 名前, line, message });
    if (typeof console !== "undefined" && console.warn) console.warn(`[dragon] ${message}`);
  };

  // 目盛りは **書かれた順** に並べる。 以前は `Q1=200 / Q2=600 / ...` の決め打ちで、 Q1-Q4 以外は
  // 全て同じ位置に落ちていた。 順に並べれば月名でも週番号でも同じ規則で置ける
  const 目盛り: string[] = [];
  const 目盛りなし: string[] = [];
  // 最初に時期を読めなかった項目の行。 画面が案内できるようにする (値の図と同じ)
  let 目盛りなし行 = 0;
  const タスク: {
    name: string;
    title: string;
    label: string;
    line: number;
    tone?: DslDocument["actors"][number]["tone"];
    owner?: string;
    end?: string;
  }[] = [];
  for (const a of doc.actors) {
    const label = (a.value ?? a.subtitle ?? "").trim();
    if (label === "") {
      if (目盛りなし.length === 0) 目盛りなし行 = a.pos?.line ?? 0;
      目盛りなし.push(a.name);
      continue;
    }
    if (!目盛り.includes(label)) 目盛り.push(label);
    // 色は帯にそのまま渡す。 箱が 1 つになっても、 書いた色が消えないようにする
    タスク.push({
      name: a.name,
      title: 箱の題(a),
      label,
      line: a.pos?.line ?? 0,
      ...(a.tone !== undefined ? { tone: a.tone } : {}),
      ...(a.owner !== undefined ? { owner: a.owner } : {}),
      ...(a.end !== undefined ? { end: a.end } : {}),
    });
  }
  if (目盛りなし.length > 0) {
    伝える(
      "chart-value-unreadable",
      目盛りなし[0]!,
      `type: gantt で時期を読めない項目があります (帯に載せません): ${目盛りなし.join(", ")}。` +
        ` \`- 設計: "Q1"\` の形で書いてください`,
      目盛りなし行,
    );
  }

  // 矢印は依存として読む (`- 設計 -> 実装` = 実装は設計の後)。 帯どうしを結ぶ線は描画側が
  // 依存として描くので、 書いた矢印を捨てずに使う
  const タスク名 = new Set(タスク.map((t) => t.name));
  // 矢印の端の名前を引く表。 全ての図種に共通の「居ない名前」 の知らせと同じ表を使う
  const 名前の表 = actorRefTable(doc);
  const 依存元 = new Map<string, string>();
  for (const s of doc.flow) {
    const line = s.pos?.line ?? 0;
    const 矢印 = `${truncateForMessage(s.from)} -> ${truncateForMessage(s.to)}`;
    if (!タスク名.has(s.from) || !タスク名.has(s.to)) {
      // `actors` に居ない名前を指す矢印は、全ての図種に共通の知らせ (`flow-actor-missing`) が
      // 書いた行で伝えている。 ここでも伝えると同じ行に 2 件並ぶ (#2111)
      if (!名前の表.has(s.from) || !名前の表.has(s.to)) continue;
      const 時期なし = [s.from, s.to].filter((n) => !タスク名.has(n)).map(truncateForMessage);
      伝える(
        "chart-edge-dropped",
        s.from,
        `type: gantt で ${矢印} の依存を結べません (${時期なし.join(" / ")} に時期がありません)`,
        line,
      );
      continue;
    }
    依存元.set(s.to, s.from);
    // 帯の依存は「どちらが先か」 だけを持つ。 矢印に書いた文字や色は描けないので伝える。
    // 多重度もここに含める = 多重度の知らせ (#2107) と同じ行に 2 件並べない
    const 効かない = [
      (s.label ?? "") !== "" || (s.sub ?? "") !== "" ? "文字" : "",
      s.tone !== undefined ? "色" : "",
      s.style !== undefined ? "線種" : "",
      書いた多重度を読む(s.cardinality) !== undefined ? "多重度" : "",
    ].filter((x) => x !== "");
    if (効かない.length > 0) {
      伝える(
        "edge-option-not-honored",
        s.from,
        `type: gantt で ${矢印} に書いた ${効かない.join(" / ")} は描けません (工程表の矢印は前後の関係だけを使います)`,
        line,
      );
    }
  }

  // 高さは件数から決める。 描画側は 1 行 28 以上 + 行間 20 で積み、 上下に 32 / 44 の余白を取る
  // (`kinds/gantt.tsx`)。 360 の固定だと 8 件目から最後の帯が枠の外に出る (実測 = 8 件で 56 はみ出す)
  const CHART_H = Math.max(360, 48 * タスク.length + 96);

  b.node(`${slugify(doc.title) || "gantt"}-chart`, {
    lane: "gantt",
    stack: 0,
    kind: "gantt-timeline",
    title: doc.title,
    ...図の小見出し(doc),
    w: CHART_W,
    h: CHART_H,
    ganttData: タスク.map((t) => {
      const idx = 目盛り.indexOf(t.label);
      const from = 依存元.get(t.name);
      // 帯の向きの誤りは、その項目を書いた行で伝える
      const 逆向きを伝える = (名: string, message: string): void =>
        伝える("gantt-end-before-start", 名, message, t.line);
      const 終わり = 終わる位置(t.end, idx, 目盛り, t.name, 逆向きを伝える, doc);
      return {
        id: slugify(t.name) || t.name,
        title: t.title,
        startIdx: idx,
        endIdx: 終わり.idx,
        startLabel: t.label,
        endLabel: 終わり.label ?? t.label,
        ...(t.owner !== undefined ? { owner: t.owner } : {}),
        ...(from !== undefined ? { dependsOn: slugify(from) || from } : {}),
        ...(t.tone !== undefined ? { tone: t.tone } : {}),
      };
    }),
  });

  return b.build();
}

/**
 * `{名前}` が指す状態が取りうる値を、記法に書かれた範囲で集める (#1251)。
 *
 * 初期値と、段が動かす先 (`tween:` の両端と `set:` の値) を見る。 数として読めない値は
 * 落とす = 位置として使われないため、下限の判定には関係しない。
 */
function 状態が取る値(参照: string, doc: DslDocument): number[] {
  const 名 = 参照.slice(1, -1);
  const out: number[] = [];
  const 数にする = (v: unknown): void => {
    if (typeof v === "number") {
      if (Number.isFinite(v)) out.push(v);
      return;
    }
    // **空文字と空白だけの値を数にしない**。 `Number("")` は 0 を返すため、そのままだと
    // 位置 0 として扱われ、始まりが 1 以降の帯に誤った知らせが出る。 描画側はこの値を
    // 解けず始まりへ倒すので、警告する相手ではない
    const 文字 = String(v).trim();
    if (文字 === "") return;
    const n = Number(文字);
    if (Number.isFinite(n)) out.push(n);
  };
  for (const st of doc.animate?.states ?? []) if (st.name === 名) 数にする(st.initial);
  for (const p of doc.animate?.phases ?? []) {
    for (const t of p.tweens ?? []) {
      if (t.state !== 名) continue;
      数にする(t.from);
      数にする(t.to);
    }
    for (const v of p.sets ?? []) if (v.state === 名) 数にする(v.value);
  }
  return out;
}

/**
 * 工程が終わる位置を決める (#1251)。
 *
 * 書かなければ始まりと同じ = 帯が 1 コマ (従来の挙動)。
 *
 * `{名前}` を書いたらそのまま渡す。 描画側が状態を解いて位置に直すため、段で帯が伸び縮みする。
 * その場合 **時期の名前は始まりのものを使う** = 状態が指すのは位置であって時期の名前ではなく、
 * 帯の端に出す字が段ごとに変わるわけではない。
 *
 * 時期の名前を書いたら、その名前の位置に終わる。 書いた名前が目盛りに無い形は始まりと同じに
 * 倒す = 目盛りは書かれた順に作るため、載っていない名前は位置を持たない。
 */
function 終わる位置(
  end: string | undefined,
  始まり: number,
  目盛り: readonly string[],
  名前: string,
  伝える: (名: string, message: string) => void,
  doc: DslDocument,
): { idx: number | string; label?: string } {
  if (end === undefined) return { idx: 始まり };
  if (/^\{\w+\}$/.test(end)) {
    // **状態が取る値は記法に全部書いてある**。 初期値と、段が動かす先 (`tween:` の両端と
    // `set:` の値) を集めれば、始まりより前に落ちる値をここで見つけられる。
    //
    // 覆えないのは `values:` の式から決まる値だけ = 他の状態から計算されるため、
    // 段ごとの結果を組み立ての時点では出せない
    const 低い = 状態が取る値(end, doc).filter((v) => v < 始まり);
    if (低い.length > 0) {
      伝える(
        名前,
        `type: gantt で ${truncateForMessage(名前)} の終わり (${truncateForMessage(end)}) が始まりより前になる値を取ります (${[...new Set(低い)].join(", ")})。 始まりは ${始まり} 番目です`,
      );
    }
    return { idx: end };
  }
  const i = 目盛り.indexOf(end);
  if (i < 0) return { idx: 始まり };
  // 始まりより前に終わる帯は描けない。 そのまま渡すと横幅が負になり、帯が始まりの位置から
  // 左へはみ出す。 始まりと同じに倒して伝える (黙って倒すと「書いたのに 1 コマのまま」 になる)
  if (i < 始まり) {
    伝える(
      名前,
      `type: gantt で ${truncateForMessage(名前)} の終わり (${truncateForMessage(end)}) が始まりより前です (始まりと同じに倒しました)`,
    );
    return { idx: 始まり };
  }
  return { idx: i, label: end };
}
