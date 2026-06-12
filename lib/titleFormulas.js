// 《小红书标题公式库 v1》结构化版本（完整说明见 docs/小红书标题公式库_v1.md）
// 字段：id 编号 / cat 大类 / catName 类名 / name 公式名 / tpl 模板 / ex 例句

export const FORMULAS = [
  { id: '01', cat: 'A', catName: '悬念钩子', name: '后悔式', tpl: '后悔没早点知道的{N}个{X}', ex: '后悔没早点知道的5个装修细节' },
  { id: '02', cat: 'A', catName: '悬念钩子', name: '隐瞒式', tpl: '{行业角色}不会告诉你的{N}个{秘密}', ex: '房产中介不会告诉你的7个砍价点' },
  { id: '03', cat: 'A', catName: '悬念钩子', name: '反常识', tpl: '原来{常识行为}根本不用{默认做法}', ex: '原来洗水果根本不用盐' },
  { id: '04', cat: 'A', catName: '悬念钩子', name: '不允许式', tpl: '我不允许还有人不知道{X}', ex: '我不允许还有人不知道这个免费工具' },
  { id: '05', cat: 'A', catName: '悬念钩子', name: '结局前置', tpl: '用了{时长}，我把{X}退了/扔了', ex: '用了三个月，我把扫地机器人退了' },
  { id: '06', cat: 'A', catName: '悬念钩子', name: '提问式', tpl: '为什么你的{X}总是{负面结果}？', ex: '为什么你的笔记总是没流量？' },
  { id: '07', cat: 'A', catName: '悬念钩子', name: '警告式', tpl: '别再{错误行为}了！真的会{后果}', ex: '别再这样敷面膜了！' },
  { id: '08', cat: 'B', catName: '数字盘点', name: '清单式', tpl: '{N}个{X}，第{M}个绝了', ex: '8个相见恨晚的Mac技巧，第5个绝了' },
  { id: '09', cat: 'B', catName: '数字盘点', name: '时间+结果', tpl: '{时长}，从{A}到{B}', ex: '30天，从0粉到接到第一条广告' },
  { id: '10', cat: 'B', catName: '数字盘点', name: '价格锚点', tpl: '{X}元搞定{贵的事}', ex: '99元搞定全屋香氛' },
  { id: '11', cat: 'B', catName: '数字盘点', name: '讲透式', tpl: '一篇讲透{X}／{X}保姆级整理', ex: '一篇讲透五险一金' },
  { id: '12', cat: 'B', catName: '数字盘点', name: '倍数式', tpl: '让{X}翻倍的{N}个习惯', ex: '让出图效率翻倍的5个AI指令' },
  { id: '13', cat: 'C', catName: '痛点共鸣', name: '身份+痛点', tpl: '{身份}谁懂啊，{扎心场景}', ex: '打工人谁懂啊，纪要写一晚' },
  { id: '14', cat: 'C', catName: '痛点共鸣', name: '冤种自嘲', tpl: '我就是那个{踩坑行为}的冤种', ex: '我就是那个办卡只去两次的冤种' },
  { id: '15', cat: 'C', catName: '痛点共鸣', name: '嘴替式', tpl: '终于有人把{X}说清楚了', ex: '终于有人把社保断缴说清楚了' },
  { id: '16', cat: 'C', catName: '痛点共鸣', name: '确认式', tpl: '{痛点}的姐妹，你不是一个人', ex: '减脂期想吃甜的姐妹，你不是一个人' },
  { id: '17', cat: 'D', catName: '身份圈定', name: '人群点名', tpl: '{年龄/职业/城市}的姐妹看过来', ex: '30+纠结转行的姐妹看过来' },
  { id: '18', cat: 'D', catName: '身份圈定', name: '阶段限定', tpl: '新手/第一次{做某事}必看', ex: '第一次租房必看的12个细节' },
  { id: '19', cat: 'D', catName: '身份圈定', name: '地域限定', tpl: '在{城市}的人才懂{X}', ex: '在兰州的人才懂这碗面的含金量' },
  { id: '20', cat: 'D', catName: '身份圈定', name: '预算圈定', tpl: '月薪{X}如何{体面做某事}', ex: '月薪8千如何攒下3千' },
  { id: '21', cat: 'E', catName: '结果展示', name: '前后对比', tpl: '从{A}到{B}，我只做对了{N}件事', ex: '从月光到存款10万，只做对3件事' },
  { id: '22', cat: 'E', catName: '结果展示', name: '数据晒单', tpl: '靠{方法}，我{可量化结果}', ex: '靠下班2小时，副业月入4位数' },
  { id: '23', cat: 'E', catName: '结果展示', name: '坚持式', tpl: '{做某事}的第{N}天，{变化}', ex: '用AI写文案的第30天' },
  { id: '24', cat: 'E', catName: '结果展示', name: '被夸式', tpl: '被问爆的{X}，统一回复', ex: '被问爆的客厅灯，统一回复' },
  { id: '25', cat: 'F', catName: '对比反差', name: '平替式', tpl: '{大牌}的平替，我找到了', ex: '戴森吹风机的平替，我找到了' },
  { id: '26', cat: 'F', catName: '对比反差', name: '跟风翻车', tpl: '跟风买{X}，结果……', ex: '跟风买了网红蒸锅，结果……' },
  { id: '27', cat: 'F', catName: '对比反差', name: '雷区+真香', tpl: '{N}个雷区和{M}个真香', ex: '宜家：5个雷区和8个真香' },
  { id: '28', cat: 'F', catName: '对比反差', name: '二选一裁决', tpl: '{A}和{B}到底选哪个？一句话说清', ex: '定投和存款选哪个？一句话说清' },
  { id: '29', cat: 'G', catName: '教程干货', name: '保姆级', tpl: '保姆级{X}教程，跟着做就行', ex: '保姆级公积金提取教程' },
  { id: '30', cat: 'G', catName: '教程干货', name: '步骤化', tpl: '{N}步搞定{X}', ex: '3步搞定签证照片' },
  { id: '31', cat: 'G', catName: '教程干货', name: '合集码住', tpl: '{X}合集，码住慢慢看', ex: '免费学剪辑的网站合集' },
  { id: '32', cat: 'G', catName: '教程干货', name: '避坑指南', tpl: '{X}避坑指南｜坑都写这了', ex: '装修避坑指南｜踩过17个坑' },
  { id: '33', cat: 'G', catName: '教程干货', name: '直接抄', tpl: '直接抄！{X}模板/话术', ex: '直接抄！和领导提涨薪的话术' },
  { id: '34', cat: 'H', catName: '紧迫稀缺', name: '限时式', tpl: '再不{行动}就来不及了', ex: '再不囤秋装就来不及了' },
  { id: '35', cat: 'H', catName: '紧迫稀缺', name: '趋势式', tpl: '今年{季节}都在{X}', ex: '今年秋冬都在穿的恬淡风' },
  { id: '36', cat: 'H', catName: '紧迫稀缺', name: '圈内式', tpl: '{圈子}都在偷偷用的{X}', ex: '运营圈都在偷偷用的选题网站' },
  { id: '37', cat: 'I', catName: '情绪态度', name: '暴论式', tpl: '{X}就是最大的{负面定性}', ex: '囤货就是最大的消费陷阱' },
  { id: '38', cat: 'I', catName: '情绪态度', name: '大实话', tpl: '说点大实话：关于{X}', ex: '说点大实话：关于裸辞做自媒体' },
  { id: '39', cat: 'I', catName: '情绪态度', name: '劝退式', tpl: '劝你别轻易{入坑某事}', ex: '劝你别轻易买投影仪' },
  { id: '40', cat: 'J', catName: '互动钩', name: '求助式', tpl: '求求了，谁懂{X}怎么办', ex: '求求了，谁懂猫半夜跑酷怎么办' },
  { id: '41', cat: 'J', catName: '互动钩', name: '投票式', tpl: '{A}还是{B}？评论区吵起来了', ex: '电子请柬还是纸质？评论区吵起来了' },
];

// 注入提示词用的压缩摘要
export function formulasDigest() {
  const byCat = {};
  for (const f of FORMULAS) {
    const k = `${f.cat}类·${f.catName}`;
    (byCat[k] = byCat[k] || []).push(`${f.id}${f.name}「${f.tpl}」`);
  }
  return Object.entries(byCat)
    .map(([k, list]) => `${k}：${list.join('；')}`)
    .join('\n');
}
