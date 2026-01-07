interface SidebarProps {
  className?: string;
}

export const Sidebar = ({ className = '' }: SidebarProps) => {
  return (
    <div className={`hidden lg:flex flex-col w-[280px] h-full border-r border-border-light bg-card-light flex-shrink-0 ${className}`}>
      <div className="p-6 flex flex-col h-full justify-between">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <div className="flex gap-3 items-center">
            <div className="bg-primary/10 flex items-center justify-center size-10 rounded-full shrink-0">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>
                local_shipping
              </span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-text-dark text-lg font-bold leading-tight">Logistics Pro</h1>
              <p className="text-text-muted text-xs font-medium uppercase tracking-wider">Optimizer v2.4</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2">
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-border-light transition-colors group" href="#">
              <span className="material-symbols-outlined text-text-muted group-hover:text-primary" style={{ fontSize: '24px' }}>
                dashboard
              </span>
              <p className="text-text-muted group-hover:text-text-dark text-sm font-medium leading-normal">Dashboard</p>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/20" href="#">
              <span className="material-symbols-outlined text-primary fill-1" style={{ fontSize: '24px' }}>
                package_2
              </span>
              <p className="text-primary text-sm font-bold leading-normal">New Shipment</p>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-border-light transition-colors group" href="#">
              <span className="material-symbols-outlined text-text-muted group-hover:text-primary" style={{ fontSize: '24px' }}>
                local_shipping
              </span>
              <p className="text-text-muted group-hover:text-text-dark text-sm font-medium leading-normal">Carriers</p>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-border-light transition-colors group" href="#">
              <span className="material-symbols-outlined text-text-muted group-hover:text-primary" style={{ fontSize: '24px' }}>
                receipt_long
              </span>
              <p className="text-text-muted group-hover:text-text-dark text-sm font-medium leading-normal">Invoices</p>
            </a>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-2">
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-border-light transition-colors group" href="#">
            <span className="material-symbols-outlined text-text-muted group-hover:text-primary" style={{ fontSize: '24px' }}>
              settings
            </span>
            <p className="text-text-muted group-hover:text-text-dark text-sm font-medium leading-normal">Settings</p>
          </a>
          <div className="mt-4 pt-4 border-t border-border-light flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">person</span>
            </div>
            <div className="flex flex-col">
              <p className="text-text-dark text-sm font-medium">Alex Morgan</p>
              <p className="text-text-muted text-xs">alex@company.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
