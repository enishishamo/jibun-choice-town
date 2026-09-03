// Theme module: もりをきる、もりをまもる（factory/projects/forest-care/design.md）
// "Cutting trees" turns out to be forest care: pick, fell safely, replant.
// Facts: factory/projects/forest-care/research.result.json
// Safety rules: fatal-risk work is stopped by the chief/winch BEFORE harm;
// no chainsaw play-acting; "cutting = protecting" only with plan + replanting.
import type { ContentModule } from "../types";

const F = (n: string) => `${import.meta.env.BASE_URL}assets/forest/${n}.png`;

const hero = (emoji: string, bg: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'><circle cx='80' cy='80' r='74' fill='${bg}'/><text x='80' y='106' font-size='72' text-anchor='middle'>${emoji}</text></svg>`,
  );

export const forest: ContentModule = {
  places: [
    {
      id: "mountain-forest",
      name: "山の森",
      eventId: "forest-care",
    },
  ],

  events: [
    {
      id: "forest-care",
      placeId: "mountain-forest",
      title: "木を切っているのに、\n「森を守っている」って？",
      shortLabel: "森のなぞ",
      areaName: "森のしごと場",
      sceneMap: {
        image: F("scene-forest"),
        opening: {
          image: F("ba-before"),
          lines: [
            "山の上から、チェーンソーの音がする。",
            "「あの人たち、森をこわしてるの？」——ちがう、と案内の人は言った。",
          ],
          cta: "森に入ってみる",
        },
      },
      areaLead: "「｜伐《き》って守る」には、順番がある。\n選ぶ→倒す→植える。3つの仕事をのぞいてみよう。",
      incidents: [
        {
          id: "ch1",
          scenePos: { left: "20%", top: "36%" },
          emoji: "🎯",
          title: "① どの木を伐る？どれを残す？",
          experienceId: "forest-thin",
        },
        {
          id: "ch2",
          scenePos: { left: "52%", top: "56%" },
          emoji: "🪓",
          title: "② その木、どっちに倒す？",
          experienceId: "forest-fell",
          requires: ["forest-thin"],
          requiresHint: "まず①で、伐る木の選び方を見よう。",
        },
        {
          id: "ch3",
          scenePos: { left: "80%", top: "34%" },
          emoji: "🌱",
          title: "③ 伐ったあとの山、どうする？",
          experienceId: "forest-plant",
          requires: ["forest-fell"],
          requiresHint: "倒したあとの山に、次の森を返す番。",
        },
      ],
      lensSummary: {
        intro: "同じ森を、3つの仕事はまったくちがう目で見ていた。",
        rows: [
          { icon: "🎯", label: "選木", view: "材積と将来の木。残すほうを選んでいる" },
          { icon: "🪓", label: "伐倒", view: "合図・退避・方向。無理なら機械へ" },
          { icon: "🌱", label: "造林", view: "場所との相性とシカ。植えてからが長い" },
        ],
      },
      wrapUp: {
        beforeAfter: {
          before: F("ba-before"),
          after: F("ba-after"),
          beforeLabel: "手入れ前：混みあって、暗い林",
          afterLabel: "手入れ後：光が入り、苗が育つ",
        },
        title: "「伐る」は、この森では「守る」だった。",
        lines: [
          "選んで｜伐《き》り、安全に倒し、また植える。この順番で、はじめて森は守られる。",
          "残った木は前より太く育ち、林の底まで光が届くようになった。",
          "きみの家の柱や机も、だれかがこうして育てた木かもしれない。",
        ],
      },
    },
  ],

  professions: [
    {
      id: "forest-picker",
      name: "林業作業士（選木）",
      catch: "「伐る木」ではなく「残す木」を選ぶ人",
      image: hero("🎯", "#dcebd9"),
      discoveryLine: "材積と将来の木を読んで、\n間伐の印をつける仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "🎯",
          body: [
            "混みあった林で、｜伐《き》る木にスプレーで印をつけます。数えるのは本数ではなく｜材積《ざいせき》（木の体積）。",
            "傷んだ木や弱った木から先に。将来の主役になる木は、まわりを空けて残します。",
          ],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "同じ「2割の木を伐る」でも、太い木を伐るか細い木を伐るかで、森に残る量はまったく変わります。だからプロは体積で数えるんです。",
          ],
        },
        {
          id: "who", title: "だれがやっている？", icon: "🧩", body: [],
          list: ["森林組合の作業班", "林業会社の技能者", "森林施業プランナーと相談しながら進める"],
        },
      ],
      related: ["森林施業プランナー", "庭師・樹木医", "国立公園の管理の仕事"],
    },
    {
      id: "forest-feller",
      name: "伐木作業者",
      catch: "倒す前に、ぜんぶ決めておく職人",
      image: hero("🪓", "#f5e6d0"),
      discoveryLine: "合図と退避を確認して、\n木を安全な方向へ倒す仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "🪓",
          body: [
            "チェーンソーで木を倒します。ただし切るのは最後。合図、全員の退避、倒す方向、逃げ道——先に決めるのが仕事の本体です。",
            "かたむきに逆らっては倒せません。無理な木は、ウインチや機械の班へ渡します。",
          ],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "木を狙った方向へ倒すために、幹に｜受け口《うけぐち》という切り込みを先に入れます。深さのきまりは、法律で決まっているんです。",
          ],
        },
        {
          id: "how", title: "何を見ている？", icon: "🧩", body: [],
          list: ["木のかたむきと重心", "まわりの木・機械・沢の位置", "退避路と合図", "無理をしない、という選択肢"],
        },
      ],
      related: ["高所作業の仕事", "クレーン運転士", "造園の仕事"],
    },
    {
      id: "forest-planter",
      name: "造林作業員",
      catch: "50年後の森を、いま植える人",
      image: hero("🌱", "#e5f0dc"),
      discoveryLine: "場所との相性とシカ対策を考えて、\n次の森を植える仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "🌱",
          body: [
            "伐ったあとの山に苗木を植え、草刈りやシカ対策をしながら育てます。",
            "スギは水が好き、カラマツは乾きに強い——場所との相性を外すと、苗は育ちません。",
          ],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "植えた苗は草より低いので、草刈りのときにまちがえて刈ってしまうことがあるほど小さい。森になるまで、何十年もの世話が続きます。",
          ],
        },
        {
          id: "who", title: "だれがやっている？", icon: "🧩", body: [],
          list: ["森林組合・林業会社の造林班", "苗木を育てる専門の農家もいる", "シカ柵の点検も大事な仕事"],
        },
      ],
      related: ["農家", "植木の生産の仕事", "自然保護の仕事"],
    },
  ],

  experiences: [
    {
      id: "forest-thin",
      professionId: "forest-picker",
      eventId: "forest-care",
      gameType: "thinning_pick",
      place: { name: "間伐予定の林", image: F("scene-forest"), fit: "cover", focus: "20% 40%" },
      mission: {
        title: "この林の選木、たのんだ",
        lines: [
          "｜伐《き》る木に印を。数えるのは本数でなく材積。",
          "傷んだ木から先に、将来木は残す。開けすぎにも注意。",
        ],
        deadline: "今日の午前中",
      },
      tools: [
        { id: "tape", name: "印のテープ", emoji: "🎯", desc: "伐る木につける" },
        { id: "table", name: "材積のめやす", emoji: "📋", desc: "太さごとの体積" },
        { id: "map", name: "林の図", emoji: "🗺", desc: "将来木と傷んだ木の位置" },
      ],
      resolution: {
        clock: "昼",
        title: "選木おわり。印は次の班へ",
        lines: ["きみの印を目印に、伐倒班が動き出す。"],
      },
      discoveryEcho: "きみがさっき「残すほう」を選んだよね。あの選択が森の50年を決める仕事があるんだ。",
      seeds: ["残すものを選ぶ責任", "数字（材積）で考えるところ", "5年後の森を想像するところ"],
    },
    {
      id: "forest-fell",
      professionId: "forest-feller",
      eventId: "forest-care",
      gameType: "fell_direction",
      place: { name: "伐倒の現場", image: F("scene-forest"), fit: "cover", focus: "52% 55%" },
      mission: {
        title: "5本、安全に倒す",
        lines: [
          "切る前に、合図と退避の確認。",
          "かたむき・障害物・逃げ道を読んで、方向を決める。",
        ],
        deadline: "日が暮れるまで",
      },
      tools: [
        { id: "whistle", name: "ホイッスル", emoji: "📣", desc: "合図してから切る" },
        { id: "saw", name: "チェーンソー", emoji: "🪚", desc: "訓練を受けた大人の道具" },
        { id: "winch", name: "ウインチ班", emoji: "🚜", desc: "無理な木はたのむ" },
      ],
      resolution: {
        clock: "夕方",
        title: "今日のぶん、ぶじ完了",
        lines: ["倒した木は、道を通って山を下りていく。"],
      },
      discoveryEcho: "きみがさっき「切る前にぜんぶ決めた」よね。あの段どりが命を守る仕事があるんだ。",
      seeds: ["切る前の段どり", "方向を読む空間の感覚", "無理をしない勇気"],
    },
    {
      id: "forest-plant",
      professionId: "forest-planter",
      eventId: "forest-care",
      gameType: "plant_plan",
      place: { name: "伐採あとの斜面", image: F("scene-forest"), fit: "cover", focus: "80% 35%" },
      mission: {
        title: "この斜面に、森を返す",
        lines: [
          "尾根・中腹・沢ぞい。場所に合う苗を選ぼう。",
          "シカの多い区画は守りを。予算は足りないかもしれない。",
        ],
        deadline: "春の植栽シーズン",
      },
      tools: [
        { id: "seedling", name: "苗木", emoji: "🌱", desc: "スギ・ヒノキ・カラマツ" },
        { id: "fence", name: "シカ柵・チューブ", emoji: "🚧", desc: "苗を食害から守る" },
        { id: "budget", name: "予算表", emoji: "💰", desc: "ぜんぶには足りない" },
      ],
      resolution: {
        clock: "春",
        title: "植栽計画、スタート",
        lines: ["苗が草より高くなるまで、世話はつづく。"],
      },
      discoveryEcho: "きみがさっき「どこを守るか」を選んだよね。50年後の森をいま決める仕事があるんだ。",
      seeds: ["育つ場所を見立てるところ", "限りある予算のやりくり", "ずっと先の未来を考えるところ"],
    },
  ],
};
