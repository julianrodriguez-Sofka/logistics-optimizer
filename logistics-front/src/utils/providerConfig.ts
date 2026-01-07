/**
 * @file providerConfig.ts
 * @description Consolidated provider configuration
 * Simple constant-based approach for academic project
 * Replaces ProviderRegistry + ProviderConfigHelper (removed over-engineering)
 */

import type { ReactNode } from 'react';

export interface ProviderConfig {
  id: string;
  name: string;
  logoUrl?: string;
  logoAlt: string;
  color: string;
  isCustomLogo?: boolean;
  customLogoRender?: () => ReactNode;
}

/**
 * Provider configuration map
 * Add new providers here - no need for separate classes
 */
export const PROVIDERS: Record<string, ProviderConfig> = {
  dhl: {
    id: 'dhl',
    name: 'DHL',
    logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQB82sGJRkCPxGE42o_z3KQKXYjsmp4b9yQVQ&s',
    logoAlt: 'DHL Logo',
    color: 'bg-yellow-400',
    isCustomLogo: false,
  },
  fedex: {
    id: 'fedex',
    name: 'FedEx',
    logoUrl: 'https://logos-world.net/wp-content/uploads/2020/04/FedEx-Logo.png',
    logoAlt: 'FedEx Logo',
    color: 'bg-blue-800',
    isCustomLogo: false,
  },
  interrapidismo: {
    id: 'interrapidismo',
    name: 'Inter Rapidisimo',
    logoUrl: 'https://www.lideresvisioncolombia.com.co/wp-content/uploads/2021/06/Logo-Inter-Rapidisimo-Vv-400x431-1.png',
    logoAlt: 'Inter Rapidisimo Logo',
    color: 'bg-gray-400',
    isCustomLogo: true,
  },
  local: {
    id: 'local',
    name: 'Local',
    logoAlt: 'Local Provider',
    color: 'bg-text-dark',
    isCustomLogo: true,
  },
};

/**
 * Default config for unknown providers
 */
const DEFAULT_PROVIDER: ProviderConfig = {
  id: 'unknown',
  name: 'Unknown Provider',
  logoAlt: 'Unknown Provider',
  color: 'bg-gray-400',
  isCustomLogo: false,
};

/**
 * Find provider by ID (case-insensitive, with partial match fallback)
 */
export function findProvider(providerId: string): ProviderConfig {
  const lowerProviderId = providerId.toLowerCase();

  // Exact match
  if (PROVIDERS[lowerProviderId]) {
    return PROVIDERS[lowerProviderId];
  }

  // Partial match (contains)
  for (const config of Object.values(PROVIDERS)) {
    if (lowerProviderId.includes(config.id) || config.id.includes(lowerProviderId)) {
      return config;
    }
  }

  // Default fallback
  return DEFAULT_PROVIDER;
}

/**
 * Get provider color CSS class
 */
export function getProviderColor(providerId: string): string {
  return findProvider(providerId).color;
}

/**
 * Get provider logo URL
 */
export function getProviderLogo(providerId: string): string | undefined {
  return findProvider(providerId).logoUrl;
}

/**
 * Get provider display name
 */
export function getProviderName(providerId: string): string {
  return findProvider(providerId).name;
}

/**
 * Get all registered providers
 */
export function getAllProviders(): ProviderConfig[] {
  return Object.values(PROVIDERS);
}
