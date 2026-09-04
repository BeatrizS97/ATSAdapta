function DownloadModal({ rotulo }) {
  if (!rotulo) return null;

  return (
    <div className="modal-overlay" role="alertdialog" aria-modal="true" aria-live="assertive">
      <div className="modal-download">
        <div className="modal-download-spinner" />
        <p className="modal-download-titulo">Preparando {rotulo}...</p>
        <p className="modal-download-texto">
          Aguarde este download terminar para poder baixar em outro formato.
        </p>
      </div>
    </div>
  );
}

export default DownloadModal;