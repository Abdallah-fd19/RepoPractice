import React, { forwardRef } from 'react';

const Input = forwardRef(({
  type = 'text',
  label,
  error,
  helperText,
  icon,
  iconPosition = 'left',
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const baseInputClass = 'input-field';
  const inputClass = `${baseInputClass} ${error ? 'input-error' : ''} ${icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : ''} ${className}`;
  
  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-[var(--color-text-muted)] w-5 h-5">
              {icon}
            </div>
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={inputClass}
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="text-[var(--color-text-muted)] w-5 h-5">
              {icon}
            </div>
          </div>
        )}
      </div>
      {(error || helperText) && (
        <p className={`text-xs ${error ? 'text-[var(--color-error-text)]' : 'text-[var(--color-text-muted)]'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
