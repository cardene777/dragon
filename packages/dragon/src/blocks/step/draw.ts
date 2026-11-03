/**
 * 段の描き方 (#3049、#3345)。
 *
 * 段は図の SVG に描かない。頁に置いた図の下の語りの帯 (`player.ts`) に今の段の題と本文を出し、
 * 読み上げの道具が段の順に読む一覧に、全ての段の題と本文を並べる。段の命令 (`code`) はどちらにも出さない。
 */
import type { Step } from "../../schema";

/**
 * 全ての段の題と本文の写しを、今の段と同じ升 `text` に重ねる。見た目からは隠して場所だけを取り、
 * 帯の高さが本文の最も長い段で決まるので、段を送っても図の枠が伸び縮みしない (#3049)
 */
export function drawRooms(doc: Document, text: HTMLElement, steps: readonly Step[]): void {
  for (const step of steps) {
    const room = doc.createElement("div");
    room.className = "dg-room";
    room.dataset.dragon = "caption-room";
    const roomTitle = doc.createElement("p");
    roomTitle.className = "dg-tt";
    roomTitle.textContent = step.title;
    const roomBody = doc.createElement("p");
    roomBody.className = "dg-tb";
    roomBody.textContent = step.body;
    room.append(roomTitle, roomBody);
    text.append(room);
  }
}

/** 読み上げの段の一覧の 1 項目。段の題を強めて置き、本文を行ごとの段落にする */
export function drawStepItem(doc: Document, step: Step): HTMLLIElement {
  const item = doc.createElement("li");
  const head = doc.createElement("strong");
  head.textContent = step.title;
  item.append(head);
  for (const line of step.body.split("\n")) {
    const p = doc.createElement("p");
    p.textContent = line;
    item.append(p);
  }
  return item;
}
