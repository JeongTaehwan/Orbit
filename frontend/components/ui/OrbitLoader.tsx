/**
 * 테마 로더 — 중심(항성)을 위성이 도는 모양 (앱 이름 Orbit).
 *
 * 밋밋한 "Loading…" 대신 쓴다. 색은 전부 토큰. reduced-motion 이면 회전이 멈추고
 * 위성이 제자리에 서 있다(정적 표시). label 을 주면 아래에 곁들인다.
 */
export function OrbitLoader({
  size = 40,
  label,
  className,
}: {
  size?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className ?? ""}`} role="status">
      <span className="orbit-loader" style={{ ["--size" as string]: `${size}px` }} aria-hidden>
        <span className="orbit-loader__ring" />
        <span className="orbit-loader__core" />
        <span className="orbit-loader__spin">
          <span className="orbit-loader__sat" />
        </span>
      </span>
      {label ? (
        <span className="text-sm text-fg-muted">{label}</span>
      ) : (
        <span className="sr-only">불러오는 중</span>
      )}
    </div>
  );
}
