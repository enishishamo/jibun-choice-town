# Factory v0.1 自己監査（2026-08-27）

前提: このFactoryを今後50〜100ゲームの制作に使うと仮定して批判的に評価する。
「作ったので問題ない」を前提にしない。

## かなり信頼できる部分

- **Layer 1 スキャナの抽出精度。** 正規表現の推測ではなく実TSモジュールを
  トランスパイルして読むため、A/B/E・seeds・discoveryEcho・FACT CHECK TODO の
  抽出に捏造の余地がない。抽出不能項目は unknown と明記され、validate が
  参照整合性を毎回検査する（現在エラー0）。
- **Layer 2 の根拠強制。** component-reviews.json の全34エントリが file:line の
  evidence を持ち、reviewedHash によりコンポーネント変更時に STALE 警告が出る。
  「昔のレビューを信じ続ける」事故は構造的に起きにくい。
- **Critic の検出力（実証済み）。** 猛暑編への実適用で、データDBからは見えない
  power-heat の固定クリアBLOCKER、urban-heat の「チェックリストUIが進行条件に
  なっていない」乖離を検出できた。検出対象（固定クリア・C不要・2択）が
  実在の失敗パターンと一致していることを確認済み。
- **安全設計。** GATE 1/2 の停止、implementation-plan.md までで止まる v0.1 の
  安全弁、既存編の変更禁止、DB生成物の手編集禁止。初期構築を通して src/ への
  変更ゼロを維持できた（git で検証済み）。

## まだ弱い部分

- **Layer 2 は再レビューが人力。** STALE検知はあるが、再レビュー自体は Critic /
  Final QA の実行が必要。50〜100ゲーム規模でコンポーネント改修が続くと、
  レビュー負債がたまり得る（検知はされるので「静かに腐る」ことはない）。
- **実務一致（20点）は research.md がある新作にしか適用できない。**
  既存34ゲームの事実正確性は未検証のまま（fact-check TODO の2ファイル分だけ
  不確実性が既知）。既存ゲームの遡及ファクトチェックは別プロジェクトになる。
- **jobs.json の domain が全件 unknown。** 職業ドメインの分類軸を決めていないため、
  Planner の「職業の偏り把握」が displayName の目視頼み。数世界作ると効いてくる。
- **semantic review のキーが gameType 単位。** 現状は Q1:gameType が1:1なので
  問題ないが、メカニクス再利用（registry.ts の設計意図）が始まると、同じ
  コンポーネントでも Q1 ごとに C の効き方が変わりうる。その時はキーを
  experienceId 単位へ拡張する必要がある。
- **registry.ts のパースが正規表現ベース。** 現在の整形済みフォーマット前提。
  書式が崩れると取りこぼす（validate の snapshot 突合で件数ズレとして検出は
  される）。
- **design.md / research.md の書式が規約文書内の箇条書きのみ。** 最初の新作で
  Designer / Critic 間の形式ブレが起きたら、その実物をテンプレとして
  projects/_templates/ に昇格させるのが現実的。

## 新世界制作開始前に直すべき BLOCKER

**なし。** 前回監査時点では「Semantic Review の陳腐化を検知できない」が
BLOCKER 候補だったが、reviewedHash による STALE 検知を実装済み。
残る弱点はすべて「最初の新作を1本作る」を妨げない。

## 後回しでよい改善（優先度順）

1. jobs.json の domain 分類軸の設計（2〜3世界作って傾向が見えてから）
2. design.md / research.md のテンプレ化（最初の新作の実物を雛形に）
3. semantic review キーの experienceId 化（メカニクス再利用が始まったら）
4. 既存34ゲームの遡及ファクトチェック（Researcher の事後調査）
5. art-manifest.json のスキーマ検証スクリプト（manifest 運用が始まってから）
6. 画像生成APIの接続（v0.2以降の判断）

## 過剰設計になっていないか

- **taxonomy 16種に対し primary で使われたのは12種**（tap_select /
  document_check / conversation_observation / prioritization は secondary のみ）。
  現状はやや余裕があるが、「会話・探索・優先順位系が少ない」という偏りを
  検出するための枠なので意図的に残す。新カテゴリ追加は根拠必須で抑制済み。
- **registry-snapshot.json は他3ファイルと情報が重複する。** ただし「生に近い層」
  として突合検証（validate）に使っており、削ると整合性チェックが弱くなるため維持。
- **エージェント6体は多い**が、責務が1文書1出力に対応しており統合の利益が薄い。
  現時点で統合しない。
- update-factory-db.mjs は scan+validate の薄いラッパで妥当。
- **やりすぎ回避として意図的に作らなかったもの**: TS AST 完全解析による
  C/D 自動判定（誤検出リスクが高く、Layer 2 の人間可読な根拠つきレビューの方が
  信頼できる）、CI 連携、画像生成パイプライン。
