"use client";

/**
 * next/link 래퍼 — 클릭 시 View Transition 으로 이동한다.
 * (미지원/모션최소화면 일반 이동으로 폴백 — viewTransition.ts 참고)
 *
 * 새 탭·수정키·마우스 가운데 클릭 등은 브라우저 기본 동작을 유지한다.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startViewTransition } from "@/lib/utils/viewTransition";

type Props = Omit<React.ComponentProps<typeof Link>, "href"> & { href: string };

export function TransitionLink({ href, onClick, ...rest }: Props) {
  const router = useRouter();

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    // 목표 pathname 을 넘겨 "실제 이동 완료"까지 전환을 붙잡는다
    const targetPath = new URL(href, window.location.href).pathname;
    startViewTransition(() => router.push(href), targetPath);
  }

  return <Link href={href} onClick={handleClick} {...rest} />;
}
