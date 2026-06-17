'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Video, ShieldCheck } from 'lucide-react';
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
      <PageHeader eyebrow="Interviews" title="Interview Room" icon={Video} />

      <div className="max-w-3xl">
        <div className="aspect-video rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-4">
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
