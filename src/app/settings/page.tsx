import { SettingsView } from "@/components/settings-view";
import { allowed, titleFor } from "@/server/access";
import { Missing } from "@/components/missing";
export async function generateMetadata() {
  return titleFor("Settings");
}

export default async function Page() {
  if (!(await allowed())) return <Missing />;
  return <SettingsView />;
}
