/**
 * 3D 궤도계 배치 계산 — 순수 함수 (three.js 를 import 하지 않는다).
 *
 * 2D 지도와 달리 px 이 아니라 "월드 단위"로 계산한다. 화면 크기는 카메라가
 * 알아서 담당하므로 컨테이너 폭을 신경 쓸 필요가 없다.
 *
 * - 궤도 하나에 행성 하나. 안쪽부터 id 순 → 집합이 같으면 배치가 유지된다.
 * - 궤도 간격은 바깥으로 갈수록 넓어진다(실제 태양계처럼 안쪽이 촘촘).
 * - 바깥 궤도일수록 공전 주기가 길다.
 * - 궤도면은 XZ 평면. 기울어져 보이는 건 카메라 각도가 만든다.
 */

import type { Planet } from "@/types/planet";

/** 중심 항성 반지름 (월드 단위) */
export const STAR_RADIUS = 0.45;

/** 첫 궤도 반지름 */
const FIRST_ORBIT = 2.6;

/**
 * 궤도 사이 기본 간격.
 *
 * 행성 지름(최대 1.0)보다 넉넉히 커야 이웃 궤도의 행성과 겹쳐 보이지 않는다.
 * 간격을 행성 크기와 무관하게 잡으면(예: 반지름의 16%) 안쪽 궤도에서
 * 행성이 궤도 간격보다 커져 서로 파고든다.
 */
const BASE_GAP = 1.8;

/** 간격이 바깥으로 갈수록 넓어지는 비율 (k번째 간격 = BASE_GAP × GROWTH^k) */
const GROWTH = 1.12;

/** 행성 반지름 범위 — 지름(최대 1.44)이 BASE_GAP 보다 작아야 이웃과 겹치지 않는다 */
const MIN_PLANET = 0.5;
const MAX_PLANET = 0.72;

// 결정적 해시: (id, salt) → [0,1)
function seeded(id: number, salt: number): number {
  let h = Math.imul(id ^ (salt * 0x9e3779b1), 2654435761);
  h ^= h >>> 15;
  h = Math.imul(h >>> 0, 2246822519);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

export interface OrbitBody {
  planet: Planet;
  /** 안쪽부터 0 */
  ring: number;
  /** 궤도 반지름 (월드 단위) */
  radius: number;
  /** 행성 반지름 (월드 단위) */
  size: number;
  /** 시작 각도 (라디안) */
  phase: number;
  /** 공전 한 바퀴에 걸리는 시간 (초) */
  duration: number;
}

export interface OrbitSystem {
  bodies: OrbitBody[];
  /** 가장 바깥 궤도 반지름 — 카메라 초기 거리를 정할 때 쓴다 */
  maxRadius: number;
}

export function computeOrbitSystem(planets: Planet[]): OrbitSystem {
  if (planets.length === 0) return { bodies: [], maxRadius: FIRST_ORBIT };

  // id 순 → 집합이 같으면 순서·궤도가 안정적
  const sorted = [...planets].sort((a, b) => a.id - b.id);

  // 안쪽부터 간격을 GROWTH 배씩 늘리며 쌓는다
  let radius = FIRST_ORBIT;
  const bodies: OrbitBody[] = sorted.map((planet, k) => {
    if (k > 0) radius += BASE_GAP * Math.pow(GROWTH, k - 1);
    return {
      planet,
      ring: k,
      radius,
      size: MIN_PLANET + (MAX_PLANET - MIN_PLANET) * seeded(planet.id, 3),
      phase: seeded(planet.id, 1) * Math.PI * 2,
      // 바깥일수록 느리게 (+ 행성마다 조금씩 다르게)
      duration: 40 + k * 14 + seeded(planet.id, 4) * 10,
    };
  });

  return { bodies, maxRadius: bodies[bodies.length - 1].radius };
}

/**
 * 행성이 적어도 화면이 꽉 차 보이지 않게 하는 기준 반경.
 *
 * 궤도계 크기에만 맞춰 카메라를 붙이면 행성 하나일 때 그 하나가 화면을 가득 채워
 * "우주"가 아니라 "행성 사진"이 된다. 최소한 이만큼은 빈 공간을 남긴다.
 */
export const MIN_VIEW_RADIUS = 8;

/**
 * 궤도계 전체가 화면에 들어오는 카메라 거리.
 * 가장 바깥 궤도 + 여유를 보고 정하되, 최소 여백을 보장한다.
 */
export function fitDistance(maxRadius: number): number {
  return Math.max(MIN_VIEW_RADIUS, maxRadius) * 2.1 + 3;
}

/**
 * 줌아웃 한계 — 궤도계를 한참 멀리서 내려다볼 수 있게 넉넉히 잡는다.
 * (행성이 늘어도 항상 전체를 담을 수 있어야 한다)
 */
export function maxViewDistance(maxRadius: number): number {
  return Math.max(160, maxRadius * 10);
}
