
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', color = 'blue-500', text }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center my-4">
      <div
        className={`animate-spin rounded-full border-t-2 border-b-2 ${sizeClasses[size]} border-${color}`}
      ></div>
      {text && <p className={`mt-2 text-lg text-${color}`}>{text}</p>}
    </div>
  );
};

export default LoadingSpinner;