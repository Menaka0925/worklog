import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, type, onClick, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const isDateTime = type === 'date' || type === 'time';

    const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
      if (isDateTime) {
        try {
          e.currentTarget.showPicker();
        } catch {
          // Fallback if browser showPicker is not supported
        }
      }
      onClick?.(e);
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-[#252B27] mb-1.5"
          >
            {label}
            {props.required && <span className="text-rose-600 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative rounded-lg shadow-xs">
          {leftIcon && (
            <div
              onClick={(e) => {
                const input = e.currentTarget.parentElement?.querySelector('input');
                try {
                  input?.showPicker();
                } catch {
                  input?.focus();
                }
              }}
              className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#737C74] cursor-pointer z-10"
            >
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={type}
            onClick={handleClick}
            className={`block w-full rounded-lg border text-sm transition-colors
              ${leftIcon ? 'pl-9' : 'pl-3.5'}
              ${rightIcon ? 'pr-9' : 'pr-3.5'}
              py-2 bg-white text-[#252B27] placeholder:text-[#737C74]/60
              ${
                isDateTime
                  ? 'cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:w-0 [&::-webkit-calendar-picker-indicator]:h-0 [&::-webkit-calendar-picker-indicator]:pointer-events-none'
                  : ''
              }
              ${
                error
                  ? 'border-rose-400 focus:border-rose-600 focus:ring-1 focus:ring-rose-600'
                  : 'border-[#E5E9E3] focus:border-forest-600 focus:ring-1 focus:ring-forest-600'
              }
              disabled:bg-[#F7F8F5] disabled:text-[#737C74]/50 disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#737C74]">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-[#737C74]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
