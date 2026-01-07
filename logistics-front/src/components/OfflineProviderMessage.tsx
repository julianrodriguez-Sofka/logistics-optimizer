// OfflineProviderMessage component for displaying offline provider warnings

interface OfflineProviderMessageProps {
  providerName: string;
  message: string;
}

export function OfflineProviderMessage({ providerName, message }: OfflineProviderMessageProps) {
  return (
    <div
      className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-300 rounded-lg text-yellow-800"
      role="alert"
    >
      <span className="text-xl flex-shrink-0">⚠️</span>
      <div className="flex-1">
        <p className="font-semibold">{providerName}</p>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}
