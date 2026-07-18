'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Play, RotateCcw } from 'lucide-react';

// Monaco touches `window`/`self` at module load — must never run during
// Next's server render. next/dynamic with ssr:false (rather than leadership's
// manual useEffect+useState lazy-import) is the idiomatic Next pattern and
// avoids a possible double-import race.
const Monaco = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-subtle text-sm">Loading editor…</div>
  ),
});

// Only the 4 languages CodeExecutionService can actually run
// (modules/coding/code-execution.service.ts LANGUAGE_IDS) — GET
// /api/coding/languages lists 10 (Judge0's fuller catalog or the fallback
// list), but submitting in anything outside this set fails server-side with
// "Unsupported language". Not offering languages that would silently fail.
export type SupportedLanguage = 'python' | 'javascript' | 'java' | 'cpp';

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  java: 'Java',
  cpp: 'C++',
};

const MONACO_LANGUAGE: Record<SupportedLanguage, string> = {
  python: 'python',
  javascript: 'javascript',
  java: 'java',
  cpp: 'cpp',
};

// The backend's CodingProblem has no starterCode field — synthesized
// client-side per language, same approach as leadership's CodeEditor.
const DEFAULT_CODE: Record<SupportedLanguage, string> = {
  python: '# Write your solution here\ndef solution():\n    pass\n',
  javascript: '// Write your solution here\nfunction solution() {\n\n}\n',
  java: 'public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n',
};

interface CodeEditorProps {
  onSubmit: (code: string, language: SupportedLanguage) => void | Promise<void>;
  submitting: boolean;
}

export default function CodeEditor({ onSubmit, submitting }: CodeEditorProps) {
  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [code, setCode] = useState(DEFAULT_CODE.python);

  const handleLanguageChange = (l: SupportedLanguage) => {
    setLanguage(l);
    setCode(DEFAULT_CODE[l]);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-hairline">
      <div className="flex items-center gap-2 px-4 py-2 bg-canvas border-b border-hairline">
        {(Object.keys(LANGUAGE_LABELS) as SupportedLanguage[]).map((l) => (
          <button
            key={l}
            onClick={() => handleLanguageChange(l)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              language === l ? 'bg-brand-600 text-white' : 'text-subtle hover:bg-surface hover:text-ink'
            }`}
          >
            {LANGUAGE_LABELS[l]}
          </button>
        ))}
      </div>

      <div className="h-72">
        <Monaco
          height="100%"
          language={MONACO_LANGUAGE[language]}
          value={code}
          onChange={(v) => setCode(v ?? '')}
          theme="vs-dark"
          options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', scrollBeyondLastLine: false, automaticLayout: true }}
        />
      </div>

      <div className="flex items-center gap-2 px-4 py-2 bg-canvas border-t border-hairline">
        <button
          onClick={() => onSubmit(code, language)}
          disabled={submitting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition"
        >
          <Play size={12} /> {submitting ? 'Running…' : 'Submit'}
        </button>
        <button
          onClick={() => setCode(DEFAULT_CODE[language])}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-subtle hover:bg-surface hover:text-ink transition"
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>
    </div>
  );
}
