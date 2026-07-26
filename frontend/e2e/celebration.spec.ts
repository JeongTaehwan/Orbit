import { test, expect, type Page } from "@playwright/test";

/**
 * 100% 테라포밍 완성 축하 연출 e2e.
 *
 * 트리거 규칙("처음 완성되는 순간"만)을 실제 앱 이동으로 검증한다.
 * 캐시(모듈 전역)는 한 JS 컨텍스트 안에서만 유지되므로, page.goto 가 아니라
 * 앱 내 링크 이동으로 "80% 로 봤다가 100% 로 돌아오는" 흐름을 재현한다.
 */

const API = "http://localhost:3000/api";
const base = { id: 7, name: "파이썬 기초", difficulty: "easy" as const, created_at: "2026-01-01T00:00:00Z" };
const at80 = { ...base, record_count: 4, progress: 80, is_completed: false };
const at100 = { ...base, record_count: 5, progress: 100, is_completed: true };

async function mockAuth(page: Page) {
  await page.route(`${API}/auth/me`, (r) =>
    r.fulfill({
      json: { id: 1, email: "u@e.com", name: "U", picture: null, created_at: "2026-01-01T00:00:00Z" },
    }),
  );
  await page.route(`${API}/planets/7/records`, (r) => r.fulfill({ json: [] }));
}

const celebrateMsg = (page: Page) =>
  page.getByRole("status").filter({ hasText: "테라포밍 완료!" });

/** 80% 로 상세를 봤다가(캐시 저장) 100% 로 완성해 돌아오는 흐름 */
async function completeFlow(page: Page) {
  let planet = at80;
  await page.route(`${API}/planets/7`, (r) => r.fulfill({ json: planet }));

  await page.goto("/planets/7");
  await expect(page.getByRole("heading", { name: "파이썬 기초" })).toBeVisible();
  await page.getByRole("link", { name: /학습 기록 .*개 보기/ }).click();
  await expect(page).toHaveURL(/\/records$/);
  planet = at100; // 그 사이 마지막 기록으로 완성
  await page.getByRole("link", { name: /행성으로/ }).click();
  await expect(page).toHaveURL(/\/planets\/7$/);
}

test("처음 완성되는 순간 축하 메시지가 등장했다 사라진다", async ({ page }) => {
  await mockAuth(page);
  await completeFlow(page);

  await expect(celebrateMsg(page)).toBeVisible({ timeout: 4000 });
  // 연출이 끝나면 다시 사라지고 완성 상태만 남는다
  await expect(celebrateMsg(page)).toBeHidden({ timeout: 6000 });
  await expect(page.getByText(/테라포밍 완료 — 생명이 사는 행성/)).toBeVisible();
});

test("이미 완성된 행성을 직접 열면 축하하지 않는다", async ({ page }) => {
  await mockAuth(page);
  await page.route(`${API}/planets/7`, (r) => r.fulfill({ json: at100 }));

  await page.goto("/planets/7");
  await expect(page.getByRole("heading", { name: "파이썬 기초" })).toBeVisible();
  await page.waitForTimeout(1500);
  await expect(celebrateMsg(page)).toHaveCount(0);
  // 완성 상태의 정적 메시지는 유지
  await expect(page.getByText(/테라포밍 완료 — 생명이 사는 행성/)).toBeVisible();
});

test("모션 최소화 설정에선 축하 연출 없이 완성 상태만 표시된다", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockAuth(page);
  await completeFlow(page);

  // 애니메이션 연출(배너)은 뜨지 않는다
  await page.waitForTimeout(1500);
  await expect(celebrateMsg(page)).toHaveCount(0);
  // 완성 상태(정적 메시지)는 보인다
  await expect(page.getByText(/테라포밍 완료 — 생명이 사는 행성/)).toBeVisible();
});
