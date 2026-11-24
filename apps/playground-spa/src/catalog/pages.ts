/** カタログの 3 つの頁。頁の塊 (`site/pages.tsx`) が 1 つの塊として後から読む (#3280) */
export { CatalogIndex } from "./CatalogIndex";
export { CategoryPage } from "./CategoryPage";
export { PartPage } from "./PartPage";
/** 経路の名札から部品の頁に渡す部品を引く。最初の画面は部品の表を読まず、名札だけを確かめる (#3868) */
export { partOf } from "./parts";
