# JIBUN CHOICE 設計原則（全Agent共通・変更不可）

JIBUN CHOICEは「職業図鑑」ではない。

## 目的の流れ

知らない社会・出来事に出会う
→ とりあえず触る
→ 仕事特有の情報・道具を発見
→ それを使って考える／操作する
→ 結果が変わる
→ 必要なら再試行
→ 社会への変化を見る
→ 最後に仕事を知る（Job Reveal）
→ 「これ、ちょっと面白かったかも」に気づく

**職業名から始めない。**

## A→B→C⇄D→E スケルトン

| 層 | 意味 | 実装上の対応（src/data/types.ts） |
| --- | --- | --- |
| A | 場所・出来事 | `Q1Experience.place` / `AreaEvent` |
| B | 困りごと／達成したいこと | `Q1Experience.mission` |
| C | 仕事特有の専門性・道具・データ・基準・情報 | `Q1Experience.tools` またはゲームコンポーネント内のデータ表示（※） |
| D | Cを用いて行う判断・思考・操作 | `gameType` → `src/q1/registry.ts` のゲームコンポーネント |
| E | 結果として人や社会に起きた変化 | `Q1Experience.resolution` + イベントの `wrapUp` |

**最重要は C⇄D。** Cを見ないと解けない・Cを使うと結果が変わる、が成立していること。

※ 実態: データ層の `tools` を使うのは給食編のみ。猛暑編以降の5編は C を
ゲームコンポーネント内（WBGT表示・気温予報グラフ等）に実装している。
どちらの置き方でも「Cを見ないと解けない」が成立していれば原則には適合する。
ただしデータ層に C が無い場合、Factory の自動評価はコンポーネントコードの
確認まで必要になる（factory/projects/factory-test-extreme-heat.md 参照）。

- Job Reveal: `discoveryEcho`（きみがさっき〜したよね → 実はそれが…）
- interestSeeds: `seeds`（実際にプレイした行為のみ。適職判定には使わない）

## 禁止事項（CRITICのBLOCKER）

- 説明→次へ→説明→クリア（読むだけ進行）
- 明らかな正解だけの2択
- Cを使わなくても攻略できる
- 操作結果と無関係に固定クリア
- 職業名先出し
- 適職診断
- 失敗時に即答を文章で教える（ヒントは可、答えの直渡しは不可）
- 全ゲームを同じinteractionへ統一
- 実務主体を推測で断定（不明なら「〜に関わる仕事」と仮置きし fact-check フラグを残す）

## 規模感

- 1職種 1〜3分程度
- 1イベントあたり 4〜6職種を原則とするが、5に固定しない
- 対象は小4〜6。幼児向けにしない・少し大人っぽく

## Source of Truth

既存アプリの実コード（`src/data/content/*.ts` と `src/q1/registry.ts`）が正本。
`factory/database/` は検索・重複検知・制作履歴・比較のための索引にすぎない。
実コードとDBが食い違ったら実コードが正しい。`node factory/scripts/update-factory-db.mjs` で再同期する。
