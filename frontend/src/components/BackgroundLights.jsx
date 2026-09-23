import { useEffect, useRef } from 'react';
import { useMediaQuery } from '@mui/material';

export default function BackgroundLights() {
  const layerRef = useRef(null);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    const layer = layerRef.current;
    const animations = new Set();
    const transform = (x, y, scale = 1) =>
      `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`;

    [...layer.children].forEach((light, index) => {
      let position = transform(layer.clientWidth * (index ? 0.1 : 0.85), layer.clientHeight * (index ? 0.75 : 0.1));
      light.style.transform = position;
      if (reducedMotion) return;

      const wander = () => {
        const next = transform(
          layer.clientWidth * (0.05 + Math.random() * 0.9),
          layer.clientHeight * (0.05 + Math.random() * 0.9),
          0.85 + Math.random() * 0.35,
        );
        const animation = light.animate([{ transform: position }, { transform: next }], {
          duration: 12000 + Math.random() * 10000,
          easing: 'ease-in-out',
          fill: 'forwards',
        });
        animations.add(animation);
        if (document.hidden) animation.pause();
        animation.onfinish = () => {
          light.style.transform = next;
          position = next;
          animations.delete(animation);
          animation.cancel();
          wander();
        };
      };
      wander();
    });

    const updateVisibility = () => animations.forEach((animation) => {
      if (document.hidden) animation.pause();
      else animation.play();
    });
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      document.removeEventListener('visibilitychange', updateVisibility);
      animations.forEach((animation) => {
        animation.onfinish = null;
        animation.cancel();
      });
    };
  }, [reducedMotion]);

  return (
    <div ref={layerRef} className="background-lights" aria-hidden="true">
      <span className="background-light background-light-primary" />
      <span className="background-light background-light-secondary" />
    </div>
  );
}
