"use client";

/**
 * 마크다운 작성 에디터 — 실시간 분할 미리보기.
 *
 * - 넓은 화면: 좌(작성) / 우(미리보기) 2분할. 각 영역에 라벨 + 배경 톤 차이로 구분.
 * - 좁은 화면: [작성]/[미리보기] 탭 전환.
 * - 아이콘 툴바(제목·굵게·코드·링크·이미지)로 문법 삽입을 돕는다.
 * - 값은 부모가 소유하는 제어 컴포넌트 (value/onChange).
 */

import { useRef, useState } from "react";
import { Bold, Code, Eye, Heading2, Image as ImageIcon, Link2, Pencil } from "lucide-react";
import { MarkdownContent } from "./MarkdownContent";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

type Tab = "write" | "preview";

export function MarkdownEditor({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<Tab>("write"); // 좁은 화면에서만 의미

  // 선택 영역을 before/after 로 감싼다 (없으면 placeholder 삽입)
  function surround(before: string, after: string, ph: string) {
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const selected = value.slice(s, e) || ph;
    onChange(value.slice(0, s) + before + selected + after + value.slice(e));
    const from = s + before.length;
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(from, from + selected.length);
    });
  }

  // 커서가 놓인 줄 맨 앞에 prefix 삽입 (제목 등)
  function prefixLine(prefix: string) {
    const ta = ref.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    onChange(value.slice(0, lineStart) + prefix + value.slice(lineStart));
    const caret = s + prefix.length;
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(caret, caret);
    });
  }

  const iconBtn =
    "rounded-md p-1.5 text-fg-muted transition-colors hover:bg-brand-subtle hover:text-brand";

  return (
    <div className="flex flex-col gap-2">
      {/* 툴바 + (좁은 화면용) 탭 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-0.5">
          <button type="button" aria-label="제목" title="제목" onClick={() => prefixLine("## ")} className={iconBtn}>
            <Heading2 size={17} aria-hidden />
          </button>
          <button type="button" aria-label="굵게" title="굵게" onClick={() => surround("**", "**", "굵게")} className={iconBtn}>
            <Bold size={17} aria-hidden />
          </button>
          <button type="button" aria-label="코드" title="인라인 코드" onClick={() => surround("`", "`", "코드")} className={iconBtn}>
            <Code size={17} aria-hidden />
          </button>
          <button type="button" aria-label="링크" title="링크" onClick={() => surround("[", "](https://)", "링크")} className={iconBtn}>
            <Link2 size={17} aria-hidden />
          </button>
          <button type="button" aria-label="이미지" title="이미지 URL" onClick={() => surround("![", "](https://)", "설명")} className={iconBtn}>
            <ImageIcon size={17} aria-hidden />
          </button>
        </div>
        {/* md 이상에선 분할이라 탭 숨김 */}
        <div className="flex gap-1 md:hidden" role="tablist" aria-label="에디터 보기">
          {(["write", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                tab === t ? "bg-brand-subtle text-brand" : "text-fg-muted hover:text-fg"
              }`}
            >
              {t === "write" ? "작성" : "미리보기"}
            </button>
          ))}
        </div>
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-4">
        {/* 작성 (어두운 톤) */}
        <div className={`${tab === "write" ? "flex" : "hidden"} flex-col md:flex`}>
          <div className="mb-1.5 hidden items-center gap-1.5 text-xs font-medium text-fg-muted md:flex">
            <Pencil size={13} aria-hidden /> 작성
          </div>
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder ?? "마크다운으로 학습 내용을 기록하세요…"}
            aria-label="마크다운 입력"
            className="h-72 w-full resize-y rounded-lg border border-border bg-bg p-3 font-mono text-sm text-fg outline-none transition-colors focus:border-brand"
          />
        </div>

        {/* 미리보기 (밝은 톤 — 실제 렌더 결과) */}
        <div className={`${tab === "preview" ? "flex" : "hidden"} flex-col md:flex`}>
          <div className="mb-1.5 hidden items-center gap-1.5 text-xs font-medium text-fg-muted md:flex">
            <Eye size={13} aria-hidden /> 미리보기
          </div>
          <div
            aria-label="미리보기"
            className="h-72 overflow-y-auto rounded-lg border border-brand-subtle bg-surface p-3"
          >
            {value.trim() ? (
              <MarkdownContent content={value} />
            ) : (
              <p className="text-sm text-fg-muted">미리보기가 여기에 표시됩니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
