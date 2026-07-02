'use client';

import { useEffect, useState } from 'react';
import OnboardingForm from '@/components/OnboardingForm';
import EmployeeCard from '@/components/EmployeeCard';
import Workbench from '@/components/Workbench';

const KEY = 'employee:profile';

export default function Page() {
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setProfile(JSON.parse(saved));
    } catch (e) { /* 忽略 */ }
    setReady(true);
  }, []);

  function hire(p) {
    setProfile(p);
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* 忽略 */ }
  }

  function retrain() {
    setProfile(null);
    try { localStorage.removeItem(KEY); } catch (e) { /* 忽略 */ }
  }

  if (!ready) return null;

  if (!profile) {
    return (
      <div className="onboarding">
        <div className="lanyard" />
        <div className="onboardHero">
          <h1>给你的品牌，雇一位<span className="hl">小红书运营专员</span></h1>
          <p>她叫阿桃。每天交付 3 套能直接发布的笔记：封面图、标题、正文、标签，一样不少。</p>
        </div>
        <div className="onboardGrid">
          <div className="onboardBadge">
            <EmployeeCard profile={null} />
            <div className="badgeCaption">填完右边的入职登记表，工牌即刻生效</div>
          </div>
          <OnboardingForm onHire={hire} />
        </div>
      </div>
    );
  }

  return <Workbench profile={profile} onRetrain={retrain} />;
}
