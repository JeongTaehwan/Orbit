/**
 * FastAPI 백엔드 호출 클라이언트.
 *
 * 화면은 fetch를 직접 쓰지 않고 이 api 객체만 호출한다.
 * 엔드포인트/에러처리가 한 곳에 모여 유지보수가 쉬움.
 */

import type { Difficulty, LearningRecord, Planet } from "@/types/planet";

// 도메인 타입을 이 모듈에서도 그대로 쓸 수 있게 재노출
export type { Difficulty, LearningRecord, Planet } from "@/types/planet";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * fetch 응답 공통 처리: 실패면 에러를 던지고, 성공이면 JSON 반환.
 * 204(No Content)는 본문이 없으므로 undefined.
 */
async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail; // FastAPI 에러: { detail: "..." }
    } catch {
      // JSON 파싱 실패 시 statusText 사용
    }
    throw new Error(`요청 실패 (${res.status}): ${detail}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export const api = {
  listPlanets: () => fetch(`${BASE_URL}/planets`).then((r) => handle<Planet[]>(r)),

  getPlanet: (id: number) =>
    fetch(`${BASE_URL}/planets/${id}`).then((r) => handle<Planet>(r)),

  createPlanet: (data: { name: string; difficulty: Difficulty }) =>
    fetch(`${BASE_URL}/planets`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }).then((r) => handle<Planet>(r)),

  deletePlanet: (id: number) =>
    fetch(`${BASE_URL}/planets/${id}`, { method: "DELETE" }).then((r) =>
      handle<void>(r),
    ),

  addRecord: (planetId: number, content: string) =>
    fetch(`${BASE_URL}/planets/${planetId}/records`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ content }),
    }).then((r) => handle<LearningRecord>(r)),

  listRecords: (planetId: number) =>
    fetch(`${BASE_URL}/planets/${planetId}/records`).then((r) =>
      handle<LearningRecord[]>(r),
    ),
};
