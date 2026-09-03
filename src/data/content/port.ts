// Theme module: 真夜中のみなと（factory/projects/night-port/design.md）
// A container ship berths at midnight; four jobs relay a box from the ship to
// a doorstep. Facts: factory/projects/night-port/research.result.json
// Safety rules: the terminal is lit/managed; unsafe acts are STOPPED by
// devices and the signal chief before harm; kids never wander a live yard.
import type { ContentModule } from "../types";

const P = (n: string) => `${import.meta.env.BASE_URL}assets/port/${n}.png`;

const hero = (emoji: string, bg: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'><circle cx='80' cy='80' r='74' fill='${bg}'/><text x='80' y='106' font-size='72' text-anchor='middle'>${emoji}</text></svg>`,
  );

export const port: ContentModule = {
  places: [
    {
      id: "port-wharf",
      name: "コンテナふ頭",
      eventId: "night-port",
    },
  ],

  events: [
    {
      id: "night-port",
      placeId: "port-wharf",
      title: "真夜中のみなとで、\nきみの荷物が動いている",
      shortLabel: "夜のみなと",
      areaName: "ふ頭のうらがわ",
      sceneMap: {
        image: P("scene-port"),
        opening: {
          image: P("ba-before"),
          lines: [
            "夜10時。大きな船が着いた。",
            "きみが注文した荷物も、この中のどれかに入っている。","朝までに、家の近くまで動き出す。",
          ],
          cta: "夜のふ頭を、のぞいてみる",
        },
      },
      areaLead: "船から玄関まで、荷物はバトンのように手渡される。\n夜の仕事を、順番にのぞいてみよう。",
      incidents: [
        {
          id: "ch1",
          scenePos: { left: "15%", top: "56%" },
          emoji: "🗺",
          title: "① この箱、どこに置く？",
          experienceId: "port-yard",
        },
        {
          id: "ch2",
          scenePos: { left: "37%", top: "20%" },
          emoji: "🏗",
          title: "② 巨大クレーン、動かすか止めるか",
          experienceId: "port-crane",
          requires: ["port-yard"],
          requiresHint: "まずは①で、置き場所の考え方を見よう。",
        },
        {
          id: "ch3",
          scenePos: { left: "62%", top: "66%" },
          emoji: "📋",
          title: "③ 書類と現物、合っている？",
          experienceId: "port-tally",
          requires: ["port-crane"],
          requiresHint: "下ろした箱は、照合してから預かる。",
        },
        {
          id: "ch4",
          scenePos: { left: "74%", top: "24%" },
          emoji: "🚛",
          title: "④ 朝いちの4本、どの車で？",
          experienceId: "port-dispatch",
          requires: ["port-tally"],
          requiresHint: "照合がすんだら、まちへ届ける番。",
        },
      ],
      lensSummary: {
        intro: "同じ夜の港を、4つの仕事はまったくちがう情報で見ていた。",
        rows: [
          { icon: "🗺", label: "計画", view: "あとで取り出す順。積み替えを減らす置き方" },
          { icon: "🏗", label: "クレーン", view: "風速・ロック・合図。止まれることが腕" },
          { icon: "📋", label: "検数", view: "書類と現物の一致。公正な記録" },
          { icon: "🚛", label: "配車", view: "車と道と時刻の条件。むだ走りの少ない組合せ" },
        ],
      },
      wrapUp: {
        beforeAfter: {
          before: P("ba-before"),
          after: P("ba-after"),
          beforeLabel: "夜10時：船が着いたばかりのふ頭",
          afterLabel: "朝8時：荷物はもう、まちの中",
        },
        title: "きみが眠っている間に、荷物は港を通りぬけた。",
        lines: [
          "置き場所の計画 → 安全な積みおろし → 受け渡しの証明 → 朝いちの配車。夜の4つの仕事がつないだ。",
          "だれも急がせない。「止まる」「確認する」を選べる人たちだから、朝の荷物が届く。",
          "こんど宅配の箱を受け取ったら、箱のすみの番号を見てみて。夜の港の跡かもしれない。",
        ],
      },
    },
  ],

  professions: [
    {
      id: "port-planner",
      name: "コンテナヤードプランナー",
      catch: "港の「置き場所」で朝の速さが決まる、港の頭脳",
      image: hero("🗺", "#dde9f5"),
      discoveryLine: "搬出予定を読んで、積み替えの少ない\n仮置きを設計する仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "🗺",
          body: [
            "船から下りた何百個ものコンテナを、ヤード（置き場）のどこに仮置きするか決めます。",
            "たよりはTOSという管理システム。引取の早い箱は上へ、冷凍の箱は電源のある列へ。置き方ひとつで、朝のトラックの待ち時間が変わります。",
          ],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "下の箱を先に出そうとすると、上の箱をぜんぶどかす「積み替え」が起きます。よいプランナーは、あしたの朝を先に頭の中で再生してから置き場所を決めるんです。",
          ],
        },
        {
          id: "who", title: "だれがやっている？", icon: "🧩", body: [],
          list: ["ターミナル運営会社の計画担当", "港湾運送会社のスタッフ", "夜勤・交代制で24時間動く港も多い"],
        },
      ],
      related: ["倉庫の管理の仕事", "鉄道の運行計画", "工場の生産計画"],
    },
    {
      id: "port-crane",
      name: "ガントリークレーン運転士",
      catch: "ビルの高さから、数センチをねらう職人",
      image: hero("🏗", "#f5e6d0"),
      discoveryLine: "風速・ロック・合図を読んで、\n巨大クレーンを安全に動かす仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "🏗",
          body: [
            "岸壁の大きなクレーンで、船からコンテナをつり上げて下ろします。地上の合図員と無線でつながり、風速計とロック表示をたしかめてから動かします。",
            "風が強い日は速度を落とし、規程をこえたら見合わせる。「速さより、止まれること」が信頼になります。",
          ],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "大きなコンテナ船には、船にクレーンがついていないことが多いんです。港のガントリークレーンがいなければ、荷物は一つも下りられません。",
          ],
        },
        {
          id: "how", title: "何を見ている？", icon: "🧩", body: [],
          list: ["風速計と港の運用規程", "ツイストロック（4点の固定）の表示", "地上合図と作業指示の一致", "コンテナの振れと、着地点の人・車"],
        },
      ],
      related: ["建設現場のクレーン運転", "フォークリフトの仕事", "航空機の誘導の仕事"],
    },
    {
      id: "port-tally",
      name: "港の検数員",
      catch: "受け渡しを「証明」する、公正な立会人",
      image: hero("📋", "#dcebd9"),
      discoveryLine: "書類と現物を3点照合して、\n受け渡しの証拠を作る仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "📋",
          body: [
            "船積み・船卸しに立ち会い、コンテナの番号・｜封印《ふういん》・外観を書類と照合します。","数えるだけではなく、「たしかに受け渡した」という証明を作る仕事です。",
            "船側にも荷主側にも味方しない中立の立場。だから記録は「見たまま」を書きます。",
          ],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "コンテナ番号の最後の1桁は「検算のための数字」。番号がどこか1文字ちがうと計算が合わなくなる、まちがい発見のしかけです。",
          ],
        },
        {
          id: "who", title: "だれがやっている？", icon: "🧩", body: [],
          list: ["国の許可を受けた検数事業者", "港湾運送の専門会社", "検数は法律で決められた港の仕事のひとつ"],
        },
      ],
      related: ["品質検査の仕事", "税関の仕事", "銀行の照合の仕事"],
    },
    {
      id: "port-dispatch",
      name: "コンテナ輸送の配車担当",
      catch: "車と道と時刻のパズルを毎朝解く、陸の司令塔",
      image: hero("🚛", "#f5e3e0"),
      discoveryLine: "車両条件×道路条件×予約時刻で、\n朝いちの配送を組む仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "🚛",
          body: [
            "港を出たコンテナを、どの車・どの運転手・どの道で届けるか決めます。","｜背高《せだか》コンテナを積むと、車の高さは約4.1m。通れない道があるんです。",
            "納入予約の時刻、車台の種類、重さの制限。ぜんぶ合う組合せを、毎朝組み立てます。",
          ],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "配車のうまい人は「帰り道」まで考えます。届けたトラックが空のまま走らないよう、次の集荷や空箱の返却をつないで、むだ走りを減らすんです。",
          ],
        },
        {
          id: "who", title: "だれがやっている？", icon: "🧩", body: [],
          list: ["海上コンテナ輸送会社の配車係", "運行管理の資格を持つ人も多い", "港のゲートの予約枠とにらめっこの毎日"],
        },
      ],
      related: ["バスの運行管理", "宅配の配達計画", "タクシーの配車の仕事"],
    },
  ],

  experiences: [
    {
      id: "port-yard",
      professionId: "port-planner",
      eventId: "night-port",
      gameType: "yard_plan",
      place: { name: "管理棟のプランニング室", image: P("scene-port"), fit: "cover", focus: "15% 45%" },
      mission: {
        title: "今夜の仮置き当番は、きみだ",
        lines: [
          "船から8個の箱が下りてくる。",
          "TOSの搬出予定を読んで、朝に積み替えが起きない置き方を考えよう。",
        ],
        deadline: "船が着いてから朝まで",
      },
      tools: [
        { id: "tos", name: "TOS", emoji: "🖥", desc: "搬出予定と箱の属性の一覧" },
        { id: "map", name: "ヤードマップ", emoji: "🗺", desc: "列と段の見取り図" },
        { id: "power", name: "電源列の表", emoji: "🔌", desc: "冷凍コンテナ用のさし込み口" },
      ],
      resolution: {
        clock: "夜明け前",
        title: "仮置き完了。あとは朝を待つだけ",
        lines: ["きみのヤードマップは、朝のクレーン班へ引き継がれた。"],
      },
      discoveryEcho: "きみがさっき「あとで取り出す順」を先に読んだよね。あの先読みを毎晩やる仕事があるんだ。",
      seeds: ["先の順番を読んで組み立てるところ", "地図やマスに置いていくところ", "朝スムーズに流れる瞬間"],
    },
    {
      id: "port-crane",
      professionId: "port-crane",
      eventId: "night-port",
      gameType: "crane_lift",
      place: { name: "ガントリークレーンの運転席", image: P("scene-port"), fit: "cover", focus: "40% 25%" },
      mission: {
        title: "今夜の6本、まかせた",
        lines: [
          "風速計・ロック表示・地上合図。3つを見てから動かす。",
          "止まるべき時に止まれるのが、いちばんの腕前。",
        ],
        deadline: "夜のうちに6本",
      },
      tools: [
        { id: "wind", name: "風速計", emoji: "💨", desc: "規程の速度・中止ラインと見比べる" },
        { id: "lock", name: "ロック表示", emoji: "🔒", desc: "4点そろって、はじめて吊れる" },
        { id: "radio", name: "地上合図の無線", emoji: "📣", desc: "指示と合図が合っているか" },
      ],
      resolution: {
        clock: "夜中2時",
        title: "今夜のぶんを、下ろしきった",
        lines: ["運転日誌に風速と判断を残す。次の運転士への申し送りだ。"],
      },
      discoveryEcho: "きみがさっき「動かすか、止めるか」を計器で決めたよね。あの判断を40mの高さでやる仕事があるんだ。",
      seeds: ["大きな機械を動かすところ", "「止める」判断ができるところ", "計器を読んで決めるところ"],
    },
    {
      id: "port-tally",
      professionId: "port-tally",
      eventId: "night-port",
      gameType: "tally_check",
      place: { name: "ゲート前の検数ブース", image: P("scene-port"), fit: "cover", focus: "65% 55%" },
      mission: {
        title: "受け渡しの証明は、きみの目で",
        lines: [
          "書類と現物、番号・封印・外観の3点をひと組で照合。",
          "ちがいを見つけたら照会。損傷は「見たまま」を記録する。",
        ],
        deadline: "5箱ぶん",
      },
      tools: [
        { id: "tally", name: "タリーシート", emoji: "📄", desc: "書類側の番号・封印・数" },
        { id: "light", name: "ライト", emoji: "🔦", desc: "夜でも番号と外観を見るため" },
        { id: "camera", name: "記録用カメラ", emoji: "📷", desc: "見たままを残す" },
      ],
      resolution: {
        clock: "夜中3時",
        title: "照合ずみ。受け渡し成立",
        lines: ["きみのタリーシートが、船とまちの「受け渡した証拠」になった。"],
      },
      discoveryEcho: "きみがさっき「1文字のちがい」を見逃さなかったよね。あの照合が受け渡しの証拠になる仕事があるんだ。",
      seeds: ["ちがいを見つける瞬間", "どちらの味方もしない公正さ", "きちんと記録を残すところ"],
    },
    {
      id: "port-dispatch",
      professionId: "port-dispatch",
      eventId: "night-port",
      gameType: "truck_dispatch",
      place: { name: "配車室", image: P("scene-port"), fit: "cover", focus: "85% 40%" },
      mission: {
        title: "朝いちの4本、組んでみよう",
        lines: [
          "背高は低床車だけ。重い箱は小型車に積めない。",
          "予約の時刻に合わせて、近い行き先をつなごう。",
        ],
        deadline: "朝の点呼まで",
      },
      tools: [
        { id: "board", name: "配車表", emoji: "📋", desc: "車・運転手・便の割当て" },
        { id: "roadmap", name: "道路の制限マップ", emoji: "🗺", desc: "高さ・重さで通れない道" },
        { id: "booking", name: "納入予約の一覧", emoji: "⏰", desc: "届け先が待っている時刻" },
      ],
      resolution: {
        clock: "朝6時",
        title: "朝いちの便、ぜんぶ出発",
        lines: ["ゲートを出たトラックが、まちへ散っていく。きみの組んだ順番で。"],
      },
      discoveryEcho: "きみがさっき「通れる道か」まで確かめて車を選んだよね。あのパズルを毎朝解く仕事があるんだ。",
      seeds: ["条件のパズルがはまる瞬間", "道や車のちがいに気づくところ", "荷物が届く朝を想像するところ"],
    },
  ],
};
