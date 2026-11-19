import { JournalView } from "@/components/journal-view";
import { allowed, titleFor } from "@/server/access";
import { Missing } from "@/components/missing";
export async function generateMetadata() {
  return titleFor("Journal", "journal");
}

export default async function Page() {
  if (!(await allowed("journal"))) return <Missing />;
  return <JournalView />;
}
