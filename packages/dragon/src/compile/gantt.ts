import { diagram } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import type { DslDocument } from "../types";

import { slugify } from "./slug";
import { 箱の題 } from "./node-title";
import { truncateForMessage, 図の小見出し } from "./subtitle";
/**
 * 工程表 (`type: gantt`) の組み立て (#2030 で `compile.ts` から移した)。
 */

export function compileGantt(doc: DslDocument): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title, type: "gantt" });
  const CHART_W = 720;
  b.lane("gantt", { width: CHART_W });

  // 目盛りは **書かれた順** に並べる。 以前は `Q1=200 / Q2=600 / ...` の決め打ちで、 Q1-Q4 以外は
  // 全て同じ位置に落ちていた。 順に並べれば月名でも週番号でも同じ規則で置ける
  const 目盛り: string[] = [];
  const 目盛りなし: string[] = [];
  const タスク: {
    name: string;
    title: string;
    label: string;
    tone?: DslDocument["actors"][number]["tone"];
    owner?: string;
    end?: string;
  }[] = [];
  for (const a of doc.actors) {
    const label = (a.value ?? a.subtitle ?? "").trim();
    if (label === "") {
      目盛りなし.push(a.name);
      continue;
    }
    if (!目盛り.includes(label)) 目盛り.push(label);
    // 色は帯にそのまま渡す。 箱が 1 つになっても、 書いた色が消えないようにする
    タスク.push({
      name: a.name,
      title: 箱の題(a),
      label,
      ...(a.tone !== undefined ? { tone: a.tone } : {}),
      ...(a.owner !== undefined ? { owner: a.owner } : {}),
      ...(a.end !== undefined ? { end: a.end } : {}),
    });
  }
  if (目盛りなし.length > 0 && typeof console !== "undefined" && console.warn) {
    console.warn(
      `[dragon] type: gantt で時期を読めない項目があります (帯に載せません): ${目盛りなし.join(", ")}。` +
        ` \`- 設計: "Q1"\` の形で書いてください`,
    );
  }

  // 矢印は依存として読む (`- 設計 -> 実装` = 実装は設計の後)。 帯どうしを結ぶ線は描画側が
  // 依存として描くので、 書いた矢印を捨てずに使う。 居ない名前を指した矢印は伝える
  const タスク名 = new Set(タスク.map((t) => t.name));
  const 依存元 = new Map<string, string>();
  const 居ない: string[] = [];
  const 装飾つき: string[] = [];
  for (const s of doc.flow) {
    if (!タスク名.has(s.from) || !タスク名.has(s.to)) {
      居ない.push(`${s.from} -> ${s.to}`);
      continue;
    }
    依存元.set(s.to, s.from);
    // 帯の依存は「どちらが先か」 だけを持つ。 矢印に書いた文字や色は描けないので伝える
    if (
      (s.label ?? "") !== "" ||
      (s.sub ?? "") !== "" ||
      s.tone !== undefined ||
      s.style !== undefined
    ) {
      装飾つき.push(`${s.from} -> ${s.to}`);
    }
  }
  if (居ない.length > 0 && typeof console !== "undefined" && console.warn) {
    console.warn(
      `[dragon] type: gantt で依存を結べない矢印があります (居ない項目か時期なし): ${居ない.join(", ")}`,
    );
  }
  if (装飾つき.length > 0 && typeof console !== "undefined" && console.warn) {
    console.warn(
      `[dragon] type: gantt の矢印は前後の関係だけを使います (文字 / 色 / 線種は描けません): ${装飾つき.join(", ")}`,
    );
  }

  // 帯の向きの誤りは `console.warn` に出す。 この図種の他の知らせ (時期なし / 依存が結べない /
  // 矢印の飾り) が同じ経路を使っており、揃えないとどれが出るかが書き方で変わる
  const 逆向きを伝える = (_名: string, message: string): void => {
    if (typeof console !== "undefined" && console.warn) console.warn(`[dragon] ${message}`);
  };

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
