// Theme module: 修学旅行編（修学旅行、どうやって100人を運ぶ？）
// 5つの役割を自由な順番で選べる構成（給食編と同じ形。医療編のような
// 強制順の章立てにはしていない）。
//
// TODO: 要ファクトチェック — 会社・学校・宿によって分担や手続きは
//  異なる。ここでは学習用に簡略化している。時間・費用・定員などの
//  数値はすべてプロトタイプ用の値。
import type { ContentModule } from "../types";

const T = (name: string) => `${import.meta.env.BASE_URL}assets/schooltrip/${name}.jpg`;

export const schoolTrip: ContentModule = {
  places: [
    {
      id: "school-trip",
      name: "修学旅行",
      eventId: "school-trip",
      mapPos: { left: "40%", top: "90%" },
    },
  ],

  events: [
    {
      id: "school-trip",
      placeId: "school-trip",
      title: "修学旅行、\nどうやって100人を運ぶ？",
      shortLabel: "修学旅行、どう運ぶ？",
      areaName: "修学旅行のうらがわ",
      areaLead: "6年生100人の修学旅行！\nみんなを安全に、時間どおり、楽しく連れていける？",
      mood: "trip",
      sceneMap: {
        image: T("school-trip-opening"),
        opening: {
          image: T("school-trip-opening"),
          lines: [
            "東京の小学校から、京都・奈良へ2泊3日。",
            "100人の児童と、それを支える大人たち。",
          ],
          cta: "うら側をのぞいてみる",
        },
      },
      wrapUp: {
        image: T("school-trip-success"),
        title: "100人が、無事に旅行から帰ってきた。",
        lines: [
          "1つの旅行の中に、学び・安全・時間・予算をそれぞれ守る仕事があった。",
          "だれか1人ではなく、いろんな仕事がつながって、100人の3日間を支えていた。",
        ],
      },
      lensSummary: {
        intro: "同じ「修学旅行」を、みんなちがう役割で見ていた。",
        rows: [
          { icon: "🗓️", label: "旅程", view: "学び・時間・予算のバランス" },
          { icon: "🧑‍🏫", label: "引率", view: "100人の安全体制" },
          { icon: "🚌", label: "バス運行", view: "定員・運転士・経路" },
          { icon: "📱", label: "添乗", view: "遅れをつなぎ直す" },
          { icon: "🏮", label: "宿", view: "部屋・食事・入浴の受け入れ" },
        ],
      },
      incidents: [
        { id: "trip-plan-inc", emoji: "🗓️", title: "旅の組み立てを考える", experienceId: "plan-trip", scenePos: { left: "14%", top: "24%" } },
        { id: "trip-safety-inc", emoji: "🧑‍🏫", title: "100人の安全を守る", experienceId: "safety-trip", scenePos: { left: "40%", top: "58%" } },
        { id: "trip-bus-inc", emoji: "🚌", title: "バスを安全に走らせる", experienceId: "bus-trip", scenePos: { left: "80%", top: "30%" } },
        { id: "trip-delay-inc", emoji: "📱", title: "遅れた予定をつなぎ直す", experienceId: "delay-trip", scenePos: { left: "66%", top: "68%" } },
        { id: "trip-hotel-inc", emoji: "🏮", title: "宿で100人を受け入れる", experienceId: "hotel-trip", scenePos: { left: "24%", top: "88%" } },
      ],
    },
  ],

  professions: [
    {
      id: "trip-planner",
      name: "旅行会社の教育旅行担当",
      catch: "学び・時間・予算がそろう旅程をつくる",
      image: T("school-trip-planner"),
      discoveryLine: "学校の希望を聞いて、交通・宿泊・見学先を\n組み合わせる仕事！",
      q2: [
        { id: "what", title: "どんな仕事？", icon: "🗓️",
          body: ["学校の学習目的や希望を聞いて、実現できる旅程を提案します。",
                 "交通、宿泊、見学先の組み合わせを考え、最終決定は学校と相談して行います。"] },
        { id: "kinds", title: "旅行会社の中の役割", icon: "🧩", body: [],
          list: ["学校向けの企画を作る人（教育旅行担当）", "宿や交通の手配をする人", "現地の案内を作る人", "…など"] },
        { id: "become", title: "どうやったらなれる？", icon: "🎓",
          body: ["旅行会社に就職し、学校向けの企画（教育旅行）を担当する部署に配属されることが多い仕事です。"] },
        { id: "himitsu", title: "実は！", icon: "💡",
          body: ["いちばん安い旅程が、いちばん良い旅程とは限りません。学びの多さ・ゆとり・費用、どこを大事にするかは学校ごとにちがいます。"] },
      ],
      related: ["旅行会社", "企画", "観光", "学校事務", "地域観光"],
    },
    {
      id: "trip-teacher",
      name: "学校の引率責任者・教員",
      catch: "100人の安全体制を組む",
      image: T("school-trip-teacher"),
      discoveryLine: "班と引率の体制を整えて、\n100人の安全を守る仕事！",
      q2: [
        { id: "what", title: "どんな仕事？", icon: "🧑‍🏫",
          body: ["児童の情報を把握し、班と引率体制を整えます。",
                 "点呼の場所や、体調・アレルギーなどへの対応を準備し、行程変更や安全面の最終判断を行います。"] },
        { id: "kinds", title: "引率にかかわる人", icon: "🧩", body: [],
          list: ["担任・副担任の先生", "学年主任の先生", "養護の先生", "保護者代表", "…など"] },
        { id: "become", title: "どうやったらなれる？", icon: "🎓",
          body: ["教員免許をとって学校の先生になり、学年や校務の中で修学旅行の引率・計画にかかわります。"] },
        { id: "himitsu", title: "実は！", icon: "💡",
          body: ["旅行会社や添乗員がいても、児童の安全についての最終判断は学校が行います。頼りきりにはしません。"] },
      ],
      related: ["教員", "養護教諭", "学年主任", "生徒指導", "学校事務"],
    },
    {
      id: "trip-busmanager",
      name: "貸切バスの運行管理者",
      catch: "定員・運転士・経路をそろえて、安全に走らせる",
      image: T("school-trip-bus-manager"),
      discoveryLine: "車両・運転士・経路・休憩を組んで、\nバスを安全に走らせる仕事！",
      q2: [
        { id: "what", title: "どんな仕事？", icon: "🚌",
          body: ["必要な車両と運転者を手配し、乗車人数や経路を確認します。",
                 "運転者の休憩を含む運行計画を作り、渋滞や通行止めに備えて代わりの経路も準備します。"] },
        { id: "kinds", title: "バス会社の中の役割", icon: "🧩", body: [],
          list: ["運行計画を作る人（運行管理者）", "実際に運転する人（運転士）", "車両を整備する人", "…など"] },
        { id: "become", title: "どうやったらなれる？", icon: "🎓",
          body: ["バス会社に就職し、運行管理者になるための資格（国家資格）をとって担当します。"] },
        { id: "himitsu", title: "実は！", icon: "💡",
          body: ["運転士と運行管理者はちがう仕事です。運行管理者は、運転はせず、計画と安全の管理を専門にします。"] },
      ],
      related: ["運行管理者", "運転士", "整備士", "物流", "交通計画"],
    },
    {
      id: "trip-conductor",
      name: "添乗員・旅程管理担当",
      catch: "崩れた予定を、関係先へつなぎ直す",
      image: T("school-trip-tour-conductor"),
      discoveryLine: "遅れの影響を整理して、学校・見学先・バス・宿へ\nつなぎ直す仕事！",
      q2: [
        { id: "what", title: "どんな仕事？", icon: "📱",
          body: ["当日の運行状況を確認し、学校・交通機関・見学先・宿泊施設へ連絡します。",
                 "変更案を作って学校の確認を得たうえで、関係先へ変更内容を共有します。"] },
        { id: "kinds", title: "旅のあいだの役割", icon: "🧩", body: [],
          list: ["現地で案内・調整をする人（添乗員）", "旅程を管理する人", "学校側の引率者", "…など"] },
        { id: "become", title: "どうやったらなれる？", icon: "🎓",
          body: ["旅行会社などに就職し、添乗の実務経験を積んで、旅程管理主任者などの資格をとることが多い仕事です。"] },
        { id: "himitsu", title: "実は！", icon: "💡",
          body: ["添乗員が現場で決めたように見える変更も、多くは学校の承認を得たうえで進めています。ひとりで決めきることはありません。"] },
      ],
      related: ["旅行会社", "ツアーコンダクター", "イベント運営", "危機管理", "接客"],
    },
    {
      id: "trip-hotel",
      name: "ホテル・旅館の団体受入担当",
      catch: "届いた班情報を、部屋・食事・入浴で受け止める",
      image: T("school-trip-hotel"),
      discoveryLine: "学校から届いた班の情報をもとに、部屋・食事・入浴を\n組み立てる仕事！",
      q2: [
        { id: "what", title: "どんな仕事？", icon: "🏮",
          body: ["学校や旅行会社から届いた班・部屋割りの情報を確認し、利用できる客室へ割りあてます。",
                 "食事とアレルギー対応を準備し、入浴時間を分けて混雑を防ぎます。"] },
        { id: "kinds", title: "宿の中の役割", icon: "🧩", body: [],
          list: ["団体の受け入れを担当する人（フロント・宴会担当）", "食事を用意する人（調理場）", "館内を案内する人", "…など"] },
        { id: "become", title: "どうやったらなれる？", icon: "🎓",
          body: ["ホテルや旅館に就職し、フロントや団体・宴会を担当する部署で経験を積みます。"] },
        { id: "himitsu", title: "実は！", icon: "💡",
          body: ["班そのものは学校が作ったもの。宿の仕事は、その班を部屋・食事・入浴という「宿の設備」へ、うまく組み合わせることです。"] },
      ],
      related: ["ホテル", "旅館", "接客", "調理", "施設管理"],
    },
  ],

  experiences: [
    {
      id: "plan-trip", professionId: "trip-planner", eventId: "school-trip", gameType: "trip_plan",
      place: { name: "旅行会社", image: T("school-trip-planner"), fit: "contain" },
      mission: { title: "2泊3日の旅程を、\n組み立てよう", lines: ["学び・時間・予算、ぜんぶ守れる形にしよう。"] },
      tools: [], resolution: { title: "2泊3日の旅程が組めた", lines: [] },
      discoveryEcho: "さっき、学び・時間・予算を見ながら旅程を組み立てたよね。それが、この仕事の中心です。",
      seeds: ["組み合わせを考える", "条件を確かめる", "何度も試す", "バランスを考える", "特にない"],
    },
    {
      id: "safety-trip", professionId: "trip-teacher", eventId: "school-trip", gameType: "safety_plan",
      place: { name: "学校・職員室", image: T("school-trip-teacher"), fit: "contain" },
      mission: { title: "100人が、安全に\n旅行へ行ける体制を組もう", lines: ["班・引率・役割・配慮、ぜんぶ整えよう。"] },
      tools: [], resolution: { title: "100人の安全体制ができた", lines: [] },
      discoveryEcho: "さっき、班に引率をつけて、役割と配慮の情報をつなげたよね。それが、この仕事の中心です。",
      seeds: ["情報を確認する", "役割を決める", "配慮を考える", "みんなで整える", "特にない"],
    },
    {
      id: "bus-trip", professionId: "trip-busmanager", eventId: "school-trip", gameType: "bus_ops",
      place: { name: "バス会社", image: T("school-trip-bus-manager"), fit: "contain" },
      mission: { title: "3台のバスを、\n安全に走らせよう", lines: ["定員・運転士・経路・休憩をそろえよう。"] },
      tools: [], resolution: { title: "3台とも、無事に走らせられた", lines: [] },
      discoveryEcho: "さっき、定員・運転士・経路・休憩をそろえて、バスを安全に走らせたよね。それが、この仕事の中心です。",
      seeds: ["条件をそろえる", "計画を立てる", "うまくいかず直す", "安全を確かめる", "特にない"],
    },
    {
      id: "delay-trip", professionId: "trip-conductor", eventId: "school-trip", gameType: "delay_recover",
      place: { name: "新幹線の駅", image: T("school-trip-tour-conductor"), fit: "contain" },
      mission: { title: "新幹線が遅れた。\n予定をつなぎ直そう", lines: ["見学先・バス・宿へ、順番に連絡していこう。"] },
      tools: [], resolution: { title: "予定を、つなぎ直せた", lines: [] },
      discoveryEcho: "さっき、状況を確認して、関係先へ連絡し、学校の承認を得てから変更を伝えたよね。それが、この仕事の中心です。",
      seeds: ["状況を確認する", "関係先へ連絡する", "変更案を考える", "みんなに知らせる", "特にない"],
    },
    {
      id: "hotel-trip", professionId: "trip-hotel", eventId: "school-trip", gameType: "hotel_receive",
      place: { name: "旅館のフロント", image: T("school-trip-hotel"), fit: "contain" },
      mission: { title: "100人を、\n宿で受け入れよう", lines: ["部屋・食事・入浴、3つを組み立てよう。"] },
      tools: [], resolution: { title: "100人を、受け入れる準備ができた", lines: [] },
      discoveryEcho: "さっき、届いた班の情報をもとに、部屋・食事・入浴を組み立てたよね。それが、この仕事の中心です。",
      seeds: ["情報を確認する", "配置を考える", "配慮を反映する", "混雑を防ぐ", "特にない"],
    },
  ],
};
