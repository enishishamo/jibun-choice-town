// Theme module: 「たまに止まる」の犯人さがし（factory/projects/game-studio/design.md）
// The demo build of a town studio's new game got rough feedback. Facts:
// factory/projects/game-studio/research.result.json
// Fairness rules: no single industry pass-value for clear rates; QA testers
// don't decide release alone; fun ≠ easy.
import type { ContentModule } from "../types";

const R = (n: string) => `${import.meta.env.BASE_URL}assets/studio/${n}.png`;

const hero = (emoji: string, bg: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'><circle cx='80' cy='80' r='74' fill='${bg}'/><text x='80' y='106' font-size='72' text-anchor='middle'>${emoji}</text></svg>`,
  );

export const studio: ContentModule = {
  places: [
    {
      id: "town-game-studio",
      name: "駅前のゲームスタジオ",
      eventId: "game-studio",
    },
  ],

  events: [
    {
      id: "game-studio",
      placeId: "town-game-studio",
      title: "「たまに止まる」の犯人さがし\n発売まで、あと3日",
      shortLabel: "ゲームの3日間",
      areaName: "スタジオのフロア",
      sceneMap: {
        image: R("scene-studio"),
        opening: {
          image: R("ba-before"),
          lines: [
            "体験版の感想が届いた。「おもしろい！」…だけじゃなかった。",
            "「たまに止まる」「むずかしすぎ」「ボタンをまちがえる」——発売まで、あと3日。",
          ],
          cta: "中へ入る",
        },
      },
      areaLead: "ゲームは「作って終わり」じゃない。\n見つける→調整する→整える。発売前の3つの仕事へ。",
      incidents: [
        {
          id: "ch1",
          scenePos: { left: "20%", top: "40%" },
          emoji: "🔎",
          title: "① 「たまに止まる」をつかまえろ",
          experienceId: "studio-repro",
        },
        {
          id: "ch2",
          scenePos: { left: "52%", top: "58%" },
          emoji: "📊",
          title: "② 「むずかしすぎ」の正体をさがせ",
          experienceId: "studio-tune",
          requires: ["studio-repro"],
          requiresHint: "まず①で、止まる不具合を直そう。",
        },
        {
          id: "ch3",
          scenePos: { left: "80%", top: "36%" },
          emoji: "🎨",
          title: "③ 「まちがえない画面」に直せ",
          experienceId: "studio-ui",
          requires: ["studio-tune"],
          requiresHint: "遊びが直ったら、画面の番。",
        },
      ],
      lensSummary: {
        intro: "同じ「つまらない」の声を、3つの仕事はちがう問題として読んでいた。",
        rows: [
          { icon: "🔎", label: "QA", view: "1回に1条件。だれでも再現できる手順にする" },
          { icon: "📊", label: "プランナー", view: "どこで・どうやって失敗したか。HP下げは最後" },
          { icon: "🎨", label: "UI", view: "足すほど散らかる。報告と直しは1対1" },
        ],
      },
      wrapUp: {
        beforeAfter: {
          before: R("ba-before"),
          after: R("ba-after"),
          beforeLabel: "3日前：💥の報告と、しかめっつらのテスター",
          afterLabel: "発売の夜：画面には💥のかわりに、明るいゲーム",
        },
        title: "「おもしろい」は、直した人たちの合作だった。",
        lines: [
          "不具合を手順に変えた人。ログから原因を見抜いた人。まちがえない画面にした人。",
          "エンドロールに出る名前は、ぜんぶ「直した人」の名前でもあるんだ。",
          
        ],
      },
    },
  ],

  professions: [
    {
      id: "studio-qa",
      name: "QAテスター（品質チェック）",
      catch: "「たまに」を「必ず」に変える再現の職人",
      image: hero("🔎", "#dde9f5"),
      discoveryLine: "不具合を最短の手順にしぼりこんで、\n開発チームに届ける仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "🔎",
          body: [
            "発売前のゲームを、仕様書とテスト計画にそって確かめます。",
            "見つけた不具合は、｜不具合票《ふぐあいひょう》に。手順・期待した結果・実際の結果・頻度を書きます。",
          ],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "上手なテスターは「たまに止まる」で終わらせません。条件を1つずつ変えて、最短の｜再現手順《さいげんてじゅん》を探します。",
            "「好みの違い」と「不具合」を分けて報告するのも、大事な腕なんです。",
          ],
        },
        {
          id: "who", title: "だれがやっている？", icon: "🧩", body: [],
          list: ["ゲーム会社のQAチーム", "テスト専門の会社", "機種ごとの確認は分担して"],
        },
      ],
      related: ["ソフトウェアの検証の仕事", "製品の品質管理", "校正・校閲の仕事"],
    },
    {
      id: "studio-planner",
      name: "ゲームプランナー（難易度調整）",
      catch: "「悔しい！もう1回」を設計する人",
      image: hero("📊", "#f5ecd8"),
      discoveryLine: "プレイログを読んで、\nちょうどいい手ごたえを作る仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "📊",
          body: [
            "パラメータ表——敵の強さ、出てくる数、報酬——を預かる係です。",
            "体験版のログで、クリア率や失敗した場所を読み、どこを直すか決めます。",
          ],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "「クリア率は何%なら合格」という業界共通の数字は、ないんです。対象年齢とステージの役割で、チームごとに決めます。",
            "敵のHPを下げるのは最後の手。予告・道しるべ・操作を先に疑います。",
          ],
        },
        {
          id: "who", title: "だれがやっている？", icon: "🧩", body: [],
          list: ["ゲーム会社のプランナー", "レベルデザインの担当", "大きな変更はディレクターと合意して"],
        },
      ],
      related: ["ボードゲームを作る仕事", "教材を設計する仕事", "データ分析の仕事"],
    },
    {
      id: "studio-ui",
      name: "UIデザイナー（画面・操作設計）",
      catch: "「まちがえない画面」を作るデザイナー",
      image: hero("🎨", "#e8e0f0"),
      discoveryLine: "ボタンの場所から文字の大きさまで、\n遊びやすさをデザインする仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "🎨",
          body: [
            "画面のつくり——ボタン配置、文字サイズ、色——を設計図にします。",
            "きまりの例：文字と背景の｜コントラスト《こんとらすと》（明るさの差）を4.5対1以上に。",
          ],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "色だけで敵味方を区別しないのが鉄則。色の見え方は、人によってちがうから。",
            "情報は足すほど説明できる。でも足すほど画面は散らかる。「今いる情報だけ」が腕の見せどころ。",
          ],
        },
        {
          id: "who", title: "だれがやっている？", icon: "🧩", body: [],
          list: ["ゲーム会社のUIデザイナー", "アプリの画面を作るデザイナー", "サウンド担当と協力して手ざわりを作る"],
        },
      ],
      related: ["Webデザインの仕事", "サウンドデザイナー", "案内サインを作る仕事"],
    },
  ],

  experiences: [
    {
      id: "studio-repro",
      professionId: "studio-qa",
      eventId: "game-studio",
      gameType: "bug_repro",
      place: { name: "テストルーム", image: R("scene-studio"), fit: "cover", focus: "20% 42%" },
      mission: {
        title: "「たまに止まる」を、必ず止まる手順に",
        lines: [
          "テスト機を使えるのは6回。条件の組み合わせで実験しよう。",
          "最短の手順をつきとめたら、不具合票を書く。",
        ],
        deadline: "今日の開発会議まで",
      },
      tools: [
        { id: "bench", name: "テスト機", emoji: "🖥", desc: "条件を変えて動かす" },
        { id: "sheet", name: "不具合票", emoji: "📝", desc: "手順・期待・実際・頻度" },
        { id: "build", name: "体験版ビルド", emoji: "💿", desc: "番号つきの検証版" },
      ],
      resolution: {
        clock: "昼",
        title: "票が受理され、開発が動いた",
        lines: ["夕方には、修正ビルドが届いた。"],
      },
      discoveryEcho: "きみがさっき「1つずつ変えて」試したよね。あの実験のやり方が武器になる仕事があるんだ。",
      seeds: ["条件をそろえて試す実験", "ねばり強くしぼりこむ集中", "だれかが直せる形にする親切"],
    },
    {
      id: "studio-tune",
      professionId: "studio-planner",
      eventId: "game-studio",
      gameType: "difficulty_tune",
      place: { name: "プランナー席", image: R("scene-studio"), fit: "cover", focus: "52% 55%" },
      mission: {
        title: "「むずかしすぎ」の原因を、ログでつきとめる",
        lines: [
          "クリア率だけじゃない。どこで・どうやって失敗したかを読む。",
          "原因に合う調整を選ぼう。ズレた調整は数字が動かない。",
        ],
        deadline: "再テストの枠は2回",
      },
      tools: [
        { id: "log", name: "プレイログ", emoji: "📈", desc: "失敗地点・死亡回数・離脱" },
        { id: "params", name: "パラメータ表", emoji: "🧮", desc: "敵HP・速度・報酬の一覧" },
        { id: "voice", name: "テスターの声", emoji: "💬", desc: "数字にならない手ざわり" },
      ],
      resolution: {
        clock: "夕方",
        title: "「悔しい、もう1回！」の声が聞こえた",
        lines: ["かんたんにしたんじゃない。伝わるようにしたんだ。"],
      },
      discoveryEcho: "きみがさっき「なぜ失敗したか」から考えたよね。あの読み方で遊びを作る仕事があるんだ。",
      seeds: ["数字の裏の気持ちを読む", "ちょうどいい、を探す調整", "遊ぶ人を想像する力"],
    },
    {
      id: "studio-ui",
      professionId: "studio-ui",
      eventId: "game-studio",
      gameType: "ui_clarity",
      place: { name: "デザイン席", image: R("scene-studio"), fit: "cover", focus: "80% 38%" },
      mission: {
        title: "報告3件に合わせて、画面を直す",
        lines: [
          "直しは3つまで。足すほど画面は散らかる。",
          "報告と直しを、1対1でつなげよう。",
        ],
        deadline: "夜の再テストまで",
      },
      tools: [
        { id: "wire", name: "画面設計図", emoji: "📐", desc: "ボタンと情報の配置図" },
        { id: "system", name: "デザインシステム", emoji: "🎨", desc: "色・形・文字のきまり" },
        { id: "reports", name: "テスト報告", emoji: "📮", desc: "今日直すべき3件" },
      ],
      resolution: {
        clock: "夜",
        title: "「見やすい！」——再テスト通過",
        lines: ["画面は静かになった。遊びが、前に出てきた。"],
      },
      discoveryEcho: "きみがさっき「足さない」勇気を出せたよね。あの引き算のセンスが光る仕事があるんだ。",
      seeds: ["まちがえない仕組みづくり", "引き算のデザイン", "見え方の個人差への想像力"],
    },
  ],
};
