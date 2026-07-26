/**
 * FastAPI 백엔드 호출 클라이언트.
 *
 * 화면은 fetch를 직접 쓰지 않고 이 api 객체만 호출한다.
 * 모든 요청에 credentials:"include" → httpOnly 세션 쿠키가 함께 전송된다.
 */

import type { Difficulty, LearningRecord, Planet, RecordSummary } from "@/types/planet";
import type { Streak } from "@/types/streak";
import type { User } from "@/types/user";

export type { Difficulty, LearningRecord, Planet, RecordSummary } from "@/types/planet";
export type { Streak } from "@/types/streak";
export type { User } from "@/types/user";

// 항상 같은 오리진의 /api 로만 호출한다. next.config.ts 의 rewrites 가
// /api/* 를 백엔드로 프록시하므로, 브라우저 입장엔 same-origin → 세션 쿠키가 그대로 오간다.
const BASE_URL = "/api";

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

  // ── 스트릭 ──
  // 저장된 값이 아니라 서버가 기록 날짜로 계산해 준다 (기록 추가/삭제 후 다시 부르면 최신값)
  getStreak: () => req<Streak>("/me/streak"),

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

  // ── 이미지 업로드 ──
  // FormData 를 body 로 주면 브라우저가 Content-Type 을 boundary 와 함께 자동으로 붙인다.
  // (직접 "multipart/form-data" 를 지정하면 boundary 가 빠져 서버가 파싱하지 못한다)
  uploadImage: (file: File) => {
    const form = new FormData();
    form.append("file", file); // 필드명 "file" = 백엔드 UploadFile 파라미터 이름
    return req<{ url: string }>("/uploads/image", { method: "POST", body: form });
  },
};
