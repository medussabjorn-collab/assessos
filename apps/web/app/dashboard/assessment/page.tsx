'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import axios from 'axios';
import AssessmentView from '@/components/AssessmentView';

function AssessmentPageContent() {
  const { user, tenantId } = useAuth();
  const searchParams = useSearchParams();
  const configId = searchParams.get('configId');

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !configId) return;

    const startSession = async () => {
      setLoading(true);
      try {
        const response = await axios.post(
          'http://localhost:3000/api/assessments/sessions/start',
          { configId },
          {
            headers: {
              'x-tenant-id': tenantId,
              Authorization: `Bearer ${await user.getIdToken()}`,
            },
          },
        );
        setSessionId(response.data.data.sessionId);
      } catch (err) {
        setError('Failed to start assessment');
      } finally {
        setLoading(false);
      }
    };

    startSession();
  }, [user, tenantId, configId]);

  if (loading) return <div className="p-8">Starting assessment...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!sessionId) return <div className="p-8">Loading...</div>;

  return <AssessmentView sessionId={sessionId} configId={configId!} />;
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <AssessmentPageContent />
    </Suspense>
  );
}
