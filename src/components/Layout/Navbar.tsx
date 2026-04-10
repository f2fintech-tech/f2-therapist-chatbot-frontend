import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { Sun, Moon, LogOut, Settings, User, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { Avatar } from '../Common/Avatar';
import { Button } from '../Common/Button';

interface NavbarProps {
  onMenuToggle?: () => void;
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle, className }) => {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header
      className={clsx(
        'sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur',
        className
      )}
    >
      {/* Left section */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="h-8 w-8 p-0 lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
        <Link to="/chat" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <span className="text-xs font-bold text-primary-foreground">F2</span>
          </div>
          <span className="hidden font-semibold text-foreground sm:inline">
            Financial Therapist
          </span>
        </Link>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="h-8 w-8 p-0"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* User menu */}
        {user && (
          <div className="relative" ref={menuRef}>
            <button
              className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-80"
              onClick={() => setShowUserMenu((prev) => !prev)}
              aria-label="User menu"
            >
              <Avatar size="sm" name={user.name} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-10 z-50 w-52 rounded-md border border-border bg-background shadow-lg">
                <div className="border-b border-border px-3 py-2">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    to="/settings?tab=profile"
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
