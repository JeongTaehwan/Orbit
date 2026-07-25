"use client";

/**
 * 기록 작성 페이지 — 마크다운 분할 에디터를 페이지 전체 폭으로.
 *
 * 저장하면 방금 만든 기록의 읽기 페이지로 이동한다.
 * 진행도(행성)는 다시 불러올 때 갱신되므로 여기선 신경 쓰지 않는다.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Heading, Text } from "@usetaehwan/ui";
import { api } from "@/lib/api";
import { MarkdownEditor } from "./MarkdownEditor";
import { RecordPageFrame } from "./RecordPageFrame";

export function RecordCompose({ planetId }: { planetId: number }) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!draft.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const created = await api.addRecord(planetId, draft.trim());
      // 저장한 기록을 바로 열어 준다 (뒤로 가면 목록)
      router.push(`/planets/${planetId}/records/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했습니다.");
      setSaving(false);
    }
  }

  return (
    <RecordPageFrame backHref={`/planets/${planetId}/records`} backLabel="목록으로" fill>
      {/* 제목 줄 — 고정 높이 */}
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <Heading level={1}>새 학습 기록</Heading>
          <Text variant="small" className="mt-1 text-fg-muted">
            마크다운으로 자유롭게 — 코드·링크는 물론, 이미지는 끌어다 놓거나 붙여넣어 올릴 수 있어요.
          </Text>
        </div>
        <Button variant="primary" onClick={handleSave} disabled={saving || !draft.trim()}>
          {saving ? "저장 중…" : "저장"}
        </Button>
      </div>

      {/* 에디터 — 남은 세로 공간을 꽉 채운다 */}
      <div className="min-h-0 flex-1">
        <MarkdownEditor value={draft} onChange={setDraft} fill />
      </div>

      {error && (
        <Text as="p" variant="small" className="mt-3 text-danger" role="alert">
          {error}
        </Text>
      )}
    </RecordPageFrame>
  );
}
