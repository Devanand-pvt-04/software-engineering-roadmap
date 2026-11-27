import { redirect } from "next/navigation";

// The journals now live at the bottom of Notes.
export default function Page() {
  redirect("/notes");
}
