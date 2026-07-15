# Dragon Diagram Forge: 20 Diagram Specs

Status: content-reviewed.

The diagrams must teach mechanisms, not decorate protocol names. Each figure uses a distinct visual grammar and includes inspectable protocol data.

| # | Diagram | Structure |
|---:|---|---|
| 1 | Ethereum ブロック生成 | 12秒 slot 時計、proposer 選出、builder/payload、attestation orbit、head/finality の差分 |
| 2 | トランザクションがブロックに入るまで | Wallet から RPC、local mempool、builder、proposer までの地図型経路と tx passport |
| 3 | EIP-1559 手数料 | parent/current/next の3ブロック、gasUsed slider、baseFee 変化、burn/tip/refund 分岐 |
| 4 | ブロック内部構造 | header/body/receipts/state transition の解剖図、root と logsBloom を明示 |
| 5 | Execution layer / Consensus layer | 二層エンジン室、Engine API 呼び出し、CL/EL の責務分離 |
| 6 | Account / Storage / Trie | address から account、storage slot、stateRoot へ潜る地下構造 |
| 7 | ERC-20 transfer | contract 実行境界、calldata、balanceOf storage mutation、Transfer event |
| 8 | ERC-20 approve / transferFrom | owner/spender allowance テーブル、caller identity、残 allowance |
| 9 | Event log と indexer | receipt から topics/data を indexer/UI が観測する観測パイプライン |
| 10 | Bridge lock/mint | escrow、lock event、finality gate、relayer proof、mint の循環 |
| 11 | Bridge burn/release | wrapped burn、message nonce、proof、escrow release の状態機械 |
| 12 | Light-client bridge | header/root/proof/validator-set を検証する断面 |
| 13 | Optimistic bridge | assertion、challenge window、fraud proof、finalize の砂時計 |
| 14 | Rollup batch 投稿 | L2 txs を batch/root/calldata/blob に圧縮して L1 inbox へ投稿 |
| 15 | ZK Rollup proof | execution trace/witness を prover が proof に折り畳み verifier が確認 |
| 16 | MEV / PBS | searcher bundle、builder block、relay bid、proposer choice のオークション |
| 17 | AMM swap | x*y=k 曲線、reserve 台帳、amountIn/out、price impact |
| 18 | Staking / Slashing | validator lifecycle と inactivity/slashing trap |
| 19 | Reorg / Finality | head/safe/finalized anchor と fork-choice branch |
| 20 | TLS 1.3 / TCP/IP 基礎 | key schedule loom と nested envelope の比較的低レイヤ基礎 |

## Review Notes

- Ethereum topic set is intentionally dominant because the user explicitly called out block generation, EIP-1559, ERC-20, bridge, and reusable dragon parts.
- Each diagram must answer: what enters, where it is processed, what state changes, and what exits.
- Labels are Japanese-first; protocol identifiers remain exact where useful.
