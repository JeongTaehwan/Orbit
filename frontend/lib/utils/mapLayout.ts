/**
 * 우주 지도의 행성 배치 계산.
 *
 * - 행성 id 로 시드된 결정적 위치 → 새로고침해도 위치가 유지된다.
 * - 지터를 준 셀 격자라 규칙적 격자로 보이지 않으면서 겹치지 않는다.
 * - 컨테이너 폭(px)에 따라 열 수·행성 크기를 조정(반응형).
 * - 좌표는 컨테이너 안(px, 중심 기준)으로 클램프 → 화면 밖으로 나가지 않는다.
 */

import type { Planet } from "@/types/planet";

// 결정적 해시: (id, salt) → [0,1)
function seeded(id: number, salt: number): number {
  let h = Math.imul(id ^ (salt * 0x9e3779b1), 2654435761);
  h ^= h >>> 15;
  h = Math.imul(h >>> 0, 2246822519);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

export interface MapItem {
  planet: Planet;
  x: number; // 중심 x (px)
  y: number; // 중심 y (px)
  size: number; // 행성 지름 (px)
  floatDur: number; // 부유 주기 (s)
  floatDelay: number; // 부유 위상 지연 (s, 음수)
}

export interface MapLayout {
  items: MapItem[];
  height: number; // 배치 영역 높이 (px)
}

export function computeMapLayout(planets: Planet[], width: number): MapLayout {
  if (width <= 0 || planets.length === 0) return { items: [], height: 0 };

  const compact = width < 520; // 모바일: 밀도·크기 축소
  const baseSize = compact ? 64 : 84;
  const rowHeight = compact ? 150 : 182;
  const cols = Math.max(2, Math.min(6, Math.round(width / (compact ? 168 : 210))));
  const rows = Math.ceil(planets.length / cols);
  const cellW = width / cols;

  // id 순 정렬 → 집합이 같으면 순서·위치가 안정적
  const sorted = [...planets].sort((a, b) => a.id - b.id);

  const items: MapItem[] = sorted.map((planet, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const jx = seeded(planet.id, 1) * 2 - 1;
    const jy = seeded(planet.id, 2) * 2 - 1;
    const size = Math.round(baseSize * (0.9 + seeded(planet.id, 3) * 0.25));
    const half = size / 2 + 12;

    let x = (col + 0.5) * cellW + jx * cellW * 0.22;
    x = Math.max(half, Math.min(width - half, x));

    let y = (row + 0.5) * rowHeight + jy * rowHeight * 0.18;
    y = Math.max(half, Math.min(rows * rowHeight - half, y));

    return {
      planet,
      x,
      y,
      size,
      floatDur: 5 + seeded(planet.id, 4) * 4, // 5~9s, 각자 다른 주기
      floatDelay: -seeded(planet.id, 5) * 6, // 위상 분산
    };
  });

  return { items, height: rows * rowHeight };
}
