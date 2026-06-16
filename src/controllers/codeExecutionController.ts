import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../types';
import { env } from '../config/env';
import * as R from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const submitSchema = z.object({
  source_code:    z.string().min(1).max(65536),
  language_id:    z.number().int().positive(),
  stdin:          z.string().max(65536).optional(),
  expected_output: z.string().max(65536).optional(),
  cpu_time_limit: z.number().max(10).optional(),
  memory_limit:   z.number().max(131072).optional(),
});

function judge0Headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (env.JUDGE0_API_KEY) h['X-Auth-Token'] = env.JUDGE0_API_KEY;
  return h;
}

export async function submitCode(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!env.JUDGE0_API_URL) throw new AppError(503, 'Code execution is not configured');

    const body = submitSchema.parse(req.body);
    const url = `${env.JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`;

    const response = await fetch(url, {
      method: 'POST',
      headers: judge0Headers(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new AppError(502, `Judge0 error: ${text.slice(0, 200)}`);
    }

    const result = await response.json();
    R.ok(res, result, 'Code executed');
  } catch (err) { next(err); }
}

export async function getLanguages(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!env.JUDGE0_API_URL) {
      R.ok(res, FALLBACK_LANGUAGES, 'Fallback languages (Judge0 not configured)');
      return;
    }

    const response = await fetch(`${env.JUDGE0_API_URL}/languages`, {
      headers: judge0Headers(),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) throw new AppError(502, 'Failed to fetch languages from Judge0');
    const langs = await response.json();
    R.ok(res, langs);
  } catch (err) { next(err); }
}

// Language list for offline/unconfigured environments
const FALLBACK_LANGUAGES = [
  { id: 71, name: 'Python (3.8.1)' },
  { id: 62, name: 'Java (OpenJDK 13.0.1)' },
  { id: 63, name: 'JavaScript (Node.js 12.14.0)' },
  { id: 54, name: 'C++ (GCC 9.2.0)' },
  { id: 51, name: 'C# (Mono 6.6.0.161)' },
  { id: 60, name: 'Go (1.13.5)' },
  { id: 72, name: 'Ruby (2.7.0)' },
  { id: 73, name: 'Rust (1.40.0)' },
  { id: 74, name: 'TypeScript (3.7.4)' },
  { id: 46, name: 'Bash (5.0.0)' },
];
