'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const response = await api.get('/api/interviews/dashboard');
        const data = response.data.data;
        setInterviews(data?.interviews || data?.upcoming || []);
      } catch (error) {
        console.error('Failed to fetch interviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, []);

  const handleSchedule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.post('/api/interviews/schedule', {
        candidateName: formData.get('candidateName'),
        candidateEmail: formData.get('candidateEmail'),
        scheduledTime: formData.get('scheduledTime'),
      });
      setShowScheduleForm(false);
      window.location.reload();
    } catch (error) {
      console.error('Failed to schedule interview:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Live Interviews</h1>
        <button
          onClick={() => setShowScheduleForm(!showScheduleForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Schedule Interview
        </button>
      </div>

      {showScheduleForm && (
        <form
          onSubmit={handleSchedule}
          className="bg-white p-6 rounded-lg shadow mb-8"
        >
          <h2 className="text-xl font-semibold mb-4">Schedule New Interview</h2>
          <div className="space-y-4">
            <input
              type="text"
              name="candidateName"
              placeholder="Candidate Name"
              required
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="email"
              name="candidateEmail"
              placeholder="Candidate Email"
              required
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="datetime-local"
              name="scheduledTime"
              required
              className="w-full px-3 py-2 border rounded"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Schedule
              </button>
              <button
                type="button"
                onClick={() => setShowScheduleForm(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading interviews...</p>
      ) : interviews.length === 0 ? (
        <p className="text-gray-500">No interviews scheduled yet.</p>
      ) : (
        <div className="grid gap-4">
          {interviews.map((interview: any) => (
            <div
              key={interview.id}
              className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-600"
            >
              <h3 className="text-lg font-semibold">{interview.candidateName}</h3>
              <p className="text-gray-600">
                {new Date(interview.scheduledTime).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-2">Status: {interview.status}</p>
              {interview.status === 'scheduled' && (
                <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Start Video Room
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
