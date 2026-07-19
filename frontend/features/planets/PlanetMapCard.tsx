import Link from "next/link";
import { Badge, Card, Heading, Text } from "@usetaehwan/ui";
import { Planet } from "@/components/Planet";
import type { Planet as PlanetType } from "@/types/planet";

// 우주 지도의 행성 카드. 클릭하면 상세로 이동.
export function PlanetMapCard({ planet }: { planet: PlanetType }) {
  return (
    <Link href={`/planets/${planet.id}`} className="block">
      <Card className="flex flex-col items-center gap-3 text-center transition-colors hover:border-brand">
        <Planet progress={planet.progress} difficulty={planet.difficulty} size={96} animate={false} />
        <div className="flex flex-col items-center gap-1">
          <Heading level={3} className="text-base">
            {planet.name}
          </Heading>
          <div className="flex items-center gap-1.5">
            <Badge variant="neutral">{planet.difficulty}</Badge>
            {planet.is_completed && <Badge variant="brand">완성</Badge>}
          </div>
          <Text as="span" variant="small" className="text-fg-muted">
            진행도 {Math.round(planet.progress)}%
          </Text>
        </div>
      </Card>
    </Link>
  );
}
