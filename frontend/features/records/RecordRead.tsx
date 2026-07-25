"use client";

/**
 * 기록 읽기 페이지 — 넓은 문서 레이아웃.
 *
 * - 날짜(작게) → 본문(크게)으로 위계를 준다.
 * - 마크다운은 doc 크기로 크게 렌더, 이미지도 크게.
 * - 삭제는 문서 끝에 조용히 둔다 (위험 액션은 눈에 덜 띄게).
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Text } from "@usetaehwan/ui";
import { api } from "@/lib/api";
import type { LearningRecord } from "@/types/planet";
import { MarkdownContent } from "./MarkdownContent";
import { RecordPageFrame } from "./RecordPageFrame";

export function RecordRead({ planetId, recordId }: { planetId: number; recordId: number }) {
  const router = useRouter();
  const [record, setRecord] = useState<LearningRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .getRecord(planetId, recordId)
      .then((r) => alive && setRecord(r))
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "기록을 불러오지 못했습니다.");
      });
    return () => {
      alive = false;
    };
  }, [planetId, recordId]);

  async function handleDelete() {
    if (deleting) return;
    if (!confirm("이 기록을 삭제할까요?")) return;
    setDeleting(true);
    setError(null);
    try {
      await api.deleteRecord(planetId, recordId);
      router.push(`/planets/${planetId}/records`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했습니다.");
      setDeleting(false);
    }
  }

  return (
    <RecordPageFrame backHref={`/planets/${planetId}/records`} backLabel="목록으로">
      {error && !record ? (
        <Text as="p" variant="small" className="text-danger" role="alert">
          {error}
        </Text>
      ) : record === null ? (
        <Text variant="muted">불러오는 중…</Text>
      ) : (
        <article className="orbit-fade">
          <time className="block text-sm text-fg-muted">
            {new Date(record.created_at).toLocaleString("ko-KR", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </time>

          <div className="mt-5 border-t border-border pt-6">
            <MarkdownContent content={record.content} size="doc" />
          </div>

          {error && (
            <Text as="p" variant="small" className="mt-4 text-danger" role="alert">
              {error}
            </Text>
          )}

          <div className="mt-14 border-t border-border pt-4">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-fg-muted transition-colors hover:text-danger"
            >
              {deleting ? "삭제 중…" : "이 기록 삭제"}
            </button>
          </div>
        </article>
      )}
    </RecordPageFrame>
  );
}
