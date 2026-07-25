import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RecordCompose } from "./RecordCompose";
import { api } from "@/lib/api";
import type { LearningRecord } from "@/types/planet";

vi.mock("@/lib/api", () => ({
  api: { addRecord: vi.fn(), logout: vi.fn() },
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
const created = (over: Partial<LearningRecord> = {}): LearningRecord => ({
  id: 42,
  planet_id: 7,
  content: "저장된 내용",
  created_at: "2026-01-01T00:00:00Z",
  ...over,
});

describe("RecordCompose", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("빈 내용이면 저장 버튼이 비활성화된다", () => {
    render(<RecordCompose planetId={7} />);
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
  });

  it("작성 후 저장하면 방금 만든 기록의 읽기 페이지로 이동한다", async () => {
    mockedApi.addRecord.mockResolvedValue(created({ id: 42 }));
    render(<RecordCompose planetId={7} />);

    fireEvent.change(screen.getByLabelText("마크다운 입력"), {
      target: { value: "# 오늘 배운 것" },
    });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(mockedApi.addRecord).toHaveBeenCalledWith(7, "# 오늘 배운 것"));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/planets/7/records/42"));
  });

  it("저장에 실패하면 에러를 보여주고 페이지에 머문다", async () => {
    mockedApi.addRecord.mockRejectedValue(new Error("요청 실패 (500)"));
    render(<RecordCompose planetId={7} />);

    fireEvent.change(screen.getByLabelText("마크다운 입력"), { target: { value: "내용" } });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("요청 실패");
    expect(push).not.toHaveBeenCalled();
  });

  it("돌아가기는 목록으로 향한다", () => {
    render(<RecordCompose planetId={7} />);
    expect(screen.getByRole("link", { name: /목록으로/ })).toHaveAttribute(
      "href",
      "/planets/7/records",
    );
  });
});
