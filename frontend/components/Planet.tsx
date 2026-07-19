"use client";

import { useId } from "react";
import type { Difficulty } from "@/types/planet";
import { difficultyLabel } from "@/lib/utils/difficulty";

export interface PlanetProps {
  /** 테라포밍 진행도 0~100 */
  progress: number;
  /** 행성 타입(색 변형) */
  difficulty: Difficulty;
  /** 렌더 크기(px). 기본 160 */
  size?: number;
  /** 자전 애니메이션 (기본 true). reduced-motion 이면 자동 정지 */
  animate?: boolean;
}

/** 0~1 로 정규화 후 부드럽게(smoothstep) — 단계가 뚝 끊기지 않게 */
function smooth(start: number, end: number, p: number): number {
  const t = Math.min(1, Math.max(0, (p - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

// 대륙 3개 (불규칙한 부드러운 path). 바다 위에 흩어져 얹힌다.
// 식생도 같은 path 를 안쪽으로 축소해 재사용 → 암석 해안선이 남는다.
const CONTINENTS = [
  "M31 33 C34 27 43 26 48 31 C53 35 52 42 49 47 C46 52 38 54 33 50 C27 46 27 39 31 33 Z",
  "M58 44 C63 40 71 42 73 49 C75 55 71 61 64 62 C58 63 52 58 54 51 C55 47 55 47 58 44 Z",
  "M40 62 C44 58 52 59 55 64 C58 69 54 74 48 74 C42 74 37 69 40 62 Z",
];

// 구름 puff (작고 옅게 흩어지게). [cx, cy, r]
const CLOUDS: [number, number, number][] = [
  [40, 37, 5],
  [58, 43, 6],
  [47, 61, 5],
  [67, 55, 4],
  [34, 54, 4],
  [55, 32, 4],
];

// 뷰박스 중심 기준 회전 그룹
const spinBox = { transformBox: "view-box", transformOrigin: "center" } as const;

/**
 * 진행도에 따라 테라포밍되는 행성 SVG.
 *
 * 모델: 암석 구체 → 대기 → "바다가 구체를 덮고 크레이터가 잠김" → 대륙 위 식생 → 옅은 구름.
 * 색은 전부 globals.css 의 --color-planet-* 토큰을 var() 로 참조.
 */
export function Planet({
  progress,
  difficulty,
  size = 160,
  animate = true,
}: PlanetProps) {
  const p = Math.min(100, Math.max(0, progress));
  const uid = useId().replace(/:/g, "");

  const atmoOp = smooth(18, 48, p);
  const oceanOp = smooth(48, 74, p);
  const vegOp = smooth(72, 95, p);
  const cloudOp = smooth(84, 100, p);
  const completeOp = smooth(94, 100, p);
  // 바다가 차오르면 크레이터가 잠겨 사라짐 / 대륙은 바다와 함께 드러남
  const craterOp = 0.9 * (1 - smooth(44, 72, p));
  const continentOp = oceanOp;

  const c = {
    base: `var(--color-planet-${difficulty}-base)`,
    light: `var(--color-planet-${difficulty}-light)`,
    dark: `var(--color-planet-${difficulty}-dark)`,
    ocean: `var(--color-planet-${difficulty}-ocean)`,
    oceanDeep: `var(--color-planet-${difficulty}-ocean-deep)`,
    veg: `var(--color-planet-${difficulty}-veg)`,
    vegDeep: `var(--color-planet-${difficulty}-veg-deep)`,
    atmo: `var(--color-planet-${difficulty}-atmosphere)`,
  };

  const ids = {
    sphere: `${uid}-sphere`,
    ocean: `${uid}-ocean`,
    cloud: `${uid}-cloud`,
    atmo: `${uid}-atmo`,
    limb: `${uid}-limb`,
    clip: `${uid}-clip`,
  };

  const clip = `url(#${ids.clip})`;
  const surfaceClass = animate ? "orbit-planet-surface" : undefined;
  const cloudsClass = animate ? "orbit-planet-clouds" : undefined;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={`테라포밍 ${Math.round(p)}% ${difficultyLabel(difficulty)}`}
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        {/* 구체 명암(암석): 좌상단 밝고 우하단 어둡게 */}
        <radialGradient id={ids.sphere} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0%" style={{ stopColor: c.light }} />
          <stop offset="55%" style={{ stopColor: c.base }} />
          <stop offset="100%" style={{ stopColor: c.dark }} />
        </radialGradient>

        {/* 바다도 같은 광원 방향으로 명암 (물빛 유지) */}
        <radialGradient id={ids.ocean} cx="0.35" cy="0.3" r="0.85">
          <stop offset="0%" style={{ stopColor: c.ocean }} />
          <stop offset="100%" style={{ stopColor: c.oceanDeep }} />
        </radialGradient>

        {/* 구름 puff: 중심 흐릿→가장자리 투명 (부드러운 경계) */}
        <radialGradient id={ids.cloud} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" style={{ stopColor: "var(--color-planet-cloud)" }} stopOpacity="0.9" />
          <stop offset="55%" style={{ stopColor: "var(--color-planet-cloud)" }} stopOpacity="0.45" />
          <stop offset="100%" style={{ stopColor: "var(--color-planet-cloud)" }} stopOpacity="0" />
        </radialGradient>

        {/* 대기 헤일로(가장자리 링) */}
        <radialGradient id={ids.atmo} cx="0.5" cy="0.5" r="0.5">
          <stop offset="70%" style={{ stopColor: c.atmo }} stopOpacity="0" />
          <stop offset="90%" style={{ stopColor: c.atmo }} stopOpacity="0.45" />
          <stop offset="100%" style={{ stopColor: c.atmo }} stopOpacity="0" />
        </radialGradient>

        {/* 림 다크닝: 가장자리를 우주 배경색으로 눌러 구체감 */}
        <radialGradient id={ids.limb} cx="0.5" cy="0.5" r="0.5">
          <stop offset="58%" style={{ stopColor: "var(--color-bg)" }} stopOpacity="0" />
          <stop offset="100%" style={{ stopColor: "var(--color-bg)" }} stopOpacity="0.6" />
        </radialGradient>

        <clipPath id={ids.clip}>
          <circle cx="50" cy="50" r="44" />
        </clipPath>
      </defs>

      {/* 대기 헤일로 */}
      <circle
        cx="50"
        cy="50"
        r="49"
        fill={`url(#${ids.atmo})`}
        style={{
          ...spinBox,
          opacity: Math.min(1, atmoOp * 0.9 + completeOp * 0.6),
          transform: `scale(${0.94 + 0.06 * atmoOp})`,
        }}
      />

      {/* 행성 본체 (암석 구체) */}
      <circle cx="50" cy="50" r="44" fill={`url(#${ids.sphere})`} />

      {/* 크레이터 (자전, 바다에 잠기면 사라짐) */}
      {craterOp > 0.01 && (
        <g clipPath={clip} className={surfaceClass} style={spinBox}>
          <g fill="var(--color-planet-crater)" style={{ opacity: craterOp }}>
            <circle cx="37" cy="38" r="6" />
            <circle cx="62" cy="34" r="4.5" />
            <circle cx="58" cy="59" r="7" />
            <circle cx="41" cy="63" r="4" />
            <circle cx="70" cy="52" r="3.5" />
            <circle cx="48" cy="47" r="2.6" />
          </g>
        </g>
      )}

      {/* 바다 (구체 전체를 덮는 물, 광원 고정 → 회전 안 함) */}
      {oceanOp > 0.01 && (
        <circle cx="50" cy="50" r="44" fill={`url(#${ids.ocean})`} style={{ opacity: oceanOp }} />
      )}

      {/* 대륙 + 식생 (바다 위, 자전) */}
      {continentOp > 0.01 && (
        <g clipPath={clip} className={surfaceClass} style={spinBox}>
          {/* 대륙 맨땅 (바다 출현 60~75% 구간에 드러나는 암석) */}
          <g fill={c.base} style={{ opacity: continentOp }}>
            {CONTINENTS.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
          {/* 식생: 대륙을 채우고, 어두운 초록 해안선으로만 경계 (동심원 없이 자연스럽게) */}
          <g
            style={{ opacity: vegOp }}
            fill={c.veg}
            stroke={c.vegDeep}
            strokeWidth="1"
            strokeLinejoin="round"
          >
            {CONTINENTS.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        </g>
      )}

      {/* 구름 (표면보다 느리게 자전, 옅은 puff) */}
      {cloudOp > 0.01 && (
        <g
          clipPath={clip}
          className={cloudsClass}
          style={{ ...spinBox, opacity: cloudOp * 0.32 }}
          fill={`url(#${ids.cloud})`}
        >
          {CLOUDS.map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} />
          ))}
        </g>
      )}

      {/* 림 다크닝 (가장자리 그늘) */}
      <circle cx="50" cy="50" r="44" fill={`url(#${ids.limb})`} />

      {/* 스페큘러 하이라이트 */}
      <ellipse cx="37" cy="33" rx="13" ry="9" fill="var(--color-planet-highlight)" style={{ opacity: 0.16 }} />

      {/* 완성 발광 틴트 (100% 부근) */}
      {completeOp > 0 && (
        <circle
          cx="50"
          cy="50"
          r="44"
          fill={c.atmo}
          style={{ opacity: completeOp * 0.1 }}
        />
      )}
    </svg>
  );
}
