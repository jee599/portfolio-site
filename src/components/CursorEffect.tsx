import { useEffect, useRef } from 'react';

const GLOW_RADIUS = 20;
const GLOW_COLOR = 'rgba(37, 99, 235, 0.15)';
const MAX_TILT_DEG = 8;
const LERP_FACTOR = 0.15;
const RESET_TRANSITION = 'transform 0.4s ease-out';

function isEnabled(): boolean {
  return document.documentElement.dataset.ftCursor === 'on';
}

export default function CursorEffect() {
  const glowRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const glowPos = useRef({ x: 0, y: 0 });
  const rafId = useRef<number>(0);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    const updateGlowVisibility = () => {
      glow.style.display = isEnabled() ? 'block' : 'none';
    };
    updateGlowVisibility();

    // Lerp loop for cursor glow
    const tick = () => {
      if (isEnabled()) {
        glowPos.current.x += (mousePos.current.x - glowPos.current.x) * LERP_FACTOR;
        glowPos.current.y += (mousePos.current.y - glowPos.current.y) * LERP_FACTOR;
        glow.style.transform = `translate(${glowPos.current.x - GLOW_RADIUS}px, ${glowPos.current.y - GLOW_RADIUS}px)`;
        glow.style.display = 'block';
      }
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);

    // Track mouse position globally
    const onMouseMove = (e: MouseEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
    };

    // Card tilt handlers
    const onCardMouseMove = (e: MouseEvent) => {
      if (!isEnabled()) return;
      const card = e.currentTarget as HTMLElement;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Normalize to -1..1
      const normalX = (x - centerX) / centerX;
      const normalY = (y - centerY) / centerY;

      const rotateY = normalX * MAX_TILT_DEG;
      const rotateX = -normalY * MAX_TILT_DEG;

      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      card.style.transition = 'none';

      // Shine overlay
      const shine = card.querySelector('[data-cursor-shine]') as HTMLElement | null;
      if (shine) {
        const percentX = (x / rect.width) * 100;
        const percentY = (y / rect.height) * 100;
        shine.style.background = `radial-gradient(circle at ${percentX}% ${percentY}%, rgba(255,255,255,0.15) 0%, transparent 60%)`;
        shine.style.opacity = '1';
      }
    };

    const onCardMouseLeave = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLElement;
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
      card.style.transition = RESET_TRANSITION;

      const shine = card.querySelector('[data-cursor-shine]') as HTMLElement | null;
      if (shine) {
        shine.style.opacity = '0';
      }
    };

    // Attach tilt listeners to all .tilt-card elements
    const attachTiltListeners = () => {
      const cards = document.querySelectorAll<HTMLElement>('.tilt-card');
      cards.forEach((card) => {
        // Inject shine overlay if not present
        if (!card.querySelector('[data-cursor-shine]')) {
          const shine = document.createElement('div');
          shine.setAttribute('data-cursor-shine', '');
          Object.assign(shine.style, {
            position: 'absolute',
            inset: '0',
            pointerEvents: 'none',
            borderRadius: 'inherit',
            opacity: '0',
            transition: 'opacity 0.3s ease-out',
          });
          // Ensure card has relative positioning for the overlay
          const computed = getComputedStyle(card);
          if (computed.position === 'static') {
            card.style.position = 'relative';
          }
          card.style.overflow = 'hidden';
          card.appendChild(shine);
        }

        card.addEventListener('mousemove', onCardMouseMove);
        card.addEventListener('mouseleave', onCardMouseLeave);
      });
      return cards;
    };

    document.addEventListener('mousemove', onMouseMove);
    const cards = attachTiltListeners();

    // Observe DOM for dynamically added tilt-cards
    const observer = new MutationObserver(() => {
      const newCards = document.querySelectorAll<HTMLElement>('.tilt-card');
      newCards.forEach((card) => {
        if (!card.querySelector('[data-cursor-shine]')) {
          // Re-attach for new cards
          attachTiltListeners();
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(rafId.current);
      document.removeEventListener('mousemove', onMouseMove);
      cards.forEach((card) => {
        card.removeEventListener('mousemove', onCardMouseMove);
        card.removeEventListener('mouseleave', onCardMouseLeave);
      });
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={glowRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: GLOW_RADIUS * 2,
        height: GLOW_RADIUS * 2,
        borderRadius: '50%',
        background: GLOW_COLOR,
        pointerEvents: 'none',
        zIndex: 9999,
        display: 'none',
        willChange: 'transform',
      }}
    />
  );
}
