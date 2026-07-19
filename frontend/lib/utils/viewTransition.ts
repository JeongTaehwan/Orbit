/**
 * View Transitions API 래퍼 — 지원/모션설정에 따라 안전하게 폴백.
 *
 * - 미지원 브라우저 또는 prefers-reduced-motion: 전환 없이 즉시 navigate.
 * - 지원 시: navigate 후 "새 라우트가 실제로 커밋될 때까지"(URL pathname 변경)
 *   기다렸다가 resolve → 상세의 공유 요소가 존재해 모핑이 걸린다.
 *
 * 주의: startViewTransition 콜백(업데이트) 동안엔 페인트가 멈춰 requestAnimationFrame
 * 이 발화하지 않는다(→ rAF 로 기다리면 데드락 후 4초 만에 abort). 그래서 커밋 감지는
 * 반드시 setTimeout(타이머) 로 폴링한다.
 */

type VTDocument = Document & {
  startViewTransition?: (cb: () => void | Promise<void>) => unknown;
};

const COMMIT_TIMEOUT_MS = 1500; // 이동이 늦어도 이 시간 뒤엔 스냅샷(무한 대기 방지)

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * @param navigate   실제 이동 (예: () => router.push(href))
 * @param targetPath 이동 후 도달할 pathname (커밋 감지용). 없으면 짧은 지연 후 스냅샷.
 */
export function startViewTransition(navigate: () => void, targetPath?: string): void {
  const doc = typeof document !== "undefined" ? (document as VTDocument) : null;
  if (!doc || typeof doc.startViewTransition !== "function" || prefersReducedMotion()) {
    navigate();
    return;
  }

  doc.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        navigate();

        if (typeof targetPath !== "string") {
          setTimeout(resolve, 60);
          return;
        }

        const start = Date.now();
        const poll = () => {
          if (window.location.pathname === targetPath) {
            // 커밋됨 → 한 틱 뒤 스냅샷(React flush 여유)
            setTimeout(resolve, 0);
          } else if (Date.now() - start > COMMIT_TIMEOUT_MS) {
            resolve();
          } else {
            setTimeout(poll, 16);
          }
        };
        poll();
      }),
  );
}
