/**
 * 완성 축하 연출 트리거 판정 (순수 함수).
 *
 * "처음 완성되는 순간"과 "완성된 걸 다시 보는 것"을 구분한다.
 * - 이전에 알고 있던 진행도가 100 미만이었고, 지금 완성됐다면 → 방금 완성됨(연출).
 * - 이전 값이 없으면(직접 링크 등) 완성된 걸 '보는 것'으로 간주해 연출하지 않는다.
 *   (오래전 완성한 행성을 URL 로 열었을 때 헛되이 축하하지 않도록)
 * - 이전에 이미 100 이었으면 당연히 연출하지 않는다.
 */
export function isFreshCompletion(
  prevProgress: number | null,
  isCompleted: boolean,
): boolean {
  return prevProgress !== null && prevProgress < 100 && isCompleted;
}
