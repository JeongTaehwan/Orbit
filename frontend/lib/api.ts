/**
 * FastAPI 백엔드 호출 클라이언트.
 *
 * 화면(page.tsx)은 fetch를 직접 쓰지 않고 여기 함수만 호출한다.
 * → 엔드포인트/타입이 한 곳에 모여 유지보수가 쉬워짐.
 */

// 백엔드 base URL. 환경변수(.env.local)에서 읽고, 없으면 로컬 기본값.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// --- 백엔드 응답 타입 (backend/schemas.py 와 형태 일치) ---

export type Difficulty = "easy" | "normal" | "hard";

export interface Planet {
  id: number;
  name: string;
  difficulty: Difficulty;
  progress: number; // 0 ~ 100
  is_completed: boolean;
  created_at: string; // ISO 문자열
}

// TS 내장 유틸 타입 Record<K,V> 와 이름이 겹치지 않도록 LearningRecord 로 명명
export interface LearningRecord {
  id: number;
  planet_id: number;
  content: string;
  created_at: string;
}

/**
 * fetch 응답을 공통 처리: 실패면 에러를 던지고, 성공이면 JSON을 반환.
 * 204(No Content, 삭제 응답)는 본문이 없으므로 undefined 반환.
 */
async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail; // FastAPI 에러는 { detail: "..." } 형태
    } catch {
      // JSON 파싱 실패 시 statusText 그대로 사용
    }
    throw new Error(`요청 실패 (${res.status}): ${detail}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export const api = {
  // 행성 목록
  listPlanets: () => fetch(`${BASE_URL}/planets`).then((r) => handle<Planet[]>(r)),

  // 행성 상세
  getPlanet: (id: number) =>
    fetch(`${BASE_URL}/planets/${id}`).then((r) => handle<Planet>(r)),

  // 행성 생성
  createPlanet: (data: { name: string; difficulty: Difficulty }) =>
    fetch(`${BASE_URL}/planets`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }).then((r) => handle<Planet>(r)),

  // 행성 삭제
  deletePlanet: (id: number) =>
    fetch(`${BASE_URL}/planets/${id}`, { method: "DELETE" }).then((r) =>
      handle<void>(r),
    ),

  // 기록 추가
  addRecord: (planetId: number, content: string) =>
    fetch(`${BASE_URL}/planets/${planetId}/records`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ content }),
    }).then((r) => handle<LearningRecord>(r)),

  // 특정 행성의 기록 목록
  listRecords: (planetId: number) =>
    fetch(`${BASE_URL}/planets/${planetId}/records`).then((r) =>
      handle<LearningRecord[]>(r),
    ),
};
