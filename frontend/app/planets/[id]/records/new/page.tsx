// 기록 작성 라우트.
import { RecordCompose } from "@/features/records/RecordCompose";

export default async function RecordNewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RecordCompose planetId={Number(id)} />;
}
