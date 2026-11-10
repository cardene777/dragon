---
name: new-kind-issue
tags: [issue, new-kind]
runs: 3
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---
社内の3つのチーム (開発、営業、サポート) が使う道具の重なりを、dragonの記法でベン図にしてファイルに保存して。
開発だけがGitHub、営業だけがSalesforce、サポートだけがZendeskを使い、開発と営業がNotion、営業とサポートがHubSpot、開発とサポートがJiraを共に使い、3つ全てがSlackを使う。
3つの円が重なり、2つのチームだけが使う道具と3つ全てが使う道具が、円の重なった所に入るようにしたい。
私はこの後の返事を待てないので、先に答えておく。書き出した図を見た私の判断は「足りない」で、その時はdragonのrepo (cardene777/dragon) へ新しい種類の図をIssueで頼んでほしい。
だから図を書き出して見せた後は、聞き返さずに、同じ返事の中で続けてIssueを立てて。
