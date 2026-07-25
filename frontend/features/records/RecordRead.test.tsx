import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RecordRead } from "./RecordRead";
import { api } from "@/lib/api";
import type { LearningRecord } from "@/types/planet";

vi.mock("@/lib/api", () => ({
  api: { getRecord: vi.fn(), deleteRecord: vi.fn(), logout: vi.fn() },
}));
const push = vi.fn();
const fakeUser = { id: 1, name: "U", email: "u@e.com", picture: null };
vi.mock("@/features/auth", () => ({
  useRequireAuth: () => ({ user: fakeUser, loading: false }),
  useAuth: () => ({ user: fakeUser, refresh: vi.fn() }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));
vi.mock("@/components/TransitionLink", () => ({
  TransitionLink: ({ href, children, ...rest }: React.ComponentProps<"a">) => (
    <a href={href as string} {...rest}>
      {children}
    </a>
  ),
}));

const mockedApi = vi.mocked(api);
const record = (over: Partial<LearningRecord> = {}): LearningRecord => ({
  id: 1,
  planet_id: 7,
  content: "# 렌더된 제목\n\n본문 내용입니다.",
  created_at: "2026-01-01T00:00:00Z",
  ...over,
});

describe("RecordRead", () => {
  beforeEach(() => vi.clearAllMocks());

  it("마크다운을 렌더해 보여준다 (문법 그대로가 아니라 요소로)", async () => {
    mockedApi.getRecord.mockResolvedValue(record());
    render(<RecordRead planetId={7} recordId={1} />);

    // '# 렌더된 제목' 이 heading 요소로 렌더된다
    expect(await screen.findByRole("heading", { name: "렌더된 제목" })).toBeInTheDocument();
    expect(screen.getByText("본문 내용입니다.")).toBeInTheDocument();
  });

  it("삭제하면 목록 페이지로 이동한다", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mockedApi.getRecord.mockResolvedValue(record());
    mockedApi.deleteRecord.mockResolvedValue(undefined);
    render(<RecordRead planetId={7} recordId={1} />);
    await screen.findByRole("heading", { name: "렌더된 제목" });

    fireEvent.click(screen.getByRole("button", { name: "이 기록 삭제" }));

    await waitFor(() => expect(mockedApi.deleteRecord).toHaveBeenCalledWith(7, 1));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/planets/7/records"));
  });

  it("확인을 취소하면 삭제하지 않는다", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    mockedApi.getRecord.mockResolvedValue(record());
    render(<RecordRead planetId={7} recordId={1} />);
    await screen.findByRole("heading", { name: "렌더된 제목" });

    fireEvent.click(screen.getByRole("button", { name: "이 기록 삭제" }));
    expect(mockedApi.deleteRecord).not.toHaveBeenCalled();
  });

  it("돌아가기는 목록으로 향한다", async () => {
    mockedApi.getRecord.mockResolvedValue(record());
    render(<RecordRead planetId={7} recordId={1} />);
    await screen.findByRole("heading", { name: "렌더된 제목" });

    expect(screen.getByRole("link", { name: /목록으로/ })).toHaveAttribute(
      "href",
      "/planets/7/records",
    );
  });

  it("조회 실패 시 에러를 보여준다", async () => {
    mockedApi.getRecord.mockRejectedValue(new Error("기록을 찾을 수 없습니다"));
    render(<RecordRead planetId={7} recordId={99} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("찾을 수 없습니다");
  });
});
