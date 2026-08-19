// Theme module: 学校／給食
// Adding a future theme (hospital, weather, prices...) = add a file like
// this one and register it in data/index.ts. No screen changes needed.
import type { ContentModule } from "../types";

const A = (name: string) => `${import.meta.env.BASE_URL}assets/${name}.png`;

export const schoolLunch: ContentModule = {
  places: [
    {
      id: "school",
      name: "学校",
      eventId: "lunch-late",
      mapPos: { left: "45%", top: "34%" },
    },
    // Visible in the world but quiet today — hints that the world is bigger.
    { id: "hospital", name: "病院", mapPos: { left: "12%", top: "40%" } },
    { id: "station", name: "駅", mapPos: { left: "88%", top: "46%" } },
    { id: "shop", name: "お店", mapPos: { left: "22%", top: "72%" } },
    { id: "park", name: "公園", mapPos: { left: "82%", top: "76%" } },
  ],

  events: [
    {
      id: "lunch-late",
      placeId: "school",
      title: "大変！\n今日の給食が間に合わない！",
      areaName: "給食のうらがわ",
      areaLead: "どうしてだろう？\n気になるところをのぞいてみよう。",
      incidents: [
        {
          id: "menu-mystery",
          image: A("item-veggies"),
          title: "今日の献立、どうやって決まった？",
          experienceId: "nutrition-lunch",
          scenePos: { left: "24%", top: "18%" },
        },
        {
          id: "kitchen-busy",
          image: A("tool-kama"),
          title: "給食室が大忙し！",
          experienceId: "cook-lunch",
          scenePos: { left: "72%", top: "26%" },
        },
        {
          id: "no-carrot",
          image: A("item-carrot"),
          title: "にんじんが足りない！",
          experienceId: "farmer-lunch",
          scenePos: { left: "20%", top: "56%" },
        },
        {
          id: "not-delivered",
          image: A("item-truck"),
          title: "食材がまだ届いてない！",
          experienceId: "logistics-lunch",
          scenePos: { left: "74%", top: "62%" },
        },
        {
          id: "after-lunch",
          image: A("item-recyclebag"),
          title: "食べ終わったあとも何かあるみたい…",
          experienceId: "recycle-lunch",
          scenePos: { left: "46%", top: "82%" },
        },
      ],
    },
  ],

  professions: [
    {
      id: "cook",
      name: "給食調理員",
      catch: "数百〜数千人分の料理を作るプロ！",
      image: A("char-cook"),
      discoveryLine: "たくさんの給食を、\n安全に、同じ時間までに完成させるプロ！",
      q2: [
        {
          id: "what",
          title: "どんな仕事？",
          icon: "🍳",
          body: [
            "野菜を洗う、切る、煮る、焼く。でも、それだけではありません。",
            "たくさんの給食を、決められた時間までに安全に完成させる仕事です。",
          ],
        },
        {
          id: "day",
          title: "1日をのぞく",
          icon: "🕐",
          body: [],
          flow: [
            "朝｜食材を受け取る・準備する",
            "午前｜食材を洗う・切る、大量調理",
            "お昼前｜クラスごとに分けて給食へ！",
            "午後｜戻ってきた食器や食缶を洗って消毒",
          ],
        },
        {
          id: "become",
          title: "どうやったらなれる？",
          icon: "🎓",
          body: [
            "「給食調理員」というひとつの国家資格があるわけではありません。",
            "働く場所によって条件はちがい、調理師免許を求める職場などもあります。",
          ],
        },
        {
          id: "himitsu",
          title: "実は！",
          icon: "💡",
          body: [
            "給食センターでは、一日に何千食もの給食を作ることもあります。",
            "「料理ができる」だけではなく、大量の料理を、安全に、同じ時間までに完成させることが専門性です。",
          ],
        },
      ],
      related: ["調理師", "栄養士", "食品工場", "ホテルやレストランの調理"],
    },
    {
      id: "nutrition",
      name: "栄養教諭",
      catch: "給食と「食べること」の先生！",
      image: A("char-nutrition"),
      discoveryLine: "みんなの体に合った献立を考え、\n学校で「食べること」を教える先生！",
      q2: [
        {
          id: "what",
          title: "どんな仕事？",
          icon: "📋",
          body: [
            "給食を考えるだけではなく、学校で「食べること」について教える先生です。",
          ],
        },
        {
          id: "day",
          title: "1日の流れ",
          icon: "🕐",
          body: [],
          flow: [
            "給食の確認",
            "給食管理・食育",
            "子どもの様子を見る",
            "これからの給食や食育を考える",
          ],
        },
        {
          id: "become",
          title: "どうやったらなれる？",
          icon: "🎓",
          body: ["栄養士・管理栄養士に関する学び ＋ 栄養教諭免許。"],
        },
        {
          id: "himitsu",
          title: "実は！",
          icon: "💡",
          body: ["「栄養の専門家」であり「先生」でもある仕事です。"],
        },
      ],
      related: ["管理栄養士", "栄養士", "食品開発", "調理"],
    },
    {
      id: "farmer",
      name: "農家・生産者",
      catch: "何か月も先を考えて、食べ物を育てるプロ！",
      image: A("char-farmer"),
      discoveryLine: "天候や季節を読みながら、\n何か月も前から食べ物を育てて届けるプロ！",
      q2: [
        {
          id: "what",
          title: "どんな仕事？",
          icon: "🌱",
          body: [
            "野菜、米、果物などを育てて届けます。",
            "天候や季節を見ながら、何か月も先を考えて仕事をします。",
          ],
        },
        {
          id: "kinds",
          title: "いろんな農家",
          icon: "🥕",
          body: [],
          list: ["野菜", "米", "果物", "酪農", "花", "…など"],
        },
        {
          id: "become",
          title: "どうやったらなれる？",
          icon: "🎓",
          body: [
            "農業法人に就職する道、研修を受けて独立する道などがあります。",
          ],
        },
        {
          id: "himitsu",
          title: "実は！",
          icon: "💡",
          body: ["「農家の家に生まれないとなれない」わけではありません。"],
        },
      ],
      related: ["JA", "農業技術", "食品メーカー", "農業機械", "研究", "物流"],
    },
    {
      id: "logistics",
      name: "物流の仕事",
      catch: "必要なものを、必要な場所へ届けるプロ！",
      image: A("char-logistics"),
      discoveryLine: "食材や荷物を、決められた時間どおりに\n必要な場所へ届けるプロ！",
      q2: [
        {
          id: "what",
          title: "どんな仕事？",
          icon: "🚚",
          body: [
            "必要なものを、必要な場所へ届ける仕組みを支えています。",
          ],
        },
        {
          id: "kinds",
          title: "実は一つの仕事ではない",
          icon: "🧩",
          body: [],
          list: ["ドライバー", "倉庫", "配車・運行管理", "物流企画・管理", "…など"],
        },
        {
          id: "himitsu",
          title: "実は！",
          icon: "💡",
          body: [
            "物流＝トラック運転手だけではありません。",
            "食品では、温度や届ける時間もとても重要です。",
          ],
        },
      ],
      related: ["鉄道貨物", "船", "航空貨物", "倉庫", "物流企画"],
    },
    {
      id: "recycle",
      name: "食品リサイクルの世界",
      catch: "食べ物の「その後」を資源に変える！",
      image: A("char-recycle"),
      discoveryLine: "食べ残しや調理くずを、\n肥料などの資源に変えてつなぐ仕事！",
      q2: [
        {
          id: "what",
          title: "どんな世界？",
          icon: "♻️",
          body: [
            "食べ残しや調理くずなどを処理したり、別の資源として活用したりします。",
          ],
        },
        {
          id: "kinds",
          title: "どんな仕事がある？",
          icon: "🧩",
          body: [],
          list: ["収集・運搬", "リサイクル施設", "肥料化", "飼料化", "エネルギー利用", "…など"],
        },
        {
          id: "himitsu",
          title: "実は！",
          icon: "💡",
          body: [],
          flow: ["給食", "食べ残し", "肥料", "農家", "食べ物", "給食"],
        },
      ],
      related: ["環境", "ごみ処理", "農業", "エネルギー"],
    },
  ],

  experiences: [
    // ============ 給食調理員（メインQ1） ============
    {
      id: "cook-lunch",
      professionId: "cook",
      eventId: "lunch-late",
      gameType: "cook",
      place: { name: "給食室", image: A("bg-kitchen") },
      mission: {
        title: "大変！\n今日の給食が間に合わない！",
        lines: ["12:15まで、あと60分！", "500人分の給食を完成させよう！"],
        deadline: "12:15",
      },
      tools: [
        {
          id: "kama",
          name: "回転釜",
          image: A("tool-kama"),
          desc: "何百人分ものスープや煮物を一度に作れる大きな釜。ただし一度に作れるのは1品だけ！",
        },
        {
          id: "oven",
          name: "スチームオーブン",
          image: A("tool-oven"),
          desc: "蒸気と熱で、500切れの魚をいっぺんに焼ける調理機。",
        },
        {
          id: "thermo",
          name: "中心温度計",
          image: A("tool-thermo"),
          desc: "食べ物の中心の温度を測って、安全をたしかめる大事な道具。",
        },
        {
          id: "plan",
          name: "調理工程表",
          emoji: "📋",
          desc: "何を・いつ・どの設備で進めるかを組み立てる、段取りの設計図。",
        },
        {
          id: "clock",
          name: "時計",
          emoji: "🕐",
          desc: "給食の時間は待ってくれない。残り時間からいつも逆算する。",
        },
      ],
      resolution: {
        clock: "12:13",
        title: "500人分、完成！",
        lines: ["みんなのお昼に間に合った！", "給食がクラスへ運ばれていく…"],
      },
    },
    // ============ 栄養教諭 ============
    {
      id: "nutrition-lunch",
      professionId: "nutrition",
      eventId: "lunch-late",
      gameType: "menu",
      place: { name: "学校", image: A("bg-school") },
      mission: {
        title: "明日の給食、何にする？",
        lines: ["500人分の献立を考えよう！"],
      },
      tools: [
        { id: "nutri", name: "栄養チェック", emoji: "🥗", desc: "エネルギー・たんぱく質・野菜…500人の体をつくる組み合わせを見る。" },
        { id: "budget", name: "予算表", emoji: "💴", desc: "500人分を、1人250円の予算に収める。" },
        { id: "allergy", name: "アレルギー表", emoji: "⚠️", desc: "安全に食べられるか、全員分を確認する。" },
        { id: "season", name: "旬カレンダー", emoji: "🌸", desc: "今の季節に合う食材がわかる。旬はおいしくて安い。" },
        { id: "record", name: "食べ残し記録", emoji: "🍽️", desc: "前にどんな料理が残ったかの記録。" },
        { id: "rule", name: "給食の基準", emoji: "📋", desc: "学校給食として必要な条件が決められている。" },
      ],
      resolution: {
        title: "500人分の献立、完成！",
        lines: [
          "栄養も、安全も、予算も、季節も。",
          "いろんなことを考えて、明日の給食ができた！",
        ],
      },
    },
    // ============ 農家・生産者 ============
    {
      id: "farmer-lunch",
      professionId: "farmer",
      eventId: "lunch-late",
      gameType: "farm",
      place: { name: "畑（3か月前）", image: A("bg-farm") },
      mission: {
        title: "給食に使うにんじんが足りない！",
        lines: ["でも、にんじんは今日作れない。", "…時をさかのぼって、3か月前の畑へ！"],
      },
      tools: [
        { id: "seed", name: "種・苗", image: A("item-seedling"), desc: "いつまくかで、収穫の時期が決まる。" },
        { id: "weather", name: "天候", emoji: "🌦", desc: "太陽と雨。思いどおりにはならない相手。" },
        { id: "water", name: "水やり", emoji: "🚿", desc: "暑い日ほど水の管理が大事。" },
        { id: "machine", name: "農機具", emoji: "🚜", desc: "広い畑を耕し、収穫を助ける機械。" },
      ],
      resolution: {
        title: "にんじん300kg、収穫！",
        lines: ["トラックにのせて給食室へ。", "今日の給食は、何か月も前から始まっていた。"],
      },
    },
    // ============ 物流 ============
    {
      id: "logistics-lunch",
      professionId: "logistics",
      eventId: "lunch-late",
      gameType: "logistics",
      place: { name: "物流センター", image: A("bg-warehouse") },
      mission: {
        title: "給食の食材がまだ届いてない！",
        lines: ["11:00までに学校へ届けよう！"],
      },
      tools: [
        { id: "truck", name: "配送トラック", image: A("item-truck"), desc: "ふつうの荷台と、冷やして運べる冷蔵車がある。" },
        { id: "map", name: "地図・道路情報", image: A("item-map"), desc: "どの道をどの順番で走るか。渋滞や工事もチェック。" },
        { id: "time", name: "締切時刻", emoji: "⏰", desc: "給食は待ってくれない。時間から逆算する。" },
      ],
      resolution: {
        clock: "11:00",
        title: "食材、学校に到着！",
        lines: ["これで給食が作れる！"],
      },
    },
    // ============ 食品リサイクル ============
    {
      id: "recycle-lunch",
      professionId: "recycle",
      eventId: "lunch-late",
      gameType: "recycle",
      place: { name: "給食のあとで", image: A("bg-recycle") },
      mission: {
        title: "こんなに食べ残しが！\nこれ、全部ごみになるの？",
        lines: ["食べ物の「その後」を追いかけてみよう。"],
      },
      tools: [
        { id: "sort", name: "分別", emoji: "🗂", desc: "何がまざっているかで、次の使い道が変わる。" },
        { id: "compost", name: "肥料化", image: A("item-compost"), desc: "食べ残しを発酵させて、畑の肥料に変える。" },
        { id: "feed", name: "飼料化", emoji: "🐖", desc: "動物のえさとして生かす方法もある。" },
      ],
      resolution: {
        title: "ごみじゃなくて、資源だった！",
        lines: ["食べ残しが肥料になって、畑へ運ばれていく…"],
      },
    },
  ],
};
