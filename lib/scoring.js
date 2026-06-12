import { checkText } from './bannedWords';

// 钩子词表：用于"前6字定生死"硬判定
const HOOK_WORDS = [
  '后悔', '千万别', '别再', '原来', '谁懂', '我不允许', '为什么', '求求',
  '终于', '直接抄', '保姆级', '避坑', '雷区', '平替', '跟风', '劝你',
  '被问爆', '码住', '说点大实话', '一篇讲透', '必看', '看过来', '搞定',
];

// 含数字/价格/时长等具体信息
const SPECIFIC_RE = /([0-9０-９]+|[一二两三四五六七八九十百千万]+)\s*(个|条|天|元|块|步|招|款|年|月|周|分钟|斤|岁|位|篇|家|次|%|w|W|k|K)?/;

/** 硬规则判定（纯代码，不依赖模型） */
export function hardCheck(title) {
  const t = (title || '').trim();
  const issues = checkText(t);
  const blocked = issues.filter((i) => i.severity === 'block');
  const first6 = t.slice(0, 6);
  return {
    len: t.length,
    lenOK: t.length > 0 && t.length <= 20,
    blocked,
    warns: issues.filter((i) => i.severity === 'warn'),
    hookInFirst6: HOOK_WORDS.some((w) => first6.includes(w.slice(0, 6))),
    hasSpecific: SPECIFIC_RE.test(t),
  };
}

/**
 * 合并打分：模型 4 维（钩子/搜索/人群/具体，各0-2）+ 代码"合规长度"维（0-2）
 * 总分10，≥7 合格；命中 block 级违禁词或超长直接不合格
 */
export function combineScore(title, judgeDims, why) {
  const h = hardCheck(title);
  const dims = Array.isArray(judgeDims) && judgeDims.length === 4
    ? judgeDims.map((d) => Math.max(0, Math.min(2, Number(d) || 0)))
    : [0, 0, 0, 0];

  // 代码侧校准：检测到具体数字但模型给"具体程度"0分时，兜底为1
  if (h.hasSpecific && dims[3] === 0) dims[3] = 1;

  const complianceDim = h.lenOK && h.blocked.length === 0 ? 2 : 0;
  const total = dims.reduce((a, b) => a + b, 0) + complianceDim;

  const reasons = [];
  if (!h.lenOK) reasons.push(`超长（${h.len}字>20）`);
  for (const b of h.blocked) reasons.push(`违禁词「${b.word}」(${b.label})`);
  if (why) reasons.push(why);
  if (h.warns.length) reasons.push(`复查：${h.warns.map((w) => w.word).join('、')}`);

  return {
    total,
    pass: total >= 7 && h.lenOK && h.blocked.length === 0,
    dims: { 钩子: dims[0], 搜索: dims[1], 人群: dims[2], 具体: dims[3], 合规: complianceDim },
    reasons,
    warns: h.warns,
  };
}
