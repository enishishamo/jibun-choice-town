# Home — Auto Review Team 記録（2026-09-06）

`factory/rules/visual-production-flow.md`の初回適用。Direction GateはHome
Design Reviewで完了済み（Human Decision: C65% Playful Diorama + B25% Game
Start + A10% World Is The Hero）につき、GATE 1を省略しFactory制作→Auto
Review→QAまで実行。

## 実装

- 背景: `blur(11px)`→`blur(3px)`、mask fadeを60%→74%へ後退させ、Worldを
  「街と認識できる」程度に保持。マスク上に暖色scrimレイヤーを重ね、
  見出しの可読性を（ぼかしではなく色帯で）担保。
- 見出し: 24px/800→30px/900、hard offset text-shadow（poster的表現）へ。
  回転・script体は使わず「大胆だが手書きではない」を維持。
- CTA: `home-card-primary`（角丸フルブリード写真card）を廃止し、
  `home-hero`（tilt付きcream枠のWorld window + 逆tiltのorange PLAY
  banner、offset shadow）へ置換。1 buttonで1 nav actionを維持。
- secondary bar: 枠を太く／暖色化し同じ素材言語へ寄せたが、サイズ・
  weightは変更せず主CTAとの階層差を維持。

## Auto Review Team（5視点、自己批評）

- Kids UX: 配色が鮮やかになり、touch target・情報量は変更なしで良好
- Game Experience: PLAY bannerが独立CTAとして明快、breathing animation維持
- Art Director: 写真＋UI chrome双方がdiorama/flyerの collage言語を共有——
  「写真だけJC、周囲generic」の解消を確認
- Mobile UI (375px): 階層・余白・タップ領域良好、下部の死んだ空間なし
- Independent Critic: pill/角丸への均一依存を脱却。tilt角は控えめ（-1.6°/
  +0.9°）で「崩れて見える」リスクを回避。secondary barは意図的に控えめな
  ままで問題なし

**判定**: PASS（BLOCKERなし）。AUTO REPAIRは実行せず。

## QA

- `npx tsc --noEmit`: clean
- `npm run build`: clean
- `factory/harness/public-safety-smoke-qa.mjs --viewport both`: 0 blocker、
  14/14 world、trueHome brokenImages=0
- `factory/harness/gesture-arbitration-qa.mjs`: 5/5 PASS、
  ACCIDENTAL_ACTIVATION_RATE=0
- Home→しごと図鑑 遷移: 動作確認、console error 0件

## 残課題（V2 backlogへ、blockerではない）

- secondary barのsticker化（現状は据え置き、意図的判断）
- tilt角をさらに強めるかはPolish判断（現状は保守的に設定）
