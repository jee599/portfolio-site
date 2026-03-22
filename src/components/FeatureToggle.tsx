import { useState, useEffect, useCallback } from 'react';

const FEATURES = [
  { key: 'vt', label: 'View Transitions' },
  { key: 'gsap', label: 'GSAP Scroll' },
  { key: 'cursor', label: 'Cursor Effect' },
  { key: 'bento', label: 'Bento Grid' },
  { key: 'scroll', label: 'Scroll Animations' },
  { key: 'aurora', label: 'Aurora BG' },
] as const;

type FeatureKey = (typeof FEATURES)[number]['key'];
type FeatureState = Record<FeatureKey, boolean>;

const STORAGE_KEY = 'feature-toggles';

const getDefaultState = (): FeatureState =>
  Object.fromEntries(FEATURES.map((f) => [f.key, true])) as FeatureState;

const loadState = (): FeatureState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw);
    const defaults = getDefaultState();
    // Merge with defaults so new keys always exist
    return { ...defaults, ...parsed };
  } catch {
    return getDefaultState();
  }
};

const syncAttributes = (state: FeatureState) => {
  FEATURES.forEach(({ key }) => {
    document.documentElement.setAttribute(
      `data-ft-${key}`,
      state[key] ? 'on' : 'off'
    );
  });
};

export default function FeatureToggle() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FeatureState>(getDefaultState);

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
    syncAttributes(loaded);
  }, []);

  const toggle = useCallback((key: FeatureKey) => {
    setState((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      syncAttributes(next);
      return next;
    });
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {/* Panel */}
      <div
        style={{
          width: 240,
          background: '#0f172a',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          transformOrigin: 'bottom right',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
          opacity: open ? 1 : 0,
          transform: open ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(8px)',
          pointerEvents: open ? 'auto' : 'none',
          marginBottom: 8,
          padding: open ? '16px' : '0 16px',
          maxHeight: open ? 400 : 0,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 12,
          }}
        >
          Feature Toggles
        </div>
        {FEATURES.map(({ key, label }) => (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: state[key] ? '#22c55e' : '#64748b',
                  transition: 'background 0.2s ease',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 12, color: '#e2e8f0' }}>{label}</span>
            </div>
            {/* Toggle switch */}
            <button
              type="button"
              onClick={() => toggle(key)}
              aria-label={`Toggle ${label}`}
              style={{
                position: 'relative',
                width: 36,
                height: 20,
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                background: state[key] ? '#22c55e' : '#334155',
                transition: 'background 0.2s ease',
                padding: 0,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: state[key] ? 18 : 2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Gear button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle feature panel"
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: 'none',
          background: '#0f172a',
          color: '#94a3b8',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          transition: 'transform 0.3s ease, color 0.2s ease',
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          marginLeft: 'auto',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    </div>
  );
}
