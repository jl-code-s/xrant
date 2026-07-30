import { useState } from 'react';
import ReactionButtons from './ReactionButtons';
import CommentSection from './CommentSection';
import ReportButton from './ReportButton';
import { formatDate } from '../formatDate';

export default function RantCard({ rant, username }) {
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.03] backdrop-blur-xl rounded-2xl border-l-4 border-l-orange-500/40 border-t border-r border-b border-white/10 p-6 shadow-2xl shadow-orange-500/5 transition hover:shadow-orange-500/10 hover:border-l-orange-500/60">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-orange-500/20">
          {rant.username.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white truncate">{rant.username}</p>
            {rant.code && (
              <span className="shrink-0 px-2 py-0.5 bg-orange-500/15 border border-orange-500/30 text-orange-300 text-[10px] font-mono rounded-md">
                {rant.code}
              </span>
            )}
          </div>
          <p className="text-xs text-white/40">{formatDate(rant.created_at)}</p>
        </div>
      </div>

      <p className="text-white/80 leading-relaxed mb-4">{rant.content}</p>

      <div className="flex items-center gap-4 pt-3 border-t border-white/5">
        <ReactionButtons rantId={rant.id} reactions={rant} username={username} />
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-orange-400 transition cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {rant.comment_count || 0}
        </button>
        <ReportButton rantId={rant.id} username={username} />
      </div>

      {showComments && (
        <div className="relative">
          <button onClick={() => setShowComments(false)} className="absolute top-1 right-1 text-white/30 hover:text-white/60 transition cursor-pointer text-sm z-10">✕</button>
          <CommentSection rantId={rant.id} username={username} />
        </div>
      )}
    </div>
  );
}
