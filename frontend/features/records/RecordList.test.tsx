import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecordList } from "./RecordList";
import { api } from "@/lib/api";
import type { RecordSummary } from "@/types/planet";

vi.mock("@/lib/api", () => ({
  api: { listRecords: vi.fn(), logout: vi.fn() },
}));
// 로그인·라우팅·전환 링크는 이 컴포넌트의 검증 대상이 아니다 → 얇게 대체
const fakeUser = { id: 1, name: "U", email: "u@e.com", picture: null };
vi.mock("@/features/auth", () => ({
  useRequireAuth: () => ({ user: fakeUser, loading: false }),
  useAuth: () => ({ user: fakeUser, refresh: vi.fn() }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/components/TransitionLink", () => ({
  TransitionLink: ({ href, children, ...rest }: React.ComponentProps<"a">) => (
    <a href={href as string} {...rest}>
      {children}
    </a>
  ),
}));

const mockedApi = vi.mocked(api);
const summary = (over: Partial<RecordSummary>): RecordSummary => ({
  id: 1,
  planet_id: 7,
  preview: "첫 번째 기록",
  created_at: "2026-01-01T00:00:00Z",
  ...over,
});

describe("RecordList", () => {
  beforeEach(() => vi.clearAllMocks());

  it("기록을 미리보기 카드로 나열하고, 각 카드가 읽기 페이지로 링크된다", async () => {
    mockedApi.listRecords.mockResolvedValue([
      summary({ id: 1, preview: "첫 번째 기록" }),
      summary({ id: 2, preview: "두 번째 기록" }),
    ]);
    render(<RecordList planetId={7} />);

    expect(await screen.findByText("첫 번째 기록")).toBeInTheDocument();
    expect(screen.getByText("두 번째 기록")).toBeInTheDocument();
    // 카드 → 읽기 라우트
    expect(screen.getByText("첫 번째 기록").closest("a")).toHaveAttribute(
      "href",
      "/planets/7/records/1",
    );
    expect(screen.getByText("2개의 기록")).toBeInTheDocument();
  });

  it("'새 기록' 진입점이 작성 페이지로 연결된다", async () => {
    mockedApi.listRecords.mockResolvedValue([summary({})]);
    render(<RecordList planetId={7} />);
    await screen.findByText("첫 번째 기록");

    expect(screen.getByRole("link", { name: /새 기록/ })).toHaveAttribute(
      "href",
      "/planets/7/records/new",
    );
  });

  it("기록이 없으면 첫 기록 작성을 유도한다", async () => {
    mockedApi.listRecords.mockResolvedValue([]);
    render(<RecordList planetId={7} />);

    expect(await screen.findByText(/아직 기록이 없어요/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "첫 기록 작성하기" })).toHaveAttribute(
      "href",
      "/planets/7/records/new",
    );
  });

  it("돌아가기는 행성 상세로 향한다", async () => {
    mockedApi.listRecords.mockResolvedValue([]);
    render(<RecordList planetId={7} />);
    await screen.findByText(/아직 기록이 없어요/);

    expect(screen.getByRole("link", { name: /행성으로/ })).toHaveAttribute("href", "/planets/7");
  });

  it("조회 실패 시 에러를 보여준다", async () => {
    mockedApi.listRecords.mockRejectedValue(new Error("요청 실패 (500)"));
    render(<RecordList planetId={7} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("요청 실패");
  });
});
