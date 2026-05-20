import { PROJECT_IMAGE } from '../../data/home';

type Variant = 'card' | 'featured';

interface Props {
  slug: string;
  title: string;
  variant?: Variant;
}

// Renders a project visual: screenshot from /public when available, otherwise
// a slug-specific SVG sketch. The container shape is shared so cards align.
export function ProjectThumb({ slug, title, variant = 'card' }: Props) {
  const img = PROJECT_IMAGE[slug];
  const cls = `thumb thumb-${variant}` + (img ? ' thumb-has-img' : ' thumb-has-vis');
  if (img) {
    return (
      <div className={cls}>
        <img src={img} alt={title} loading="lazy" decoding="async" />
      </div>
    );
  }
  return (
    <div className={cls} aria-hidden="true">
      <span className="thumb-slug">{slug}</span>
      <Visual slug={slug} />
    </div>
  );
}

function Visual({ slug }: { slug: string }) {
  switch (slug) {
    case 'contextzip':
      // Token compression — long bars collapsing into short ones.
      return (
        <svg viewBox="0 0 200 110" preserveAspectRatio="xMidYMid meet">
          <rect x="20" y="22" width="160" height="8" fill="currentColor" opacity="0.16" />
          <rect x="20" y="38" width="160" height="8" fill="currentColor" opacity="0.12" />
          <rect x="20" y="54" width="140" height="8" fill="currentColor" opacity="0.10" />
          <rect x="20" y="74" width="44" height="8" fill="currentColor" />
          <rect x="20" y="88" width="28" height="8" fill="currentColor" />
        </svg>
      );
    case 'claudebook':
      // Book spine — title block + horizontal rules.
      return (
        <svg viewBox="0 0 200 110" preserveAspectRatio="xMidYMid meet">
          <rect x="76" y="14" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <text x="100" y="46" textAnchor="middle" fontFamily="serif" fontSize="28" fill="currentColor">C</text>
          <line x1="40" y1="74" x2="160" y2="74" stroke="currentColor" strokeWidth="0.8" />
          <line x1="40" y1="82" x2="160" y2="82" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
          <line x1="40" y1="90" x2="120" y2="90" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
        </svg>
      );
    case 'agentcrow':
      // Dispatcher — one root node fanning out to specialists.
      return (
        <svg viewBox="0 0 200 110" preserveAspectRatio="xMidYMid meet">
          <line x1="32" y1="55" x2="160" y2="22" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
          <line x1="32" y1="55" x2="160" y2="40" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
          <line x1="32" y1="55" x2="160" y2="55" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
          <line x1="32" y1="55" x2="160" y2="70" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
          <line x1="32" y1="55" x2="160" y2="88" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
          <circle cx="32" cy="55" r="5" fill="currentColor" />
          {[22, 40, 55, 70, 88].map((y) => (
            <circle key={y} cx="160" cy={y} r="2.4" fill="currentColor" />
          ))}
        </svg>
      );
    case 'clisync':
      // Sync — two terminals + bidirectional arrows.
      return (
        <svg viewBox="0 0 200 110" preserveAspectRatio="xMidYMid meet">
          <rect x="22" y="30" width="48" height="50" fill="none" stroke="currentColor" strokeWidth="1" />
          <rect x="130" y="30" width="48" height="50" fill="none" stroke="currentColor" strokeWidth="1" />
          <line x1="30" y1="40" x2="50" y2="40" stroke="currentColor" strokeWidth="0.8" />
          <line x1="138" y1="40" x2="158" y2="40" stroke="currentColor" strokeWidth="0.8" />
          <line x1="70" y1="48" x2="130" y2="48" stroke="currentColor" strokeWidth="0.8" />
          <polyline points="124,44 130,48 124,52" fill="none" stroke="currentColor" strokeWidth="0.8" />
          <line x1="130" y1="62" x2="70" y2="62" stroke="currentColor" strokeWidth="0.8" />
          <polyline points="76,58 70,62 76,66" fill="none" stroke="currentColor" strokeWidth="0.8" />
        </svg>
      );
    case 'claude-code-source-analysis':
      // Code dive — indented brackets, line-count vibe.
      return (
        <svg viewBox="0 0 200 110" preserveAspectRatio="xMidYMid meet">
          <g fontFamily="monospace" fontSize="9" fill="currentColor">
            <text x="20" y="22">function dispatch(</text>
            <text x="32" y="38">agents: Agent[],</text>
            <text x="32" y="54">ctx: Context,</text>
            <text x="20" y="70">) {'{'}</text>
            <text x="32" y="86">return …</text>
            <text x="20" y="102">{'}'}</text>
          </g>
          <line x1="170" y1="14" x2="170" y2="104" stroke="currentColor" strokeWidth="0.4" opacity="0.4" />
        </svg>
      );
    default:
      // Generic dot field — kept for any future slug without a custom visual.
      return (
        <svg viewBox="0 0 200 110" preserveAspectRatio="xMidYMid meet">
          {Array.from({ length: 9 }).map((_, col) =>
            Array.from({ length: 5 }).map((_, row) => (
              <circle
                key={`${col}-${row}`}
                cx={20 + col * 20}
                cy={15 + row * 20}
                r={1.5}
                fill="currentColor"
                opacity={0.4 + ((col + row) % 3) * 0.2}
              />
            ))
          )}
        </svg>
      );
  }
}
