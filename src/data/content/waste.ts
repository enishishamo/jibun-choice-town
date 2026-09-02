// Theme module: ごみのゆくえ・清掃工場編（factory/projects/waste/design.md）
// One bag of household garbage travels A→E: 集積所 → 清掃工場（ピット・炉・
// 中央制御室）→ 最終処分場。4つの仕事がリレーする。
// Facts: factory/projects/waste/research.result.json（環境省・自治体公開情報ベース。
// 残余年数 24.8年 = 2023年度実績・環境省）
import type { ContentModule } from "../types";

const W = (n: string) => `${import.meta.env.BASE_URL}assets/waste/${n}.png`;

// Interim discovery-hero (series precedent: profession cards keep SVG
// placeholders; the world's scenes are the generated art).
const hero = (emoji: string, bg: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'><circle cx='80' cy='80' r='74' fill='${bg}'/><text x='80' y='106' font-size='72' text-anchor='middle'>${emoji}</text></svg>`,
  );

export const waste: ContentModule = {
  places: [
    {
      id: "waste-plant",
      name: "清掃工場",
      eventId: "waste-journey",
      mapPos: { left: "19%", top: "40%" },
    },
  ],

  events: [
    {
      id: "waste-journey",
      placeId: "waste-plant",
      title: "けさ出した ごみ袋、\nそのあと どうなるか知ってる？",
      shortLabel: "ごみのゆくえ？",
      areaName: "ごみのゆくえ",
      sceneMap: {
        image: W("scene-journey"),
        opening: {
          image: W("ba-before"),
          lines: [
            "けさ、きみの家の前に出された1袋のごみ。",
            "夕方には消えている。……どこへ？ だれが？",
          ],
          cta: "この袋を、追いかけてみる",
        },
      },
      areaLead:
        "1袋のごみが安全に処理されるまでを、4つの仕事がリレーしている。\n袋の旅の順番に、追いかけてみよう。",
      incidents: [
        {
          id: "ch1",
          scenePos: { left: "16%", top: "60%" },
          emoji: "🚛",
          title: "① この袋、積んでいいの？",
          experienceId: "waste-collect",
        },
        {
          id: "ch2",
          scenePos: { left: "45%", top: "36%" },
          emoji: "🏗️",
          title: "② 巨大クレーンは、なぜ混ぜる？",
          experienceId: "waste-incinerate",
          requires: ["waste-collect"],
          requiresHint: "まずは①で、袋が工場に届くまでを見よう。",
        },
        {
          id: "ch3",
          scenePos: { left: "60%", top: "20%" },
          emoji: "📈",
          title: "③ 煙突の見はり番、アラートが鳴った",
          experienceId: "waste-measure",
          requires: ["waste-incinerate"],
          requiresHint: "炉が動いてから、煙突の見はりへ。",
        },
        {
          id: "ch4",
          scenePos: { left: "74%", top: "54%" },
          emoji: "⛰️",
          title: "④ 燃やしたあとの灰は、どこへ？",
          experienceId: "waste-landfill",
          requires: ["waste-measure"],
          requiresHint: "工場のしごとを見てから、灰のゆくえへ。",
        },
      ],
      lensSummary: {
        intro: "同じ1袋のごみを、4つの仕事はまったくちがう情報で見ていた。",
        rows: [
          { icon: "🚛", label: "収集", view: "袋の中身と分別ルール。積むかどうかの現場判定" },
          { icon: "🏗️", label: "焼却運転", view: "ごみの水分と炉の温度。燃料の質をそろえる" },
          { icon: "📈", label: "環境計測", view: "計器の数字と基準値。本当の異常かの切り分け" },
          { icon: "⛰️", label: "埋立管理", view: "天気と覆い。埋めたあとの水とにおいまで" },
        ],
      },
      wrapUp: {
        beforeAfter: {
          before: W("ba-before"),
          after: W("ba-after"),
          beforeLabel: "あさ：出された袋",
          afterLabel: "ゆうがた：同じ場所",
        },
        title: "袋は消えたんじゃない。リレーされていた。",
        lines: [
          "収集の判定 → クレーンと炉の運転 → 煙突の見はり → 埋立の管理。今日も4つの仕事がつないだ。",
          "燃やした熱は発電に。灰は体積が約20分の1になって、それでも最後は埋め立てる。",
          "埋立地の残りは全国平均で約25年ぶん（2023年度）。減らせるのは、ごみを出すわたしたちだ。",
        ],
      },
    },
  ],

  professions: [
    {
      id: "waste-collector",
      name: "ごみ収集作業員",
      catch: "積むかどうかを、現場で判断するプロ",
      image: hero("🚛", "#dcebd9"),
      discoveryLine: "袋を見て、積む・残す・連絡するを\nその場で判断する仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "🚛",
          body: [
            "決められたルートを回り、集積所のごみを収集車へ積みます。ただ運ぶだけではありません。",
            "分別ちがい・指定袋でない袋・危険物がまざった袋は、理由を示して残したり、営業所へ連絡したりします。「積まない判断」も大事な仕事です。",
          ],
        },
        {
          id: "who", title: "だれがやっている？", icon: "🧩", body: [],
          list: ["市や町の環境局・清掃事務所", "市から委託された収集会社", "地域によって分担がちがう"],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "ごみを残すのも仕事のうち。分別違いや危険物をなんでも積んでしまうと、収集車や処理施設の事故につながります。理由シールを貼って再分別をお願いするのは、みんなを守る手順なんです。",
          ],
        },
      ],
      related: ["リサイクル選別の仕事", "清掃工場の運転員", "市役所の環境担当"],
    },
    {
      id: "incinerator-operator",
      name: "清掃工場の焼却炉運転員",
      catch: "巨大クレーンで「燃料の質」をそろえ、安定して燃やしきる",
      image: hero("🏗️", "#f5e3d0"),
      discoveryLine: "ごみを混ぜて質をそろえ、\n炉の温度を守り続ける仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "🏗️",
          body: [
            "清掃工場のごみピットで巨大クレーンを操作し、焼却炉を運転します。",
            "水分の多いごみと乾いたごみを混ぜて燃えやすさをそろえ、炉の温度を保ちます。温度が下がると有害物質をおさえられないため、混ぜ方と投入のタイミングが腕の見せどころです。",
          ],
        },
        {
          id: "how", title: "何を見ている？", icon: "🧩", body: [],
          list: ["ごみピットの状態（水分・かたより）", "炉の温度と燃え方", "搬入の予定と量", "クレーンの荷重"],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "巨大クレーンは、ごみを炉へ入れるだけの道具ではありません。質のちがうごみを何度も混ぜて「炉に入る燃料の質」をそろえる、大事な運転装置なんです。燃やした熱は蒸気タービンで発電にも使われます。",
          ],
        },
      ],
      related: ["プラントの保全担当", "環境計測の担当", "発電所の運転員"],
    },
    {
      id: "env-measurer",
      name: "環境計測・排ガス管理の担当",
      catch: "数字を確かめ、まちに説明できる状態を守る",
      image: hero("📈", "#dde9f5"),
      discoveryLine: "計器の異常か本当の異常かを切り分けて、\n正しい相手に依頼する仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "📈",
          body: [
            "清掃工場から出る排ガスなどを計測し、基準値と照らして安全を確かめます。",
            "値が上がったとき、いきなり大さわぎはしません。本当の上昇か、計器の異常か、薬剤切れかを切り分けてから、保全担当や運転員へ正しく依頼します。",
          ],
        },
        {
          id: "how", title: "何を測っている？", icon: "🧩", body: [],
          list: ["CO・温度などは計器で連続監視", "ばいじん・塩化水素・ダイオキシン類などは定期測定", "ダイオキシン類は年1回以上、試料を採って専門分析"],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "清掃工場の測定結果は、インターネットなどでまちに公開される制度があります。きみのまちの清掃工場の数字も、調べれば見られるかもしれません。",
          ],
        },
      ],
      related: ["環境分析の専門会社", "プラント保全", "市役所の環境担当"],
    },
    {
      id: "landfill-manager",
      name: "最終処分場の管理者",
      catch: "埋めたあとの水とにおいまで、何十年もあずかる",
      image: hero("⛰️", "#e6e2d2"),
      discoveryLine: "受け入れ、区画に埋め、覆いをかけ、\n水を処理して管理し続ける仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "⛰️",
          body: [
            "焼却灰や不燃残さを受け入れて、区画に埋め、覆いをかけて管理します。",
            "雨がごみに触れてできる汚れた水（浸出水）は、処理してから流します。埋め立てが終わった後も、長い年月ずっと管理が続きます。",
          ],
        },
        {
          id: "how", title: "何を見ている？", icon: "🧩", body: [],
          list: ["搬入物と書類の照合（受入基準）", "区画の残り容量と残余年数", "天気と覆い（飛散・におい・雨水対策）", "浸出水の処理"],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "全国の最終処分場の残りは平均で約25年ぶん（2023年度）。「25年後まで安心」ではなく、新しい処分場づくりには長い準備が必要だからこそ、今からごみを減らす提案を続けています。",
          ],
        },
      ],
      related: ["環境コンサルタント", "水処理の仕事", "市役所の環境政策担当"],
    },
  ],

  experiences: [
    {
      id: "waste-collect",
      professionId: "waste-collector",
      eventId: "waste-journey",
      gameType: "curb_check",
      place: { name: "朝の集積所", image: W("ba-before"), fit: "cover" },
      mission: {
        title: "集積所の袋を、ぜんぶ正しくさばこう",
        lines: [
          "収集車が着いた。袋は中身をよく見てから積む。",
          "分別ちがいはシール。あぶないものは、はなれて連絡。",
        ],
        deadline: "ルートはまだ長い。この集積所は今のうちに",
      },
      tools: [
        { id: "rule", name: "今日の収集ルール", emoji: "📋", desc: "今日の区分・指定袋・積めないものの一覧" },
        { id: "seal", name: "おしらせシール", emoji: "🏷️", desc: "残す理由を住民に伝えるシール" },
        { id: "eye", name: "観察する目", emoji: "👀", desc: "半透明の袋ごしに中身の形を見る" },
      ],
      resolution: {
        clock: "午前9時",
        title: "この集積所、回収完了",
        lines: ["収集車は次の集積所へ。積まれた袋は清掃工場に向かう。"],
      },
      discoveryEcho: "きみがさっき「積む・残す・連絡」を判断したよね。あれを毎朝、何百袋もやっている仕事があるんだ。",
      seeds: ["現場でパッと判断するところ", "ルールと照らし合わせるところ", "あぶないものを見抜くところ", "まちの人とやりとりするところ"],
    },
    {
      id: "waste-incinerate",
      professionId: "incinerator-operator",
      eventId: "waste-journey",
      gameType: "pit_crane",
      place: { name: "清掃工場のクレーン操作室", image: W("scene-journey"), fit: "cover", focus: "center 30%" },
      mission: {
        title: "炉の温度を守って、燃やしきろう",
        lines: [
          "ピットのごみは、乾きも湿りもバラバラ。",
          "クレーンで質をそろえながら、850℃を下回らせない。",
        ],
        deadline: "8ターンの運転シフト",
      },
      tools: [
        { id: "manual", name: "運転マニュアル", emoji: "📘", desc: "温度の決まりとごみ質の効果" },
        { id: "crane", name: "ごみクレーン", emoji: "🏗️", desc: "つかんで投入する・混ぜて質をそろえる" },
        { id: "gauge", name: "炉温計", emoji: "🌡️", desc: "いまの炉の温度" },
      ],
      resolution: {
        clock: "午後2時",
        title: "安定運転でシフト完了",
        lines: ["熱は発電に。灰は約20分の1の体積になり、処分場へ向かう。"],
      },
      discoveryEcho: "きみがさっき「どれをつかむか・いつ混ぜるか」を考えたよね。あの判断で、炉の安定も発電も決まるんだ。",
      seeds: ["大きな機械を操作するところ", "先を読んで仕込むところ", "温度と数字を見張るところ", "混ぜて質をそろえる工夫"],
    },
    {
      id: "waste-measure",
      professionId: "env-measurer",
      eventId: "waste-journey",
      gameType: "gas_watch",
      place: { name: "中央制御室の計測パネル", image: W("scene-journey"), fit: "cover", focus: "60% 15%" },
      mission: {
        title: "アラートの原因を、切り分けろ",
        lines: [
          "計器の値が管理値に近づいている。",
          "本当の異常か、計器の故障か、薬剤切れか——確かめてから動く。",
        ],
        deadline: "煙突の値が基準を超える前に",
      },
      tools: [
        { id: "meters", name: "連続計器", emoji: "📈", desc: "CO・HClなどを24時間監視" },
        { id: "log", name: "校正記録", emoji: "🗓️", desc: "計器がいつ点検されたかの記録" },
        { id: "phone", name: "内線電話", emoji: "📞", desc: "保全・運転員への依頼と連絡" },
      ],
      resolution: {
        clock: "午後4時",
        title: "原因を特定、正しく依頼できた",
        lines: ["対応は記録され、測定結果はまちに公開される。"],
      },
      discoveryEcho: "きみがさっき「どれを点検すれば絞れるか」を考えたよね。切り分けてから動くのが、この仕事の鉄則なんだ。",
      seeds: ["データから原因をさがすところ", "あわてず切り分けるところ", "正しい相手に依頼するところ", "まちに説明する責任"],
    },
    {
      id: "waste-landfill",
      professionId: "landfill-manager",
      eventId: "waste-journey",
      gameType: "landfill_ops",
      place: { name: "最終処分場", image: W("scene-journey"), fit: "cover", focus: "80% 45%" },
      mission: {
        title: "5日間、埋立地を回しきろう",
        lines: [
          "灰と不燃は別の区画へ。夜は天気を見て覆いをかける。",
          "雨は浸出水に、風は飛散に。覆い材は今週、足りない。",
        ],
        deadline: "今週の搬入を断らずに",
      },
      tools: [
        { id: "rule", name: "処分場のきまり", emoji: "📋", desc: "受入基準・覆いと浸出水の仕組み" },
        { id: "forecast", name: "天気予報", emoji: "🌦️", desc: "今夜と明日の天気" },
        { id: "sheet", name: "覆い材", emoji: "🟫", desc: "夜のあいだの仮シート＋薄い土" },
      ],
      resolution: {
        clock: "金曜の夕方",
        title: "今週も受け止めきった",
        lines: ["埋めた分だけ、処分場の残りは減っていく。だから減らす提案も続く。"],
      },
      discoveryEcho: "きみがさっき「どの区画に埋めて、どこに覆いをかけるか」を毎日決めたよね。埋めて終わりじゃない管理が、何十年も続くんだ。",
      seeds: ["天気を読んで備えるところ", "限られた材料の使いどころ", "埋めたあとまで管理するところ", "ごみを減らす提案につながるところ"],
    },
  ],
};
