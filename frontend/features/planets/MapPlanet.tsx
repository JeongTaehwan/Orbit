"use client";

/**
 * 우주 지도에 "떠 있는" 행성 하나.
 *
 * - 절대 위치(중심 기준) + 아주 느린 부유 애니메이션(각자 다른 주기).
 * - 이름 + 진행도 표시, 호버/포커스 시 유형·기록 수까지 상세히.
 * - 완성 행성은 평소에도 발광 강화.
 * - Link(button 시맨틱) 라 키보드로 접근·선택 가능. 클릭 시 확대 전환.
 * - view-transition-name=planet-{id} → 상세의 큰 행성과 모핑.
 */

import { TransitionLink } from "@/components/TransitionLink";
import { Planet } from "@/components/Planet";
import { difficultyLabel, requiredRecords } from "@/lib/utils/difficulty";
import type { MapItem } from "@/lib/utils/mapLayout";

export function MapPlanet({ item }: { item: MapItem }) {
  const { planet, x, y, size } = item;
  const pct = Math.round(planet.progress);

  return (
    <TransitionLink
      href={`/planets/${planet.id}`}
      aria-label={`${planet.name} — ${difficultyLabel(planet.difficulty)}, 진행도 ${pct}%`}
      className="orbit-map-planet group absolute rounded-lg outline-none"
      style={{ left: x, top: y }}
    >
      <span
        className="orbit-map-float flex flex-col items-center gap-2"
        style={
          {
            "--float-dur": `${item.floatDur}s`,
            "--float-delay": `${item.floatDelay}s`,
          } as React.CSSProperties
        }
      >
        <span
          className={`orbit-map-body block ${planet.is_completed ? "orbit-map-body--done" : ""}`}
          style={{ viewTransitionName: `planet-${planet.id}` } as React.CSSProperties}
        >
          <Planet
            progress={planet.progress}
            difficulty={planet.difficulty}
            size={size}
            animate={false}
          />
        </span>

        <span className="flex flex-col items-center text-center leading-tight">
          <span className="max-w-[9rem] truncate text-sm font-medium text-fg">{planet.name}</span>
          <span className="text-xs text-fg-muted">진행도 {pct}%</span>
          {/* 호버/포커스 시 더 자세히 */}
          <span className="orbit-map-detail text-xs text-brand">
            {difficultyLabel(planet.difficulty)} · 기록 {planet.record_count}/
            {requiredRecords(planet.difficulty)}
          </span>
        </span>
      </span>
    </TransitionLink>
  );
}
