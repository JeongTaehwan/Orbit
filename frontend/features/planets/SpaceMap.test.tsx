import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SpaceMap } from "./SpaceMap";
import { api } from "@/lib/api";
import { clearPlanetCache } from "@/lib/planetCache";
import type { Planet } from "@/types/planet";

vi.mock("@/lib/api", () => ({
  api: {
    me: vi.fn(),
    logout: vi.fn(),
    listPlanets: vi.fn(),
    createPlanet: vi.fn(),
    deletePlanet: vi.fn(),
    getPlanet: vi.fn(),
    addRecord: vi.fn(),
    listRecords: vi.fn(),
    getStreak: vi.fn(),
  },
}));

// 궤도 지도는 WebGL 장면이라 jsdom 에서 못 뜬다 → 어떤 행성을 넘겨받았는지만 드러내는
// 가짜로 바꾼다. (실제 3D 렌더는 e2e 가 브라우저에서 확인)
vi.mock("./OrbitScene", () => ({
  default: ({ planets, animate }: { planets: Planet[]; animate: boolean }) => (
    <div data-testid="orbit-scene" data-animate={String(animate)}>
      {planets.map((p) => (
        <span key={p.id}>{p.name}</span>
      ))}
    </div>
  ),
}));

// 인증은 로그인된 사용자로 고정 (auth 컨텍스트/라우터는 테스트 대상 아님)
const fakeUser = {
  id: 1,
  email: "u1@example.com",
  name: "User One",
  picture: null,
  created_at: "2026-01-01T00:00:00Z",
};
vi.mock("@/features/auth", () => ({
  useRequireAuth: () => ({ user: fakeUser, loading: false, refresh: vi.fn() }),
  useAuth: () => ({ user: fakeUser, loading: false, refresh: vi.fn() }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockedApi = vi.mocked(api);

const planet = (over: Partial<Planet>): Planet => ({
  id: 1,
  name: "파이썬 기초",
  difficulty: "easy",
  record_count: 2,
  progress: 40,
  is_completed: false,
  created_at: "2026-01-01T00:00:00Z",
  ...over,
});

describe("SpaceMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearPlanetCache(); // 모듈 전역 캐시가 테스트 간 새지 않게
    mockedApi.getStreak.mockResolvedValue({
      current_streak: 0,
      longest_streak: 0,
      today_logged: false,
    });
  });

  it("제목과 새 행성 버튼을 보여준다", async () => {
    mockedApi.listPlanets.mockResolvedValue([]);
    render(<SpaceMap />);
    expect(await screen.findByRole("heading", { name: "Orbit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "새 행성 만들기" })).toBeInTheDocument();
  });

  it("행성 목록과 통계를 표시한다", async () => {
    mockedApi.listPlanets.mockResolvedValue([
      planet({ id: 1, name: "파이썬 기초", record_count: 5, progress: 100, is_completed: true }),
      planet({ id: 2, name: "선형대수", record_count: 2, progress: 20 }),
    ]);
    render(<SpaceMap />);
    expect(await screen.findByText("파이썬 기초")).toBeInTheDocument();
    expect(screen.getByText("선형대수")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument(); // 총 기록 5+2
  });

  it("행성이 없으면 안내 문구를 보여준다", async () => {
    mockedApi.listPlanets.mockResolvedValue([]);
    render(<SpaceMap />);
    expect(await screen.findByText(/아직 학습 행성이 없어요/)).toBeInTheDocument();
  });

  it("통계 영역에 스트릭을 함께 보여준다", async () => {
    mockedApi.listPlanets.mockResolvedValue([]);
    mockedApi.getStreak.mockResolvedValue({
      current_streak: 5,
      longest_streak: 12,
      today_logged: true,
    });
    render(<SpaceMap />);

    expect(await screen.findByText("연속 학습(일)")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("최장 12일")).toBeInTheDocument();
  });

  it("스트릭 조회가 실패해도 지도는 정상 렌더된다", async () => {
    mockedApi.listPlanets.mockResolvedValue([planet({ id: 1, name: "파이썬 기초" })]);
    mockedApi.getStreak.mockRejectedValue(new Error("500"));
    render(<SpaceMap />);

    expect(await screen.findByText("파이썬 기초")).toBeInTheDocument();
    expect(screen.queryByText("연속 학습(일)")).not.toBeInTheDocument();
  });
});
