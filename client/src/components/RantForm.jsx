import { useState } from 'react';
import { api } from '../api';

export default function RantForm({ username, onRantCreated }) {
  const [localName, setLocalName] = useState('');
  const [content, setContent] = useState('');
  const [code, setCode] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const name = username.trim() || localName.trim();
    if (!name || !content.trim()) return;
    setPosting(true);
    setError('');
    try {
      const res = await api('/api/rants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: name,
          content: content.trim(),
          code: code.trim() || undefined,
        }),
      });
      if (!res.ok) { let msg = 'Failed to post'; try { const err = await res.json(); msg = err.error || msg; } catch {} throw new Error(msg); }
      onRantCreated();
      setContent('');
      setCode('');
    } catch (err) {
      if (err.message === 'Failed to fetch' || err.message === 'NetworkError' || err.message.includes('Network')) {
        setError('Server is not responding — make sure the backend is running');
      } else {
        setError(err.message);
      }
    } finally {
      setPosting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl">
      <h2 className="text-lg font-semibold text-white/80 mb-4">Speak your mind</h2>
      <div className="flex gap-3 mb-3">
        <input
          type="text"
          placeholder="Display name"
          value={localName || username}
          onChange={(e) => setLocalName(e.target.value)}
          className="flex-1 min-w-0 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition"
        />
        <input
          type="text"
          placeholder="Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-28 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition"
        />
      </div>
      <textarea
        placeholder="What's eating you?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="w-full mb-4 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition"
        required
      />
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={posting || (!username.trim() && !localName.trim()) || !content.trim()}
          className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white font-semibold text-sm rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-orange-500/20"
        >
          {posting ? 'Posting...' : 'Rant'}
        </button>
      </div>
    </form>
  );
}
