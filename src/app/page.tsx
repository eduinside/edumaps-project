import LandingClient from "../components/LandingClient";
import { fetchResources } from "../lib/fetchResources";

export default async function RootPage() {
  const { items, generatedAt, changelog } = await fetchResources();
  const updatedTime =
    generatedAt ?? new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  // 빌드 시점의 달(KST)로 미리 그려 두고, 브라우저에서 실제 이번 달로 맞춘다
  const buildMonth = Number(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul", month: "numeric" }));
  return <LandingClient initialData={items} updatedTime={updatedTime} changelog={changelog} buildMonth={buildMonth} />;
}
