import { Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Shingle/Jaccard structural similarity — deliberately not a full
// per-language AST diff. A real AST comparison would need a parser per
// supported language (Python ast, Babel for JS, a Java parser, clang for
// C++), which is a much larger dependency chain than this pass covers.
// This normalizes away naming/whitespace/comments and compares k-token
// windows, which catches copy-paste-with-renamed-variables — the common
// case — without claiming a precision this approach doesn't have.
const SHINGLE_SIZE = 5;
const SIMILARITY_FLAG_THRESHOLD = 0.85;

// Kept literal during canonicalization (not renamed to VAR#) — spans
// Python/JS/Java/C++ so the same tokenizer works across all four languages
// this platform executes (see code-execution.service.ts LANGUAGE_IDS).
const KEYWORDS = new Set([
  'if', 'else', 'elif', 'for', 'while', 'def', 'return', 'function', 'class',
  'import', 'from', 'let', 'const', 'var', 'new', 'this', 'self', 'true',
  'false', 'null', 'none', 'void', 'public', 'private', 'protected', 'static',
  'int', 'float', 'double', 'string', 'bool', 'boolean', 'char', 'long',
  'break', 'continue', 'try', 'catch', 'except', 'finally', 'throw', 'raise',
  'in', 'of', 'not', 'and', 'or', 'is', 'switch', 'case', 'default', 'do',
  'enum', 'interface', 'extends', 'implements', 'super', 'include', 'using',
  'namespace', 'struct', 'template', 'typedef', 'STR', 'NUM',
]);

export interface PlagiarismCheckResult {
  similarityScore: number;
  flagged: boolean;
  matchedSubmissionId: string | null;
}

@Injectable({ scope: Scope.REQUEST })
export class PlagiarismService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  // Strips comments and string/number literals, then canonicalizes every
  // non-keyword identifier to a positional VAR# token (first-seen order).
  // This is what makes copy-paste-with-renamed-variables/functions collapse
  // to the same token stream as the original — comparing raw identifiers
  // would miss exactly the obfuscation this check exists to catch.
  private tokenize(code: string): string[] {
    const noComments = code
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/\/\/.*$/gm, ' ')
      .replace(/#.*$/gm, ' ');
    const noLiterals = noComments
      .replace(/"(?:[^"\\]|\\.)*"/g, ' STR ')
      .replace(/'(?:[^'\\]|\\.)*'/g, ' STR ')
      .replace(/\b\d+(\.\d+)?\b/g, ' NUM ');
    const rawTokens = noLiterals
      .split(/[^A-Za-z0-9_]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const canonical = new Map<string, string>();
    let nextVarId = 1;
    return rawTokens.map((token) => {
      const lower = token.toLowerCase();
      if (KEYWORDS.has(lower) || token === 'STR' || token === 'NUM') return lower;
      if (/^\d+$/.test(token)) return token;
      if (!canonical.has(token)) {
        canonical.set(token, `VAR${nextVarId++}`);
      }
      return canonical.get(token)!;
    });
  }

  private shingles(tokens: string[]): Set<string> {
    const result = new Set<string>();
    if (tokens.length < SHINGLE_SIZE) {
      result.add(tokens.join(' '));
      return result;
    }
    for (let i = 0; i <= tokens.length - SHINGLE_SIZE; i++) {
      result.add(tokens.slice(i, i + SHINGLE_SIZE).join(' '));
    }
    return result;
  }

  private jaccard(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 && b.size === 0) return 0;
    let intersection = 0;
    for (const shingle of a) {
      if (b.has(shingle)) intersection++;
    }
    const union = a.size + b.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }

  async checkAgainstPriorSubmissions(
    problemId: string,
    language: string,
    code: string,
    excludeUserId: string,
  ): Promise<PlagiarismCheckResult> {
    const priorSubmissions = await this.prisma.codeSubmission.findMany({
      where: {
        tenantId: this.tenantId,
        problemId,
        language,
        userId: { not: excludeUserId },
      },
      select: { id: true, code: true },
    });

    const candidateShingles = this.shingles(this.tokenize(code));

    let best: { id: string; score: number } | null = null;
    for (const prior of priorSubmissions) {
      const score = this.jaccard(candidateShingles, this.shingles(this.tokenize(prior.code)));
      if (!best || score > best.score) {
        best = { id: prior.id, score };
      }
    }

    const similarityScore = best ? Math.round(best.score * 1000) / 1000 : 0;
    return {
      similarityScore,
      flagged: similarityScore >= SIMILARITY_FLAG_THRESHOLD,
      matchedSubmissionId: best && similarityScore >= SIMILARITY_FLAG_THRESHOLD ? best.id : null,
    };
  }
}
