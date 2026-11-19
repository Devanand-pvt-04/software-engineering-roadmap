import { PlanView } from "@/components/plan-view";
import { allowed, titleFor } from "@/server/access";
import { Missing } from "@/components/missing";
export async function generateMetadata() {
  return titleFor("36-week map");
}

export default async function Page() {
  if (!(await allowed())) return <Missing />;
  return <PlanView />;
}
