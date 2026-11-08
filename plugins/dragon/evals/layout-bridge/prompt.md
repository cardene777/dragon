---
name: layout-bridge
tags: [layout, blocks, shared]
runs: 3
max_turns: 25
timeout_seconds: 480
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---
EthereumからBaseへトークンをブリッジで渡す流れを、1段ずつ追える構成図にしてファイルに保存して。
ブリッジは他の箱と形を変えて、橋だと一目で分かるようにしたい。
ブリッジからBaseへの受け渡しは中継者が運ぶので、普通の矢印と区別して描いて。
Baseの箱には、受け取りを確かめる鍵の印を付けて。
