function ToastContainer({ toasts, onFechar }) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.tipo || "erro"}`}>
          <span>{toast.mensagem}</span>
          <button
            type="button"
            className="toast-fechar"
            onClick={() => onFechar(toast.id)}
            aria-label="Fechar aviso"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;