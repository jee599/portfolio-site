import { useEffect, useState } from 'react';
import { EXPERIMENTS } from '../../data/home';

function LabDemo({ idx }: { idx: number }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setT((v) => v + 1), 80);
    return () => clearInterval(i);
  }, []);

  const demos = [
    <svg viewBox="0 0 400 70" style={{ width: '100%', height: '100%' }}>
      {Array.from({ length: 14 }).map((_, i) => {
        const w = 16 + ((i * 7 + t) % 24);
        const x = 16 + Array.from({ length: i }).reduce((s, _0, j) => s + 16 + ((j * 7 + t) % 24) + 4, 0);
        return <rect key={i} x={x} y={22} width={w} height={26} rx="5" fill={i % 3 === 0 ? '#3182F6' : '#D1D6DB'} />;
      })}
    </svg>,
    <svg viewBox="0 0 400 70" style={{ width: '100%', height: '100%' }}>
      <rect x="16" y="24" width="370" height="10" rx="5" fill="#E5E8EB" />
      <rect x="16" y="24" width={370 - ((t * 2) % 280) - 30} height="10" rx="5" fill="#3182F6" />
      <text x="16" y="58" fill="#3182F6" fontFamily="Pretendard" fontSize="13" fontWeight="700">−{70 + ((t * 3) % 20)}% ↓</text>
    </svg>,
    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#4E5968', padding: '14px 18px', lineHeight: 1.6, width: '100%' }}>
      <span style={{ color: '#3182F6' }}>❯</span> saju --now<br />
      <span style={{ color: '#191F28' }}>{'{ year: "丙午", month: "壬辰" }'}</span>
    </div>,
    <div style={{ padding: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ padding: '6px 10px', background: 'white', border: '1px solid #E5E8EB', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>안녕하세요</span>
      <span style={{ padding: '6px 10px', background: '#3182F6', color: 'white', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>저는 개발자</span>
      <span style={{ padding: '6px 10px', background: 'white', border: '1px solid #E5E8EB', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>입니다</span>
    </div>,
    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#4E5968', padding: 14, lineHeight: 1.7 }}>
      <div>22:00 · 커밋 a9f2</div>
      <div style={{ color: '#3182F6', fontWeight: 600 }}>22:04 · "쉼표 하나 수정"</div>
      <div>22:11 · 탭 닫음: hn</div>
    </div>,
    <div style={{ display: 'flex', gap: 6, padding: 14, alignItems: 'center', flexWrap: 'wrap' }}>
      {['/ghost', '/lol', '/index2', '/old', '/wp-admin'].map((s, i) => (
        <span
          key={i}
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            padding: '4px 8px',
            borderRadius: 6,
            background: i === ((t / 10) | 0) % 5 ? '#3182F6' : '#E5E8EB',
            color: i === ((t / 10) | 0) % 5 ? 'white' : '#4E5968',
            fontWeight: 600,
          }}
        >
          {s}
        </span>
      ))}
    </div>,
  ];
  return <div className="lab-demo">{demos[idx]}</div>;
}

export default function Lab() {
  return (
    <section id="lab" className="section alt" data-screen-label="02 Lab">
      <div className="container">
        <div className="section-head">
          <span className="section-kicker">실험실</span>
          <h2 className="section-title">일부러 덜 만든 것들</h2>
          <p className="section-sub">주말에 장난삼아 만든 작은 실험들. 완성도보다 재미를 먼저 봤어요.</p>
        </div>
        <div className="lab-grid">
          {EXPERIMENTS.map((e, i) => (
            <div className="lab-cell" key={e.num}>
              <div className="num">{e.num}</div>
              <h3 className="title">{e.title}</h3>
              <p className="desc">{e.desc}</p>
              <LabDemo idx={i} />
              <div className="foot">
                <span className="tag">{e.tag}</span>
                <span className="arrow">열어보기 →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
