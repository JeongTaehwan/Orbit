import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";
import { api } from "@/lib/api";

// 백엔드 호출은 실제로 하지 않고 api 모듈을 통째로 가짜(mock)로 대체한다.
// → 네트워크 없이 화면 로직만 검증.
vi.mock("@/lib/api", () => ({
  api: {
    listPlanets: vi.fn(),
    createPlanet: vi.fn(),
    deletePlanet: vi.fn(),
    addRecord: vi.fn(),
    listRecords: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe("Home 화면", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("제목 Orbit 이 보인다", async () => {
    mockedApi.listPlanets.mockResolvedValue([]);
    render(<Home />);
    expect(screen.getByRole("heading", { name: "Orbit" })).toBeInTheDocument();
  });

  it("행성 목록을 불러와 이름과 진행도를 표시한다", async () => {
    mockedApi.listPlanets.mockResolvedValue([
      {
        id: 1,
        name: "파이썬 기초",
        difficulty: "easy",
        progress: 40,
        is_completed: false,
        created_at: "2026-01-01T00:00:00Z",
      },
    ]);

    render(<Home />);

    // useEffect 로 비동기 로드되므로 findBy(비동기)로 기다린다
    expect(await screen.findByText("파이썬 기초")).toBeInTheDocument();
    expect(await screen.findByText(/진행도/)).toHaveTextContent("40%");
  });

  it("행성이 없으면 안내 문구를 보여준다", async () => {
    mockedApi.listPlanets.mockResolvedValue([]);
    render(<Home />);
    expect(await screen.findByText(/아직 행성이 없습니다/)).toBeInTheDocument();
  });

  it("목록 불러오기 실패 시 에러 메시지를 보여준다", async () => {
    mockedApi.listPlanets.mockRejectedValue(new Error("서버 연결 실패"));
    render(<Home />);
    expect(await screen.findByText(/서버 연결 실패/)).toBeInTheDocument();
  });
});
