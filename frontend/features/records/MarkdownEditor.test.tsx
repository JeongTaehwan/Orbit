import { describe, it, expect, vi, beforeEach } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MarkdownEditor } from "./MarkdownEditor";
import { api } from "@/lib/api";

// 업로드는 네트워크를 타지 않도록 api 를 가짜로 바꾼다
vi.mock("@/lib/api", () => ({
  api: { uploadImage: vi.fn() },
}));
const uploadImage = vi.mocked(api.uploadImage);

// 제어 컴포넌트라 상태를 쥐고 있는 하니스로 감싼다
function Harness({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <MarkdownEditor value={value} onChange={setValue} />;
}

function pngFile(name = "shot.png", size = 10) {
  return new File([new Uint8Array(size)], name, { type: "image/png" });
}

beforeEach(() => {
  uploadImage.mockReset();
  uploadImage.mockResolvedValue({ url: "https://cdn.test/a.png" });
});

describe("MarkdownEditor", () => {
  it("입력하면 미리보기에 실시간 반영된다", async () => {
    render(<Harness />);
    const textarea = screen.getByLabelText("마크다운 입력");

    fireEvent.change(textarea, { target: { value: "# 실시간" } });

    const preview = screen.getByLabelText("미리보기");
    expect(await screen.findByRole("heading", { name: "실시간" })).toBeInTheDocument();
    expect(preview).toContainElement(screen.getByRole("heading", { name: "실시간" }));
  });

  it("툴바 '굵게'가 선택 텍스트를 **로 감싼다", () => {
    render(<Harness initial="hi" />);
    const textarea = screen.getByLabelText("마크다운 입력") as HTMLTextAreaElement;

    textarea.setSelectionRange(0, 2); // "hi" 선택
    fireEvent.click(screen.getByRole("button", { name: "굵게" }));

    expect(textarea.value).toBe("**hi**");
  });

  it("툴바 '이미지 URL'이 이미지 문법을 삽입한다", () => {
    render(<Harness />);
    const textarea = screen.getByLabelText("마크다운 입력") as HTMLTextAreaElement;

    fireEvent.click(screen.getByRole("button", { name: "이미지 URL" }));

    expect(textarea.value).toContain("![");
    expect(textarea.value).toContain("](https://)");
  });

  describe("이미지 업로드", () => {
    it("파일을 고르면 업로드하고 커서 위치에 ![alt](url) 을 넣는다", async () => {
      render(<Harness />);
      const textarea = screen.getByLabelText("마크다운 입력") as HTMLTextAreaElement;

      fireEvent.change(screen.getByLabelText("이미지 파일 선택"), {
        target: { files: [pngFile("스크린샷.png")] },
      });

      await waitFor(() =>
        expect(textarea.value).toBe("![스크린샷](https://cdn.test/a.png)"),
      );
      expect(uploadImage).toHaveBeenCalledTimes(1);
    });

    it("커서가 글 중간에 있으면 그 자리에 삽입된다", async () => {
      render(<Harness initial="앞뒤" />);
      const textarea = screen.getByLabelText("마크다운 입력") as HTMLTextAreaElement;

      textarea.setSelectionRange(1, 1); // "앞" 과 "뒤" 사이
      fireEvent.change(screen.getByLabelText("이미지 파일 선택"), {
        target: { files: [pngFile("a.png")] },
      });

      await waitFor(() => expect(textarea.value).toBe("앞![a](https://cdn.test/a.png)뒤"));
    });

    it("이미지를 드롭하면 업로드된다", async () => {
      render(<Harness />);
      const textarea = screen.getByLabelText("마크다운 입력") as HTMLTextAreaElement;

      fireEvent.drop(textarea, { dataTransfer: { files: [pngFile()], types: ["Files"] } });

      await waitFor(() => expect(textarea.value).toContain("https://cdn.test/a.png"));
    });

    it("이미지를 붙여넣으면 업로드된다 (스크린샷 Ctrl+V)", async () => {
      render(<Harness />);
      const textarea = screen.getByLabelText("마크다운 입력") as HTMLTextAreaElement;
      const file = pngFile();

      fireEvent.paste(textarea, {
        clipboardData: {
          items: [{ kind: "file", type: "image/png", getAsFile: () => file }],
        },
      });

      await waitFor(() => expect(textarea.value).toContain("https://cdn.test/a.png"));
      expect(uploadImage).toHaveBeenCalledWith(file);
    });

    it("텍스트 붙여넣기는 업로드로 가로채지 않는다", () => {
      render(<Harness />);
      const textarea = screen.getByLabelText("마크다운 입력");

      fireEvent.paste(textarea, {
        clipboardData: { items: [{ kind: "string", type: "text/plain", getAsFile: () => null }] },
      });

      expect(uploadImage).not.toHaveBeenCalled();
    });

    it("업로드 중에는 로딩을 보여준다", async () => {
      let resolve!: (v: { url: string }) => void;
      uploadImage.mockReturnValue(new Promise((r) => (resolve = r)));
      render(<Harness />);

      fireEvent.change(screen.getByLabelText("이미지 파일 선택"), {
        target: { files: [pngFile()] },
      });

      expect(await screen.findByRole("status")).toHaveTextContent("이미지 업로드 중…");

      resolve({ url: "https://cdn.test/a.png" });
      await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    });

    it("업로드 실패하면 에러를 보여주고 본문은 그대로 둔다", async () => {
      uploadImage.mockRejectedValue(new Error("요청 실패 (502): 업로드 실패"));
      render(<Harness initial="원본" />);

      fireEvent.change(screen.getByLabelText("이미지 파일 선택"), {
        target: { files: [pngFile()] },
      });

      expect(await screen.findByRole("alert")).toHaveTextContent("업로드 실패");
      expect((screen.getByLabelText("마크다운 입력") as HTMLTextAreaElement).value).toBe("원본");
    });

    it("이미지가 아닌 파일은 업로드하지 않고 막는다", async () => {
      render(<Harness />);

      fireEvent.change(screen.getByLabelText("이미지 파일 선택"), {
        target: { files: [new File(["x"], "note.txt", { type: "text/plain" })] },
      });

      expect(await screen.findByRole("alert")).toHaveTextContent("이미지만 업로드할 수 있습니다");
      expect(uploadImage).not.toHaveBeenCalled();
    });

    it("5MB 를 넘는 이미지는 올리기 전에 막는다", async () => {
      const big = pngFile("big.png");
      Object.defineProperty(big, "size", { value: 5 * 1024 * 1024 + 1 });
      render(<Harness />);

      fireEvent.change(screen.getByLabelText("이미지 파일 선택"), { target: { files: [big] } });

      expect(await screen.findByRole("alert")).toHaveTextContent("5MB 이하");
      expect(uploadImage).not.toHaveBeenCalled();
    });

    it("업로드된 이미지가 미리보기에 렌더링된다", async () => {
      render(<Harness />);

      fireEvent.change(screen.getByLabelText("이미지 파일 선택"), {
        target: { files: [pngFile("풍경.png")] },
      });

      const img = await screen.findByRole("img", { name: "풍경" });
      expect(img).toHaveAttribute("src", "https://cdn.test/a.png");
      expect(screen.getByLabelText("미리보기")).toContainElement(img);
    });
  });
});
