/**
 * 字の CSS を 1 つの塊にまとめる (#3296)。
 *
 * 切り出した字の面と、切り出した字を外した分割された字の面 (`vite-site-font.ts`) を一緒に読む。
 * 別の塊にすると字の CSS の読み込みが 2 回になり、片方が届くまでの間だけ字が欠ける。
 */
import "@cardenelabs/dragon/fonts";
import "./font/noto-sans-jp-site.css";
