import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

/**
 * 見本帳の仮の 1 頁。 dragon を作り直している間はこれだけを配る (#2982)。
 *
 * 図の一覧と編集画面と 7 つの意匠は #2983 で消した。 新しい描画の部品ができたら、
 * 見本帳はその部品で組み直す。 頁の見た目は持たせないので、 字と色は browser の既定に任せる。
 */
function RebuildingPage(): React.ReactElement {
  return (
    <main style={{ maxWidth: "40rem", margin: "0 auto", padding: "4rem 1.5rem", lineHeight: 1.8 }}>
      <h1>dragon は作り直しの最中です</h1>
      <p>図の書き方と描き方を根本から作り直しています。</p>
      <p>今までの見本帳と編集画面は、新しい描画の部品ができるまで公開を止めています。</p>
      <p>
        進み具合は{" "}
        <a href="https://github.com/cardene777/dragon/issues/2982">cardene777/dragon#2982</a>{" "}
        で追えます。
      </p>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RebuildingPage />
  </StrictMode>,
);
