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

    layer.querySelectorAll('.background-light').forEach((light, index) => {
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

    layer.querySelectorAll('.background-spark').forEach((spark, index) => {
      spark.style.transform = transform(
        layer.clientWidth * ((index * 0.618 + 0.1) % 1),
        layer.clientHeight * ((index * 0.382 + 0.2) % 1),
        0.5,
      );
      spark.style.opacity = reducedMotion ? '0.25' : '0';
      if (reducedMotion) return;

      const sparkle = () => {
        const x = layer.clientWidth * Math.random();
        const y = layer.clientHeight * Math.random();
        const dx = (Math.random() - 0.5) * Math.min(layer.clientWidth * 0.2, 140);
        const dy = (Math.random() - 0.5) * 100;
        const size = 0.4 + Math.random() * 1.2;
        const brightness = 0.35 + Math.random() * 0.45;
        const animation = spark.animate([
          { transform: transform(x, y, 0.08), opacity: 0, offset: 0 },
          { transform: transform(x + dx * 0.3, y + dy * 0.3, size), opacity: brightness, offset: 0.3 },
          { transform: transform(x + dx * 0.6, y + dy * 0.6, size * 0.45), opacity: brightness * 0.45, offset: 0.6 },
          { transform: transform(x + dx * 0.8, y + dy * 0.8, size * 0.8), opacity: brightness * 0.7, offset: 0.8 },
          { transform: transform(x + dx, y + dy, 0.08), opacity: 0, offset: 1 },
        ], {
          duration: 5000 + Math.random() * 7000,
          delay: Math.random() * 4000,
          easing: 'ease-in-out',
          fill: 'both',
        });
        animations.add(animation);
        if (document.hidden) animation.pause();
        animation.onfinish = () => {
          animations.delete(animation);
          animation.cancel();
          sparkle();
        };
      };
      sparkle();
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
      {Array.from({ length: 12 }, (_, index) => <span key={index} className="background-spark" />)}
    </div>
  );
}
