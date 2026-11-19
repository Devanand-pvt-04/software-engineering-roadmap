import { TodayView } from "@/components/today";
import { allowed } from "@/server/access";
import { Missing } from "@/components/missing";

export default async function Page() {
  if (!(await allowed())) return <Missing />;
  return <TodayView />;
}
