import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()], // JSX/TSX 컴파일
  // "@/..." import 별칭을 tsconfig.json 의 paths 에서 읽어옴 (Vite 네이티브)
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom", // 브라우저 DOM을 흉내내는 가짜 환경
    globals: true, // describe/it/expect 를 import 없이 사용
    setupFiles: ["./vitest.setup.ts"], // 매 테스트 전에 실행할 세팅
    // e2e(playwright) 테스트는 vitest가 건드리지 않도록 제외
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
