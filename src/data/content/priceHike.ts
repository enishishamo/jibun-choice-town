// Theme module: 物価高編（アイスが高くなった！）
// One product (an ice cream) seen from four jobs inside a food maker.
// Screens are shared with 給食編 / 猛暑編 — only this data + the four
// game components are new.
//
// TODO: FACT CHECK — 会社によって職種名・分担は異なる。ここでは
//  「調達」「商品開発」「包装・パッケージ」「生産技術など」という
//  一般的な呼び方にとどめ、断定を避けている。数量・価格・処理数は
//  子どもが操作して違いを感じるためのプロトタイプ用の値。
import type { ContentModule } from "../types";

const P = (name: string) => `${import.meta.env.BASE_URL}assets/price/${name}.jpg`;

export const priceHike: ContentModule = {
  places: [
    {
      id: "shop",
      name: "お店",
      eventId: "ice-price",
      mapPos: { left: "68%", top: "63%" },
    },
  ],

  events: [
    {
      id: "ice-price",
      placeId: "shop",
      title: "えっ！？\nいつものアイスが高くなってる！",
      shortLabel: "アイスが高くなってる！",
      areaName: "アイスのうら側",
      areaLead: "アイスのうらでは、何が起きてるんだろう？\n気になるところに入ってみよう。",
      mood: "price",
      sceneMap: {
        image: P("overview"),
        opening: {
          image: P("shop"),
          lines: ["180円 → 230円", "アイスのうらでは、何が起きてるんだろう？"],
        },
      },
      wrapUp: {
        image: P("shop"),
        title: "アイスの値段のうらには、こんなにいろんな仕事があった！",
        lines: [
          "材料の値段が上がると、アイスの値段も上がることがある。それは、だれかがサボっているからではない。",
          "値段をできるだけおさえるために、いろんな仕事の人が、それぞれちがうところを工夫していた。",
        ],
      },
      lensSummary: {
        intro: "1つのアイスのうらで、みんなちがうところを見て工夫していた。",
        rows: [
          { icon: "🥛", label: "材料", view: "値段・品質・届く日" },
          { icon: "🍨", label: "試作", view: "味とコストのバランス" },
          { icon: "📦", label: "包装", view: "守れるか・ムダはないか" },
          { icon: "🏭", label: "工場", view: "ラインのデータ" },
        ],
      },
      incidents: [
        {
          id: "material-up",
          emoji: "🥛",
          title: "材料が高くなってる！",
          experienceId: "sourcing-ice",
          scenePos: { left: "14%", top: "56%" },
        },
        {
          id: "taste-keep",
          emoji: "🍨",
          title: "このおいしさ、どうやって守る？",
          experienceId: "recipe-ice",
          scenePos: { left: "38%", top: "56%" },
        },
        {
          id: "package-up",
          emoji: "📦",
          title: "包む材料まで高くなった！",
          experienceId: "package-ice",
          scenePos: { left: "62%", top: "56%" },
        },
        {
          id: "factory-waste",
          emoji: "⚙️",
          title: "工場にムダがあるみたい…",
          experienceId: "factory-ice",
          scenePos: { left: "86%", top: "56%" },
        },
      ],
    },
  ],

  professions: [
    {
      id: "sourcing",
      name: "食品メーカーの「調達」の仕事",
      catch: "必要な材料を、必要な時に、必要なだけ",
      image: P("warehouse"),
      discoveryLine: "値段だけでなく、品質・量・届く日を見ながら、\n材料をそろえる仕事！",
      q2: [
        {
          id: "what",
          title: "どんな仕事？",
          icon: "🥛",
          body: [
            "商品をつくるための材料を、どこから・いくらで・いつまでに買うかを決めます。",
            "「安いところ」だけを選べばいいわけではありません。品質・届く日・その会社がどれくらい安定して供給できるかも合わせて考えます。",
          ],
        },
        {
          id: "kinds",
          title: "ひとつの仕事ではない",
          icon: "🧩",
          body: ["材料が届くまでには、いろんな役割の人がいます。"],
          list: [
            "仕入先をさがして交渉する人（調達・購買）",
            "在庫や倉庫を管理する人",
            "品質をチェックする人（品質保証）",
            "運ぶ計画を立てる人（物流）",
            "…など",
          ],
        },
        {
          id: "himitsu",
          title: "実は！",
          icon: "💡",
          body: [
            "1社にまとめて頼むと安くなることもありますが、その会社が届けられなくなったとき、商品が作れなくなります。だから複数の仕入先に分けることがあります。",
          ],
        },
      ],
      related: ["購買", "品質保証", "物流", "貿易", "商社"],
    },
    {
      id: "product-dev",
      name: "食品メーカーの「商品開発」の仕事",
      catch: "おいしさとコストのバランスを考える",
      image: P("lab"),
      discoveryLine: "材料の組み合わせを変えて、\n味とコストがどう変わるか試す仕事！",
      q2: [
        {
          id: "what",
          title: "どんな仕事？",
          icon: "🍨",
          body: [
            "どんな材料を、どれくらい混ぜるかを考えて、新しい商品や改良した商品をつくります。",
            "何度も試作して、味・見た目・コスト・作りやすさを見ながら決めていきます。",
          ],
        },
        {
          id: "day",
          title: "1日の流れ",
          icon: "🕐",
          body: [],
          flow: [
            "朝｜前の日の試作を食べて確認",
            "午前｜配合を変えて試作",
            "午後｜みんなで味を確かめる（官能評価）",
            "夕｜結果を記録して、次の案を考える",
          ],
        },
        {
          id: "become",
          title: "どうやったらなれる？",
          icon: "🎓",
          body: [
            "農学・食品・栄養・化学などを学ぶ道があります。調理や製菓から進む人もいます。",
          ],
        },
        {
          id: "himitsu",
          title: "実は！",
          icon: "💡",
          body: [
            "「味を数字で表す」ことがあります。何人かで食べて、甘さやなめらかさを点数にして比べる方法（官能評価）です。",
          ],
        },
      ],
      related: ["研究開発", "品質保証", "生産技術", "マーケティング", "栄養"],
    },
    {
      id: "packaging",
      name: "包装・パッケージを考える仕事",
      catch: "中身を守りながら、ムダをへらす",
      image: P("package"),
      discoveryLine: "素材や形を選んで、商品を守れるか・\n使いやすいかを試す仕事！",
      q2: [
        {
          id: "what",
          title: "どんな仕事？",
          icon: "📦",
          body: [
            "商品を包む素材・形・大きさを考えます。中身を守ることが第一で、そのうえで開けやすさや、使う材料の量も考えます。",
            "パッケージには、商品名・原材料・賞味期限・アレルゲンなど、書かなければいけない表示もあります。",
          ],
        },
        {
          id: "kinds",
          title: "ひとつの仕事ではない",
          icon: "🧩",
          body: ["パッケージができるまでにも、いろんな人が関わります。"],
          list: [
            "包装の素材や構造を考える人",
            "デザインする人",
            "印刷・表示を確認する人",
            "包装する機械を動かす人",
            "…など",
          ],
        },
        {
          id: "himitsu",
          title: "実は！",
          icon: "💡",
          body: [
            "包装を薄くすると材料は減りますが、運ぶ途中でつぶれると商品ごとムダになります。「減らす」と「守る」のバランスを探す仕事です。",
          ],
        },
      ],
      related: ["パッケージデザイン", "資材開発", "印刷", "環境・リサイクル", "生産技術"],
    },
    {
      id: "line-eng",
      name: "工場のラインをよくする仕事",
      catch: "データを見て、止まる原因を見つける",
      image: P("factory"),
      discoveryLine: "ラインのデータを見て、止まっている原因をさがし、\n安定して作れるようにする仕事！",
      q2: [
        {
          id: "what",
          title: "どんな仕事？",
          icon: "⚙️",
          body: [
            "工場のラインが、止まらず・ムダなく・安全に動くように考えます（生産技術・設備保全などと呼ばれます）。",
            "どこで詰まっているか、どこでロスが出ているかをデータで確かめて、機械の設定や流し方を直していきます。",
          ],
        },
        {
          id: "kinds",
          title: "ひとつの仕事ではない",
          icon: "🧩",
          body: ["工場にも、いろんな役割の人がいます。"],
          list: [
            "ラインの設計・改善を考える人（生産技術）",
            "機械を直す人（設備保全）",
            "毎日の生産を回す人（製造）",
            "品質を確かめる人（品質管理）",
            "…など",
          ],
        },
        {
          id: "himitsu",
          title: "実は！",
          icon: "💡",
          body: [
            "ライン全体の速さは、いちばん遅い工程で決まります。そこを見つけて直すと、全体が速くなることがあります。",
          ],
        },
      ],
      related: ["機械", "電気・制御", "設備保全", "品質管理", "ロボット"],
    },
  ],

  experiences: [
    // ============ ① 材料／倉庫 ============
    {
      id: "sourcing-ice",
      professionId: "sourcing",
      eventId: "ice-price",
      gameType: "sourcing_mix",
      place: { name: "材料・倉庫", image: P("warehouse"), fit: "cover", focus: "center 38%" },
      mission: {
        title: "材料が高くなってる！",
        lines: ["いちご原料を、来週までに120kgそろえよう。"],
      },
      tools: [],
      resolution: {
        title: "材料、そろった！",
        lines: ["これでアイスがつくれる。"],
      },
      discoveryEcho:
        "値段だけじゃなく、品質・量・届く日などを見ながら、必要な材料をそろえていたよね。",
      seeds: [
        "いくつかの条件を比べる",
        "数字を見る",
        "組み合わせを考える",
        "試して変化を見る",
        "特にない",
      ],
    },
    // ============ ② 試作室 ============
    {
      id: "recipe-ice",
      professionId: "product-dev",
      eventId: "ice-price",
      gameType: "recipe_balance",
      place: { name: "試作室", image: P("lab"), fit: "cover", focus: "center 42%" },
      mission: {
        title: "このおいしさ、どうやって守る？",
        lines: ["材料費が上がった。味をできるだけ守りながら、コストを下げよう。"],
      },
      tools: [],
      resolution: {
        title: "新しい配合、できた！",
        lines: ["いつものおいしさを守りながら、コストを下げられた。"],
      },
      discoveryEcho:
        "材料の組み合わせを変えて、味やコストがどう変わるか試していたよね。",
      seeds: [
        "組み合わせを考える",
        "試して変化を見る",
        "数字を見る",
        "もっといい方法を考える",
        "特にない",
      ],
    },
    // ============ ③ 包装 ============
    {
      id: "package-ice",
      professionId: "packaging",
      eventId: "ice-price",
      gameType: "package_design",
      place: { name: "包装・パッケージ開発室", image: P("package"), fit: "cover", focus: "center 30%" },
      mission: {
        title: "包む材料まで高くなった！",
        lines: ["中身を守りながら、ムダの少ない包み方を考えよう。"],
      },
      tools: [],
      resolution: {
        title: "この包み方でいこう！",
        lines: ["商品を守れて、材料のムダも少ない。"],
      },
      discoveryEcho:
        "材料を選んで、商品を守れるか、使いやすいか、ムダがないかを試していたよね。",
      seeds: [
        "ものの形を考える",
        "組み合わせを考える",
        "試して変化を見る",
        "ムダをへらす方法を考える",
        "特にない",
      ],
    },
    // ============ ④ 工場 ============
    {
      id: "factory-ice",
      professionId: "line-eng",
      eventId: "ice-price",
      gameType: "line_debug",
      place: { name: "アイス工場", image: P("factory"), fit: "cover", focus: "center 26%" },
      mission: {
        title: "工場にムダがあるみたい…",
        lines: ["ラインを動かして、止まっている場所をさがそう。"],
      },
      tools: [],
      resolution: {
        title: "ラインが流れるようになった！",
        lines: ["止まっていた場所を、アイスが流れていく。"],
      },
      discoveryEcho:
        "ラインのデータを見て、止まっている原因を探して、もっと安定して作れるようにしていたよね。",
      seeds: [
        "ムダや原因を探す",
        "機械の動きを見る",
        "数字を見る",
        "もっといい方法を考える",
        "特にない",
      ],
    },
  ],
};
