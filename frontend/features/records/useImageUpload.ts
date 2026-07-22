"use client";

/**
 * 이미지 한 장 업로드 상태 관리 훅.
 *
 * 업로드 전에 브라우저에서 먼저 검증한다(타입·용량). 서버도 같은 규칙으로 다시
 * 검증하지만, 여기서 걸러주면 5MB 짜리를 헛되이 올리지 않고 즉시 알려줄 수 있다.
 * (브라우저 검증은 "편의", 진짜 방어선은 서버다)
 */

import { useState } from "react";
import { api } from "@/lib/api";

/** 서버(app/services/uploads.py)와 같은 규칙 */
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** 파일 선택 창에 보여줄 필터 */
export const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(",");

function validate(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "jpg, png, webp, gif 이미지만 업로드할 수 있습니다.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "이미지는 5MB 이하만 업로드할 수 있습니다.";
  }
  return null;
}

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 업로드 성공 시 URL, 실패하면 null (에러 메시지는 error 로 노출) */
  async function upload(file: File): Promise<string | null> {
    if (uploading) return null; // 동시 업로드는 다루지 않는다 (한 번에 한 장)

    const invalid = validate(file);
    if (invalid) {
      setError(invalid);
      return null;
    }

    setError(null);
    setUploading(true);
    try {
      const { url } = await api.uploadImage(file);
      return url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "이미지 업로드에 실패했습니다.");
      return null;
    } finally {
      setUploading(false);
    }
  }

  return { uploading, error, upload, clearError: () => setError(null) };
}
