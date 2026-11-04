/**
 * `group` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { attrs, shown } from "../../print-kit";
import { fail, readDeclared } from "../../read-kit";
import type { Region } from "../../schema";
import { type BlockReading, none } from "../block";
import { readLook } from "../color/read";

export interface GroupMessages {
  nestedGroup: string;
  strayEnd: string;
  endTakesNothing: string;
  unclosedGroup: (id: string) => string;
  regionReopened: (id: string) => string;
  gitNoGroup: string;
  treeNoGroup: string;
  lineupNoGroup: string;
}

/** 区画を開く行。名前と見た目の属性は、名札と違う物と書いた物だけを書く */
export const declareRegion = (r: Region): string =>
  `group ${r.id}${shown(r.id, r.name)}${attrs([
    ["note", r.note],
    ["color", r.color],
    ["icon", r.icon],
  ])}`;

export const reading: BlockReading<GroupMessages> = {
  read: {
    // `group` の行。同じ名札をもう一度開いた時は、名前も属性も書かない
    group: (source, state) => {
      const { m, figure } = state;
      state.beforeSteps(source);
      if (state.kind === "git") throw fail(source, 0, m.gitNoGroup);
      if (state.kind === "tree") throw fail(source, 0, m.treeNoGroup);
      if (state.kind === "lineup") throw fail(source, 0, m.lineupNoGroup);
      if (figure.group) throw fail(source, 0, m.nestedGroup);
      const declared = readDeclared(source, "group", state.attrs.group ?? [], m);
      if (figure.regions.some((region) => region.id === declared.id)) {
        if (declared.name !== undefined || declared.attrs.size > 0) throw fail(source, 0, m.regionReopened(declared.id));
      } else {
        state.claim(source, declared.id, declared.idAt);
        figure.regions.push({ id: declared.id, name: declared.name ?? declared.id, ...readLook(source, declared.attrs, m) });
      }
      figure.group = { source, id: declared.id };
    },
    end: (source, state) => {
      if (source.text !== "end") throw fail(source, "end".length, state.m.endTakesNothing);
      if (!state.figure.group) throw fail(source, 0, state.m.strayEnd);
      state.figure.group = undefined;
    },
  },
  print: none("区画の行は書き戻すと箱の行と同じ並びに入るので、箱のブロックの宣言を書く処理が declareRegion で書く"),
  messages: {
    ja: {
      nestedGroup: "group の中に group は書けない。先に end で閉じる",
      strayEnd: "end の前に、閉じる group が無い",
      endTakesNothing: "end の後ろには何も書かない",
      unclosedGroup: (id) => `group ${id} を end で閉じていない`,
      regionReopened: (id) => `group ${id} は宣言済み。もう一度開く時は group ${id} だけを書き、名前と属性は最初の宣言に書く`,
      gitNoGroup: "git (枝分かれの図) には group を書けない。枝は branch の行で宣言する",
      treeNoGroup: "tree (木の図) には group を書けない。木の箱は leaf と node の行で書く",
      lineupNoGroup: "lineup (列の図) には group を書けない。列は box の行で宣言する",
    },
    en: {
      nestedGroup: "A group cannot hold another group. Close it with end first",
      strayEnd: "There is no group for this end to close",
      endTakesNothing: "Write nothing after end",
      unclosedGroup: (id) => `group ${id} is not closed with end`,
      regionReopened: (id) => `group ${id} is already declared. To open it again, write only group ${id}; put the name and attributes on the first one`,
      gitNoGroup: "A git diagram takes no group. Declare branches with branch lines",
      treeNoGroup: "A tree diagram takes no group. Write the tree boxes with leaf and node lines",
      lineupNoGroup: "A lineup diagram takes no group. Declare the lanes with box lines",
    },
  },
};
