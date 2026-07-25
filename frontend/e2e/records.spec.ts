import { test, expect } from "@playwright/test";

/**
 * 기록 흐름(별도 페이지) e2e — 로그인·행성·기록 API 를 가로채 실제 라우팅을 확인한다.
 * 행성 상세 → 목록 → 작성 → 저장 → 읽기 전체 흐름과 뒤로가기·URL 직접 접근을 검증.
 */

const API = "http://localhost:8000";

const planet = {
  id: 7,
  name: "파이썬 기초",
  difficulty: "normal",
  record_count: 1,
  progress: 10,
  is_completed: false,
  created_at: "2026-01-01T00:00:00Z",
};

test.beforeEach(async ({ page }) => {
  await page.route(`${API}/auth/me`, (r) =>
    r.fulfill({
      json: { id: 1, email: "u@e.com", name: "U", picture: null, created_at: "2026-01-01T00:00:00Z" },
    }),
  );
  await page.route(`${API}/planets/7`, (r) => r.fulfill({ json: planet }));

  // 목록·조회·작성·삭제를 메모리 상태로 흉내낸다
  const records: { id: number; content: string; created_at: string }[] = [
    { id: 1, content: "# 첫 기록\n\n처음 남긴 내용", created_at: "2026-07-20T09:00:00Z" },
  ];
  const summary = (r: (typeof records)[number]) => ({
    id: r.id,
    planet_id: 7,
    preview: r.content.replace(/^#+\s*/, "").split("\n")[0],
    created_at: r.created_at,
  });

  await page.route(`${API}/planets/7/records`, async (route) => {
    if (route.request().method() === "POST") {
      const body = JSON.parse(route.request().postData() ?? "{}");
      const created = { id: 99, content: body.content, created_at: "2026-07-23T10:00:00Z" };
      records.push(created);
      await route.fulfill({ status: 201, json: { ...created, planet_id: 7 } });
    } else {
      await route.fulfill({ json: records.map(summary) });
    }
  });

  await page.route(`${API}/planets/7/records/*`, async (route) => {
    const id = Number(route.request().url().split("/").pop());
    const rec = records.find((r) => r.id === id);
    if (route.request().method() === "DELETE") {
      await route.fulfill({ status: 204, body: "" });
    } else if (rec) {
      await route.fulfill({ json: { ...rec, planet_id: 7 } });
    } else {
      await route.fulfill({ status: 404, json: { detail: "없음" } });
    }
  });
});

test("행성 상세 → 목록 → 작성 → 저장 → 읽기 전체 흐름", async ({ page }) => {
  await page.goto("/planets/7");
  await expect(page.getByRole("heading", { name: "파이썬 기초" })).toBeVisible();

  // 상세 → 목록
  await page.getByRole("link", { name: /학습 기록 .*개 보기/ }).click();
  await expect(page).toHaveURL(/\/planets\/7\/records$/);
  await expect(page.getByText("첫 기록")).toBeVisible();

  // 목록 → 작성
  await page.getByRole("link", { name: /새 기록/ }).click();
  await expect(page).toHaveURL(/\/planets\/7\/records\/new$/);

  // 작성 → 저장 → 방금 만든 기록의 읽기 페이지
  await page.getByLabel("마크다운 입력").fill("# 저장된 기록\n\n새로 쓴 본문");
  await page.getByRole("button", { name: "저장" }).click();
  await expect(page).toHaveURL(/\/planets\/7\/records\/99$/);
  await expect(page.getByRole("heading", { name: "저장된 기록" })).toBeVisible();
  await expect(page.getByText("새로 쓴 본문")).toBeVisible();
});

test("읽기 페이지에서 마크다운이 요소로 렌더된다", async ({ page }) => {
  await page.goto("/planets/7/records/1");
  // '# 첫 기록' 이 문법 그대로가 아니라 heading 으로
  await expect(page.getByRole("heading", { name: "첫 기록" })).toBeVisible();
  await expect(page.getByText("처음 남긴 내용")).toBeVisible();
});

test("뒤로가기(목록으로)가 동작한다", async ({ page }) => {
  await page.goto("/planets/7/records/1");
  await page.getByRole("link", { name: /목록으로/ }).click();
  await expect(page).toHaveURL(/\/planets\/7\/records$/);
  await expect(page.getByRole("heading", { name: "학습 기록" })).toBeVisible();
});

test("드로어 잔재가 없다 (기록은 페이지로만)", async ({ page }) => {
  await page.goto("/planets/7");
  await expect(page.getByRole("heading", { name: "파이썬 기초" })).toBeVisible();
  // 예전 드로어의 '새 기록 작성' 인라인 버튼이 상세에 남아있지 않다
  await expect(page.locator('[class*="drawer" i]')).toHaveCount(0);
});
