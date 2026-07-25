"use client";

/**
 * 기록 목록 페이지 — 날짜 + 순수 텍스트 미리보기를 카드로 나열.
 *
 * - 상단에 "새 기록 작성" 진입점.
 * - 카드 클릭 → 읽기 페이지로.
 * - 비어 있으면 첫 기록을 유도한다.
 */

import { useEffect, useState } from "react";
import { PenLine } from "lucide-react";
import { Button, Heading, Text } from "@usetaehwan/ui";
import { TransitionLink } from "@/components/TransitionLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { OrbitLoader } from "@/components/ui/OrbitLoader";
import { api } from "@/lib/api";
import type { RecordSummary } from "@/types/planet";
import { RecordPageFrame } from "./RecordPageFrame";

export function RecordList({ planetId }: { planetId: number }) {
  const [records, setRecords] = useState<RecordSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .listRecords(planetId)
      .then((r) => alive && setRecords(r))
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "기록을 불러오지 못했습니다.");
      });
    return () => {
      alive = false;
    };
  }, [planetId]);

  return (
    <RecordPageFrame backHref={`/planets/${planetId}`} backLabel="행성으로">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <Heading level={1}>학습 기록</Heading>
          {records && (
            <Text variant="small" className="mt-1 text-fg-muted">
              {records.length}개의 기록
            </Text>
          )}
        </div>
        <TransitionLink href={`/planets/${planetId}/records/new`}>
          <Button variant="primary">
            <span className="inline-flex items-center gap-1.5">
              <PenLine size={16} aria-hidden />새 기록
            </span>
          </Button>
        </TransitionLink>
      </div>

      {error ? (
        <Text as="p" variant="small" className="text-danger" role="alert">
          {error}
        </Text>
      ) : records === null ? (
        <div className="flex justify-center py-20">
          <OrbitLoader label="기록을 불러오는 중…" />
        </div>
      ) : records.length === 0 ? (
        <div className="py-10">
          <EmptyState
            icon="✍️"
            title="아직 기록이 없어요"
            description="첫 기록으로 이 행성의 테라포밍을 시작하세요. 기록이 쌓일수록 행성이 자라납니다."
            action={
              <TransitionLink href={`/planets/${planetId}/records/new`}>
                <Button variant="primary">첫 기록 작성하기</Button>
              </TransitionLink>
            }
          />
        </div>
      ) : (
        <ul className="orbit-fade flex flex-col gap-2.5">
          {records.map((r) => (
            <li key={r.id}>
              <TransitionLink
                href={`/planets/${planetId}/records/${r.id}`}
                className="orbit-interactive block rounded-xl border border-border bg-surface px-4 py-3.5 hover:border-brand"
              >
                <span className="block truncate font-medium text-fg">
                  {r.preview || "(내용 없음)"}
                </span>
                <time className="mt-1 block text-xs text-fg-muted">
                  {new Date(r.created_at).toLocaleString("ko-KR")}
                </time>
              </TransitionLink>
            </li>
          ))}
        </ul>
      )}
    </RecordPageFrame>
  );
}
