// 행성 상세 라우트. 서버 컴포넌트에서 params 를 풀고, 상호작용은 client 컴포넌트로.
// (Next 16: params 는 Promise 라 await 로 푼다)
import { PlanetDetail } from "@/features/planets/PlanetDetail";

export default async function PlanetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PlanetDetail planetId={Number(id)} />;
}
