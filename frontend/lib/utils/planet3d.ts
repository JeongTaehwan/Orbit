/**
 * 3D 행성의 "외형 파라미터" 계산 — 순수 함수만 (three.js 를 import 하지 않는다).
 *
 * 진행도/난이도 → 어떤 색을 쓸지까지만 정하고, 실제 렌더링은 컴포넌트가 한다.
 * 이렇게 나눠두면 WebGL 없이(=jsdom 에서) 색 로직을 그대로 테스트할 수 있다.
 *
 * 색 값은 globals.css 의 --color-planet-* 토큰과 같은 값이다.
 * (CSS 변수는 문자열이라 three.js 재질에 바로 넣을 수 없어 여기서 다시 선언한다)
 */

import type { Difficulty } from "@/types/planet";

export interface PlanetPalette {
  rock: string; // 암석 기본
  rockDark: string; // 암석 그늘 / 낮은 지대
  ocean: string; // 바다
  veg: string; // 식생
  atmosphere: string; // 대기 헤일로
}

export const PLANET_PALETTE: Record<Difficulty, PlanetPalette> = {
  easy: {
    rock: "#9a6b45",
    rockDark: "#4a3121",
    ocean: "#1fa9ad",
    veg: "#97cc3c",
    atmosphere: "#8fe8d2",
  },
  normal: {
    rock: "#7c8493",
    rockDark: "#3c424d",
    ocean: "#2f6fb0",
    veg: "#4a9d5f",
    atmosphere: "#7fc4ff",
  },
  hard: {
    rock: "#4f7396",
    rockDark: "#26384a",
    ocean: "#21406f",
    veg: "#37806c",
    atmosphere: "#6f93cf",
  },
};

/**
 * 3D 행성 박스 확대 비율.
 *
 * 3D 는 대기 헤일로가 번질 자리를 남기려고 카메라를 물려 두어서, 같은 px 박스면
 * SVG 보다 구체가 작게 보인다. 그만큼 박스를 키워 겉보기 크기를 맞춘다.
 * (PlanetScene 의 카메라 거리와 짝을 이루는 값)
 */
export const PLANET_3D_BOX = 1.32;

/** 0~1 로 정규화 후 부드럽게(smoothstep) — 단계가 뚝 끊기지 않게 */
export function smoothstep(start: number, end: number, p: number): number {
  const t = Math.min(1, Math.max(0, (p - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

/** "#rrggbb" 두 색을 t(0~1) 비율로 섞는다 */
export function mixHex(from: string, to: string, t: number): string {
  const k = Math.min(1, Math.max(0, t));
  const a = parseInt(from.slice(1), 16);
  const b = parseInt(to.slice(1), 16);
  const ch = (shift: number) => {
    const x = (a >> shift) & 0xff;
    const y = (b >> shift) & 0xff;
    return Math.round(x + (y - x) * k);
  };
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hex(ch(16))}${hex(ch(8))}${hex(ch(0))}`;
}

export interface PlanetVisual {
  /** 지표 바탕색 (암석 → 바다) */
  surface: string;
  /** 대륙/패치 색 (그늘진 암석 → 식생) */
  land: string;
  /** 대기 헤일로 색 */
  atmosphere: string;
  /** 대기 헤일로 진하기 0~1 */
  atmosphereOpacity: number;
  /** 대륙이 또렷하게 드러난 정도 0~1 (낮으면 옅은 얼룩처럼) */
  landAmount: number;
}

/**
 * 진행도(0~100) + 난이도 → 3D 행성 외형.
 *
 * 구간은 SVG 버전(components/Planet.tsx)과 같게 맞춰 두 표현이 따로 놀지 않게 한다.
 *   ~18%  황량한 암석
 *   18~48 대기 형성
 *   48~74 바다 차오름
 *   72~95 식생 번짐
 */
export function planetVisual(progress: number, difficulty: Difficulty): PlanetVisual {
  const p = Math.min(100, Math.max(0, progress));
  const c = PLANET_PALETTE[difficulty];

  const atmo = smoothstep(18, 48, p);
  const oceanAmount = smoothstep(48, 74, p);
  const vegAmount = smoothstep(72, 95, p);

  return {
    surface: mixHex(c.rock, c.ocean, oceanAmount),
    land: mixHex(c.rockDark, c.veg, vegAmount),
    atmosphere: c.atmosphere,
    atmosphereOpacity: atmo * 0.85,
    // 바다가 차오를수록 대륙 경계가 또렷해진다 (그전엔 옅은 암석 얼룩)
    landAmount: 0.35 + 0.65 * oceanAmount,
  };
}

/**
 * 렌더 크기에 맞는 구체 분할 수.
 *
 * 지도에 작게 여러 개 뜰 때까지 128분할을 쓸 이유가 없다.
 * 실루엣이 각져 보이지 않을 만큼만 준다.
 */
export function sphereSegments(size: number): number {
  if (size <= 64) return 24;
  if (size <= 140) return 32;
  return 48;
}
