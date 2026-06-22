import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function OnboardingCompletePage() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface border border-hairline rounded-2xl shadow-frost p-8 text-center">
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 mb-5">
          <CheckCircle2 size={28} />
        </span>
        <h1 className="text-2xl font-bold text-ink">You&apos;re all set</h1>
        <p className="text-subtle mt-2">
          Your AssessOS workspace is ready. Jump in and start building
          assessments, hiring pipelines, and challenges.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center justify-center gap-2 w-full rounded-lg bg-brand-600 text-white py-2.5 font-medium hover:bg-brand-700 transition"
        >
          Go to Dashboard <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
