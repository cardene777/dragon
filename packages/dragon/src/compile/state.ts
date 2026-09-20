import { stateMachine } from "@cardenelabs/cdl";
import type { NodeKind } from "@cardenelabs/cdl";
import { 箱の題 } from "./node-title";
import type { CdlDiagram } from "@cardenelabs/cdl";
import type { DslDocument } from "../types";

import { compileGenericWithAnimate, 共通の組み立てへ回す } from "./generic";
import { 描ける種別 } from "./kinds";

import { slugify } from "./slug";
import { 始まりと終わりの決め方 } from "./actors";
export function compileState(doc: DslDocument): CdlDiagram {
  // 動きを書いた形と縦列を書いた形は共通の組み立てへ (#1263 / #2348 で 1 箇所にまとめた)。
  // 縦列は #2348 まで抜けており、動きを書かない図では書いた縦列が黙って消えていた。
  //
  // **種類を書いた形も** (#1450、 #1263 と同じ理由)。 静止図の経路は種類を持たないため、
  // 通すと `kind: mark-start` を書いた箱が `card` になり知らせも出ない
  if (共通の組み立てへ回す("state", doc, 既定と違う種類を書いた(doc))) {
    return compileGenericWithAnimate(doc, { kind: "state", laneWidth: 360 });
  }
  // stateMachine preset ... actors を state に、 流れ を transition に
  const fsm = stateMachine({
    id: slugify(doc.title),
    topic: doc.title,
  });
  const 決め方 = 始まりと終わりの決め方(doc);
  for (let i = 0; i < doc.actors.length; i++) {
    const a = doc.actors[i]!;
    // 書いた `initial:` / `final:` が勝つ。 1 つも書いていなければ順序で決める
    const initial = 決め方.始まり(a, i);
    const final = 決め方.終わり(a, i);
    fsm.state({
      id: slugify(a.name) || `s${i}`,
      title: 箱の題(a),
      ...(initial ? { initial: true } : {}),
      ...(final ? { final: true } : {}),
    });
  }
  for (const s of doc.flow) {
    fsm.transition({
      from: slugify(s.from),
      to: slugify(s.to),
      trigger: s.label,
      ...(s.sub ? { guard: s.sub } : {}),
    });
  }
  return fsm.build();
}

/** 状態の図で `stateMachine` preset が全ての箱に使う種類 */
export const 状態の図の既定の種類: NodeKind = "card";

/**
 * 状態の図で、既定と違う種類を書いた登場人物がいるか (#1450)。
 *
 * `stateMachine` preset は全ての状態を `card` で描くため、書いた `kind:` が黙って消える。
 * 始点終点の印 (`mark-start` / `mark-end`) を書けるようにするには、書いた形を効かせる必要がある。
 *
 * **「書いたか」 だけでは広すぎる**。 記法だけの種類 (`kind: state` 等) は `card` に読み替わり、
 * preset の出す形と同じになる = 書いても何も変わらないので経路を切り替える理由が無い。
 * 切り替えると既存の図の id と枠の作りが変わる (実測で golden 8 件が落ちた)。
 *
 * 読み替えた後の種類が既定と違う時だけ切り替える。 こうすると「書いたのに効かない」 は消え、
 * 「書いたが結果が同じ」 は従来の経路に留まる。
 */
export function 既定と違う種類を書いた(doc: DslDocument): boolean {
  return doc.actors.some(
    (a) => a.kindWritten === true && 描ける種別(a.kind) !== 状態の図の既定の種類,
  );
}
