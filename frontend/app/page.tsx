// 페이지는 "조립"만 담당한다. 실제 로직/UI는 features/ 로 위임.
import { PlanetList } from "@/features/planets/PlanetList";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-1 text-2xl font-bold">Orbit</h1>
      <p className="mb-6 text-sm text-gray-500">프론트-백엔드 연결 확인용 화면</p>
      <PlanetList />
    </main>
  );
}
