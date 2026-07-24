import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

/**
 * Real code execution via Judge0 (https://judge0.com).
 *
 * Configuration (env):
 *   JUDGE0_URL       Base URL — self-hosted (http://judge0:2358) or RapidAPI
 *                    (https://judge0-ce.p.rapidapi.com)
 *   JUDGE0_API_KEY   RapidAPI key. Omit for self-hosted instances.
 *   JUDGE0_API_HOST  RapidAPI host header. Defaults to judge0-ce.p.rapidapi.com
 *                    when JUDGE0_API_KEY is set.
 *
 * When unconfigured, execution fails loudly (503) — no fake results.
 */

const LANGUAGE_IDS: Record<string, number> = {
  python: 71, // Python 3.8
  javascript: 63, // Node.js 12
  java: 62, // OpenJDK 13
  cpp: 54, // C++ GCC 9
};

// Judge0 status ids: 3 = Accepted, 4 = Wrong Answer, 5 = TLE, 6 = Compile error.
const STATUS_ACCEPTED = 3;
const STATUS_COMPILE_ERROR = 6;

// Fallback language list (ported from leadership-assessment) — shown when
// Judge0 is unconfigured so the client still has something to render, and as
// a static reference independent of a live Judge0 instance's ordering.
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

interface Judge0Submission {
  status: { id: number; description: string };
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  time: string | null;
}

export interface ExecutionResult {
  passed: number;
  failed: number;
  results: Array<{ passed: boolean; output: string; error?: string }>;
  executionTime: number;
}

@Injectable()
export class CodeExecutionService {
  private get baseUrl(): string | null {
    return process.env.JUDGE0_URL || null;
  }

  private get headers(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (process.env.JUDGE0_API_KEY) {
      headers['X-RapidAPI-Key'] = process.env.JUDGE0_API_KEY;
      headers['X-RapidAPI-Host'] =
        process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com';
    }
    return headers;
  }

  // Ported from leadership-assessment codeExecutionController.getLanguages.
  // Proxies Judge0's live language list when configured; falls back to a
  // static list otherwise so the client always has something to render.
  async getLanguages(): Promise<Array<{ id: number; name: string }>> {
    if (!this.baseUrl) return FALLBACK_LANGUAGES;

    const res = await fetch(`${this.baseUrl}/languages`, {
      headers: this.headers,
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      throw new ServiceUnavailableException('Failed to fetch languages from Judge0');
    }
    return res.json() as Promise<Array<{ id: number; name: string }>>;
  }

  private assertConfigured(): string {
    if (!this.baseUrl) {
      throw new ServiceUnavailableException(
        'Code execution is not configured. Set JUDGE0_URL (and JUDGE0_API_KEY for RapidAPI).',
      );
    }
    return this.baseUrl;
  }

  private async submitToJudge0(
    baseUrl: string,
    code: string,
    languageId: number,
    stdin: string,
    expectedOutput?: string,
  ): Promise<Judge0Submission> {
    const res = await fetch(
      `${baseUrl}/submissions?base64_encoded=false&wait=true`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
          stdin,
          expected_output: expectedOutput,
        }),
      },
    );

    if (!res.ok) {
      throw new ServiceUnavailableException(
        `Judge0 request failed: ${res.status} ${res.statusText}`,
      );
    }
    return res.json() as Promise<Judge0Submission>;
  }

  async executeCode(
    code: string,
    language: 'python' | 'javascript' | 'java' | 'cpp',
    testCases: Array<{ input: string; expectedOutput: string }>,
  ): Promise<ExecutionResult> {
    const baseUrl = this.assertConfigured();

    const languageId = LANGUAGE_IDS[language];
    if (!languageId) {
      throw new ServiceUnavailableException(
        `Unsupported language: ${language}`,
      );
    }

    const submissions = await Promise.all(
      testCases.map((tc) =>
        this.submitToJudge0(
          baseUrl,
          code,
          languageId,
          tc.input,
          tc.expectedOutput,
        ),
      ),
    );

    const results = submissions.map((s) => ({
      passed: s.status.id === STATUS_ACCEPTED,
      output: (s.stdout ?? '').trim(),
      ...(s.status.id !== STATUS_ACCEPTED
        ? {
            error:
              s.compile_output?.trim() ||
              s.stderr?.trim() ||
              s.status.description,
          }
        : {}),
    }));

    const passed = results.filter((r) => r.passed).length;
    const totalTimeMs = submissions.reduce(
      (sum, s) => sum + (s.time ? parseFloat(s.time) * 1000 : 0),
      0,
    );

    return {
      passed,
      failed: results.length - passed,
      results,
      executionTime: Math.round(totalTimeMs),
    };
  }

  async compileCode(
    code: string,
    language: string,
  ): Promise<{ compiled: boolean; error?: string }> {
    const baseUrl = this.assertConfigured();

    const languageId = LANGUAGE_IDS[language];
    if (!languageId) {
      return { compiled: false, error: `Unsupported language: ${language}` };
    }

    const submission = await this.submitToJudge0(baseUrl, code, languageId, '');
    if (submission.status.id === STATUS_COMPILE_ERROR) {
      return {
        compiled: false,
        error: submission.compile_output?.trim() || 'Compilation failed',
      };
    }
    return { compiled: true };
  }

  async validateSolution(
    code: string,
    language: 'python' | 'javascript' | 'java' | 'cpp',
    testCases: Array<{ input: string; expectedOutput: string }>,
  ): Promise<{
    valid: boolean;
    score: number;
    feedback: string;
    passed: number;
    failed: number;
    results: ExecutionResult['results'];
  }> {
    const execution = await this.executeCode(code, language, testCases);
    const total = execution.passed + execution.failed;
    const score = total ? Math.round((execution.passed / total) * 100) : 0;

    return {
      valid: execution.failed === 0,
      score,
      feedback:
        execution.failed === 0
          ? `All ${total} test cases passed.`
          : `${execution.passed}/${total} test cases passed.`,
      passed: execution.passed,
      failed: execution.failed,
      results: execution.results,
    };
  }
}
