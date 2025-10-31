import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <input
        className={`input-field ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  );
};
