import React from 'react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { MessageSquare, Settings, Home, X } from 'lucide-react';
import { Button } from '../Common/Button';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

const navItems = [
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose, className }) => {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-background transition-transform duration-300 lg:relative lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        {/* Close button (mobile) */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
          <span className="font-semibold">Menu</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4" role="navigation" aria-label="Main navigation">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
              onClick={onClose}
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer link */}
        <div className="border-t border-border px-2 py-4">
          <NavLink
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            Home
          </NavLink>
        </div>
      </aside>
    </>
  );
};
