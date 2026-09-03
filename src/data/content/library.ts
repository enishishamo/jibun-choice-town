// Theme module: 100年前の写真のなぞ（factory/projects/library-detective/design.md）
// A mystery brought to the library counter. Facts:
// factory/projects/library-detective/research.result.json
// Fairness rules: one lookalike clue never confirms a place; "推定" and
// 「わからない」 are honest professional answers, not failures.
import type { ContentModule } from "../types";

const R = (n: string) => `${import.meta.env.BASE_URL}assets/library/${n}.png`;

const hero = (emoji: string, bg: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'><circle cx='80' cy='80' r='74' fill='${bg}'/><text x='80' y='106' font-size='72' text-anchor='middle'>${emoji}</text></svg>`,
  );

export const library: ContentModule = {
  places: [
    {
      id: "town-library",
      name: "まちの図書館",
      eventId: "library-detective",
    },
  ],

  events: [
    {
      id: "library-detective",
      placeId: "town-library",
      title: "100年前の写真のなぞ\n「ここはどこですか？」",
      shortLabel: "写真のなぞ",
      areaName: "図書館のバックヤード",
      sceneMap: {
        image: R("scene-library"),
        opening: {
          image: R("ba-before"),
          lines: [
            "おばあさんが、古い写真を1まい持ってきた。",
            "セピア色の街角。うら書きはなし。「ここがどこか、わかりますか？」",
          ],
          cta: "カウンターの奥へ",
        },
      },
      areaLead: "図書館は、本をかすだけの場所じゃない。\nなぞ解き→おあずかり→未来へのこす。3つの仕事をのぞこう。",
      incidents: [
        {
          id: "ch1",
          scenePos: { left: "22%", top: "38%" },
          emoji: "🔍",
          title: "① この写真は「どこ」だ？",
          experienceId: "library-clues",
        },
        {
          id: "ch2",
          scenePos: { left: "55%", top: "60%" },
          emoji: "🧤",
          title: "② こわさずに、あずかれ",
          experienceId: "library-rescue",
          requires: ["library-clues"],
          requiresHint: "まず①で、写真のなぞを調べよう。",
        },
        {
          id: "ch3",
          scenePos: { left: "80%", top: "34%" },
          emoji: "🖥",
          title: "③ 100年後へ、のこせ",
          experienceId: "library-archive",
          requires: ["library-rescue"],
          requiresHint: "あずかった資料が、そろってから。",
        },
      ],
      lensSummary: {
        intro: "1まいの写真を、3つの仕事はまったくちがう目で見ていた。",
        rows: [
          { icon: "🔍", label: "調べる", view: "手がかりはいくつ一致したか。1つでは断定しない" },
          { icon: "🧤", label: "まもる", view: "直すほど、こわすことがある。隔離と「そのまま」" },
          { icon: "🖥", label: "のこす", view: "わからないことは「ふめい」と正直に書く" },
        ],
      },
      wrapUp: {
        beforeAfter: {
          before: R("ba-before"),
          after: R("ba-after"),
          beforeLabel: "持ちこまれた日：カウンターに、なぞの古写真",
          afterLabel: "いま：根拠つきのラベルがついて、まちの記録になった",
        },
        title: "「どこですか？」の一言が、まちの宝を1つふやした。",
        lines: [
          "手がかりを照合した人。こわさずあずかった人。正直なラベルでのこした人。",
          "100年前の写真は、100年後のだれかへの手紙になった。",
          "きみの家のひきだしにも、まだ読まれていない手紙があるかもしれない。",
        ],
      },
    },
  ],

  professions: [
    {
      id: "library-reference",
      name: "司書（レファレンス・郷土資料担当）",
      catch: "本の森で謎を解く、調べもの探偵",
      image: hero("🔍", "#e8e0f0"),
      discoveryLine: "手がかりを資料と照合して、\n「どこ？」「なに？」を解く仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "🔍",
          body: [
            "「調べたいことがある」人の相談にのるのが、レファレンスという仕事。",
            "｜郷土資料《きょうどしりょう》——古い地図、新聞、写真帳——を照合して、答えの根拠を探します。",
          ],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "プロは「なんとなく」では答えません。分かったこと・｜推定《すいてい》・分からないことを、分けて答えます。",
            "検索の最初の候補にとびつかないのが、探偵とのちがいだそうです。",
          ],
        },
        {
          id: "who", title: "だれがやっている？", icon: "🧩", body: [],
          list: ["図書館のレファレンス担当", "郷土資料室の司書", "博物館の学芸員と協力することも"],
        },
      ],
      related: ["博物館の学芸員", "新聞記者の調査", "地図をつくる仕事"],
    },
    {
      id: "library-conservator",
      name: "資料保存・修復の担当者",
      catch: "「直さない」も選べる、紙の医者",
      image: hero("🧤", "#efe6d8"),
      discoveryLine: "こわれやすい資料を、\n100年先まで守る仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "🧤",
          body: [
            "古い写真や手紙をあずかり、状態を調べて、安全なしまい方を決めます。",
            "温度計としつ度計で、資料のへやの空気も見はっています。",
          ],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "テープやのりで直すのは、きんし。あとで取れなくなり、紙をいためるからです。",
            "「何もしないで記録だけ」が正解のことも多い。直すほど、こわすことがあるんです。",
          ],
        },
        {
          id: "how", title: "何を見ている？", icon: "🧩", body: [],
          list: ["紙のやぶれ・カビ・虫くい", "へやの温度としつ度", "台紙やうら書き（来歴の証拠）", "さわる前の手ぶくろ"],
        },
      ],
      related: ["美術品の修復家", "文化財を守る仕事", "製本・印刷の仕事"],
    },
    {
      id: "library-archivist",
      name: "デジタルアーカイブの担当者",
      catch: "100年後へ手紙を出す、記録の設計者",
      image: hero("🖥", "#dde9f5"),
      discoveryLine: "資料をデジタル化して、\n未来のだれかに届ける仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "🖥",
          body: [
            "資料をスキャンして、｜メタデータ《めたでーた》（資料の説明がき）といっしょに登録します。",
            "保存用の原本データと、みんなが見る閲覧用データは、分けてつくります。",
          ],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "場所が確定できない写真には「撮影地ふめい」と書きます。うそのない記録が、未来の調査を助けるからです。",
            "古い写真でも、人の顔が大きく写っていたら、すぐには公開しません。",
          ],
        },
        {
          id: "who", title: "だれがやっている？", icon: "🧩", body: [],
          list: ["図書館・博物館のデジタル化担当", "国立国会図書館のような大きな館", "スキャンの専門会社と分担することも"],
        },
      ],
      related: ["データベースをつくる仕事", "写真スタジオの仕事", "権利を扱う仕事"],
    },
  ],

  experiences: [
    {
      id: "library-clues",
      professionId: "library-reference",
      eventId: "library-detective",
      gameType: "photo_clues",
      place: { name: "郷土資料室の照合デスク", image: R("scene-library"), fit: "cover", focus: "22% 40%" },
      mission: {
        title: "写真の「どこ」を、資料でつきとめる",
        lines: [
          "手がかりは4つ。古い地図・名簿と照合できる。",
          "一致がいくつそろうかで、答え方が変わる。",
        ],
        deadline: "閉館まで",
      },
      tools: [
        { id: "map", name: "旧版地図", emoji: "🗺", desc: "むかしの道と地名" },
        { id: "roster", name: "商店の名簿", emoji: "📖", desc: "看板の店を調べる" },
        { id: "slip", name: "受付票", emoji: "📋", desc: "確認ずみ事項を記録" },
      ],
      resolution: {
        clock: "夕方",
        title: "回答は、根拠つきで手わたされた",
        lines: ["おばあさんは写真を、両手でそっと受け取った。"],
      },
      discoveryEcho: "きみがさっき「一致はいくつ？」と数えたよね。あの数え方で謎を解く仕事があるんだ。",
      seeds: ["手がかりを照合する推理", "断定しない誠実さ", "古い資料をたどる時間旅行"],
    },
    {
      id: "library-rescue",
      professionId: "library-conservator",
      eventId: "library-detective",
      gameType: "paper_rescue",
      place: { name: "保存作業室", image: R("scene-library"), fit: "cover", focus: "55% 58%" },
      mission: {
        title: "追加の持ちこみ5点、こわさずあずかる",
        lines: [
          "写真のうわさを聞いて、資料の持ちこみがふえた。",
          "1点ずつ状態を見て、処置を決めよう。",
        ],
        deadline: "今日の受入れぶん",
      },
      tools: [
        { id: "gloves", name: "手ぶくろ", emoji: "🧤", desc: "手のあぶらから守る" },
        { id: "brush", name: "やわらかい刷毛", emoji: "🖌", desc: "ほこりを、そっと" },
        { id: "paper", name: "中性紙の包み", emoji: "📦", desc: "長期保存の定番" },
      ],
      resolution: {
        clock: "夕方",
        title: "5点とも、安全に保存箱へ",
        lines: ["状態調査票が、次の担当への引きつぎになる。"],
      },
      discoveryEcho: "きみがさっき「直さない」を選べたよね。あのがまんが専門技術になる仕事があるんだ。",
      seeds: ["こわれものを扱う集中力", "「しない」判断の勇気", "道具と材料へのこだわり"],
    },
    {
      id: "library-archive",
      professionId: "library-archivist",
      eventId: "library-detective",
      gameType: "digi_archive",
      place: { name: "デジタル化スタジオ", image: R("scene-library"), fit: "cover", focus: "80% 36%" },
      mission: {
        title: "3点をデジタル化して、登録する",
        lines: [
          "用途に合う仕様で、正直なラベルをつけて。",
          "調査メモが、ラベルの根拠になる。",
        ],
        deadline: "公開会議の前まで",
      },
      tools: [
        { id: "scanner", name: "大型スキャナ", emoji: "🖨", desc: "光をおさえて読み取る" },
        { id: "chart", name: "カラーチャート", emoji: "🎨", desc: "色の基準をいっしょに写す" },
        { id: "guide", name: "デジタル化の手引き", emoji: "📘", desc: "dpiと形式のきまり" },
      ],
      resolution: {
        clock: "夜",
        title: "3点の登録が、終わった",
        lines: ["公開ほりゅうの写真も、権利がたしかめられたら公開される。", "「撮影地ふめい」の1点にも、いつか続報が届くだろう。"],
      },
      discoveryEcho: "きみがさっき「ふめい」と正直に書けたよね。あの正直さが信頼になる仕事があるんだ。",
      seeds: ["未来のだれかを想像する力", "きちんと分けて整理する楽しさ", "機械と紙の両方が好き"],
    },
  ],
};
