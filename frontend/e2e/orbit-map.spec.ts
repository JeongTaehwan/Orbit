import { test, expect } from "@playwright/test";

/**
 * 궤도 지도는 WebGL 장면이라 jsdom 으로는 확인할 수 없다.
 * 로그인·행성 API 를 가로채 실제 브라우저에서 장면이 뜨는지, 카메라가 움직이는지 본다.
 */

const PLANETS = Array.from({ length: 4 }, (_, i) => ({
  id: i + 1,
  name: `행성 ${i + 1}`,
  difficulty: ["easy", "normal", "hard"][i % 3],
  record_count: i,
  progress: (i * 27) % 101,
  is_completed: i === 2,
  created_at: "2026-01-01T00:00:00Z",
}));

const API = "http://localhost:8000";

test.beforeEach(async ({ page }) => {
  await page.route(`${API}/auth/me`, (r) =>
    r.fulfill({
      json: { id: 1, email: "u@e.com", name: "U", picture: null, created_at: "2026-01-01T00:00:00Z" },
    }),
  );
  await page.route(`${API}/me/streak`, (r) =>
    r.fulfill({ json: { current_streak: 2, longest_streak: 4, today_logged: true } }),
  );
  await page.route(`${API}/planets`, (r) => r.fulfill({ json: PLANETS }));
  await page.route(`${API}/planets/*`, (r) => r.fulfill({ json: PLANETS[0] }));
});

test.describe("궤도 지도 (3D)", () => {
  test("행성이 몇 개든 캔버스는 하나다 (WebGL 컨텍스트 절약)", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("canvas", { timeout: 30_000 });

    await expect(page.locator("canvas")).toHaveCount(1);
    const alive = await page.evaluate(() => {
      const c = document.querySelector("canvas") as HTMLCanvasElement;
      return !!(c.getContext("webgl2") || c.getContext("webgl"));
    });
    expect(alive).toBe(true);
  });

  test("행성마다 이동 가능한 링크 라벨이 붙는다", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".orbit-map-label", { timeout: 30_000 });

    const links = page.locator(".orbit-map-label");
    await expect(links).toHaveCount(PLANETS.length);
    // 캔버스 밖 진짜 <a> 라 href 로 이동할 수 있다
    for (const p of PLANETS) {
      await expect(page.locator(`.orbit-map-label[href="/planets/${p.id}"]`)).toHaveCount(1);
    }
  });

  test("끌면 카메라가 돌아 라벨 위치가 바뀐다", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".orbit-map-label", { timeout: 30_000 });
    await page.waitForTimeout(600);

    const pos = () =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll(".orbit-map-label")).map((el) => {
          const r = el.getBoundingClientRect();
          return [Math.round(r.x), Math.round(r.y)];
        }),
      );

    const before = await pos();

    const box = (await page.locator("canvas").boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 240, cy - 120, { steps: 15 });
    await page.mouse.up();
    await page.waitForTimeout(800);

    const after = await pos();
    expect(after).not.toEqual(before);
  });

  test("장면이 콘솔 에러 없이 뜬다", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto("/");
    await page.waitForSelector(".orbit-map-label", { timeout: 30_000 });
    await page.waitForTimeout(1200);

    expect(errors).toEqual([]);
  });
});

test.describe("행성 선택", () => {
  test("행성을 클릭하면 상세로 이동한다", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".orbit-map-label", { timeout: 30_000 });
    await page.waitForTimeout(800);

    // 첫 행성의 라벨 위치로 화면 좌표를 알아내고, 그 바로 위(=행성 본체)를 클릭
    const target = await page.evaluate(() => {
      const el = document.querySelector(".orbit-map-label") as HTMLElement;
      const r = el.getBoundingClientRect();
      return { href: el.getAttribute("href"), x: r.x + r.width / 2, y: r.y - 26 };
    });

    await page.mouse.click(target.x, target.y);
    await page.waitForURL(`**${target.href}`, { timeout: 10_000 });
    expect(page.url()).toContain(target.href!);
  });

  test("라벨에 마우스를 올리면 공전이 멈춰 누를 수 있다", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".orbit-map-label", { timeout: 30_000 });
    await page.waitForTimeout(800);

    const center = () =>
      page.evaluate(() => {
        const r = document.querySelector(".orbit-map-label")!.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      });

    // 마우스를 올리면 그 자리에 멈춰야 한다 (움직이는 과녁이면 누를 수 없다)
    const before = await center();
    await page.mouse.move(before.x, before.y);
    await page.waitForTimeout(500);
    const after = await center();
    expect(Math.abs(after.x - before.x)).toBeLessThan(3);
    expect(Math.abs(after.y - before.y)).toBeLessThan(3);

    const href = await page
      .locator(".orbit-map-label")
      .first()
      .getAttribute("href");
    await page.mouse.click(after.x, after.y);
    await page.waitForURL(`**${href}`, { timeout: 10_000 });
    expect(page.url()).toContain(href!);
  });
});

test.describe("행성으로 날아가기", () => {
  test("클릭하면 카메라가 행성으로 다가간 뒤 상세로 이동한다", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".orbit-map-label", { timeout: 30_000 });
    await page.waitForTimeout(800);

    // 라벨 바로 위 = 행성 본체
    const target = await page.evaluate(() => {
      const el = document.querySelector(".orbit-map-label") as HTMLElement;
      const r = el.getBoundingClientRect();
      return { href: el.getAttribute("href"), x: r.x + r.width / 2, y: r.y - 26 };
    });

    // 클릭 직후에는 아직 지도에 머무르며 연출이 돌아간다
    await page.mouse.click(target.x, target.y);
    await page.waitForTimeout(250);
    expect(page.url()).not.toContain(target.href!);

    // 연출이 끝나면 상세로 넘어간다
    await page.waitForURL(`**${target.href}`, { timeout: 10_000 });
    expect(page.url()).toContain(target.href!);
  });

  test("연출 중 라벨이 걷힌다 (화면을 가리지 않게)", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".orbit-map-label", { timeout: 30_000 });
    await page.waitForTimeout(800);

    const target = await page.evaluate(() => {
      const el = document.querySelector(".orbit-map-label") as HTMLElement;
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y - 26 };
    });

    await page.mouse.click(target.x, target.y);

    // 한 시점만 보면 부하로 프레임이 밀릴 때 흔들린다 → 구간 안에서 걷히는지 본다
    let faded = false;
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(50);
      const opacity = await page.evaluate(() => {
        const el = document.querySelector(".orbit-map-label") as HTMLElement | null;
        return el ? Number(el.style.opacity) : 0;
      });
      if (opacity < 0.5) {
        faded = true;
        break;
      }
    }
    expect(faded).toBe(true);
  });
});

test("도착 후 상세로 넘어갈 때 화면 전환이 걸린다", async ({ page }) => {
  // 하드 컷이면 뚝 끊겨 보인다 → View Transition 을 실제로 태우는지 확인
  await page.addInitScript(() => {
    (window as Window & { __vt?: number }).__vt = 0;
    const orig = (document as Document & { startViewTransition?: unknown })
      .startViewTransition as ((cb: () => void) => unknown) | undefined;
    if (typeof orig === "function") {
      Object.defineProperty(document, "startViewTransition", {
        configurable: true,
        value: (cb: () => void) => {
          (window as Window & { __vt?: number }).__vt!++;
          return orig.call(document, cb);
        },
      });
    }
  });

  await page.goto("/");
  await page.waitForSelector(".orbit-map-label", { timeout: 30_000 });
  await page.waitForTimeout(800);

  const target = await page.evaluate(() => {
    const el = document.querySelector(".orbit-map-label") as HTMLElement;
    const r = el.getBoundingClientRect();
    return { href: el.getAttribute("href"), x: r.x + r.width / 2, y: r.y - 26 };
  });

  await page.mouse.click(target.x, target.y);
  await page.waitForURL(`**${target.href}`, { timeout: 10_000 });

  const calls = await page.evaluate(() => (window as Window & { __vt?: number }).__vt);
  expect(calls).toBe(1);
});

test("다이브 막판에 구름이 화면을 완전히 덮었다가 갈라진다", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector(".orbit-map-label", { timeout: 30_000 });
  await page.waitForTimeout(800);

  const target = await page.evaluate(() => {
    const el = document.querySelector(".orbit-map-label") as HTMLElement;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y - 26 };
  });

  await page.mouse.click(target.x, target.y);

  // 다이브 내내 구름 상태를 촘촘히 기록한다 (스크린샷은 타이밍을 못 맞춘다)
  const samples = await page.evaluate(
    () =>
      new Promise<{ t: number; op: number; bg: string; shift: number; w: number; h: number }[]>(
        (resolve) => {
          const out: { t: number; op: number; bg: string; shift: number; w: number; h: number }[] = [];
          const t0 = performance.now();
          const tick = () => {
            const v = document.querySelector(".orbit-dive-veil") as HTMLElement | null;
            if (v) {
              const cs = getComputedStyle(v);
              const r = v.getBoundingClientRect();
              const cloud = document.querySelector(".orbit-dive-cloud") as HTMLElement | null;
              out.push({
                t: Math.round(performance.now() - t0),
                op: Number(cs.opacity),
                bg: cs.backgroundColor.replace(/\s/g, ""),
                shift: Math.abs(
                  Number(/translate3d\((-?[\d.]+)%/.exec(cloud?.style.transform ?? "")?.[1] ?? 0),
                ),
                w: Math.round(r.width),
                h: Math.round(r.height),
              });
            }
            if (performance.now() - t0 < 1000) setTimeout(tick, 30);
            else resolve(out);
          };
          tick();
        },
      ),
  );

  const vw = page.viewportSize()!;

  // 완전히 덮인 순간이 있어야 한다: 뷰포트 전체 크기 + opacity 1 + 불투명 배경
  const covered = samples.filter(
    (s) => s.op === 1 && /^rgb\(/.test(s.bg) && s.w >= vw.width && s.h >= vw.height,
  );
  expect(covered.length).toBeGreaterThan(0);

  // 그 뒤에 좌우로 갈라진다
  const lastCovered = covered[covered.length - 1];
  const parted = samples.filter((s) => s.t > lastCovered.t && s.shift > 20);
  expect(parted.length).toBeGreaterThan(0);
});
