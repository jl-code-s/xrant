export default function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 w-full max-w-sm mx-4 shadow-2xl relative">
        <button type="button" onClick={onCancel} className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition cursor-pointer text-sm">✕</button>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-white/60 mb-5">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-white/50 hover:text-white/70 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 bg-red-500 hover:bg-red-400 text-white font-semibold text-sm rounded-xl transition cursor-pointer shadow-lg shadow-red-500/20"
          >
            {confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
