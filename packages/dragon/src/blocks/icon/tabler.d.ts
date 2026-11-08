/**
 * `scripts/build-tabler.mjs` が Tabler の線の絵柄から前もって書き出した表の型 (#3493)。
 * 鍵は Tabler の絵柄の名前、値は手描きの絵柄と同じく (0, 0) を中心にした 20 四方の格子の path の字。
 */
declare const tabler: Readonly<Record<string, string>>;

export default tabler;
