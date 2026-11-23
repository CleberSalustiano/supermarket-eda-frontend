import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '../cn';
import { KeyCap } from './key-cap';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'quiet';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shortcut?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary border border-transparent',
  secondary: 'bg-paper text-ink border border-edge',
  danger: 'bg-danger text-on-danger border border-stop',
  quiet: 'bg-transparent text-ink border border-transparent hover:underline'
};

const sizeClasses: Record<ButtonSize, string> = {
  md: 'h-11 px-4 text-body',
  lg: 'h-14 px-6 text-body-lg'
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', shortcut, className, type = 'button', children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-3 rounded-control font-bold',
        'disabled:cursor-not-allowed disabled:opacity-40',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...rest}
    >
      {children}
      {shortcut === undefined ? null : <KeyCap className="border-current">{shortcut}</KeyCap>}
    </button>
  );
});
