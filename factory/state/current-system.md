# Current System Inspection — 2026-09-02

Harness Bootstrap 開始時点の repo 現状把握。Source of truth は repo の実コード。

## Git

- branch: `feature/harness-bootstrap`（`feature/shop-opening` から作成、作業前 working tree clean）
- 直近: f1e74ff（shop-opening画像再分類）/ 5fc5d21（画像生成パイプライン）/ 07dc80c（shop-opening実装）/ dc1c5ff（Factory v0.1 initial setup）

## アプリ本体（src/）

- React 19 + Vite 8 + TypeScript 6。追加ランタイム依存なし。scripts: dev / build(tsc -b && vite build) / lint(oxlint) / preview
- `src/q1/` — Q1ゲームコンポーネント39本 + 共有基盤（gameTypes.ts / useDragDrop.ts / InfoCards.tsx / registry.ts）
- `src/q1/registry.ts` — gameType（メカニクス名）→ コンポーネントの registry。39 gameType 登録済み
- `src/data/content/` — 7世界: townEvent / medical / priceHike / schoolLunch / schoolTrip / extremeHeat / shopOpening
- `src/screens/` — Home / Area / Profession / Q1 / Zukan
- `src/state/GameState.tsx` — 進行状態

## Factory（factory/）

- `MASTER.md` — パイプライン正本。/new-world（GATE1/2で人間停止）+ /generate-art（有料API・毎回HUMAN_REQUIRED）
- `rules/` — principles / research-rules / game-design-rules / qa-rules / art-style
- `database/` — スキャン自動生成（events / jobs / mechanics / registry-snapshot）。手編集禁止、`scripts/update-factory-db.mjs` で再生成
- `taxonomy/component-reviews.json` — Layer 2 Semantic Code Review。39ゲーム全てに C_required / action_changes_result / retry / fixed_progression / obvious_binary_choice を file:line 根拠 + reviewedHash 付きで記録済み
- `scripts/` — scan-existing-games / validate-factory-data / update-factory-db / art-generate / art-qa / art-check-links（全てNode・追加依存なし）
- `projects/shop-opening/` — research / design / critic-review / art-manifest / implementation-plan / qa-report / audit-01

## エージェント・コマンド（.claude/）

- agents: jc-planner / jc-researcher / jc-game-designer / jc-critic / jc-art-director / jc-final-qa
- commands: /new-world, /generate-art

## 既存レビューから見える弱点ゲーム（監査候補）

component-reviews.json の Layer 2 判定より:

| gameType | 問題 |
| --- | --- |
| xray_shoot (XrayGame) | fixed_progression: yes / obvious_binary_choice: yes（実質3択）/ action_changes_result 限定的 |
| sow_and_grow (FarmGame) | C_required: no（3品種の総当たりで資料を読まずにクリア可能） |
| lab_check (LabCheckGame) | action_changes_result: no（順序の自由度のみ、3検査全部必須） |

## Codex 連携の現状（Bootstrap 開始時）

- Codex CLI: 未インストールだった → `npm install -g @openai/codex`（無料パッケージ）で codex-cli 0.152.0 導入
- 認証: ChatGPT アカウント OAuth（月額契約内・APIキー不使用）。`~/.codex/auth.json` に保存される
- ChatGPT デスクトップアプリ（com.openai.chat）に codex-environments データあり → Codex 利用契約は確認済み
- Claude Code plugins: 未導入（official marketplace のみ登録）。codex-plugin は使わず `codex exec` サブプロセス経路を採用（後述 harness/ 参照）

## 制約（ABSOLUTE RULES の再確認）

- OpenAI/Anthropic API 等の従量課金 API 禁止。Codex は ChatGPT 契約内の CLI のみ
- remote push 禁止 / irreversible 削除禁止 / 既存変更を消さない
- 画像生成（/generate-art）は有料 API のため常に HUMAN_REQUIRED（既存設計どおり）
