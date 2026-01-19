import { findProvider } from '../utils/providerConfig';

interface ProviderLogoProps {
  providerId?: string;
  providerName?: string; // Alternative prop for finding by name
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Generic provider logo renderer
 * Uses providerConfig constants - simplified for academic project
 * Add new providers in providerConfig.ts
 */
export const ProviderLogo = ({ providerId, providerName, className = '', size = 'md' }: ProviderLogoProps) => {
  // Find by providerId or providerName (providerName is case-insensitive)
  const config = findProvider(providerId || providerName?.toLowerCase().replace(/\s+/g, '') || '');

  // Size classes
  const sizeClasses = {
    sm: 'size-10',
    md: 'size-16',
    lg: 'size-20',
  };

  const sizeClass = sizeClasses[size];
  const defaultClassName = `${sizeClass} rounded-lg bg-white p-2 flex items-center justify-center flex-shrink-0 border border-border-light`;

  // Custom renderers for specific providers
  if (config.id === 'local') {
    return (
      <div className={className || `${sizeClass} rounded-lg bg-background-light p-2 flex items-center justify-center flex-shrink-0 border border-border-light`}>
        <div className="w-full h-full bg-text-dark rounded-md flex items-center justify-center">
          <span className={`text-white font-black italic tracking-tighter ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm'}`}>GO</span>
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
    <div className={className || `${sizeClass} rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0`}>
      <span className="material-symbols-outlined text-primary" style={{ fontSize: size === 'sm' ? '20px' : size === 'lg' ? '40px' : '32px' }}>
        local_shipping
      </span>
    </div>
  );
};
