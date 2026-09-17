/**
 * `presets.cdl.ts` が図として export する見本の名前 (#2139)。
 *
 * 見本を集める検査は、それぞれ集めた数を `21` と書いて空振りを防いでいた。
 * 複雑な版を 1 つ足すと全ての検査の数を同時に直すことになり、直し忘れた file だけが落ちる。
 * 数ではなく名前を 1 か所に書き、各検査はここと突き合わせる。
 *
 * 検査だけが読む。 画面の組み立てからは読まない。
 *
 * **手で書く**。 実物から作ると、見本を消しても何も落ちない。 見本を足し引きした時に
 * 落ちるのがこの一覧の役目で、落ちたらここを直す。
 *
 * 名前の並びは見ない = `import * as` の名前空間は export 名を辞書順に並べるので、
 * 比べる側で両方を並べ替える (`並べた名前`)。
 */
export const 見本の名前: readonly string[] = [
  "presetSwimlane",
  "presetFlow",
  "presetSequence",
  "pattern__presetSequence__複雑",
  "presetTopology",
  "presetEr",
  "pattern__presetEr__複雑",
  "presetStateMachine",
  "pattern__presetStateMachine__複雑",
  "presetInfrastructure",
  "pattern__presetInfrastructure__複雑",
  "presetClassDiagram",
  "pattern__presetClassDiagram__複雑",
  "presetTree",
  "presetUserJourney",
  "presetMindMap",
  "presetFunnel",
  "presetQuadrant",
  "presetChartPie",
  "presetChartLine",
  "presetGantt",
  "presetFlowchart",
  "pattern__presetFlowchart__複雑",
  "presetNetwork",
  "pattern__presetNetwork__複雑",
  "presetStateMachine2",
];

/** 集めた見本の名前を、並びを無視して `見本の名前` と比べられる形にする */
export const 並べた名前 = (名前: readonly string[]): string[] => [...名前].sort();
