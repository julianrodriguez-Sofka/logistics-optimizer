import { StatCard } from './StatCard';

export const StatsSection = () => {
  return (
    <section className="w-full px-6 md:px-12 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Unified API Status"
          value="Online"
          subtitle="99.9% Uptime"
          icon="check_circle"
          iconColor="success"
        />
        <StatCard
          label="Active Adapters"
          value="3/3"
          subtitle="FedEx, DHL, Local"
          icon="hub"
          iconColor="info"
        />
        <StatCard
          label="Avg. Response Time"
          value="120ms"
          subtitle="Optimized"
          icon="speed"
          iconColor="purple"
        />
      </div>
    </section>
  );
};
