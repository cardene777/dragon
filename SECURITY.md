# Security Policy

## Supported Versions

最新 minor のみセキュリティ修正対象。
0.x 系は major bump 前の不安定 phase のため、 古い minor へは原則 backport しない。

| Version | Supported |
| --- | --- |
| 0.5.x | Yes |
| < 0.5 | No |

## 報告経路

cdl の dependency / runtime に脆弱性を見つけた場合は、 **public issue を起票せず** 次のいずれかで連絡してください。

1. **GitHub Security Advisory** (推奨)
   - https://github.com/cardene777/cdl/security/advisories/new
   - non-public な channel で著者と直接やり取りできる
2. GitHub の private contact form 経由

可能であれば次の情報を含めてください。

- 影響範囲 (affected package / version)
- 再現手順 (PoC code / コマンド)
- 想定される影響 (DoS / arbitrary code execution / data leak 等)
- 推奨される修正方針 (任意)

## 対応方針

- 受領から 7 日以内に内容を確認、 影響度を triaging
- Critical / High は patch release を最優先で準備
- 公開タイミングは reporter と協議 (default は patch release 同日)

cdl は小さな OSS なので、 対応に時間がかかる可能性があります。
緊急性が高い問題は advisory 内で明示してください。

## 公開済み advisory

GitHub Security Advisory の active list は [security advisories](https://github.com/cardene777/cdl/security/advisories) を参照。
