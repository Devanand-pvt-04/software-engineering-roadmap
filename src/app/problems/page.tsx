import { ProblemsView } from "@/components/problems-view";
import { allowed, titleFor } from "@/server/access";
import { Missing } from "@/components/missing";
export async function generateMetadata() {
  return titleFor("Problem tracker", "problems");
}

export default async function Page() {
  if (!(await allowed("problems"))) return <Missing />;
  return <ProblemsView />;
}
