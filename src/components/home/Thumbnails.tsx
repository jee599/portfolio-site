import type { ReactNode } from 'react';

interface ThumbBaseProps {
  children: ReactNode;
  bg?: string;
}

function ThumbBase({ children, bg = '#F9FAFB' }: ThumbBaseProps) {
  return (
    <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
      <rect width="800" height="500" fill={bg} />
      {children}
    </svg>
  );
}

function ThumbGrid({ time = 0 }: { time?: number }) {
  const cells = [];
  const rows = 8, cols = 14;
  const highlight = new Set([
    '3,2','4,2','5,2','6,3','7,3','8,3','4,4','5,4','6,4','7,4','8,4','9,4',
    '5,5','6,5','7,5','8,5','9,5','10,5','6,6','7,6','8,6','9,6',
    '2,3','3,3','10,3','11,3','3,4','10,4','11,4','4,5','11,5',
  ]);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isLit = highlight.has(`${c},${r}`);
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={80 + c * 46}
          y={80 + r * 40}
          width={32}
          height={30}
          rx="6"
          fill={isLit ? '#3182F6' : '#E5E8EB'}
          opacity={isLit ? 0.6 + 0.4 * ((c + r + Math.floor(time * 2)) % 5) / 5 : 1}
        />,
      );
    }
  }
  return (
    <ThumbBase>
      {cells}
      <text x="80" y="440" fill="#8B95A1" fontFamily="Pretendard, sans-serif" fontSize="14" fontWeight="600">
        144 agents · routing
      </text>
    </ThumbBase>
  );
}

function ThumbNoise() {
  const bars = [];
  for (let i = 0; i < 42; i++) {
    const x = 80 + i * 16;
    const h = 30 + Math.abs(Math.sin(i * 0.4) * 90 + Math.cos(i * 0.9) * 60);
    const h2 = Math.max(6, h * (0.15 + (i % 5) * 0.02));
    bars.push(
      <g key={i}>
        <rect x={x} y={200 - h} width="10" height={h} rx="3" fill="#E5E8EB" />
        <rect x={x} y={280} width="10" height={h2} rx="3" fill="#3182F6" />
      </g>,
    );
  }
  return (
    <ThumbBase>
      <text x="80" y="80" fill="#8B95A1" fontFamily="Pretendard" fontSize="13" fontWeight="600">BEFORE · 42.1k</text>
      <text x="80" y="260" fill="#3182F6" fontFamily="Pretendard" fontSize="13" fontWeight="700">AFTER · 10.9k   −74%</text>
      {bars}
    </ThumbBase>
  );
}

function ThumbField() {
  const arcs = [];
  for (let i = 0; i < 6; i++) {
    arcs.push(
      <circle
        key={i}
        cx="400"
        cy="250"
        r={40 + i * 32}
        fill="none"
        stroke={i === 2 ? '#3182F6' : '#E5E8EB'}
        strokeWidth={i === 2 ? 2.5 : 1.5}
      />,
    );
  }
  const stems = ['甲', '丙', '戊', '庚'];
  const labels = stems.map((s, i) => {
    const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
    const x = 400 + Math.cos(a) * 130;
    const y = 250 + Math.sin(a) * 130;
    return (
      <g key={i}>
        <circle cx={x} cy={y} r="24" fill={i === 0 ? '#3182F6' : 'white'} stroke="#E5E8EB" strokeWidth="1.5" />
        <text x={x} y={y + 7} fill={i === 0 ? 'white' : '#191F28'} fontFamily="serif" fontSize="20" textAnchor="middle" fontWeight="600">{s}</text>
      </g>
    );
  });
  return (
    <ThumbBase>
      {arcs}
      {labels}
      <circle cx="400" cy="250" r="6" fill="#3182F6" />
      <text x="80" y="80" fill="#8B95A1" fontFamily="Pretendard" fontSize="13" fontWeight="600">四柱 · 사주</text>
      <text x="80" y="440" fill="#8B95A1" fontFamily="Pretendard" fontSize="13" fontWeight="500">생년월일시 → 네 기둥</text>
    </ThumbBase>
  );
}

function ThumbLines() {
  const lines = [];
  for (let i = 0; i < 5; i++) {
    const y = 140 + i * 50;
    let d = `M 80 ${y}`;
    for (let x = 80; x < 720; x += 8) {
      const amp = (i === 2 ? 24 : 10) * Math.sin((x + i * 30) * 0.04);
      d += ` L ${x} ${y + amp}`;
    }
    lines.push(
      <path key={i} d={d} stroke={i === 2 ? '#3182F6' : '#E5E8EB'} strokeWidth={i === 2 ? 2.5 : 1.5} fill="none" strokeLinecap="round" />,
    );
  }
  return (
    <ThumbBase>
      {lines}
      <text x="80" y="80" fill="#8B95A1" fontFamily="Pretendard" fontSize="13" fontWeight="600">음성 메모 · 00:02:41</text>
      <circle cx="700" cy="240" r="6" fill="#3182F6" />
    </ThumbBase>
  );
}

function ThumbBars() {
  const labels = ['OpenAI', 'Anthropic', 'Google', 'Meta', 'Mistral', 'Other'];
  const vals = [92, 78, 61, 42, 33, 54];
  return (
    <ThumbBase>
      <text x="80" y="70" fill="#8B95A1" fontFamily="Pretendard" fontSize="13" fontWeight="600">지난 24시간 · 437개 피드</text>
      {labels.map((l, i) => {
        const y = 100 + i * 46;
        const w = vals[i] * 5.5;
        return (
          <g key={l}>
            <text x="80" y={y + 20} fill="#191F28" fontFamily="Pretendard" fontSize="13" fontWeight="600">{l}</text>
            <rect x="200" y={y + 4} width={500} height="22" rx="11" fill="#E5E8EB" />
            <rect x="200" y={y + 4} width={w} height="22" rx="11" fill={i === 0 ? '#3182F6' : '#B0B8C1'} />
            <text x={210 + w} y={y + 20} fill="#8B95A1" fontFamily="Pretendard" fontSize="12" fontWeight="600">{vals[i]}</text>
          </g>
        );
      })}
    </ThumbBase>
  );
}

function ThumbTypographic() {
  return (
    <ThumbBase bg="#F2F4F6">
      <text x="400" y="300" fill="#191F28" fontFamily="Pretendard, sans-serif" fontSize="200" fontWeight="800" letterSpacing="-0.05em" textAnchor="middle">ji</text>
      <text x="400" y="360" fill="#3182F6" fontFamily="Pretendard" fontSize="16" fontWeight="600" textAnchor="middle" letterSpacing="0.1em">JIDONGLAB.COM</text>
      <text x="400" y="400" fill="#8B95A1" fontFamily="Pretendard" fontSize="13" fontWeight="500" textAnchor="middle">느릿하게 쓰는 노트 · 84 posts</text>
    </ThumbBase>
  );
}

function ThumbConcentric() {
  const ings = ['마늘', '김치', '밥', '고춧가루', '참기름', '계란', '대파', '햄'];
  const items = ings.map((ing, i) => {
    const a = (i / ings.length) * Math.PI * 2 - Math.PI / 2;
    const r = 160;
    const x = 400 + Math.cos(a) * r;
    const y = 250 + Math.sin(a) * r;
    return (
      <g key={i}>
        <line x1="400" y1="250" x2={x} y2={y} stroke="#E5E8EB" strokeWidth="1.5" />
        <circle cx={x} cy={y} r="22" fill="white" stroke={i === 1 ? '#3182F6' : '#E5E8EB'} strokeWidth={i === 1 ? 2 : 1.5} />
        <text x={x} y={y + 5} fill={i === 1 ? '#3182F6' : '#191F28'} fontFamily="Pretendard" fontSize="11" fontWeight="600" textAnchor="middle">{ing}</text>
      </g>
    );
  });
  return (
    <ThumbBase>
      <circle cx="400" cy="250" r="42" fill="#3182F6" />
      <text x="400" y="256" fill="white" fontFamily="Pretendard" fontSize="13" fontWeight="700" textAnchor="middle">레시피</text>
      {items}
    </ThumbBase>
  );
}

function ThumbWaves() {
  const posts = [];
  for (let i = 0; i < 44; i++) {
    const x = 80 + i * 16;
    const h = 16 + Math.abs(Math.sin(i * 0.5) * 50 + Math.cos(i * 0.3) * 30);
    posts.push(
      <rect key={i} x={x} y={280 - h} width="10" height={h * 2} rx="5" fill={i === 41 ? '#3182F6' : '#E5E8EB'} />,
    );
  }
  return (
    <ThumbBase>
      <text x="80" y="80" fill="#8B95A1" fontFamily="Pretendard" fontSize="13" fontWeight="600">61 posts · 매주 일요일</text>
      {posts}
      <text x="80" y="420" fill="#191F28" fontFamily="Pretendard" fontSize="22" fontWeight="700" letterSpacing="-0.02em">weekly, sunday nights</text>
    </ThumbBase>
  );
}

function ThumbDots() {
  const rows = ['KO', 'EN', 'JA'];
  const cols = 18;
  const tiles = [];
  rows.forEach((_row, r) => {
    for (let c = 0; c < cols; c++) {
      const seed = (r * cols + c) * 13;
      const v = (Math.sin(seed) + 1) / 2;
      const fill = v > 0.7 ? '#3182F6' : v > 0.4 ? (r === 0 ? '#B0B8C1' : '#D1D6DB') : '#E5E8EB';
      tiles.push(
        <rect key={`${r}-${c}`} x={120 + c * 34} y={140 + r * 66} width="28" height="52" rx="6" fill={fill} />,
      );
    }
  });
  return (
    <ThumbBase>
      <text x="80" y="80" fill="#8B95A1" fontFamily="Pretendard" fontSize="13" fontWeight="600">평가 결과 · 22 bundles</text>
      {rows.map((r, i) => (
        <text key={r} x="80" y={180 + i * 66} fill={i === 0 ? '#3182F6' : '#191F28'} fontFamily="Pretendard" fontSize="14" fontWeight="700">{r}</text>
      ))}
      {tiles}
    </ThumbBase>
  );
}

const THUMB_MAP: Record<string, (props: { time?: number }) => JSX.Element> = {
  grid: ThumbGrid,
  noise: ThumbNoise,
  field: ThumbField,
  lines: ThumbLines,
  bars: ThumbBars,
  typographic: ThumbTypographic,
  concentric: ThumbConcentric,
  waves: ThumbWaves,
  dots: ThumbDots,
};

export function ProjectThumb({ kind, time = 0 }: { kind: string; time?: number }) {
  const Comp = THUMB_MAP[kind] || ThumbGrid;
  return <Comp time={time} />;
}
