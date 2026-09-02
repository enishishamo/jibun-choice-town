// Theme module: 動物園に赤ちゃんが生まれた（factory/projects/zoo/design.md）
// A red panda cub is born; four professions carry it from birth to a
// welfare-first debut. Facts: factory/projects/zoo/research.result.json
// Safety rules: no animal death/punishment framing; failure = mentors take
// over and teach; no touch-as-reward; wild animals are not pets.
import type { ContentModule } from "../types";

const Z = (n: string) => `${import.meta.env.BASE_URL}assets/zoo/${n}.png`;

const hero = (emoji: string, bg: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'><circle cx='80' cy='80' r='74' fill='${bg}'/><text x='80' y='106' font-size='72' text-anchor='middle'>${emoji}</text></svg>`,
  );

export const zoo: ContentModule = {
  places: [
    {
      id: "city-zoo",
      name: "動物園",
      eventId: "zoo-baby",
      mapPos: { left: "80%", top: "72%" },
    },
  ],

  events: [
    {
      id: "zoo-baby",
      placeId: "city-zoo",
      title: "動物園に、レッサーパンダの\n赤ちゃんが生まれた！",
      shortLabel: "赤ちゃん誕生！",
      areaName: "動物園のうらがわ",
      sceneMap: {
        image: Z("scene-zoo"),
        opening: {
          image: Z("ba-before"),
          lines: [
            "生まれたのは、手のひらサイズのレッサーパンダ。",
            "みんなに会える日まで——バックヤードでは、たくさんの仕事が始まっている。",
          ],
          cta: "うらがわを、のぞいてみる",
        },
      },
      areaLead:
        "赤ちゃんがデビューする日まで、4つの仕事がバトンをつなぐ。\n毎日のケアから、順番にのぞいてみよう。",
      incidents: [
        {
          id: "ch1",
          scenePos: { left: "14%", top: "50%" },
          emoji: "⚖️",
          title: "① 今朝の体重、どう見る？",
          experienceId: "zoo-care",
        },
        {
          id: "ch2",
          scenePos: { left: "38%", top: "32%" },
          emoji: "🩺",
          title: "② 触らずに、どこまで分かる？",
          experienceId: "zoo-checkup",
          requires: ["zoo-care"],
          requiresHint: "まずは①で、毎日の記録がどう生まれるかを見よう。",
        },
        {
          id: "ch3",
          scenePos: { left: "60%", top: "56%" },
          emoji: "🥬",
          title: "③ 3にんぶんの朝ごはんを作れ",
          experienceId: "zoo-feed",
          requires: ["zoo-checkup"],
          requiresHint: "健康チェックのあとは、ごはんの時間。",
        },
        {
          id: "ch4",
          scenePos: { left: "78%", top: "34%" },
          emoji: "🎪",
          title: "④ デビューの日を、だれが決める？",
          experienceId: "zoo-debut",
          requires: ["zoo-feed"],
          requiresHint: "元気に育ってから、デビューの計画へ。",
        },
      ],
      lensSummary: {
        intro: "同じ赤ちゃんを、4つの仕事はまったくちがう情報で見ていた。",
        rows: [
          { icon: "⚖️", label: "飼育", view: "成長曲線の形と日誌。単発の数字より傾向" },
          { icon: "🩺", label: "獣医", view: "負担の小さい検査から。結果が方針を変えるか" },
          { icon: "🥬", label: "栄養", view: "日量表の規則×今朝のデータ。在庫の優先順位" },
          { icon: "🎪", label: "展示企画", view: "練習記録とストレスサイン。中止する勇気" },
        ],
      },
      wrapUp: {
        beforeAfter: {
          before: Z("ba-before"),
          after: Z("ba-after"),
          beforeLabel: "デビュー前：しずかな展示場",
          afterLabel: "デビュー：赤ちゃんが自分で出てきた",
        },
        title: "デビューの日を決めたのは、赤ちゃん自身。",
        lines: [
          "毎朝の見立て → 負担の少ない健康チェック → 規則どおりの餌 → サインを読む運営。4つの仕事がつないだ。",
          "「かならず見せる」より「動物が出るかどうか選べる」。だから『今日は見られないことがあります』は、やさしさの証明。",
          "きみが静かに、少し離れて見ることも——赤ちゃんの暮らしを守る仕事の一部なんだ。",
        ],
      },
    },
  ],

  professions: [
    {
      id: "zoo-keeper",
      name: "動物園の飼育員",
      catch: "毎日の小さな変化に、いちばん先に気づく人",
      image: hero("⚖️", "#f5e6d0"),
      discoveryLine: "体重と日誌の「傾向」を読んで、\n今日のケアを見立てる仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "⚖️",
          body: [
            "餌やりや掃除だけではありません。毎日体重を量り、食欲・うんち・動きを観察して、成長曲線と見くらべます。",
            "「順調」「量を調整」「獣医さんに相談」を毎朝見立てるのが仕事。1日だけの数字であわてず、傾向で判断します。",
          ],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "飼育員の大切な道具は「飼育日誌」。野生動物は不調をかくすことがあるので、昨日との小さな違いのメモが、獣医さんの診察の手がかりになるんです。",
          ],
        },
        {
          id: "who", title: "だれがやっている？", icon: "🧩", body: [],
          list: ["市立・県立の動物園の職員", "民間の動物園・水族館のスタッフ", "担当の動物ごとにチームで交代勤務"],
        },
      ],
      related: ["動物園の獣医師", "水族館の飼育スタッフ", "牧場の仕事"],
    },
    {
      id: "zoo-vet",
      name: "動物園の獣医師",
      catch: "「まず触る」とは限らない、負担をおさえる名医",
      image: hero("🩺", "#dde9f5"),
      discoveryLine: "動画・うんち・柵ごしの観察で、\n触らずに原因へ近づく仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "🩺",
          body: [
            "動物園の動物は、人間の患者さんのように「診察台にどうぞ」とはいきません。捕まえること自体が動物の負担になるからです。",
            "だから日誌・カメラ映像・落ちたうんちなど、動物がふだん通り暮らしたまま得られる情報から調べ、「その検査で方針が変わるか」を考えて検査を選びます。",
          ],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "体に触れなくても、落としたばかりのうんちから寄生虫や細菌を調べられます。群れでは「誰のうんちか」を確かめるため、排便まで観察することもあるんですよ。",
          ],
        },
        {
          id: "how", title: "何を見ている？", icon: "🧩", body: [],
          list: ["飼育日誌と平常時データとの差", "歩き方・呼吸・姿勢（カメラや柵ごし）", "糞便検査などの低負担な検査", "麻酔・保定は最後の手段（リスクと比較）"],
        },
      ],
      related: ["動物病院の獣医師", "野生動物の保護の仕事", "飼育員"],
    },
    {
      id: "zoo-nutritionist",
      name: "動物園の栄養担当（餌づくり）",
      catch: "動物ごとの給食を、グラム単位で設計する食の管理者",
      image: hero("🥬", "#dcebd9"),
      discoveryLine: "日量表の規則を今日のデータに当てはめ、\n在庫と優先順位まで決める仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "🥬",
          body: [
            "動物園には、人間の給食の献立表のような「飼料日量表」があります。種類・成長段階・体調に合わせて、餌をグラム単位で設計します。",
            "授乳中のおかあさんには増量、赤ちゃんは体重に合わせてミルクの量を変える——規則を毎日のデータに当てはめるのが腕の見せどころです。",
          ],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "餌づくりは料理だけではありません。計量、衛生、在庫、配送、災害にそなえた備蓄まで扱う「食の管理者」。冷凍の魚や肉は、必要なぶんを計画的に解凍しています。",
          ],
        },
        {
          id: "who", title: "だれがやっている？", icon: "🧩", body: [],
          list: ["動物園の飼料・栄養担当職員", "飼育員が兼任する園も多い", "大きな園では専門の調理場（動物調理室）がある"],
        },
      ],
      related: ["管理栄養士", "飼育員", "食品の品質管理の仕事"],
    },
    {
      id: "zoo-planner",
      name: "動物園の展示・広報企画",
      catch: "「見せる」と「守る」を両立させる設計者",
      image: hero("🎪", "#f5e3e0"),
      discoveryLine: "練習記録とストレスサインを読んで、\nデビューの日程と運営を決める仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "🎪",
          body: [
            "赤ちゃんのデビューをいつ・どのくらい・どんな距離で公開するかを設計します。基準は人気ではなく、展示練習の記録と動物のようすです。",
            "当日もストレスサイン（行ったり来たり・隠れがち・食べるのをやめる）を見て、縮小や中止をためらわずに判断します。",
          ],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "赤ちゃんデビューでいちばん大事な案内のひとつは「今日は見られないことがあります」。動物自身が人前に出るかどうか選べる展示が、いまの動物園の考え方なんです。",
          ],
        },
        {
          id: "how", title: "何を見ている？", icon: "🧩", body: [],
          list: ["展示練習の記録（自分から出たか・隠れ時間）", "隠れ場と寝室へ戻れる経路", "観覧の距離・人数・音", "当日のストレスサイン"],
        },
      ],
      related: ["イベント企画の仕事", "広報の仕事", "飼育員"],
    },
  ],

  experiences: [
    {
      id: "zoo-care",
      professionId: "zoo-keeper",
      eventId: "zoo-baby",
      gameType: "baby_care",
      place: { name: "バックヤードの保育室", image: Z("scene-zoo"), fit: "cover", focus: "10% 45%" },
      mission: {
        title: "今週の見立て当番は、きみだ",
        lines: [
          "毎朝、体重を量って成長曲線に点を打つ。",
          "日誌と合わせて「順調・調整・相談」を見立てよう。単発の数字であわてない。",
        ],
        deadline: "5日間の当番",
      },
      tools: [
        { id: "scale", name: "電子ばかり", emoji: "⚖️", desc: "毎朝同じ条件で量る" },
        { id: "curve", name: "成長曲線", emoji: "📈", desc: "単発の数字より、増え方の形を見る" },
        { id: "diary", name: "飼育日誌", emoji: "📔", desc: "飲み残し・うんち・動きのメモ" },
      ],
      resolution: {
        clock: "金曜の朝",
        title: "今週の見立て、ぶじ完了",
        lines: ["日誌は次の当番と獣医さんへ引き継がれる。毎日の記録が、赤ちゃんを守る。"],
      },
      discoveryEcho: "きみがさっき「傾向か、単発か」を見分けたよね。あの見立てを毎朝やる仕事があるんだ。",
      seeds: ["毎日の変化に気づくところ", "グラフの形を読むところ", "あわてず見きわめるところ", "記録を引き継ぐところ"],
    },
    {
      id: "zoo-checkup",
      professionId: "zoo-vet",
      eventId: "zoo-baby",
      gameType: "zoo_checkup",
      place: { name: "診察室（モニター前）", image: Z("scene-zoo"), fit: "cover", focus: "38% 40%" },
      mission: {
        title: "触らずに、原因を突き止めろ",
        lines: [
          "赤ちゃんのようすが、いつもとちがう。",
          "負担の小さい調べ方から。「その検査で方針が変わるか」も考えて。",
        ],
        deadline: "動物への負担は4まで",
      },
      tools: [
        { id: "diary", name: "飼育日誌", emoji: "📔", desc: "飼育員の毎日の記録（負担ゼロの宝物）" },
        { id: "cam", name: "見守りカメラ", emoji: "🎥", desc: "ふだんの暮らしのままの映像" },
        { id: "kit", name: "検査キット", emoji: "🧪", desc: "糞便検査・血液検査（負担に注意）" },
      ],
      resolution: {
        clock: "午後1時",
        title: "低負担で、原因にたどりついた",
        lines: ["治療の計画はチームで共有。赤ちゃんはふだんの暮らしのまま。"],
      },
      discoveryEcho: "きみがさっき「負担と情報のバランス」で検査を選んだよね。それが動物園の獣医さんの毎日の判断なんだ。",
      seeds: ["証拠から絞り込むところ", "相手の負担を考えるところ", "検査を選ぶ駆け引き", "チームで方針を決めるところ"],
    },
    {
      id: "zoo-feed",
      professionId: "zoo-nutritionist",
      eventId: "zoo-baby",
      gameType: "feed_prep",
      place: { name: "動物たちの調理場", image: Z("scene-zoo"), fit: "cover", focus: "62% 45%" },
      mission: {
        title: "3にんぶんの朝ごはんを、規則どおりに",
        lines: [
          "日量表は「規則」。今朝の体重と授乳メモに当てはめて量を決める。",
          "足りない食材は、じゅにゅう中のおかあさんを優先。",
        ],
        deadline: "開園前に配りきる",
      },
      tools: [
        { id: "table", name: "飼料日量表", emoji: "📋", desc: "動物×条件ごとの規則" },
        { id: "diary", name: "今朝の日誌", emoji: "📔", desc: "体重と授乳のようす（今日のデータ）" },
        { id: "stock", name: "在庫ボード", emoji: "📦", desc: "今朝つかえる食材の残り" },
      ],
      resolution: {
        clock: "開園30分前",
        title: "3にんぶん、提供完了",
        lines: ["台車が保育室と放飼場へ。食は、健康のいちばんの土台。"],
      },
      discoveryEcho: "きみがさっき「規則を今日のデータに当てはめて」量を決めたよね。あれが飼料日量表の使い方なんだ。",
      seeds: ["規則を当てはめて考えるところ", "だれを優先するか決めるところ", "在庫をやりくりするところ", "提供前に自分で照合するところ"],
    },
    {
      id: "zoo-debut",
      professionId: "zoo-planner",
      eventId: "zoo-baby",
      gameType: "debut_plan",
      place: { name: "展示場のバックヤード", image: Z("ba-before"), fit: "cover" },
      mission: {
        title: "デビュー初日を、設計せよ",
        lines: [
          "練習記録を読んで、時間・距離・人数を決める。",
          "当日はサインを見て、縮小や中止をためらわない。",
        ],
        deadline: "初日の4つの時間帯",
      },
      tools: [
        { id: "log", name: "展示練習の記録", emoji: "📗", desc: "この子の性格が見えるデータ" },
        { id: "signs", name: "サインのめやす", emoji: "⚠️", desc: "往復行動・隠れがち・採食中断" },
        { id: "mic", name: "園内放送", emoji: "📢", desc: "「今日は見られないことがあります」" },
      ],
      resolution: {
        clock: "初日の夕方",
        title: "デビューの一日が、終わった",
        lines: ["決めたのは赤ちゃん自身。それを支えるのが、この仕事。"],
      },
      discoveryEcho: "きみがさっき「サインを見て縮小・中止」を判断したよね。中止する勇気も、プロの技術なんだ。",
      seeds: ["相手に合わせて計画するところ", "当日のようすで調整するところ", "中止を決める勇気", "見せ方と守り方の両立"],
    },
  ],
};
