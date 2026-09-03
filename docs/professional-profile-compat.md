# REAL PROFESSIONAL PROFILE — 将来互換の設計メモ（§29 / DESIGN_RESERVED）

状態: **実装しない**（World Expansion v1 時点）。本メモはデータモデルの
非破壊性の確認と、将来の拡張点の予約のみを行う。

## 絶対禁止（恒久）
AIで架空の専門家プロフィール（氏名・経歴・年収・顔写真等）を生成し、
実在データのように表示すること。将来の実装は「実在の職業人の同意済み
データ」または「出典明示の統計データ」のみを扱う。

## 現行データモデルとの互換性
- `ContentModule.professions[]` は id で参照される追加専用の配列。
  将来 `professional_profiles?: ProfessionalProfile[]` を profession 単位で
  optional 追加しても、既存の描画（q2/related/catch）は影響を受けない。
- レーダー軸・円グラフ分類・年収などの既存メトリクスは §29 の指示どおり
  本サイクルでは修正・追加しない。
- 予約フィールド（実装時に追加する想定・現時点では未定義のまま）:
  `professional_profiles[] = { source_type: "consented_interview" | "public_stats",
  source_ref, consent_ref?, display_fields[] }`
  ※ optional なので既存 world のデータ変更は不要（非破壊）。

## フラグ
REAL_PROFESSIONAL_PROFILE = DESIGN_RESERVED（実装なし・架空生成なしを確認済み）
