import { useState, useEffect } from 'react';
import { formatDate } from '../formatDate';
import ConfirmModal from './ConfirmModal';

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition cursor-pointer ${active ? 'bg-orange-500/20 text-orange-400' : 'text-white/40 hover:text-white/70'}`}
    >
      {label}
    </button>
  );
}

export default function AdminPage({ onBack }) {
  const [tab, setTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [rants, setRants] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    setLoading(true);
    const path = tab === 'reports' ? '/api/admin/reports' : tab === 'rants' ? '/api/admin/rants' : '/api/admin/comments';
    fetch(path)
      .then(async (r) => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then((data) => {
        if (tab === 'reports') setReports(data);
        else if (tab === 'rants') setRants(data);
        else setComments(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tab]);

  function reloadTab() {
    setLoading(true);
    const path = tab === 'reports' ? '/api/admin/reports' : tab === 'rants' ? '/api/admin/rants' : '/api/admin/comments';
    fetch(path)
      .then(async (r) => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then((data) => {
        if (tab === 'reports') setReports(data);
        else if (tab === 'rants') setRants(data);
        else setComments(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  async function deleteRant(id) {
    await fetch(`/api/rants/${id}`, { method: 'DELETE' });
    reloadTab();
  }

  async function archiveRant(id, archived) {
    await fetch(`/api/admin/rants/${id}/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived }),
    });
    reloadTab();
  }

  async function archiveComment(id, archived) {
    await fetch(`/api/admin/comments/${id}/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived }),
    });
    reloadTab();
  }

  async function deleteComment(id) {
    await fetch(`/api/admin/comments/${id}`, { method: 'DELETE' });
    reloadTab();
  }

  function askConfirm(action) {
    setConfirm({ ...action, onConfirm: () => { action.onConfirm(); setConfirm(null); } });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 font-sans">
      <header className="border-b border-white/10 backdrop-blur-xl bg-slate-900/70 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <button onClick={onBack} className="text-sm text-white/40 hover:text-white/70 transition cursor-pointer">Back to site</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          <Tab label={`Reports (${reports.length})`} active={tab === 'reports'} onClick={() => setTab('reports')} />
          <Tab label={`Rants (${rants.length})`} active={tab === 'rants'} onClick={() => setTab('rants')} />
          <Tab label={`Comments (${comments.length})`} active={tab === 'comments'} onClick={() => setTab('comments')} />
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'reports' ? (
          <div className="space-y-3">
            {reports.length === 0 && <p className="text-white/30 text-sm text-center py-8">No reports</p>}
            {reports.map((r) => (
              <div key={r.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {r.rant_id ? (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-white/30 font-medium uppercase tracking-wider">Rant</span>
                          <span className="text-xs text-white/30">by</span>
                          <span className="text-sm font-semibold text-white">{r.rant_username}</span>
                          <span className="text-xs text-white/30">{formatDate(r.rant_created)}</span>
                        </div>
                        <p className="text-sm text-white/70 mb-2">{r.rant_content}</p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-white/30 font-medium uppercase tracking-wider">Comment</span>
                          <span className="text-xs text-white/30">by</span>
                          <span className="text-sm font-semibold text-white">{r.comment_username}</span>
                          <span className="text-xs text-white/30">{formatDate(r.created_at)}</span>
                        </div>
                        <p className="text-sm text-white/70 mb-2">{r.comment_content}</p>
                      </>
                    )}
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      <p className="text-xs text-red-400 font-medium">Reported by {r.username}</p>
                      {r.reason && <p className="text-xs text-white/50 mt-0.5">"{r.reason}"</p>}
                      <p className="text-xs text-white/30 mt-0.5">{formatDate(r.created_at)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => askConfirm({
                      title: r.rant_id ? 'Delete rant' : 'Delete comment',
                      message: r.rant_id ? 'This will permanently delete this rant and all its comments.' : 'This will permanently delete this comment.',
                      confirmLabel: 'Delete',
                      onConfirm: () => r.rant_id ? deleteRant(r.rant_id) : deleteComment(r.comment_id),
                    })}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs font-medium rounded-lg transition cursor-pointer shrink-0"
                  >
                    Delete {r.rant_id ? 'rant' : 'comment'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : tab === 'rants' ? (
          <div className="space-y-3">
            {rants.length === 0 && <p className="text-white/30 text-sm text-center py-8">No rants</p>}
            {rants.map((r) => (
              <div key={r.id} className={`rounded-xl border p-4 flex items-start justify-between gap-4 ${r.archived ? 'bg-white/3 border-white/5 opacity-50' : 'bg-white/5 border-white/10'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">{r.username}</span>
                    <span className="text-xs text-white/30">{formatDate(r.created_at)}</span>
                    <span className="text-xs text-white/20">({r.comment_count} comments)</span>
                    {r.archived && <span className="text-xs text-yellow-400/60 font-medium">Archived</span>}
                  </div>
                  <p className="text-sm text-white/70">{r.content}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => askConfirm({ title: r.archived ? 'Unarchive rant' : 'Archive rant', message: r.archived ? 'Make this rant visible to the public again?' : 'Hide this rant from the public?', confirmLabel: r.archived ? 'Unarchive' : 'Archive', onConfirm: () => archiveRant(r.id, !r.archived) })}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${r.archived ? 'bg-green-500/20 hover:bg-green-500/40 text-green-400' : 'bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400'}`}
                  >
                    {r.archived ? 'Unarchive' : 'Archive'}
                  </button>
                  <button
                    onClick={() => askConfirm({ title: 'Delete rant', message: 'This will permanently delete this rant and all its comments.', confirmLabel: 'Delete', onConfirm: () => deleteRant(r.id) })}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs font-medium rounded-lg transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {comments.length === 0 && <p className="text-white/30 text-sm text-center py-8">No comments</p>}
            {comments.map((c) => (
              <div key={c.id} className={`rounded-xl border p-4 flex items-start justify-between gap-4 ${c.archived ? 'bg-white/3 border-white/5 opacity-50' : 'bg-white/5 border-white/10'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-white">{c.username}</span>
                    <span className="text-xs text-white/30">{formatDate(c.created_at)}</span>
                    {c.archived && <span className="text-xs text-yellow-400/60 font-medium">Archived</span>}
                  </div>
                  <p className="text-sm text-white/70 mb-2">{c.content}</p>
                  <div className="bg-white/5 rounded-lg px-3 py-1.5 border border-white/5">
                    <p className="text-xs text-white/40">
                      On rant by <span className="text-white/60 font-medium">{c.rant_username}</span>: "{c.rant_content}"
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => askConfirm({
                      title: c.archived ? 'Unarchive comment' : 'Archive comment',
                      message: c.archived ? 'Make this comment visible to the public again?' : 'Hide this comment from the public?',
                      confirmLabel: c.archived ? 'Unarchive' : 'Archive',
                      onConfirm: () => archiveComment(c.id, !c.archived),
                    })}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${c.archived ? 'bg-green-500/20 hover:bg-green-500/40 text-green-400' : 'bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400'}`}
                  >
                    {c.archived ? 'Unarchive' : 'Archive'}
                  </button>
                  <button
                    onClick={() => askConfirm({ title: 'Delete comment', message: 'This will permanently delete this comment.', confirmLabel: 'Delete', onConfirm: () => deleteComment(c.id) })}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs font-medium rounded-lg transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
