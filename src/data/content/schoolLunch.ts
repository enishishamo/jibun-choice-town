// Theme module: 学校／給食
// Adding a future theme (hospital, weather, prices...) = add a file like
// this one and register it in data/index.ts. No screen changes needed.
// The event is one entry point; its incidents explore the whole "backstage"
// of school lunch (畑→物流→給食室→教室→食べたあと→リサイクル→畑).
import type { ContentModule } from "../types";

const A = (name: string) => `${import.meta.env.BASE_URL}assets/${name}.png`;
const K = (name: string) => `${import.meta.env.BASE_URL}assets/kyushoku/${name}.jpg`;

export const schoolLunch: ContentModule = {
  places: [
    {
      id: "school",
      name: "学校",
      eventId: "lunch-late",
      mapPos: { left: "38%", top: "47%" },
    },
    // Visible in the world but quiet today — hints that the world is bigger.
    { id: "station", name: "工場", mapPos: { left: "24%", top: "24%" } },
    { id: "park", name: "公園", mapPos: { left: "35.5%", top: "106%" } },
  ],

  events: [
    {
      id: "lunch-late",
      placeId: "school",
      title: "大変！\n今日の給食が間に合わない！",
      shortLabel: "給食が間に合わない！",
      areaName: "給食のうらがわ",
      areaLead: "給食のうらがわでは、いろんな仕事が動いてる。\n気になるところをのぞいてみよう。",
      incidents: [
        {
          id: "menu-mystery",
          image: A("item-veggies"),
          title: "来月の野菜が足りなくなりそう！",
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
          title: "このにんじん、どうやって育てた？",
          experienceId: "farmer-lunch",
          scenePos: { left: "20%", top: "56%" },
        },
        {
          id: "not-delivered",
          image: A("item-truck"),
          title: "食材は今朝、どうやって届いた？",
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
      catch: "数百〜数千人分の料理を、安全に作るプロ！",
      image: A("char-cook"),
      discoveryLine: "たくさんの給食を、\n安全をたしかめながら完成させるプロ！",
      q2: [
        {
          id: "what",
          title: "どんな仕事？",
          icon: "🍳",
          body: [
            "野菜を洗う、切る、煮る、焼く。でも、それだけではありません。",
            "工程表にそって、たくさんの給食を安全に完成させる仕事です。温度の確認や記録も大事な仕事です。",
          ],
        },
        {
          id: "day",
          title: "1日をのぞく",
          icon: "🕐",
          body: [],
          flow: [
            "朝｜食材を受け取る・下処理",
            "午前｜大量調理・中心温度の確認と記録",
            "お昼前｜クラスごとに分けて給食へ！",
            "午後｜食器や食缶を洗って消毒",
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
            "給食センターでは、一日に何千食も作ることがあります。",
            "「料理ができる」だけでなく、安全のルールを守りながら大量の料理を同じ時間までに完成させることが専門性です。",
          ],
        },
      ],
      related: ["調理師", "栄養士", "食品工場", "ホテルやレストランの調理"],
    },
    {
      id: "nutrition",
      name: "栄養教諭・学校栄養職員",
      catch: "給食と「食べること」の先生！",
      image: A("char-nutrition"),
      discoveryLine: "栄養・お金・季節をまとめて考えて、\nみんなの給食を成り立たせる仕事！",
      q2: [
        {
          id: "what",
          title: "どんな仕事？",
          icon: "📋",
          body: [
            "献立を計画し、食材を選び、学校で「食べること」について教える仕事です。",
            "天候や価格で食材が変わっても、栄養の基準を満たすように調整します。",
          ],
        },
        {
          id: "day",
          title: "1日の流れ",
          icon: "🕐",
          body: [],
          flow: [
            "給食の確認",
            "献立・食材の管理、食育",
            "子どもの様子を見る",
            "これからの給食や食育を考える",
          ],
        },
        {
          id: "become",
          title: "どうやったらなれる？",
          icon: "🎓",
          body: ["栄養士・管理栄養士に関する学び ＋ 栄養教諭免許（栄養教諭の場合）。"],
        },
        {
          id: "himitsu",
          title: "実は！",
          icon: "💡",
          body: [
            "「栄養の専門家」であり「先生」でもある仕事です。",
            "アレルギーのある子には、みんなの献立とは別に、その子が安全に食べられる方法を個別に考えます。",
          ],
        },
      ],
      related: ["管理栄養士", "栄養士", "食品開発", "調理"],
    },
    {
      id: "farmer",
      name: "農家・生産者",
      catch: "何か月も先を考えて、食べ物を育てるプロ！",
      image: `${import.meta.env.BASE_URL}assets/kyushoku/farmer_char.png`,
      discoveryLine: "品種・気温・カレンダーを読んで、\n何か月も前から育てる計画を立てるプロ！",
      q2: [
        {
          id: "what",
          title: "どんな仕事？",
          icon: "🌱",
          body: [
            "野菜、米、果物などを育てて届けます。",
            "品種の性質や天候を見ながら、何か月も先を考えて計画を立てます。",
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
      name: "給食の食材を届ける仕事",
      catch: "温度と時間を守って、食べ物の安全をつなぐ！",
      image: A("char-logistics"),
      discoveryLine: "食材ごとの温度と納品時刻を守って、\n朝の学校へ安全に届ける仕事！",
      q2: [
        {
          id: "what",
          title: "どんな仕事？",
          icon: "🚚",
          body: [
            "給食の食材を、決められた温度と時刻で学校へ届ける仕事です。",
            "調理が始まる前の朝に届ける必要があります。",
          ],
        },
        {
          id: "kinds",
          title: "実はひとつの仕事ではない",
          icon: "🧩",
          body: ["「届ける」の中には、いろんな役割の人がいます。"],
          list: [
            "配送の計画を考える人",
            "トラックのドライバー",
            "倉庫で商品を管理する人",
            "学校側で受け取りを確認する人（検収）",
            "…など",
          ],
        },
        {
          id: "himitsu",
          title: "実は！",
          icon: "💡",
          body: [
            "食べ物によって「運ぶ温度」がちがいます。",
            "学校に着いたら、学校側の担当者が温度などを確認してから受け取ります（検収）。",
          ],
        },
      ],
      related: ["鉄道貨物", "船", "航空貨物", "倉庫", "物流企画"],
    },
    {
      id: "recycle",
      name: "食べ残しを資源に変える工場の仕事",
      catch: "食べ物の「その後」を、肥料などの資源に！",
      image: A("char-recycle"),
      discoveryLine: "道具の性質を使い分けて異物を取りのぞき、\n食べ残しを安全な資源に変える仕事！",
      q2: [
        {
          id: "what",
          title: "どんな仕事？",
          icon: "♻️",
          body: [
            "学校や店から届いた食べ残しを、肥料などの資源に変える工場の仕事です。",
            "まざった異物を取りのぞくことが、安全な資源づくりの第一歩です。",
          ],
        },
        {
          id: "kinds",
          title: "実はひとつの仕事ではない",
          icon: "🧩",
          body: ["工場のまわりにも、いろんな役割の人がいます。"],
          list: [
            "食べ残しを集めて運ぶ人",
            "工場の機械を動かす人",
            "選別する人",
            "できた肥料の品質を管理する人",
            "…など",
          ],
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
    // ============ 給食調理員 ============
    {
      id: "cook-lunch",
      professionId: "cook",
      eventId: "lunch-late",
      gameType: "inspect_and_measure",
      place: { name: "給食室", image: K("school_kitchen"), fit: "cover", focus: "center 34%" },
      mission: {
        title: "500人分の給食を、\n安全に完成させよう！",
        lines: ["工程表と道具をたしかめながら進めよう。"],
      },
      tools: [
        { id: "chart", name: "作業工程表", emoji: "📋", desc: "チーフが事前に作った、今日の作業の設計図。" },
        { id: "thermo", name: "中心温度計", image: A("tool-thermo"), desc: "食べ物の中心の温度をはかる。" },
        { id: "rule", name: "衛生ルール", emoji: "🧼", desc: "安全のための決まり。温度や測り方も書いてある。" },
        { id: "record", name: "記録票", emoji: "✍️", desc: "確認した温度と時刻を記録に残す。" },
      ],
      resolution: {
        title: "安全確認、完了！",
        lines: [
          "配缶して、検食もすませて、教室へ。",
          "「いただきます！」の声が聞こえてきた。",
        ],
      },
      discoveryEcho:
        "さっき、魚の温度を測って、基準に届いているか確かめたよね。500人が安全に食べられるように、こうやって一つずつ確かめながら作る。",
      seeds: ["道具を使って測る", "数字を見て判断する", "たくさんの人の安全を守る", "うまくいくまで試す", "とくにない"],
    },
    // ============ 栄養教諭・学校栄養職員 ============
    {
      id: "nutrition-lunch",
      professionId: "nutrition",
      eventId: "lunch-late",
      gameType: "drag_and_drop",
      place: { name: "学校（給食を考える部屋）", image: A("bg-school"), fit: "contain" },
      mission: {
        title: "来月使う予定の野菜が、\n少なくなりそう！",
        lines: ["資料を見ながら、献立と食材を調整しよう。"],
      },
      tools: [
        { id: "menu", name: "来月の献立", emoji: "📋", desc: "事前に計画してある献立表。" },
        { id: "nutri", name: "栄養の基準", emoji: "🥗", desc: "給食1食に必要な栄養の目安。" },
        { id: "price", name: "食材と価格", emoji: "💴", desc: "食材ごとの、今の値段の情報。" },
        { id: "season", name: "旬・地場の情報", emoji: "🌸", desc: "今の季節に合う食材、この町でとれる食材。" },
        { id: "kitchen", name: "調理場の情報", emoji: "🍳", desc: "給食室で作れる料理・作業の情報。" },
      ],
      resolution: {
        title: "来月の献立、調整できた！",
        lines: [
          "使う食材が決まった。",
          "注文が、農家や納入業者さんへ伝わっていく…",
        ],
      },
      discoveryEcho:
        "さっき、トレーの料理を入れかえながら、栄養・お金・調達のバランスが合う組み合わせを探したよね。栄養教諭・学校栄養職員は、こうやってみんなの給食を成り立たせています。",
      seeds: [
        "条件を見ながら入れかえる",
        "代わりを考える",
        "数字を見て決める",
        "みんなの食事を考える",
        "とくにない",
      ],
    },
    // ============ 農家・生産者 ============
    {
      id: "farmer-lunch",
      professionId: "farmer",
      eventId: "lunch-late",
      gameType: "sow_and_grow",
      place: { name: "にんじん畑", image: K("farm_field"), fit: "cover", focus: "center 62%" },
      mission: {
        title: "給食で使うにんじんを\n育てたい！",
        lines: ["でも、いつでも同じように作れるわけじゃない。", "資料を見て、育てる計画を立てよう。"],
      },
      tools: [
        { id: "variety", name: "品種と栽培ごよみ", emoji: "🥕", desc: "品種ごとの、まきどき・日数・性質。" },
        { id: "weather", name: "気温の情報", emoji: "🌡", desc: "今年の気温の予報と、発芽に良い温度。" },
        { id: "order", name: "必要な時期", emoji: "📅", desc: "給食室からの注文。いつ・どれだけ必要か。" },
        { id: "soil", name: "畑の土", emoji: "🟤", desc: "土の状態の情報。" },
      ],
      resolution: {
        title: "にんじん300kg、収穫！",
        lines: [
          "給食用の箱につめて、トラックへ。",
          "今日の給食は、何か月も前から始まっていた。",
        ],
      },
      discoveryEcho:
        "さっき、種をえらんで畑にまいて、うまく育つまで試したよね。農家・生産者は、品種や天候を読みながら、何か月も先の「必要な時期」から逆算して育てています。",
      seeds: ["試してうまくいく方法を探す", "先のことから逆算する", "生きものを育てる", "天気や自然を読む", "とくにない"],
    },
    // ============ 給食の食材を届ける仕事 ============
    {
      id: "logistics-lunch",
      professionId: "logistics",
      eventId: "lunch-late",
      gameType: "load_and_route",
      place: { name: "食材を届ける会社（朝7:00）", image: K("delivery_center"), fit: "cover", focus: "center 45%" },
      mission: {
        title: "2つの学校に、調理が始まる前に\n食材を届けたい！",
        lines: ["温度と、回る順番。どっちも考えて出発しよう。"],
      },
      tools: [
        { id: "order", name: "学校からの注文書", emoji: "📄", desc: "今日届ける食材のリスト。" },
        { id: "temp", name: "保存温度の資料", emoji: "🌡", desc: "食材ごとの、運ぶときの温度の決まり。" },
        { id: "truck", name: "トラックの情報", image: A("item-truck"), desc: "冷蔵室と常温室がある配送車。" },
        { id: "time", name: "納品時刻", emoji: "⏰", desc: "学校に届ける締め切りの時刻。" },
      ],
      resolution: {
        clock: "8:20",
        title: "2校とも、安全な状態で時間までに届いた！",
        lines: [],
      },
      discoveryEcho:
        "さっき、食材を温度ごとに積み分けて、回る順番も考えたよね。給食の食材を届ける仕事は、温度と時間を守って、食べ物の安全を学校までつないでいます。",
      seeds: ["温度や時間の条件を守る", "順番ややり方を組み立てる", "うまくいくまで積み直す", "とくにない"],
    },
    // ============ 食べ残しを資源に変える工場 ============
    {
      id: "recycle-lunch",
      professionId: "recycle",
      eventId: "lunch-late",
      gameType: "sort_out",
      place: { name: "リサイクル工場", image: K("recycle_sorting"), fit: "cover", focus: "center 55%" },
      mission: {
        title: "食べ残しが工場に届いた。\nでも、このままではリサイクルできない！",
        lines: ["まざっている異物を、道具を使い分けて取りのぞこう。"],
      },
      tools: [
        { id: "rule", name: "受入ルール", emoji: "📋", desc: "この工場が受け入れられるもの・ダメなもの。" },
        { id: "magnet", name: "磁選機", emoji: "🧲", desc: "強い磁石で異物を取りのぞく機械。" },
        { id: "wind", name: "風力選別", emoji: "💨", desc: "風の力で異物を分ける機械。" },
        { id: "hand", name: "手選別", emoji: "🫲", desc: "人の目で見て、異物を取りのぞく。" },
      ],
      resolution: {
        title: "きれいになった食べ残しが、\n資源に変わっていく！",
        lines: ["発酵させて、約2か月。肥料のできあがり。"],
      },
      discoveryEcho:
        "さっき、磁石や網を使い分けて異物を取りのぞいたよね。工場では、こうやって道具の性質をいかして、食べ残しを安全な肥料に変えています。",
      seeds: ["道具を使い分ける", "まざった物を仕分ける", "ごみが資源に変わる", "とくにない"],
    },
  ],
};
