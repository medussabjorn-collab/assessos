'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PenLine } from 'lucide-react';
import { api } from '@/lib/api';
import { useCollabRoom } from '@/lib/use-collab-room';
import PageHeader from '@/components/PageHeader';
import WhiteboardCanvas from '@/components/WhiteboardCanvas';

export default function InterviewWhiteboardPage() {
  const params = useParams();
  const interviewId = String(params.id);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/interviews/${interviewId}/collab-room`);
        setRoomId(res.data.data.roomId);
      } catch {
        setLoadError('Could not open the whiteboard room for this interview.');
      }
    })();
  }, [interviewId]);

  const { ydoc, connected, error: collabError } = useCollabRoom({ roomId, role: 'interviewer' });

  return (
    <div>
      <PageHeader
        eyebrow="Interviews"
        title="System Design Whiteboard"
        subtitle="Sketch diagrams live with the candidate — shared in real time, no download needed."
        icon={PenLine}
      />

      {loadError && <p className="text-red-500 mb-4">{loadError}</p>}
      {collabError && <p className="text-red-500 mb-4">{collabError}</p>}

      {roomId && <WhiteboardCanvas ydoc={ydoc} connected={connected} />}
    </div>
  );
}
