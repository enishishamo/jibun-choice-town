// Theme module: 川に魚がもどった！（factory/projects/river-health/design.md）
// A good change happened — whodunit in reverse. Facts:
// factory/projects/river-health/research.result.json
// Fairness rules: never pin the cause on one facility from one number; one
// sighting is not recovery; kids never enter the river alone.
import type { ContentModule } from "../types";

const R = (n: string) => `${import.meta.env.BASE_URL}assets/river/${n}.png`;

const hero = (emoji: string, bg: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'><circle cx='80' cy='80' r='74' fill='${bg}'/><text x='80' y='106' font-size='72' text-anchor='middle'>${emoji}</text></svg>`,
  );

export const river: ContentModule = {
  places: [
    {
      id: "town-river",
      name: "まちの川",
      eventId: "river-health",
    },
  ],

  events: [
    {
      id: "river-health",
      placeId: "town-river",
      title: "川に魚がもどってきた！\nだれかが、何かをしたらしい",
      shortLabel: "川に魚が！",
      areaName: "川ぞいのしごと場",
      sceneMap: {
        image: R("scene-river"),
        opening: {
          image: R("ba-before"),
          lines: [
            "「川で魚を見た！」——うわさが、まちをかけめぐった。",
            "数年前まで、この川はにごっていたのに。いったい、だれが何をした？",
          ],
          cta: "川ぞいへ",
        },
      },
      areaLead: "良い変化にも、理由がある。\n調べる→動かす→つくる。3つの仕事をのぞいてみよう。",
      incidents: [
        {
          id: "ch1",
          scenePos: { left: "18%", top: "34%" },
          emoji: "🧪",
          title: "① 魚がもどった理由、つきとめろ",
          experienceId: "river-trace",
        },
        {
          id: "ch2",
          scenePos: { left: "52%", top: "58%" },
          emoji: "🫧",
          title: "② 見えない生きものを、飼いならせ",
          experienceId: "river-ops",
          requires: ["river-trace"],
          requiresHint: "まず①で、川の数字の読み方を見よう。",
        },
        {
          id: "ch3",
          scenePos: { left: "80%", top: "32%" },
          emoji: "📐",
          title: "③ 魚がすめる川岸を、設計せよ",
          experienceId: "river-bank",
          requires: ["river-ops"],
          requiresHint: "水がきれいになったら、すみかの番。",
        },
      ],
      lensSummary: {
        intro: "同じ川を、3つの仕事はまったくちがう目で見ていた。",
        rows: [
          { icon: "🧪", label: "調査", view: "上下流の比較。1匹の目撃では断定しない" },
          { icon: "🫧", label: "処理場", view: "｜微生物《びせいぶつ》のきげんと電力。多すぎもだめ" },
          { icon: "📐", label: "川づくり", view: "守る区間は最小限。あとは川にまかせる" },
        ],
      },
      wrapUp: {
        beforeAfter: {
          before: R("ba-before"),
          after: R("ba-after"),
          beforeLabel: "数年前：にごって、生きものの気配がない川",
          afterLabel: "いま：再調査で確かめられた、魚のかげ",
        },
        title: "「魚がもどった」を、たしかめられる人がいる。",
        lines: [
          "うわさをうのみにせず、数字でたしかめる。それが今日の3つの仕事だった。",
          "回復は一日では起きない。「まだ」の月をこえた積み重ねが、この「いま」だ。",
          "こんど川をのぞくとき、にごりのない水は「だれかの仕事」だと思い出してほしい。",
        ],
      },
    },
  ],

  professions: [
    {
      id: "river-surveyor",
      name: "河川の水質・生きもの調査員",
      catch: "川の体温計を読む、フィールドの科学者",
      image: hero("🧪", "#dde9f5"),
      discoveryLine: "上下流を比べて、\n川の変化の理由をつきとめる仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "🧪",
          body: [
            "川のあちこちで水をくみ、｜溶存酸素《ようぞんさんそ》やよごれの数値をはかります。",
            "コツは「比べる」こと。上流と下流、支流の前と後。数字の変わり目に、理由がかくれています。",
          ],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "魚を1回見ただけでは「川が回復した」と言いません。放流された魚かもしれないから。同じ場所・同じ季節で、何度も確かめるんです。",
          ],
        },
        {
          id: "who", title: "だれがやっている？", icon: "🧩", body: [],
          list: ["自治体の環境調査の担当", "調査会社の技術者", "市民の調査隊と協力することも"],
        },
      ],
      related: ["環境計測の仕事", "気象観測の仕事", "水族館の飼育スタッフ"],
    },
    {
      id: "river-operator",
      name: "下水処理場の運転管理員",
      catch: "見えない微生物を飼いならす、水の料理長",
      image: hero("🫧", "#dcebd9"),
      discoveryLine: "微生物のきげんを読んで、\nまちの水をきれいにして返す仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "🫧",
          body: [
            "まちで使われた水は、下水処理場できれいにしてから川へ返します。",
            "よごれを食べるのは｜活性汚泥《かっせいおでい》という微生物のかたまり。送る空気の量で、そのきげんを整えます。",
          ],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "「酸素は多いほど良い」はまちがい。送りすぎると電気のむだになり、微生物のかたまりがくずれて沈まなくなることもあるんです。",
          ],
        },
        {
          id: "how", title: "何を見ている？", icon: "🧩", body: [],
          list: ["タンクのDO（とけた酸素）", "微生物の沈みぐあい", "流れこむ水の量（雨で急に増える）", "放流する水の検査値"],
        },
      ],
      related: ["浄水場の仕事", "清掃工場の運転員", "発酵食品をつくる仕事"],
    },
    {
      id: "river-designer",
      name: "多自然川づくりの設計者",
      catch: "「固めない勇気」を図面にする土木設計者",
      image: hero("📐", "#f5e3e0"),
      discoveryLine: "守る区間をしぼって、\n魚のすめる川岸を設計する仕事！",
      q2: [
        {
          id: "what", title: "どんな仕事？", icon: "📐",
          body: [
            "こう水からまちを守りながら、魚や虫のすみかも残す——その両立を図面にします。",
            "家のうしろや、けずられた場所は、しっかり守ります。それ以外は、川の自然な流れにまかせる。それがいまの考え方です。",
          ],
        },
        {
          id: "himitsu", title: "実は！", icon: "💡",
          body: [
            "魚道は「つければ通れる」ではありません。魚の大きさや泳ぐ力に合っていないと、入り口さえ見つけてもらえないんです。",
          ],
        },
        {
          id: "who", title: "だれがやっている？", icon: "🧩", body: [],
          list: ["建設コンサルタントの土木設計者", "国や県の河川事務所", "生きもの調査の専門家とチームで"],
        },
      ],
      related: ["土木の仕事", "造園・ランドスケープ", "防災の仕事"],
    },
  ],

  experiences: [
    {
      id: "river-trace",
      professionId: "river-surveyor",
      eventId: "river-health",
      gameType: "water_trace",
      place: { name: "川ぞいの調査ポイント", image: R("scene-river"), fit: "cover", focus: "18% 35%" },
      mission: {
        title: "うわさの真相を、数字で確かめる",
        lines: [
          "採水びんは4本。どの地点を調べるかが腕の見せどころ。",
          "数字の「変わり目」を読んで、理由を結論づけよう。",
        ],
        deadline: "夕方の報告会まで",
      },
      tools: [
        { id: "bottle", name: "採水びん", emoji: "🧪", desc: "1地点1本。むだづかい禁物" },
        { id: "meter", name: "DO計", emoji: "📟", desc: "水にとけた酸素をはかる" },
        { id: "sheet", name: "基準カード", emoji: "📋", desc: "この川の健康のめやす" },
      ],
      resolution: {
        clock: "夕方",
        title: "結論は、記録として残った",
        lines: ["きみの報告が、次の川づくりの根拠になる。"],
      },
      discoveryEcho: "きみがさっき「比べて」理由を見つけたよね。あの比べ方が科学の基本になる仕事があるんだ。",
      seeds: ["数字から理由を推理するところ", "現場を歩いて確かめるところ", "断定しない慎重さ"],
    },
    {
      id: "river-ops",
      professionId: "river-operator",
      eventId: "river-health",
      gameType: "plant_ops",
      place: { name: "下水処理場の中央監視室", image: R("scene-river"), fit: "cover", focus: "52% 55%" },
      mission: {
        title: "今日の運転、まかせた",
        lines: [
          "DOをみどりの帯に保つ。送風は流れこむ量に合わせる。",
          "夜は雨の予報。先を読んで。",
        ],
        deadline: "朝から夜まで4コマ",
      },
      tools: [
        { id: "monitor", name: "中央監視のモニター", emoji: "🖥", desc: "DO・送風・流入量" },
        { id: "blower", name: "送風機", emoji: "💨", desc: "微生物への空気" },
        { id: "scope", name: "顕微鏡", emoji: "🔬", desc: "微生物のようすを見る" },
      ],
      resolution: {
        clock: "夜",
        title: "今日も、きれいな水を川へ返せた",
        lines: ["処理場の水は、あの魚たちの上流になる。"],
      },
      discoveryEcho: "きみがさっき「多すぎてもだめ」を体で覚えたよね。あのさじ加減を毎日やる仕事があるんだ。",
      seeds: ["見えない生きものの世話", "ちょうどいい、を探す調整", "まちの水を預かる責任"],
    },
    {
      id: "river-bank",
      professionId: "river-designer",
      eventId: "river-health",
      gameType: "bank_design",
      place: { name: "川ぞいの設計事務所", image: R("scene-river"), fit: "cover", focus: "80% 35%" },
      mission: {
        title: "魚がすめる川岸を、設計する",
        lines: [
          "守る区間は、しっかり守る。それ以外は川にまかせる。",
          "｜堰《せき》（水の段差）には魚道を。予算には限りがある。",
        ],
        deadline: "設計会議まで",
      },
      tools: [
        { id: "map", name: "川の図面", emoji: "🗺", desc: "けずれたあとと土地利用" },
        { id: "works", name: "工法カタログ", emoji: "📐", desc: "｜護岸《ごがん》・石積み・魚道" },
        { id: "budget", name: "予算表", emoji: "💰", desc: "ぜんぶは固められない" },
      ],
      resolution: {
        clock: "会議のあと",
        title: "図面が、川の未来になる",
        lines: ["工事のあとも調査は続く。もどってくるかは、川と数字が教えてくれる。"],
      },
      discoveryEcho: "きみがさっき「固めない場所」を選んだよね。あの引き算の設計が、いまの川づくりなんだ。",
      seeds: ["安全と自然の両立を考えるところ", "しぼる・まかせるの判断", "何年も先の川を想像するところ"],
    },
  ],
};
