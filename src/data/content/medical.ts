// Theme module: 医療編（救急外来から、その人の生活へ）
// Unlike the other themes, this one follows ONE patient through nine
// chapters. Each chapter is a Q1 for a different profession, and the
// patient's state carries over between them.
//
// TODO: 要ファクトチェック — 病院・地域によって役割分担や制度は異なる。
//  ここでは学習用に簡略化している。特に:
//   - 検査値・画像・薬の設定は、子どもが「情報を集めて考える」体験を
//     するための簡略モデル。実際の診断・処方の判断はこれより複雑。
//   - 薬の相互作用は具体的な薬剤名で断定せず、「腎機能に合わせて量を
//     見直す」という一般的な考え方にとどめている。
//   - 退院支援で使える制度・サービスは自治体により大きく異なる。
import type { ContentModule } from "../types";

const M = (name: string) => `${import.meta.env.BASE_URL}assets/medical/${name}.jpg`;

// 患者ストーリー（今後 pneumonia02, child01 … と増やせる）
export const PATIENT = {
  id: "pneumonia01",
  name: "70代前半の男性",
  living: "ひとり暮らし",
  story: "数日前から咳と熱。今日になって息苦しさが強くなり、救急外来へ。",
};

export const medical: ContentModule = {
  places: [
    {
      id: "hospital",
      name: "病院",
      eventId: "er-patient",
      mapPos: { left: "80.5%", top: "31%" },
    },
  ],

  events: [
    {
      id: "er-patient",
      placeId: "hospital",
      title: "｜救急外来《きゅうきゅうがいらい》に、\n息苦しそうな人が来た",
      shortLabel: "病院に人が来た",
      areaName: "病院",
      areaLead: "この人に、何が起きているんだろう？\n上から順番に追いかけてみよう。",
      mood: "medical",
      sceneMap: {
        image: M("er_bed"),
        opening: {
          image: M("er_arrival"),
          lines: [
            "「熱もあるし、咳も出る。なんだか｜息苦《いきぐる》しくて……」",
            "70代・ひとり暮らし。数日前から具合が悪いという。",
          ],
          cta: "この人を、追いかけてみる",
        },
      },
      wrapUp: {
        // 1枚のまとめ画像は文字が小さくて読めないので、
        // 「救急外来に来たとき → 自分の家で過ごしている」の2枚だけを使う。
        beforeAfter: {
          before: M("home_before"),
          after: M("home_after"),
          beforeLabel: "はじまり：救急外来",
          afterLabel: "いま：自分の家",
        },
        title: "その人の生活へ、戻りました。",
        lines: [
          "病気を治すだけじゃなく、また自分らしく暮らせるところまで。",
          "ぜんぜんちがう見方をする人たちが、同じ一人を支えていた。",
        ],
      },
      lensSummary: {
        intro: "同じ一人の人を、みんなちがうところから見ていた。",
        rows: [
          { icon: "🩺", label: "医師", view: "手がかりを集めて考える" },
          { icon: "🔬", label: "検査", view: "からだの中を数字にする" },
          { icon: "🩻", label: "画像", view: "見えないところを写す" },
          { icon: "💊", label: "薬", view: "この人に安全か" },
          { icon: "👩‍⚕️", label: "看護", view: "いつもとの違い" },
          { icon: "🍚", label: "食事", view: "食べられる方法" },
          { icon: "🚶", label: "動作", view: "生活の中でできること" },
          { icon: "🏠", label: "退院", view: "どう暮らしたいか" },
        ],
      },
      incidents: [
        { id: "ch1", emoji: "🩺", title: "① 何が起きているんだろう？", experienceId: "med-doctor", scenePos: { left: "12%", top: "26%" } },
        { id: "ch2", emoji: "🔬", title: "② この血液から何が分かる？", experienceId: "med-lab", scenePos: { left: "34%", top: "18%" },
          requires: ["med-doctor"], requiresHint: "まずは①で、どんな手がかりがあるか聞いてみよう。" },
        { id: "ch3", emoji: "🩻", title: "③ 肺の中を見たい", experienceId: "med-radio", scenePos: { left: "56%", top: "24%" },
          requires: ["med-doctor"], requiresHint: "まずは①で、どんな手がかりがあるか聞いてみよう。" },
        { id: "ch4", emoji: "🧩", title: "④ 集まった手がかりを、まとめる", experienceId: "med-diagnose", scenePos: { left: "78%", top: "18%" },
          requires: ["med-lab", "med-radio"], requiresHint: "検査と画像の両方がそろってから、まとめよう。" },
        { id: "ch5", emoji: "💊", title: "⑤ この薬、この人に使って大丈夫？", experienceId: "med-pharm", scenePos: { left: "14%", top: "62%" },
          requires: ["med-diagnose"], requiresHint: "まずは④で、何が起きているかまとめてから。" },
        { id: "ch6", emoji: "👩‍⚕️", title: "⑥ なんか、いつもとちがう？", experienceId: "med-nurse", scenePos: { left: "36%", top: "70%" } },
        { id: "ch7", emoji: "🍚", title: "⑦ ごはんが進まない", experienceId: "med-diet", scenePos: { left: "58%", top: "64%" },
          requires: ["med-nurse"], requiresHint: "まずは⑥で、いつもとの違いに気づいてから。" },
        { id: "ch8", emoji: "🚶", title: "⑧ 家で生活できる？", experienceId: "med-pt", scenePos: { left: "80%", top: "70%" },
          requires: ["med-diet"], requiresHint: "まずは⑦で、ごはんのことを整えてから。" },
        { id: "ch9", emoji: "🏠", title: "⑨ 家に帰りたい", experienceId: "med-msw", scenePos: { left: "48%", top: "90%" },
          requires: ["med-pt"], requiresHint: "まずは、家で生活できそうか見てからにしよう。" },
      ],
      chapters: [
        {
          id: "front",
          tab: "前半：｜診断《しんだん》まで",
          title: "病気の正体をつきとめて、｜治療《ちりょう》を始めよう",
          lead: "何が起きているんだろう？\n身体の中を、どうやって調べる？",
          image: M("er_bed"),
          incidentIds: ["ch1", "ch2", "ch3", "ch4", "ch5"],
          clear: {
            title: "病気の正体が分かって、治療が始まりました",
            lines: [
              "医師・検査技師・放射線技師・薬剤師。ちがう見方をする人たちが、1つの答えに近づいた。",
            ],
            cta: "後半へ進む",
          },
        },
        {
          id: "back",
          tab: "後半：生活へ戻る",
          title: "元気になって、いつもの生活に戻ろう",
          lead: "病気は良くなってきた。\nでも、どうしたらまたいつもの生活に戻れる？",
          image: M("rehab"),
          incidentIds: ["ch6", "ch7", "ch8", "ch9"],
          lockedHint: "まずは前半を、さいごまで進めてみよう。",
        },
      ],
    },
  ],

  professions: [
    {
      id: "doctor",
      name: "医師",
      catch: "手がかりを集めて、何が起きているか考える",
      image: M("who_doctor"),
      discoveryLine: "話・からだ・数字・検査・画像を集めて、\n何が起きているかを考える仕事！",
      q2: [
        { id: "what", title: "どんな仕事？", icon: "🩺",
          body: ["患者さんの話を聞き、からだを診て、必要な検査を考えて、何が起きているかを見きわめます（｜診断《しんだん》）。",
                 "そのうえで、治療の方針を決めたり、ほかの専門職と一緒に進めたりします。"] },
        { id: "kinds", title: "いろんな医師がいる", icon: "🧩", body: [],
          list: ["救急の医師", "内科・外科などの専門", "地域のかかりつけ医", "研究をする医師", "…など"] },
        { id: "become", title: "どうやったらなれる？", icon: "🎓",
          body: ["大学の医学部で6年学び、国家試験に合格したあと、研修を受けながら経験を積みます。"] },
        { id: "himitsu", title: "実は！", icon: "💡",
          body: ["いきなり答えが分かるわけではありません。「たぶんこれかも」をいくつも考えて、検査で確かめながら、少しずつしぼっていきます。"] },
      ],
      related: ["看護師", "薬剤師", "｜臨床検査技師《りんしょうけんさぎし》", "研究", "公衆衛生"],
    },
    {
      id: "labtech",
      name: "臨床検査技師",
      catch: "見えないからだの中を、数字や情報にする",
      image: M("who_labtech"),
      discoveryLine: "血液や尿などを調べて、見えないからだの中を\n数字や情報にする仕事！",
      q2: [
        { id: "what", title: "どんな仕事？", icon: "🔬",
          body: ["血液や尿などを調べて、からだの中で何が起きているかを数字や情報にします。",
                 "作った情報は医師にわたし、どこが悪いかを決めるのは医師の仕事です。"] },
        { id: "kinds", title: "検査もいろいろ", icon: "🧩", body: [],
          list: ["血液や尿の検査", "細菌の検査", "心電図・超音波などの生理検査", "検査機器の管理", "…など"] },
        { id: "become", title: "どうやったらなれる？", icon: "🎓",
          body: ["大学や専門学校で学び、国家試験に合格します。"] },
        { id: "himitsu", title: "実は！", icon: "💡",
          body: ["同じ数字でも、検体の運び方しだいで実際とちがう値になることがあります。だから結果を出す前に、その数字が信じられるかも確かめています。"] },
      ],
      related: ["医師", "看護師", "研究", "食品衛生", "製薬"],
    },
    {
      id: "radtech",
      name: "診療放射線技師",
      catch: "外から見えないからだの中を、画像にする",
      image: M("who_radtech"),
      discoveryLine: "X線などの装置を使って、\n見えないからだの中を画像にする仕事！",
      q2: [
        { id: "what", title: "どんな仕事？", icon: "🩻",
          body: ["X線やCT、MRIなどの装置を使って、からだの中を画像にします。",
                 "その画像は、医師が何が起きているかを考えるための大事な手がかりになります。"] },
        { id: "kinds", title: "いろんな装置", icon: "🧩", body: [],
          list: ["X線撮影", "CT", "MRI", "超音波", "放射線を使う治療の担当", "…など"] },
        { id: "become", title: "どうやったらなれる？", icon: "🎓",
          body: ["大学や専門学校で学び、国家試験に合格します。"] },
        { id: "himitsu", title: "実は！", icon: "💡",
          body: ["同じ人を撮っても、からだの向きや息のタイミングで写り方が変わります。放射線の量をできるだけ少なくすることも大切にしています。"] },
      ],
      related: ["医師", "臨床工学技士", "医療機器メーカー", "研究"],
    },
    {
      id: "pharmacist",
      name: "薬剤師",
      catch: "その薬が、この人に安全かを確かめる",
      image: M("who_pharmacist"),
      discoveryLine: "薬だけでなく、検査値や今までの薬まで見て、\n安全に使えるかを確かめる仕事！",
      q2: [
        { id: "what", title: "どんな仕事？", icon: "💊",
          body: ["｜処方《しょほう》（医師が出す薬の指示）された薬が、その人にとって安全で効くように確かめます。",
                 "気になることがあれば医師に問い合わせて、量や薬を一緒に見直します。"] },
        { id: "kinds", title: "はたらく場所", icon: "🧩", body: [],
          list: ["病院", "薬局", "製薬会社", "行政", "…など"] },
        { id: "become", title: "どうやったらなれる？", icon: "🎓",
          body: ["大学の薬学部で6年学び、国家試験に合格します。"] },
        { id: "himitsu", title: "実は！", icon: "💡",
          body: ["同じ薬でも、その人の体重・年齢・｜腎臓《じんぞう》や｜肝臓《かんぞう》のはたらきによって、ちょうどよい量がちがうことがあります。"] },
      ],
      related: ["医師", "看護師", "研究", "製薬", "医薬品情報"],
    },
    {
      id: "nurse",
      name: "看護師",
      catch: "「いつもとちがう」に気づく",
      image: M("who_nurse"),
      discoveryLine: "そばで見ているからこそ気づいて、\n今必要なケアを考える仕事！",
      q2: [
        { id: "what", title: "どんな仕事？", icon: "👩‍⚕️",
          body: ["患者さんのいちばん近くで様子を見て、変化に気づき、必要なケアをします。",
                 "気づいたことを医師やほかの職種に伝えて、チームをつなぐ役目もあります。"] },
        { id: "kinds", title: "はたらく場所", icon: "🧩", body: [],
          list: ["病棟", "外来", "手術室", "訪問看護", "学校・企業", "…など"] },
        { id: "become", title: "どうやったらなれる？", icon: "🎓",
          body: ["看護系の大学・短大・専門学校で学び、国家試験に合格します。"] },
        { id: "himitsu", title: "実は！", icon: "💡",
          body: ["「なんとなくいつもとちがう」という感覚は、毎日見ているから分かるもの。その気づきが、早い対応につながります。"] },
      ],
      related: ["医師", "保健師", "助産師", "介護", "リハビリ"],
    },
    {
      id: "dietitian",
      name: "管理栄養士",
      catch: "必要な栄養と、食べられる方法をつなぐ",
      image: M("who_dietitian"),
      discoveryLine: "からだに必要な栄養と、\nこの人が実際に食べられる形を近づける仕事！",
      q2: [
        { id: "what", title: "どんな仕事？", icon: "🍚",
          body: ["その人のからだに必要な栄養を考え、実際に食べられる形にしていきます。",
                 "病院では、病気や治療に合わせて食事を調整します。"] },
        { id: "kinds", title: "はたらく場所", icon: "🧩", body: [],
          list: ["病院", "学校（栄養教諭など）", "福祉施設", "食品会社", "スポーツ", "…など"] },
        { id: "become", title: "どうやったらなれる？", icon: "🎓",
          body: ["管理栄養士の養成課程で学び、国家試験に合格します。"] },
        { id: "himitsu", title: "実は！", icon: "💡",
          body: ["どんなに栄養バランスがよくても、食べられなければ届きません。「食べられる量・回数・形」まで考えるのが専門性です。"] },
      ],
      related: ["栄養教諭", "調理", "食品開発", "看護", "リハビリ"],
    },
    {
      id: "pt",
      name: "理学療法士",
      catch: "「できる」を、生活の中に取り戻す",
      image: M("who_pt"),
      discoveryLine: "動きを見て、道具や方法を変えながら、\n生活でできることを増やす仕事！",
      q2: [
        { id: "what", title: "どんな仕事？", icon: "🚶",
          body: ["起き上がる・立つ・歩くといった動作を見て、練習や工夫で「できる」を増やします。",
                 "からだを鍛えるだけでなく、道具や環境を変えて、できる方法をつくることもあります。"] },
        { id: "kinds", title: "リハビリの仲間", icon: "🧩", body: [],
          list: ["理学療法士（動作）", "｜作業療法士《さぎょうりょうほうし》（生活の動作・手仕事）", "｜言語聴覚士《げんごちょうかくし》（話す・食べる）", "…など"] },
        { id: "become", title: "どうやったらなれる？", icon: "🎓",
          body: ["大学や専門学校で学び、国家試験に合格します。"] },
        { id: "himitsu", title: "実は！", icon: "💡",
          body: ["ゴールは「歩けること」ではなく、「その人がしたい生活ができること」。だから家の様子や普段の一日も聞きます。"] },
      ],
      related: ["｜作業療法士《さぎょうりょうほうし》", "｜言語聴覚士《げんごちょうかくし》", "看護", "スポーツ", "福祉用具"],
    },
    {
      id: "msw",
      name: "MSW（医療ソーシャルワーカー）",
      catch: "その人が望む暮らしへ、つなぐ",
      image: M("who_msw"),
      discoveryLine: "どんなふうに暮らしたいかを聞いて、\n生活の困りごとと助けをつなぐ仕事！",
      q2: [
        { id: "what", title: "どんな仕事？", icon: "🏠",
          body: ["退院したあとの暮らしを、本人や家族と一緒に考えます。",
                 "使える制度やサービス、地域の人や機関をつないで、生活が続けられるようにします。"] },
        { id: "kinds", title: "さっきの「助け」には、こんな名前があるよ", icon: "🧩", body: [],
          list: [
            "ごはんを届けてくれる人 → ｜配食《はいしょく》サービス",
            "家に来て生活を手伝ってくれる人 → ｜訪問介護《ほうもんかいご》（ヘルパー）",
            "家で体調を見てくれる人 → ｜訪問看護《ほうもんかんご》",
            "家でも歩く練習を手伝ってくれる人 → ｜訪問《ほうもん》リハビリ",
            "困ったとき相談できる人 → 見守りサービス",
          ] },
        { id: "become", title: "どうやったらなれる？", icon: "🎓",
          body: ["｜社会福祉士《しゃかいふくしし》などの資格をとって働く人が多い仕事です（職場によって条件はちがいます）。"] },
        { id: "himitsu", title: "実は！", icon: "💡",
          body: ["「安心だから」と助けを増やせばいいわけではありません。その人がどう暮らしたいかを、いちばん大事にします。"] },
      ],
      related: ["｜社会福祉士《しゃかいふくしし》", "ケアマネジャー", "行政", "｜地域包括支援《ちいきほうかつしえん》センター", "介護"],
    },
  ],

  experiences: [
    {
      id: "med-doctor", professionId: "doctor", eventId: "er-patient", gameType: "clue_board",
      place: { name: "救急外来", image: M("er_exam"), fit: "cover", focus: "center 40%" },
      mission: { title: "「熱もあるし、咳も出る。\nなんだか息苦しくて……」", lines: ["この人に、何が起きているんだろう？"] },
      tools: [], resolution: { title: "からだの中を、もっと調べたい", lines: [] },
      discoveryEcho: "さっき、患者さんの話や身体の様子、数字を集めて、何が起きているのか考えたよね。手がかりを集めて考えるのが、この仕事の中心です。",
      seeds: ["話を聞く", "手がかりを集める", "原因を考える", "情報を組み合わせる", "特にない"],
    },
    {
      id: "med-lab", professionId: "labtech", eventId: "er-patient", gameType: "lab_check",
      place: { name: "検査室", image: M("lab"), fit: "cover", focus: "center 30%" },
      mission: { title: "この血液から、\n何が分かるだろう？", lines: ["見えないからだの中を、情報にしよう。"] },
      tools: [], resolution: { title: "結果を、医師へ報告した", lines: [] },
      discoveryEcho: "さっき、血液を調べて、見えなかったからだの中を数字や情報にしたよね。それが、この仕事の中心です。",
      seeds: ["何を調べるか選ぶ", "数字を見る", "見えないものを調べる", "情報を届ける", "特にない"],
    },
    {
      id: "med-radio", professionId: "radtech", eventId: "er-patient", gameType: "xray_shoot",
      place: { name: "X線撮影室", image: M("xray_room"), fit: "cover", focus: "center 35%" },
      mission: { title: "外からは見えない\n肺の中を見たい", lines: ["からだの中を、画像にしよう。"] },
      tools: [], resolution: { title: "見えなかった肺の中が、画像になった", lines: [] },
      discoveryEcho: "さっき、外からは見えなかった肺の中を、画像にして見えるようにしたよね。それが、この仕事の中心です。",
      seeds: ["どこを見るか選ぶ", "装置を使う", "画像を見くらべる", "変化におどろく", "特にない"],
    },
    {
      id: "med-diagnose", professionId: "doctor", eventId: "er-patient", gameType: "clue_join",
      place: { name: "救急外来（もどってきた）", image: M("er_exam"), fit: "cover", focus: "center 40%" },
      mission: { title: "手がかりが、そろった", lines: ["集まった情報を見比べて、まとめてみよう。"] },
      tools: [], resolution: { title: "肺で炎症が起きている可能性が高い", lines: [] },
      discoveryEcho: "さっき、話・からだ・検査・画像をつなげて、ばらばらの手がかりを1つの見立てにまとめたよね。これが｜診断《しんだん》につながる考え方です。",
      seeds: ["情報を組み合わせる", "原因を考える", "つながりを見つける", "手がかりを集める", "特にない"],
    },
    {
      id: "med-pharm", professionId: "pharmacist", eventId: "er-patient", gameType: "rx_check",
      place: { name: "薬剤部", image: M("pharmacy"), fit: "cover", focus: "center 40%" },
      mission: { title: "この薬、この人に\nこのまま使って大丈夫？", lines: [] },
      tools: [], resolution: { title: "安全に治療をはじめられる", lines: [] },
      discoveryEcho: "さっき、薬だけじゃなく患者さんの検査や今までの薬も見て、この人に安全に使えるか考えたよね。それがこの仕事の中心です。",
      seeds: ["情報を探す", "薬を調べる", "組み合わせを見る", "安全か考える", "特にない"],
    },
    {
      id: "med-nurse", professionId: "nurse", eventId: "er-patient", gameType: "observe_care",
      place: { name: "病室（治療4日目）", image: M("ward"), fit: "cover", focus: "center 42%" },
      mission: { title: "「なんか、だるくて……」", lines: ["熱も呼吸も良くなってきたはずなのに…？"] },
      tools: [], resolution: { title: "少し楽になった。でも…", lines: [] },
      discoveryEcho: "さっき、“なんか違う”に気づいて、患者さんをよく見て、今必要なケアを考えたよね。それが看護の大事な仕事です。",
      seeds: ["変化に気づく", "よく観察する", "原因を考える", "ケアする", "特にない"],
    },
    {
      id: "med-diet", professionId: "dietitian", eventId: "er-patient", gameType: "meal_fit",
      place: { name: "病室（食事の相談）", image: M("ward"), fit: "cover", focus: "center 55%" },
      mission: { title: "病気は良くなってきた。\nでも、ごはんが進まない。", lines: [] },
      tools: [], resolution: { title: "無理なく食べられるようになった", lines: [] },
      discoveryEcho: "さっき、栄養だけでなく、この人が実際に食べられる方法まで考えたよね。その2つを近づけるのが、この仕事です。",
      seeds: ["食べられない理由を探す", "食事を工夫する", "数字を見る", "相手に合わせて考える", "特にない"],
    },
    {
      id: "med-pt", professionId: "pt", eventId: "er-patient", gameType: "move_try",
      place: { name: "リハビリ室・病棟", image: M("rehab"), fit: "cover", focus: "center 42%" },
      mission: { title: "「そろそろ家に帰りたいな」\n…あれ、ちょっとふらつく", lines: ["家で生活できるかな？"] },
      tools: [], resolution: { title: "自分でトイレまで行けた", lines: [] },
      discoveryEcho: "さっき、できない動きを見て、道具や方法を変えながら、生活の中でできることを増やしたよね。それがこの仕事です。",
      seeds: ["動きを観察する", "できない理由を探す", "道具を試す", "方法を変えて試す", "特にない"],
    },
    {
      id: "med-msw", professionId: "msw", eventId: "er-patient", gameType: "life_plan",
      place: { name: "退院前の面談", image: M("msw_room"), fit: "cover", focus: "center 30%" },
      mission: { title: "「家に帰りたい。」", lines: ["でも、ひとり暮らし。まず何から聞こう？"] },
      tools: [], resolution: { title: "家に帰ってからの毎日が、つながった", lines: [] },
      discoveryEcho: "さっき、この人がどんな暮らしをしたいか聞いて、家で困りそうなところに助けをつないだよね。それがMSWの仕事です。",
      seeds: ["人の話を聞く", "生活を想像する", "困りごとを整理する", "人や助けをつなぐ", "特にない"],
    },
  ],
};
