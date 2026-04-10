import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

interface CardTitleProps {
  className?: string;
  children: React.ReactNode;
}

interface CardDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

interface CardContentProps {
  className?: string;
  children: React.ReactNode;
}

interface CardFooterProps {
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className, children }) => (
  <div
    className={clsx(
      'rounded-lg border border-border bg-card text-card-foreground shadow-sm',
      className
    )}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<CardHeaderProps> = ({ className, children }) => (
  <div className={clsx('flex flex-col space-y-1.5 p-6', className)}>{children}</div>
);

export const CardTitle: React.FC<CardTitleProps> = ({ className, children }) => (
  <h3 className={clsx('text-2xl font-semibold leading-none tracking-tight', className)}>
    {children}
  </h3>
);

export const CardDescription: React.FC<CardDescriptionProps> = ({ className, children }) => (
  <p className={clsx('text-sm text-muted-foreground', className)}>{children}</p>
);

export const CardContent: React.FC<CardContentProps> = ({ className, children }) => (
  <div className={clsx('p-6 pt-0', className)}>{children}</div>
);

export const CardFooter: React.FC<CardFooterProps> = ({ className, children }) => (
  <div className={clsx('flex items-center p-6 pt-0', className)}>{children}</div>
);
