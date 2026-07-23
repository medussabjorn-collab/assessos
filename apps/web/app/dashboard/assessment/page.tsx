'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import axios from 'axios';
import AssessmentView from '@/components/AssessmentView';
import AdaptiveAssessmentView from '@/components/AdaptiveAssessmentView';

function AssessmentPageContent() {
  const { user, tenantId } = useAuth();
  const searchParams = useSearchParams();
  const configId = searchParams.get('configId');

  const [startData, setStartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !configId) return;

    const startSession = async () => {
      setLoading(true);
      setError(null);
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
        setStartData(response.data.data);
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
  if (!startData) return <div className="p-8">Loading...</div>;

  // Module-based configs run the real-time adaptive flow (question served
  // directly in the start response); pillar configs keep the existing
  // fixed-batch flow.
  if (startData.question) {
    return (
      <AdaptiveAssessmentView
        sessionId={startData.sessionId}
        moduleId={startData.moduleId}
        initialQuestion={startData.question}
        initialProgress={startData.progress}
        initialAbility={startData.ability}
      />
    );
  }

  return <AssessmentView sessionId={startData.sessionId} configId={configId!} />;
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <AssessmentPageContent />
    </Suspense>
  );
}
