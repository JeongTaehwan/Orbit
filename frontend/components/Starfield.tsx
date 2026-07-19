"use client";

/**
 * 전 화면 공통 우주 배경 (레이아웃에 한 번 배치).
 *
 * - 별 ~70개를 3개 시차(parallax) 레이어에 랜덤 배치. 크기·밝기 제각각.
 * - 일부만 시간차를 두고 아주 느리게 반짝임(twinkle).
 * - 스크롤 시 먼 레이어는 느리게, 가까운 레이어는 빠르게 이동(parallax).
 * - CSS transform/opacity 만 사용 → 컴포지터에서 처리, 리페인트 최소화.
 * - prefers-reduced-motion 이면 반짝임·시차 모두 정지.
 *
 * 별 좌표는 고정 시드 PRNG 로 생성해 SSR/CSR 이 동일 → 하이드레이션 불일치 없음.
 */

import { useEffect, useMemo, useRef } from "react";

// mulberry32 — 작고 결정론적인 시드 PRNG
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Star {
  left: number; // %
  top: number; // % of layer height
  size: number; // px
  opacity: number;
  twinkle: boolean;
  delay: number; // s
  duration: number; // s
}

// 레이어: [별 수, 시차 계수(클수록 빠름), 최대 크기, 기본 밝기]
const LAYERS = [
  { count: 34, factor: 0.12, maxSize: 1.6, baseOpacity: 0.5 }, // 먼 별: 작고 흐림, 느림
  { count: 22, factor: 0.28, maxSize: 2.4, baseOpacity: 0.7 }, // 중간
  { count: 14, factor: 0.5, maxSize: 3.2, baseOpacity: 0.95 }, // 가까운 별: 크고 밝음, 빠름
];

function makeStars(rand: () => number, layer: (typeof LAYERS)[number]): Star[] {
  return Array.from({ length: layer.count }, () => {
    const size = 0.7 + rand() * layer.maxSize;
    const twinkle = rand() < 0.45; // 절반이 안 되게 — 일부만 반짝
    return {
      left: rand() * 100,
      top: rand() * 100,
      size,
      opacity: layer.baseOpacity * (0.6 + rand() * 0.4),
      twinkle,
      delay: rand() * 8,
      duration: 4 + rand() * 6, // 느린 반짝임
    };
  });
}

export function Starfield() {
  // 시드 고정 → 서버/클라이언트 동일 좌표
  const layers = useMemo(() => {
    const rand = mulberry32(0x0b17f1e1d); // 고정 시드
    return LAYERS.map((l) => makeStars(rand, l));
  }, []);

  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return; // 모션 최소화: 시차 비활성

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        layerRefs.current.forEach((el, i) => {
          if (el) el.style.transform = `translate3d(0, ${-y * LAYERS[i].factor}px, 0)`;
        });
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="orbit-starfield" aria-hidden="true">
      {layers.map((stars, i) => (
        <div
          key={i}
          ref={(el) => {
            layerRefs.current[i] = el;
          }}
          className="orbit-star-layer"
        >
          {stars.map((s, j) => (
            <span
              key={j}
              className={s.twinkle ? "orbit-star orbit-star--tw" : "orbit-star"}
              style={
                {
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                  opacity: s.opacity,
                  "--tw-min": s.opacity * 0.25,
                  "--tw-max": s.opacity,
                  animationDelay: `${s.delay}s`,
                  animationDuration: `${s.duration}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
}
