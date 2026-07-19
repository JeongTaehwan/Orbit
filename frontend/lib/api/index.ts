/**
 * FastAPI 백엔드 호출 클라이언트.
 *
 * 화면은 fetch를 직접 쓰지 않고 이 api 객체만 호출한다.
 * 모든 요청에 credentials:"include" → httpOnly 세션 쿠키가 함께 전송된다.
 */

import type { Difficulty, LearningRecord, Planet, RecordSummary } from "@/types/planet";
import type { User } from "@/types/user";

export type { Difficulty, LearningRecord, Planet, RecordSummary } from "@/types/planet";
export type { User } from "@/types/user";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** 구글 로그인 시작 URL (전체 페이지 이동으로 사용) */
export const GOOGLE_LOGIN_URL = `${BASE_URL}/auth/google`;

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

/** 공통 요청 헬퍼 — 항상 세션 쿠키 포함 */
function req<T>(path: string, init?: RequestInit): Promise<T> {
  return fetch(`${BASE_URL}${path}`, { credentials: "include", ...init }).then((r) =>
    handle<T>(r),
  );
}

export const api = {
  // ── 인증 ──
  me: async (): Promise<User | null> => {
    // 미로그인(401)은 에러가 아니라 "사용자 없음"으로 처리
    const res = await fetch(`${BASE_URL}/auth/me`, { credentials: "include" });
    if (res.status === 401) return null;
    return handle<User>(res);
  },
  logout: () => req<{ ok: boolean }>("/auth/logout", { method: "POST" }),

  // ── 행성 ──
  listPlanets: () => req<Planet[]>("/planets"),
  getPlanet: (id: number) => req<Planet>(`/planets/${id}`),
  createPlanet: (data: { name: string; difficulty: Difficulty }) =>
    req<Planet>("/planets", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),
  deletePlanet: (id: number) => req<void>(`/planets/${id}`, { method: "DELETE" }),

  // ── 기록 ──
  addRecord: (planetId: number, content: string) =>
    req<LearningRecord>(`/planets/${planetId}/records`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ content }),
    }),
  // 목록: 축약본(preview)만 — 전문은 상세에서 따로 조회
  listRecords: (planetId: number) =>
    req<RecordSummary[]>(`/planets/${planetId}/records`),
  getRecord: (planetId: number, recordId: number) =>
    req<LearningRecord>(`/planets/${planetId}/records/${recordId}`),
  deleteRecord: (planetId: number, recordId: number) =>
    req<void>(`/planets/${planetId}/records/${recordId}`, { method: "DELETE" }),
};
