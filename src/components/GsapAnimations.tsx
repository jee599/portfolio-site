import { useEffect } from 'react';

export default function GsapAnimations() {
  useEffect(() => {
    const html = document.documentElement;
    if (html.dataset.ftGsap !== 'on') return;

    let ctx: any;

    import('gsap').then(({ gsap }) => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);

        // Re-check after async load
        if (html.dataset.ftGsap !== 'on') return;

        ctx = gsap.context(() => {
          // Hero heading — split lines reveal
          const heroH1 = document.querySelector('.hero-dot-bg h1');
          if (heroH1) {
            const spans = heroH1.querySelectorAll('span');
            gsap.fromTo(
              spans,
              { opacity: 0, y: 40, filter: 'blur(8px)' },
              {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                duration: 0.8,
                stagger: 0.15,
                ease: 'power3.out',
              }
            );
          }

          // Hero subtitle
          const heroP = document.querySelector('.hero-dot-bg p');
          if (heroP) {
            gsap.fromTo(
              heroP,
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.6, delay: 0.4, ease: 'power2.out' }
            );
          }

          // Hero CTA buttons
          const heroBtns = document.querySelectorAll('.hero-dot-bg a');
          if (heroBtns.length) {
            gsap.fromTo(
              heroBtns,
              { opacity: 0, y: 15 },
              { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, delay: 0.6, ease: 'power2.out' }
            );
          }

          // Stats bar — count up
          const statNums = document.querySelectorAll('.gsap-stat-num');
          statNums.forEach((el) => {
            const target = parseInt(el.textContent || '0', 10);
            if (isNaN(target)) return;
            const obj = { val: 0 };
            gsap.to(obj, {
              val: target,
              duration: 1.5,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 85%',
                once: true,
              },
              onUpdate: () => {
                (el as HTMLElement).textContent = Math.round(obj.val).toString();
              },
            });
          });

          // Site cards — stagger entrance
          const siteCards = document.querySelectorAll('.site-card');
          if (siteCards.length) {
            gsap.fromTo(
              siteCards,
              { opacity: 0, y: 30, scale: 0.95 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.5,
                stagger: 0.08,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: siteCards[0],
                  start: 'top 85%',
                  once: true,
                },
              }
            );
          }

          // Post cards — slide in
          const postCards = document.querySelectorAll('.post-card');
          if (postCards.length) {
            gsap.fromTo(
              postCards,
              { opacity: 0, x: -20 },
              {
                opacity: 1,
                x: 0,
                duration: 0.4,
                stagger: 0.06,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: postCards[0],
                  start: 'top 85%',
                  once: true,
                },
              }
            );
          }

          // CTA section — fade up
          const cta = document.querySelector('.gsap-cta');
          if (cta) {
            gsap.fromTo(
              cta.children,
              { opacity: 0, y: 30 },
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: cta,
                  start: 'top 80%',
                  once: true,
                },
              }
            );
          }
        });
      });
    });

    // Observe toggle changes
    const observer = new MutationObserver(() => {
      if (html.dataset.ftGsap !== 'on' && ctx) {
        ctx.revert();
        ctx = null;
      }
    });
    observer.observe(html, { attributes: true, attributeFilter: ['data-ft-gsap'] });

    return () => {
      observer.disconnect();
      if (ctx) ctx.revert();
    };
  }, []);

  return null;
}
