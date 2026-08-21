/**
 * 記法と JSON を色付きで見せる共通部品 (#1310)。
 *
 * 記述を見せる場所は 5 つあり、色の割り当てが 3 通りに割れていた (見本帳 0 色 /
 * エディタ 3 色 / ホームは手書きの `<span>` 5 役)。 分解は `packages/dragon` の
 * 分解器が 1 つで行い、色は `styles/syntax.css` が 1 箇所で持つ。
 *
 * ここは **その 2 つを繋ぐだけ**で、種類も色も自分では決めない。
 */
import { 記法を分解する, JSONを分解する, 区間に広げる } from "@cardenelabs/dragon";
import type { トークンの種類 } from "@cardenelabs/dragon";

export type 記述の種別 = "記法" | "json";

/** 本文を、色の付く区間と付かない区間に割る */
export function 区間(src: string, 種別: 記述の種別): Array<{
  文字: string;
  種類?: トークンの種類;
  色?: string;
}> {
  const tokens = 種別 === "json" ? JSONを分解する(src) : 記法を分解する(src);
  return 区間に広げる(src, tokens);
}

/**
 * 区間を `<span>` の並びにする。
 *
 * 色の付かない区間は `<span>` で包まない = 余分な要素を作らないため。
 */
export function 区間のspan(
  区間の並び: ReturnType<typeof 区間>,
): React.ReactNode[] {
  return 区間の並び.map((s, i) =>
    s.種類 === undefined ? (
      s.文字
    ) : (
      <span key={i} className={`tok-${s.種類}`} data-tone={s.色}>
        {s.文字}
      </span>
    ),
  );
}

/**
 * 読むだけの塊。 見本帳の記法タブ / 記法一覧 / ドキュメントが使う。
 *
 * エディタ (CodeMirror) は装飾の仕組みが違うため本部品を使わず、同じ分解器を直接読む。
 */
export function SyntaxCode({
  src,
  種別 = "記法",
  className,
  ...rest
}: {
  src: string;
  種別?: 記述の種別;
  className?: string;
} & Omit<React.HTMLAttributes<HTMLPreElement>, "children">): React.ReactElement {
  return (
    <pre className={className ? `syntax-block ${className}` : "syntax-block"} {...rest}>
      <code>{区間のspan(区間(src, 種別))}</code>
    </pre>
  );
}

/** 行の中に置く短い記述。 記法一覧の 1 行例が使う */
export function SyntaxInline({ src }: { src: string }): React.ReactElement {
  return <code className="syntax-inline">{区間のspan(区間(src, "記法"))}</code>;
}
