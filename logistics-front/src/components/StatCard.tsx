interface StatCardProps {
  label: string;
  value: string;
  subtitle: string;
  icon: string;
  iconColor: 'success' | 'info' | 'purple';
}

const iconColorClasses = {
  success: 'text-accent-success',
  info: 'text-accent-info',
  purple: 'text-accent-purple',
};

const subtitleColorClasses = {
  success: 'text-accent-success',
  info: 'text-text-muted',
  purple: 'text-text-muted',
};

export const StatCard = ({ label, value, subtitle, icon, iconColor }: StatCardProps) => {
  return (
    <div className="flex flex-col gap-2 rounded-xl p-5 border border-border-light bg-card-light shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-text-muted text-sm font-medium uppercase tracking-wide">{label}</p>
        <span className={`material-symbols-outlined ${iconColorClasses[iconColor]}`} style={{ fontSize: '20px' }}>
          {icon}
        </span>
      </div>
      <div className="flex items-end gap-3">
        <p className="text-text-dark tracking-tight text-2xl font-bold leading-none">{value}</p>
        <p className={`${subtitleColorClasses[iconColor]} text-sm font-medium mb-0.5`}>{subtitle}</p>
      </div>
    </div>
  );
};
