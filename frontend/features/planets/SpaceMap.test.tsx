import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SpaceMap } from "./SpaceMap";
import { api } from "@/lib/api";
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
  },
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
  beforeEach(() => vi.clearAllMocks());

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
    expect(await screen.findByText(/아직 행성이 없습니다/)).toBeInTheDocument();
  });
});
