---
name: layout-payment
tags: [layout, blocks, custom]
runs: 3
max_turns: 25
timeout_seconds: 480
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---
決済の構成図を作って、1段ずつ追える形でファイルに保存して。
利用者のアプリがAPIサーバーに支払いを頼み、APIサーバーは外部の価格オラクルに為替レートを聞いてから、決済代行に請求を送る。
外部の価格オラクルは他の箱と形を変えて六角形で描き、オラクルから返る価格の受け渡しは点線で描いて区別したい。
