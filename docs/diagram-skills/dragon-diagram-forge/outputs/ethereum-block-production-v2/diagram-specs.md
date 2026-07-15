# Diagram Specs: Ethereum ブロック生成

Status: content review pending.

## Goal

Ethereum のブロック生成を「横並びフロー」ではなく、slot 内の生成・検証・投票と、epoch 単位の finality を分離して理解できるようにする。

## Visual Structure

- Top left: 12秒 slot clock and proposer spotlight
- Center: active scene stage with one dominant mechanism
- Right: current data inspector for exact protocol values
- Bottom: separate finality rail that is quiet until scene 5
- Navigation: scene buttons, not a single crowded all-at-once figure

## Scenes

1. Slot clock and proposer selection
2. Execution payload assembly
3. Beacon block proposal and gossip
4. Validation, attestation, and fork-choice head
5. Epoch checkpoints and finality

## Required Labels

- `slot = 12s`
- `epoch = 32 slots`
- `proposer`
- `execution payload`
- `beacon block`
- `engine_newPayload`
- `engine_forkchoiceUpdated`
- `payload build request`
- `payload retrieval`
- `payloadStatus = VALID`
- `attestation`
- `fork-choice head`
- `justified`
- `finalized`
- `2/3 stake`

## Rejections

- Do not show a simple `tx -> block -> chain` row.
- Do not imply inclusion equals finality.
- Do not make attestation look like execution.
- Do not hide `stateRoot`, `receiptsRoot`, or `gasUsed` when showing payload assembly.
- Do not show finalized checkpoint moving during slot-local scenes.

## Sources

- Ethereum.org Proof-of-stake: slots are 12 seconds, epochs are 32 slots, proposers are selected per slot, committees attest, finality uses checkpoint votes and 2/3 stake.
- Ethereum.org PoS transaction execution: execution payload is built by execution client, wrapped into beacon block by consensus client, peers re-execute/validate and attest.
