interface ErrorAlertProps {
  message: string;
  onClose?: () => void;
}

export const ErrorAlert = ({ message, onClose }: ErrorAlertProps) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-red-600">error</span>
        <span className="text-red-800 text-sm">{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-red-600 hover:text-red-800 transition-colors"
          aria-label="Cerrar alerta"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      )}
    </div>
  );
};
