// StatusIndicator component for displaying system/provider status

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'degraded';
}

const statusConfig = {
  online: {
    icon: '🟢',
    label: 'En Línea',
    bgColor: 'bg-green-500',
    textColor: 'text-green-700',
  },
  offline: {
    icon: '🔴',
    label: 'Fuera de Línea',
    bgColor: 'bg-red-500',
    textColor: 'text-red-700',
  },
  degraded: {
    icon: '⚠️',
    label: 'Degradado',
    bgColor: 'bg-yellow-500',
    textColor: 'text-yellow-700',
  },
};

export function StatusIndicator({ status }: StatusIndicatorProps) {
  const config = statusConfig[status];

  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-lg">{config.icon}</span>
      <span className={`font-medium ${config.textColor}`}>{config.label}</span>
    </div>
  );
}
