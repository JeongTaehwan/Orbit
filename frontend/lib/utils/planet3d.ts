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

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** 색조(hue, 도)와 명도(lightness, ±)를 조금 틀어 같은 계열의 다른 색을 만든다 */
export function shiftColor(hex: string, hueDeg: number, lightDelta: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 0xff) / 255;
  const g = ((n >> 8) & 0xff) / 255;
  const b = (n & 0xff) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const h2 = (((h + hueDeg) % 360) + 360) % 360;
  const l2 = clamp01(l + lightDelta);

  // hsl → rgb
  const c = (1 - Math.abs(2 * l2 - 1)) * s;
  const x = c * (1 - Math.abs(((h2 / 60) % 2) - 1));
  const m = l2 - c / 2;
  let rr = 0;
  let gg = 0;
  let bb = 0;
  if (h2 < 60) [rr, gg, bb] = [c, x, 0];
  else if (h2 < 120) [rr, gg, bb] = [x, c, 0];
  else if (h2 < 180) [rr, gg, bb] = [0, c, x];
  else if (h2 < 240) [rr, gg, bb] = [0, x, c];
  else if (h2 < 300) [rr, gg, bb] = [x, 0, c];
  else [rr, gg, bb] = [c, 0, x];

  const hx = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${hx(rr)}${hx(gg)}${hx(bb)}`;
}

/** variant(행성별 seed) → [0,1) 결정적 난수기 (mulberry32) */
function variantRand(variant: number): () => number {
  let a = (variant * 0x9e3779b1) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 행성별로 색을 조금씩 틀어 같은 난이도여도 개성이 생기게 한다.
 * 색조 ±14°, 명도 ±6% 정도로 절제 — 난이도 계열(따뜻/표준/차가운)은 유지된다.
 * variant 0 은 변형 없음(프리뷰·기본값이 기존 그대로 보이도록).
 */
export function variedPalette(base: PlanetPalette, variant: number): PlanetPalette {
  if (variant === 0) return base;
  const rand = variantRand(variant);
  const hue = (rand() * 2 - 1) * 14;
  const light = (rand() * 2 - 1) * 0.06;
  const v = (hex: string) => shiftColor(hex, hue, light);
  return {
    rock: v(base.rock),
    rockDark: v(base.rockDark),
    ocean: v(base.ocean),
    veg: v(base.veg),
    atmosphere: v(base.atmosphere),
  };
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
export function planetVisual(
  progress: number,
  difficulty: Difficulty,
  variant = 0,
): PlanetVisual {
  const p = Math.min(100, Math.max(0, progress));
  // 난이도 팔레트를 행성별로 살짝 틀어 같은 난이도여도 색이 조금씩 다르다
  const c = variedPalette(PLANET_PALETTE[difficulty], variant);

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
