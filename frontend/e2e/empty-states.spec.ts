import { test, expect, type Page } from "@playwright/test";

/**
 * 빈 상태 e2e — 신규 사용자 흐름의 유도 표시를 확인한다.
 */

const API = "http://localhost:3000/api";
const auth = { id: 1, email: "u@e.com", name: "U", picture: null, created_at: "2026-01-01T00:00:00Z" };

async function mockAuth(page: Page) {
  await page.route(`${API}/auth/me`, (r) => r.fulfill({ json: auth }));
}

test("행성 0개: 우주 지도가 첫 행성 만들기를 유도한다", async ({ page }) => {
  await mockAuth(page);
  await page.route(`${API}/me/streak`, (r) =>
    r.fulfill({ json: { current_streak: 0, longest_streak: 0, today_logged: false } }),
  );
  await page.route(`${API}/planets`, (r) => r.fulfill({ json: [] }));

  await page.goto("/");
  await expect(page.getByText("아직 학습 행성이 없어요")).toBeVisible();
  // 유도 CTA 가 새 행성 모달을 연다
  await page.getByRole("button", { name: "첫 행성 만들기" }).click();
  await expect(page.getByRole("heading", { name: "새 행성 만들기" })).toBeVisible();
});

test("기록 0개: 기록 목록이 첫 기록 작성을 유도한다", async ({ page }) => {
  await mockAuth(page);
  await page.route(`${API}/planets/7/records`, (r) => r.fulfill({ json: [] }));

  await page.goto("/planets/7/records");
  await expect(page.getByText("아직 기록이 없어요")).toBeVisible();
  await expect(page.getByRole("link", { name: "첫 기록 작성하기" })).toHaveAttribute(
    "href",
    "/planets/7/records/new",
  );
});
