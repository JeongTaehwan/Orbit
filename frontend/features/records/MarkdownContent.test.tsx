import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarkdownContent } from "./MarkdownContent";

describe("MarkdownContent", () => {
  it("제목과 본문을 마크다운으로 렌더한다", () => {
    render(<MarkdownContent content={"# 제목\n\n본문 텍스트"} />);
    expect(screen.getByRole("heading", { name: "제목" })).toBeInTheDocument();
    expect(screen.getByText("본문 텍스트")).toBeInTheDocument();
  });

  it("코드 블록에 신택스 하이라이팅(hljs) 클래스를 부여한다", () => {
    const { container } = render(
      <MarkdownContent content={"```js\nconst x = 1;\n```"} />,
    );
    const code = container.querySelector("pre code");
    expect(code?.className).toContain("hljs");
    expect(code?.className).toContain("language-js");
  });

  it("이미지 URL(![alt](url))을 img 로 렌더한다", () => {
    render(<MarkdownContent content={"![우주](https://example.com/space.png)"} />);
    const img = screen.getByRole("img", { name: "우주" });
    expect(img).toHaveAttribute("src", "https://example.com/space.png");
  });

  it("링크는 새 탭 + 보안 rel 로 연다", () => {
    render(<MarkdownContent content={"[구글](https://google.com)"} />);
    const link = screen.getByRole("link", { name: "구글" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("raw HTML 은 실제 요소로 렌더하지 않는다(XSS 방지)", () => {
    const { container } = render(
      <MarkdownContent
        content={'Hello <img src=x onerror="alert(1)"> <b>bold</b>'}
      />,
    );
    // 위험한 raw HTML 요소가 DOM 요소로 만들어지지 않아야 한다
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
    // 일반 텍스트는 그대로 보인다
    expect(container.textContent).toContain("Hello");
  });
});
