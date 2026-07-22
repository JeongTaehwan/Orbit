"use client";

/**
 * 마크다운 작성 에디터 — 실시간 분할 미리보기.
 *
 * - 넓은 화면: 좌(작성) / 우(미리보기) 2분할. 각 영역에 라벨 + 배경 톤 차이로 구분.
 * - 좁은 화면: [작성]/[미리보기] 탭 전환.
 * - 아이콘 툴바(제목·굵게·코드·링크·이미지)로 문법 삽입을 돕는다.
 * - 이미지는 세 방법으로 올린다: 툴바 버튼(파일 선택) · 드래그 앤 드롭 · 붙여넣기(Ctrl+V).
 *   업로드가 끝나면 커서 자리에 ![alt](url) 이 들어간다.
 * - 값은 부모가 소유하는 제어 컴포넌트 (value/onChange).
 */

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Code,
  Eye,
  Heading2,
  Image as ImageIcon,
  ImageUp,
  Link2,
  Loader2,
  Pencil,
} from "lucide-react";
import { MarkdownContent } from "./MarkdownContent";
import { IMAGE_ACCEPT, useImageUpload } from "./useImageUpload";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

type Tab = "write" | "preview";

/** 파일명에서 확장자를 떼어 alt 텍스트로 쓴다 (없으면 "이미지") */
function altFromFilename(name: string): string {
  return name.replace(/\.[^.]+$/, "").trim() || "이미지";
}

export function MarkdownEditor({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("write"); // 좁은 화면에서만 의미
  const [dragging, setDragging] = useState(false);
  const { uploading, error, upload, clearError } = useImageUpload();

  // 업로드는 비동기라 완료 시점의 콜백 안에서는 value 가 옛날 값일 수 있다.
  // 항상 최신 값을 보도록 ref 에 거울처럼 복사해 둔다.
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);

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

  /** 업로드 시작 시점의 커서 위치 (없으면 글 끝) */
  function caretNow(): number {
    return ref.current?.selectionEnd ?? latest.current.length;
  }

  /** 업로드된 이미지를 pos 자리에 ![alt](url) 로 끼워 넣는다 */
  function insertImageAt(pos: number, url: string, alt: string) {
    const text = latest.current;
    const at = Math.min(pos, text.length); // 업로드 중 글이 짧아졌을 수도 있다
    const snippet = `![${alt}](${url})`;
    onChange(text.slice(0, at) + snippet + text.slice(at));
    const caret = at + snippet.length;
    requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.setSelectionRange(caret, caret);
    });
  }

  /** 세 경로(버튼·드롭·붙여넣기)가 모두 여기로 모인다 */
  async function handleFile(file: File) {
    const pos = caretNow(); // await 전에 커서를 잡아둔다
    const url = await upload(file);
    if (url) insertImageAt(pos, url, altFromFilename(file.name));
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    // 클립보드 항목 중 "파일"이면서 이미지인 것만 가로챈다 (스크린샷 붙여넣기)
    const item = Array.from(e.clipboardData.items).find(
      (i) => i.kind === "file" && i.type.startsWith("image/"),
    );
    const file = item?.getAsFile();
    if (!file) return; // 일반 텍스트 붙여넣기는 건드리지 않는다
    e.preventDefault();
    void handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
    setDragging(false);
    if (!file) return;
    e.preventDefault();
    void handleFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault(); // 기본 동작(브라우저가 파일을 열어버림)을 막아야 drop 이 발생한다
    setDragging(true);
  }

  const iconBtn =
    "rounded-md p-1.5 text-fg-muted transition-colors hover:bg-brand-subtle hover:text-brand disabled:cursor-not-allowed disabled:opacity-40";

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
          <button type="button" aria-label="이미지 URL" title="이미지 URL 삽입" onClick={() => surround("![", "](https://)", "설명")} className={iconBtn}>
            <ImageIcon size={17} aria-hidden />
          </button>
          <button
            type="button"
            aria-label="이미지 업로드"
            title="이미지 업로드 (드래그·붙여넣기도 가능)"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className={iconBtn}
          >
            <ImageUp size={17} aria-hidden />
          </button>
          {/* 실제 파일 선택창 — 버튼 클릭으로 대신 연다 */}
          <input
            ref={fileRef}
            type="file"
            accept={IMAGE_ACCEPT}
            aria-label="이미지 파일 선택"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = ""; // 같은 파일을 다시 골라도 change 가 나도록 초기화
              if (file) void handleFile(file);
            }}
          />
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
          <div
            className="relative"
            onDragOver={handleDragOver}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <textarea
              ref={ref}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onPaste={handlePaste}
              placeholder={placeholder ?? "마크다운으로 학습 내용을 기록하세요…"}
              aria-label="마크다운 입력"
              aria-busy={uploading}
              className={`h-72 w-full resize-y rounded-lg border bg-bg p-3 font-mono text-sm text-fg outline-none transition-colors focus:border-brand ${
                dragging ? "border-brand" : "border-border"
              }`}
            />
            {/* 드래그 중 안내 — 클릭을 가로채지 않도록 pointer-events-none */}
            {dragging && !uploading && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-brand-subtle/80 text-sm text-brand">
                여기에 이미지를 놓으세요
              </div>
            )}
            {uploading && (
              <div
                role="status"
                className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 rounded-b-lg bg-surface/90 py-2 text-xs text-fg-muted"
              >
                <Loader2 size={13} className="animate-spin" aria-hidden />
                이미지 업로드 중…
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-fg-muted">
            이미지는 드래그하거나 붙여넣기(Ctrl+V)로도 올릴 수 있어요.
          </p>
          {error && (
            <p role="alert" className="mt-1 flex items-center gap-2 text-xs text-danger">
              {error}
              <button type="button" onClick={clearError} className="underline hover:no-underline">
                닫기
              </button>
            </p>
          )}
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
