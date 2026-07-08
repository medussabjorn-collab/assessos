import { apiFetch } from './apiClient';

export interface SubmitCodePayload {
  source_code:     string;
  language_id:     number;
  stdin?:          string;
  expected_output?: string;
  cpu_time_limit?: number;
  memory_limit?:   number;
}

export interface SubmissionResult {
  stdout:          string | null;
  stderr:          string | null;
  compile_output:  string | null;
  message:         string | null;
  status: {
    id:          number;
    description: string;
  };
  time:   string | null;
  memory: number | null;
}

export interface Language {
  id:   number;
  name: string;
}

export async function getLanguages(): Promise<Language[]> {
  const res = await apiFetch<{ data?: Language[] }>('/code/languages');
  return res.data ?? [];
}

export async function submitCode(payload: SubmitCodePayload): Promise<SubmissionResult> {
  const res = await apiFetch<{ data: SubmissionResult }>('/code/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

// Judge0 status IDs
export function isAccepted(statusId: number): boolean {
  return statusId === 3; // Accepted
}

export function statusColor(statusId: number): string {
  if (statusId === 3)  return 'text-green-400';
  if (statusId === 6)  return 'text-red-400'; // Compilation Error
  if (statusId === 11) return 'text-red-400'; // Runtime Error (NZEC)
  if (statusId === 5)  return 'text-yellow-400'; // Time Limit Exceeded
  return 'text-red-400';
}
