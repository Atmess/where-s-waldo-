import { useState, useEffect } from 'react';
import API_BASE_URL from '../config';

export default function Leaderboard() {
  const [topScores, setTopScores] = useState([]);
  const [userBest, setUserBest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/api/leaderboard`, { headers });
        const data = await response.json();

        if (response.ok) {
          setTopScores(data.topScores);
          setUserBest(data.userBest);
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [token]);

  // Check if user's best score is already in the top 10 list
  const isUserInTop10 = userBest && topScores.some((score) => score.id === userBest.id);

  if (isLoading) return <div className="text-center text-slate-400 py-4">Loading leaderboard...</div>;

  return (
    <div >
      <h2 className="text-2xl font-bold text-center text-white mb-2">🏆 Hall of Fame</h2>
      
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {topScores.map((score, index) => (
          <div 
            key={score.id} 
            className="flex justify-between items-center bg-slate-900/60 border border-slate-700/50 px-4 py-3 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-slate-400 w-6">#{index + 1}</span>
              <span className="font-medium text-white">{score.name}</span>
            </div>
            <span className="font-mono text-green-400 font-bold">{score.timeInSeconds}s</span>
          </div>
        ))}

        {/* 11th Item: User's Personal Best (if logged in and not already in top 10) */}
        {userBest && !isUserInTop10 && (
          <>
            <div className="border-t border-slate-700 my-2 pt-2 text-center text-xs text-slate-500 font-semibold tracking-wider uppercase">
              Your Personal Record
            </div>
            <div className="flex justify-between items-center bg-blue-950/40 border border-blue-600/50 px-4 py-3 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-blue-400">★</span>
                <span className="font-medium text-white">{userBest.name} (You)</span>
              </div>
              <span className="font-mono text-blue-400 font-bold">{userBest.timeInSeconds}s</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}