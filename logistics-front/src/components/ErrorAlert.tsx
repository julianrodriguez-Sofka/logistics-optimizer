interface ErrorAlertProps {
  message: string;
}

export const ErrorAlert = ({ message }: ErrorAlertProps) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
      <span className="material-symbols-outlined text-red-600">error</span>
      <span className="text-red-800 text-sm">{message}</span>
    </div>
  );
};
