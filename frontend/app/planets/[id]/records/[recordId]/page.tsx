// 기록 읽기 라우트.
import { RecordRead } from "@/features/records/RecordRead";

export default async function RecordReadPage({
  params,
}: {
  params: Promise<{ id: string; recordId: string }>;
}) {
  const { id, recordId } = await params;
  return <RecordRead planetId={Number(id)} recordId={Number(recordId)} />;
}
