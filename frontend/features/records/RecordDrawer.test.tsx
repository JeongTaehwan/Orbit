import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import { RecordDrawer } from "./RecordDrawer";
import { api } from "@/lib/api";
import type { LearningRecord, RecordSummary } from "@/types/planet";

vi.mock("@/lib/api", () => ({
  api: {
    listRecords: vi.fn(),
    getRecord: vi.fn(),
    addRecord: vi.fn(),
    deleteRecord: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

const summary = (over: Partial<RecordSummary>): RecordSummary => ({
  id: 1,
  planet_id: 1,
  preview: "첫 번째 기록",
  created_at: "2026-01-01T00:00:00Z",
  ...over,
});

const full = (over: Partial<LearningRecord>): LearningRecord => ({
  id: 1,
  planet_id: 1,
  content: "# 렌더된 제목\n\n본문 내용",
  created_at: "2026-01-01T00:00:00Z",
  ...over,
});

describe("RecordDrawer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("목록 모드로 열리면 '새 기록 작성' 버튼과 미리보기 목록을 보여준다", async () => {
    mockedApi.listRecords.mockResolvedValue([
      summary({ id: 1, preview: "첫 번째 기록" }),
      summary({ id: 2, preview: "두 번째 기록" }),
    ]);
    render(<RecordDrawer planetId={1} open onClose={vi.fn()} />);

    expect(await screen.findByText("첫 번째 기록")).toBeInTheDocument();
    expect(screen.getByText("두 번째 기록")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "새 기록 작성" })).toBeInTheDocument();
    expect(mockedApi.listRecords).toHaveBeenCalledWith(1);
  });

  it("목록 → '새 기록 작성' → 저장하면 addRecord + onChanged 후 드로어를 닫는다", async () => {
    mockedApi.listRecords.mockResolvedValue([]);
    mockedApi.addRecord.mockResolvedValue(full({ id: 9 }));
    const onChanged = vi.fn();
    const onClose = vi.fn();
    render(<RecordDrawer planetId={1} open onClose={onClose} onChanged={onChanged} />);

    // 목록 → 작성
    fireEvent.click(await screen.findByRole("button", { name: "새 기록 작성" }));
    const textarea = await screen.findByLabelText("마크다운 입력");
    fireEvent.change(textarea, { target: { value: "# 오늘 배운 것" } });

    // 저장
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(mockedApi.addRecord).toHaveBeenCalledWith(1, "# 오늘 배운 것"));
    expect(onChanged).toHaveBeenCalled();
    // 작성 완료 → 드로어 닫힘
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("initialMode='compose' 면 바로 작성 모드로 연다", async () => {
    mockedApi.listRecords.mockResolvedValue([]);
    render(<RecordDrawer planetId={1} open onClose={vi.fn()} initialMode="compose" />);
    expect(await screen.findByLabelText("마크다운 입력")).toBeInTheDocument();
  });

  it("항목 클릭 → 전문(마크다운)을 렌더하고 목록으로 돌아온다", async () => {
    mockedApi.listRecords.mockResolvedValue([summary({ id: 7, preview: "클릭할 기록" })]);
    mockedApi.getRecord.mockResolvedValue(full({ id: 7 }));
    render(<RecordDrawer planetId={1} open onClose={vi.fn()} />);

    fireEvent.click(await screen.findByText("클릭할 기록"));

    // 읽기 모드: 마크다운이 렌더됨
    expect(await screen.findByRole("heading", { name: "렌더된 제목" })).toBeInTheDocument();
    expect(mockedApi.getRecord).toHaveBeenCalledWith(1, 7);

    // 목록으로 돌아가기
    fireEvent.click(screen.getByText("← 목록으로"));
    expect(await screen.findByText("클릭할 기록")).toBeInTheDocument();
  });

  it("읽기 화면에서 삭제하면 api 호출 + onChanged 콜백이 실행된다", async () => {
    mockedApi.listRecords.mockResolvedValue([summary({ id: 3, preview: "지울 기록" })]);
    mockedApi.getRecord.mockResolvedValue(full({ id: 3 }));
    mockedApi.deleteRecord.mockResolvedValue(undefined);
    const onChanged = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<RecordDrawer planetId={1} open onClose={vi.fn()} onChanged={onChanged} />);
    fireEvent.click(await screen.findByText("지울 기록"));
    fireEvent.click(await screen.findByText("이 기록 삭제"));

    await waitFor(() => expect(mockedApi.deleteRecord).toHaveBeenCalledWith(1, 3));
    expect(onChanged).toHaveBeenCalled();
  });

  it("기록이 없으면 안내 문구를 보여준다", async () => {
    mockedApi.listRecords.mockResolvedValue([]);
    const { baseElement } = render(<RecordDrawer planetId={1} open onClose={vi.fn()} />);
    await waitFor(() =>
      expect(within(baseElement).getByText("아직 기록이 없습니다.")).toBeInTheDocument(),
    );
  });
});
