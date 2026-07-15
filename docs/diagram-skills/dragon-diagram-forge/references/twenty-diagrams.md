# Initial 20 Diagram Set

Each topic must use a distinct visual grammar. Color or label changes alone do not count.

| # | Topic | Misconception To Fix | Visual Grammar | Required Data |
|---:|---|---|---|---|
| 1 | Ethereum block production | Validators do not build/finalize blocks alone in a simple chain step. | Slot timeline, proposer spotlight, payload assembly, attestation orbit, finality side lane. | slot, proposer, transactions, execution payload, attestations, fork-choice head, finality hint |
| 2 | Transaction path to block | There is no single canonical global mempool. | Route map with multiple local mempool branches and replacement/non-inclusion cases. | nonce, chainId, tx.to, calldata, maxFeePerGas, maxPriorityFeePerGas, signature |
| 3 | EIP-1559 fee market | Gas price is not one bid paid entirely to validators. | Three-block base fee simulator with tx-level burn/tip/refund split. | base fee, priority fee, max fee, target gas, gas used, burn, proposer tip, refund |
| 4 | Block internal structure | A block is not just a list of transactions. | Layered anatomy: header/body/receipts/state transition. | parentHash, stateRoot, transactionsRoot, receiptsRoot, logsBloom, gasUsed, baseFeePerGas |
| 5 | Execution and consensus layers | One client does not do all Ethereum work. | Two-layer engine room with directional Engine API calls. | beacon block, execution payload, forkchoiceUpdated, newPayload, EL client, CL client |
| 6 | Account, storage, trie | Account state is not one flat JSON object. | Underground drill-down from account to storage slot to trie root. | address, nonce, balance, codeHash, storageRoot, slot key, value, stateRoot |
| 7 | ERC-20 transfer | Tokens do not fly between wallets. | Contract cutaway with calldata, storage map mutation, event log. | signed tx, transfer(to, amount), balanceOf, sender/recipient balances, Transfer event |
| 8 | ERC-20 approve/transferFrom | Allowance is not ownership transfer. | Authority table plus caller identity spotlight and second-stage transferFrom. | owner, spender, allowance, approve, transferFrom, remaining allowance, race condition |
| 9 | Event log and indexer | UI state is often observed, not read from magic. | Receipt observation pipeline with indexed topics and confirmation gate. | topics, data, indexed params, blockNumber, txHash, logIndex, confirmations |
| 10 | Bridge lock/mint | Assets do not teleport between chains. | One-way escrow, finalized event, proof verification, mint path. | source tx, lock event, relayer, proof, destination contract, mint, finality delay |
| 11 | Bridge burn/release | Exit flow is a guarded state machine. | Terminal state machine with replay-protected nonce. | burn, message, proof, escrow, release, nonce, replay protection |
| 12 | Light-client bridge | Proof verification depends on headers and validator/sync proofs. | Verification cutaway: header root, receipt proof, validator proof. | block header, state/receipt root, Merkle proof, validator set, sync committee |
| 13 | Optimistic bridge | Finalization waits for dispute windows. | Challenge-window hourglass with finalize/reject branch. | assertion, challenge period, fraud proof, watcher, finalize, withdrawal delay |
| 14 | Rollup batch posting | L2 state is compressed into L1 commitments/data. | Compression pipeline split into inbox commitment and blob data availability. | sequencer, L2 txs, batch, state root, calldata/blob, L1 contract, batch index |
| 15 | ZK rollup proof | L1 verifies a proof, not every L2 transaction. | Sealed circuit funnel into verifier keyhole with verification key. | execution trace, witness, prover, proof, verifier contract, public inputs, state root |
| 16 | MEV/PBS | Block content can be an auctioned bundle market. | Auction floor with multiple builders, relay bid comparison, blinded block reveal. | bundle, bid, block value, relay, proposer payment, inclusion risk |
| 17 | AMM swap | AMM price changes with reserves, not an order book. | Constant-product curve with moving point and reserve ledger. | x*y=k, reserve0, reserve1, amountIn, amountOut, fee, price impact, slippage |
| 18 | Staking/slashing | Validator life is not only passive yield. | One-way validator lifecycle with penalty branch. | deposit 32 ETH, activation queue, attestation, proposal, inactivity leak, slashing, exit |
| 19 | Reorg/finality | The head can move while finalized checkpoints stay fixed. | Branch tree with head/safe/finalized anchors and attestation weights. | head, safe block, finalized block, fork choice, justified checkpoint, reorg depth |
| 20 | TLS 1.3 and TCP/IP | Certificates authenticate; TCP/IP encapsulates. | Key schedule plus nested envelope stack connected by TLS record placement. | ClientHello, ServerHello, certificate, ECDHE, transcript hash, traffic keys, TCP/IP fields |

## Global Rejections

- Horizontal box flow as the primary layout.
- One global cloud hiding local state or trust boundaries.
- Same graph layout repeated with new labels.
- A diagram with no numeric/data fields when the concept depends on numbers.
- A diagram that is beautiful but cannot answer "what state changed?"
