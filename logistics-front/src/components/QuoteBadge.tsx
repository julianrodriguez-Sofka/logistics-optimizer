// QuoteBadge component for displaying cheapest/fastest badges

interface QuoteBadgeProps {
  type: 'cheapest' | 'fastest';
  visible: boolean;
}

const badgeConfig = {
  cheapest: {
    icon: '$',
    label: 'Más Barata',
    ariaLabel: 'Opción más barata',
    bgColor: 'bg-green-500',
  },
  fastest: {
    icon: '⚡',
    label: 'Más Rápida',
    ariaLabel: 'Opción más rápida',
    bgColor: 'bg-blue-500',
  },
};

export function QuoteBadge({ type, visible }: QuoteBadgeProps) {
  if (!visible) return null;

  const config = badgeConfig[type];

  return (
    <div
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm font-semibold ${config.bgColor}`}
      aria-label={config.ariaLabel}
    >
      <span className="text-base">{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
}
