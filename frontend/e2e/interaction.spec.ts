import { test, expect, type Page } from "@playwright/test";

/**
 * 일상 인터랙션 연출 e2e.
 *
 * 기록 반영 펄스: 진행도가 오를 때(100% 아님)만 행성이 살짝 번쩍인다.
 * 트리거는 완성 축하와 같은 캐시-diff 원칙 — 처음 볼 땐 재생 안 함.
 */

const API = "http://localhost:8000";
const base = { id: 7, name: "P", difficulty: "normal" as const, created_at: "2026-01-01T00:00:00Z" };

async function mock(page: Page) {
  await page.route(`${API}/auth/me`, (r) =>
    r.fulfill({
      json: { id: 1, email: "u@e.com", name: "U", picture: null, created_at: "2026-01-01T00:00:00Z" },
    }),
  );
  await page.route(`${API}/planets/7/records`, (r) => r.fulfill({ json: [] }));
}

/** 상세를 한 번 본 뒤(캐시), 진행도를 올려 돌아오는 흐름 */
async function raiseTo(page: Page, from: number, to: number) {
  let planet = { ...base, record_count: 4, progress: from, is_completed: false };
  await page.route(`${API}/planets/7`, (r) => r.fulfill({ json: planet }));
  await page.goto("/planets/7");
  await expect(page.getByRole("heading", { name: "P" })).toBeVisible();
  await page.getByRole("link", { name: /학습 기록 .*개 보기/ }).click();
  await expect(page).toHaveURL(/\/records$/);
  planet = { ...planet, record_count: 6, progress: to, is_completed: to >= 100 };
  await page.getByRole("link", { name: /행성으로/ }).click();
  await expect(page).toHaveURL(/\/planets\/7$/);
}

test("진행도가 오르면 행성 펄스가 재생된다", async ({ page }) => {
  await mock(page);
  await raiseTo(page, 40, 60);
  await expect(page.locator(".orbit-pulse-halo")).toHaveCount(1);
});

test("단계 경계(50%)를 넘으면 더 눈에 띄는 stage 펄스", async ({ page }) => {
  await mock(page);
  await raiseTo(page, 40, 60); // 40→60: 50% 경계 넘음
  await expect(page.locator(".orbit-pulse-halo.orbit-pulse-halo--stage")).toHaveCount(1);
});

test("같은 단계 안에서 오르면 soft 펄스(경계 강조 없음)", async ({ page }) => {
  await mock(page);
  await raiseTo(page, 52, 60); // 같은 50~74 구간
  await expect(page.locator(".orbit-pulse-halo")).toHaveCount(1);
  await expect(page.locator(".orbit-pulse-halo--stage")).toHaveCount(0);
});

test("처음 여는 행성은 펄스가 없다 (직접 링크)", async ({ page }) => {
  await mock(page);
  await page.route(`${API}/planets/7`, (r) =>
    r.fulfill({ json: { ...base, record_count: 6, progress: 60, is_completed: false } }),
  );
  await page.goto("/planets/7");
  await expect(page.getByRole("heading", { name: "P" })).toBeVisible();
  await page.waitForTimeout(400);
  await expect(page.locator(".orbit-pulse-halo")).toHaveCount(0);
});

test("100% 도달은 펄스가 아니라 축하 연출로 간다", async ({ page }) => {
  await mock(page);
  await raiseTo(page, 80, 100);
  // 펄스는 뜨지 않고
  await expect(page.locator(".orbit-pulse-halo")).toHaveCount(0);
  // 축하 메시지가 뜬다
  await expect(page.getByRole("status").filter({ hasText: "테라포밍 완료!" })).toBeVisible({
    timeout: 4000,
  });
});
