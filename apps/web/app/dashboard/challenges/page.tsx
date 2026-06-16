'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

export default function ChallengesPage() {
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState<any>(null);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await axios.get('/api/coding/problems', {
          headers: {
            'x-tenant-id': localStorage.getItem('tenantId') || '',
          },
        });
        setProblems(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch problems:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  const handleSubmit = async () => {
    if (!selectedProblem) return;
    setSubmitting(true);
    try {
      const response = await axios.post(
        `/api/coding/problems/${selectedProblem.id}/submit`,
        {
          code,
          language: 'javascript',
        },
        {
          headers: {
            'x-tenant-id': localStorage.getItem('tenantId') || '',
          },
        }
      );
      alert(`Submission ${response.data.data.passed ? 'Passed!' : 'Failed'}`);
      setCode('');
      setSelectedProblem(null);
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Coding Challenges</h1>

      {loading ? (
        <p className="text-gray-500">Loading challenges...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4">Problems</h2>
            <div className="space-y-2">
              {problems.map((problem: any) => (
                <button
                  key={problem.id}
                  onClick={() => setSelectedProblem(problem)}
                  className={`w-full text-left p-3 rounded border transition ${
                    selectedProblem?.id === problem.id
                      ? 'bg-blue-100 border-blue-600'
                      : 'bg-white border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium">{problem.title}</div>
                  <div className="text-sm text-gray-600">
                    <span className="inline-block px-2 py-1 bg-yellow-100 rounded text-xs">
                      {problem.difficulty}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedProblem ? (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-4">{selectedProblem.title}</h2>
                <p className="text-gray-700 mb-6">{selectedProblem.description}</p>

                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Examples:</h3>
                  <div className="bg-gray-100 p-4 rounded text-sm font-mono whitespace-pre-wrap">
                    {selectedProblem.examples}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block font-semibold mb-2">Your Solution:</label>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-64 p-3 border rounded font-mono text-sm"
                    placeholder="Write your code here..."
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  {submitting ? 'Submitting...' : 'Submit Solution'}
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
                Select a problem to get started
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
