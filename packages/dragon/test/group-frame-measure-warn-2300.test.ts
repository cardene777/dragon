/**
 * 組 (`groups:`) を 2 つ書いた図を組み立てた時に、 実物と合わない重なりの知らせが出ないことの検証 (#2300)。
 *
 * 組の枠は `posX: 0, posY: 0` の仮置きで図に足され、 束ねる縦列の位置が決まってから置き直す。
 * 置き直す位置を測るために配置計算を 1 度呼ぶが、 **そこへ仮置きのままの枠を渡していた**。
 * 仮置きの枠は全て `x = 0` なので、 組の名札が全部同じ `x = 16` に積み上がり、 記法の engine が
 * そこを重なりとして知らせていた。
 *
 * ```
 * [cdl layout] overlap: lane-label#group-front ∩ lane-label#group-inside = 1994px²
 * ```
 *
 * 出来上がった図では 1 度も重ならない (名札の箱は `16.0..87.2` と `564.0..682.4`)。
 *
 * ## 0 件が「測っていない」 でないことを対照で示す
 *
 * 知らせが出ないことだけを見ると、 知らせを捕まえる配線が切れていても通る。
 * 枠を渡す形 (直す前の形) をこの file の中で組み立て直し、 そちらでは 1 行出ることを併せて見る。
 */
import { readdirSync } from "node:fs";
import { describe, it, expect, vi } from "vitest";
import { layout, type CdlDiagram } from "@cardenelabs/cdl";
import { textDslToDiagram } from "../src/index";

import * as cookbook from "../../../apps/playground-spa/src/topics/catalog/cookbook.cdl";
import * as patterns from "../../../apps/playground-spa/src/topics/catalog/patterns.cdl";
import * as presets from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import * as primitives from "../../../apps/playground-spa/src/topics/catalog/primitives.cdl";
import * as primitivesExtra from "../../../apps/playground-spa/src/topics/catalog/primitives-extra.cdl";
import * as textDsl from "../../../apps/playground-spa/src/topics/catalog/text-dsl.cdl";
import * as animation from "../../../apps/playground-spa/src/topics/catalog/animation.cdl";
import * as styles from "../../../apps/playground-spa/src/topics/catalog/styles.cdl";
import * as interactive from "../../../apps/playground-spa/src/topics/catalog/interactive.cdl";
import * as ethereum from "../../../apps/playground-spa/src/topics/catalog/ethereum.cdl";
import * as parts from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import * as partsInBox from "../../../apps/playground-spa/src/topics/catalog/parts-in-box.cdl";
import * as partsMotion from "../../../apps/playground-spa/src/topics/catalog/parts-motion.cdl";
import * as charts from "../../../apps/playground-spa/src/topics/catalog/charts.cdl";

/** 組を 2 つ書いた図。 `front` が `web` を、 `inside` が `app` と `db` を束ねる */
const 組を2つ = `title: "組を 2 つ書いて縦列を分けて囲む"
type: flow

lanes:
  web: { label: "受付の層" }
  app: { label: "処理の層" }
  db: { label: "保存の層" }

groups:
  front: { label: "社外", lanes: [web] }
  inside: { label: "社内の網", lanes: [app, db] }

actors:
  - 利用者: { kind: actor, lane: web }
  - 注文の処理: { kind: function, lane: app }
  - 注文の台帳: { kind: storage, lane: db }

flow:
  - 利用者 -> 注文の処理: "注文"
  - 注文の処理 -> 注文の台帳: "書き込み"
`;

/** 組を 1 つだけ書いた図。 名札の総当たりの相手が無いので元から知らせが出ない */
const 組を1つ = 組を2つ.replace(`  front: { label: "社外", lanes: [web] }\n`, "");

/** `console.warn` に出た `[cdl layout] overlap` の行だけを集める */
function 重なりの知らせを集める(実行: () => void): string[] {
  const 出た: string[] = [];
  const warn = vi.spyOn(console, "warn").mockImplementation((...a: unknown[]) => {
    const s = a.map(String).join(" ");
    if (s.includes("[cdl layout] overlap")) 出た.push(s);
  });
  try {
    実行();
  } finally {
    warn.mockRestore();
  }
  return 出た;
}

/**
 * 縦列と箱の位置を並べる。 直す前後で 1 単位も変わっていないことを比べる用。
 *
 * 組の枠そのものは片方にしか無いので `除く` で外す。 外す判定は縦列の一覧に対して行い、
 * 箱の一覧には掛けない (箱に枠は入らない)。
 */
function 位置を並べる(d: CdlDiagram, 除く: ReadonlySet<string>): string[] {
  const 配置 = layout(d);
  return [
    ...配置.lanes
      .filter((l) => !除く.has(l.id))
      .map((l) => `縦列 ${l.id}:${l.x},${l.y},${l.width},${l.height}`),
    ...配置.nodes.map((n) => `箱 ${n.id}:${n.cx},${n.cy},${n.w},${n.h}`),
  ];
}

describe("組の枠を置き直す位置を測る時に、仮置きの枠を測らない (#2300)", () => {
  it("組を 2 つ書いても重なりの知らせが出ない", () => {
    const 出た = 重なりの知らせを集める(() => textDslToDiagram(組を2つ));
    expect(出た, `出た知らせ ${JSON.stringify(出た)}`).toEqual([]);
  });

  it("仮置きの枠を測ると 1 行出る (植え込み対照)", () => {
    // 直す前の形 = 置き直す前の枠を入れたまま配置計算へ渡す。 ここで知らせが出ることが、
    // 上の 0 件が「知らせを捕まえていない」 のではなく「知らせが出ていない」 ことの根拠になる。
    const d = textDslToDiagram(組を2つ);
    const 枠id = new Set(d.lanes.filter((l) => l.id.startsWith("group-")).map((l) => l.id));
    expect(枠id.size, "組の枠が 2 本ある").toBe(2);
    const 仮置きに戻した: CdlDiagram = {
      ...d,
      lanes: d.lanes.map((l) =>
        枠id.has(l.id) ? { ...l, posX: 0, posY: 0, posW: 1, posH: 1 } : l,
      ),
    };
    const 出た = 重なりの知らせを集める(() => layout(仮置きに戻した));
    expect(出た.length, `出た知らせ ${JSON.stringify(出た)}`).toBe(1);
    expect(出た[0]).toContain("lane-label#group-front");
    expect(出た[0]).toContain("lane-label#group-inside");
  });

  it("出来上がった名札の箱は離れている", () => {
    // 知らせを消すだけでなく、 画面で本当に重なっていないことを同じ file で見る。
    // engine が名札の箱を作る式 (`lane.x + 16`、 幅は字の幅 + 24、 高さ 28) をここで同じに置く。
    const 配置 = layout(textDslToDiagram(組を2つ));
    const 枠 = 配置.lanes.filter((l) => l.id.startsWith("group-"));
    expect(枠.length, "組の枠が 2 本ある").toBe(2);
    const 左 = Math.min(...枠.map((l) => l.x));
    const 右 = Math.max(...枠.map((l) => l.x));
    // 2 本の枠の左端が離れていれば、 名札の箱 (左端 + 16 から始まる) も離れる。
    // 同じ左端に積んでいた時が知らせの原因だった。
    expect(右 - 左, `枠の左端 ${枠.map((l) => `${l.id}=${l.x}`).join(" ")}`).toBeGreaterThan(100);
  });

  it("枠を測らなくしても縦列と箱の位置が変わらない", () => {
    // 測る対象から枠を外すと配置が動くなら、 知らせを消す代わりに図を壊している。
    // 枠は `posX` / `posY` を持つため並べ直しの対象外で、 外しても同じ値になるはず。
    const d = textDslToDiagram(組を2つ);
    const 枠id = new Set(d.lanes.filter((l) => l.id.startsWith("group-")).map((l) => l.id));
    const 枠を抜いた: CdlDiagram = { ...d, lanes: d.lanes.filter((l) => !枠id.has(l.id)) };
    const 抜き = 位置を並べる(枠を抜いた, 枠id);
    const 入り = 位置を並べる(d, 枠id);
    // 空振りではないこと = 比べる相手が 1 件以上ある
    expect(抜き.length, "比べる縦列と箱がある").toBeGreaterThan(0);
    expect(抜き).toEqual(入り);
  });

  it("組を 1 つだけ書いた図でも知らせが出ない", () => {
    const 出た = 重なりの知らせを集める(() => textDslToDiagram(組を1つ));
    expect(出た, `出た知らせ ${JSON.stringify(出た)}`).toEqual([]);
    // 空振りではないこと = 組の枠が 1 本できている
    const d = textDslToDiagram(組を1つ);
    expect(d.lanes.filter((l) => l.id.startsWith("group-")).length).toBe(1);
  });
});

/**
 * カタログの見本を全件組み立てて、 名札どうしの重なりが 1 件も知らされないことを見る。
 *
 * 上の検査は 1 つの見本を名指しで見るので、 **次に組を書く頁が増えた時には届かない**。
 * 組を書いた見本は今 2 件しかないが、 増えるたびに同じ知らせが戻る形だった。
 * 見本の一覧は頁の実ファイルから導き、 手で並べない。
 */
const 頁: Record<string, Record<string, unknown>> = {
  cookbook,
  patterns,
  presets,
  primitives,
  "primitives-extra": primitivesExtra,
  "text-dsl": textDsl,
  animation,
  styles,
  interactive,
  ethereum,
  parts,
  "parts-in-box": partsInBox,
  "parts-motion": partsMotion,
  charts,
};

/** catalog dir の実ファイル。 上の手書きの一覧から頁が漏れた時に検知する */
const 実在する頁 = (): string[] =>
  readdirSync(new URL("../../../apps/playground-spa/src/topics/catalog", import.meta.url))
    .filter((name) => name.endsWith(".cdl.ts"))
    .map((name) => name.slice(0, -".cdl.ts".length))
    .sort();

describe("カタログの見本を組み立てても、名札どうしの重なりが知らされない (#2300)", () => {
  it("catalog の全ページを走査対象にしている", () => {
    expect(Object.keys(頁).sort(), "新しいページが走査から漏れている").toEqual(実在する頁());
  });

  it("見本を全件組み立てて、名札どうしの重なりが 0 件", () => {
    let 母数 = 0;
    let 組を持つ = 0;
    const 出た: string[] = [];
    for (const [頁名, mod] of Object.entries(頁)) {
      for (const [名, v] of Object.entries(mod)) {
        if (typeof v !== "string" || !名.startsWith("sourceYaml")) continue;
        母数++;
        if (/^groups:/m.test(v)) 組を持つ++;
        const 行 = 重なりの知らせを集める(() => {
          try {
            textDslToDiagram(v);
          } catch {
            // 組み立てられない見本は別の検査が見る。 ここは知らせの有無だけを見る
          }
        });
        // 見るのは名札どうしの重なりだけ。 箱や矢印との重なりは別の話で、
        // ここで拾うと本 Issue と関係ない指摘で落ちる
        for (const s of 行) {
          if (/overlap: lane-label#.* ∩ lane-label#/.test(s)) 出た.push(`${頁名}/${名}: ${s}`);
        }
      }
    }
    // 0 件が「測っていない」 でないことの母数 (`rules/quality.md § 0 件を報告する時は母数を併記する`)
    expect(母数, "組み立てた見本がある").toBeGreaterThan(0);
    expect(組を持つ, "組 (groups:) を書いた見本が 1 件以上ある").toBeGreaterThan(0);
    expect(出た, `見本 ${母数} 件 (組を持つ ${組を持つ} 件) を組み立てた`).toEqual([]);
  });
});
