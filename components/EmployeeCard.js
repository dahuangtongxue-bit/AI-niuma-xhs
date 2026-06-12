// 工牌：数字员工的身份锚点
export default function EmployeeCard({ profile, mini = false }) {
  const joined = profile?.joinedAt || '';

  if (mini) {
    return (
      <div className="badgeMini">
        <span className="badgeMiniAvatar">🍑</span>
        <span>
          <b>阿桃</b>
          <i className="mono"> LK-001</i>
          <em className="badgeMiniDept">营销部 · 小红书运营专员</em>
        </span>
        <span className="statusDot" title="在岗" />
      </div>
    );
  }

  return (
    <div className="badgeCard">
      <div className="badgeHole" />
      <div className="badgeAvatar">🍑</div>
      <div className="badgeName">阿桃</div>
      <div className="badgeId mono">工号 LK-001</div>
      <div className="badgeDept">营销部 · 小红书运营专员</div>
      <div className="badgeSkills">
        {['选题策划', '爆款标题', '封面排版', '违禁词风控'].map((s) => (
          <span className="chip" key={s}>{s}</span>
        ))}
      </div>
      <div className="badgeFoot">
        <span>{joined ? `入职 ${joined}` : '待入职'}</span>
        <span className="stamp">试用期</span>
      </div>
    </div>
  );
}
