import React from 'react';
import { clsx } from 'clsx';

type LoaderSize = 'sm' | 'md' | 'lg' | 'xl';

interface LoaderProps {
  size?: LoaderSize;
  className?: string;
  label?: string;
  fullScreen?: boolean;
}

const sizeClasses: Record<LoaderSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
  xl: 'h-16 w-16 border-4',
};

export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  className,
  label = 'Loading...',
  fullScreen = false,
}) => {
  const spinner = (
    <div className={clsx('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={clsx(
          'animate-spin rounded-full border-primary border-t-transparent',
          sizeClasses[size]
        )}
        role="status"
        aria-label={label}
      />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

// Typing indicator for chat
export const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-1 px-4 py-2">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="h-2 w-2 rounded-full bg-muted-foreground animate-typing"
        style={{ animationDelay: `${i * 0.2}s` }}
      />
    ))}
  </div>
);
