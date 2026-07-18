import { test, expect } from "@playwright/test";

// e2e: 실제 브라우저가 진짜 Next 서버에 접속해 화면을 확인한다.
// (백엔드가 안 떠 있어도 아래 요소들은 렌더되므로 연결과 무관하게 통과)

test("홈 화면이 열리고 제목 Orbit 이 보인다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Orbit" })).toBeVisible();
});

test("행성 생성 폼(입력·난이도·버튼)이 있다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByPlaceholder("학습 주제 이름")).toBeVisible();
  await expect(page.getByRole("button", { name: "생성" })).toBeVisible();
});
