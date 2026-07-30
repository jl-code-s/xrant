import { useState, useEffect } from 'react';
import ReactionButtons from './ReactionButtons';
import { formatDate } from '../formatDate';

function ReplyForm({ onSubmit, onCancel }) {
  const [text, setText] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-2 ml-10">
      <input
        type="text"
        placeholder="Write a reply..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition"
        autoFocus
      />
      <button type="submit" className="text-sm text-orange-400 hover:text-orange-300 font-medium transition cursor-pointer">
        Reply
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel} className="text-sm text-white/30 hover:text-white/60 transition cursor-pointer px-1">
          ✕
        </button>
      )}
    </form>
  );
}

function ReplyItem({ reply, parentName, username, localName, onReply }) {
  const [showReply, setShowReply] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reported, setReported] = useState(false);

  function handleReply(text) {
    const name = username.trim() || localName.trim() || 'Anonymous';
    fetch(`/api/rants/${reply.rant_id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: name, content: text, parent_id: reply.id }),
    })
      .then(async (r) => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then((newReply) => { onReply(newReply); setShowReply(false); })
      .catch(console.error);
  }

  return (
    <div className="flex gap-3 py-2">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5 shadow-sm">
        {reply.username.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-white/5 rounded-xl px-3 py-2 border border-white/5">
          <p className="text-sm font-semibold text-white/90">
            {reply.username}
            <span className="text-xs text-white/30 font-normal ml-2">replied to {parentName}</span>
          </p>
          <p className="text-sm text-white/70 mt-0.5">{reply.content}</p>
        </div>
        <div className="flex items-center gap-4 mt-1.5 ml-1">
          <ReactionButtons commentId={reply.id} reactions={reply} username={username} />
          <button onClick={() => setShowReply(!showReply)} className="text-xs text-white/40 hover:text-orange-400 font-medium transition cursor-pointer">
            Reply
          </button>
          <button
            onClick={() => { if (!reported) setShowReport(true); }}
            className={`text-xs transition cursor-pointer ${reported ? 'text-orange-400/50' : 'text-white/30 hover:text-red-400'}`}
          >
            {reported ? 'Reported' : 'Report'}
          </button>
          <span className="text-xs text-white/30">{formatDate(reply.created_at)}</span>
        </div>
        {showReply && <ReplyForm onSubmit={handleReply} onCancel={() => setShowReply(false)} />}

        {showReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 w-full max-w-md mx-4 shadow-2xl relative">
              <button type="button" onClick={() => { setShowReport(false); setReportReason(''); }} className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition cursor-pointer text-sm">✕</button>
              <h3 className="text-lg font-semibold text-white mb-4">Report this reply</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const name = username.trim() || localName.trim() || 'Anonymous';
                try {
                  const res = await fetch(`/api/comments/${reply.id}/report`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: name, reason: reportReason.trim() || null }),
                  });
                  if (res.ok || res.status === 409) { setReported(true); setShowReport(false); setReportReason(''); }
                } catch (err) { console.error(err); }
              }}>
                <textarea
                  placeholder="Why are you reporting this? (optional)"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition mb-4"
                />
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => { setShowReport(false); setReportReason(''); }} className="px-4 py-2 text-sm text-white/50 hover:text-white/70 transition cursor-pointer">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white font-semibold text-sm rounded-xl transition cursor-pointer shadow-lg shadow-orange-500/20">Submit report</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CommentItem({ comment, replies, username, localName, onReply }) {
  const [showReply, setShowReply] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reported, setReported] = useState(false);

  function handleReply(text) {
    const name = username.trim() || localName.trim() || 'Anonymous';
    fetch(`/api/rants/${comment.rant_id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: name, content: text, parent_id: comment.id }),
    })
      .then(async (r) => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then((newReply) => { onReply(newReply); setShowReply(false); })
      .catch(console.error);
  }

  return (
    <div>
      <div className="flex gap-3 py-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5 shadow-sm">
          {comment.username.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-white/5 rounded-xl px-3.5 py-2.5 border border-white/5">
            <p className="text-sm font-semibold text-white/90">{comment.username}</p>
            <p className="text-sm text-white/70 mt-0.5">{comment.content}</p>
          </div>
          <div className="flex items-center gap-4 mt-1.5 ml-1">
            <ReactionButtons commentId={comment.id} reactions={comment} username={username} />
            <button onClick={() => setShowReply(!showReply)} className="text-xs text-white/40 hover:text-orange-400 font-medium transition cursor-pointer">
              Reply
            </button>
            <button
              onClick={() => { if (!reported) setShowReport(true); }}
              className={`text-xs transition cursor-pointer ${reported ? 'text-orange-400/50' : 'text-white/30 hover:text-red-400'}`}
            >
              {reported ? 'Reported' : 'Report'}
            </button>
            <span className="text-xs text-white/30">{formatDate(comment.created_at)}</span>
          </div>
          {showReply && <ReplyForm onSubmit={handleReply} onCancel={() => setShowReply(false)} />}

          {showReport && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 w-full max-w-md mx-4 shadow-2xl relative">
                <button type="button" onClick={() => { setShowReport(false); setReportReason(''); }} className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition cursor-pointer text-sm">✕</button>
                <h3 className="text-lg font-semibold text-white mb-4">Report this comment</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const name = username.trim() || localName.trim() || 'Anonymous';
                  try {
                    const res = await fetch(`/api/comments/${comment.id}/report`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ username: name, reason: reportReason.trim() || null }),
                    });
                    if (res.ok || res.status === 409) { setReported(true); setShowReport(false); setReportReason(''); }
                  } catch (err) { console.error(err); }
                }}>
                  <textarea
                    placeholder="Why are you reporting this? (optional)"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition mb-4"
                  />
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => { setShowReport(false); setReportReason(''); }} className="px-4 py-2 text-sm text-white/50 hover:text-white/70 transition cursor-pointer">Cancel</button>
                    <button type="submit" className="px-5 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white font-semibold text-sm rounded-xl transition cursor-pointer shadow-lg shadow-orange-500/20">Submit report</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {replies.length > 0 && (
        <div className="ml-8 border-l border-white/5 pl-4">
          {replies.map((reply) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              parentName={comment.username}
              username={username}
              localName={localName}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ rantId, username }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [localName, setLocalName] = useState('');
  const [posting, setPosting] = useState(false);

  function loadComments() {
    fetch(`/api/rants/${rantId}/comments`)
      .then(async (r) => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then(setComments)
      .catch(console.error);
  }

  useEffect(loadComments, [rantId]);

  async function handleSubmit(e) {
    e.preventDefault();
    const name = username.trim() || localName.trim() || 'Anonymous';
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/rants/${rantId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, content: newComment.trim() }),
      });
      if (!res.ok) { let msg = 'Failed'; try { const err = await res.json(); msg = err.error || msg; } catch {} throw new Error(msg); }
      await res.json();
      loadComments();
      setNewComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  }

  const topLevel = comments.filter((c) => !c.parent_id);

  function getDescendants(parentId) {
    const direct = comments.filter((c) => c.parent_id === parentId);
    const nested = direct.flatMap((c) => getDescendants(c.id));
    return [...direct, ...nested];
  }

  return (
    <div className="mt-4 pt-4 border-t border-white/5">
      <form onSubmit={handleSubmit} className="mb-4">
        {!username.trim() && (
          <input
            type="text"
            placeholder="Your name..."
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            className="w-full mb-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition"
          />
        )}
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5 shadow-sm">
            {(username.trim() || localName.trim() || 'A').charAt(0).toUpperCase()}
          </div>
          <input
            type="text"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition"
          />
          <button
            type="submit"
            disabled={posting || !newComment.trim()}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white font-semibold text-sm rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-orange-500/20"
          >
            Post
          </button>
        </div>
      </form>

      {topLevel.length === 0 ? (
        <p className="text-sm text-white/30 ml-10">No comments yet.</p>
      ) : (
        topLevel.map((comment) => {
          const allReplies = getDescendants(comment.id);
          return (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={allReplies}
              username={username}
              localName={localName}
              onReply={loadComments}
            />
          );
        })
      )}
    </div>
  );
}
