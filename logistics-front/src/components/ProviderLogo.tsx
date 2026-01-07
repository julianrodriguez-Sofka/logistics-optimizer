import { findProvider } from '../utils/providerConfig';

interface ProviderLogoProps {
  providerId: string;
  className?: string;
}

/**
 * Generic provider logo renderer
 * Uses providerConfig constants - simplified for academic project
 * Add new providers in providerConfig.ts
 */
export const ProviderLogo = ({ providerId, className = '' }: ProviderLogoProps) => {
  const config = findProvider(providerId);

  const defaultClassName = 'size-16 rounded-lg bg-white p-2 flex items-center justify-center flex-shrink-0 border border-border-light';

  // Custom renderers for specific providers
  if (config.id === 'local') {
    return (
      <div className={className || 'size-16 rounded-lg bg-background-light p-2 flex items-center justify-center flex-shrink-0 border border-border-light'}>
        <div className="w-full h-full bg-text-dark rounded-md flex items-center justify-center">
          <span className="text-white font-black italic tracking-tighter">GO</span>
        </div>
      </div>
    );
  }

  if (config.logoUrl) {
    return (
      <div className={className || defaultClassName}>
        <img
          src={config.logoUrl}
          alt={config.logoAlt}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  // Fallback
  return (
    <div className={className || 'size-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0'}>
      <span className="material-symbols-outlined text-primary" style={{ fontSize: '32px' }}>
        local_shipping
      </span>
    </div>
  );
};
