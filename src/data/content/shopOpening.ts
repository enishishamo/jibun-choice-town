// Theme module: 商店街・開店編（factory/projects/shop-opening/design.md v1.2）
// One story: ハルさん (NPC) wants to open a small teishoku diner in a
// shuttered shopping street. Five professions support the same opening,
// each seeing completely different information (matching / coaching /
// loan screening / interior design / hygiene inspection).
//
// Art status (Stage 6): ba-before / ba-after / char-haru generated via the
// Art Harness (codex_imagegen, QA passed — factory/state/art/manifest-v2.json).
// Remaining by design: incidents / tools stay emoji, profession heroes keep
// the inline SVG placeholder (optional per art-plan-v2; upgrade later).
import type { ContentModule } from "../types";

const S = (n: string) => `${import.meta.env.BASE_URL}assets/shop/${n}.png`;

// Interim discovery-hero for the five PROFESSION cards (intentionally kept as
// SVG placeholders per art-plan-v2; the story NPC char-haru IS generated).
const hero = (emoji: string, bg: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'><circle cx='80' cy='80' r='74' fill='${bg}'/><text x='80' y='106' font-size='72' text-anchor='middle'>${emoji}</text></svg>`,
  );

export const shopOpening: ContentModule = {
  places: [
    {
      id: "shopping-street",
      name: "商店街",
      eventId: "shop-opening",
      mapPos: { left: "55%", top: "14%" },
    },
  ],

  events: [
    {
      id: "shop-opening",
      placeId: "shopping-street",
      title: "シャッターだらけの商店街に、\n「お店を開きたい」人が来た",
      shortLabel: "商店街に新しい店？",
      areaName: "商店街のうらがわ",
      sceneMap: {
        image: S("ba-before"),
        opening: {
          image: S("char-haru"),
          lines: [
            "「ここで、じぶんのお店を開きたいんです」",
            "シャッターの下りた商店街に、ハルさんがやって来た。",
          ],
          cta: "ハルさんの夢を、追いかけてみる",
        },
      },
      areaLead:
        "「ここで、じぶんのお店を開きたいんです」\nハルさんの夢がかなうまでを、追いかけてみよう。",
      incidents: [
        {
          id: "ch1",
          scenePos: { left: "22%", top: "20%" },
          emoji: "🏬",
          title: "① どのシャッターなら、開けられる？",
          experienceId: "shop-vacancy",
        },
        {
          id: "ch2",
          scenePos: { left: "74%", top: "24%" },
          emoji: "📝",
          title: "② この計画で、だいじょうぶ？",
          experienceId: "shop-coach",
        },
        {
          id: "ch3",
          scenePos: { left: "48%", top: "48%" },
          emoji: "💴",
          title: "③ お店を開くお金、どうする？",
          experienceId: "shop-loan",
          requires: ["shop-vacancy", "shop-coach"],
          requiresHint: "物件と計画の両方がそろってから、お金の相談へ行こう。",
        },
        {
          id: "ch4",
          scenePos: { left: "22%", top: "72%" },
          emoji: "📐",
          title: "④ お店の中を、どうつくる？",
          experienceId: "shop-design",
          requires: ["shop-loan"],
          requiresHint: "お金のめどが立ってから、工事の設計を始めよう。",
        },
        {
          id: "ch5",
          scenePos: { left: "72%", top: "76%" },
          emoji: "🔍",
          title: "⑤ 開店してもいいか、たしかめる",
          experienceId: "shop-inspect",
          requires: ["shop-design"],
          requiresHint: "お店ができあがってから、検査に行こう。",
        },
      ],
      lensSummary: {
        intro: "ハルさんの「お店を開きたい」を、みんなちがうものを見て支えていた。",
        rows: [
          { icon: "🏬", label: "空き店舗", view: "所有者の気持ちと、商店街ぜんたいのバランス" },
          { icon: "📝", label: "計画支援", view: "売上の計算に、根拠があるか" },
          { icon: "💴", label: "融資審査", view: "通帳の貯まり方と、返せる計画か" },
          { icon: "📐", label: "内装設計", view: "基準・使いやすさ・席数を、1枚の図面で" },
          { icon: "🔍", label: "衛生検査", view: "図面どおりか、基準に合っているか、現場で" },
        ],
      },
      wrapUp: {
        beforeAfter: {
          before: S("ba-before"),
          after: S("ba-after"),
          beforeLabel: "はじまり：シャッター通り",
          afterLabel: "いま：1枚だけ、開いた",
        },
        title: "シャッターが1枚、開きました。",
        lines: [
          "お店を開いたのはハルさん。でも、開くまでには、ぜんぜんちがう見方をする人たちがいた。",
          "となりの元・洋品店でも、もう1軒の新しい店が準備を始めている。",
          "商店街の空き店舗は全国平均で13.59%。この1枚が開くのは、当たり前のことじゃないんだ。",
        ],
      },
    },
  ],

  professions: [
    {
      id: "tenant-coordinator",
      name: "商店街の空き店舗対策に関わる仕事",
      catch: "空き店舗と「開きたい人」をつないで、通りをつくり直す",
      image: hero("🏬", "#f9e8cf"),
      discoveryLine: "空き店舗の事情と商店街ぜんたいを見て、\n「開きたい人」と店をつなぐ仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "🏬",
          body: [
            "商店街の空き店舗を調べて、お店を開きたい人とつなぎます。",
            "空き店舗は「ある」だけでは使えません。所有者さんに貸してもらう相談から始まって、どんなお店が来ると商店街ぜんたいが元気になるかも考えます。",
          ],
        },
        {
          id: "who", title: "だれがやっている？", icon: "🧩", body: [],
          list: [
            "商店街の組合（振興組合）",
            "まちづくり会社",
            "タウンマネージャー",
            "市や町の商業担当",
            "…地域によって分担がちがう",
          ],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "空き店舗が埋まらない理由をたずねた調査では、約4割で「所有者に貸す意思がない」が挙がっています。だから最初の仕事は、宣伝ではなく「貸してもらう相談」なんです。",
          ],
        },
      ],
      related: ["不動産の仲介", "市役所の商業振興", "まちづくり会社"],
    },
    {
      id: "keiei-shidoin",
      name: "経営指導員（商工会議所）",
      catch: "決めるのは本人。計画を磨く、伴走役",
      image: hero("📝", "#e3eed9"),
      discoveryLine: "お店を始めたい人の計画を、\n本人が説明できる数字に磨く仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "📝",
          body: [
            "お店や会社を始めたい人・経営している人の相談にのり、計画づくりやお金のことを手伝います。",
            "お金を貸す人ではありません。決めるのはあくまで本人で、指導員は計画の弱点に気づいてもらう伴走役です。",
          ],
        },
        {
          id: "how", title: "こんな助けかた", icon: "🧩", body: [],
          list: [
            "創業計画書づくりの相談",
            "売上の計算に根拠があるかのチェック",
            "合う融資や補助金の紹介",
            "長く相談にのった人を、無担保の融資へ推薦（マル経融資）",
          ],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "売上の予測には決まった計算のしかたがあります。飲食店なら「客単価×席数×回転数」。「なんとなく来そう」ではなく、根拠のある数字に直すのがプロの仕事です。",
          ],
        },
      ],
      related: ["創業融資の審査", "税理士", "中小企業診断士"],
    },
    {
      id: "loan-screener",
      name: "創業融資の審査に関わる仕事（日本政策金融公庫）",
      catch: "実績ゼロの挑戦に、「返せる計画か」を確かめてお金を届ける",
      image: hero("💴", "#dde9f5"),
      discoveryLine: "書類と面談で「返せる計画か」を確かめて、\n実績のない挑戦にお金を届ける仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "💴",
          body: [
            "お店を始める人には、まだ実績がありません。ふつうの銀行ではお金を借りにくいことも多いので、国がつくった金融機関が「返せる計画か」を確かめて貸します。",
            "落とすための審査ではなく、返せる範囲でお金を届けるための審査です。",
          ],
        },
        {
          id: "check", title: "何を見ている？", icon: "🧩", body: [],
          list: [
            "創業計画書（売上の根拠・経費・借りたい額）",
            "通帳の「貯まり方」（額だけじゃない）",
            "その仕事の経験",
            "お金の使いみち（見積書と合っているか）",
          ],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "自己資金は「いくらあるか」より「どう貯めたか」を見ます。毎月コツコツ貯めた通帳は、計画を続ける力の証拠。直前にポンと入った大金は、出所をたずねられます。",
          ],
        },
      ],
      related: ["経営指導員", "銀行・信用金庫", "信用保証協会"],
    },
    {
      id: "shop-designer",
      name: "店舗デザイナー・内装設計に関わる仕事",
      catch: "基準・使いやすさ・売上を、1枚の図面で成り立たせる",
      image: hero("📐", "#f5e3e0"),
      discoveryLine: "衛生の基準と働きやすさと席数を、\n1枚の図面で同時にかなえる仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "📐",
          body: [
            "お店の中の形を設計します。かっこよさだけではなく、衛生の基準・料理を運ぶ動線・席の数（売上）を、ぜんぶ同時に成り立たせます。",
            "水道や柱など「動かせないもの」から考え始めるのがコツです。",
          ],
        },
        {
          id: "check", title: "何を見ている？", icon: "🧩", body: [],
          list: [
            "現場の実測（給排水・電気・柱の位置）",
            "保健所の施設基準（区画・手洗い・シンク）",
            "予算とお店のコンセプト",
            "働く人の動線",
          ],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "工事を始める前に、図面を持って保健所へ相談に行くのが鉄則です。できあがってから直すと、工事のやり直しでお金も時間も大きく失われるからです。",
          ],
        },
      ],
      related: ["建築士", "内装の施工管理", "食品衛生監視員"],
    },
    {
      id: "food-inspector",
      name: "食品衛生監視員（保健所）",
      catch: "安心して食べられる店だけを、送り出す",
      image: hero("🔍", "#e6e2f2"),
      discoveryLine: "基準と現場を突き合わせて、\n安心して食べられる店だけを送り出す仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "🔍",
          body: [
            "飲食店が開店する前に、お店へ行って実地検査をします。図面どおりにできているか、衛生の基準に合っているかを、現場で1つずつたしかめます。",
            "開店したあとも、街の食の安全を見守り続けます。",
          ],
        },
        {
          id: "where", title: "はたらく場所", icon: "🧩", body: [],
          list: ["保健所（都道府県や市の職員）", "空港や港の検疫所", "…など"],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "検査がきびしいのは、開店を止めるためではありません。お客さんが安心して食べられる店だけを送り出すため。だから基準は、お店の敵ではなく味方なんです。",
            "前のお店の設備が残る「居抜き」物件では、古い設備が今の基準に合わないことがよくあります。",
          ],
        },
      ],
      related: ["店舗デザイナー", "薬剤師", "獣医師", "市役所・県庁"],
    },
  ],

  experiences: [
    // ============ ① どのシャッターなら、開けられる？ ============
    {
      id: "shop-vacancy",
      professionId: "tenant-coordinator",
      eventId: "shop-opening",
      gameType: "tenant_match",
      place: { name: "商店街の事務所" },
      mission: {
        title: "空いている店に、合う人を迎えたい",
        lines: [
          "この商店街には、閉まったままの店が3つある。",
          "「お店を開きたい」という人も、ハルさんをふくめて3組来ている。",
          "でも空き店舗は「ある」だけでは動かせない。だれを、どの店に迎える？",
        ],
        deadline: "ハルさんは、今月中に物件を決めたい",
      },
      tools: [],
      resolution: {
        title: "シャッターが、2枚開くことになった",
        lines: [
          "ハルさんは元・食堂と契約へ。所有者さんとの約束も決まった。",
          "呉服店は今回は動かなかった。空き店舗が埋まらない理由をたずねた調査では、約4割で「所有者に貸す意思がない」が挙がっているんだ。",
        ],
      },
      discoveryEcho:
        "きみがさっき、空き店舗のカルテを開いて、所有者さんの気持ちや商店街の業種バランスを見ながら、だれをどの店に迎えるか考えたよね。実はそれ、「商店街の空き店舗対策に関わる仕事」。空き店舗は「ある」だけでは動かせなくて、貸してもらう交渉から始まるんだ。",
      seeds: [
        "物件のカルテをしらべたこと",
        "所有者さんに合う条件を考えたこと",
        "商店街に足りない業種を考えたこと",
        "だれをどの店に迎えるか組み合わせたこと",
        "断られても別の組み合わせをさがしたこと",
        "特にない",
      ],
    },
    // ============ ② この計画で、だいじょうぶ？ ============
    {
      id: "shop-coach",
      professionId: "keiei-shidoin",
      eventId: "shop-opening",
      gameType: "plan_coach",
      place: { name: "商工会議所の相談窓口" },
      mission: {
        title: "ハルさんの計画を、通る計画に磨きたい",
        lines: [
          "「計画書、書いてみたんです。これでお金、借りられますかね？」",
          "読んでみると…数字に、あやしいところがありそうだ。",
          "決めるのはハルさん。きみは、弱点に気づいてもらう手伝いをする。",
        ],
        deadline: "来週、融資の申しこみに行きたいらしい",
      },
      tools: [],
      resolution: {
        title: "計画書が、説明できる数字になった",
        lines: [
          "売上は「席の数×回転×客単価」で計算し直した。経費にはアルバイト代も入った。",
          "「これなら、自分の言葉で説明できそうです」とハルさん。",
          "決めたのはハルさん自身。きみは、気づく手伝いをしたんだ。",
        ],
      },
      discoveryEcho:
        "きみがさっき、ハルさんに質問して、売上の計算のあやしいところを見つけて、直し方をいっしょに考えたよね。実はそれ、商工会議所の「経営指導員」の仕事。お金を貸すかを決める人ではなく、本人が説明できる計画に磨くのを手伝う、中立の伴走役なんだ。",
      seeds: [
        "質問して話を聞き出したこと",
        "数字のあやしいところをさがしたこと",
        "計算し直して確かめたこと",
        "直し方をいっしょに考えたこと",
        "人の挑戦を応援したこと",
        "特にない",
      ],
    },
    // ============ ③ お店を開くお金、どうする？ ============
    {
      id: "shop-loan",
      professionId: "loan-screener",
      eventId: "shop-opening",
      gameType: "loan_screen",
      place: { name: "日本政策金融公庫の面談室" },
      mission: {
        title: "返せる計画か、たしかめてお金を届けたい",
        lines: [
          "ハルさんが創業融資を申しこんだ。お店の実績は、まだゼロ。",
          "実績のない人の挑戦にお金を貸すのが、ここの仕事。",
          "だからこそ「返せる計画か」を、書類と面談でしっかりたしかめる。",
        ],
        deadline: "面談は今日。1〜2週間後には結果を出す",
      },
      tools: [],
      resolution: {
        clock: "面談から2週間後",
        title: "融資が決まって、開店のお金がそろった",
        lines: [
          "審査の結果、融資が決まった。月々の返済は、計画の利益なら返しながら続けられる額。",
          "「実績ゼロの自分を、数字で見てもらえた」とハルさん。工事の準備が始まる。",
        ],
      },
      discoveryEcho:
        "きみがさっき、通帳のお金の貯まり方までめくって確かめて、「返せる計画か」を見たよね。実はそれ、日本政策金融公庫の「創業融資の審査に関わる仕事」。落とすための審査じゃなく、実績のない人の挑戦に、返せる範囲でお金を届ける仕事なんだ。",
      seeds: [
        "書類どうしを突き合わせたこと",
        "通帳の貯まり方を読んだこと",
        "面談で質問してたしかめたこと",
        "返せるかどうかを計算したこと",
        "人の挑戦を数字で応援したこと",
        "特にない",
      ],
    },
    // ============ ④ お店の中を、どうつくる？ ============
    {
      id: "shop-design",
      professionId: "shop-designer",
      eventId: "shop-opening",
      gameType: "zone_and_fit",
      place: { name: "元・食堂の店内（工事前）" },
      mission: {
        title: "基準を守って、いい店の形をつくりたい",
        lines: [
          "ハルさんの店の内装を設計する。広さと予算は限られている。",
          "「席はなるべく多く。カウンターごしに話せる店にしたい」とハルさん。",
          "でも、衛生の基準を満たさない図面で工事をすると、検査で直しになる。",
        ],
        deadline: "図面が決まらないと工事が始められない",
      },
      tools: [],
      resolution: {
        title: "図面が決まって、工事が始まった",
        lines: [
          "基準の設備を先に置いて、残りのスペースで席と動線をつくった。",
          "先に保健所に相談したから、工事のやり直しの心配はない。",
        ],
      },
      discoveryEcho:
        "きみがさっき、基準で決まっている設備を先に置いてから、残りのスペースで席の数と動線を考えたよね。実はそれ、「店舗デザイナー・内装設計に関わる仕事」。かっこよさだけじゃなく、衛生の基準と、働きやすさと、売上を、1枚の図面で同時に成り立たせるんだ。",
      seeds: [
        "図面にパーツを置いていったこと",
        "基準に合っているかたしかめたこと",
        "席の数と厨房の広さのバランスを取ったこと",
        "水道の位置から配置を考えたこと",
        "工事の前に保健所へ相談したこと",
        "特にない",
      ],
    },
    // ============ ⑤ 開店してもいいか、たしかめる ============
    {
      id: "shop-inspect",
      professionId: "food-inspector",
      eventId: "shop-opening",
      gameType: "scene_audit",
      place: { name: "完成したハルさんの店（実地検査）" },
      mission: {
        title: "開店していいか、現場でたしかめたい",
        lines: [
          "ハルさんの店の営業許可の申請が出た。今日は実地検査の日。",
          "図面どおりにできているか、基準に合っているか、現場で1つずつたしかめる。",
          "合格しないと開店できない。でも、基準はゆるめられない。それがお客さんの安全を守る。",
        ],
        deadline: "ハルさんの開店予定日は10日後。でも検査に「まけて」はいけない",
      },
      tools: [],
      resolution: {
        clock: "再検査の日",
        title: "営業許可が出た。開店できる！",
        lines: [
          "見つけた直すところは、ぜんぶ直って基準に合格。",
          "許可証が交付されて、ハルさんの店は開店できることになった。",
          "検査がきびしいのは、お客さんが安心して食べられるように。開店予定日にも、間に合った。",
        ],
      },
      discoveryEcho:
        "きみがさっき、チェックリストを持ってお店の中を見て回って、直すところを見つけて、再検査までしたよね。実はそれ、保健所の「食品衛生監視員」の仕事。開店を止めるためじゃなく、お客さんが安心して食べられる店だけを送り出すための仕事なんだ。",
      seeds: [
        "現場を見て回ってしらべたこと",
        "チェックリストと突き合わせたこと",
        "直すところを見つけて伝えたこと",
        "再検査でたしかめたこと",
        "書類をかくにんしたこと",
        "特にない",
      ],
    },
  ],
};
