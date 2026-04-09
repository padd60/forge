import type { ReactNode } from 'react';

export interface ButtonProps {
  readonly children: ReactNode;
  readonly onClick?: () => void;
  readonly type?: 'button' | 'submit';
}

export function Button({ children, onClick, type = 'button' }: ButtonProps) {
  return (
    <button type={type} onClick={onClick} style={{ padding: '8px 16px' }}>
      {children}
    </button>
  );
}
