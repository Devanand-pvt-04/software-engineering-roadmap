import type { Metadata } from "next";
import { PlanView } from "@/components/plan-view";
export const metadata: Metadata = { title: "36-week map" };
export default function Page() {
  return <PlanView />;
}
