import { test, expect } from "@playwright/test";

// e2e: 우주 지도(메인) 화면. 백엔드가 없어도 아래 요소는 렌더됨.

test("우주 지도가 열리고 제목 Orbit 이 보인다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Orbit" })).toBeVisible();
});

test("새 행성 만들기 버튼을 누르면 모달이 열린다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "새 행성 만들기" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByPlaceholder("학습 주제 이름")).toBeVisible();
});
