import type { NextConfig } from "next";

// 브라우저는 항상 같은 오리진(/api/*)으로만 요청하고, Next 서버가 백엔드로 프록시한다.
// → 프론트(vercel)와 백엔드(railway)가 다른 사이트여도 브라우저 입장엔 same-origin 이라
//   세션 쿠키가 "제3자 쿠키"로 취급되지 않는다. (모바일 브라우저의 크로스사이트 쿠키 차단 회피)
// BACKEND_ORIGIN 은 서버에서만 읽는 값(NEXT_PUBLIC_ 아님). 로컬 기본값은 http://localhost:8000.
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_ORIGIN}/:path*` },
    ];
  },
};

export default nextConfig;
