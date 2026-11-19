import Link from "next/link";

/** What someone sees for a page that doesn't exist, or one they don't have access to. The two are identical on purpose. */
export function Missing() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 text-muted">There&apos;s nothing at this address.</p>
      <Link href="/" className="btn mt-6">
        Back to Today
      </Link>
    </div>
  );
}
