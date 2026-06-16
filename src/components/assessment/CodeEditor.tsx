import React, { useState } from 'react';
import { Play, RotateCcw, Terminal, ChevronDown } from 'lucide-react';
import { Button } from '../common/Button';
import { cn } from '../../utils/cn';
import type { ProgrammingLanguage } from '../../types';
import { submitCode, statusColor } from '../../services/codeExecutionApi';

const defaultCode: Record<ProgrammingLanguage, string> = {
  python: `# Write your solution here
def solution():
    pass

print(solution())
`,
  javascript: `// Write your solution here
function solution() {
    // Your code
}

console.log(solution());
`,
  java: `public class Solution {
    public static void main(String[] args) {
        // Write your solution here
    }
}
`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your solution here
    return 0;
}
`,
  dotnet: `using System;

class Solution {
    static void Main() {
        // Write your solution here
    }
}
`,
};

const languageLabels: Record<ProgrammingLanguage, string> = {
  python: 'Python', javascript: 'JavaScript', java: 'Java', cpp: 'C/C++', dotnet: 'C# / .NET',
};

const monacoLanguages: Record<ProgrammingLanguage, string> = {
  python: 'python', javascript: 'javascript', java: 'java', cpp: 'cpp', dotnet: 'csharp',
};

// Judge0 language IDs
const judge0LanguageId: Record<ProgrammingLanguage, number> = {
  python: 71, javascript: 63, java: 62, cpp: 54, dotnet: 51,
};

interface Props {
  availableLanguages: ProgrammingLanguage[];
}

let MonacoEditor: React.ComponentType<{
  height: string; language: string; value: string;
  onChange: (v: string | undefined) => void; theme: string;
  options: Record<string, unknown>;
}> | null = null;

// Lazy-load Monaco
function LazyMonaco(props: React.ComponentProps<NonNullable<typeof MonacoEditor>>) {
  const [Comp, setComp] = React.useState<typeof MonacoEditor>(null);
  React.useEffect(() => {
    import('@monaco-editor/react').then(m => setComp(() => m.default));
  }, []);
  if (!Comp) return <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading editor...</div>;
  return <Comp {...props} />;
}

export function CodeEditor({ availableLanguages }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [lang, setLang] = useState<ProgrammingLanguage>(availableLanguages[0] ?? 'python');
  const [code, setCode] = useState(defaultCode[lang]);
  const [output, setOutput] = useState<string | null>(null);
  const [outputClass, setOutputClass] = useState('text-green-400');
  const [running, setRunning] = useState(false);
  const isDark = document.documentElement.classList.contains('dark');

  const handleLangChange = (l: ProgrammingLanguage) => {
    setLang(l);
    setCode(defaultCode[l]);
    setOutput(null);
  };

  const runCode = async () => {
    setRunning(true);
    setOutput('Running...');
    setOutputClass('text-gray-400');
    try {
      const result = await submitCode({
        source_code: code,
        language_id: judge0LanguageId[lang],
      });
      const out = result.stdout ?? result.compile_output ?? result.stderr ?? result.message ?? '';
      const statusLabel = result.status?.description ?? '';
      const timeStr = result.time ? ` | ${result.time}s` : '';
      const memStr = result.memory ? ` | ${Math.round(result.memory / 1024)}KB` : '';
      setOutput(`[${statusLabel}${timeStr}${memStr}]\n${out}`);
      setOutputClass(statusColor(result.status?.id ?? 0));
    } catch {
      setOutput('Code execution unavailable. Check your connection or Judge0 configuration.');
      setOutputClass('text-yellow-400');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="mb-6">
      <button onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between p-4 bg-gray-900 dark:bg-gray-950 rounded-t-xl text-sm text-gray-300 hover:text-white transition-colors">
        <span className="flex items-center gap-2">
          <Terminal size={15} />
          <span className="font-medium">Code Editor (Optional)</span>
          <span className="text-xs text-gray-500">— test your code before selecting an answer</span>
        </span>
        <ChevronDown size={16} className={cn('transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <div className="border border-gray-800 rounded-b-xl overflow-hidden">
          {/* Language selector */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-gray-800">
            {availableLanguages.map(l => (
              <button key={l} onClick={() => handleLangChange(l)}
                className={cn('px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                  lang === l ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                )}>
                {languageLabels[l]}
              </button>
            ))}
          </div>

          {/* Monaco Editor */}
          <div className="h-52">
            <LazyMonaco
              height="100%"
              language={monacoLanguages[lang]}
              value={code}
              onChange={v => setCode(v ?? '')}
              theme="vs-dark"
              options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', scrollBeyondLastLine: false, automaticLayout: true }}
            />
          </div>

          {/* Actions & output */}
          <div className="bg-gray-900 px-4 py-2 flex items-center gap-2">
            <Button size="xs" variant="success" loading={running} onClick={runCode} icon={<Play size={12} />}>
              Run
            </Button>
            <Button size="xs" variant="ghost" onClick={() => setCode(defaultCode[lang])} icon={<RotateCcw size={12} />}
              className="text-gray-400 hover:text-white">
              Reset
            </Button>
          </div>

          {output && (
            <pre className={cn('bg-gray-950 text-xs p-4 font-mono overflow-x-auto max-h-36 whitespace-pre-wrap', outputClass)}>
              {output}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
