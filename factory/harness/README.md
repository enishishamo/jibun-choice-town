# JIBUN CHOICE Harness（Bootstrap 版）

Produce → Independent Review → Repair → Re-review の最小自動ループと、
Harness 自身の構築を Stage 単位で自律的に進める Stage Manager。
設計原則の正本は [design-principles.md](design-principles.md)。

## 役割分担

- **Claude Code（Max 契約）** = Builder / Repairer。実装・修理・ループの駆動
- **Codex CLI（ChatGPT 契約・OAuth）** = Independent Reviewer。`codex exec --sandbox read-only`
  で repo を直接読んで採点する。Claude の自己評価は渡さない
- 従量課金 API は一切使わない。Codex 認証は `codex login`（ChatGPT アカウント）のみ

## 構成

| ファイル | 役割 |
| --- | --- |
| `codex-review.mjs` | Codex adapter。prompt を渡し structured verdict JSON を取得。timeout / unavailable / unauthenticated / malformed を構造化して返す（fail-open しない） |
| `loop.mjs` | ループ状態機械。run record（run_id / phase / iteration / verdict / issues / repair_actions / stop_reason）と append-only ログを `factory/state/runs/` に保存。max_iterations 到達時は auto-PASS せず明示停止 |
| `stage-manager.mjs` | Stage 0〜8 の進行管理。dependency 充足チェック・次 Stage 自動判定・repair 回数・stop reason |
| `test-failure-modes.mjs` | 偽 codex シムで障害系を決定論的にテスト（5ケース） |
| `../state/stages.json` | Stage 状態（CLI 経由で編集） |
| `../state/runs/` | 全 run の状態・ログ・レビュー結果 |

## ループの使い方

```
node factory/harness/loop.mjs start --task "..." --artifact src/q1/X.tsx --max-iterations 3
# -> run_id
node factory/harness/loop.mjs produce-done <run_id> --notes "..."
node factory/harness/loop.mjs review <run_id> --prompt-file <review-prompt.md>
# verdict FAIL -> phase: repair
#   （Claude が修理し build/lint を通す）
node factory/harness/loop.mjs repair-done <run_id> --actions "..."
node factory/harness/loop.mjs review <run_id> --prompt-file <review-prompt.md>
# verdict PASS -> stop_reason: passed
```

## 安全設計

- Reviewer 停止・timeout・不正出力 → run は `reviewer_failure:*` で**明示停止**し
  verdict は HUMAN_REQUIRED になる。PASS 扱いは構造的に不可能
- BLOCKER / HIGH が残った PASS は adapter が機械的に FAIL へ降格
- max_iterations 到達 → `max_iterations_reached` で停止（auto-PASS しない）
- 無限ループなし・remote push なし・irreversible 操作なし

## Stage Manager の使い方

```
node factory/harness/stage-manager.mjs status      # 全 Stage 一覧と次の行動
node factory/harness/stage-manager.mjs next        # 次に実装すべき Stage（JSON）
node factory/harness/stage-manager.mjs set 0 passed
node factory/harness/stage-manager.mjs attach-run 0 <run_id>
```

各 Stage は IMPLEMENT → SELF TEST → INDEPENDENT REVIEW → REPAIR → RE-TEST → PASS →
NEXT STAGE で進める。依存 Stage が passed になるまで `set <id> in_progress` は拒否される。
