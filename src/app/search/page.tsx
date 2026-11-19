import { SearchView } from "@/components/search-view";
import { allowed, titleFor } from "@/server/access";
import { Missing } from "@/components/missing";

export async function generateMetadata() {
  return titleFor("Search", "search");
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!(await allowed("search"))) return <Missing />;
  const q = (await searchParams).q;
  return <SearchView initial={typeof q === "string" ? q : ""} />;
}
