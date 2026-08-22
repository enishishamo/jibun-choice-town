// Theme module: イベント編（なんかイベントをやることになった！）
// One event seen from six very different jobs. Screens are shared with the
// other themes — only this data + the six game components are new.
//
// TODO: 要ファクトチェック — 会社・現場によって役割分担と呼び方は異なる。
//  ここでは「イベントを企画する仕事」「広報・PR の仕事」のように
//  仕事の領域として書き、特定の職名に断定していない。数値（分数・
//  想定来場・音量など）は子どもが操作の違いを感じるための仮の値。
import type { ContentModule } from "../types";

const E = (name: string) => `${import.meta.env.BASE_URL}assets/event/${name}.jpg`;
const P = (name: string) => `${import.meta.env.BASE_URL}assets/event/${name}.png`;

export const townEvent: ContentModule = {
  places: [
    {
      id: "plaza",
      name: "広場",
      eventId: "town-festival",
      mapPos: { left: "30%", top: "112%" },
    },
  ],

  events: [
    {
      id: "town-festival",
      placeId: "plaza",
      title: "なんかイベントを\nやることになった！",
      shortLabel: "イベントやるって！",
      areaName: "イベントのうら側",
      areaLead: "会場はまだ、からっぽ。\n気になっているところから、のぞいてみよう。",
      mood: "event",
      sceneMap: {
        image: E("venue_empty"),
        opening: {
          image: E("venue_empty"),
          lines: ["会場はおさえた。日にちも決まった。", "…でも、ここから何をすればいいんだろう？"],
        },
      },
      wrapUp: {
        image: E("venue_success"),
        title: "イベントが無事に開催された！",
        lines: [
          "ステージの上に立つ人だけで、イベントはできていなかった。",
          "同じ1日を、みんなちがうところを見ながら支えていた。",
        ],
      },
      lensSummary: {
        intro: "同じイベントなのに、みんな見ていたものが全然ちがった。",
        rows: [
          { icon: "💡", label: "企画", view: "来る人・会場・時間" },
          { icon: "📣", label: "広報", view: "だれに、どう届くか" },
          { icon: "⏱", label: "進行", view: "分単位のタイムテーブル" },
          { icon: "🗺", label: "設営", view: "会場の配置と通路" },
          { icon: "🔊", label: "音響", view: "席ごとの聞こえ方" },
          { icon: "🚧", label: "警備", view: "人の流れと混雑" },
        ],
      },
      incidents: [
        {
          id: "what-to-do",
          emoji: "💡",
          title: "何をやったら、みんな楽しめる？",
          experienceId: "plan-event",
          scenePos: { left: "12%", top: "30%" },
        },
        {
          id: "nobody-knows",
          emoji: "📣",
          title: "まだ、だれも知らない！",
          experienceId: "promo-event",
          scenePos: { left: "34%", top: "22%" },
        },
        {
          id: "too-many-acts",
          emoji: "⏱",
          title: "このままだと時間どおり終わらない！",
          experienceId: "run-event",
          scenePos: { left: "56%", top: "26%" },
        },
        {
          id: "where-to-put",
          emoji: "🗺",
          title: "どこに何を置けばいい？",
          experienceId: "venue-event",
          scenePos: { left: "78%", top: "34%" },
        },
        {
          id: "cant-hear",
          emoji: "🔊",
          title: "うしろの席まで声がとどかない！",
          experienceId: "sound-event",
          scenePos: { left: "30%", top: "66%" },
        },
        {
          id: "crowded",
          emoji: "🚧",
          title: "入口の近くが混んできた！",
          experienceId: "crowd-event",
          scenePos: { left: "62%", top: "70%" },
        },
      ],
    },
  ],

  professions: [
    {
      id: "planner",
      name: "イベントを企画する仕事",
      catch: "だれのための、どんな1日にするかを決める",
      image: P("m_poster"),
      discoveryLine: "来る人・会場・時間をにらみながら、\nイベントの中身を組み立てる仕事！",
      q2: [
        {
          id: "what",
          title: "どんな仕事？",
          icon: "💡",
          body: [
            "「だれに来てほしいか」「何をすると楽しいか」を考えて、イベントの中身を組み立てます。",
            "使える会場・時間・お金の中で成り立つように、やりたいことを選んでいきます。",
          ],
        },
        {
          id: "kinds",
          title: "ひとつの仕事ではない",
          icon: "🧩",
          body: ["イベントが生まれるまでにも、いろんな立場の人がいます。"],
          list: [
            "企画を考える人",
            "お金の計画を立てる人",
            "出演者や出店者に声をかける人",
            "会場や役所とやりとりする人",
            "…など",
          ],
        },
        {
          id: "himitsu",
          title: "実は！",
          icon: "💡",
          body: [
            "「全部のせ」がいちばん楽しいとはかぎりません。来る人と時間に合わないと、どれも中途半端になってしまうことがあります。",
          ],
        },
      ],
      related: ["イベント会社", "広告", "観光", "まちづくり", "学校行事の運営"],
    },
    {
      id: "promoter",
      name: "広報・PRの仕事",
      catch: "必要な人に、ちゃんと届ける",
      image: P("m_sns"),
      discoveryLine: "だれに届けたいかを決めて、\n伝える方法を組み合わせる仕事！",
      q2: [
        {
          id: "what",
          title: "どんな仕事？",
          icon: "📣",
          body: [
            "イベントや商品のことを、必要な人に知ってもらうために伝え方を考えます。",
            "ポスター、SNS、地域のお知らせなど、届けたい相手によって使う方法を変えます。",
          ],
        },
        {
          id: "kinds",
          title: "ひとつの仕事ではない",
          icon: "🧩",
          body: [],
          list: [
            "何を伝えるか考える人（広報・PR）",
            "デザインする人",
            "SNSを運用する人",
            "取材に対応する人",
            "…など",
          ],
        },
        {
          id: "himitsu",
          title: "実は！",
          icon: "💡",
          body: [
            "たくさんの人に届くほどいい、とはかぎりません。近所の人に来てほしいのに遠くの人にだけ届いても、その日に来てもらえません。",
          ],
        },
      ],
      related: ["広告", "デザイン", "マーケティング", "報道", "SNS運用"],
    },
    {
      id: "stage-manager",
      name: "イベントの進行をつくる仕事",
      catch: "分単位で、当日を成り立たせる",
      image: P("a_mc"),
      discoveryLine: "演目と転換の時間を積み上げて、\n終わる時間に間に合わせる仕事！",
      q2: [
        {
          id: "what",
          title: "どんな仕事？",
          icon: "⏱",
          body: [
            "だれが・何時から・何分やるかを組み立て、当日その通りに進むように動きます。",
            "演目と演目の間には、機材を入れかえる「転換」の時間も必要です。",
          ],
        },
        {
          id: "kinds",
          title: "ひとつの仕事ではない",
          icon: "🧩",
          body: [],
          list: [
            "進行を組む人（制作・ステージマネージャーなど）",
            "出演者と連絡を取る人",
            "舞台の転換をする人",
            "MC・司会",
            "…など",
          ],
        },
        {
          id: "himitsu",
          title: "実は！",
          icon: "💡",
          body: [
            "本番中は、予定より早く終わったり長引いたりします。その場でどこを削るか決めるのも大事な仕事です。",
          ],
        },
      ],
      related: ["舞台制作", "テレビ・配信", "音響・照明", "会場運営"],
    },
    {
      id: "venue-designer",
      name: "会場をつくる仕事",
      catch: "同じ広場を、過ごせる場所に変える",
      image: P("p_stage"),
      discoveryLine: "ステージやお店の位置を決めて、\n人が動ける会場をつくる仕事！",
      q2: [
        {
          id: "what",
          title: "どんな仕事？",
          icon: "🗺",
          body: [
            "からっぽの広場に、ステージ・ブース・休憩スペースなどをどう置くかを考えて、設営します。",
            "見やすさや歩きやすさ、安全のことも合わせて決めていきます。",
          ],
        },
        {
          id: "kinds",
          title: "ひとつの仕事ではない",
          icon: "🧩",
          body: [],
          list: [
            "会場のレイアウトを考える人",
            "ステージや看板をつくる人（施工）",
            "電気や機材を運び込む人",
            "撤収する人",
            "…など",
          ],
        },
        {
          id: "himitsu",
          title: "実は！",
          icon: "💡",
          body: [
            "会場づくりは「置く場所」だけでなく「置かない場所」も大事です。人が通る道や、非常時に逃げる道を残しておく必要があります。",
          ],
        },
      ],
      related: ["舞台美術", "施工", "建築", "空間デザイン", "レンタル機材"],
    },
    {
      id: "sound-tech",
      name: "音響の仕事",
      catch: "会場のどこにいても、聞こえるように",
      image: P("s_mixer"),
      discoveryLine: "スピーカーと音量を調整して、\n席ごとの聞こえ方をそろえる仕事！",
      q2: [
        {
          id: "what",
          title: "どんな仕事？",
          icon: "🔊",
          body: [
            "マイクやスピーカーを使って、ステージの音を会場の人に届けます。",
            "本番前にリハーサルをして、場所ごとの聞こえ方を確かめて調整します。",
          ],
        },
        {
          id: "kinds",
          title: "ひとつの仕事ではない",
          icon: "🧩",
          body: [],
          list: [
            "客席に届く音をつくる人",
            "出演者に返す音（モニター）をつくる人",
            "機材を組んで配線する人",
            "照明の担当",
            "…など",
          ],
        },
        {
          id: "himitsu",
          title: "実は！",
          icon: "💡",
          body: [
            "音は大きくすればいいわけではありません。大きすぎると割れて聞き取りにくくなり、近所への音もれも問題になります。",
          ],
        },
      ],
      related: ["ライブハウス", "放送", "レコーディング", "照明", "映像"],
    },
    {
      id: "crowd-safety",
      name: "雑踏警備の仕事",
      catch: "人の流れを見て、安全にする",
      image: P("p_fence"),
      discoveryLine: "どこが詰まるかを読んで、\n人の流れをつくる仕事！",
      q2: [
        {
          id: "what",
          title: "どんな仕事？",
          icon: "🚧",
          body: [
            "たくさんの人が集まる場所で、混雑や事故が起きないように人の流れをつくります（雑踏警備）。",
            "柵や案内で通り道をつくり、混みそうな場所を先に見つけて手を打ちます。",
          ],
        },
        {
          id: "kinds",
          title: "ひとつの仕事ではない",
          icon: "🧩",
          body: [],
          list: [
            "現場で案内・誘導する人",
            "全体を見て指示を出す人",
            "計画を立てる人（警備計画）",
            "会場スタッフ・運営",
            "…など",
          ],
        },
        {
          id: "himitsu",
          title: "実は！",
          icon: "💡",
          body: [
            "混雑は起きてから止めるのが難しいので、混む前に流れを分けておくことが大事だとされています。",
          ],
        },
      ],
      related: ["警備", "施設管理", "防災", "交通誘導", "イベント運営"],
    },
  ],

  experiences: [
    {
      id: "plan-event",
      professionId: "planner",
      eventId: "town-festival",
      gameType: "plan_mix",
      place: { name: "打ち合わせ（からっぽの広場）", image: E("venue_empty"), fit: "cover", focus: "center 50%" },
      mission: {
        title: "何をやったら、\nみんな楽しめる？",
        lines: ["来る人と会場を見ながら、イベントの中身を決めよう。"],
      },
      tools: [],
      resolution: { title: "イベントの中身が決まった！", lines: [] },
      discoveryEcho:
        "さっき、来る人や会場や時間を見ながら、やることを組み合わせたよね。こうやってイベントの中身を決めるのが、企画の大事な仕事のひとつです。",
      seeds: ["アイデアを組み合わせる", "だれのためか考える", "条件を見て決める", "結果を見てやり直す", "特にない"],
    },
    {
      id: "promo-event",
      professionId: "promoter",
      eventId: "town-festival",
      gameType: "reach_mix",
      place: { name: "広報の作業テーブル", image: E("venue_map"), fit: "cover", focus: "center 30%" },
      mission: {
        title: "まだ、だれも知らない！",
        lines: ["届けたい人に届く方法を、組み合わせよう。"],
      },
      tools: [],
      resolution: { title: "イベントのことが、届きはじめた！", lines: [] },
      discoveryEcho:
        "さっき、だれに届けたいかを決めて、伝える方法を選んだよね。こうやって必要な人に届けるのが、広報・PRの大事な仕事のひとつです。",
      seeds: ["人にどう届くか考える", "組み合わせを考える", "結果を見てやり直す", "だれのためか考える", "特にない"],
    },
    {
      id: "run-event",
      professionId: "stage-manager",
      eventId: "town-festival",
      gameType: "timetable",
      place: { name: "進行の打ち合わせ", image: E("venue_map"), fit: "cover", focus: "center 22%" },
      mission: {
        title: "このままだと\n時間どおり終わらない！",
        lines: ["演目と転換をならべて、終わりの時間に間に合わせよう。"],
      },
      tools: [],
      resolution: { title: "当日の進行、組めた！", lines: [] },
      discoveryEcho:
        "さっき、演目の長さと転換の時間を足しながら、終わる時間に間に合うように順番を組んだよね。これがイベントの進行をつくる仕事の中心です。",
      seeds: ["順番を組む", "時間を計算する", "入れかえて試す", "結果を見てやり直す", "特にない"],
    },
    {
      id: "venue-event",
      professionId: "venue-designer",
      eventId: "town-festival",
      gameType: "venue_layout",
      place: { name: "からっぽの広場", image: E("venue_empty"), fit: "cover", focus: "center 55%" },
      mission: {
        title: "どこに何を置けばいい？",
        lines: ["会場に置いてみて、見やすさと通りやすさをたしかめよう。"],
      },
      tools: [],
      resolution: { title: "会場ができあがった！", lines: [] },
      discoveryEcho:
        "さっき、ステージやお店を置いて、見やすさや通り道がどう変わるかを試したよね。こうやって会場をつくるのが、設営の大事な仕事のひとつです。",
      seeds: ["空間を配置する", "置き直して試す", "人の動きを考える", "全体を見る", "特にない"],
    },
    {
      id: "sound-event",
      professionId: "sound-tech",
      eventId: "town-festival",
      gameType: "sound_check",
      place: { name: "リハーサル中のステージ", image: E("venue_busy"), fit: "cover", focus: "center 32%" },
      mission: {
        title: "うしろの席まで\n声がとどかない！",
        lines: ["スピーカーと音量を動かして、客席の聞こえ方をたしかめよう。"],
      },
      tools: [],
      resolution: { title: "どの席にも、音がとどいた！", lines: [] },
      discoveryEcho:
        "さっき、スピーカーの置き方と音量を変えて、席ごとの聞こえ方を確かめたよね。これが音響の仕事の大事な部分のひとつです。",
      seeds: ["道具を調整する", "場所ごとの違いを見る", "やり直して合わせる", "数字を見る", "特にない"],
    },
    {
      id: "crowd-event",
      professionId: "crowd-safety",
      eventId: "town-festival",
      gameType: "crowd_flow",
      place: { name: "開場した会場", image: E("venue_busy"), fit: "cover", focus: "center 55%" },
      mission: {
        title: "入口の近くが\n混んできた！",
        lines: ["どこが詰まっているかを見て、人の流れを変えよう。"],
      },
      tools: [],
      resolution: { title: "混雑が落ちついた！", lines: [] },
      discoveryEcho:
        "さっき、どこが混んでいるかを見て、柵や案内で人の流れを変えたよね。こうやって安全をつくるのが、雑踏警備の大事な仕事のひとつです。",
      seeds: ["人の流れを見る", "置き直して試す", "混雑の原因を探す", "安全を考える", "特にない"],
    },
  ],
};
