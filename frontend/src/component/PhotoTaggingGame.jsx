import { useState, useEffect, useRef } from 'react';
import API_BASE_URL from '../config';
import waldogame from '../assets/waldogame/thumb-1920-8054.jpg'

export default function PhotoTaggingGame() {
  const [sessionId, setSessionId] = useState(null);
  const [characters, setCharacters] = useState([
    { id: 'waldo', name: 'Waldo', found: false },
    { id: 'wizard', name: 'Wizard', found: false },
    { id: 'odlaw', name: 'Odlaw', found: false },
    { id: 'wenda', name:'wenda' , found:false},
    {id: 'woof' ,   name:'woof',    found:false}
  ]);
  
  // Interaction states
  const [clickPos, setClickPos] = useState(null); // { x: %, y: %, clientX, clientY }
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [markers, setMarkers] = useState([]); // Successfully found character positions
  
  // Game completion states
  const [isFinished, setIsFinished] = useState(false);
  const [finalTime, setFinalTime] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const [showModal, setShowModal] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
    
  const imageRef = useRef(null);
  const token = localStorage.getItem('token');

  // 1. Start session on button
const handleStartGame = async () => {
  setIsLoading(true);
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/game/start`, {
      method: 'POST',
      headers,
    });

    const data = await response.json();
    setSessionId(data.sessionId);
    setGameStarted(true); // Unlocks/shows the game board
  } catch (err) {
    console.error('Failed to start game session:', err);
    alert('Could not start the game. Please try again!');
  } finally {
    setIsLoading(false);
  }
};
  // 2. Handle Image Click to Open Targeting Box & Menu
  const handleImageClick = (e) => {
    if (isFinished || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const yPx = e.clientY - rect.top;

    // Convert to percentages for responsive accuracy
    const xPercent = (xPx / rect.width) * 100;
    const yPercent = (yPx / rect.height) * 100;

    setClickPos({ x: xPercent, y: yPercent });
    setMenuPos({ top: e.clientY, left: e.clientX });
    setIsMenuOpen(true);
  };

  // 3. Submit Guess to Backend
  const handleSelectCharacter = async (characterId) => {
    setIsMenuOpen(false);
    if (!clickPos || !sessionId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/game/guess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          characterId,
          coordinates: { x: clickPos.x, y: clickPos.y },
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      if (result.correct) {
        // Mark character as found in UI state
        setCharacters((prev) =>
          prev.map((char) => (char.id === characterId ? { ...char, found: true } : char))
        );

        // Add a marker pin on the photo
        setMarkers((prev) => [...prev, { id: characterId, x: clickPos.x, y: clickPos.y }]);

        if (result.finished) {
          setIsFinished(true);
          setShowModal(true)
          setFinalTime(result.timeInSeconds);
        }
      } else {
        alert('Not quite! Try another spot.');
      }
    } catch (err) {
      alert(err.message);
    }
    setClickPos(null);
  };

  // 4. Save Score to Leaderboard
  const handleSaveScore = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/game/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName || 'Anonymous', timeInSeconds: finalTime }),
      });
      if (!response.ok) throw new Error('Failed to save score');
      setScoreSubmitted(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRestartGame = async () => {
    // 1. Reset all local UI states
    setMarkers([]);
    setIsFinished(false);
    setScoreSubmitted(false);
    setPlayerName('');
    setCharacters([
      { id: 'waldo', name: 'Waldo', found: false },
      { id: 'wizard', name: 'Wizard', found: false },
      { id: 'odlaw', name: 'Odlaw', found: false },
      { id: 'wenda', name: 'wenda', found: false },
      { id: 'woof', name: 'woof', found: false },
    ]);

    // 2. Call handleStartGame to get a fresh session ID from the backend
    await handleStartGame();
  };
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 text-slate-100">
      {/* Header & Character Status Tracker */}
      <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
        <h1 className="text-xl font-bold">Find Waldo & Friends!</h1>
        <div className="flex gap-4">
          {characters.map((char) => (
            <span
              key={char.id}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                char.found ? 'bg-green-600/30 text-green-400 border border-green-500' : 'bg-slate-700 text-slate-400'
              }`}
            >
              {char.name} {char.found ? '✓' : ''}
            </span>
          ))}
        </div>
      </div>
      <div className="flex justify-center">
        <button onClick={handleRestartGame} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-white font-medium transition">
          Start
        </button>
      </div>
        {!gameStarted ? (
  <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl text-center space-y-4 max-w-md mx-auto">
    <h2 className="text-2xl font-bold text-white">Ready to find Waldo?</h2>
    <p className="text-slate-400 text-sm">
      Find Waldo, Wizard, and Odlaw as fast as you can. Your timer starts as soon as you press Start!
    </p>
    <button
      onClick={handleStartGame}
      disabled={isLoading}
      className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-xl transition w-full disabled:opacity-50"
    >
      {isLoading ? 'Starting...' : 'Start Game 🚀'}
    </button>
  </div>
) : (
 //  {/* Game Image Container */}
  <div className="relative inline-block cursor-crosshair border-2 border-slate-700 rounded-xl overflow-hidden shadow-2xl">
     <img
          ref={imageRef}
          src={waldogame} // 👈 Drop your large game image in public/ or import it
          alt="Where's Waldo Game"
          onClick={handleImageClick}
          className="w-full h-auto block select-none"
        />
         {/* Render Checkmark Markers for Found Characters */}
          {markers.map((marker) => (
          <div
            key={marker.id}
            className="absolute w-8 h-8 -ml-4 -mt-4 border-2 border-green-400 bg-green-500/20 rounded-full flex items-center justify-center pointer-events-none animate-ping-once"
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
          >
            <span className="text-xs font-bold text-white">✓</span>
          </div>
        ))}
  </div>
)}


     
  

      {/* Targeting Dropdown Menu Modal */}
      {isMenuOpen && clickPos && (
        <div
          className="absolute z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-2 space-y-1"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          <p className="text-xs text-slate-400 px-3 py-1 font-semibold">Who is here?</p>
          {characters
            .filter((c) => !c.found)
            .map((char) => (
              <button
                key={char.id}
                onClick={() => handleSelectCharacter(char.id)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-600 rounded-md transition text-white"
              >
                {char.name}
              </button>
            ))}
          <button
            onClick={() => setIsMenuOpen(false)}
            className="w-full text-center px-3 py-1 text-xs text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Victory Modal */}
      {isFinished && showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl max-w-md w-full space-y-4 text-center">
            <h2 className="text-2xl font-bold text-white">🎉 You Found Everyone!</h2>
            <p className="text-slate-300">
              Total Time: <span className="font-mono text-green-400 font-bold">{finalTime} seconds</span>
            </p>

            {!scoreSubmitted ? (
              <form onSubmit={handleSaveScore} className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter your name for the leaderboard"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
                >
                  Submit Score
                </button>
              </form>
            ) : (
              <p className="text-green-400 font-medium">Score saved successfully!</p>
            )}
            <button className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 rounded-lg transition" onClick={()=>{setShowModal(false)}}>close</button>
          </div>
        </div>
      )}

      
    </div>
  );
}