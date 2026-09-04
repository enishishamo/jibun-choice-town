// AUTO-GENERATED from factory/state/career-path/career-path-research-merged.json
// by factory/harness/build-career-paths.mjs — do not hand-edit past this
// header without also updating the research JSON, or the two will drift.
//
// "どうやってなるの？" career-path data for Job Reveal (2026-09-04 directive).
// Fact-checked against Japanese public/authoritative sources per profession
// (see factSources on each entry, and factory/state/career-path/research-*.json
// for the full per-batch research notes). Kept OUT of src/data/content/*.ts
// to avoid bloating 14 files with a large nested object per profession —
// looked up by profession id from ProfessionScreen instead.
import type { CareerPath } from "./types";

export const CAREER_PATHS: Record<string, CareerPath> = {
  "doctor": {
    "qualificationRequired": true,
    "qualificationName": "｜医師免許《いしめんきょ》（｜医師国家試験《いしこっかしけん》に合格し、厚生労働大臣の免許を受ける）",
    "pathSummary": "大学の医学部医学科（6年制）を卒業し、｜医師国家試験《いしこっかしけん》に合格したうえで、2年以上の｜臨床研修《りんしょうけんしゅう》を修了して医師として働く。医業は｜医師免許《いしめんきょ》を持つ人にしか許されない｜業務独占資格《ぎょうむどくせんしかく》。",
    "routes": [
      {
        "routeName": "大学医学部医学科ルート",
        "routeType": "国家資格必須ルート",
        "steps": [
          {
            "stage": "大学入学資格の取得（高校卒業／高卒認定試験のいずれか）",
            "requirementType": "education",
            "required": true,
            "description": "高校を卒業するか、高卒認定試験に受かって、大学に入れる資格をとる。多くは高校で理科や数学をがんばって医学部を目指す。"
          },
          {
            "stage": "大学医学部医学科（6年）",
            "requirementType": "education",
            "required": true,
            "description": "医学部で6年間、からだと病気を学ぶ"
          },
          {
            "stage": "｜医師国家試験《いしこっかしけん》",
            "requirementType": "exam",
            "required": true,
            "description": "国のテストに受かって｜医師免許《いしめんきょ》をもらう"
          },
          {
            "stage": "｜臨床研修《りんしょうけんしゅう》（2年以上）",
            "requirementType": "training",
            "required": true,
            "description": "免許のあと2年以上、病院で研修して経験を積む"
          }
        ]
      }
    ],
    "alternatives": "一般の大学を卒業したあとに医学部へ入り直す『学士編入学』という道もある。どちらの道でも、最後は医学部医学科（6年）を修了する必要がある。",
    "canStartLater": true,
    "importantNotes": "医学部医学科は人気が高く、入りたい人の数に対して席が少ない。6年間の学びと2年以上の｜臨床研修《りんしょうけんしゅう》が必要で、資格を取るまでの道のりは長い。社会人になってから『学士編入学』で目指す人もいる。『今すぐ決めないと間に合わない』わけではないが、長い時間がかかる仕事だと正直に伝えておきたい。",
    "factSources": [
      "医師国家試験の施行について｜厚生労働省 https://www.mhlw.go.jp/kouseiroudoushou/shikaku_shiken/ishi/",
      "医師免許取得後の研修制度等について（厚生労働省医政局、文部科学省資料） https://www.mext.go.jp/content/20240227-mxt_senmon02-000034447_1.pdf"
    ],
    "lastVerified": "2026-09-04"
  },
  "labtech": {
    "qualificationRequired": true,
    "qualificationName": "｜臨床検査技師《りんしょうけんさぎし》免許（｜国家資格《こっかしかく》・｜名称独占資格《めいしょうどくせんしかく》）",
    "pathSummary": "文部科学大臣指定の大学・短大や都道府県知事指定の養成所で3年以上学び、｜臨床検査技師《りんしょうけんさぎし》｜国家試験《こっかしけん》に合格して免許を取得する。心電図・超音波などの一部の生理学的検査は法律で｜臨床検査技師《りんしょうけんさぎし》などの有資格者に限定されている一方、検体検査そのものには法律上の業務独占はなく、医療機関では実務上有資格者が担当しているのが実態。",
    "routes": [
      {
        "routeName": "養成校（大学・短大・専門学校）ルート",
        "routeType": "国家資格必須ルート",
        "steps": [
          {
            "stage": "大学入学資格の取得（高校卒業／高卒認定試験のいずれか）",
            "requirementType": "education",
            "required": true,
            "description": "高校を卒業するか、高卒認定試験に受かって、検査の専門学校や大学に入れる資格をとる。"
          },
          {
            "stage": "｜養成校《ようせいこう》（3年以上、大学は4年）",
            "requirementType": "education",
            "required": true,
            "description": "学校で3年以上、検査のやり方を学ぶ"
          },
          {
            "stage": "｜臨床検査技師《りんしょうけんさぎし》｜国家試験《こっかしけん》",
            "requirementType": "exam",
            "required": true,
            "description": "国のテストに受かって免許をもらう"
          }
        ]
      }
    ],
    "alternatives": "特になし（大学・短大・専門学校いずれかの｜養成校《ようせいこう》を経る単一ルートが基本）。海外の｜養成校《ようせいこう》卒業者や海外資格保有者は、厚生労働大臣の個別認定を受けて受験資格を得られる場合がある。",
    "canStartLater": true,
    "importantNotes": "｜臨床検査技師《りんしょうけんさぎし》は｜名称独占資格《めいしょうどくせんしかく》（免許のない人が「｜臨床検査技師《りんしょうけんさぎし》」と名乗ることはできない）。心電図・超音波などの一部の生理学的検査は法律で｜臨床検査技師《りんしょうけんさぎし》などの有資格者に限定されているが、すべての検体検査を一律に独占しているわけではない。すでに大人になってから｜養成校《ようせいこう》（3年制専門学校など）に入学し直して目指すことも可能。",
    "factSources": [
      "臨床検査技師国家試験受験資格の認定について｜厚生労働省 https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000107630.html"
    ],
    "lastVerified": "2026-09-04"
  },
  "radtech": {
    "qualificationRequired": true,
    "qualificationName": "｜診療放射線技師《しんりょうほうしゃせんぎし》免許（｜国家資格《こっかしかく》・｜業務独占資格《ぎょうむどくせんしかく》）",
    "pathSummary": "厚生労働大臣指定の養成所（3年制専門学校など）や文部科学大臣指定の大学（4年制）で学び、｜診療放射線技師《しんりょうほうしゃせんぎし》｜国家試験《こっかしけん》に合格して免許を取得する。X線などの放射線を人体に照射する行為は、医師・歯科医師とこの資格を持つ人以外には認められていない。",
    "routes": [
      {
        "routeName": "養成校（大学・専門学校）ルート",
        "routeType": "国家資格必須ルート",
        "steps": [
          {
            "stage": "高校",
            "requirementType": "education",
            "required": true,
            "description": "高校を出て放射線技師の学校をめざす"
          },
          {
            "stage": "｜養成校《ようせいこう》（3年以上、大学は4年）",
            "requirementType": "education",
            "required": true,
            "description": "学校でX線やCTの使い方を学ぶ"
          },
          {
            "stage": "｜診療放射線技師《しんりょうほうしゃせんぎし》｜国家試験《こっかしけん》",
            "requirementType": "exam",
            "required": true,
            "description": "国のテストに受かって免許をもらう"
          }
        ]
      }
    ],
    "alternatives": "特になし（大学・専門学校いずれかの｜養成校《ようせいこう》を経る単一ルートが基本）。海外の｜養成校《ようせいこう》卒業者等は個別認定によるルートもある。",
    "canStartLater": true,
    "importantNotes": "放射線を人体にあてる行為そのものが法律で制限されており、免許なしでは行えない｜業務独占資格《ぎょうむどくせんしかく》。社会人になってから｜養成校《ようせいこう》に入り直して目指すこともできる。",
    "factSources": [
      "診療放射線技師国家試験受験資格の認定について｜厚生労働省 https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000106627.html"
    ],
    "lastVerified": "2026-09-04"
  },
  "pharmacist": {
    "qualificationRequired": true,
    "qualificationName": "｜薬剤師《やくざいし》免許（｜国家資格《こっかしかく》・｜業務独占資格《ぎょうむどくせんしかく》）",
    "pathSummary": "大学の薬学部（6年制）を卒業し、｜薬剤師《やくざいし》｜国家試験《こっかしけん》に合格して厚生労働省の｜薬剤師《やくざいし》名簿に登録されると｜薬剤師《やくざいし》になれる。調剤は｜薬剤師《やくざいし》（および医師等一部の例外）にしか認められていない｜業務独占資格《ぎょうむどくせんしかく》。",
    "routes": [
      {
        "routeName": "薬学部6年制ルート",
        "routeType": "国家資格必須ルート",
        "steps": [
          {
            "stage": "高校",
            "requirementType": "education",
            "required": true,
            "description": "高校で理科をがんばって薬学部をめざす"
          },
          {
            "stage": "大学薬学部（6年制）",
            "requirementType": "education",
            "required": true,
            "description": "薬学部で6年間、薬とからだを学ぶ"
          },
          {
            "stage": "｜薬剤師《やくざいし》｜国家試験《こっかしけん》",
            "requirementType": "exam",
            "required": true,
            "description": "国のテストに受かって免許をもらう"
          }
        ]
      }
    ],
    "alternatives": "｜薬剤師《やくざいし》になるには原則6年制の薬学課程を卒業する必要がある。4年制の薬科学科等は主に研究者養成コースで、｜薬剤師《やくざいし》｜国家試験《こっかしけん》の受験資格には原則つながらない（過去の制度移行期に限られた例外的な個別審査ルートがあったが、現在の新規進学者が通常あてにできる経路ではない）。",
    "canStartLater": true,
    "importantNotes": "薬学部は基本的に6年制（｜薬剤師《やくざいし》を目指すコース）と4年制（研究者向けコース）に分かれており、｜薬剤師《やくざいし》になるには原則6年制課程を選ぶ必要がある点に注意。社会人から6年制に入学し直すことも可能。",
    "factSources": [
      "薬学教育制度の概要｜文部科学省 https://www.mext.go.jp/a_menu/01_d/1329586.htm",
      "薬剤師国家試験のページ｜厚生労働省 https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iyakuhin/yakuzaishi-kokkashiken/index.html"
    ],
    "lastVerified": "2026-09-04"
  },
  "nurse": {
    "qualificationRequired": true,
    "qualificationName": "｜看護師《かんごし》免許（｜国家資格《こっかしかく》・｜業務独占資格《ぎょうむどくせんしかく》、｜都道府県知事免許《とどうふけんちじめんきょ》の｜准看護師《じゅんかんごし》とは別の資格）",
    "pathSummary": "看護系の大学・短期大学・専門学校いずれかで学び、｜看護師《かんごし》｜国家試験《こっかしけん》に合格して免許を得る。｜准看護師《じゅんかんごし》（｜都道府県知事免許《とどうふけんちじめんきょ》）から正｜看護師《かんごし》（｜国家資格《こっかしかく》）を目指す道もあり、複数のルートが存在する。",
    "routes": [
      {
        "routeName": "看護系大学ルート",
        "routeType": "国家資格必須ルート",
        "steps": [
          {
            "stage": "高校",
            "requirementType": "education",
            "required": true,
            "description": "高校を出て看護の大学をめざす"
          },
          {
            "stage": "看護系大学（4年）",
            "requirementType": "education",
            "required": true,
            "description": "大学で4年間、看護のことを学ぶ"
          },
          {
            "stage": "｜看護師《かんごし》｜国家試験《こっかしけん》",
            "requirementType": "exam",
            "required": true,
            "description": "国のテストに受かって免許をもらう"
          }
        ]
      },
      {
        "routeName": "短期大学ルート",
        "routeType": "国家資格必須ルート",
        "steps": [
          {
            "stage": "看護系短期大学（3年）",
            "requirementType": "education",
            "required": true,
            "description": "短大で3年間、看護のことを学ぶ"
          },
          {
            "stage": "｜看護師《かんごし》｜国家試験《こっかしけん》",
            "requirementType": "exam",
            "required": true,
            "description": "国のテストに受かって免許をもらう"
          }
        ]
      },
      {
        "routeName": "専門学校ルート",
        "routeType": "国家資格必須ルート",
        "steps": [
          {
            "stage": "看護専門学校（3年、5年一貫校は中学卒業後5年）",
            "requirementType": "education",
            "required": true,
            "description": "専門学校で看護のことを学ぶ"
          },
          {
            "stage": "｜看護師《かんごし》｜国家試験《こっかしけん》",
            "requirementType": "exam",
            "required": true,
            "description": "国のテストに受かって免許をもらう"
          }
        ]
      },
      {
        "routeName": "准看護師からのルート",
        "routeType": "実務経験＋国家資格ルート",
        "steps": [
          {
            "stage": "｜准看護師《じゅんかんごし》（｜都道府県知事免許《とどうふけんちじめんきょ》）",
            "requirementType": "education",
            "required": false,
            "description": "先に『｜准看護師《じゅんかんごし》』として働きはじめる道もある"
          },
          {
            "stage": "｜看護師《かんごし》｜養成課程《ようせいかてい》（2年課程）",
            "requirementType": "experience",
            "required": true,
            "description": "働きながら、正｜看護師《かんごし》になるための学校（2年間、通信でも通える）に通って卒業をめざす。通信で学ぶ場合は、｜准看護師《じゅんかんごし》としてある程度長く働いた経験が必要になるよ。"
          },
          {
            "stage": "｜看護師《かんごし》｜国家試験《こっかしけん》",
            "requirementType": "exam",
            "required": true,
            "description": "国のテストに受かって正｜看護師《かんごし》になる"
          }
        ]
      }
    ],
    "alternatives": "上記4ルート以外に、放送大学等の通信制課程を活用して｜准看護師《じゅんかんごし》から｜看護師《かんごし》を目指す道もある。",
    "canStartLater": true,
    "importantNotes": "｜看護師《かんごし》（正｜看護師《かんごし》）は｜国家資格《こっかしかく》、｜准看護師《じゅんかんごし》は都道府県知事が与える別の資格で、法律上の位置づけが異なる点に注意。｜准看護師《じゅんかんごし》として先に働き始めてから、あとで正｜看護師《かんごし》を目指す『途中からのルート』が実際に存在するため、早く決めないと目指せない仕事ではない。",
    "factSources": [
      "看護師国家試験の施行｜厚生労働省 https://www.mhlw.go.jp/kouseiroudoushou/shikaku_shiken/kangoshi/",
      "看護師国家試験の受験資格｜放送大学 https://www.ouj.ac.jp/reasons-to-choose-us/qualification/nurse/"
    ],
    "lastVerified": "2026-09-04"
  },
  "dietitian": {
    "qualificationRequired": true,
    "qualificationName": "｜管理栄養士《かんりえいようし》免許（｜国家資格《こっかしかく》・｜名称独占資格《めいしょうどくせんしかく》）。前提として栄養士免許（｜都道府県知事免許《とどうふけんちじめんきょ》）も取得する。",
    "pathSummary": "｜管理栄養士《かんりえいようし》は｜国家資格《こっかしかく》で、『｜管理栄養士《かんりえいようし》』を名乗るには免許が必要（名称独占）。栄養士（｜都道府県知事免許《とどうふけんちじめんきょ》）とは別の資格で、多くの場合は4年制の｜管理栄養士《かんりえいようし》｜養成課程《ようせいかてい》を卒業して栄養士免許を得ると同時に、｜実務経験《じつむけいけん》なしで｜管理栄養士《かんりえいようし》｜国家試験《こっかしけん》の受験資格を得るルートが一般的。栄養士｜養成施設《ようせいしせつ》（2年制・3年制）を出て｜実務経験《じつむけいけん》を積んでから｜管理栄養士《かんりえいようし》｜国家試験《こっかしけん》を受ける道もある。",
    "routes": [
      {
        "routeName": "管理栄養士養成課程（4年制大学等）ルート",
        "routeType": "国家資格ルート（実務経験不要）",
        "steps": [
          {
            "stage": "高校",
            "requirementType": "education",
            "required": true,
            "description": "高校を出て｜管理栄養士《かんりえいようし》の学校をめざす"
          },
          {
            "stage": "｜管理栄養士《かんりえいようし》｜養成課程《ようせいかてい》（4年）",
            "requirementType": "education",
            "required": true,
            "description": "学校で4年間、栄養のことを学ぶ"
          },
          {
            "stage": "｜管理栄養士《かんりえいようし》｜国家試験《こっかしけん》",
            "requirementType": "exam",
            "required": true,
            "description": "国のテストに受かって｜管理栄養士《かんりえいようし》になる"
          }
        ]
      },
      {
        "routeName": "栄養士養成施設（2年制・3年制）＋実務経験ルート",
        "routeType": "実務経験＋国家資格ルート",
        "steps": [
          {
            "stage": "栄養士｜養成施設《ようせいしせつ》（2年または3年）",
            "requirementType": "education",
            "required": true,
            "description": "学校で栄養士の資格をまず取る"
          },
          {
            "stage": "｜実務経験《じつむけいけん》（2年制卒業は3年以上、3年制卒業は2年以上）",
            "requirementType": "experience",
            "required": true,
            "description": "学校が2年制なら3年以上、3年制なら2年以上、栄養の仕事をしてから試験を受けられるよ。"
          },
          {
            "stage": "｜管理栄養士《かんりえいようし》｜国家試験《こっかしけん》",
            "requirementType": "exam",
            "required": true,
            "description": "国のテストに受かって｜管理栄養士《かんりえいようし》になる"
          }
        ]
      }
    ],
    "alternatives": "特になし（上記2ルートが基本）。",
    "canStartLater": true,
    "importantNotes": "『栄養士』と『｜管理栄養士《かんりえいようし》』は別の資格で、｜管理栄養士《かんりえいようし》の方が上位の｜国家資格《こっかしかく》（名称独占）。誤解されやすいが、｜管理栄養士《かんりえいようし》になるために必ず先に栄養士として現場で長く働く必要があるわけではなく、4年制の｜管理栄養士《かんりえいようし》｜養成課程《ようせいかてい》を卒業すれば｜実務経験《じつむけいけん》なしで｜国家試験《こっかしけん》を受けられる道が今は主流。栄養士として働き始めてから｜管理栄養士《かんりえいようし》を目指す『途中からのルート』も存在する。 なお、｜管理栄養士《かんりえいようし》｜養成施設《ようせいしせつ》は4年制（大学・専門学校）のみで、短期大学は栄養士｜養成施設《ようせいしせつ》（2〜3年制）に分類され、｜管理栄養士《かんりえいようし》｜養成施設《ようせいしせつ》には含まれない。",
    "factSources": [
      "管理栄養士国家試験｜厚生労働省 https://www.mhlw.go.jp/kouseiroudoushou/shikaku_shiken/kanrieiyoushi/",
      "管理栄養士国家試験について｜公益社団法人 日本栄養士会 https://www.dietitian.or.jp/students/national-exam/"
    ],
    "lastVerified": "2026-09-04"
  },
  "pt": {
    "qualificationRequired": true,
    "qualificationName": "｜理学療法士《りがくりょうほうし》免許（｜国家資格《こっかしかく》・｜名称独占資格《めいしょうどくせんしかく》）",
    "pathSummary": "｜理学療法士《りがくりょうほうし》｜養成校《ようせいこう》（大学・短大・専門学校のいずれか、3年以上）で学び、｜理学療法士《りがくりょうほうし》｜国家試験《こっかしけん》に合格して免許を取得する。｜理学療法士《りがくりょうほうし》は｜名称独占資格《めいしょうどくせんしかく》で、免許のない人が「｜理学療法士《りがくりょうほうし》」と名乗ることはできない。医療機関では医師の指示のもと、実際のリハビリ業務は基本的に有資格者が担当する。",
    "routes": [
      {
        "routeName": "養成校（大学・短大・専門学校）ルート",
        "routeType": "国家資格必須ルート",
        "steps": [
          {
            "stage": "高校",
            "requirementType": "education",
            "required": true,
            "description": "高校を出て｜理学療法士《りがくりょうほうし》の学校をめざす"
          },
          {
            "stage": "｜養成校《ようせいこう》（3年以上）",
            "requirementType": "education",
            "required": true,
            "description": "学校でリハビリのやり方を学ぶ"
          },
          {
            "stage": "｜理学療法士《りがくりょうほうし》｜国家試験《こっかしけん》",
            "requirementType": "exam",
            "required": true,
            "description": "国のテストに受かって免許をもらう"
          }
        ]
      },
      {
        "routeName": "作業療法士資格保有者ルート",
        "routeType": "国家資格必須ルート（既資格者向け短縮）",
        "steps": [
          {
            "stage": "｜作業療法士《さぎょうりょうほうし》免許を先に取得",
            "requirementType": "education",
            "required": false,
            "description": "先に｜作業療法士《さぎょうりょうほうし》になっている人向けの道"
          },
          {
            "stage": "｜理学療法士《りがくりょうほうし》｜養成校《ようせいこう》（2年以上）",
            "requirementType": "education",
            "required": true,
            "description": "2年間、追加で｜理学療法士《りがくりょうほうし》の勉強をする"
          },
          {
            "stage": "｜理学療法士《りがくりょうほうし》｜国家試験《こっかしけん》",
            "requirementType": "exam",
            "required": true,
            "description": "国のテストに受かって免許をもらう"
          }
        ]
      }
    ],
    "alternatives": "海外の理学療法｜養成校《ようせいこう》卒業者や海外資格保有者は、厚生労働大臣の個別認定を受けて受験資格を得られる場合がある。",
    "canStartLater": true,
    "importantNotes": "｜理学療法士《りがくりょうほうし》は｜名称独占資格《めいしょうどくせんしかく》（免許のない人が「｜理学療法士《りがくりょうほうし》」と名乗ることはできない資格）。業務そのものを法律で全面的に独占しているわけではないが、医療機関では医師の指示のもと基本的に有資格者がリハビリ業務を担当する。社会人になってから｜養成校《ようせいこう》に入り直して目指すことも可能。",
    "factSources": [
      "理学療法士国家試験の施行｜厚生労働省 https://www.mhlw.go.jp/kouseiroudoushou/shikaku_shiken/rigakuryouhoushi/",
      "理学療法士になるには｜公益社団法人 日本理学療法士協会 https://www.japanpt.or.jp/about_pt/aim/"
    ],
    "lastVerified": "2026-09-04"
  },
  "msw": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "『MSW（医療ソーシャルワーカー）』という肩書自体は法律で定められた資格名ではない。多くの場合、｜社会福祉士《しゃかいふくしし》（｜国家資格《こっかしかく》・名称独占）や精神保健福祉士（｜国家資格《こっかしかく》・名称独占）を取得した人が、医療機関でこの役割を担っている。厚生労働省の『医療ソーシャルワーカー業務指針』はあるが、資格保有そのものを法律上の必須条件とはしていない。",
    "routes": [
      {
        "routeName": "社会福祉士ルート（最も一般的）",
        "routeType": "実務でよく求められる資格ルート（法的必須ではない）",
        "steps": [
          {
            "stage": "福祉系大学 または 一般大学＋｜養成施設《ようせいしせつ》",
            "requirementType": "education",
            "required": true,
            "description": "福祉を学べる大学や学校に通う（何通りかの道がある）"
          },
          {
            "stage": "｜社会福祉士《しゃかいふくしし》｜国家試験《こっかしけん》",
            "requirementType": "exam",
            "required": true,
            "description": "国のテストに受かって｜社会福祉士《しゃかいふくしし》になる"
          },
          {
            "stage": "病院など医療機関に就職",
            "requirementType": "experience",
            "required": false,
            "description": "病院で相談の仕事をする人としてはたらく"
          }
        ]
      }
    ],
    "alternatives": "精神保健福祉士（｜国家資格《こっかしかく》）を取得して医療機関で働くルートもある。また、法律上は資格がなくても『相談員』等の名称で同様の相談援助業務に従事することは可能だが、『｜社会福祉士《しゃかいふくしし》』『精神保健福祉士』を無資格で名乗ることは名称独占によりできない。",
    "canStartLater": true,
    "importantNotes": "MSWという名前を聞くと専用の資格があるように誤解しやすいが、実際は｜社会福祉士《しゃかいふくしし》・精神保健福祉士という別の｜国家資格《こっかしかく》の保有者が医療現場でMSWと呼ばれていることが多い、という点を正確に伝える必要がある。資格保有は法的な必須条件ではないが、実際の求人ではほぼ必須とされることが多い。一般大学を卒業してからでも1年程度の｜養成施設《ようせいしせつ》で目指せるルートがあり、途中から目指しやすい仕事の一つ。",
    "factSources": [
      "医療ソーシャルワーカー（MSW）の仕事内容と資格について https://www.iryou21.jp/media/how-to-work/shokushu-msw/",
      "[社会福祉士国家試験]受験資格（資格取得ルート図）｜公益財団法人 社会福祉振興・試験センター https://www.sssc.or.jp/shakai/shikaku/route.html",
      "[社会福祉士国家試験]受験資格：短期養成施設・一般養成施設｜公益財団法人 社会福祉振興・試験センター https://www.sssc.or.jp/shakai/shikaku/s_12.html"
    ],
    "lastVerified": "2026-09-04"
  },
  "forest-picker": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "選木（間伐や主伐でどの木を残し、どの木を伐るか見極める仕事）に法律上必須の資格はなく、林業会社や森林組合に就職してから｜実務経験《じつむけいけん》と研修で技術を身につけるのが一般的なルート。林業大学校で先に体系的に学んでから就職する道もある。",
    "routes": [
      {
        "routeName": "林業大学校・林業科ルート",
        "routeType": "教育機関からの就職ルート",
        "steps": [
          {
            "stage": "中学校",
            "requirementType": "education",
            "required": false,
            "description": "中学校はふつうに卒業するよ。"
          },
          {
            "stage": "高校（普通科でも農業・林業系専門学科でも可）",
            "requirementType": "education",
            "required": true,
            "description": "林業の専門学校に行くには、高校を卒業していることが必要だよ。森や林業のことを学べる高校もあるけど、ふつうの高校でも大丈夫。"
          },
          {
            "stage": "林業大学校・専門学校（1〜2年課程、全国24校程度）",
            "requirementType": "education",
            "required": false,
            "description": "林業の学校に行くと、木の見分け方や道具の使い方を先に勉強できるよ。行かなくても仕事にはつけるけど、行くと早く上手になれる。"
          },
          {
            "stage": "森林組合・林業会社に就職＋「緑の雇用」研修",
            "requirementType": "training",
            "required": false,
            "description": "会社に入ってから、国のサポートで少しずつ木の育て方や選び方を教えてもらえる制度があるよ。"
          }
        ]
      },
      {
        "routeName": "未経験からの直接就職ルート",
        "routeType": "未経験からのOJTルート",
        "steps": [
          {
            "stage": "中学校・高校卒業（学歴要件なし）",
            "requirementType": "education",
            "required": false,
            "description": "学校を出たら、すぐに林業の会社に入って仕事をしながら覚える道もあるよ。"
          },
          {
            "stage": "就職後のOJT・研修",
            "requirementType": "experience",
            "required": true,
            "description": "実際に森に入って、先輩と一緒に木を見ながら少しずつ上手になっていくよ。"
          }
        ]
      }
    ],
    "alternatives": "農林業系の大学・大学院（森林科学科等）に進学してから就職する道もあるが、必須ではなく、選木業務自体に学歴フィルターは一般的にない。",
    "canStartLater": true,
    "importantNotes": "「選木」という業務単体に対応する｜国家資格《こっかしかく》は存在しない。ただし現場では伐木用チェーンソーや刈払機を扱う場面が出てくるため、その作業に対応する法定の｜特別教育《とくべつきょういく》（下記forest-fellerの説明を参照）は別途必要になる。",
    "factSources": [
      "林野庁「緑の雇用」事業と林業労働力の確保・育成について https://www.rinya.maff.go.jp/j/routai/koyou/",
      "林野庁 林業大学校等一覧（令和6年4月現在） https://www.rinya.maff.go.jp/j/ken_sidou/fukyuu/attach/pdf/ringyoukyouiku-30.pdf",
      "森林の仕事、林業で働きたい方の就業を支援『緑の雇用』RINGYOU.NET https://www.ringyou.net/project/",
      "職業情報提供サイト（job tag）厚生労働省 林業作業 https://shigoto.mhlw.go.jp/User/Occupation/Detail/230"
    ],
    "lastVerified": "2026-09-04"
  },
  "forest-feller": {
    "qualificationRequired": true,
    "qualificationName": "チェーンソーによる伐木等｜特別教育《とくべつきょういく》（労働安全衛生法上の法定｜特別教育《とくべつきょういく》）",
    "pathSummary": "チェーンソーを使って木を伐る業務に就労者として携わる場合、労働安全衛生法・労働安全衛生規則に基づき「チェーンソーによる伐木等｜特別教育《とくべつきょういく》」を事業者が受けさせることが法律で義務付けられている。学歴要件はなく、就職前後どちらでも受講でき、未経験から始められる。",
    "routes": [
      {
        "routeName": "就職＋法定特別教育ルート（最も一般的）",
        "routeType": "実務経験＋法定講習ルート",
        "steps": [
          {
            "stage": "中学校・高校卒業（学歴要件なし）",
            "requirementType": "education",
            "required": false,
            "description": "学歴は関係ないけど、実際にチェーンソーで木を伐る仕事につけるのは18歳になってから。"
          },
          {
            "stage": "森林組合・林業会社・造園会社等に就職",
            "requirementType": "experience",
            "required": true,
            "description": "木を切る仕事をする会社に入るところからスタートするよ。"
          },
          {
            "stage": "チェーンソーによる伐木等｜特別教育《とくべつきょういく》（学科9時間＋実技9時間、合計18時間）",
            "requirementType": "license",
            "required": true,
            "description": "チェーンソーを使うには、法律で決まっている安全のための講習を必ず受けないといけないよ。誰でも受けられる講習だよ。"
          },
          {
            "stage": "大径木・特殊伐倒等の｜技能講習《ぎのうこうしゅう》（架線集材など高度な業務に応じて追加）",
            "requirementType": "training",
            "required": false,
            "description": "もっと難しい木の伐り方をするときは、さらに別の講習を受けることもあるよ。"
          }
        ]
      }
    ],
    "alternatives": "林業大学校で在学中に｜特別教育《とくべつきょういく》を取得してから就職するルートもあるが、必須ではなく就職後に受講しても問題ない。",
    "canStartLater": true,
    "importantNotes": "「｜特別教育《とくべつきょういく》」は運転免許のような｜国家試験《こっかしけん》に合格して交付される『免許』ではなく、法律で受講が義務付けられた講習（修了証が交付される）である点に注意。無資格・未受講でチェーンソーによる伐木業務に就かせることは事業者にとって労働安全衛生法違反となる。",
    "factSources": [
      "厚生労働省 労働安全衛生規則第36条第8号（特別教育を必要とする業務）",
      "コベルコ教習所 チェーンソーによる伐木等特別教育 https://www.kobelco-kyoshu.com/batsuboku_special/",
      "CIC日本建設情報センター チェーンソーによる伐木等特別教育とは https://www.cic-ct.co.jp/column/spchainsaw-column/spchainsaw-column-column01/"
    ],
    "lastVerified": "2026-09-04"
  },
  "forest-planter": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "植林・下刈りなど造林作業そのものに法律上必須の資格はなく、未経験からでも森林組合・林業会社に就職して働き始められる。ただし刈払機を使う作業では、法定ではないが業界標準として安全教育（刈払機取扱作業者安全衛生教育）を受けるのが一般的。",
    "routes": [
      {
        "routeName": "未経験からの就職ルート",
        "routeType": "未経験からのOJTルート",
        "steps": [
          {
            "stage": "中学校・高校卒業（学歴要件なし）",
            "requirementType": "education",
            "required": false,
            "description": "学校はふつうに卒業すれば大丈夫だよ。"
          },
          {
            "stage": "森林組合・林業会社に就職",
            "requirementType": "experience",
            "required": true,
            "description": "森を育てる会社に入って、先輩といっしょに木を植えたり草を刈ったりして覚えるよ。"
          },
          {
            "stage": "刈払機取扱作業者安全衛生教育（業界推奨の安全教育、法定の｜特別教育《とくべつきょういく》ではない）",
            "requirementType": "training",
            "required": false,
            "description": "草刈り機を使うときの安全講習を受けておくと、より安心して仕事ができるよ（法律の決まりではないけど、みんな受けているよ）。"
          },
          {
            "stage": "「緑の雇用」フォレストワーカー研修",
            "requirementType": "training",
            "required": false,
            "description": "国の応援で、仕事をしながら少しずつ木の育て方を教えてもらえるよ。"
          }
        ]
      }
    ],
    "alternatives": "林業大学校で先に基礎を学んでから就職する道もある（forest-pickerと同様のルート）。",
    "canStartLater": true,
    "importantNotes": "「造林作業員」という業務そのものに学歴要件・｜国家資格《こっかしかく》要件を課す実態はない。誤解されやすいが、林業＝資格必須というわけではなく、資格が必要になるのは特定の機械・危険業務（チェーンソー等）に限られる。",
    "factSources": [
      "林野庁「緑の雇用」事業 https://www.rinya.maff.go.jp/j/routai/koyou/",
      "森ワーク 林業に必要な資格等 https://moriwork.jp/employment/flow/qualifications/",
      "職業情報提供サイト（job tag）林業作業 https://shigoto.mhlw.go.jp/User/Occupation/Detail/230"
    ],
    "lastVerified": "2026-09-04"
  },
  "river-surveyor": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "河川の水質や生きもの（魚類・底生動物・水生植物など）を調べる調査員の仕事に、法律で定められた必須資格はない。環境系の学校・学部で生物や水質の知識を学び、環境調査会社や建設コンサルタントに就職して国や自治体発注の調査（河川水辺の国勢調査など）に携わるのが一般的な道。",
    "routes": [
      {
        "routeName": "環境・生物系の専門学校/大学からのルート",
        "routeType": "専門教育ルート",
        "steps": [
          {
            "stage": "中学校・高校",
            "requirementType": "education",
            "required": false,
            "description": "生き物や自然が好きだと、この先の勉強が楽しくなるよ。"
          },
          {
            "stage": "環境系・生物系の専門学校や大学（環境調査、水産、農学、生物学など）",
            "requirementType": "education",
            "required": false,
            "description": "生き物や水のことを専門に勉強できる学校に行くと、調べる仕事がしやすくなるよ。行かなくてもなれるよ。"
          },
          {
            "stage": "環境調査会社・建設コンサルタントに就職",
            "requirementType": "experience",
            "required": true,
            "description": "川の生き物や水を調べる会社に入って、国や県から頼まれた調査をする仕事につくよ。"
          }
        ]
      },
      {
        "routeName": "市民調査からの関心の広がり",
        "routeType": "参加型ルート（職業ルートではない）",
        "steps": [
          {
            "stage": "全国水生生物調査などの市民参加型調査",
            "requirementType": "experience",
            "required": false,
            "description": "夏休みなどに川の生き物を調べるイベントがあって、だれでも参加できるよ。これがきっかけで将来この仕事に興味を持つ人もいるよ。"
          }
        ]
      }
    ],
    "alternatives": "自治体や国交省の技術系公務員として河川環境行政に携わる道もある（この場合は公務員試験が必要）。",
    "canStartLater": true,
    "importantNotes": "環境調査員という職業カテゴリ全体に対応する単一の必須資格は存在しない。分野（水質・魚類・鳥類等）によって役立つ資格（例：ビオトープ管理士、環境計量士など）はあるが、いずれも任意の付加価値資格であり、必須ではない。",
    "factSources": [
      "国土交通省 河川水辺の国勢調査 基本調査マニュアル https://www.mlit.go.jp/river/shinngikai_blog/mizubekokutyou/dai05kai/dai05kai_siryou3-1.pdf",
      "環境省 令和6年度全国水生生物調査の結果及び令和7年度の調査の実施について https://www.env.go.jp/press/press_05029.html",
      "日本自然環境専門学校 環境調査の仕事紹介 https://www.caretech.ac.jp/profession/profession_investigation.html"
    ],
    "lastVerified": "2026-09-04"
  },
  "river-operator": {
    "qualificationRequired": false,
    "qualificationName": "｜公害防止管理者《こうがいぼうしかんりしゃ》（水質関係）※通常の公共下水処理場では選任義務は生じない",
    "pathSummary": "下水処理場の運転管理は未経験からOJTで始められる仕事。「特定工場における公害防止組織の整備に関する法律」が定める『特定工場』は製造業・電気供給業・ガス供給業・熱供給業の4業種に限られ、公共下水道・流域下水道の終末処理場（自治体等が運営する下水道事業）は原則この4業種に該当しないため、この法律に基づく水質関係｜公害防止管理者《こうがいぼうしかんりしゃ》の選任義務は通常生じない。一部自治体では条例により独自の『水質管理責任者』等の設置を求める場合があるが、これは国の法律ではなく自治体条例による別制度。",
    "routes": [
      {
        "routeName": "就職後に資格取得するルート（現場運転員の一般的な道）",
        "routeType": "実務経験＋国家資格ルート",
        "steps": [
          {
            "stage": "高校（工業系・化学系だと知識面で有利だが必須ではない）",
            "requirementType": "education",
            "required": false,
            "description": "理科や化学が好きだと役に立つけど、絶対にその勉強をしていないとダメというわけじゃないよ。"
          },
          {
            "stage": "下水処理場の運転管理業務に就職",
            "requirementType": "experience",
            "required": true,
            "description": "まずは水をきれいにする施設で働き始めて、仕事をしながら覚えていくよ。"
          },
          {
            "stage": "｜公害防止管理者《こうがいぼうしかんりしゃ》（水質関係）｜国家試験《こっかしけん》または資格認定講習",
            "requirementType": "license",
            "required": false,
            "description": "国の法律では、ふつうの下水処理場にこの資格を持つ人を必ず置く決まりはないことが多いよ。まちによっては、独自のルールで似た担当者を置く場合もあるよ。"
          }
        ]
      }
    ],
    "alternatives": "小規模な施設や特定の担当業務であれば資格保有者でなくてもチームの一員として運転管理業務に携わることは可能（選任義務は施設単位）。",
    "canStartLater": true,
    "importantNotes": "『｜公害防止管理者《こうがいぼうしかんりしゃ》』は製造業・電気供給業・ガス供給業・熱供給業の4業種の工場に適用される制度で、公共下水処理場は原則対象外。現場の運転員がこの資格を持っていなくても、通常の運転業務には支障がない。",
    "factSources": [
      "環境省 公害防止管理者法の概要（特定工場における公害防止組織の整備に関する法律）https://www.env.go.jp/air/info/pp_kentou/pem01/ref01.pdf",
      "一般社団法人産業環境管理協会 公害防止管理者等の種類・選任資格 https://www.jemai.or.jp/polconman/dd4ht300000005e4-att/pol_license_about.pdf",
      "和歌山県 公害防止管理者制度のあらまし https://www.pref.wakayama.lg.jp/prefg/032100/kougaibousikannrisya.html"
    ],
    "lastVerified": "2026-09-04"
  },
  "river-designer": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "多自然川づくり（自然環境に配慮した河川の設計）そのものに設計者として就くための法定必須資格はないが、公共事業を発注・受注する上での「管理技術者」要件として、｜技術士《ぎじゅつし》（建設部門）や1級｜土木施工管理技士《どぼくせこうかんりぎし》が実務上ほぼ必須とされる場面が多い。大学の土木・環境系学科で学び、建設コンサルタント会社に就職するのが典型的な道。",
    "routes": [
      {
        "routeName": "大学（土木・環境工学）→建設コンサルタントルート",
        "routeType": "教育機関からの就職ルート",
        "steps": [
          {
            "stage": "高校（理系、できれば数学・物理を選択）",
            "requirementType": "education",
            "required": false,
            "description": "理科や数学の勉強をがんばっておくと、あとで役に立つよ。"
          },
          {
            "stage": "大学・高専（土木工学、環境工学、河川工学など）",
            "requirementType": "education",
            "required": false,
            "description": "川や土木のことを大学で勉強してから、この仕事につく人が多いよ。"
          },
          {
            "stage": "建設コンサルタント会社・国土交通省関連機関に就職",
            "requirementType": "experience",
            "required": true,
            "description": "川の形を考える会社に入って、実際の仕事をしながら経験を積んでいくよ。"
          },
          {
            "stage": "｜技術士《ぎじゅつし》（建設部門）または1級｜土木施工管理技士《どぼくせこうかんりぎし》（実務上重要な資格）",
            "requirementType": "license",
            "required": false,
            "description": "国が認める『川づくりの専門家』の資格を取ると、より責任のある仕事を任されやすくなるよ。絶対に必要というわけではないけど、取っている人が多いよ。"
          }
        ]
      }
    ],
    "alternatives": "｜土木施工管理技士《どぼくせこうかんりぎし》（現場の施工管理を担う｜国家資格《こっかしかく》）から｜実務経験《じつむけいけん》を積み、設計側にキャリアチェンジする道もある。",
    "canStartLater": true,
    "importantNotes": "『｜技術士《ぎじゅつし》』『｜土木施工管理技士《どぼくせこうかんりぎし》』はどちらも｜国家資格《こっかしかく》だが、法律上「これがないと多自然川づくりの設計をしてはいけない」という｜業務独占資格《ぎょうむどくせんしかく》ではない。ただし公共事業の管理技術者要件として実質的に求められることが多く、「資格がなくても設計の仕事に関わり始めることはできるが、責任者になるには資格取得が実務上の壁になる」という構造を正確に伝える必要がある。",
    "factSources": [
      "国土交通省 水管理・国土保全局 多自然川づくりとは https://www.mlit.go.jp/river/kankyo/main/kankyou/tashizen/02.html",
      "日本技術士会 技術士資格の公的活用 https://www.engineer.or.jp/contents/attach/attach_6276_2.pdf",
      "国土交通省 建設産業・不動産業：技術検定制度・技術者制度 https://www.mlit.go.jp/totikensangyo/const/totikensangyo_const_tk1_000055.html"
    ],
    "lastVerified": "2026-09-04"
  },
  "port-planner": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "コンテナヤードでの荷役計画・コンテナ配置計画（プランナー）の仕事に法律上必須の資格はなく、港湾運送会社・船会社の現場業務（荷役補助など）からの社内キャリアアップで就くのが一般的。パソコンでの計画システム操作や船の積み付け知識は入社後に習得する。",
    "routes": [
      {
        "routeName": "港湾運送会社への就職＋社内キャリアアップルート",
        "routeType": "未経験からのOJTルート",
        "steps": [
          {
            "stage": "高校・専門学校卒業（学歴要件なし）",
            "requirementType": "education",
            "required": false,
            "description": "決まった学校を出ていないとなれない仕事ではないよ。"
          },
          {
            "stage": "港湾運送会社・船会社ターミナル部門に就職",
            "requirementType": "experience",
            "required": true,
            "description": "港の会社に入って、コンテナがどう動いているかをまず知ることから始めるよ。"
          },
          {
            "stage": "ヤードプランナー業務へのステップアップ",
            "requirementType": "experience",
            "required": true,
            "description": "経験を積んでいくと、コンテナをどこに置くか計画する係を任されるようになるよ。"
          }
        ]
      }
    ],
    "alternatives": "物流・海事系の大学や専門学校（商船系など）で船舶や物流の基礎を学んでから就職する道もあるが必須ではない。",
    "canStartLater": true,
    "importantNotes": "「プランナー」という肩書きの業務に対応する｜国家資格《こっかしかく》・業界統一資格は確認できなかった。企業ごとの社内育成・OJTが実態である点を明記する。",
    "factSources": [
      "求人ボックス コンテナヤードの転職・求人情報 https://求人ボックス.com/コンテナヤードの仕事",
      "東海協和株式会社 コンテナ船の作業プランナー https://www.tokai-kyowa.co.jp/recruit/terminal.html"
    ],
    "lastVerified": "2026-09-04"
  },
  "port-crane": {
    "qualificationRequired": true,
    "qualificationName": "クレーン・デリック｜運転士免許《うんてんしめんきょ》（クレーン限定で足りる場合が多い）※つり上げ荷重5トン以上のクレーンを運転する場合に法律上必須の｜国家資格《こっかしかく》。ガントリークレーンはつり上げ荷重5トン以上に該当するため対象。",
    "pathSummary": "ガントリークレーンなどコンテナ荷役用の大型クレーンを運転するには、労働安全衛生法に基づく｜国家資格《こっかしかく》「クレーン・デリック｜運転士免許《うんてんしめんきょ》」が法律上必ず必要。多くの港湾運送会社では未経験で採用したうえで、荷役補助業務からスタートし、会社の支援制度を使って入社後に免許を取得させるのが一般的。",
    "routes": [
      {
        "routeName": "港湾会社に就職＋会社支援での免許取得ルート（最も一般的）",
        "routeType": "国家資格必須ルート（実務経験併用）",
        "steps": [
          {
            "stage": "高校・専門学校卒業（学歴要件なし）",
            "requirementType": "education",
            "required": false,
            "description": "特別な学校に行っていなくても目指せる資格だよ。"
          },
          {
            "stage": "港湾運送会社に就職（免許なしでも採用されることが多い）",
            "requirementType": "experience",
            "required": false,
            "description": "免許がなくても港の会社に入れて、最初は他の仕事を手伝いながら覚えていくよ。"
          },
          {
            "stage": "クレーン・デリック｜運転士免許《うんてんしめんきょ》（学科試験＋実技試験、安全衛生技術試験協会が実施）",
            "requirementType": "license",
            "required": true,
            "description": "大きなクレーンを動かすには、国が決めた運転免許を必ず持っていないといけないよ。会社がお金を出して免許を取らせてくれることも多いよ。"
          }
        ]
      }
    ],
    "alternatives": "ポリテクセンター（職業能力開発促進センター）の港湾荷役科などを修了すると、クレーン・デリック｜運転士免許《うんてんしめんきょ》を申請のみで取得できる制度もある。",
    "canStartLater": true,
    "importantNotes": "クレーン・デリック｜運転士免許《うんてんしめんきょ》は法律で明確に義務付けられた｜国家資格《こっかしかく》であり、無資格でつり上げ荷重5トン以上のクレーンを運転させることは事業者にとって労働安全衛生法違反となる。ただし『免許を持っていないと港の会社に入社すらできない』わけではなく、入社後に取得するのが実態に近い。",
    "factSources": [
      "公益財団法人 安全衛生技術試験協会 クレーン・デリック運転士〔クレーン限定〕の紹介 https://www.exam.or.jp/introduction/h_shokai206/",
      "職業能力開発促進センター名古屋港 港湾の仕事と港湾技能者に必要な資格について https://www3.jeed.go.jp/nagoyakouwan/poly/of_minato_sigoto.html",
      "ja.wikipedia.org クレーン・デリック運転士 https://ja.wikipedia.org/wiki/クレーン・デリック運転士"
    ],
    "lastVerified": "2026-09-04"
  },
  "port-tally": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "港の検数員（貨物の個数・状態を確認し証明する仕事）は港湾運送事業法上の「検数事業」に位置づけられているが、就業に法律上必須の｜国家資格《こっかしかく》は確認できなかった。日本貨物検数協会など検数事業者に就職し、社内研修・OJTで実務を身につけるのが一般的なルート。",
    "routes": [
      {
        "routeName": "検数事業者への就職ルート",
        "routeType": "未経験からのOJTルート",
        "steps": [
          {
            "stage": "高校・大学卒業（学歴要件は各事業者による）",
            "requirementType": "education",
            "required": false,
            "description": "決まった学歴がなくても目指せる仕事だよ。"
          },
          {
            "stage": "検数事業者（日本貨物検数協会など）に就職",
            "requirementType": "experience",
            "required": true,
            "description": "貨物を確認する会社に入って、実際に港で働きながら仕事を覚えるよ。"
          },
          {
            "stage": "社内研修・｜実務経験《じつむけいけん》の蓄積",
            "requirementType": "training",
            "required": true,
            "description": "何回も経験を積むことで、貨物を見分ける力がついていくよ。"
          }
        ]
      }
    ],
    "alternatives": "港湾職業能力開発短期大学校などで港湾関連の基礎知識を学んでから就職する道もある。",
    "canStartLater": true,
    "importantNotes": "「検数技士」という名称の統一的な｜国家資格《こっかしかく》・業界共通資格の存在は、公的資料からは確認できなかった。誤解を避けるため、本教材では『検数員になるための必須資格は確認できていない（社内研修中心）』という不確実性を明記して扱う。今後、日本貨物検数協会等への追加確認が望ましい。",
    "factSources": [
      "一般社団法人 日本貨物検数協会 https://www.jctc.or.jp/",
      "一般社団法人 日本貨物検数協会 協会概要 https://www.jctc.or.jp/about/outline/",
      "職業能力開発促進センター名古屋港 港湾の仕事と港湾技能者に必要な港湾資格について https://www3.jeed.go.jp/nagoyakouwan/poly/of_minato_sigoto.html"
    ],
    "lastVerified": "2026-09-04"
  },
  "port-dispatch": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "コンテナ輸送の配車担当（トラックやドライバーの手配・運行計画）に法律上必須の資格はなく、物流会社・港湾運送会社に就職してから配送業務の知識を身につけ、配車担当へステップアップするのが一般的。普通自動車免許程度は業務上有用だが必須の｜国家資格《こっかしかく》ではない。",
    "routes": [
      {
        "routeName": "物流・運送会社への就職ルート",
        "routeType": "未経験からのOJTルート",
        "steps": [
          {
            "stage": "高校・専門学校卒業（学歴要件なし）",
            "requirementType": "education",
            "required": false,
            "description": "特別な学校を出ていなくても目指せる仕事だよ。"
          },
          {
            "stage": "物流会社・港湾運送会社に就職",
            "requirementType": "experience",
            "required": true,
            "description": "運送の会社に入って、荷物がどう運ばれているかをまず知るよ。"
          },
          {
            "stage": "配車担当へのステップアップ",
            "requirementType": "experience",
            "required": true,
            "description": "経験を積むと、どのトラックがいつどこに行くかを考える係を任されるようになるよ。"
          }
        ]
      }
    ],
    "alternatives": "貨物自動車運送事業法上の「｜運行管理者《うんこうかんりしゃ》」資格（｜国家資格《こっかしかく》）を取得すると、法令上必置とされる運行管理業務にも携われるようになり、配車業務でも評価されやすい（ただし配車担当そのものの必須資格ではない）。",
    "canStartLater": true,
    "importantNotes": "配車担当そのものに義務付けられた｜国家資格《こっかしかく》はない。ただし、一定台数以上のトラックを持つ営業所では「｜運行管理者《うんこうかんりしゃ》」の選任が法律で義務付けられており、混同しないよう注意が必要。",
    "factSources": [
      "エラン 物流業界で働く上で役に立つ資格とは https://www.elan-jp.com/zukan/logistics_qualification.htm",
      "GOジョブ 運送業への転職完全ガイド https://gojob.go.goinc.jp/useful/driver_tensyoku/"
    ],
    "lastVerified": "2026-09-04"
  },
  "waste-collector": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "ごみ収集作業員（積み込み担当）は、運転しないなら自動車の運転免許がなくても始められる仕事で、法律上の専門資格も不要。収集車の運転手を目指す場合は中型・大型（または準中型）自動車免許が必要になるが、未経験で助手として入り、働きながら免許を取得してステップアップする人が多い。",
    "routes": [
      {
        "routeName": "未経験からの就職ルート（助手→運転手）",
        "routeType": "未経験からのOJTルート",
        "steps": [
          {
            "stage": "中学校・高校卒業（学歴要件なし）",
            "requirementType": "education",
            "required": false,
            "description": "学校はふつうに卒業していれば大丈夫だよ。"
          },
          {
            "stage": "収集車の積み込み担当（助手）として就職",
            "requirementType": "experience",
            "required": false,
            "description": "運転しない係なら、車の免許がなくても始められるよ。"
          },
          {
            "stage": "中型・大型自動車免許の取得（運転手を目指す場合）",
            "requirementType": "license",
            "required": false,
            "description": "収集車を運転したくなったら、大きい車用の免許を取るよ。会社がお金を出してくれることもあるよ。"
          },
          {
            "stage": "産業廃棄物収集運搬業関連の資格（キャリアアップ時、任意）",
            "requirementType": "training",
            "required": false,
            "description": "もっといろんな仕事を任されたいときに取るとよい資格もあるよ（必須ではないよ）。"
          }
        ]
      }
    ],
    "alternatives": "自治体職員（公務員）としてごみ収集業務に携わる道もあり、その場合は自治体の採用試験を受ける必要がある。",
    "canStartLater": true,
    "importantNotes": "ごみ収集自体に学歴・専門資格の壁はほぼない。必要になるのは運転手になる段階での自動車運転免許の区分のみで、これは働きながら取得するのが一般的。",
    "factSources": [
      "職業情報提供サイト（job tag）厚生労働省 ごみ収集作業員 https://shigoto.mhlw.go.jp/User/Occupation/Detail/494",
      "運転ドットコム ゴミ収集車の運転手の平均年収・必要な免許 https://wnten.com/column/230",
      "ドライブX ゴミ収集は公務員の仕事？応募条件から給与まで https://drive-x.jp/column/garbage-collection-civilservant"
    ],
    "lastVerified": "2026-09-04"
  },
  "incinerator-operator": {
    "qualificationRequired": false,
    "qualificationName": "｜廃棄物処理施設技術管理者《はいきぶつしょりしせつぎじゅつかんりしゃ》（施設単位での選任義務。運転員全員が保有する必須資格ではない）",
    "pathSummary": "清掃工場（ごみ焼却施設）の運転員そのものになるための必須資格は法律上存在しないが、廃棄物処理法第21条により、施設ごとに「｜廃棄物処理施設技術管理者《はいきぶつしょりしせつぎじゅつかんりしゃ》」を1名以上置くことが自治体・運営事業者に義務付けられている。未経験からOJTで運転業務に就き、経験を積んでからこの資格を取得してキャリアアップするのが一般的な道。",
    "routes": [
      {
        "routeName": "未経験就職→現場経験→技術管理者資格取得ルート",
        "routeType": "実務経験＋国家資格ルート",
        "steps": [
          {
            "stage": "高校（工業系だと有利だが必須ではない）",
            "requirementType": "education",
            "required": false,
            "description": "理科や機械が好きだと役に立つけど、必ずその勉強をしていないとダメではないよ。"
          },
          {
            "stage": "清掃工場（焼却施設）の運転管理会社・自治体委託事業者に就職",
            "requirementType": "experience",
            "required": true,
            "description": "焼却炉を動かす仕事は、最初は先輩に教えてもらいながら覚えていくよ。"
          },
          {
            "stage": "｜廃棄物処理施設技術管理者《はいきぶつしょりしせつぎじゅつかんりしゃ》講習（｜実務経験《じつむけいけん》を積んだ担当者が取得）",
            "requirementType": "license",
            "required": false,
            "description": "施設全体には、専門の資格を持った責任者を1人以上置かないといけない決まりがあるよ。長く働いて詳しくなった人がこの資格を取ることが多いよ。"
          }
        ]
      }
    ],
    "alternatives": "自治体職員（技術系公務員）として清掃工場の運営・管理に携わる道もある。",
    "canStartLater": true,
    "importantNotes": "『焼却炉を動かす人は全員｜国家資格《こっかしかく》が必要』という誤解をしないよう注意。｜廃棄物処理施設技術管理者《はいきぶつしょりしせつぎじゅつかんりしゃ》は独立した｜国家試験《こっかしけん》に合格して得る免許ではなく、廃棄物処理法施行規則第17条が定める複数の資格要件（｜技術士《ぎじゅつし》等の資格＋｜実務経験《じつむけいけん》、環境衛生指導員としての経歴、学歴＋｜実務経験《じつむけいけん》、10年以上の｜実務経験《じつむけいけん》、認定講習の修了など）のいずれかを満たせば選任できる『選任職』。法律が義務付けているのは施設単位での技術管理者の設置であり、現場の日常運転業務自体は無資格からのOJTで始められる。",
    "factSources": [
      "e-Gov法令検索 廃棄物の処理及び清掃に関する法律第21条",
      "一般財団法人日本環境衛生センター 廃棄物処理施設技術管理者講習 https://www.jesc.or.jp/training/tabid/603/Default.aspx",
      "ja.wikipedia.org 廃棄物処理施設技術管理者 https://ja.wikipedia.org/wiki/廃棄物処理施設技術管理者"
    ],
    "lastVerified": "2026-09-04"
  },
  "env-measurer": {
    "qualificationRequired": false,
    "qualificationName": "｜公害防止管理者《こうがいぼうしかんりしゃ》（大気関係）※清掃工場では通常の選任義務は生じない（一般製造業の工場は対象になり得る）",
    "pathSummary": "清掃工場や工場の排ガスを測定・管理する業務は未経験から測定補助の実務に就き、経験を積んでキャリアアップするのが一般的。『特定工場における公害防止組織の整備に関する法律』は製造業・電気供給業・ガス供給業・熱供給業の4業種に属する工場のみを対象とし、地方公共団体が運営する清掃工場（一般廃棄物焼却施設）は原則この4業種に該当しないため、この法律に基づく大気関係｜公害防止管理者《こうがいぼうしかんりしゃ》の選任義務は通常生じない（一般の製造業の工場でばい煙排出量が基準を超える場合は義務が生じる）。自治体によっては条例で独自に類似の管理者設置を求める場合がある（例：東京都環境確保条例）。",
    "routes": [
      {
        "routeName": "就職後に資格取得するルート",
        "routeType": "実務経験＋国家資格ルート",
        "steps": [
          {
            "stage": "高校（工業・化学系だと有利だが必須ではない）",
            "requirementType": "education",
            "required": false,
            "description": "化学の勉強が好きだと役に立つけど、必ず必要というわけではないよ。"
          },
          {
            "stage": "清掃工場・工場の環境管理部門、または計量証明事業者に就職",
            "requirementType": "experience",
            "required": true,
            "description": "空気のきれいさを測る仕事は、まず現場で仕事をしながら覚えていくよ。"
          },
          {
            "stage": "｜公害防止管理者《こうがいぼうしかんりしゃ》（大気関係）｜国家試験《こっかしけん》または資格認定講習",
            "requirementType": "license",
            "required": false,
            "description": "清掃工場では、この資格を持つ人を必ず置く国の決まりは通常ないよ。ふつうの工場では、排出する煙の量によっては必要になることがあるよ。"
          }
        ]
      }
    ],
    "alternatives": "計量士（環境計量士）などの関連資格を取得し、外部の計量証明事業者として排ガス測定業務に携わる道もある。",
    "canStartLater": true,
    "importantNotes": "『｜公害防止管理者《こうがいぼうしかんりしゃ》』は製造業・電気供給業・ガス供給業・熱供給業の4業種の工場に適用される制度で、地方公共団体の清掃工場は原則対象外。計量証明事業で中心となる『環境計量士』とは別の資格である点にも注意。",
    "factSources": [
      "環境省 公害防止管理者法の概要 https://www.env.go.jp/air/info/pp_kentou/pem01/ref01.pdf",
      "一般社団法人産業環境管理協会 公害発生施設の区分と選任資格者 https://www.jemai.or.jp/polconman/dd4ht300000005e4-att/pol_license_about.pdf",
      "大阪市 公害防止管理者制度のあらまし https://www.city.osaka.lg.jp/kankyo/cmsfiles/contents/0000060/60623/aramashi_02.pdf"
    ],
    "lastVerified": "2026-09-04"
  },
  "landfill-manager": {
    "qualificationRequired": true,
    "qualificationName": "｜廃棄物処理施設技術管理者《はいきぶつしょりしせつぎじゅつかんりしゃ》（施設への配置が法律で義務づけられている技術管理者の資格要件）",
    "pathSummary": "最終処分場（埋立処分場）の管理者になるには、廃棄物処理法に基づき施設ごとに「｜廃棄物処理施設技術管理者《はいきぶつしょりしせつぎじゅつかんりしゃ》」を置くことが法律で義務付けられている。まず現場の｜実務経験《じつむけいけん》を積んだうえで、講習の受講・修了試験合格などにより資格を取得するのが一般的な道。",
    "routes": [
      {
        "routeName": "実務経験→技術管理者資格取得ルート",
        "routeType": "実務経験＋国家資格ルート",
        "steps": [
          {
            "stage": "高校・専門学校（土木・環境系だと有利だが必須ではない）",
            "requirementType": "education",
            "required": false,
            "description": "土や環境の勉強が好きだと役に立つけど、必ず必要というわけではないよ。"
          },
          {
            "stage": "最終処分場の運営事業者・自治体委託会社に就職",
            "requirementType": "experience",
            "required": true,
            "description": "ごみを最後に埋める場所を管理する仕事は、最初は先輩に教わりながら覚えるよ。"
          },
          {
            "stage": "｜廃棄物処理施設技術管理者《はいきぶつしょりしせつぎじゅつかんりしゃ》講習（最終処分場コース）",
            "requirementType": "license",
            "required": false,
            "description": "最終処分場の管理責任者になるには、専門の講習を受けて資格をとる道が代表的だけど、ほかの資格や経験で認められる道もあるよ。"
          }
        ]
      }
    ],
    "alternatives": "自治体職員（技術系公務員）として最終処分場の運営・監督に携わる道もある。",
    "canStartLater": true,
    "importantNotes": "『焼却炉』でも『最終処分場』でも、法律上の資格名称は一律『｜廃棄物処理施設技術管理者《はいきぶつしょりしせつぎじゅつかんりしゃ》』であり、『最終処分場コース』という名称は日本環境衛生センター等の講習実施団体が独自に付けた講習コース名であって、法令上の正式な資格名ではない。管理者としてこの資格が必須である一方、処分場での日常的な現場作業員全員がこの資格を持つ必要はない。管理者になる段階で取得するのが実態に近い。",
    "factSources": [
      "国立環境研究所 最終処分場 https://www.nies.go.jp/landfill_survey/waste/final-disposal/index.html",
      "一般財団法人日本環境衛生センター 廃棄物処理施設技術管理者講習 https://www.jesc.or.jp/Portals/0/images/training/pdf/haikibutsu_bosyu_youkou.pdf",
      "一般社団法人廃棄物処理施設技術管理協会 廃棄物処理施設の技術管理者に関する実態調査報告書 https://jaem.or.jp/cms/wp-content/uploads/2019/08/jittaichousa-houkokusho_1402.pdf"
    ],
    "lastVerified": "2026-09-04"
  },
  "park-design": {
    "qualificationRequired": false,
    "qualificationName": "（施工管理の立場を担う場合のみ）｜造園施工管理技士《ぞうえんせこうかんりぎし》 1級・2級",
    "pathSummary": "「公園の暑さ対策を考える仕事」は一つの資格・一つの職業名では説明できず、自治体の公園計画担当、造園設計者、植栽・工事の現場責任者など複数の立場の総称。工事の施工管理を担う場合にのみ｜国家資格《こっかしかく》（｜造園施工管理技士《ぞうえんせこうかんりぎし》）が関係する。",
    "routes": [
      {
        "routeName": "造園・ランドスケープ設計者ルート",
        "routeType": "教育（大学・専門学校）＋実務経験ルート",
        "steps": [
          {
            "stage": "高校",
            "requirementType": "education",
            "required": false,
            "description": "とくに決まったコースはないよ。ふつうの高校からでも目指せる。"
          },
          {
            "stage": "大学・専門学校",
            "requirementType": "education",
            "required": false,
            "description": "植物や公園づくりを勉強できる学校で学ぶ人が多いけど、絶対条件ではないよ。"
          },
          {
            "stage": "｜実務経験《じつむけいけん》・就職",
            "requirementType": "experience",
            "required": true,
            "description": "会社に入って、実際に公園をつくる仕事をしながら覚えていくよ。"
          },
          {
            "stage": "資格試験（施工管理を担当する場合）",
            "requirementType": "license",
            "required": false,
            "description": "工事現場のリーダーになるときだけ必要な国の資格があるよ。公園づくりに関わる人みんなが持っているわけじゃないよ。"
          }
        ]
      },
      {
        "routeName": "自治体職員（公園計画担当）ルート",
        "routeType": "公務員試験ルート",
        "steps": [
          {
            "stage": "大学・専門学校",
            "requirementType": "education",
            "required": false,
            "description": "まちの仕事をする公務員試験に受かれば、いろいろな学部からなれるよ。"
          },
          {
            "stage": "公務員試験",
            "requirementType": "exam",
            "required": true,
            "description": "市役所や県庁の試験に合格して、公園を担当する部署に入るよ。"
          }
        ]
      }
    ],
    "alternatives": "植栽・剪定などの現場作業員として未経験から入り、｜実務経験《じつむけいけん》を積みながら専門知識を身につける道もある（民間資格の造園技能士などを後から取る人もいる）。",
    "canStartLater": true,
    "importantNotes": "「｜造園施工管理技士《ぞうえんせこうかんりぎし》」は工事現場の責任者になるために関係する｜国家資格《こっかしかく》で、公園づくりに関わる人全員に必須ではない。計画・設計・植栽・評価など役割によって必要なものは異なる。今すぐ進路を決める必要はない。",
    "factSources": [
      "国土交通省 総合政策局「監理技術者又は主任技術者となり得る国家資格等」https://www.mlit.go.jp/totikensangyo/const/content/001619998.pdf",
      "国土交通省中国地方整備局「監理技術者又は主任技術者となり得る国家資格等」https://www.cbr.mlit.go.jp/kensei/info/qa/pdf/R0312/R0312_shiryo_02_shikaku.pdf",
      "造園施工管理技士 - Wikipedia https://ja.wikipedia.org/wiki/造園施工管理技士",
      "厚生労働省 職業情報提供サイト（job tag）https://shigoto.mhlw.go.jp/"
    ],
    "lastVerified": "2026-09-04"
  },
  "power-ops": {
    "qualificationRequired": false,
    "qualificationName": "（保安監督の立場を担う場合のみ）｜電気主任技術者《でんきしゅにんぎじゅつしゃ》（電験一種〜三種）",
    "pathSummary": "「電力の需給・系統運用に関わる仕事」も複数の役割の総称（需要予測、発電所運転、送配電設備の保守、需給調整）。電気設備の保安監督者として法律上必ず選任しなければならないのが｜電気主任技術者《でんきしゅにんぎじゅつしゃ》（｜国家資格《こっかしかく》）だが、需要予測や需給バランスを見る業務そのものに全員がこの資格を必要とするわけではない。",
    "routes": [
      {
        "routeName": "電力会社・電力広域機関の需給調整・系統運用担当ルート",
        "routeType": "教育（大学・高専）＋企業内育成ルート",
        "steps": [
          {
            "stage": "高校",
            "requirementType": "education",
            "required": false,
            "description": "決まったコースはないよ。"
          },
          {
            "stage": "大学・高専",
            "requirementType": "education",
            "required": false,
            "description": "電気を勉強した人が多いけど、それだけがルートじゃないよ。"
          },
          {
            "stage": "就職・企業内研修",
            "requirementType": "experience",
            "required": true,
            "description": "会社に入ってから、電気の需要と供給を合わせる仕事を教わっていくよ。"
          }
        ]
      },
      {
        "routeName": "電気主任技術者（保安監督者）ルート",
        "routeType": "国家資格ルート（電気設備の保安を法律上監督する立場）",
        "steps": [
          {
            "stage": "資格試験または認定校卒業",
            "requirementType": "license",
            "required": true,
            "description": "電気の設備を安全に見守るための国の資格だよ。試験に受かるか、認められた学校で勉強して取るよ。"
          }
        ]
      }
    ],
    "alternatives": "発電所の運転員、送配電設備の保守員なども、それぞれ異なる採用ルート・社内研修がある。",
    "canStartLater": true,
    "importantNotes": "｜電気主任技術者《でんきしゅにんぎじゅつしゃ》は「電気設備の保安監督」という特定の法律上の役割に必要な｜国家資格《こっかしかく》であり、需要予測や系統運用の業務全体に全員が必要というわけではない。混同しないよう注意。",
    "factSources": [
      "経済産業省「電気主任技術者」https://www.meti.go.jp/information/license/c_text25.html",
      "関東東北産業保安監督部「国家資格の申請手続き（電気保安関係）」https://www.safety-kanto.meti.go.jp/electric/e_sikaku.html",
      "一般財団法人電気技術者試験センター「電気主任技術者の資格概要」https://www.shiken.or.jp/chief/about/",
      "厚生労働省 職業情報提供サイト（job tag）https://shigoto.mhlw.go.jp/"
    ],
    "lastVerified": "2026-09-04"
  },
  "site-safety": {
    "qualificationRequired": false,
    "qualificationName": "（現場の主任技術者・監理技術者になる場合）｜土木施工管理技士《どぼくせこうかんりぎし》／｜建築施工管理技士《けんちくせこうかんりぎし》 1級・2級",
    "pathSummary": "工事現場の安全・工程管理（施工管理）を行う仕事。一定規模以上の工事現場では、建設業法により｜国家資格《こっかしかく》をもつ主任技術者・監理技術者を配置する義務があるが、経験を積みながら資格を取る人が多く、未経験からでも現場で働き始めることはできる。",
    "routes": [
      {
        "routeName": "国家資格ルート（主任技術者・監理技術者）",
        "routeType": "国家資格必須ルート（一定規模以上の現場責任者になる場合）",
        "steps": [
          {
            "stage": "高校",
            "requirementType": "education",
            "required": false,
            "description": "建築や土木を教える高校でも、ふつうの高校でも道はあるよ。"
          },
          {
            "stage": "大学・専門学校",
            "requirementType": "education",
            "required": false,
            "description": "専門的に学ぶと、資格試験を受けるまでの年数が短くなることがあるよ。"
          },
          {
            "stage": "｜実務経験《じつむけいけん》",
            "requirementType": "experience",
            "required": true,
            "description": "会社に入って、実際の工事現場で経験を積むよ。"
          },
          {
            "stage": "資格試験",
            "requirementType": "license",
            "required": true,
            "description": "工事現場のリーダーになるための国の試験だよ。大きな工事では、この資格を持つ人を必ず置かないといけないルールがあるよ。"
          }
        ]
      },
      {
        "routeName": "未経験からのOJTルート",
        "routeType": "実務経験ルート",
        "steps": [
          {
            "stage": "就職",
            "requirementType": "experience",
            "required": true,
            "description": "資格がなくても、まず現場で働きながら覚えていく人がたくさんいるよ。"
          }
        ]
      }
    ],
    "alternatives": "小規模な工事では｜国家資格《こっかしかく》をもつ技術者の配置義務がない場合もあり、経験だけで現場を担当することもある。",
    "canStartLater": true,
    "importantNotes": "｜国家資格《こっかしかく》（施工管理技士）が法律上必要になるのは、一定金額以上の工事現場に置く主任技術者・監理技術者という特定の役割。工事現場で働く人全員がこの資格を持っているわけではない。",
    "factSources": [
      "国土交通省「特定建設業の営業所専任技術者（又は監理技術者）となり得る国家資格」https://www.mlit.go.jp/totikensangyo/const/content/001619998.pdf",
      "国土交通省中国地方整備局「監理技術者又は主任技術者となり得る国家資格等」https://www.cbr.mlit.go.jp/kensei/info/qa/pdf/R0312/R0312_shiryo_02_shikaku.pdf",
      "厚生労働省 職業情報提供サイト（job tag）https://shigoto.mhlw.go.jp/"
    ],
    "lastVerified": "2026-09-04"
  },
  "water-ops": {
    "qualificationRequired": false,
    "qualificationName": "（役割により）ダム｜管理主任技術者《かんりしゅにんぎじゅつしゃ》／｜水道技術管理者《すいどうぎじゅつかんりしゃ》 など",
    "pathSummary": "「水資源の管理・調整」はダム管理者、水道事業者、土地改良区（農業用水）、自治体・国の担当など複数の立場の総称。それぞれ関わる法律・資格が異なり、全員に共通の一つの｜国家資格《こっかしかく》があるわけではない。",
    "routes": [
      {
        "routeName": "水道事業者（水道局など）ルート",
        "routeType": "国家資格必須ルート（水道技術管理者は法律上必置）",
        "steps": [
          {
            "stage": "大学・専門学校",
            "requirementType": "education",
            "required": false,
            "description": "水や土木のことを学ぶ人が多いけど、それだけが道じゃないよ。"
          },
          {
            "stage": "就職（水道局・水道事業者）",
            "requirementType": "experience",
            "required": true,
            "description": "水道を届ける会社や役所に入って、仕事を覚えていくよ。"
          },
          {
            "stage": "｜水道技術管理者《すいどうぎじゅつかんりしゃ》の選任",
            "requirementType": "license",
            "required": true,
            "description": "水道を安全に管理する責任者を必ず置くという国のルールがあるよ。でも、水道の仕事をする人みんなが持つ資格ではないよ。"
          }
        ]
      },
      {
        "routeName": "ダム管理・河川管理ルート",
        "routeType": "実務経験＋資格ルート（対象により異なる）",
        "steps": [
          {
            "stage": "大学",
            "requirementType": "education",
            "required": false,
            "description": "土木を勉強する人が多いけど、試験に受かればなれるよ。"
          },
          {
            "stage": "就職（水資源機構・国・自治体など）",
            "requirementType": "experience",
            "required": true,
            "description": "ダムや川を管理する国や公的な機関に入るよ。"
          },
          {
            "stage": "ダム｜管理主任技術者《かんりしゅにんぎじゅつしゃ》（該当する場合）",
            "requirementType": "license",
            "required": false,
            "description": "大きなダムでは管理の責任者を決めるルールがあるけど、みんなが持つ資格ではないよ。"
          }
        ]
      },
      {
        "routeName": "農業用水（土地改良区）ルート",
        "routeType": "実務経験ルート",
        "steps": [
          {
            "stage": "就職",
            "requirementType": "experience",
            "required": true,
            "description": "農業用の水を管理する組織に入って、仕事をしながら覚えるよ。"
          }
        ]
      }
    ],
    "alternatives": "自治体・国の水行政担当は公務員試験ルートで、学部を問わず採用されることもある。",
    "canStartLater": true,
    "importantNotes": "「水資源管理」に関わる仕事は立場によって関係法令・資格が大きく異なる。｜水道技術管理者《すいどうぎじゅつかんりしゃ》は水道事業者に必置だが、これは水関係の仕事全般に必須の資格ではない点に注意。",
    "factSources": [
      "国土交通省「水道技術管理者について」https://www.mlit.go.jp/mizukokudo/watersupply/stf_seisakunitsuite_bunya_kenkou_iryou_kenkou_suido_kanrisya_index.html",
      "ダム管理主任技術者 - Wikipedia https://ja.wikipedia.org/wiki/ダム管理主任技術者",
      "独立行政法人水資源機構「職種紹介」https://www.water.go.jp/honsya/honsya/recruit/works/index.html",
      "経済産業省「ダム水路主任技術者」https://www.meti.go.jp/information/license/c_text22.html"
    ],
    "lastVerified": "2026-09-04"
  },
  "urban-heat": {
    "qualificationRequired": false,
    "qualificationName": "（コンサルタント業務等で評価されることが多い）｜技術士《ぎじゅつし》（建設部門：都市及び地方計画）",
    "pathSummary": "都市の暑さを分析し街づくりを考える仕事は、自治体職員、気象・環境データの分析者、研究者、建築・ランドスケープ設計者などの総称。都市計画コンサルタント業務では｜技術士《ぎじゅつし》（建設部門）などの資格が評価されることが多いが、必ずしも全員に必須ではない。",
    "routes": [
      {
        "routeName": "自治体職員（都市計画・環境部門）ルート",
        "routeType": "公務員試験ルート",
        "steps": [
          {
            "stage": "大学",
            "requirementType": "education",
            "required": false,
            "description": "まちづくりを勉強する人が多いけど、試験に受かればいろいろな学部からなれるよ。"
          },
          {
            "stage": "公務員試験",
            "requirementType": "exam",
            "required": true,
            "description": "市役所や県庁の試験に合格してまちづくりの部署に入るよ。"
          }
        ]
      },
      {
        "routeName": "都市計画コンサルタント・技術士ルート",
        "routeType": "実務経験＋国家資格ルート",
        "steps": [
          {
            "stage": "大学・大学院",
            "requirementType": "education",
            "required": false,
            "description": "まちづくりの勉強をする人が多いよ。"
          },
          {
            "stage": "就職・｜実務経験《じつむけいけん》",
            "requirementType": "experience",
            "required": true,
            "description": "まちづくりの会社に入って経験を積むよ。"
          },
          {
            "stage": "｜技術士《ぎじゅつし》試験（該当する場合）",
            "requirementType": "license",
            "required": false,
            "description": "まちづくりの専門家として認められる国の資格があるけど、仕事によって必要かどうかが違うよ。"
          }
        ]
      },
      {
        "routeName": "研究者・データ分析ルート",
        "routeType": "教育（大学院）ルート",
        "steps": [
          {
            "stage": "大学院",
            "requirementType": "education",
            "required": false,
            "description": "大学院でもっと詳しく研究して、研究者になる道もあるよ。"
          }
        ]
      }
    ],
    "alternatives": "GISやデータ分析のスキルを独学・専門学校で身につけ、環境コンサルタント会社に就く道もある。",
    "canStartLater": true,
    "importantNotes": "｜技術士《ぎじゅつし》は取得が難しい資格で、｜実務経験《じつむけいけん》を積んだ大人が挑戦することが多い。子どものうちに「取らなければ」と焦る必要はない。",
    "factSources": [
      "公益社団法人日本都市計画学会「認定都市プランナー制度」https://www.cpij.or.jp/com/coop/planner.html",
      "一般社団法人都市計画コンサルタント協会 制度創設の経緯 http://www.cpij.or.jp/com/gp/upload/file/overview201601.pdf",
      "厚生労働省 職業情報提供サイト（job tag）https://shigoto.mhlw.go.jp/"
    ],
    "lastVerified": "2026-09-04"
  },
  "studio-qa": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "ゲームのQAテスター（品質チェック）には｜国家資格《こっかしかく》・必須の学歴はなく、専門学校・大学・独学のいずれからでもゲーム会社やQA専門会社に就職して始められる仕事。",
    "routes": [
      {
        "routeName": "専門学校ルート",
        "routeType": "教育ルート",
        "steps": [
          {
            "stage": "高校",
            "requirementType": "education",
            "required": false,
            "description": "どんな高校からでも目指せるよ。"
          },
          {
            "stage": "専門学校",
            "requirementType": "education",
            "required": false,
            "description": "ゲームの学校で学ぶ人もいるけど、絶対ではないよ。"
          },
          {
            "stage": "就職",
            "requirementType": "experience",
            "required": true,
            "description": "会社に入って、実際にゲームのテストをしながら覚えていくよ。"
          }
        ]
      },
      {
        "routeName": "未経験からのOJTルート",
        "routeType": "実務経験ルート",
        "steps": [
          {
            "stage": "アルバイト・契約社員として就職",
            "requirementType": "experience",
            "required": true,
            "description": "未経験でも入れる会社が多くて、働きながら覚えられるよ。"
          }
        ]
      }
    ],
    "alternatives": "大学（情報系など）でプログラミングやテスト理論を学んでから就く人もいる。",
    "canStartLater": true,
    "importantNotes": "資格や特定の学歴を今から決める必要はない。ゲームを注意深く観察し、気づいたことを言葉で説明する練習が役立つと言われている。",
    "factSources": [
      "一般社団法人コンピュータエンターテインメント協会（CESA）「ゲーム開発者の就業とキャリア形成2023」https://www.cesa.or.jp/uploads/2024/info20240315.pdf",
      "OCA大阪デザイン&ITテクノロジー専門学校「ゲームプランナーになるには」https://www.oca.ac.jp/work_books/4410/（QA・関連職種の一般的な入職ルートの参考として）"
    ],
    "lastVerified": "2026-09-04"
  },
  "studio-planner": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "ゲームプランナー（難易度調整など）には｜国家資格《こっかしかく》は不要。大学・専門学校・独学のいずれからでもゲーム会社に就職して始められ、｜実務経験《じつむけいけん》の中でスキルを積んでいく仕事。",
    "routes": [
      {
        "routeName": "専門学校・大学ルート",
        "routeType": "教育ルート",
        "steps": [
          {
            "stage": "高校",
            "requirementType": "education",
            "required": false,
            "description": "どんな高校からでも目指せるよ。"
          },
          {
            "stage": "専門学校・大学",
            "requirementType": "education",
            "required": false,
            "description": "専門学校でも大学でも、それぞれ違う良さがあって、どちらからでもなれるよ。"
          },
          {
            "stage": "就職",
            "requirementType": "experience",
            "required": true,
            "description": "会社に入って、実際にゲームの企画や調整をしながら学んでいくよ。"
          }
        ]
      },
      {
        "routeName": "独学・自主制作ルート",
        "routeType": "未経験からのOJTルート",
        "steps": [
          {
            "stage": "自主制作・ポートフォリオ作成",
            "requirementType": "training",
            "required": false,
            "description": "自分で小さいゲームを企画してみて、それを見せて就職する人もいるよ。"
          },
          {
            "stage": "就職",
            "requirementType": "experience",
            "required": true,
            "description": "経験がなくても、やる気や作った物を見て採用してもらえることもあるよ。"
          }
        ]
      }
    ],
    "alternatives": "プログラマーやデザイナーから企画職に異動してプランナーになる人もいる。",
    "canStartLater": true,
    "importantNotes": "資格は不要で、進路も一つに決まっていない。「悔しい、もう1回」と思わせる仕組みを考えるのが好き、という気持ちを大事にすればよい。",
    "factSources": [
      "一般社団法人コンピュータエンターテインメント協会（CESA）「ゲーム開発者の就業とキャリア形成2023」https://www.cesa.or.jp/uploads/2024/info20240315.pdf",
      "松陰高等学校（通信制高校）「ゲームプランナーになるには？大学・未経験からの道筋」https://sho-in.ed.jp/column/2249/"
    ],
    "lastVerified": "2026-09-04"
  },
  "studio-ui": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "ゲームのUIデザイナー（画面・操作設計）には｜国家資格《こっかしかく》は不要。専門学校・大学・独学のいずれからでも道があり、色彩検定やAdobe認定資格などの民間資格はスキルアップの参考になる程度。",
    "routes": [
      {
        "routeName": "専門学校・大学ルート",
        "routeType": "教育ルート",
        "steps": [
          {
            "stage": "高校",
            "requirementType": "education",
            "required": false,
            "description": "どんな高校からでも目指せるよ。"
          },
          {
            "stage": "専門学校・大学",
            "requirementType": "education",
            "required": false,
            "description": "デザインを学ぶ学校に行く人が多いけど、それだけが道じゃないよ。"
          },
          {
            "stage": "就職",
            "requirementType": "experience",
            "required": true,
            "description": "会社に入って、実際に画面をデザインしながら学んでいくよ。"
          }
        ]
      },
      {
        "routeName": "独学ルート",
        "routeType": "未経験からのOJTルート",
        "steps": [
          {
            "stage": "独学・ポートフォリオ作成",
            "requirementType": "training",
            "required": false,
            "description": "自分でデザインの練習をして、作った物を見せて就職する道もあるよ。"
          }
        ]
      }
    ],
    "alternatives": "色彩検定・Webデザイン系の民間資格を取ってスキルを示す人もいるが、いずれも任意。",
    "canStartLater": true,
    "importantNotes": "｜国家資格《こっかしかく》は不要。「まちがえない画面」を考えるのが好きという気持ちが土台になる仕事。",
    "factSources": [
      "アミューズメントメディア総合学院「UIデザイナー専門の学校」https://www.amgakuin.co.jp/contents/game-sogo/ui",
      "TECH.C.東京デザインテクノロジーセンター専門学校「UIデザイナー」https://www.tech.ac.jp/work_books/ui-designer/"
    ],
    "lastVerified": "2026-09-04"
  },
  "library-reference": {
    "qualificationRequired": false,
    "qualificationName": "｜司書《ししょ》（｜国家資格《こっかしかく》ではなく、図書館法に基づく資格）",
    "pathSummary": "公共図書館で本の選定・分類・レファレンス（調べもの支援）を行う専門的職員である｜司書《ししょ》は、図書館法第5条に基づく資格。｜国家資格《こっかしかく》ではなく、大学での｜司書《ししょ》養成科目の履修や｜司書講習《ししょこうしゅう》の修了などで取得できる。",
    "routes": [
      {
        "routeName": "大学で司書資格科目を履修するルート",
        "routeType": "教育ルート（図書館法に基づく資格）",
        "steps": [
          {
            "stage": "高校",
            "requirementType": "education",
            "required": false,
            "description": "どんな高校からでも目指せるよ。"
          },
          {
            "stage": "大学（｜司書《ししょ》課程のある大学）",
            "requirementType": "education",
            "required": true,
            "description": "大学で図書館のことを学ぶ授業をとって卒業すると、｜司書《ししょ》の資格がもらえるよ。"
          }
        ]
      },
      {
        "routeName": "司書講習を受講するルート",
        "routeType": "教育ルート（大学卒業後・短期集中）",
        "steps": [
          {
            "stage": "大学・短期大学（学部不問）を卒業",
            "requirementType": "education",
            "required": true,
            "description": "図書館の授業がない大学を出た人でも、あとから講習を受ければ資格が取れるよ。"
          },
          {
            "stage": "｜司書講習《ししょこうしゅう》の受講",
            "requirementType": "training",
            "required": true,
            "description": "夏休みなどに開かれる集中講座を受けて、必要な勉強をするよ。"
          }
        ]
      },
      {
        "routeName": "実務経験＋司書講習ルート（司書補から）",
        "routeType": "実務経験ルート",
        "steps": [
          {
            "stage": "｜司書《ししょ》補として｜実務経験《じつむけいけん》を積む",
            "requirementType": "experience",
            "required": true,
            "description": "図書館で｜司書《ししょ》のお手伝いとして3年以上働くと、｜司書《ししょ》になるための講習を受けられるようになるよ。"
          }
        ]
      }
    ],
    "alternatives": "郷土資料の調査など専門性の高い分野は、｜司書《ししょ》資格に加えて｜実務経験《じつむけいけん》や独自の調べもの経験が重視されることが多い。",
    "canStartLater": true,
    "importantNotes": "｜司書《ししょ》は「図書館法」に基づく資格であり、｜国家資格《こっかしかく》ではない（｜司書《ししょ》という試験に国が合否を出す仕組みではなく、大学での単位取得・講習修了で得られる）。「｜国家資格《こっかしかく》」と紹介する記事も一部にあるが、文部科学省・日本図書館協会の説明では｜国家資格《こっかしかく》という表現は使われていない。取得ルートが複数あり、大学卒業後に進路変更してもなれるので、今すぐ決める必要はない。",
    "factSources": [
      "文部科学省「司書について」https://www.mext.go.jp/a_menu/shougai/gakugei/shisyo/index.htm",
      "公益社団法人日本図書館協会「司書（補）資格の取得方法」https://www.jla.or.jp/how_to_obtain_a_librarian_qualification/",
      "厚生労働省 職業情報提供サイト（job tag）https://shigoto.mhlw.go.jp/（司書の職業情報ページ）"
    ],
    "lastVerified": "2026-09-04"
  },
  "library-conservator": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "図書館資料の保存・修復を担当する仕事には、｜国家資格《こっかしかく》も業界共通の必須資格もない。｜司書《ししょ》資格を持つ図書館員が兼務することが多いが、専門の民間研修や｜実務経験《じつむけいけん》を通じて技能を身につける場合もある。",
    "routes": [
      {
        "routeName": "司書資格＋資料保存の実務・研修ルート",
        "routeType": "教育＋実務経験ルート",
        "steps": [
          {
            "stage": "大学（｜司書《ししょ》課程）",
            "requirementType": "education",
            "required": false,
            "description": "｜司書《ししょ》の資格を持って図書館に入り、そこで資料を守る係になる人が多いよ。"
          },
          {
            "stage": "図書館・資料保存機関への就職",
            "requirementType": "experience",
            "required": true,
            "description": "図書館や資料館に入って、資料を大切に扱う方法を仕事の中で覚えるよ。"
          },
          {
            "stage": "専門研修・講習会",
            "requirementType": "training",
            "required": false,
            "description": "資料を直したり守ったりするやり方を教えてくれる講座があるよ。"
          }
        ]
      },
      {
        "routeName": "美術・工芸系の修復技術ルート",
        "routeType": "教育ルート（文化財保存系）",
        "steps": [
          {
            "stage": "大学・専門学校（文化財保存修復系）",
            "requirementType": "education",
            "required": false,
            "description": "紙や本を直す専門の技術を学べる学校もあるよ。"
          }
        ]
      }
    ],
    "alternatives": "民間の製本・修復工房で経験を積んでから図書館の資料保存部門に転職する人もいる。",
    "canStartLater": true,
    "importantNotes": "「資料保存・修復」を認定する統一の｜国家資格《こっかしかく》・必須資格は存在しない。「直さない」という判断も含めて、経験と知識の積み重ねが重視される仕事。",
    "factSources": [
      "公益社団法人日本図書館協会 資料保存委員会「やってみよう資料保存～資料保存入門～」https://www.jla.or.jp/wp/wp-content/uploads/2025/04/やってみよう資料保存.pdf",
      "専門図書館協議会「資料保存コーナー」https://jsla.or.jp/preservation/"
    ],
    "lastVerified": "2026-09-04"
  },
  "library-archivist": {
    "qualificationRequired": false,
    "qualificationName": "デジタルアーキビスト（民間資格。｜国家資格《こっかしかく》ではない）",
    "pathSummary": "図書館・博物館などの資料をデジタル化し保存・公開する「デジタルアーカイブ」の担当者には｜国家資格《こっかしかく》は不要。｜司書《ししょ》・学芸員の資格や情報系の知識が役立つほか、NPO法人が認定する民間資格「デジタルアーキビスト」もあるが、必須ではない。",
    "routes": [
      {
        "routeName": "司書・学芸員資格＋情報系知識ルート",
        "routeType": "教育＋実務経験ルート",
        "steps": [
          {
            "stage": "大学（｜司書《ししょ》課程・情報系学部など）",
            "requirementType": "education",
            "required": false,
            "description": "図書館やコンピューターのことを学ぶ人が多いけど、それだけが道じゃないよ。"
          },
          {
            "stage": "図書館・博物館・自治体への就職",
            "requirementType": "experience",
            "required": true,
            "description": "図書館や博物館に入って、資料をデータにする仕事を覚えていくよ。"
          }
        ]
      },
      {
        "routeName": "デジタルアーキビスト資格（民間資格）ルート",
        "routeType": "民間資格ルート（任意）",
        "steps": [
          {
            "stage": "認定養成機関での講習・単位取得",
            "requirementType": "training",
            "required": false,
            "description": "資料をデジタル化する専門家として認められる民間の資格があるよ。持っていると役立つ場面もあるけど、必ず必要というわけではないよ。"
          }
        ]
      }
    ],
    "alternatives": "IT企業でスキャン・データベース構築の技術を身につけてから、図書館・文化施設のデジタルアーカイブ担当に転職する人もいる。",
    "canStartLater": true,
    "importantNotes": "デジタルアーキビストは民間資格であり、｜国家資格《こっかしかく》ではない。持っていなくてもこの仕事に就くことはできるが、一部の公的事業では評価・要求されることがある。",
    "factSources": [
      "特定非営利活動法人日本デジタルアーキビスト資格認定機構「デジタルアーキビストとは」https://jdaa.jp/digital-archivist",
      "同機構「資格・取得方法」https://jdaa.jp/qualification",
      "内閣府NPOポータルサイト「日本デジタルアーキビスト資格認定機構」https://www.npo-homepage.go.jp/npoportal/detail/021000759"
    ],
    "lastVerified": "2026-09-04"
  },
  "cook": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "学校給食の調理員は、法律上「調理師免許」がなくても働ける求人が多い。ただし雇用形態（正社員・公務員か、パート・委託業者の従業員か）によって求められる資格や経験が変わる。",
    "routes": [
      {
        "routeName": "調理師免許なしで始めるルート（パート・委託給食会社）",
        "routeType": "未経験からのOJTルート",
        "steps": [
          {
            "stage": "中学校・高校",
            "requirementType": "education",
            "required": false,
            "description": "とくに決まった学校に行かなくても目指せる。"
          },
          {
            "stage": "採用試験・就職",
            "requirementType": "experience",
            "required": false,
            "description": "給食を作る会社にまず入って、仕事をしながら先輩に教えてもらって覚える道もある。"
          }
        ]
      },
      {
        "routeName": "調理師免許を取って正社員・公務員を目指すルート",
        "routeType": "資格取得ルート",
        "steps": [
          {
            "stage": "高校",
            "requirementType": "education",
            "required": false,
            "description": "料理の勉強ができる高校に行くと近道になることがある。"
          },
          {
            "stage": "専門学校（調理師｜養成施設《ようせいしせつ》）",
            "requirementType": "education",
            "required": false,
            "description": "料理の専門学校を卒業すると、試験を受けなくても資格をもらえる。"
          },
          {
            "stage": "資格試験（｜実務経験《じつむけいけん》ルート）",
            "requirementType": "license",
            "required": false,
            "description": "学校に行かなくても、お店で2年以上料理の仕事をすれば試験を受けられる。"
          },
          {
            "stage": "採用試験・就職",
            "requirementType": "exam",
            "required": false,
            "description": "市役所などで働く給食の調理員になるには、資格が必要なことが多い。"
          }
        ]
      }
    ],
    "alternatives": "調理師免許のほか、栄養士免許を持つ人が調理員として採用されるケースもある。委託給食会社を経由してキャリアを積み、後から調理師免許を取る人も多い。",
    "canStartLater": true,
    "importantNotes": "「給食調理員＝調理師免許が必須」というのは誤解を招きやすい。パート・委託会社勤務では免許不要な求人が多い一方、公務員や正社員では免許を求められることが多く、雇用形態で差がある点に注意。",
    "factSources": [
      "学校給食調理員になるための資格・給与・仕事内容 https://tenshoku-restaurants.com/blog/298",
      "給食調理員とは？仕事内容や必要な資格・スキルや向いている人を紹介 https://www.sendai-iken.ac.jp/contents/column/lunch_cook/",
      "調理師免許（厚生労働省 調理師制度の概要に基づく一般的知見）"
    ],
    "lastVerified": "2026-09-04"
  },
  "nutrition": {
    "qualificationRequired": true,
    "qualificationName": "｜栄養教諭《えいようきょうゆ》免許状（教育職員免許法に基づく｜教員免許《きょういんめんきょ》・都道府県教育委員会が授与）または栄養士・｜管理栄養士《かんりえいようし》資格（｜学校栄養職員《がっこうえいようしょくいん》の場合）",
    "pathSummary": "学校給食の栄養にかかわる仕事には「｜栄養教諭《えいようきょうゆ》」と「｜学校栄養職員《がっこうえいようしょくいん》」の2種類があり、両者は必要資格も役割も異なる。｜栄養教諭《えいようきょうゆ》は児童生徒に食育の授業を行える教員であり、｜栄養教諭《えいようきょうゆ》免許状（｜教員免許《きょういんめんきょ》の一種）が必要。｜学校栄養職員《がっこうえいようしょくいん》は栄養士・｜管理栄養士《かんりえいようし》として給食管理を行うのが主な職務で、集団的な食育の授業は制度上は｜栄養教諭《えいようきょうゆ》の職務とされている。",
    "routes": [
      {
        "routeName": "栄養教諭になるルート",
        "routeType": "国家資格必須ルート",
        "steps": [
          {
            "stage": "高校",
            "requirementType": "education",
            "required": false,
            "description": "決まった学校はないけれど、理科の勉強をしておくと後で役立つ。"
          },
          {
            "stage": "大学・短大（栄養士・｜管理栄養士《かんりえいようし》｜養成課程《ようせいかてい》＋教職課程）",
            "requirementType": "education",
            "required": true,
            "description": "大学や短大で栄養の勉強をしながら、先生になるための授業も受ける必要がある。"
          },
          {
            "stage": "資格試験・免許申請",
            "requirementType": "license",
            "required": true,
            "description": "勉強が終わったら、教育委員会に申請して免許をもらう。"
          },
          {
            "stage": "採用試験・就職",
            "requirementType": "exam",
            "required": true,
            "description": "先生になるための試験に合格すると、学校で働ける。"
          }
        ]
      },
      {
        "routeName": "学校栄養職員になるルート",
        "routeType": "資格取得ルート",
        "steps": [
          {
            "stage": "大学・短大（栄養士・｜管理栄養士《かんりえいようし》｜養成課程《ようせいかてい》）",
            "requirementType": "education",
            "required": true,
            "description": "栄養の勉強をする学校に行って、栄養士や｜管理栄養士《かんりえいようし》の資格を取る。"
          },
          {
            "stage": "採用試験・就職",
            "requirementType": "exam",
            "required": true,
            "description": "試験に受かると、給食のメニューを考えたり栄養を管理したりする仕事につける。"
          }
        ]
      },
      {
        "routeName": "学校栄養職員から栄養教諭へのステップアップ",
        "routeType": "実務経験ルート",
        "steps": [
          {
            "stage": "｜実務経験《じつむけいけん》＋追加科目の修得",
            "requirementType": "experience",
            "required": false,
            "description": "先に給食の栄養の仕事をしてから、あとから先生の資格を取ることもできる。"
          }
        ]
      }
    ],
    "alternatives": "｜栄養教諭《えいようきょうゆ》の配置は自治体判断のため、同じ仕事内容でも自治体によって｜栄養教諭《えいようきょうゆ》ではなく｜学校栄養職員《がっこうえいようしょくいん》が担当している場合がある。",
    "canStartLater": true,
    "importantNotes": "「｜栄養教諭《えいようきょうゆ》＝栄養士があればなれる」は誤り。｜栄養教諭《えいようきょうゆ》には｜教員免許《きょういんめんきょ》（｜栄養教諭《えいようきょうゆ》免許状）が必須で、単に栄養士・｜管理栄養士《かんりえいようし》の資格だけでは｜栄養教諭《えいようきょうゆ》にはなれない（｜学校栄養職員《がっこうえいようしょくいん》にはなれる）。",
    "factSources": [
      "学校で働く栄養士には２つの種類がある？ https://co-medical.mynavi.jp/column/nrd/school_nrd/",
      "栄養教諭の免許状の取得方法 https://co-medical.mynavi.jp/column/nrd/dnt-nrd/",
      "資料4-2 栄養教諭免許制度の概要（文部科学省・中教審資料） https://www.mext.go.jp/b_menu/shingi/chukyo/chukyo3/002/siryo/attach/1377069.htm",
      "栄養教諭 - Wikipedia https://ja.wikipedia.org/wiki/%E6%A0%84%E9%A4%8A%E6%95%99%E8%AB%AD"
    ],
    "lastVerified": "2026-09-04"
  },
  "farmer": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "農家・生産者になるために必須の資格は基本的にない。実家の農業を継ぐ、農業法人に就職する、研修を受けて独立就農するなど複数の道があり、国や自治体の「新規就農」支援制度を使う人も多い。",
    "routes": [
      {
        "routeName": "実家や地域の農業を継ぐ・手伝うルート",
        "routeType": "実務経験ルート",
        "steps": [
          {
            "stage": "中学校・高校",
            "requirementType": "education",
            "required": false,
            "description": "農業を学べる高校もあるけど、行かなくても農家になれる。"
          },
          {
            "stage": "実地での経験",
            "requirementType": "experience",
            "required": false,
            "description": "農家の仕事を手伝いながら少しずつやり方を覚える。"
          }
        ]
      },
      {
        "routeName": "農業法人に就職するルート",
        "routeType": "未経験からのOJTルート",
        "steps": [
          {
            "stage": "高校・大学・農業大学校",
            "requirementType": "education",
            "required": false,
            "description": "農業を専門に勉強できる学校もあるが、必ず行かなければいけないわけではない。"
          },
          {
            "stage": "採用・就職",
            "requirementType": "experience",
            "required": false,
            "description": "農業の会社に就職して、働きながら仕事を覚える。"
          }
        ]
      },
      {
        "routeName": "独立して新規就農するルート",
        "routeType": "研修・支援制度ルート",
        "steps": [
          {
            "stage": "研修（農業大学校・先進農家での研修等）",
            "requirementType": "training",
            "required": false,
            "description": "資格はいらないけど、独立する前に研修を受けて技術を身につける人が多い。"
          },
          {
            "stage": "認定新規就農者の申請（任意）",
            "requirementType": "license",
            "required": false,
            "description": "がんばって農業を始める人を市や町が応援してくれる仕組みがある（資格ではない）。"
          }
        ]
      }
    ],
    "alternatives": "農業関連の資格（大型特殊免許、農薬管理指導士、有機JAS認証など）は必須ではないが、扱う品目や規模によっては取っておくと有利な場合がある。",
    "canStartLater": true,
    "importantNotes": "農家になるための「免許」は存在しない。認定新規就農者制度は資格試験ではなく、支援を受けるための任意の認定制度である点に注意。",
    "factSources": [
      "認定新規就農者制度について：農林水産省 https://www.maff.go.jp/j/new_farmer/nintei_syunou.html",
      "新規就農の促進：農林水産省 https://www.maff.go.jp/j/new_farmer/index.html",
      "認定新規就農者になるための条件とは？ https://agri.mynavi.jp/2024_02_24_255164/"
    ],
    "lastVerified": "2026-09-04"
  },
  "logistics": {
    "qualificationRequired": true,
    "qualificationName": "運転免許（普通・準中型・中型・大型のいずれか。特定の資格試験に合格する必要はなく、運転する車両の車両総重量・最大積載量に応じた区分の免許を取得すればよい）",
    "pathSummary": "給食の食材をトラックで運ぶ仕事は、必ずしも大型免許が必要なわけではない。使うトラックの大きさによって必要な運転免許の種類が変わり、小型・中型の車両であれば普通免許や中型免許で始められる。",
    "routes": [
      {
        "routeName": "普通免許・中型免許から始めるルート",
        "routeType": "未経験からのOJTルート",
        "steps": [
          {
            "stage": "高校卒業後・就職",
            "requirementType": "education",
            "required": false,
            "description": "18歳になれば普通の運転免許から始められる。"
          },
          {
            "stage": "運転免許の取得",
            "requirementType": "license",
            "required": true,
            "description": "運ぶトラックの大きさに合った運転免許が必要。大きいトラックでなければ普通の免許でも運転できることがある。"
          },
          {
            "stage": "採用・就職",
            "requirementType": "experience",
            "required": false,
            "description": "会社に入ってから、運び方や道を覚えていく。免許を取るお金を助けてくれる会社もある。"
          }
        ]
      }
    ],
    "alternatives": "より大きな車両を扱う長距離輸送などにキャリアアップする場合は中型・大型免許やフォークリフト運転｜技能講習《ぎのうこうしゅう》修了証などが役立つ。",
    "canStartLater": true,
    "importantNotes": "「食材を運ぶ仕事＝大型免許が必須」というのは誤解。必要な免許は車両の大きさによって決まり、学校給食程度の配送では普通〜中型免許で対応できる場合が多い。",
    "factSources": [
      "トラックドライバーに必要な免許とは？ https://www.untenshashokuba.go.jp/archives/661",
      "食材宅配に必要な免許・資格は？ https://www.land-pilot.com/media/driver-guide-meal-kit-delivery-license",
      "ルート配送のトラック運転手は普通免許だけで大丈夫？ https://www.food-driver.net/what/driver-licence.html"
    ],
    "lastVerified": "2026-09-04"
  },
  "recycle": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "給食の食べ残しなどを堆肥や飼料に変える食品リサイクル工場の現場作業には、資格がなくても就ける求人が多い。工場によっては食品リサイクル法に基づく「登録再生利用事業者」の登録（任意の制度）を受けていることがあるが、これは会社に対する任意の制度であり、個々の作業員に免許は求められないのが一般的。",
    "routes": [
      {
        "routeName": "未経験から現場作業員になるルート",
        "routeType": "未経験からのOJTルート",
        "steps": [
          {
            "stage": "中学校・高校",
            "requirementType": "education",
            "required": false,
            "description": "とくに決まった学校はない。"
          },
          {
            "stage": "採用・就職",
            "requirementType": "experience",
            "required": false,
            "description": "工場に入ってから、機械の使い方や仕分けの仕方を教えてもらう。"
          },
          {
            "stage": "関連資格の取得（任意）",
            "requirementType": "training",
            "required": false,
            "description": "大きい機械（フォークリフト）を動かすときは、短い講習を受けて修了証をもらう必要がある。"
          }
        ]
      }
    ],
    "alternatives": "事業所全体としては『登録再生利用事業者』制度（食品リサイクル法に基づく農林水産大臣等の登録、完全に任意）があり、登録すると荷卸し地における一般廃棄物の運搬に係る業許可が不要になる、肥料関連法上の届出重複が不要になるなどのメリットが得られる。これは会社・事業所単位の任意登録であり、現場の一般作業員個人が資格を持つ必要はない。",
    "canStartLater": true,
    "importantNotes": "工場に対する法的な登録制度と、個々の作業員に必要な資格を混同しないよう注意。現場作業自体は資格不要で始められることが多い。",
    "factSources": [
      "産業廃棄物に関する資格がある！種類と取得方法を紹介 https://gooddo.jp/magazine/industrial_waste/9288/",
      "食品・飲料工場でのフォークリフト業務って何するの？ https://jobhouse.jp/factory/columns/490",
      "工場の人気職種「フォークリフト」の仕事内容・資格・給料を徹底解説 https://monozukuri-career.com/column/job-type/shokushu/forklift-job-guide/"
    ],
    "lastVerified": "2026-09-04"
  },
  "trip-planner": {
    "qualificationRequired": false,
    "qualificationName": "｜旅行業務取扱管理者《りょこうぎょうむとりあつかいかんりしゃ》（｜国家資格《こっかしかく》・営業所単位で選任義務あり）",
    "pathSummary": "旅行会社で教育旅行（修学旅行等）を企画する担当者個人に｜国家資格《こっかしかく》は必須ではないが、旅行業法により旅行会社の営業所ごとに1人以上「｜旅行業務取扱管理者《りょこうぎょうむとりあつかいかんりしゃ》」（｜国家資格《こっかしかく》）を選任することが義務付けられている。企画担当者自身がこの資格を持っていることも多いが、法律上は営業所に有資格者が1人いればよい。",
    "routes": [
      {
        "routeName": "資格なしで企画担当者として働き始めるルート",
        "routeType": "未経験からのOJTルート",
        "steps": [
          {
            "stage": "高校・大学",
            "requirementType": "education",
            "required": false,
            "description": "決まった学校はないが、地理や社会の勉強が役に立つ。"
          },
          {
            "stage": "旅行会社への就職",
            "requirementType": "experience",
            "required": false,
            "description": "旅行会社に入って、先輩と一緒に修学旅行のプランを作りながら覚える。"
          }
        ]
      },
      {
        "routeName": "旅行業務取扱管理者資格を取得するルート（キャリアアップ・営業所の選任要件対応）",
        "routeType": "国家資格ルート（個人は任意、事業所には必須）",
        "steps": [
          {
            "stage": "資格試験",
            "requirementType": "license",
            "required": false,
            "description": "国が行うテストに受かると「旅行の管理者」になれる資格がもらえる。"
          },
          {
            "stage": "営業所での選任",
            "requirementType": "license",
            "required": false,
            "description": "資格を持っていると、お店の責任者に選ばれやすくなる。"
          }
        ]
      }
    ],
    "alternatives": "資格を持たなくても教育旅行の企画・営業担当として働くことはできる。ただし会社としては必ず営業所に有資格者を置く必要があるため、資格保有者は昇進やキャリアの幅が広がりやすい。",
    "canStartLater": true,
    "importantNotes": "｜旅行業務取扱管理者《りょこうぎょうむとりあつかいかんりしゃ》は「担当者一人ひとりが必ず持つ資格」ではなく「営業所に1人以上いればよい」選任資格である点を正確に扱うこと。添乗業務を行うための資格ではない（添乗には別途、｜旅程管理主任者《りょていかんりしゅにんしゃ》資格が必要）。",
    "factSources": [
      "旅行業務取扱管理者 | 旅行業法 | 観光庁 https://www.mlit.go.jp/kankocho/seisaku_seido/ryokogyoho/kanrisha.html",
      "旅行業務取扱管理者 - Wikipedia https://ja.wikipedia.org/wiki/%E6%97%85%E8%A1%8C%E6%A5%AD%E5%8B%99%E5%8F%96%E6%89%B1%E7%AE%A1%E7%90%86%E8%80%85",
      "旅行業務取扱管理者制度について / 奈良県 https://www.pref.nara.jp/55088.htm"
    ],
    "lastVerified": "2026-09-04"
  },
  "trip-teacher": {
    "qualificationRequired": true,
    "qualificationName": "｜教員免許状《きょういんめんきょじょう》（小学校教諭・中学校教諭・高等学校教諭等、｜国家資格《こっかしかく》に準じる公的資格）",
    "pathSummary": "修学旅行の引率責任者は学校の教員が務めるため、｜教員免許状《きょういんめんきょじょう》が必須。｜教員免許《きょういんめんきょ》は教育職員免許法に基づき都道府県教育委員会が授与する免許で、大学等の教職課程を修了することで取得できる。",
    "routes": [
      {
        "routeName": "大学の教職課程で免許を取るルート",
        "routeType": "国家資格必須ルート",
        "steps": [
          {
            "stage": "高校",
            "requirementType": "education",
            "required": false,
            "description": "決まった学科はないが、いろいろな教科を頑張っておくと役に立つ。"
          },
          {
            "stage": "大学・短大（教職課程）",
            "requirementType": "education",
            "required": true,
            "description": "先生になるための授業がある大学に行って、必要な科目を全部勉強する。"
          },
          {
            "stage": "免許状の申請",
            "requirementType": "license",
            "required": true,
            "description": "大学を卒業したら、教育委員会に申請して免許をもらう。"
          },
          {
            "stage": "採用試験・就職",
            "requirementType": "exam",
            "required": true,
            "description": "先生になるための試験に合格して、学校で働き始める。"
          }
        ]
      }
    ],
    "alternatives": "幼稚園・小学校・特別支援学校の二種免許状は、教職課程を修了していなくても試験（教員資格認定試験）に合格すれば取得できる特例ルートがある。",
    "canStartLater": true,
    "importantNotes": "｜教員免許《きょういんめんきょ》は｜国家資格《こっかしかく》に準じる公的資格であり、これがないと学校の教員にはなれない。修学旅行の引率責任者という立場は「教員であること」が前提になっている。",
    "factSources": [
      "教員免許とは②：国家資格なの? 卒業後でも取れる!? https://www.e-staff.jp/reading/10041",
      "教員免許状に関するQ&A：文部科学省 https://www.mext.go.jp/a_menu/shotou/kyoin/main13_a2.htm",
      "中学教員免許の取り方（中学校教諭免許状） https://teachforjapan.org/journal/28584/"
    ],
    "lastVerified": "2026-09-04"
  },
  "trip-busmanager": {
    "qualificationRequired": true,
    "qualificationName": "｜運行管理者《うんこうかんりしゃ》資格者証（｜国家資格《こっかしかく》・事業所単位で選任義務あり）",
    "pathSummary": "貸切バス会社は、一定台数以上のバスを持つ営業所ごとに、｜国家資格《こっかしかく》である「｜運行管理者《うんこうかんりしゃ》」を一定人数選任することが法律で義務付けられている。｜運行管理者《うんこうかんりしゃ》資格者証を持つ人がその役割を担う。",
    "routes": [
      {
        "routeName": "試験合格ルート",
        "routeType": "国家資格必須ルート（事業所への選任義務）",
        "steps": [
          {
            "stage": "高校・就職",
            "requirementType": "education",
            "required": false,
            "description": "決まった学校はなく、バス会社に入って仕事をしながら目指す。"
          },
          {
            "stage": "基礎講習または｜実務経験《じつむけいけん》",
            "requirementType": "training",
            "required": true,
            "description": "先に講習を受けるか、1年以上の｜実務経験《じつむけいけん》を積む必要がある。"
          },
          {
            "stage": "資格試験（旅客）",
            "requirementType": "exam",
            "required": true,
            "description": "国が決めた団体が行うテストに合格する必要がある。"
          },
          {
            "stage": "選任・登録",
            "requirementType": "license",
            "required": true,
            "description": "試験に受かって、バス会社から選ばれると｜運行管理者《うんこうかんりしゃ》として働ける。"
          }
        ]
      },
      {
        "routeName": "実務経験による資格認定ルート",
        "routeType": "実務経験ルート",
        "steps": [
          {
            "stage": "｜実務経験《じつむけいけん》＋講習の積み重ね",
            "requirementType": "experience",
            "required": false,
            "description": "長く現場で働いて講習をたくさん受けると、テストに受からなくても資格がもらえる道もある。"
          }
        ]
      }
    ],
    "alternatives": null,
    "canStartLater": true,
    "importantNotes": "｜運行管理者《うんこうかんりしゃ》は事業者（バス会社）に選任義務があるという点で、｜旅行業務取扱管理者《りょこうぎょうむとりあつかいかんりしゃ》と似た「事業所単位の必須資格」。バスの運転手（ドライバー）に必要な大型第二種免許とは別の資格である点に注意。",
    "factSources": [
      "自動車運送事業の運行管理者になるには - 国土交通省 https://www.mlit.go.jp/about/file000064.html",
      "運行管理者とは｜公益財団法人 運行管理者試験センター https://www.unkan.or.jp/about.html",
      "運行管理者とは？業務内容から資格取得に必要な条件・選任方法まで https://www.u-can.co.jp/course/data/in_html/1342/column/column01.html"
    ],
    "lastVerified": "2026-09-04"
  },
  "trip-conductor": {
    "qualificationRequired": false,
    "qualificationName": "｜旅程管理主任者《りょていかんりしゅにんしゃ》（登録研修機関が行う研修による資格）",
    "pathSummary": "旅行業者が企画旅行（募集型・受注型を問わない）に添乗員を同行させ旅程管理業務を行わせる場合、その主任者について資格保有が旅行業法第12条の11により義務付けられる（旅行の規模ではなく、添乗員に旅程管理業務を行わせるかどうかという業務内容による）。旅程管理の措置自体は代替手段（現地業者への委託や連絡窓口の設置等）でも満たせるため、すべての企画旅行に必ず有資格添乗員が同行するわけではない。国内旅行のみを扱う『国内｜旅程管理主任者《りょていかんりしゅにんしゃ》』と、海外も扱える『総合｜旅程管理主任者《りょていかんりしゅにんしゃ》』がある。",
    "routes": [
      {
        "routeName": "研修機関の登録研修を受けるルート",
        "routeType": "資格取得ルート",
        "steps": [
          {
            "stage": "高校・大学",
            "requirementType": "education",
            "required": false,
            "description": "決まった学校はないが、外国語や地理の勉強が役立つ。"
          },
          {
            "stage": "添乗員派遣会社・旅行会社への就職",
            "requirementType": "experience",
            "required": false,
            "description": "添乗員を派遣する会社に登録して、仕事をしながら資格を取ることが多い。"
          },
          {
            "stage": "｜旅程管理主任者《りょていかんりしゅにんしゃ》研修の受講",
            "requirementType": "training",
            "required": true,
            "description": "決められた研修を受けると資格がもらえる。テストはそこまで難しくない。"
          },
          {
            "stage": "実務同行経験",
            "requirementType": "experience",
            "required": true,
            "description": "研修だけでなく、実際に旅行に同行した経験も必要になることがある。"
          }
        ]
      }
    ],
    "alternatives": "旅程管理業務を行わない単なる同行者（通訳・引率者等）には本資格は不要。国内｜旅程管理主任者《りょていかんりしゅにんしゃ》は国内旅行の添乗業務のみ対応可（研修2日程度）、総合｜旅程管理主任者《りょていかんりしゅにんしゃ》は国内・海外どちらの添乗業務にも対応可（研修3日程度、英語を含む科目、実地研修を海外で実施）。",
    "canStartLater": true,
    "importantNotes": "｜旅程管理主任者《りょていかんりしゅにんしゃ》は｜旅行業務取扱管理者《りょこうぎょうむとりあつかいかんりしゃ》とは別の資格で、添乗員本人の実務資格である点に注意（｜旅行業務取扱管理者《りょこうぎょうむとりあつかいかんりしゃ》は営業所の選任資格で添乗業務はできない）。",
    "factSources": [
      "添乗員になるためには｜TCSA 一般社団法人日本添乗サービス協会 https://www.tcsa.or.jp/become/howto/",
      "旅程管理主任者の情報まとめ https://jpsk.jp/examinations/ryoteikanri.html",
      "添乗員の資格「旅程管理主任者」の難易度や合格率は？ https://www.tex.co.jp/contents/3/113"
    ],
    "lastVerified": "2026-09-04"
  },
  "trip-hotel": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "ホテル・旅館で修学旅行などの団体客を受け入れる担当者に必須の｜国家資格《こっかしかく》はない。接客未経験からでもフロントや宴会・団体係として採用され、OJTで仕事を覚えるのが一般的。",
    "routes": [
      {
        "routeName": "未経験から始めるルート",
        "routeType": "未経験からのOJTルート",
        "steps": [
          {
            "stage": "高校・専門学校",
            "requirementType": "education",
            "required": false,
            "description": "ホテルの勉強ができる学校もあるが、行かなくてもなれる。"
          },
          {
            "stage": "採用・就職",
            "requirementType": "experience",
            "required": false,
            "description": "宿に就職して、団体のお客さんの受け入れ方を先輩から教わる。"
          }
        ]
      }
    ],
    "alternatives": "「ホテルビジネス実務検定（H検）」などの民間検定を取得するとスキルの証明になり、就職や昇進で有利に働くことがあるが、必須ではない。",
    "canStartLater": true,
    "importantNotes": "民間の検定（H検など）を｜国家資格《こっかしかく》と混同しないよう注意。あくまで任意のスキル証明であり、就業条件ではない。",
    "factSources": [
      "ホテル開業・経営に必要な資格を紹介！ https://checkinn.jp/blog/hotel-qualification/",
      "ホテルマンに資格は必要？ https://a-yadojob.jp/column/hotel-staff-qualifications/"
    ],
    "lastVerified": "2026-09-04"
  },
  "zoo-keeper": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "動物園の飼育員になるために法律上必須の資格はない。ただし多くの動物園（特に公立）は採用人数が非常に少なく、採用試験の倍率が数十倍になることも珍しくないため、実質的には狭き門であり、大学・専門学校での動物関連の学びや実習経験が有利に働く。",
    "routes": [
      {
        "routeName": "資格なしで採用試験に挑むルート",
        "routeType": "採用試験ルート（資格不要だが高倍率）",
        "steps": [
          {
            "stage": "高校",
            "requirementType": "education",
            "required": false,
            "description": "決まった学科はないが、生きものの勉強をしておくと役立つ。"
          },
          {
            "stage": "大学・専門学校（動物・畜産・獣医系等）",
            "requirementType": "education",
            "required": false,
            "description": "動物のことを学べる学校に行くと、採用試験で有利になりやすい。"
          },
          {
            "stage": "採用試験・就職",
            "requirementType": "exam",
            "required": true,
            "description": "動物園で働くには試験に合格しないといけないが、募集人数がとても少なく、とても人気があるので受かるのが難しい。"
          }
        ]
      }
    ],
    "alternatives": "「愛玩動物飼養管理士」「学芸員資格」などの民間・｜国家資格《こっかしかく》を持っていると、採用試験で知識をアピールしやすい。必須ではないが差別化につながる。",
    "canStartLater": true,
    "importantNotes": "「資格不要＝簡単になれる」という誤解に注意。資格がなくても応募はできるが、実際には採用倍率が非常に高く、動物への理解や実習経験の積み重ねが重要になる。",
    "factSources": [
      "動物飼育員に必要な資格はあるの？ https://www.heco.ac.jp/eco_column/required-qualification-for-breeding-staff/",
      "飼育員になるにはナビ｜動物園水族館の採用試験倍率はどのくらいか？ https://keepersnavi.com/%E5%8B%95%E7%89%A9%E5%9C%92%E6%B0%B4%E6%97%8F%E9%A4%A8%E3%81%AE%E6%8E%A1%E7%94%A8%E8%A9%A6%E9%A8%93%E5%80%8D%E7%8E%87%E3%81%AF%E3%81%A9%E3%81%AE%E3%81%8F%E3%82%89%E3%81%84%E3%81%8B%EF%BC%9F/",
      "動物園飼育員になるには？資格は必要？ https://www.tcaeco.ac.jp/contents/column/20200915_192/"
    ],
    "lastVerified": "2026-09-04"
  },
  "zoo-vet": {
    "qualificationRequired": true,
    "qualificationName": "｜獣医師免許《じゅういしめんきょ》（｜国家資格《こっかしかく》）",
    "pathSummary": "動物園の｜獣医師《じゅういし》になるには、｜獣医師免許《じゅういしめんきょ》（｜国家資格《こっかしかく》）が必須。6年制の獣医学部・獣医学科を卒業し、｜獣医師《じゅういし》｜国家試験《こっかしけん》に合格したうえで、農林水産省の｜獣医師《じゅういし》名簿に登録して初めて｜獣医師《じゅういし》として働ける。",
    "routes": [
      {
        "routeName": "獣医学部進学ルート",
        "routeType": "国家資格必須ルート",
        "steps": [
          {
            "stage": "高校",
            "requirementType": "education",
            "required": true,
            "description": "理科と数学をしっかり勉強しておく必要がある。"
          },
          {
            "stage": "大学（獣医学部・獣医学科／6年制）",
            "requirementType": "education",
            "required": true,
            "description": "獣医さんになるための大学に行って、6年間動物の体や病気について勉強する。"
          },
          {
            "stage": "｜獣医師《じゅういし》｜国家試験《こっかしけん》",
            "requirementType": "exam",
            "required": true,
            "description": "大学の最後の年に、国が行うテストを受けて合格しないといけない。"
          },
          {
            "stage": "免許登録",
            "requirementType": "license",
            "required": true,
            "description": "テストに合格しただけでは終わりではなく、国に申請して名簿に登録されて初めて｜獣医師《じゅういし》になれる。"
          },
          {
            "stage": "採用試験・就職",
            "requirementType": "exam",
            "required": true,
            "description": "｜獣医師《じゅういし》の資格を取ってから、動物園で働くための試験にも合格する必要がある。"
          }
        ]
      }
    ],
    "alternatives": null,
    "canStartLater": true,
    "importantNotes": "｜獣医師免許《じゅういしめんきょ》は例外なく｜国家資格《こっかしかく》が必須で、資格なしに｜獣医師《じゅういし》として働くことはできない。ペットの動物病院の｜獣医師《じゅういし》と動物園の｜獣医師《じゅういし》は同じ「｜獣医師免許《じゅういしめんきょ》」で、動物園はその中の特定の勤務先という位置づけ。",
    "factSources": [
      "獣医師になるには｜公益社団法人日本獣医師会 https://jvma-vet.jp/works/becomeveterinarian.html",
      "獣医師国家試験 - Wikipedia https://ja.wikipedia.org/wiki/%E7%8D%A3%E5%8C%BB%E5%B8%AB%E5%9B%BD%E5%AE%B6%E8%A9%A6%E9%A8%93",
      "獣医学部は6年制！獣医師になるまでの道のりを解説 https://vets-select.com/basic/4194/"
    ],
    "lastVerified": "2026-09-04"
  },
  "zoo-nutritionist": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "動物園で動物ごとの餌（飼料）の配合・管理を担う仕事に必須の｜国家資格《こっかしかく》はない。多くの場合は飼育員としてキャリアを積んだ人が「飼料担当」を兼務・専任するかたちで担っており、栄養士資格が必須ではない点は人間の給食栄養士とは異なる。",
    "routes": [
      {
        "routeName": "飼育員から飼料・栄養担当になるルート",
        "routeType": "実務経験ルート",
        "steps": [
          {
            "stage": "大学・専門学校（動物・畜産系、任意）",
            "requirementType": "education",
            "required": false,
            "description": "動物の栄養について勉強しておくと役立つが、必須ではない。"
          },
          {
            "stage": "飼育員として採用・就職",
            "requirementType": "exam",
            "required": true,
            "description": "まず飼育員になって、仕事をしながら餌の作り方を覚えていく。"
          },
          {
            "stage": "飼料班・栄養管理担当への配置",
            "requirementType": "experience",
            "required": false,
            "description": "経験を積むと、餌づくりの専門チームに入れることがある。"
          }
        ]
      }
    ],
    "alternatives": "「愛玩動物飼養管理士」など動物関連の民間資格を持っていると知識の裏付けになるが必須ではない。",
    "canStartLater": true,
    "importantNotes": "人間の給食の「栄養士」とは異なり、動物園の飼料・栄養担当に対応する専門の｜国家資格《こっかしかく》は存在しない。飼育員としての｜実務経験《じつむけいけん》の中でスキルを積むのが一般的なルート。",
    "factSources": [
      "飼料班のおしごと① - 野毛山動物園 https://www.hama-midorinokyokai.or.jp/zoo/nogeyama/details/post-11489.php",
      "動物園のえさ（飼料）担当の仕事 https://www.tokyo-zoo.net/topic/topics_detail?kind=news&inst=tama&link_num=24887",
      "動物飼育員に資格は必要なし？おすすめの資格を4種類紹介します https://job-q.me/articles/11092"
    ],
    "lastVerified": "2026-09-04"
  },
  "zoo-planner": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "動物園の展示企画・広報を担う仕事に必須の｜国家資格《こっかしかく》はない。ただし博物館法に基づく｜国家資格《こっかしかく》「学芸員」を持っていると、展示企画や調査研究の面で有利になり、園によっては「飼育学芸員」のように飼育員と学芸員を兼ねる職種を設けている場合もある。",
    "routes": [
      {
        "routeName": "広報・企画職として就職するルート（資格不要）",
        "routeType": "未経験からのOJTルート",
        "steps": [
          {
            "stage": "高校・大学",
            "requirementType": "education",
            "required": false,
            "description": "決まった学部はないが、伝え方やデザインの勉強が役立つ。"
          },
          {
            "stage": "採用・就職",
            "requirementType": "experience",
            "required": false,
            "description": "動物園の広報チームに入って、伝え方やイベントの作り方を教わる。"
          }
        ]
      },
      {
        "routeName": "学芸員資格を活かすルート",
        "routeType": "国家資格を活かす任意ルート",
        "steps": [
          {
            "stage": "大学・短大（博物館に関する科目の履修）",
            "requirementType": "education",
            "required": false,
            "description": "大学で決められた科目を勉強すると、学芸員という資格がもらえる。"
          },
          {
            "stage": "動物園（飼育学芸職等）への就職",
            "requirementType": "exam",
            "required": false,
            "description": "学芸員の資格を持っていると、展示を考える仕事に就きやすくなることがある。"
          }
        ]
      }
    ],
    "alternatives": "学芸員資格は必須ではなく、広報・企画未経験からでもキャリアをスタートできる。デザインやSNS運用の｜実務経験《じつむけいけん》が評価される場合も多い。",
    "canStartLater": true,
    "importantNotes": "学芸員は｜国家資格《こっかしかく》だが、動物園の展示企画・広報職に就くための必須条件ではない点に注意。資格の有無よりも｜実務経験《じつむけいけん》や企画力が重視されることが多い。",
    "factSources": [
      "学芸員 | キャリアガーデン https://careergarden.jp/gakugeiin/",
      "動物飼育員 | キャリアガーデン https://careergarden.jp/doubutsushiikuin/"
    ],
    "lastVerified": "2026-09-04"
  },
  "tenant-coordinator": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "商店街の空き店舗対策やまちづくり推進（タウンマネージャー等）になるための決まった｜国家資格《こっかしかく》・免許は存在しない。まちづくり会社・商店街振興組合・自治体の商業観光部局への就職、自治体の公募（委託契約や任期付職員）、地域おこし協力隊への応募など、複数の入り口がある。実務主体が『市の職員』『まちづくり会社の社員』『商店街振興組合の職員』のいずれかは地域ごとに異なるため、断定せず『商店街の空き店舗対策に関わる仕事』と仮置きする。",
    "routes": [
      {
        "routeName": "まちづくり会社・商店街振興組合の職員になるルート",
        "routeType": "未経験からのOJTルート",
        "steps": [
          {
            "stage": "中学校・高校",
            "requirementType": "education",
            "required": false,
            "description": "決まった勉強はないよ。町のお店や商店街に興味を持つことが最初の一歩。"
          },
          {
            "stage": "大学・専門学校",
            "requirementType": "education",
            "required": false,
            "description": "町づくりやお店のことを大学で学ぶ人もいるけど、必ずしも必要じゃないよ。"
          },
          {
            "stage": "就職",
            "requirementType": "experience",
            "required": true,
            "description": "町づくり会社や商店街の組合、市役所などで働きながら、お店を探す・つなげる仕事を覚えていくよ。"
          }
        ]
      },
      {
        "routeName": "自治体のタウンマネージャー公募ルート",
        "routeType": "実務経験ルート",
        "steps": [
          {
            "stage": "｜実務経験《じつむけいけん》",
            "requirementType": "experience",
            "required": true,
            "description": "町（自治体）が『こんな人を探してます』と募集を出すことがあって、そこに応募して選ばれるとタウンマネージャーになれることがあるよ。"
          }
        ]
      },
      {
        "routeName": "地域おこし協力隊から入るルート",
        "routeType": "未経験からのOJTルート",
        "steps": [
          {
            "stage": "採用試験・応募",
            "requirementType": "experience",
            "required": false,
            "description": "国の『地域おこし協力隊』という仕組みに応募して、町に住みながら商店街を元気にする活動をする道もあるよ。"
          }
        ]
      },
      {
        "routeName": "中小企業診断士（国家資格）を活かすルート",
        "routeType": "国家資格活用ルート",
        "steps": [
          {
            "stage": "大学・専門学校/｜実務経験《じつむけいけん》",
            "requirementType": "license",
            "required": false,
            "description": "『｜中小企業診断士《ちゅうしょうきぎょうしんだんし》』という国の資格を持って、専門家として商店街を手伝う道もあるよ。でも、これがないとなれないわけじゃないよ。"
          }
        ]
      }
    ],
    "alternatives": "市町村の商業振興・都市計画担当の公務員として、業務の一部で空き店舗対策に関わる道もある。",
    "canStartLater": true,
    "importantNotes": "『タウンマネージャー』は資格制度ではなく役割・ポジションの呼び名。実務主体（誰が空き店舗対策を担うか）は自治体・まちづくり会社・商店街振興組合など地域によって大きく異なるため、特定の職業名で断定しない。",
    "factSources": [
      "経済産業省中国経済産業局「人と人との縁を紡ぐ、タウンマネージャーという仕事」 https://chugoku-meti-gov.note.jp/n/n13c4e6eba5cd?gs=466cd83125294e0797e4fa9b81cff59a",
      "Think都城「シャッター商店街、再生の兆し タウンマネージャーの奮闘」 https://think-miyakonojo.jp/article/5702/",
      "総務省 地域おこし協力隊全国オンラインイベント「【山口県】商店街活性化のための企画と情報発信」 https://www.soumu.go.jp/main_sosiki/jichi_gyousei/c-gyousei/chiikiokoshitai/article/yamaguchi.html",
      "ウィキペディア「タウンマネージャー」 https://ja.wikipedia.org/wiki/%E3%82%BF%E3%82%A6%E3%83%B3%E3%83%9E%E3%83%8D%E3%83%BC%E3%82%B8%E3%83%A3%E3%83%BC",
      "幻冬舎ゴールドオンライン「街を創り、人を呼び、地域を活性化…知られざる『タウンマネージャー』という仕事」 https://gentosha-go.com/articles/-/41250",
      "埼玉県「平成28年度商店街経営実態調査 第5節 空き店舗の現状と対策」 https://www.pref.saitama.lg.jp/documents/3956/ni5.pdf",
      "全国中小企業団体中央会「どうしたら中小企業診断士になれるの？」 https://www.jf-cmca.jp/contents/002_c_shindanshiseido/002_shindanshi_doushitara.html"
    ],
    "lastVerified": "2026-09-04"
  },
  "keiei-shidoin": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "経営指導員は商工会・商工会議所が実施する採用試験に合格し、採用後の研修を経て任用される職員である。｜中小企業診断士《ちゅうしょうきぎょうしんだんし》・税理士・公認会計士などの資格を持っていると受験時に｜実務経験《じつむけいけん》年数要件が緩和される場合があるが、資格が無くても｜実務経験《じつむけいけん》だけで受験・採用され得る。東京商工会議所の指導員採用ページでは『経営支援に関する経験や知識が無くても、研修などで知識習得をサポートする』と明記されている。",
    "routes": [
      {
        "routeName": "実務経験ルート（資格なし）",
        "routeType": "実務経験ルート",
        "steps": [
          {
            "stage": "大学・専門学校",
            "requirementType": "education",
            "required": false,
            "description": "大学を出て、お店や会社の仕事を手伝った経験が少しあれば、試験を受けられることがあるよ。"
          },
          {
            "stage": "採用試験・応募",
            "requirementType": "exam",
            "required": true,
            "description": "商工会議所が行う採用試験に受かる必要があるよ。お店や会社に営業や提案をした経験があると有利みたい。"
          },
          {
            "stage": "｜実務経験《じつむけいけん》（採用後研修）",
            "requirementType": "training",
            "required": true,
            "description": "採用されたあとも研修を受けながら、少しずつお店の相談にのる仕事を覚えていくよ。"
          }
        ]
      },
      {
        "routeName": "資格保有ルート（優遇されるが必須ではない）",
        "routeType": "国家資格活用ルート",
        "steps": [
          {
            "stage": "大学・専門学校/｜実務経験《じつむけいけん》",
            "requirementType": "license",
            "required": false,
            "description": "『｜中小企業診断士《ちゅうしょうきぎょうしんだんし》』のような国の資格を先に取っておくと試験を受けやすくなることもあるけど、資格がなくてもなれるよ。"
          }
        ]
      }
    ],
    "alternatives": "｜中小企業診断士《ちゅうしょうきぎょうしんだんし》として独立し、商工会議所からの委託業務（専門家派遣等）で経営相談に関わる道もある。",
    "canStartLater": true,
    "importantNotes": "｜中小企業診断士《ちゅうしょうきぎょうしんだんし》は｜国家資格《こっかしかく》だが、経営指導員になるための必須条件ではない。｜実務経験《じつむけいけん》のみでもなれる。また『商工会』（全国商工会連合会系、主に町村部）と『商工会議所』（日本商工会議所系、主に市部）は別組織で、採用試験の要件は組織・地域ごとに異なる可能性がある。マル経融資は経営指導員個人の一存では決まらず、商工会議所内の審査会や会頭（会長）の認証といった組織的な手続きを経て推薦される。",
    "factSources": [
      "千葉県商工会連合会「令和3年度第2回経営指導員等採用資格試験 受験案内」 https://www.chibaken.or.jp/staffonly/wp-content/uploads/2021/07/%E4%BB%A4%E5%92%8C%EF%BC%93%E5%B9%B4%E5%BA%A6%E7%B5%8C%E5%96%B6%E6%8C%87%E5%B0%8E%E5%93%A1%E7%AD%89%E6%8E%A1%E7%94%A8%E8%B3%87%E6%A0%BC%E8%A9%A6%E9%A8%93%E5%8F%97%E9%A8%93%E6%A1%88%E5%86%85%EF%BC%88%E7%AC%AC%EF%BC%92%E5%9B%9E%EF%BC%89.pdf",
      "東京商工会議所 指導員採用サイト https://www.tokyo-cci.or.jp/saiyo/shidoin/",
      "日本商工会議所「マル経融資」 https://www.jcci.or.jp/support/financing/marukei/index.html",
      "日本政策金融公庫「マル経融資（小規模事業者経営改善資金）」 https://www.jfc.go.jp/n/finance/search/kaizen_m.html",
      "中小企業庁「小規模事業者経営改善資金（マル経融資）について」 https://www.chusho.meti.go.jp/keiei/shokibo/marukei/",
      "日本政策金融公庫「制度概要｜小規模事業者経営改善資金（マル経融資）」 https://www.jfc.go.jp/n/finance/marukei/about/index.html",
      "独立行政法人中小企業基盤整備機構「中小企業支援担当者向け研修｜中小企業大学校」 https://www.smrj.go.jp/institute/hitoyoshi/training/supporter/index.html",
      "日本商工会議所「商工会議所の経営支援 現状と課題」（2024年12月、中小企業庁ヨロズ検討会資料） https://www.chusho.meti.go.jp/koukai/kenkyukai/yorozu/003/006.pdf"
    ],
    "lastVerified": "2026-09-04"
  },
  "loan-screener": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "日本政策金融公庫（政策金融機関）の職員として新卒・中途で採用され、配属後の研修とOJTを通じて融資審査の知識・技能を身につける。融資審査業務そのものに必須の｜国家資格《こっかしかく》・免許はなく、公庫独自の採用試験（エントリーシート・筆記試験・面接等）に合格することが入口になる。",
    "routes": [
      {
        "routeName": "新卒総合職ルート",
        "routeType": "未経験からのOJTルート",
        "steps": [
          {
            "stage": "大学・専門学校",
            "requirementType": "education",
            "required": false,
            "description": "大学で何を勉強していないといけない、という決まりはとくにないよ。"
          },
          {
            "stage": "採用試験・応募",
            "requirementType": "exam",
            "required": true,
            "description": "公庫が行う採用試験に受かって、まず職員になる必要があるよ。"
          },
          {
            "stage": "｜実務経験《じつむけいけん》（入庫後研修）",
            "requirementType": "training",
            "required": true,
            "description": "職員になったあと、研修と先輩からの指導で、少しずつ『お金を貸していいか考える』仕事のやり方を覚えていくよ。"
          }
        ]
      }
    ],
    "alternatives": "民間銀行・信用金庫などで融資審査の｜実務経験《じつむけいけん》を積んだ後、中途採用で公庫に転職する道もある（要件は公庫の中途採用情報を要確認）。",
    "canStartLater": true,
    "importantNotes": "『創業融資の審査員』という単独の｜国家資格《こっかしかく》は存在しない。日本政策金融公庫の職員は特殊会社（政策金融機関）の職員であり、国家公務員ではない点にも注意（試験は公庫独自の採用試験で、国家公務員試験ではない）。",
    "factSources": [
      "日本政策金融公庫「日本政策金融公庫紹介｜2027年度新卒者採用ホームページ」 https://www.jfc.go.jp/n/recruit/business/",
      "日本政策金融公庫「国民生活事業｜2027年度新卒者採用ホームページ」 https://www.jfc.go.jp/n/recruit/business/business03.html",
      "日本政策金融公庫「キャリア支援｜2027年度新卒者採用ホームページ」 https://www.jfc.go.jp/n/recruit/career/",
      "日本政策金融公庫「採用情報｜2027年度新卒者採用ホームページ」 https://www.jfc.go.jp/n/recruit/recruit/",
      "日本政策金融公庫「はじめての方はこちら｜2027年度新卒者採用ホームページ」 https://www.jfc.go.jp/n/recruit/first/"
    ],
    "lastVerified": "2026-09-04"
  },
  "shop-designer": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "店舗デザイナー自身に法律上必須の資格はない。ただし、一定規模を超える建築物の設計・工事監理（構造や用途変更を伴う場合など）には建築士法に基づき建築士の資格が必要になる場面があり、内装工事の施工管理には施工管理技士等の資格を持つ人が関わることがある。店舗デザイナーは大学・専門学校でデザインや建築を学んだ後、設計事務所・内装会社等に就職して｜実務経験《じつむけいけん》を積むのが一般的なルートである。",
    "routes": [
      {
        "routeName": "専門学校・大学からデザイン事務所へ就職するルート",
        "routeType": "未経験からのOJTルート",
        "steps": [
          {
            "stage": "高校",
            "requirementType": "education",
            "required": false,
            "description": "絵を描いたり、ものを作ったりするのが好きだと将来役に立つことがあるよ。"
          },
          {
            "stage": "大学・専門学校",
            "requirementType": "education",
            "required": false,
            "description": "学校でお店や建物のデザインを学ぶ人が多いけど、行かないとなれないわけじゃないよ。"
          },
          {
            "stage": "｜実務経験《じつむけいけん》",
            "requirementType": "experience",
            "required": true,
            "description": "会社に入って、実際にお店のデザインを手伝いながら仕事のやり方を覚えていくよ。"
          }
        ]
      },
      {
        "routeName": "関連資格を取得して専門性を補強するルート（任意）",
        "routeType": "資格活用ルート（任意）",
        "steps": [
          {
            "stage": "資格取得（任意）",
            "requirementType": "license",
            "required": false,
            "description": "『インテリアコーディネーター』のような資格を取ると自分の知識を証明しやすくなるけど、これがないとデザイナーになれないわけじゃないよ。"
          }
        ]
      }
    ],
    "alternatives": "建築士資格（｜国家資格《こっかしかく》）を取得し、より大きな改装や構造に関わる部分まで担当できる設計者になる道もある。",
    "canStartLater": true,
    "importantNotes": "『店舗デザイナー』という職業名自体に対応する必須の｜国家資格《こっかしかく》・免許はない。ただし建築確認申請が必要な規模の工事や用途変更を伴う場合は、建築士法に基づき建築士が設計・工事監理に関わる必要がある。内装工事の現場管理には施工管理技士等の資格保持者が関わることがある。",
    "factSources": [
      "建築家紹介センター「店舗設計に必要な資格について」 https://kentikusi.jp/dr/%E5%BA%97%E8%88%97/%E8%B3%87%E6%A0%BC",
      "店舗デザイン.COM「デザイナーの流儀：内装工事の許認可・資格」 https://www.tenpodesign.com/style/65",
      "インテリアお仕事マガジン「店舗デザイナーに必要な6つの要素」 https://job.tenpodesign.com/magazine/article/104",
      "SDC「店舗デザイナーになるには－仕事内容・年収・資格難易度－」 https://www.space-design.co.jp/occupation/shop_designer.php",
      "「建築士法と建築士と内装設計の仕事」 https://www.interior-supervisor.com/kentikusiho-kentikusi-naisosekkei/",
      "店舗設計施工.com「店舗設計とは？」 https://www.shop-reform.com/column/planning/basic_store_design",
      "カグポンメディア「店舗デザインに資格は必要？」 https://www.kagupon.com/media/store_design_qualification/"
    ],
    "lastVerified": "2026-09-04"
  },
  "food-inspector": {
    "qualificationRequired": true,
    "qualificationName": "｜食品衛生監視員《しょくひんえいせいかんしいん》｜任用資格《にんようしかく》（｜国家資格《こっかしかく》ではなく、食品衛生法施行令第9条に基づく｜任用資格《にんようしかく》。4つの要件のうちいずれか1つを満たす必要がある）＋地方公務員または国家公務員の採用試験合格",
    "pathSummary": "｜食品衛生監視員《しょくひんえいせいかんしいん》は｜国家資格《こっかしかく》ではない。食品衛生法第30条に基づき、都道府県知事・保健所設置市長等（国の検疫所の場合は厚生労働大臣）が任命する『｜任用資格《にんようしかく》』であり、（1）食品衛生法施行令第9条が定める要件（医師・歯科医師・｜薬剤師《やくざいし》・｜獣医師《じゅういし》である、または大学等で医学・歯学・薬学・獣医学・畜産学・水産学・農芸化学の課程を修めて卒業、または栄養士として2年以上食品衛生行政の｜実務経験《じつむけいけん》があるなど）を満たし、かつ（2）地方公務員採用試験（都道府県・保健所設置市の｜獣医師《じゅういし》区分・｜薬剤師《やくざいし》区分・食品衛生系区分等）に合格して自治体職員となり保健所に配属される、という2つの条件がそろって初めてこの役職に就ける。",
    "routes": [
      {
        "routeName": "地方公務員（保健所）ルート",
        "routeType": "公務員試験ルート",
        "steps": [
          {
            "stage": "｜任用資格《にんようしかく》要件（いずれか一つを満たす）",
            "requirementType": "education",
            "required": true,
            "description": "決まった学校で勉強して卒業する道、資格を先に持っている道、栄養士として経験を積む道など、いくつかの道のどれか一つを満たす必要があるよ。"
          },
          {
            "stage": "公務員試験・採用試験",
            "requirementType": "exam",
            "required": true,
            "description": "県や市が行う『公務員になるための試験』に受かる必要があるよ。"
          },
          {
            "stage": "｜実務経験《じつむけいけん》（任命）",
            "requirementType": "experience",
            "required": true,
            "description": "県や市の職員になって、保健所の食べ物担当の部署に配属されると、『｜食品衛生監視員《しょくひんえいせいかんしいん》』と呼ばれるようになるよ。"
          }
        ]
      },
      {
        "routeName": "国家公務員（検疫所）ルート",
        "routeType": "公務員試験ルート",
        "steps": [
          {
            "stage": "公務員試験・採用試験",
            "requirementType": "exam",
            "required": true,
            "description": "国が行う専門の試験に受かると、空港や港で外国から来る食べ物をチェックする仕事につくこともあるよ。"
          }
        ]
      }
    ],
    "alternatives": "既に｜薬剤師《やくざいし》・｜獣医師《じゅういし》の資格を持つ人が、自治体の｜薬剤師《やくざいし》区分・｜獣医師《じゅういし》区分の採用試験を経て保健所配属となり、本来の専門業務と兼ねて｜食品衛生監視員《しょくひんえいせいかんしいん》に任命される例もある。",
    "canStartLater": true,
    "importantNotes": "重要: ｜食品衛生監視員《しょくひんえいせいかんしいん》は｜国家資格《こっかしかく》ではない。大学で指定の課程を修めるだけでも、公務員試験に合格するだけでも不十分で、｜任用資格《にんようしかく》（学歴・履修科目等の要件）と地方公務員試験（または国家公務員専門職試験）の合格の両方がそろって初めて『｜食品衛生監視員《しょくひんえいせいかんしいん》』に任命される。大学卒業時点で学部・履修科目が要件に合っているか自己判断せず、必ず大学の教務窓口や志望自治体に確認する必要がある（食品衛生管理者（施設側の資格）とは別の制度なので混同しない）。また、栄養士・｜薬剤師《やくざいし》・｜獣医師《じゅういし》としてすでに資格を持つ大人が、あとから目指す道もある（今すぐ決めなくても大丈夫）。",
    "factSources": [
      "厚生労働省「食品衛生監視員」 https://www.mhlw.go.jp/general/saiyo/shokukan.html",
      "人事院 国家公務員試験採用情報NAVI「食品衛生監視員採用試験」 https://www.jinji.go.jp/saiyo/siken/sennmonnsyoku_daisotsu/syokuhinn/syokuhin_eisei.html",
      "千葉県「食品衛生管理者・食品衛生監視員について」 https://www.pref.chiba.lg.jp/hoidai/shokuhinn.html",
      "神戸大学大学院農学研究科「食品衛生管理者,食品衛生監視員について」 https://www.ans.kobe-u.ac.jp/gakka/ouyou/shikaku1.html",
      "東京家政大学「食品衛生監視員（任用資格）の資格とは」 https://www.tokyo-kasei.ac.jp/academics/environmental_science_and_education/assets/%E9%A3%9F%E5%93%81%E8%A1%9B%E7%94%9F%E7%9B%A3%E8%A6%96%E5%93%A1.pdf",
      "兵庫県立大学環境人間学部「食品衛生監視員・食品衛生管理者」 https://www.u-hyogo.ac.jp/shse/koho/ss_eisei.html",
      "尚絅学院大学「食品衛生関連資格」 https://www.shokei.jp/campuslife/qualification/food_safety_certificate.html",
      "福島大学「食品衛生管理者・食品衛生監視員」 https://kyoumu.adb.fukushima-u.ac.jp/guide/2019/agri/page/006612.html",
      "ウィキペディア「食品衛生監視員」（食品衛生法第30条に基づく任命制度である旨の記載） https://ja.wikipedia.org/wiki/%E9%A3%9F%E5%93%81%E8%A1%9B%E7%94%9F%E7%9B%A3%E8%A6%96%E5%93%A1"
    ],
    "lastVerified": "2026-09-04"
  },
  "sourcing": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "食品メーカーの調達・購買（原料調達）職に就くために必須の｜国家資格《こっかしかく》はない。大学の学部を問わず新卒で採用される場合が多く、工場の製造・品質保証部門からの社内異動や、商社・小売などでの購買｜実務経験《じつむけいけん》を経た中途採用など、複数の入り口がある。",
    "routes": [
      {
        "routeName": "大学卒業後の新卒採用ルート",
        "routeType": "実務経験ルート（学部不問）",
        "steps": [
          {
            "stage": "高校",
            "requirementType": "education",
            "required": false,
            "description": "高校でどの科目を選んでも大丈夫。決められたコースはないよ。"
          },
          {
            "stage": "大学・専門学校",
            "requirementType": "education",
            "required": false,
            "description": "大学で何を勉強していても目指せる。食べ物のことや外国語を勉強しておくと少し有利になることもある。"
          },
          {
            "stage": "採用試験・就職活動",
            "requirementType": "experience",
            "required": true,
            "description": "会社の採用試験を受けて、調達の部署に配属してもらう。"
          }
        ]
      },
      {
        "routeName": "社内異動ルート（製造・品質保証から調達へ）",
        "routeType": "未経験からのOJTルート",
        "steps": [
          {
            "stage": "｜実務経験《じつむけいけん》",
            "requirementType": "experience",
            "required": true,
            "description": "はじめは工場で働いて、そのあとで材料を選ぶ係にかわることもある。"
          }
        ]
      },
      {
        "routeName": "中途採用ルート",
        "routeType": "実務経験ルート",
        "steps": [
          {
            "stage": "｜実務経験《じつむけいけん》",
            "requirementType": "experience",
            "required": true,
            "description": "別の会社で「買う仕事」をしていた人が、あとから食品会社に移ってくることもある。"
          }
        ]
      }
    ],
    "alternatives": "調達の中でも品質保証を兼ねる場合、食品衛生管理者（食品衛生法に基づく｜国家資格《こっかしかく》。特定の製造業種で施設ごとに専任が義務づけられる）や、HACCP関連の民間資格（HACCP管理者資格・HACCP普及指導員など）を持つと有利になることがあるが、調達職そのものに必須ではない。日商簿記検定・販売士・TOEIC等の資格も有利とされるが必須ではない（キャリアガーデン調べ、FACT_CHECK_REQUIRED: 個別企業の必須要件は求人票により異なるため要確認）。",
    "canStartLater": true,
    "importantNotes": "『バイヤー』のような専門職に見えるが、資格試験に合格しないとなれない仕事ではない。学部や資格よりも、実際の採用試験・面接や社内でのキャリア形成で決まる部分が大きい。今の時点で『調達に向いた勉強』を選ばなくても遅くはない。",
    "factSources": [
      "キャリアガーデン『食品メーカーに就職するには？』 https://careergarden.jp/shokuhinmaker/naruniha/",
      "マナビジョン（Benesse）『食品メーカー勤務とは』 https://manabi.benesse.ne.jp/shokugaku/job/list/072/index.html",
      "日清食品株式会社 新卒採用サイト『職種紹介（原料調達）』 https://www.nissin.com/jp/recruit/nissinfoods/work/",
      "食品衛生管理者について（FOOD TOWN／食品工場Week解説記事） https://www.foodtechjapan.jp/hub/ja-jp/blog/article_041.html",
      "日本食品保蔵科学会 HACCP管理者資格制度 https://jafps.smoosy.atlas.jp/ja/haccp_02"
    ],
    "lastVerified": "2026-09-04"
  },
  "product-dev": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "食品メーカーの商品開発（研究開発）職に必須の｜国家資格《こっかしかく》はない。農学・食品科学・栄養学・化学・工学系の学部で学んで新卒で研究開発職に就くルートが一般的だが、調理・製菓の専門学校を経てから商品開発に関わるルートもある。",
    "routes": [
      {
        "routeName": "理系学部からの新卒採用ルート",
        "routeType": "実務経験ルート",
        "steps": [
          {
            "stage": "高校",
            "requirementType": "education",
            "required": false,
            "description": "理科がすきだと後で役に立つことが多いけど、今すぐ決めなくても大丈夫。"
          },
          {
            "stage": "大学・専門学校",
            "requirementType": "education",
            "required": false,
            "description": "大学で『食べ物の科学』や『栄養』を勉強する人が多いよ。栄養士の資格を持っているとちょっと有利になることも。"
          },
          {
            "stage": "採用試験・就職活動",
            "requirementType": "experience",
            "required": true,
            "description": "会社の採用試験を受けて、新しい商品を考える部署に入る。"
          }
        ]
      },
      {
        "routeName": "調理・製菓分野からのルート",
        "routeType": "実務経験ルート",
        "steps": [
          {
            "stage": "専門学校（調理・製菓）",
            "requirementType": "education",
            "required": false,
            "description": "お菓子や料理を作る学校で勉強してから、会社で新商品を考える仕事に進む人もいる。"
          },
          {
            "stage": "｜実務経験《じつむけいけん》・中途採用",
            "requirementType": "experience",
            "required": true,
            "description": "お店で料理やお菓子を作っていた人が、あとから食品会社に入ることもある。"
          }
        ]
      }
    ],
    "alternatives": "文系（経済・経営学部等）からマーケティング寄りの商品企画職に進む例もある。栄養士・｜管理栄養士《かんりえいようし》資格は必須ではないが評価されやすい。",
    "canStartLater": true,
    "importantNotes": "『研究開発』という名前から｜国家資格《こっかしかく》が必要に見えるが、必須資格はない。大学での専攻はひとつの道であり、調理・製菓など別の入り口から進む人も実際にいる。",
    "factSources": [
      "関西福祉科学大学 ふっかライブラリー『食品開発者になるには？どんな大学（学部）で学べば良いか』 https://www.fuksi-kagk-u.ac.jp/fukkalibrary/article/nourish04.html",
      "北海道ハイテクノロジー専門学校『食品開発者になるには？』 https://www.hht.ac.jp/news/64060/",
      "エフラボコラム『食品の商品企画・商品開発の仕事に就くには？役立つ資格を紹介』 https://www.flabo.site/media/how-to-get-a-job-in-product-development/",
      "日清食品株式会社 新卒採用サイト『職種紹介（研究開発）』 https://www.nissin.com/jp/recruit/nissinfoods/work/",
      "株式会社明治 新卒採用サイト『職種紹介（商品開発）』 https://www.meiji.co.jp/corporate/recruit/new-graduate/business/job/"
    ],
    "lastVerified": "2026-09-04"
  },
  "packaging": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "食品のパッケージデザイン・資材（包材）開発に必須の｜国家資格《こっかしかく》はない。美術・デザイン系の学校からパッケージデザイナーになるルートと、工学・化学系の学部から資材開発（素材・構造の設計）担当になるルートの大きく2つがある。",
    "routes": [
      {
        "routeName": "デザイン系からのルート",
        "routeType": "実務経験ルート",
        "steps": [
          {
            "stage": "高校",
            "requirementType": "education",
            "required": false,
            "description": "絵をかくのが好きだと役立つこともあるけど、決まったコースはないよ。"
          },
          {
            "stage": "美術大学・デザイン専門学校",
            "requirementType": "education",
            "required": false,
            "description": "デザインの学校でパッケージの作り方を勉強してから、会社に入る人が多い。"
          },
          {
            "stage": "採用試験・就職活動",
            "requirementType": "experience",
            "required": true,
            "description": "会社の採用試験を受けて、パッケージを考える部署に入る。"
          }
        ]
      },
      {
        "routeName": "工学・化学系からの資材開発ルート",
        "routeType": "実務経験ルート",
        "steps": [
          {
            "stage": "大学（工学部・農学部・化学系等）",
            "requirementType": "education",
            "required": false,
            "description": "材料やリサイクルのことを勉強した人が、包み方や容器を設計する係になることもある。"
          },
          {
            "stage": "入社後のOJT",
            "requirementType": "training",
            "required": false,
            "description": "会社に入ってから、包み方の専門知識を教えてもらいながら覚えていく。"
          }
        ]
      }
    ],
    "alternatives": "『包装管理士』という民間資格（公益社団法人日本包装技術協会が認定）があるが、これは受験に協会会員かつ包装関連業務4年以上の｜実務経験《じつむけいけん》が必要な、すでに働いている人向けのステップアップ資格であり、就職の入口資格ではない。",
    "canStartLater": true,
    "importantNotes": "｜国家資格《こっかしかく》は不要。味の素冷凍食品の生産技術（包装設計）職の社員インタビューでも『資格は必要ない。包装関連の知識は入社してから勉強すれば大丈夫』と明言されている。デザイン系・理工系のどちらからも道がある。",
    "factSources": [
      "OCA大阪デザイン&IT専門学校『パッケージデザイナーになるには？』 https://www.oca.ac.jp/work_books/5074/",
      "キャリアガーデン『パッケージデザイナーの仕事内容・なり方・年収・資格』 https://careergarden.jp/package-designer/",
      "公益社団法人日本包装技術協会（JPI）公式サイト https://www.jpi.or.jp/",
      "特種東海製紙グループ『パッケージプロフェッショナルの証「包装管理士」』 https://secure.tt-paper.co.jp/blog/knowledge/CK005",
      "日清食品株式会社 新卒採用サイト『職種紹介（包材開発）』 https://www.nissin.com/jp/recruit/nissinfoods/work/",
      "味の素冷凍食品 新卒採用サイト 生産技術（包装設計）社員インタビュー https://www.ffa.ajinomoto.com/recruit/interview/s02.html"
    ],
    "lastVerified": "2026-09-04"
  },
  "line-eng": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "工場の生産技術・設備保全の仕事に就くこと自体に必須の｜国家資格《こっかしかく》はない。工業高校・工学部（機械・電気）からの新卒採用や、製造現場からのOJTでの社内昇格など複数の入り口がある。ただし、工場内の一定規模以上の電気設備を扱う事業所は、法律（電気事業法）により『｜電気主任技術者《でんきしゅにんぎじゅつしゃ》』という｜国家資格《こっかしかく》者を最低1名選任することが義務づけられている（全員が持つ必要はない）。",
    "routes": [
      {
        "routeName": "工業高校・工学部からの新卒採用ルート",
        "routeType": "実務経験ルート",
        "steps": [
          {
            "stage": "高校（普通科・工業高校）",
            "requirementType": "education",
            "required": false,
            "description": "工業高校では機械や電気の勉強ができるけど、ふつうの高校からでもこの仕事は目指せる。"
          },
          {
            "stage": "大学・専門学校（機械・電気系等）",
            "requirementType": "education",
            "required": false,
            "description": "機械や電気を勉強した人が多いけど、ちがう分野を勉強していても、この仕事についた人がいるよ。"
          },
          {
            "stage": "採用試験・就職活動後のOJT",
            "requirementType": "experience",
            "required": false,
            "description": "はじめは工場のラインで働いて、そのあとで『ラインをよくする係』にかわることが多い。"
          }
        ]
      },
      {
        "routeName": "製造現場からの社内昇格ルート",
        "routeType": "未経験からのOJTルート",
        "steps": [
          {
            "stage": "｜実務経験《じつむけいけん》",
            "requirementType": "experience",
            "required": true,
            "description": "工場で機械を動かす仕事をしながら覚えていって、機械を直す係になる人もいる。"
          }
        ]
      },
      {
        "routeName": "国家資格取得で専門性を高めるルート（任意）",
        "routeType": "国家資格必須ルート（一部業務のみ）",
        "steps": [
          {
            "stage": "資格試験（任意）",
            "requirementType": "license",
            "required": false,
            "description": "『機械を直すプロ』や『電気の責任者』になる試験があって、取っておくと仕事の幅が広がるよ。全員が必ず取る必要はない。"
          }
        ]
      }
    ],
    "alternatives": "ボイラー技士など、工場で使う設備の種類によって取得が推奨・義務化される資格が別途あり得る（FACT_CHECK_REQUIRED: 具体的にどの設備区分でどの資格が法律上必須になるかは、事業場の設備規模・種類により異なるため個別確認が必要）。",
    "canStartLater": true,
    "importantNotes": "『生産技術・設備保全』は資格試験合格が入口条件の仕事ではない。｜電気主任技術者《でんきしゅにんぎじゅつしゃ》のように法律で選任が義務づけられた｜国家資格《こっかしかく》は存在するが、これは事業場に1名以上いればよい話であり、担当者全員が保有する必要があるものではない。工業高校でなくても、製造現場からのステップアップでこの仕事に就く人が多い。",
    "factSources": [
      "キユーピー株式会社 新卒採用サイト 生産技術職 社員インタビュー https://www.kewpie.com/recruit/employees/interview30/",
      "味の素冷凍食品 新卒採用サイト 生産技術（包装設計）社員インタビュー https://www.ffa.ajinomoto.com/recruit/interview/s02.html",
      "経済産業省『電気主任技術者』制度解説 https://www.meti.go.jp/information/license/c_text25.html",
      "一般財団法人電気技術者試験センター『電気主任技術者の資格概要』 https://www.shiken.or.jp/chief/about/",
      "国家検定 機械保全技能検定 公式サイト（公益社団法人日本プラントメンテナンス協会） https://www.kikaihozenshi.jp/",
      "厚生労働省『技のとびら』機械保全技能士 https://waza.mhlw.go.jp/shokushu/list/kikaihozen.html",
      "FOOD TOWN『食品工場の仕事で役立つ資格とは？』 https://food-town.jp/customer/news/detail/569",
      "日清食品株式会社 新卒採用サイト『職種紹介（生産技術）』 https://www.nissin.com/jp/recruit/nissinfoods/work/"
    ],
    "lastVerified": "2026-09-04"
  },
  "planner": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "イベントを企画する仕事に就くために法律で定められた資格や免許は無い。大学・短大・専門学校で企画やイベント運営を学んでからイベント会社・広告代理店・観光関連企業などに就職するルートが一般的だが、異業種からの転職やフリーランス、自治体職員・学校教員として祭りや学校行事を企画する立場になる道もある。",
    "routes": [
      {
        "routeName": "専門学校・大学から企業に就職するルート",
        "routeType": "教育機関ルート",
        "steps": [
          {
            "stage": "中学校・高校",
            "requirementType": "education",
            "required": false,
            "description": "中学・高校のうちに『これじゃなきゃダメ』というコースは無いよ。"
          },
          {
            "stage": "専門学校・大学",
            "requirementType": "education",
            "required": false,
            "description": "『イベントの勉強ができる学校』に行く人が多いけど、行かなくてもなれるよ。"
          },
          {
            "stage": "就職・採用試験",
            "requirementType": "experience",
            "required": true,
            "description": "会社に入って、先輩と一緒に企画づくりをしながら仕事を覚えていくよ。"
          }
        ]
      },
      {
        "routeName": "未経験・異業種からのOJTルート",
        "routeType": "未経験からのOJTルート",
        "steps": [
          {
            "stage": "｜実務経験《じつむけいけん》（他業種）",
            "requirementType": "experience",
            "required": false,
            "description": "他の仕事をしていた大人が、お祭りや行事の手伝いをきっかけにこの仕事に変わることもあるよ。"
          }
        ]
      },
      {
        "routeName": "公務員として企画に関わるルート",
        "routeType": "公務員試験ルート",
        "steps": [
          {
            "stage": "公務員試験・採用試験",
            "requirementType": "exam",
            "required": true,
            "description": "市役所や学校の先生になって、お祭りや行事を企画する係になる道もあるよ。"
          }
        ]
      }
    ],
    "alternatives": "フリーランスの企画者として独立する例、地域おこし協力隊としてイベント企画に関わる例もある。",
    "canStartLater": true,
    "importantNotes": "『イベント検定』『イベント業務管理士』などの民間資格が存在するが、いずれも任意の資格でありイベントプランナーになるための必須要件ではない。｜国家資格《こっかしかく》ではないため取得しなくてもこの仕事には就ける。",
    "factSources": [
      "イベントプランナーになるには｜スタディサプリ 進路 https://shingakunet.com/bunnya/w0015/x0223/naruniha/",
      "イベントプランナーになるには｜大学・専門学校のマイナビ進学 https://shingaku.mynavi.jp/future/shigoto/353/"
    ],
    "lastVerified": "2026-09-04"
  },
  "promoter": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "広報・PR担当になるために法律で定められた必須資格は無い。企業の広報部門に配属される、PR会社に就職する、他部署からの社内異動、フリーランスとして｜実務経験《じつむけいけん》を積むなど複数の入り口がある。",
    "routes": [
      {
        "routeName": "PR会社・企業広報部への就職ルート",
        "routeType": "教育機関ルート",
        "steps": [
          {
            "stage": "大学・専門学校",
            "requirementType": "education",
            "required": false,
            "description": "伝え方や情報の仕事を学べる学校に行く人もいるけど、必ずではないよ。"
          },
          {
            "stage": "就職・採用試験",
            "requirementType": "experience",
            "required": true,
            "description": "会社に入って、伝える文章の書き方やニュースの発信のしかたを覚えるよ。"
          }
        ]
      },
      {
        "routeName": "他部署からの社内異動・未経験からのOJTルート",
        "routeType": "未経験からのOJTルート",
        "steps": [
          {
            "stage": "｜実務経験《じつむけいけん》（他部署・他業種）",
            "requirementType": "experience",
            "required": false,
            "description": "別の仕事をしていた人が、社内で広報の係に変わることもよくあるよ。"
          }
        ]
      },
      {
        "routeName": "自治体広報として関わるルート",
        "routeType": "公務員試験ルート",
        "steps": [
          {
            "stage": "公務員試験・採用試験",
            "requirementType": "exam",
            "required": true,
            "description": "市役所に入って、まちのできごとをみんなに伝える係になる道もあるよ。"
          }
        ]
      }
    ],
    "alternatives": "フリーランスの広報・PRパーソンとして独立する例もある。",
    "canStartLater": true,
    "importantNotes": "『PRプランナー資格認定制度』は日本パブリックリレーションズ協会（PRSJ）が運営する民間資格であり、広報・PR職に就くための必須資格ではない。基礎知識の証明として役立つが、取得しなくても｜実務経験《じつむけいけん》でこの仕事に就くことは可能。",
    "factSources": [
      "広報（PR）になるには｜スキハジ https://web.anabuki-net.ne.jp/sukihaji/job/pr/",
      "広報PRで役立つ資格7選｜シェイプウィン株式会社 https://www.shapewin.co.jp/blog14331"
    ],
    "lastVerified": "2026-09-04"
  },
  "stage-manager": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "イベントや舞台の進行を組む『制作・舞台監督』の仕事に就くために法律で定められた必須資格は無い。劇団・劇場・イベント制作会社に就職し、演出部や舞台監督助手として下積みをしながら仕事を覚えるのが一般的なルート。",
    "routes": [
      {
        "routeName": "専門学校・演劇系大学からのルート",
        "routeType": "教育機関ルート",
        "steps": [
          {
            "stage": "専門学校・大学",
            "requirementType": "education",
            "required": false,
            "description": "舞台やイベントの作り方を学べる学校に行く人もいるけど、必須ではないよ。"
          },
          {
            "stage": "就職・下積み（助手からのスタート）",
            "requirementType": "experience",
            "required": true,
            "description": "はじめは先輩の手伝いから始めて、進行のつくり方を少しずつ覚えていくよ。"
          }
        ]
      },
      {
        "routeName": "未経験からのOJTルート",
        "routeType": "未経験からのOJTルート",
        "steps": [
          {
            "stage": "｜実務経験《じつむけいけん》（現場アルバイト等）",
            "requirementType": "experience",
            "required": false,
            "description": "イベントの現場を手伝ううちに、進行係の仕事を任されるようになることもあるよ。"
          }
        ]
      }
    ],
    "alternatives": "フリーランスの舞台監督として独立する例が多い。関連スキルを示す資格として『舞台機構調整技能士』（国家技能検定）、『照明技術者技能検定』（公益社団法人日本照明協会）、『音響技術者能力検定』（一般社団法人日本音響家協会、民間資格）があるが、いずれも舞台監督になるための必須資格ではない。",
    "canStartLater": true,
    "importantNotes": "『舞台監督』を名乗るための｜国家資格《こっかしかく》・免許は存在しない。関連する国家技能検定（舞台機構調整技能士）や業界団体の民間資格はスキル証明として活用されることがあるが、取得しなくてもこの仕事には就ける。FACT_CHECK_REQUIRED: 日本舞台監督協会による認定制度・会員基準の詳細は今回の検索で確認できなかったため、必要であれば同協会公式サイトで追加確認すること。",
    "factSources": [
      "舞台監督になるには？必要な資格・進路・キャリアパスまとめ https://sl-i.co.jp/2025/11/25/butaikantoku-careerpath/",
      "舞台監督への転職に資格は必要？｜職人BASE https://shokunin-base.com/blog/stage-manager-job-change-qualifications-20240531/"
    ],
    "lastVerified": "2026-09-04"
  },
  "venue-designer": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "ステージやブースの配置を考え設営する仕事（舞台美術・施工に近い）自体に必須資格は無いが、現場で使う重機や器具の操作には労働安全衛生法に基づく別の｜技能講習《ぎのうこうしゅう》が必要になる場合がある。",
    "routes": [
      {
        "routeName": "専門学校・大学からのルート",
        "routeType": "教育機関ルート",
        "steps": [
          {
            "stage": "専門学校・大学",
            "requirementType": "education",
            "required": false,
            "description": "空間や舞台のデザインを学べる学校に行く人もいるけど、必須ではないよ。"
          },
          {
            "stage": "就職・現場経験",
            "requirementType": "experience",
            "required": true,
            "description": "会社に入って、現場でステージの組み方や安全な作り方を覚えるよ。"
          }
        ]
      },
      {
        "routeName": "特定作業に必要な技能講習（労働安全衛生法）",
        "routeType": "実務経験ルート",
        "steps": [
          {
            "stage": "｜実務経験《じつむけいけん》＋｜技能講習《ぎのうこうしゅう》",
            "requirementType": "training",
            "required": true,
            "description": "重い機械を使うときだけ、その機械を使うための講習を受ける必要があるよ。全部の仕事に必要なわけじゃないよ。"
          }
        ]
      }
    ],
    "alternatives": "国家技能検定『舞台機構調整技能士』（1〜3級）は舞台機構の調整に関するスキル証明として活用できるが、会場設営・舞台美術の仕事に就くための必須資格ではない。",
    "canStartLater": true,
    "importantNotes": "『会場をつくる仕事』そのものに必須の免許は無いが、現場で扱う機械（クレーン・フォークリフト等）によっては労働安全衛生法上の｜技能講習《ぎのうこうしゅう》・｜特別教育《とくべつきょういく》が法律で義務づけられている点に注意。これは職業資格ではなく作業ごとの安全資格。",
    "factSources": [
      "【まとめ一覧】労働安全衛生法で必要な免許・技能講習・特別教育 https://skillnote.jp/knowledge/license2/",
      "舞台機構調整技能士＜国＞になるには｜スタディサプリ 進路 https://shingakunet.com/bunnya/w0015/x0222/",
      "舞台機構調整技能士 - Wikipedia https://ja.wikipedia.org/wiki/%E8%88%9E%E5%8F%B0%E6%A9%9F%E6%A7%8B%E8%AA%BF%E6%95%B4%E6%8A%80%E8%83%BD%E5%A3%AB"
    ],
    "lastVerified": "2026-09-04"
  },
  "sound-tech": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "マイクやスピーカーで会場に音を届けるPA（音響）エンジニアになるために法律で定められた必須資格は無い。音響専門学校・大学で学んでから音響制作会社等に就職するルートと、未経験から現場アシスタントとして経験を積むルートがある。",
    "routes": [
      {
        "routeName": "音響専門学校・大学からのルート",
        "routeType": "教育機関ルート",
        "steps": [
          {
            "stage": "専門学校・大学",
            "requirementType": "education",
            "required": false,
            "description": "音の仕組みや機材の使い方を学べる学校に行く人もいるけど、必須ではないよ。"
          },
          {
            "stage": "就職・現場経験",
            "requirementType": "experience",
            "required": true,
            "description": "会社に入って、マイクやスピーカーの使い方を現場で覚えていくよ。"
          }
        ]
      },
      {
        "routeName": "未経験からのOJTルート",
        "routeType": "未経験からのOJTルート",
        "steps": [
          {
            "stage": "｜実務経験《じつむけいけん》（現場アシスタント）",
            "requirementType": "experience",
            "required": false,
            "description": "現場のお手伝いから始めて、少しずつ音響の仕事を任されるようになることもあるよ。"
          }
        ]
      }
    ],
    "alternatives": "国家技能検定『舞台機構調整技能士』（音響部門を含む1〜3級）や、一般社団法人日本音響家協会が運営する民間資格『音響家技能認定』があるが、いずれもPAエンジニアになるための必須資格ではなくスキル証明として使われる。フリーランスとして独立する例も多い。",
    "canStartLater": true,
    "importantNotes": "『音響の仕事』をするために｜国家資格《こっかしかく》や免許は不要。関連する国家技能検定・民間資格は存在するが、取得は任意でありキャリアの証明として活用される位置づけ。",
    "factSources": [
      "PA・音響スタッフになるには｜専門学校 東京ビジュアルアーツ・アカデミー https://www.tva.ac.jp/naruniha/pa.html",
      "PAエンジニアになるには？｜札幌ミュージック＆ダンス・放送専門学校 https://www.ssm.ac.jp/career-debut/work_books/event/pa.html",
      "舞台機構調整技能士 - Wikipedia https://ja.wikipedia.org/wiki/%E8%88%9E%E5%8F%B0%E6%A9%9F%E6%A7%8B%E8%AA%BF%E6%95%B4%E6%8A%80%E8%83%BD%E5%A3%AB"
    ],
    "lastVerified": "2026-09-04"
  },
  "crowd-safety": {
    "qualificationRequired": false,
    "qualificationName": null,
    "pathSummary": "『警備員』個人になるために｜国家資格《こっかしかく》は不要で、18歳以上であれば｜警備業法《けいびぎょうほう》上の欠格事由（破産未復権、一定の前科・処分から5年未経過、暴力団関係者、アルコール・薬物中毒、心身の障害で業務遂行が困難等）に該当しない限りなれる。ただし雇い主となる『警備業者』は都道府県公安委員会の認定を受ける必要があり（｜警備業法《けいびぎょうほう》第4条）、警備員は法律で定められた新任教育（20時間以上）を受けることが義務づけられている。雑踏警備（イベント警備等）の一部区域では、｜警備業法《けいびぎょうほう》に定められた国家検定制度『警備員検定（｜雑踏警備業務検定《ざっとうけいびぎょうむけんてい》）』の合格警備員の配置が法令上義務づけられる場合がある点に注意。",
    "routes": [
      {
        "routeName": "18歳以上で警備業者に採用され警備員になるルート（検定なし）",
        "routeType": "未経験からのOJTルート",
        "steps": [
          {
            "stage": "年齢要件",
            "requirementType": "education",
            "required": true,
            "description": "警備の仕事は18歳になってから始められるよ。大人になってから始める仕事なんだ。"
          },
          {
            "stage": "欠格事由に該当しないこと",
            "requirementType": "license",
            "required": true,
            "description": "誰でもというわけではなく、法律で決まった『なれない条件』に当てはまらない人がなれるよ。"
          },
          {
            "stage": "警備業者への採用",
            "requirementType": "experience",
            "required": true,
            "description": "個人の試験ではなく、警備の会社に採用されて仕事が始まるよ。"
          },
          {
            "stage": "新任教育",
            "requirementType": "training",
            "required": true,
            "description": "働き始める前に、決められた時間の勉強・訓練を受けることが法律で決まっているよ。"
          }
        ]
      },
      {
        "routeName": "雑踏警備業務検定合格者として配置されるルート（一部現場で必要）",
        "routeType": "実務経験ルート",
        "steps": [
          {
            "stage": "警備員として｜実務経験《じつむけいけん》",
            "requirementType": "experience",
            "required": false,
            "description": "警備の仕事をしながら、雑踏警備の検定にチャレンジすることができるよ（先に警備員になっている必要はあるよ）。"
          },
          {
            "stage": "｜雑踏警備業務検定《ざっとうけいびぎょうむけんてい》2級の取得（任意、ただし一部現場で必須）",
            "requirementType": "license",
            "required": false,
            "description": "この検定はだれでも受けられて、必須じゃないよ。でも、すごく混雑が予想される場所では『検定に受かった警備員』を置かなければいけない決まりが国にあるんだ。"
          },
          {
            "stage": "｜雑踏警備業務検定《ざっとうけいびぎょうむけんてい》1級の取得（任意、2級合格後にのみ受験可）",
            "requirementType": "license",
            "required": false,
            "description": "1級は2級に受かってから、1年以上経験を積むと挑戦できるよ。もっと大きな現場では1級の人が必要になることもあるよ。"
          }
        ]
      }
    ],
    "alternatives": "警察官・消防官など公務員として群衆の安全に関わる仕事に就く道は別制度（公務員試験ルート）であり、民間警備員とは異なる。",
    "canStartLater": true,
    "importantNotes": "重要な誤解注意点: (1) 警備員になること自体に『資格試験』は無い。必要なのは18歳以上であることと欠格事由に該当しないこと、および採用後の法定教育（新任教育20時間以上）。(2) 『警備員検定（｜雑踏警備業務検定《ざっとうけいびぎょうむけんてい》など6種類、各1級・2級）』は｜警備業法《けいびぎょうほう》に定められた国家検定制度であり単なる民間資格ではないが、警備員になるための必須資格ではなく、特定の危険性の高い現場でのみ配置が法令上求められる資格である。この2点を混同して『警備員になるには｜国家資格《こっかしかく》が必須』と書かないこと。(3) 警備業を営む会社（警備業者）は都道府県公安委員会の認定（｜警備業法《けいびぎょうほう》第4条）が必要だが、これは会社に対する制度であり個人の警備員資格とは別物。",
    "factSources": [
      "警備業法 e-Gov法令検索（第3条・第4条・第14条・第18条ほか） https://laws.e-gov.go.jp/law/347AC0000000117",
      "警備員に年齢制限はある？｜警備のMT https://keibinomt.jp/security-guard-age/",
      "警備業法第14条（警備員の制限）｜keibee https://keibee.work/kyouiku/law/keibigyouhou14jou.html",
      "警備業務検定 - Wikipedia https://ja.wikipedia.org/wiki/%E8%AD%A6%E5%82%99%E6%A5%AD%E5%8B%99%E6%A4%9C%E5%AE%9A",
      "警備員検定合格証明書の取得方法｜警視庁 https://www.keishicho.metro.tokyo.lg.jp/tetsuzuki/keibi/k_keibi/gokaku/index.html",
      "雑踏警備業務の検定合格警備員の配置基準について｜徳島県警察 https://www.police.pref.tokushima.jp/07tetuduki/16802-2/index.html",
      "検定合格警備員の配置基準｜警視庁 https://www.keishicho.metro.tokyo.lg.jp/tetsuzuki/keibi/arrange.html",
      "警備員に対する教育時間｜警視庁 https://www.keishicho.metro.tokyo.lg.jp/tetsuzuki/keibi/k_keibi/education_time.html",
      "警備業に関する主な申請手続きの概要について｜広島県警察 https://www.pref.hiroshima.lg.jp/site/police/keibigyou.html"
    ],
    "lastVerified": "2026-09-04"
  }
};

export const getCareerPath = (professionId: string): CareerPath | undefined => CAREER_PATHS[professionId];
