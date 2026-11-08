/** 見本帳の部品の頁の、区画の説明 (#3345、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "構成図だけの部品。group から end までの箱を 1 つの区画に囲み、仕組みの境目を見せる。",
  en: "Architecture diagrams only. The boxes between group and end sit inside one region that marks a boundary in the system.",
};
