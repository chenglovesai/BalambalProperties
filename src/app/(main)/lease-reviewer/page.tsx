export const dynamic = "force-dynamic";

import { LeaseReviewerClient } from "@/components/lease-reviewer-client";

export default function LeaseReviewerPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-gray-100 bg-gradient-to-b from-indigo-50/60 to-white px-4 py-16 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          AI Lease Reviewer
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          Paste your commercial lease and get an instant review for shady clauses, unfair terms, and
          potential risks
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <LeaseReviewerClient />
      </section>
    </div>
  );
}
