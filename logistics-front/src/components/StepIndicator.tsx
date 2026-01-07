interface StepIndicatorProps {
  stepNumber: number;
  currentStep: number;
  label: string;
}

export const StepIndicator = ({ stepNumber, currentStep, label }: StepIndicatorProps) => {
  const isActive = currentStep === stepNumber;
  const isCompleted = currentStep > stepNumber;
  
  return (
    <div className="flex items-center gap-4 mb-4">
      <div 
        className={`step-indicator ${
          isActive ? 'active' : isCompleted ? 'completed' : 'inactive'
        }`}
      >
        {isCompleted ? (
          <span className="material-symbols-outlined text-sm">check</span>
        ) : (
          stepNumber
        )}
      </div>
      <h3 
        className={`text-xl font-bold ${
          isActive ? 'text-text-dark' : 'text-text-muted'
        }`}
      >
        {label}
      </h3>
    </div>
  );
};
