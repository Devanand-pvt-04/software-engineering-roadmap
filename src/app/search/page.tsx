import { SearchView } from "@/components/search-view";

export const metadata = { title: "Search" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = (await searchParams).q;
  return <SearchView initial={typeof q === "string" ? q : ""} />;
}
