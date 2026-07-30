import { useState, useEffect, useRef } from 'react';

const REACTIONS = [
  { type: 'like',    emoji: '👍', label: 'Like' },
  { type: 'heart',   emoji: '❤️', label: 'Love' },
  { type: 'care',    emoji: '🤗', label: 'Care' },
  { type: 'happy',   emoji: '😄', label: 'Happy' },
  { type: 'sad',     emoji: '😢', label: 'Sad' },
  { type: 'angry',   emoji: '😡', label: 'Angry' },
  { type: 'dislike', emoji: '👎', label: 'Dislike' },
];

export default function ReactionButtons({ rantId, commentId, likes, dislikes, username, reactions: propReactions }) {
  const [counts, setCounts] = useState({});
  const [currentType, setCurrentType] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (propReactions) {
      const merged = {};
      for (const r of REACTIONS) merged[r.type] = propReactions[r.type] || 0;
      setCounts(merged);
    } else {
      const merged = {};
      for (const r of REACTIONS) merged[r.type] = 0;
      merged.like = likes || 0;
      merged.dislike = dislikes || 0;
      setCounts(merged);
    }
  }, [propReactions, likes, dislikes]);

  useEffect(() => {
    function handleClick(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleReaction(type) {
    const name = username.trim() || 'Anonymous';
    setShowPicker(false);
    try {
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rant_id: rantId || null, comment_id: commentId || null, username: name, type }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.counts) {
        setCounts(data.counts);
        setCurrentType(data.currentUserType);
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="relative flex items-center gap-2 text-xs">
      <div className="flex items-center gap-1">
        {REACTIONS.map((r) => {
          const c = counts[r.type] || 0;
          if (c === 0 && r.type !== currentType) return null;
          return (
            <span key={r.type} className="text-sm" title={r.label}>
              {r.emoji}
              {c > 0 && <span className="text-xs text-white/40 ml-0.5">{c}</span>}
            </span>
          );
        })}
      </div>

      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className={`font-medium transition cursor-pointer px-2.5 py-1 rounded-lg text-sm ${
            currentType
              ? 'text-orange-400 bg-orange-500/10'
              : 'text-white/40 hover:text-white/70 hover:bg-white/5'
          }`}
        >
          {currentType
            ? REACTIONS.find((r) => r.type === currentType)?.emoji + ' ' + REACTIONS.find((r) => r.type === currentType)?.label
            : 'React'}
        </button>

        {showPicker && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex gap-1.5 bg-slate-800 rounded-full shadow-2xl border border-white/10 px-4 py-2.5 z-20">
            {REACTIONS.map((r) => (
              <button
                key={r.type}
                onClick={() => handleReaction(r.type)}
                className={`text-xl hover:scale-125 transition-transform cursor-pointer ${currentType === r.type ? 'scale-110' : ''}`}
                title={r.label}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
