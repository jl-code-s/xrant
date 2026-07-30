import { useState } from 'react';

export default function ReportButton({ rantId, username }) {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [reported, setReported] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const name = username.trim() || 'Anonymous';
    setSending(true);
    try {
      const res = await fetch(`/api/rants/${rantId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, reason: reason.trim() || null }),
      });
      if (res.status === 409) { setReported(true); setShowModal(false); return; }
      if (!res.ok) return;
      setReported(true);
      setShowModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={reported}
        className={`text-sm transition cursor-pointer ml-auto ${reported ? 'text-orange-400/50' : 'text-white/30 hover:text-red-400'}`}
        title="Report"
      >
        {reported ? 'Reported' : 'Report'}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 w-full max-w-md mx-4 shadow-2xl relative">
            <button type="button" onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition cursor-pointer text-sm">✕</button>
            <h3 className="text-lg font-semibold text-white mb-4">Report this rant</h3>
            <form onSubmit={handleSubmit}>
              <textarea
                placeholder="Why are you reporting this? (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition mb-4"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-white/50 hover:text-white/70 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white font-semibold text-sm rounded-xl transition disabled:opacity-30 cursor-pointer shadow-lg shadow-orange-500/20"
                >
                  {sending ? 'Sending...' : 'Submit report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
