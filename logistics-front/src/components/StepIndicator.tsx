interface Step {
  label: string;
  completed: boolean;
  active: boolean;
}

interface StepIndicatorProps {
  stepNumber?: number;
  currentStep?: number;
  label?: string;
  steps?: Step[];
}

export const StepIndicator = ({ stepNumber, currentStep, label, steps }: StepIndicatorProps) => {
  // If steps array is provided, render horizontal progress bar
  if (steps) {
    return (
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  step.active
                    ? 'bg-primary text-white shadow-lg'
                    : step.completed
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step.completed ? (
                  <span className="material-symbols-outlined text-sm">check</span>
                ) : (
                  index + 1
                )}
              </div>
              <span 
                className={`text-xs mt-2 font-medium ${
                  step.active ? 'text-primary' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div 
                className={`h-1 flex-1 mx-2 ${
                  step.completed ? 'bg-green-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  // Original single step indicator
  const isActive = currentStep === stepNumber;
  const isCompleted = currentStep !== undefined && stepNumber !== undefined && currentStep > stepNumber;
  
  return (
    <div className="flex items-center gap-4 mb-4">
      <div 
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
          isActive ? 'bg-primary text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
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
