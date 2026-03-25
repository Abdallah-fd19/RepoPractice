import React from 'react';

const Card = ({
  children,
  className = '',
  shadow = true,
  padding = 'default',
  ...props
}) => {
  const baseClass = 'bg-[var(--color-card)] rounded-xl border border-[var(--color-border-light)]';
  const shadowClass = shadow ? 'card-shadow' : '';
  
  const paddings = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8'
  };
  
  const cardClass = `${baseClass} ${shadowClass} ${paddings[padding]} ${className}`;
  
  return (
    <div className={cardClass} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={`mb-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h2 className={`text-2xl font-bold text-[var(--color-text)] ${className}`} {...props}>
      {children}
    </h2>
  );
};

const CardDescription = ({ children, className = '', ...props }) => {
  return (
    <p className={`text-[var(--color-text-secondary)] mt-2 ${className}`} {...props}>
      {children}
    </p>
  );
};

const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div className={`mt-6 pt-6 border-t border-[var(--color-border)] ${className}`} {...props}>
      {children}
    </div>
  );
};

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
