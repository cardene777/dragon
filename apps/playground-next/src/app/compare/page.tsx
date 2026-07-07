import type { Metadata } from "next";
import { CompareClient } from "./client";

export const metadata: Metadata = {
  title: "Theme comparison",
  description: "6 theme を並列表示、 1 preset で theme 差分を一目で比較。",
  openGraph: {
    title: "Theme comparison | dragon",
    description: "6 theme を並列表示、 1 preset で theme 差分を一目で比較。",
  },
};

export default function ComparePage(): React.ReactElement {
  return <CompareClient />;
}
