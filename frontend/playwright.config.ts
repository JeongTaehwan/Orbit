import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e", // e2e 테스트가 있는 폴더
  fullyParallel: true,
  use: {
    baseURL: "http://localhost:3000", // page.goto("/") 의 기준 주소
    trace: "on-first-retry", // 실패 시 디버깅용 추적 기록
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // 테스트 시작 전에 Next 개발 서버를 자동으로 띄우고, 준비될 때까지 기다림.
  // 이미 서버가 떠 있으면 그걸 재사용한다.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
