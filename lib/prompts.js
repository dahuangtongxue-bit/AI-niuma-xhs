import { formulasDigest } from './titleFormulas';
import { TEMPLATE_SPEC } from '@/components/covers/templates';
import { currentDnaBlock } from './dna';

const JSON_ONLY = '只输出 JSON 本体，禁止输出任何解释、前言、markdown 代码围栏。';

function profileBrief(p) {
  const dnaBlock = currentDnaBlock();
  const sig = (p.signatures || []).filter(Boolean).map((s) => `  · ${s}`).join('\n');
  const diff = (p.differentiators || []).filter(Boolean).map((s) => `  · ${s}`).join('\n');
  const hl = (p.highlights || []).filter(Boolean).map((s) => `  · ${s}`).join('\n');
  return [
    dnaBlock ? dnaBlock + '\n\n【员工本地补充档案（若与品牌DNA冲突，以品牌DNA为准）】' : '',
    `【店名】${p.name || p.product || '（未提供，绝不可自行编造店名）'}`,
    p.category ? `【品类】${p.category}` : '',
    (p.city || p.area) ? `【位置】${[p.city, p.area].filter(Boolean).join(' ')}` : '',
    p.persona ? `【人设/口吻】${p.persona}` : '',
    p.perCapita ? `【人均】${p.perCapita}` : '',
    p.hours ? `【营业时间】${p.hours}` : '',
    sig ? `【真实招牌项目（只能写这些，不得新增编造菜品/服务）】\n${sig}` : '',
    diff ? `【真实差异点】\n${diff}` : '',
    hl ? `【可写成笔记的真实亮点】\n${hl}` : '',
    p.audience ? `【目标人群】${p.audience}` : '',
    `【语气风格】${p.tone || '亲切真实'}`,
    p.landing ? `【引流/到店信息（必须自然写进笔记结尾，作为行动指引）】${p.landing}` : '',
    p.tabooConfirmed ? `【禁止写入（疑似夸大宣传）】${p.tabooConfirmed}` : '',
  ].filter(Boolean).join('\n');
}

// 真实创作铁律：所有引擎共用，杜绝编造
const REALITY_RULE = `\n\n【真实创作铁律 · 最高优先级】
1. 你是这家**真实店铺自己的运营**，不是写虚构探店。笔记里出现的店名、地址、菜品、价格、故事，**必须全部来自上面的真实档案**。
2. 档案里没有的店名/分店/菜品/数据，**一律不许编造**，也不要写"某网红店""听说"这类含糊指代。
3. 招牌只能从【真实招牌项目】里选，可以围绕真实细节展开描写，但不能无中生有加新菜。
4. 笔记要以"本店视角/老板视角"写，让看到的人知道这就是这家店在自我介绍或分享，并据此能找上门。
5. 结尾自然带上【引流/到店信息】，给出明确的到店或联系指引（小红书规则内：可引导看主页定位、到店报暗号、私信预约等）。`

/** 选题引擎 */
export function topicPrompt(profile, hotTopics) {
  const system = `你是「阿桃」，一名资深小红书运营专员，擅长为商家做能跑出流量的选题策划。你的选题原则：
1. 必须从目标人群的真实痛点、搜索习惯、决策场景出发，不做自嗨式品牌宣传
2. 5个选题必须覆盖不同内容类型（干货教程/测评对比/合集清单/观点态度/场景种草），互不雷同
3. 每个选题都要绑定一个用户真的会去搜的关键词
4. 选题必须能用本店【真实招牌/差异点/亮点】写出来，不得策划需要编造事实才能完成的选题
${hotTopics ? '5. 老板今天投喂了热点情报，至少 2 个选题要自然结合热点，但禁止生硬蹭' : ''}${REALITY_RULE}
${JSON_ONLY}`;

  const user = `这是我的入职档案：
${profileBrief(profile)}
${hotTopics ? `\n今日热点情报（老板投喂）：\n${hotTopics}` : ''}

请给出今天的 5 个选题，按这个 JSON 结构输出：
{"topics":[{"title":"选题名（一句话）","type":"内容类型","angle":"切入角度（30字内）","keyword":"绑定的搜索关键词","reason":"为什么这个选题能跑（40字内）"}]}`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

/** 单篇笔记生产：10个候选标题 + 正文 + 标签 + 封面文案 */
export function notePrompt(profile, topic, feed) {
  const system = `你是「阿桃」，资深小红书运营专员。你写笔记严格遵守以下工艺标准：

【标题工艺】使用《标题公式库》创作，下面是公式摘要：
${formulasDigest()}
要求：产出 10 个候选标题；必须覆盖至少 4 个不同大类；每条 ≤20 字；前 6 字必须出现钩子词或核心关键词；标注所用公式编号。
违禁词（绝不可出现）：最X/第一/100%/国家级/治疗/根治/稳赚/躺赚/微信/VX/加我/私聊。

【正文工艺】350~600字。前两行必须是钩子（信息流折叠位，决定打开率）；口语化短句，多分段，每段≤3行；适度 emoji（每段最多1个）；中部干货必须具体可执行，禁止空话；结尾固定一个互动问题引导评论。

【标签工艺】5~8个：1~2个泛领域大词 + 3~4个垂类精准词 + 必须包含选题绑定的搜索关键词。

【封面文案工艺】从以下版式中选最匹配选题类型的一个，并按其字段规格填写文案：
${TEMPLATE_SPEC}
封面主标题 ≤9 个字（硬上限），必须比笔记标题更短更狠；highlight 必须是主标题的子串。
另写 bgPrompt：封面底图的画面描述（中文 40~70 字），真实摄影感——主体+环境+光线+氛围；画面里禁止出现任何文字/字母/logo/水印，禁止人脸特写。

${REALITY_RULE}
${JSON_ONLY}`;

  const user = `入职档案：
${profileBrief(profile)}

今日选题：${topic.title}
切入角度：${topic.angle}
搜索关键词：${topic.keyword}
内容类型：${topic.type}
${feed ? `
【本篇老板特别投喂——必须严格遵循】
· 本篇主题/角度：${feed.theme}
· 文风要求：${feed.tone}
${feed.structureKey && feed.structureKey !== 'auto' ? `· 结构要求：${feed.structure}` : ''}
${feed.photos && feed.photos.length ? `· 老板提供了 ${feed.photos.length} 张本店真实照片作为配图，正文可自然提及画面内容，但不得脑补照片里没有的东西。` : ''}
注意：本篇要紧扣上面的主题来写，文风严格按要求，不要跑回泛泛的店铺介绍。` : ''}

请按这个 JSON 结构输出：
{
"titles":[{"text":"标题","formula":"公式编号"}],
"body":"正文（用\\n分段）",
"tags":["#标签1","#标签2"],
"cover":{"template":"版式ID","scheme":"配色ID","title":"封面主标题≤9字","highlight":"主标题中要高亮的词","sub":"副标题≤16字","num":"数字（仅V03需要）","unit":"单位（仅V03需要）","points":["要点1","要点2","要点3"],"badge":"角标词≤4字","bgPrompt":"封面底图画面描述40-70字"},
"tip":"一句发布建议（时间段+原因，30字内）"
}`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

/** 质检评委：对10个标题打4维分 */
export function judgePrompt(titles, profile) {
  const system = `你是小红书内容质检员，按打分卡给标题打分，每个维度 0-2 分：
- 钩子强度：0=平铺直叙；1=有钩子；2=前6字即出现强钩子
- 搜索价值：0=无人会搜；1=含相关词；2=核心搜索词在前8字
- 人群指向：0=写给所有人（=没人）；1=隐含人群；2=一眼知道写给谁
- 具体程度：0=全是形容词；1=有一定具体信息；2=含具体数字/价格/时长/品名
打分要严格拉开差距，禁止全给2分。${JSON_ONLY}`;

  const user = `目标人群：${profile.audience}
核心搜索词参考：${profile.industry}

待打分标题：
${titles.map((t, i) => `${i}. ${t}`).join('\n')}

按这个 JSON 结构输出（i 为标题序号，s 为四维分数组[钩子,搜索,人群,具体]，why 为≤15字短评）：
[{"i":0,"s":[2,1,2,1],"why":"短评"}]`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}
