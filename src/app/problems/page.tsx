import type { Metadata } from "next";
import { ProblemsView } from "@/components/problems-view";
export const metadata: Metadata = { title: "Problem tracker" };
export default function Page() {
  return <ProblemsView />;
}
