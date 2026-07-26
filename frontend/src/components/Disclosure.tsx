import type { ReactNode } from 'react';

interface Props {
  label: string;
  open: boolean;
  onToggle: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}

export default function Disclosure({ label, open, onToggle, children, className }: Props) {
  return (
    <div className={`disclosure${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        className="disclosure-toggle"
        aria-expanded={open}
        onClick={() => onToggle(!open)}
      >
        <span className={`disclosure-chevron${open ? ' open' : ''}`} aria-hidden="true">
          ▾
        </span>
        {label}
      </button>

      {open && <div className="disclosure-content">{children}</div>}
    </div>
  );
}
