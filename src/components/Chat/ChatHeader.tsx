import React from 'react';
import { clsx } from 'clsx';
import { MoreVertical, Trash2, Edit3, Bot } from 'lucide-react';
import { Conversation } from '../../types/chat';

interface ChatHeaderProps {
  conversation: Conversation | null;
  onDeleteConversation?: () => void;
  onRenameConversation?: () => void;
  className?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  onDeleteConversation,
  onRenameConversation,
  className,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className={clsx(
        'flex items-center justify-between border-b border-border bg-background px-4 py-3',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {conversation?.title || 'Financial Therapy AI'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {conversation
              ? `${conversation.messages.length} messages`
              : 'Start a new conversation'}
          </p>
        </div>
      </div>

      {conversation && (
        <div className="relative" ref={menuRef}>
          <button
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => setShowMenu((prev) => !prev)}
            aria-label="Conversation options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-8 z-10 w-44 rounded-md border border-border bg-background shadow-md">
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                onClick={() => {
                  onRenameConversation?.();
                  setShowMenu(false);
                }}
              >
                <Edit3 className="h-4 w-4" />
                Rename
              </button>
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                onClick={() => {
                  onDeleteConversation?.();
                  setShowMenu(false);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
