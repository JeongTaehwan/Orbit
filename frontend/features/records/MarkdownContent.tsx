"use client";

/**
 * 마크다운 원본 → 우주 테마 타이포그래피로 렌더.
 *
 * - react-markdown 은 기본적으로 raw HTML 을 렌더하지 않는다(rehype-raw 미사용) → XSS 안전.
 * - remark-gfm: 표·체크박스·취소선 등 GitHub 확장 문법.
 * - rehype-highlight: 코드 블록에 hljs-* 클래스 부여 → globals.css 에서 우주 다크 테마로 스타일.
 * - 타이포 색/크기는 전부 .orbit-markdown 스코프 CSS(토큰 기반)에서 담당한다.
 */

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

type AnchorProps = React.ComponentPropsWithoutRef<"a">;

// 링크는 새 탭으로 + 보안 rel
function Anchor({ children, ...props }: AnchorProps) {
  return (
    <a {...props} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

// size="doc" — 기록 읽기 페이지처럼 크게 읽히는 문서용 (본문·이미지 확대)
export function MarkdownContent({
  content,
  size = "default",
}: {
  content: string;
  size?: "default" | "doc";
}) {
  return (
    <div className={`orbit-markdown ${size === "doc" ? "orbit-markdown--doc" : ""}`}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{ a: Anchor }}
      >
        {content}
      </Markdown>
    </div>
  );
}
