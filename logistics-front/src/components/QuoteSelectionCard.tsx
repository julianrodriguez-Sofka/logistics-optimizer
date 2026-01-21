import React from 'react';
import { IQuote } from '../models/Quote';
import { QuoteBadge } from './QuoteBadge';
import { ProviderLogo } from './ProviderLogo';

interface QuoteSelectionCardProps {
  quote: IQuote;
  isSelected: boolean;
  onSelect: () => void;
}

const QuoteSelectionCard: React.FC<QuoteSelectionCardProps> = ({
  quote,
  isSelected,
  onSelect,
}) => {
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + quote.estimatedDays);

  return (
    <div
      onClick={onSelect}
      className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-lg'
          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
      }`}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4">
          <div className="bg-blue-600 text-white rounded-full p-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <ProviderLogo
            providerName={quote.providerName}
            size="md"
            className="flex-shrink-0"
          />
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              {quote.providerName}
            </h3>
            <p className="text-sm text-gray-600">{quote.service}</p>
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="mb-4">
        <p className="text-3xl font-bold text-gray-900">
          ${quote.price.toLocaleString('es-CO')}
        </p>
        <p className="text-sm text-gray-500">
          {quote.distance.toFixed(0)} km • {quote.category}
        </p>
      </div>

      {/* Delivery Time */}
      <div className="flex items-center gap-2 mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-sm text-gray-700">
          <strong>{quote.estimatedDays} días</strong> • Llegada estimada:{' '}
          {estimatedDate.toLocaleDateString('es-CO', {
            day: 'numeric',
            month: 'short',
          })}
        </span>
      </div>

      {/* Badges */}
      {quote.badges && quote.badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quote.badges.map((badgeType) => (
            <QuoteBadge key={badgeType} type={badgeType as 'cheapest' | 'fastest'} visible={true} />
          ))}
        </div>
      )}

      {/* Radio button (hidden but for accessibility) */}
      <input
        type="radio"
        name="selectedQuote"
        checked={isSelected}
        onChange={onSelect}
        className="sr-only"
        aria-label={`Seleccionar cotización de ${quote.providerName}`}
      />
    </div>
  );
};

export default QuoteSelectionCard;
