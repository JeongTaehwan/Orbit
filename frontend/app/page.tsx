// 페이지는 "조립"만 담당한다. 실제 로직/UI는 features/ 로 위임.
import { Container, Heading, Text } from "@usetaehwan/ui";
import { PlanetList } from "@/features/planets/PlanetList";

export default function Home() {
  return (
    <main className="py-10">
      <Container size="sm">
        <Heading level={1} className="mb-1">
          Orbit
        </Heading>
        <Text variant="muted" className="mb-6">
          프론트-백엔드 연결 확인용 화면
        </Text>
        <PlanetList />
      </Container>
    </main>
  );
}
