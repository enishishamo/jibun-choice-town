// Theme module: 異常気象・猛暑編
// One event (39℃の猛暑) seen through five completely different sets of
// professional data. Adding this file + registering it in data/index.ts
// is all it takes — screens are shared with 給食編.
//
// TODO: FACT CHECK — 以下は「どの職種の意思決定か」をさらに確認したい:
//  - 電力需給の調整を、実務上どの主体がどの操作で行うか
//  - 渇水時の水利用調整で、各主体がどこまで判断するか
//  - 公園の暑熱対策設計／都市暑熱解析を、どの職業名で子どもに示すのが
//    最も適切か（複数の専門職・行政・研究者・企業が関与しうる）
// このため職業名は「〜に関わる仕事」という仮置き表現にしている。
import type { ContentModule } from "../types";

const H = (name: string) => `${import.meta.env.BASE_URL}assets/heat/${name}.png`;

export const extremeHeat: ContentModule = {
  places: [
    {
      id: "town-heat",
      name: "街（猛暑）",
      eventId: "heat-wave",
      mapPos: { left: "20%", top: "67.5%" },
    },
  ],

  events: [
    {
      id: "heat-wave",
      placeId: "town-heat",
      title: "暑すぎる！\n街のあちこちで大変！",
      shortLabel: "街が暑すぎる！",
      areaName: "猛暑の街",
      areaLead: "きょうは39℃。街のあちこちで、ちがう「こまった」が起きてる。\n気になるところをのぞいてみよう。",
      sceneImage: H("place-city"),
      mood: "heat",
      lensSummary: {
        intro: "同じ「暑い！」を見ていたのに、みんな見ていたものが全然ちがった。",
        rows: [
          { icon: "🌳", label: "公園", view: "日陰・地面・風" },
          { icon: "⚡", label: "電気", view: "電力需要" },
          { icon: "🏗", label: "工事", view: "WBGT（暑さ指数）" },
          { icon: "💧", label: "水", view: "ダムの貯水率" },
          { icon: "🏙", label: "街", view: "日射・風・建物" },
        ],
      },
      incidents: [
        {
          id: "hot-park",
          image: H("place-park"),
          imageFit: "scene",
          title: "この公園、暑すぎる！",
          experienceId: "park-heat",
          scenePos: { left: "22%", top: "20%" },
        },
        {
          id: "power-peak",
          image: H("place-town"),
          imageFit: "scene",
          title: "電気を使う量が、どんどん増えてる！",
          experienceId: "power-heat",
          scenePos: { left: "74%", top: "24%" },
        },
        {
          id: "site-39",
          image: H("place-site"),
          imageFit: "scene",
          title: "今日は39℃。でも工事の予定がある",
          experienceId: "site-heat",
          scenePos: { left: "18%", top: "58%" },
        },
        {
          id: "dam-low",
          image: H("place-dam"),
          imageFit: "scene",
          title: "ダムの水が減っている…",
          experienceId: "water-heat",
          scenePos: { left: "78%", top: "60%" },
        },
        {
          id: "hot-street",
          image: H("place-city"),
          imageFit: "scene",
          title: "同じ街なのに、ここだけ暑い？",
          experienceId: "urban-heat",
          scenePos: { left: "48%", top: "82%" },
        },
      ],
    },
  ],

  professions: [
    {
      id: "park-design",
      name: "公園の暑さ対策を考える仕事",
      catch: "日陰・風・地面から、居られる場所をつくる",
      image: H("char-park"),
      discoveryLine: "日射や地面の温度を調べて、\n人がまた集まれる場所をつくる仕事！",
      q2: [
        {
          id: "what",
          title: "どんな仕事？",
          icon: "🌳",
          body: [
            "公園や広場を、暑い日でも使える場所にするための計画や設計を考えます。",
            "木を植える、日よけをつくる、地面の素材を変える、ミストを置く…場所に合わせて組み合わせます。",
          ],
        },
        {
          id: "kinds",
          title: "ひとつの仕事ではない",
          icon: "🧩",
          body: ["公園ひとつにも、いろんな立場の人が関わります。"],
          list: [
            "公園の計画を考える人（自治体など）",
            "設計する人（造園・ランドスケープ）",
            "木や植物を育て、植える人",
            "暑さを調べて評価する人",
            "…など",
          ],
        },
        {
          id: "himitsu",
          title: "実は！",
          icon: "💡",
          body: [
            "同じ「日陰」でも、木の陰と屋根の陰では涼しさがちがうことがあります。木は葉から水を出して、まわりの熱をやわらげるためです。",
          ],
        },
      ],
      related: ["造園", "ランドスケープデザイン", "建築", "都市計画", "緑化"],
    },
    {
      id: "power-ops",
      name: "電力の需給や系統運用に関わる仕事",
      catch: "街の電気を、途切れさせない",
      image: H("char-power"),
      discoveryLine: "先の需要を予測しながら、\n電気の量を合わせつづける仕事！",
      q2: [
        {
          id: "what",
          title: "どんな仕事？",
          icon: "⚡",
          body: [
            "電気は、たくさん貯めておくことがむずかしいので、使う量と作る量をいつも合わせ続ける必要があります。",
            "気温の予報から「このあとどれくらい使われそうか」を予測して、前もって備えます。",
          ],
        },
        {
          id: "kinds",
          title: "ひとつの仕事ではない",
          icon: "🧩",
          body: ["電気が届くまでには、たくさんの役割があります。"],
          list: [
            "需要を予測する人",
            "発電所を動かす人",
            "送電・配電の設備を守る人",
            "全体の需給を見て調整する人",
            "…など",
          ],
        },
        {
          id: "himitsu",
          title: "実は！",
          icon: "💡",
          body: [
            "電気が足りるかどうかは、気温の予報と強く関係しています。猛暑の日は冷房で需要がぐんと増えます。",
          ],
        },
      ],
      related: ["電気工事", "設備", "エネルギー研究", "気象データ", "情報システム"],
    },
    {
      id: "site-safety",
      name: "工事現場の安全と工程を守る仕事",
      catch: "働く人を守りながら、必要な工事を進める",
      image: H("char-site"),
      discoveryLine: "暑さ指数と作業の重さを見て、\n人を守りながら工事を進める仕事！",
      q2: [
        {
          id: "what",
          title: "どんな仕事？",
          icon: "🏗",
          body: [
            "工事現場で、作業の順番・人の配置・安全の管理などを考えます（施工管理・安全管理と呼ばれます）。",
            "暑い日はWBGT（暑さ指数）を見て、作業の内容や休憩の取り方を組み替えます。",
          ],
        },
        {
          id: "day",
          title: "1日の流れ",
          icon: "🕐",
          body: [],
          flow: [
            "朝｜朝礼・その日の作業と危険の確認",
            "午前｜作業の進み具合と安全を見る",
            "昼｜暑い時間帯の作業を調整",
            "夕｜片づけ・記録・翌日の段取り",
          ],
        },
        {
          id: "become",
          title: "どうやったらなれる？",
          icon: "🎓",
          body: [
            "工業高校や大学で建築・土木を学ぶ道があります。経験を積んで施工管理技士などの資格を取る人もいます。",
          ],
        },
        {
          id: "himitsu",
          title: "実は！",
          icon: "💡",
          body: [
            "WBGTは、気温だけでなく湿度や日射も合わせた「暑さ指数」。同じ気温でも、湿度が高いと危険度が上がります。",
          ],
        },
      ],
      related: ["建築", "土木", "安全衛生", "設備", "現場監督"],
    },
    {
      id: "water-ops",
      name: "水資源の管理・調整に関わる仕事",
      catch: "限られた水を、みんなが使えるように",
      image: H("char-water"),
      discoveryLine: "先の雨を予測しながら、\n限られた水の使い方を調整する仕事！",
      q2: [
        {
          id: "what",
          title: "どんな仕事？",
          icon: "💧",
          body: [
            "ダムや川の水の量を見て、水道・農業・工業などへの水の配分や取水の調整を考えます。",
            "雨が少ない年は、関係する人たちが集まって話し合いながら決めていきます。",
          ],
        },
        {
          id: "kinds",
          title: "ひとりでは決めない",
          icon: "🧩",
          body: ["水の使い方は、多くの立場の人の話し合いで決まります。"],
          list: [
            "ダムや川を管理する人",
            "水道をとどける人",
            "農業用水を扱う人（土地改良区など）",
            "工場で水を使う人",
            "自治体・国の担当",
            "…など",
          ],
        },
        {
          id: "himitsu",
          title: "実は！",
          icon: "💡",
          body: [
            "「水を止める」判断は、だれか一人が決めるものではありません。関係する人たちが集まって、影響を見ながら調整します。",
          ],
        },
      ],
      related: ["土木", "気象", "農業", "上下水道", "環境"],
    },
    {
      id: "urban-heat",
      name: "都市の暑さを分析し、街づくりを考える仕事",
      catch: "データを重ねて、暑さの理由を見つける",
      image: H("char-urban"),
      discoveryLine: "日射・風・建物のデータを重ねて、\n街の暑さの理由をさがす仕事！",
      q2: [
        {
          id: "what",
          title: "どんな仕事？",
          icon: "🏙",
          body: [
            "建物の形、日射、風の通り道、街路樹などのデータを重ねて、街のどこがなぜ暑いのかを調べます。",
            "その結果は、新しい街づくりや暑さ対策を考えるときに使われます。",
          ],
        },
        {
          id: "kinds",
          title: "いろんな立場の人がいる",
          icon: "🧩",
          body: ["ひとつの職業名ではなく、いろんな人が関わります。"],
          list: [
            "都市計画に関わる人",
            "気象・環境のデータを分析する人",
            "研究者",
            "建築・ランドスケープの設計者",
            "自治体の担当",
            "…など",
          ],
        },
        {
          id: "himitsu",
          title: "実は！",
          icon: "💡",
          body: [
            "同じ日の同じ街でも、場所によって体感の暑さは大きくちがいます。建物が風をさえぎると、熱がこもりやすくなります。",
          ],
        },
      ],
      related: ["都市計画", "気象データ分析", "建築", "環境", "GIS・地図データ"],
    },
  ],

  experiences: [
    // ============ ① 暑すぎる公園 ============
    {
      id: "park-heat",
      professionId: "park-design",
      eventId: "heat-wave",
      gameType: "place_and_test",
      place: { name: "猛暑の公園", image: H("place-park"), fit: "contain" },
      mission: {
        title: "この公園、暑すぎる！",
        lines: ["遊具もベンチも熱くて、だれも遊べない…。"],
      },
      tools: [],
      resolution: {
        title: "人が戻ってきた！",
        lines: ["暑くてだれもいなかった場所に、また子どもや家族が集まりはじめた。"],
      },
      discoveryEcho:
        "日差しや地面の温度、風を調べて、どこに木や日よけを置けば公園が過ごしやすくなるか考えたよね。こうやって、人が過ごす場所を考えて、まちや公園をつくる仕事があります。",
      seeds: [
        "地図を見る",
        "暑い場所を探す",
        "どこに置くか考える",
        "組み合わせを試す",
        "変化を見る",
        "特にない",
      ],
    },
    // ============ ② 電気が足りる？ ============
    {
      id: "power-heat",
      professionId: "power-ops",
      eventId: "heat-wave",
      gameType: "forecast_and_balance",
      place: { name: "街の電気", image: H("place-town"), fit: "contain" },
      mission: {
        title: "電気を使う量が、\nどんどん増えてる！",
        lines: ["みんなが一斉に冷房を使いはじめた。"],
      },
      tools: [],
      resolution: {
        title: "街の電気は、途切れなかった",
        lines: ["病院も、電車も、家も、お店も。いつもどおりの夕方がきた。"],
      },
      discoveryEcho:
        "さっき、気温の予報を見て「このあとどれくらい電気が使われるか」を予測して、前もって備えたよね。電気は貯めておくのがむずかしいので、こうして使う量と作る量を合わせ続ける人たちがいます。",
      seeds: ["グラフを見る", "先を予測する", "数字を合わせる", "全体のバランスを考える", "特にない"],
    },
    // ============ ③ 39℃の工事現場 ============
    {
      id: "site-heat",
      professionId: "site-safety",
      eventId: "heat-wave",
      gameType: "schedule_and_protect",
      place: { name: "工事現場", image: H("place-site"), fit: "contain" },
      mission: {
        title: "今日は39℃。\nでも今日やる予定の工事がある。",
        lines: ["働く人を守りながら、必要なところまで進めよう。"],
      },
      tools: [],
      resolution: {
        title: "工事も進んで、全員ぶじに帰れた",
        lines: ["働く人を守りながら、街に必要な工事を進めた。"],
      },
      discoveryEcho:
        "さっき、WBGT（暑さ指数）と作業の重さを見ながら、工事の順番を組み直したよね。実際の工事現場でも、暑さや作業内容を見ながら、働く人を守れるように工程を調整する人がいます。",
      seeds: ["予定を組む", "安全を守る", "数字を見る", "優先順位を考える", "予定を組み直す", "特にない"],
    },
    // ============ ④ ダムの水 ============
    {
      id: "water-heat",
      professionId: "water-ops",
      eventId: "heat-wave",
      gameType: "allocate_and_forecast",
      place: { name: "ダム・水の施設", image: H("place-dam"), fit: "contain" },
      mission: {
        title: "ダムの水が減っている…",
        lines: ["家庭にも、農業にも、工場にも水が必要。この先も雨は少ないかもしれない。"],
      },
      tools: [],
      resolution: {
        title: "大きな雨の日まで、水がもった！",
        lines: ["限られた水を、いろいろな人が使えるように分けあってつないだ。"],
      },
      discoveryEcho:
        "さっき、雨の予測を見ながら、限られた水をどう分けるか調整したよね。実際には、こうした調整をひとりで決めるのではなく、関係する人たちが集まって、影響を見ながら話し合って決めていきます。",
      seeds: ["先のことを予測する", "限られたものを分ける", "数字を調整する", "みんなへの影響を考える", "特にない"],
    },
    // ============ ⑤ 同じ街なのに、ここだけ暑い ============
    {
      id: "urban-heat",
      professionId: "urban-heat",
      eventId: "heat-wave",
      gameType: "layer_and_compare",
      place: { name: "暑い市街地", image: H("place-city"), fit: "contain" },
      mission: {
        title: "同じ街なのに、\nここだけ暑い？",
        lines: ["同じ39℃の日。でも、道によって暑さがちがう。なんで？"],
      },
      tools: [],
      resolution: {
        title: "暑さの理由が見えた！",
        lines: ["このデータは、新しい街づくりや暑さ対策を考えるときにも使われる。"],
      },
      discoveryEcho:
        "さっき、日射と風と建物のデータを重ねて、暑い理由を探したよね。実際にも、こうしたデータを使って街の暑さを分析し、暑さ対策や街づくりを考える仕事があります。",
      seeds: ["データを重ねる", "違いを見つける", "原因を探す", "街を変えて試す", "結果を比べる", "特にない"],
    },
  ],
};
