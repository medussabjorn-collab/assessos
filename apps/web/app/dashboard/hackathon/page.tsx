'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

export default function HackathonPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathon, setSelectedHackathon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any>(null);

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        const response = await axios.get('/api/hackathons', {
          headers: {
            'x-tenant-id': localStorage.getItem('tenantId') || '',
          },
        });
        setHackathons(response.data.data || []);
        if (response.data.data.length > 0) {
          setSelectedHackathon(response.data.data[0]);
        }
      } catch (error) {
        console.error('Failed to fetch hackathons:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHackathons();
  }, []);

  const handleRegisterTeam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedHackathon) return;

    const formData = new FormData(e.currentTarget);
    try {
      await axios.post(
        `/api/hackathons/${selectedHackathon.id}/teams`,
        {
          teamName: formData.get('teamName'),
          members: (formData.get('members') as string)
            .split(',')
            .map((m) => m.trim()),
        },
        {
          headers: {
            'x-tenant-id': localStorage.getItem('tenantId') || '',
          },
        }
      );
      setShowTeamForm(false);
      alert('Team registered successfully!');
    } catch (error) {
      console.error('Failed to register team:', error);
    }
  };

  const handleViewLeaderboard = async () => {
    if (!selectedHackathon) return;
    try {
      const response = await axios.get(
        `/api/hackathons/${selectedHackathon.id}/leaderboard`,
        {
          headers: {
            'x-tenant-id': localStorage.getItem('tenantId') || '',
          },
        }
      );
      setLeaderboard(response.data.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Hackathons</h1>

      {loading ? (
        <p className="text-gray-500">Loading hackathons...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4">Active Events</h2>
            <div className="space-y-2">
              {hackathons.map((hackathon: any) => (
                <button
                  key={hackathon.id}
                  onClick={() => {
                    setSelectedHackathon(hackathon);
                    setLeaderboard(null);
                  }}
                  className={`w-full text-left p-3 rounded border transition ${
                    selectedHackathon?.id === hackathon.id
                      ? 'bg-blue-100 border-blue-600'
                      : 'bg-white border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium">{hackathon.title}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(hackathon.startDate).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedHackathon ? (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-2">{selectedHackathon.title}</h2>
                <p className="text-gray-600 mb-4">{selectedHackathon.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded">
                    <div className="text-sm text-gray-600">Prize Pool</div>
                    <div className="text-2xl font-bold text-blue-600">
                      ${selectedHackathon.prizePool?.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded">
                    <div className="text-sm text-gray-600">Team Size</div>
                    <div className="text-2xl font-bold text-green-600">
                      {selectedHackathon.teamSize.min}-{selectedHackathon.teamSize.max}
                    </div>
                  </div>
                </div>

                {leaderboard ? (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Leaderboard</h3>
                    <div className="space-y-2">
                      {leaderboard.topTeams?.map((team: any) => (
                        <div
                          key={team.rank}
                          className="flex justify-between items-center bg-gray-50 p-4 rounded"
                        >
                          <div>
                            <div className="font-semibold">#{team.rank} {team.teamName}</div>
                            <div className="text-sm text-gray-600">Score: {team.score}</div>
                          </div>
                          <div className="text-lg font-bold text-green-600">
                            {team.prize}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowTeamForm(!showTeamForm)}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Register Team
                    </button>
                    <button
                      onClick={handleViewLeaderboard}
                      className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                    >
                      View Leaderboard
                    </button>
                  </div>
                )}

                {showTeamForm && (
                  <form
                    onSubmit={handleRegisterTeam}
                    className="mt-6 p-4 bg-gray-50 rounded border"
                  >
                    <h3 className="font-semibold mb-3">Create New Team</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        name="teamName"
                        placeholder="Team Name"
                        required
                        className="w-full px-3 py-2 border rounded"
                      />
                      <textarea
                        name="members"
                        placeholder="Member emails (comma-separated)"
                        required
                        className="w-full px-3 py-2 border rounded h-20"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                          Register
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowTeamForm(false)}
                          className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
                Select a hackathon to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
