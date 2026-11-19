import { ReviewView } from "@/components/review-view";
import { allowed, titleFor } from "@/server/access";
import { Missing } from "@/components/missing";

export async function generateMetadata() {
  return titleFor("Review", "quizzes");
}

export default async function Page() {
  if (!(await allowed("quizzes"))) return <Missing />;
  return <ReviewView />;
}
