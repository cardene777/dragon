import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Playground } from "./Playground";
import "./playground.css";

/**
 * 公開する頁は 1 枚だけ (#2995)。
 *
 * 前の見本帳の経路 (`/dragon/catalog` や `/dragon/editor` など) は GitHub Pages が `404.html` を返し、
 * それはこの頁の写し (`scripts/copy-404.mjs`)。どの経路で開いても新しい頁を出し、アドレス欄を頁の置き場に書き換える。
 */
const base = import.meta.env.BASE_URL;
if (location.pathname !== base) history.replaceState(null, "", `${base}${location.search}${location.hash}`);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Playground />
  </StrictMode>,
);
