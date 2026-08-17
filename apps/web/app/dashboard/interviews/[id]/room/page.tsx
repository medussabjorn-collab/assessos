'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Video, ShieldCheck, PenLine } from 'lucide-react';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';

export default function InterviewRoomPage() {
  const params = useParams();
  const id = String(params.id);
  const [proctoring, setProctoring] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.post(`/api/interviews/${id}/start`, {});
        setProctoring(res.data.data?.proctoringActive ?? true);
      } catch {
        // default to active
      }
    })();
  }, [id]);

  return (
    <div>
      <PageHeader
        eyebrow="Interviews"
        title="Interview Room"
        icon={Video}
        action={
          <Link
            href={`/dashboard/interviews/${id}/whiteboard`}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 transition"
          >
            <PenLine size={16} />
            Whiteboard
          </Link>
        }
      />

      <div className="max-w-3xl">
        <div className="aspect-video rounded-xl bg-canvas border border-hairline flex items-center justify-center mb-4">
          <span className="text-slate-600">Live video room</span>
        </div>
        {proctoring && (
          <div className="inline-flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-2 text-green-400 font-semibold">
            <ShieldCheck size={18} /> AI Proctoring Active
          </div>
        )}
      </div>
    </div>
  );
}
