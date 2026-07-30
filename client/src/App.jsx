import { useState, useEffect, useCallback } from 'react';
import RantForm from './components/RantForm';
import RantCard from './components/RantCard';
import AdminPage from './components/AdminPage';
import { api } from './api';

export default function App() {
  const [rants, setRants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(() => localStorage.getItem('xrant_user') || '');
  const [showAdmin, setShowAdmin] = useState(false);
  const [searchCode, setSearchCode] = useState('');

  useEffect(() => {
    localStorage.setItem('xrant_user', username);
  }, [username]);

  const loadRants = useCallback(async (code) => {
    try {
      const params = code?.trim() ? `?code=${encodeURIComponent(code.trim())}` : '';
      const res = await api(`/api/rants${params}`);
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      setRants(data);
    } catch (err) {
      console.error('Failed to load rants:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRants(searchCode); }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadRants(searchCode), 300);
    return () => clearTimeout(timer);
  }, [searchCode, loadRants]);

  function handleRantCreated() {
    loadRants(searchCode);
  }

  function handleExitAdmin() {
    setShowAdmin(false);
    setSearchCode('');
    loadRants('');
  }

  if (showAdmin) return <AdminPage onBack={handleExitAdmin} />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 font-sans">
      <header className="border-b border-white/10 backdrop-blur-xl bg-slate-900/70 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1
            className="text-2xl font-extrabold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent tracking-tight text-center cursor-pointer select-none"
            onDoubleClick={() => setShowAdmin(true)}
          >
            xRant
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-orange-500/10 backdrop-blur-xl rounded-2xl border border-orange-500/30 p-5 shadow-xl shadow-orange-500/10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-orange-500/30">
              M
            </div>
            <div>
              <p className="text-sm font-bold text-orange-300 uppercase tracking-wider">Message from Management</p>
              <p className="text-sm text-white/70 mt-1.5 leading-relaxed">
                Be respectful. No curse words directed at others. Keep it civil — rant about the issue, not the person.
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-sky-500/10 backdrop-blur-xl rounded-2xl border border-sky-500/30 p-5 shadow-xl shadow-sky-500/10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-sky-500/30">
              ?
            </div>
            <div>
              <p className="text-sm font-bold text-sky-300 uppercase tracking-wider">What to do</p>
              <p className="text-sm text-white/70 mt-1.5 leading-relaxed">
                Post a rant, add an optional code to tag it, browse and search rants by code, react with emojis, comment and reply, or report anything that breaks the rules.
              </p>
            </div>
          </div>
        </div>
        <RantForm username={username} onRantCreated={handleRantCreated} />

        <div className="relative">
          <input
            type="text"
            placeholder="Search by code..."
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-white/40 text-sm mt-3">Loading rants...</p>
          </div>
        ) : rants.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-white/40 text-sm">No rants yet. Be the first!</p>
          </div>
        ) : (
          rants.map((rant) => (
            <RantCard key={rant.id} rant={rant} username={username} />
          ))
        )}
      </main>
    </div>
  );
}
