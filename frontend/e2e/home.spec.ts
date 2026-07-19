import { test, expect } from "@playwright/test";

// e2e: 인증. 백엔드가 없으면 /auth/me 호출이 실패 → 미로그인으로 간주.

test("미로그인 시 /login 으로 이동하고 구글 로그인 버튼이 보인다", async ({ page }) => {
  await page.goto("/");
  await page.waitForURL("**/login");
  await expect(page.getByRole("link", { name: /구글로 로그인/ })).toBeVisible();
});

test("로그인 화면에 Orbit 로고가 보인다", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Orbit" })).toBeVisible();
});
