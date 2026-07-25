// 기록 목록 라우트. 서버 컴포넌트에서 params 를 풀고, 상호작용은 client 로.
// (Next 16: params 는 Promise 라 await 로 푼다)
import { RecordList } from "@/features/records/RecordList";

export default async function RecordListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RecordList planetId={Number(id)} />;
}
