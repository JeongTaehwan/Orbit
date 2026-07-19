"use client";

/**
 * 학습 기록 드로어 — 목록 · 작성 · 읽기 세 모드를 하나의 우측 드로어에서 전환.
 *
 * - 목록: 상단 "새 기록 작성" + 기록 나열(날짜 + 순수 텍스트 미리보기).
 * - 작성: 마크다운 분할 에디터 → 저장 시 목록으로.
 * - 읽기: 기록 전문(마크다운 렌더) + 삭제.
 * - 작성 모드에선 분할 미리보기가 편하도록 드로어가 더 넓어진다.
 * - 저장·삭제는 진행도에 영향을 주므로 onChanged 로 부모(행성)를 갱신하게 한다.
 * - 드로어는 우측에서 슬라이드 → 행성(중앙/좌측)은 계속 보인다.
 */

import { useEffect, useState } from "react";
import { Button, Text } from "@usetaehwan/ui";
import { Drawer } from "@/components/ui/Drawer";
import { api } from "@/lib/api";
import type { LearningRecord, RecordSummary } from "@/types/planet";
import { MarkdownContent } from "./MarkdownContent";
import { MarkdownEditor } from "./MarkdownEditor";

type Mode = "list" | "compose" | "read";

interface Props {
  planetId: number;
  open: boolean;
  onClose: () => void;
  /** 열릴 때 시작 모드 (기본 목록). "작성" 버튼에서 바로 작성으로 열 때 사용. */
  initialMode?: "list" | "compose";
  /** 저장·삭제로 기록 수가 바뀌면 호출 (부모가 행성/진행도 갱신) */
  onChanged?: () => void;
}

export function RecordDrawer({ planetId, open, onClose, initialMode = "list", onChanged }: Props) {
  const [mode, setMode] = useState<Mode>("list");
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<LearningRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadRecords() {
    setLoading(true);
    try {
      setRecords(await api.listRecords(planetId));
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  // 열릴 때마다 시작 모드로 초기화하고 목록을 새로 불러온다
  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setSelected(null);
    setDraft("");
    setError(null);
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, planetId]);

  function goList() {
    setError(null);
    setMode("list");
  }

  function startCompose() {
    setDraft("");
    setError(null);
    setMode("compose");
  }

  async function openDetail(id: number) {
    setDetailLoading(true);
    setError(null);
    try {
      setSelected(await api.getRecord(planetId, id));
      setMode("read");
    } catch (e) {
      setError(e instanceof Error ? e.message : "기록을 불러오지 못했습니다.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleSave() {
    if (!draft.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.addRecord(planetId, draft.trim());
      onChanged?.(); // 기록 추가 → 진행도 갱신
      onClose(); // 작성 완료 → 드로어 닫기 (다시 열면 목록부터)
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    if (!confirm("이 기록을 삭제할까요?")) return;
    setDeleting(true);
    setError(null);
    try {
      await api.deleteRecord(planetId, selected.id);
      await loadRecords();
      onChanged?.();
      setSelected(null);
      goList();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제 실패");
    } finally {
      setDeleting(false);
    }
  }

  // 작성 모드에선 분할 미리보기가 편하도록 넓게, 그 외엔 읽기 편한 폭.
  // (행성이 뒤로 가려지지 않게 과하게 넓히진 않는다 — 넓은 화면일수록 여유 있게 보인다)
  const widthClass = mode === "compose" ? "w-full max-w-2xl" : "w-full max-w-md";

  return (
    <Drawer open={open} onClose={onClose} title="학습 기록" widthClass={widthClass}>
      {mode === "compose" ? (
        /* ── 작성 ── */
        <div key="compose" className="orbit-fade flex h-full flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <button onClick={goList} className="text-sm text-fg-muted hover:text-fg">
              ← 목록으로
            </button>
            <Button variant="primary" onClick={handleSave} disabled={saving || !draft.trim()}>
              {saving ? "저장 중…" : "저장"}
            </Button>
          </div>
          <Text variant="small" className="text-fg-muted">
            마크다운으로 자유롭게 — 코드·링크·이미지 URL 모두 남길 수 있어요.
          </Text>
          <MarkdownEditor value={draft} onChange={setDraft} />
          {error && (
            <Text as="p" variant="small" className="text-danger">
              {error}
            </Text>
          )}
        </div>
      ) : mode === "read" && selected ? (
        /* ── 읽기(전문) ── */
        <div key="read" className="orbit-fade flex flex-col gap-3">
          <button onClick={goList} className="self-start text-sm text-fg-muted hover:text-fg">
            ← 목록으로
          </button>
          <Text as="span" variant="small" className="text-fg-muted">
            {new Date(selected.created_at).toLocaleString("ko-KR")}
          </Text>
          <MarkdownContent content={selected.content} />
          {error && (
            <Text as="p" variant="small" className="text-danger">
              {error}
            </Text>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="mt-4 self-start text-xs text-fg-muted hover:text-danger"
          >
            {deleting ? "삭제 중…" : "이 기록 삭제"}
          </button>
        </div>
      ) : (
        /* ── 목록 ── */
        <div key="list" className="orbit-fade flex flex-col gap-3">
          <Button variant="primary" onClick={startCompose} className="w-full">
            새 기록 작성
          </Button>
          {detailLoading || loading ? (
            <Text variant="muted">불러오는 중…</Text>
          ) : records.length === 0 ? (
            <Text variant="muted">아직 기록이 없습니다.</Text>
          ) : (
            <ul className="flex flex-col gap-2">
              {records.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => openDetail(r.id)}
                    className="orbit-interactive w-full rounded-lg border border-border bg-bg px-3 py-2 text-left hover:border-brand"
                  >
                    <span className="block truncate text-sm text-fg">
                      {r.preview || "(내용 없음)"}
                    </span>
                    <span className="mt-0.5 block text-xs text-fg-muted">
                      {new Date(r.created_at).toLocaleString("ko-KR")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Drawer>
  );
}
