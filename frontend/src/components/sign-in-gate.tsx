import Link from "next/link";

import { PageHeader } from "@/components/page-header";

export function SignInGate({
  title,
  blurb
}: {
  title: string;
  blurb: string;
}) {
  return (
    <main className="page-shell max-w-lg py-16">
      <PageHeader title={title} blurb={blurb} />
      <Link href="/account" className="hero-cta inline-flex h-10 items-center px-4 text-sm font-semibold">
        Sign in
      </Link>
    </main>
  );
}
