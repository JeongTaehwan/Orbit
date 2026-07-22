import { test, expect } from "@playwright/test";

/**
 * 3D 행성은 유닛 테스트(jsdom)로는 확인할 수 없다 — WebGL 이 없기 때문.
 * 실제 브라우저에서 캔버스가 붙고 WebGL 컨텍스트가 살아있는지만 확인한다.
 */
test.describe("행성 프리뷰 (3D)", () => {
  test("난이도 3종의 3D 캔버스가 실제로 그려진다", async ({ page }) => {
    await page.goto("/planet-preview");

    // dynamic(ssr:false) 라 서버 HTML 에는 없고, 브라우저에서 뒤늦게 붙는다
    await expect(page.locator("canvas")).toHaveCount(3, { timeout: 30_000 });

    const hasWebGL = await page.evaluate(() => {
      const c = document.querySelector("canvas") as HTMLCanvasElement;
      return !!(c.getContext("webgl2") || c.getContext("webgl"));
    });
    expect(hasWebGL).toBe(true);
  });

  test("진행도를 바꿔도 캔버스가 죽지 않는다", async ({ page }) => {
    const crashes: string[] = [];
    page.on("pageerror", (e) => crashes.push(String(e)));

    await page.goto("/planet-preview");
    await expect(page.locator("canvas")).toHaveCount(3, { timeout: 30_000 });

    for (const value of ["0", "60", "100"]) {
      await page.getByLabel("진행도").fill(value);
    }

    await expect(page.locator("canvas")).toHaveCount(3);
    expect(crashes).toEqual([]);
  });

  test("행성에 접근성 라벨이 붙어 있다", async ({ page }) => {
    await page.goto("/planet-preview");
    await expect(page.getByRole("img", { name: /테라포밍 \d+% .+/ }).first()).toBeVisible();
  });
});
