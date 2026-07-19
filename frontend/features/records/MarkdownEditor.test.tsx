import { describe, it, expect } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MarkdownEditor } from "./MarkdownEditor";

// 제어 컴포넌트라 상태를 쥐고 있는 하니스로 감싼다
function Harness({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <MarkdownEditor value={value} onChange={setValue} />;
}

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

  it("툴바 '이미지'가 이미지 문법을 삽입한다", () => {
    render(<Harness />);
    const textarea = screen.getByLabelText("마크다운 입력") as HTMLTextAreaElement;

    fireEvent.click(screen.getByRole("button", { name: "이미지" }));

    expect(textarea.value).toContain("![");
    expect(textarea.value).toContain("](https://)");
  });
});
