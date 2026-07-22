/**
 * 대륙 마스크를 코드로 그린다 (이미지 에셋 없음).
 *
 * 흑백 마스크 한 장 = "어디가 대륙인가"만 담는다. 색은 재질에서 정하므로
 * 진행도가 바뀌어도 마스크를 다시 만들 필요가 없다.
 *   → 난이도당 딱 1장(총 3장)만 만들어 캐시하고, 색 전환은 완전히 부드럽다.
 *
 * 구(sphere)의 UV 는 가로=경도, 세로=위도라서 극지방으로 갈수록 가로로 늘어난다.
 * 그래서 대륙을 적도 부근에 몰아 배치하고, 좌우 경계(경도 0도)에서 이어지도록
 * 같은 얼룩을 폭만큼 좌우로 한 번 더 그린다.
 */

import type { Difficulty } from "@/types/planet";

const WIDTH = 256;
const HEIGHT = 128;

/** 난이도마다 대륙 배치가 달라지도록 하는 seed */
const SEED: Record<Difficulty, number> = { easy: 7, normal: 21, hard: 42 };

/** 같은 입력이면 항상 같은 배치가 나오도록 하는 아주 작은 난수기 (mulberry32) */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 난이도당 1장만 만들어 재사용 (지도에 행성이 여러 개 떠도 마스크는 3장뿐)
const cache = new Map<Difficulty, HTMLCanvasElement>();

/**
 * 대륙 = 흰색, 바다 = 검정인 마스크 캔버스.
 * 브라우저가 아닌 환경(테스트 등)에서 2D 컨텍스트를 못 얻으면 null.
 */
export function createLandMask(difficulty: Difficulty): HTMLCanvasElement | null {
  const cached = cache.get(difficulty);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const rand = rng(SEED[difficulty]);
  ctx.fillStyle = "#fff";

  // 대륙 5덩어리 — 각 덩어리는 원 여러 개를 겹쳐 울퉁불퉁하게 만든다
  for (let i = 0; i < 5; i++) {
    const cx = rand() * WIDTH;
    // 위도 25~75% 구간 = 적도 주변 (극지방 왜곡을 피한다)
    const cy = HEIGHT * (0.25 + rand() * 0.5);
    const blobs = 4 + Math.floor(rand() * 3);
    const scale = 10 + rand() * 8;

    for (let j = 0; j < blobs; j++) {
      const dx = (rand() - 0.5) * scale * 2.2;
      const dy = (rand() - 0.5) * scale * 1.4;
      const r = scale * (0.55 + rand() * 0.5);
      // 좌우 경계에서 대륙이 끊기지 않도록 -WIDTH / 0 / +WIDTH 세 벌 그린다
      for (const wrap of [-WIDTH, 0, WIDTH]) {
        ctx.beginPath();
        ctx.arc(cx + dx + wrap, cy + dy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  cache.set(difficulty, canvas);
  return canvas;
}

/** 테스트에서 캐시를 비울 때 사용 */
export function clearLandMaskCache(): void {
  cache.clear();
  glowCache = null;
}

let glowCache: HTMLCanvasElement | null = null;

/**
 * 대기 헤일로용 부드러운 링.
 *
 * 구를 하나 더 키워 덮는 방식은 링의 진하기가 어디서나 똑같아 "테두리 선"처럼 보인다.
 * 대신 반지름에 따라 옅어지는 원을 그려 행성 뒤에 깔면, 실루엣 바깥으로 삐져나온
 * 부분만 빛무리로 남는다. (색은 재질에서 입히므로 흰색 한 장만 만들어 돌려쓴다)
 *
 * 행성 가장자리는 이 캔버스 중심에서 GLOW_EDGE 지점에 온다 (PlanetScene 의 평면 크기와 맞춤).
 */
/**
 * 행성 가장자리가 텍스처 중심에서 얼마나 떨어진 지점에 오는가 (텍스처 반지름 = 0.5 기준).
 *
 * 0.25 → 평면 반지름 2.0 (행성 반지름 1). 평면이 카메라 시야(대각선 1.87)보다 커서
 * 평면의 네모난 경계가 화면에 걸리지 않는다.
 */
export const GLOW_EDGE = 0.25;

/**
 * 헤일로가 완전히 사라지는 지점 (행성 반지름의 배수).
 *
 * 이 값이 카메라 시야보다 크면 빛이 0 이 되기 전에 화면 가장자리에서 잘려
 * 캔버스 전체가 네모나게 밝아진다. PlanetScene 의 카메라 거리와 함께 봐야 하는 값.
 */
export const GLOW_OUTER = 1.35;

export function createGlowTexture(): HTMLCanvasElement | null {
  if (glowCache) return glowCache;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const c = size / 2;
  const gradient = ctx.createRadialGradient(c, c, 0, c, c, c);
  // 중심부는 어차피 행성에 가려지므로 값이 중요하지 않다.
  // 행성 가장자리(GLOW_EDGE)에서 가장 밝고, GLOW_OUTER 에서 완전히 0 이 된다.
  const outer = GLOW_EDGE * GLOW_OUTER;
  const at = (t: number) => GLOW_EDGE + (outer - GLOW_EDGE) * t;

  gradient.addColorStop(0, "rgba(255,255,255,0.6)");
  gradient.addColorStop(GLOW_EDGE * 0.9, "rgba(255,255,255,0.85)");
  gradient.addColorStop(GLOW_EDGE, "rgba(255,255,255,1)");
  gradient.addColorStop(at(0.35), "rgba(255,255,255,0.45)");
  gradient.addColorStop(at(0.65), "rgba(255,255,255,0.16)");
  gradient.addColorStop(at(1), "rgba(255,255,255,0)"); // 여기서 완전히 사라진다
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  glowCache = canvas;
  return canvas;
}
