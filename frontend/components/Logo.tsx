// Orbit 메인 로고 — "Constellation": 크기·색이 다른 행성들을 선으로 이은 별자리.
// "여러 학습 주제가 하나의 우주로"라는 컨셉. 색은 전부 우주 테마 토큰(var) 참조.

export interface LogoProps {
  /** 아이콘 크기(px). 기본 28 */
  size?: number;
  /** 아이콘 옆에 "Orbit" 워드마크 표시 */
  showWordmark?: boolean;
  /** 워드마크 태그 (홈 화면 제목은 h1, 그 외는 span) */
  wordmarkAs?: "span" | "h1" | "h2";
  className?: string;
}

// 별자리 좌표(행성) — 서로 다른 크기·색
const PLANETS = [
  { cx: 7, cy: 12, r: 3, color: "var(--color-brand)" },
  { cx: 15, cy: 5, r: 2, color: "var(--color-success)" },
  { cx: 25, cy: 9, r: 2.4, color: "var(--color-warning)" },
  { cx: 22, cy: 22, r: 1.8, color: "var(--color-brand-hover)" },
  { cx: 9, cy: 24, r: 1.5, color: "var(--color-fg-muted)" },
];

// 행성을 잇는 선(별자리)
const EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 0],
  [1, 3],
];

export function Logo({
  size = 28,
  showWordmark = false,
  wordmarkAs = "span",
  className,
}: LogoProps) {
  const Word = wordmarkAs;
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        role="img"
        aria-label="Orbit"
        style={{ display: "block", flexShrink: 0 }}
      >
        {/* 연결선 (은은한 border 톤) */}
        <g stroke="var(--color-border)" strokeWidth="1" strokeLinecap="round">
          {EDGES.map(([a, b], i) => (
            <line
              key={i}
              x1={PLANETS[a].cx}
              y1={PLANETS[a].cy}
              x2={PLANETS[b].cx}
              y2={PLANETS[b].cy}
            />
          ))}
        </g>
        {/* 행성 */}
        {PLANETS.map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={p.color} />
        ))}
      </svg>
      {showWordmark && (
        <Word
          className="font-semibold tracking-tight text-fg"
          style={{ fontSize: size * 0.62, lineHeight: 1 }}
        >
          Orbit
        </Word>
      )}
    </span>
  );
}
