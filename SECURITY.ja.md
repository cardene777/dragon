# セキュリティの決まり

[English](SECURITY.md)

## 修正する版

セキュリティの修正は、npm の `@cardenelabs/dragon` の最新の minor の版にだけ出す。
dragon は 1.0 の前なので、古い minor の版へは修正を移さない。

## 脆弱性の知らせ方

dragon か、dragon が使う依存に脆弱性を見つけた時は、公開の Issue に書かないでほしい。
代わりに GitHub の Security Advisory から非公開で知らせてほしい。

<https://github.com/cardene777/dragon/security/advisories/new>

Advisory は知らせた人と作者だけが読め、そこで問題をやり取りできる。

できれば次のことを書いてほしい。

- 影響する package と版
- 再現する手順 (コードか命令)
- 起きうる被害 (サービスの停止、コードの実行、データの漏れなど)
- 直し方の案 (任意)

## 受けた後の流れ

- 受けてから 7 日以内に中身を読み、重さを見積もる
- 重さが Critical と High の問題は、直した版を最初に出す
- 公開する日は知らせた人と決め、決めなければ直した版を出す日にする

dragon は 1 人で作っているので、直すのに時間が掛かることがある。
急ぐ問題は Advisory にそう書いてほしい。

## 公開した Advisory

この repo の [security advisories](https://github.com/cardene777/dragon/security/advisories) にある。
