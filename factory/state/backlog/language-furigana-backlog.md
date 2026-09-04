# Language / Furigana 改善 backlog（Track B）

2026-09-04 制定。Stable Prototype公開のためのふりがな修正は「主要導線上の
致命的な読みづらさ」のみに絞った（`../release/two-track-model.md` 参照）。
それ以外の網羅的な改善はここに積み、Development Trackで気長に進める。

## Items

| id | 内容 | 根拠 | 優先度 | status |
|---|---|---|---|---|
| furigana-full-q1-pass | 全63 Q1ゲームコンポーネントのうち `withRuby` を import していないものが約50個ある（`factory/state/language-audit/ruby-coverage-scan.md`）。専門語・判断に関わる語を中心に、コンポーネント単位で読み直してふりがなを追加する。 | language-in-context-qa 4round目でも FURIGANA_RENDERED_IN_CONTEXT が閾値(80)未達（68点） | MEDIUM | open |
| furigana-home-nav | ホームの地名・誘導文（「丘の上」「森と川」「駅前」「港」「気になったところへ行ってみよう」等）に読み仮名が無い。基礎的な漢字が多く小学5-6年には問題ないが、3年生が一人で読む場合は詰まる可能性がある、と4round目のCodex QAで指摘。 | language-in-context-qa-result.json（4round目 q_a_answer） | LOW | open |
| furigana-jargon-short-gloss | 「B類型」「溶存酸素」「NPO法人」「公的事業」など、ふりがなは付いていても即座に分かる短い言い換えが不足している語がある。 | 同上 medium findings | LOW | open |

## 関連する既存backlog

- `factory/state/expansion/language-backlog.json` — 文章密度（TOO_LONG等）の
  既存スキャン結果。ふりがな網羅とは別軸だが、同じLanguage UX改善作業の
  一部として一緒に見直すとよい。

## 進め方

- 一度に全部やらない。1〜2画面/世界ずつ、`language-in-context-qa.mjs` で
  before/after のスクリーンショットを撮って再検証しながら進める。
- 既存の `factory/rules/language-style.md` の較正ルール（専門語は残す、
  ひらがな化しない、読みやすさはルビ+短い説明で担保する）を必ず読み直してから着手。
