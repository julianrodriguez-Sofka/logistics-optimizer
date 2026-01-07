interface PageHeaderProps {
  title: string;
  description: string;
  onHistoryClick?: () => void;
}

export const PageHeader = ({ title, description }: PageHeaderProps) => {
  return (
    <header className="w-full px-6 py-8 md:px-12 flex flex-col gap-2">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="flex min-w-72 flex-col gap-2">
          <h2 className="text-text-dark text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
            {title}
          </h2>
          <p className="text-text-muted text-base font-normal leading-normal">
            {description}
          </p>
        </div>

      </div>
    </header>
  );
};
