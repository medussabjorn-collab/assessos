'use client';

import { useParams } from 'next/navigation';
import ReportView from '@/components/ReportView';

export default function ReportPage() {
  const params = useParams();
  const reportId = params.id as string;

  return <ReportView reportId={reportId} />;
}
