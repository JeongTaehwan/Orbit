/**
 * 아주 가벼운 클라이언트 행성 캐시 (모듈 전역 Map).
 *
 * 용도: 우주 지도 → 상세로 넘어갈 때 상세 화면이 행성을 "즉시" 렌더하도록.
 * 확대 전환(View Transition)이 매칭 요소를 찾을 수 있고, 로딩 깜빡임도 준다.
 * 항상 서버에서 신선한 값을 다시 받아 갱신하므로 캐시는 첫 페인트용일 뿐이다.
 */

import type { Planet } from "@/types/planet";

const cache = new Map<number, Planet>();

export function cachePlanets(list: Planet[]): void {
  list.forEach((p) => cache.set(p.id, p));
}

export function cachePlanet(p: Planet): void {
  cache.set(p.id, p);
}

export function getCachedPlanet(id: number): Planet | null {
  return cache.get(id) ?? null;
}

export function getCachedPlanets(): Planet[] {
  return [...cache.values()];
}

/** 테스트 격리용 — 캐시 비우기 */
export function clearPlanetCache(): void {
  cache.clear();
}
