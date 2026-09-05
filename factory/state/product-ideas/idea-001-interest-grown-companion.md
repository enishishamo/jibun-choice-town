# PRODUCT_IDEA: 「興味から育つ何か」（仮称）

- status: **DESIGN_RESERVED / HUMAN_EXPLORATION_REQUIRED**
- 記録日: 2026-09-04
- 起票者: Human（Product Identity Gate導入時のHuman Review内で記録指示）
- カテゴリ: brand character / mascotの新設、collection system、育成system、
  子どもの興味を扱うsystemに該当する可能性があるため、
  `factory/rules/product-identity-gate.md` の対象。

**重要: これは採用決定ではない。** AIはこのアイデアについて、具体的な形態
（キャラクター／生き物／植物等）・色の意味・興味カテゴリの分類基準・
成長/獲得ルールのいずれも勝手に決めてはいけない。

## Human Ideaの原文（現時点の粒度のまま記録）

子どもがJIBUN CHOICEでさまざまな出来事・仕事に触れる。その中で興味を
持ったことの蓄積から、何らかの「成分」が集まる。その蓄積によって、
自分だけの何かの

- 形
- 色
- 特徴

などが変化・成長する可能性。

## 目的仮説（Humanが提示したもの、確定ではない）

- 継続して遊びたくなる
- 自分の探索履歴が残る
- 興味の蓄積を可視化できる
- 「あなたは○○タイプ」と固定的に分類しない
- 自分だけのものを育てる楽しさ

## 未決定の論点（意図的に空欄）

- 「成分」「何か」が指す実体（キャラクター？生き物？植物？抽象的な図形？）
- 蓄積の可視化方法（Home上のUI、専用画面、通知等）
- 興味カテゴリの分類軸（そもそも分類するのか、しないのか）
- 成長/変化のルール（線形か、選択に応じた分岐か、ランダム性の有無）
- True Home（`src/screens/HomeScreen.tsx`）とのUI上の関係
- 「毎日のチャレンジ」（True Homeで場所のみ確保済み、
  `factory/state/expansion/mobile-map-repair-2026-09-04.md` 参照）との
  統合可能性の有無

## 次のステップ（AIが実行してよい範囲）

- RESEARCH: 類似する既存プロダクトの「興味/行動の蓄積が可視化される」
  UXパターンの調査
- IDEATION / OPTIONS / PROS-CONS: 複数の具体化案（形態・分類軸・UI）の提示
- PROTOTYPE PROPOSAL: 紙芝居レベルのモックアップ提案

上記いずれも、SELECT（一案への決定）・IMPLEMENT・GENERATE PRODUCTION
ASSET・MERGE INTO PRODUCTは含まない。それらは人間の明示承認後に別途行う。
