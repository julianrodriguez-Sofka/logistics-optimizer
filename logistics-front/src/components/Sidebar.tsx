/**
 * Sidebar Component - Modern Professional Design
 * Clean, elegant navigation with glassmorphism effects
 */

import { ProviderStatusWidget } from './ProviderStatusWidget';

interface SidebarProps {
  className?: string;
  onNavigate?: (view: 'quotes' | 'create-shipment' | 'warehouse') => void;
  currentView?: 'quotes' | 'create-shipment' | 'warehouse';
}

export const Sidebar = ({ className = '', onNavigate, currentView = 'quotes' }: SidebarProps) => {
  const handleNavigation = (view: 'quotes' | 'create-shipment' | 'warehouse') => {
    if (onNavigate) {
      onNavigate(view);
    }
  };

  const navItems = [
    { 
      id: 'quotes' as const, 
      icon: 'package_2', 
      label: 'Cotizaciones',
      description: 'Comparar tarifas'
    },
    { 
      id: 'create-shipment' as const, 
      icon: 'add_box', 
      label: 'Crear Envío',
      description: 'Nuevo pedido'
    },
    { 
      id: 'warehouse' as const, 
      icon: 'warehouse', 
      label: 'Almacén',
      description: 'Gestión de pedidos'
    },
  ];

  const secondaryItems = [
    { icon: 'local_shipping', label: 'Transportistas', href: '#' },
    { icon: 'receipt_long', label: 'Facturas', href: '#' },
    { icon: 'analytics', label: 'Analíticas', href: '#' },
  ];

  return (
    <aside className={`hidden lg:flex flex-col w-[280px] h-full bg-white border-r border-slate-200/80 flex-shrink-0 ${className}`}>
      <div className="flex flex-col h-full">
        {/* Header with Logo */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25">
                <span className="material-symbols-outlined text-white" style={{ fontSize: '22px' }}>
                  rocket_launch
                </span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Logistics<span className="text-secondary">Pro</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">Enterprise Edition</p>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 px-4 py-6 overflow-y-auto">
          <div className="space-y-1.5">
            <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Principal
            </p>
            
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-primary/10 to-secondary/5 text-primary'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary to-secondary rounded-r-full" />
                  )}
                  
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    isActive 
                      ? 'bg-gradient-to-br from-primary to-secondary shadow-md shadow-primary/20' 
                      : 'bg-slate-100 group-hover:bg-slate-200'
                  }`}>
                    <span 
                      className={`material-symbols-outlined ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}`}
                      style={{ fontSize: '20px' }}
                    >
                      {item.icon}
                    </span>
                  </div>
                  
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-semibold ${isActive ? 'text-primary' : 'text-slate-700'}`}>
                      {item.label}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {item.description}
                    </p>
                  </div>

                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Secondary Navigation */}
          <div className="mt-8 space-y-1">
            <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Herramientas
            </p>
            
            {secondaryItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all group"
              >
                <span 
                  className="material-symbols-outlined text-slate-400 group-hover:text-slate-600" 
                  style={{ fontSize: '20px' }}
                >
                  {item.icon}
                </span>
                <span className="text-sm font-medium">{item.label}</span>
              </a>
            ))}
          </div>

          {/* Provider Status Widget */}
          <div className="mt-6">
            <ProviderStatusWidget />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          {/* Settings */}
          <a 
            href="#" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm transition-all group mb-3"
          >
            <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-600" style={{ fontSize: '20px' }}>
              settings
            </span>
            <span className="text-sm font-medium">Configuración</span>
          </a>

          {/* User Profile */}
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white border border-slate-200/80 shadow-sm">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                AM
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">Alex Morgan</p>
              <p className="text-xs text-slate-500 truncate">alex@company.com</p>
            </div>
            <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>
                expand_more
              </span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
