import React, { useCallback, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Send, Paperclip, Smile } from 'lucide-react';
import { Button } from '../Common/Button';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const MAX_CHARS = 2000;

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading = false,
  placeholder = 'Type your message...',
  disabled = false,
  className,
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed || isLoading || disabled) return;

    onSendMessage(trimmed);
    setMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message, isLoading, disabled, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      setMessage(value);
      // Auto-resize textarea
      e.target.style.height = 'auto';
      e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
    }
  }, []);

  const charsRemaining = MAX_CHARS - message.length;
  const isNearLimit = charsRemaining < 100;

  return (
    <div
      className={clsx(
        'flex flex-col gap-2 border-t border-border bg-background px-4 py-3',
        className
      )}
    >
      <div
        className={clsx(
          'flex items-end gap-2 rounded-xl border border-input bg-background px-3 py-2',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1',
          disabled && 'opacity-50'
        )}
      >
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          rows={1}
          className={clsx(
            'flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground',
            'focus:outline-none disabled:cursor-not-allowed',
            'min-h-[36px] max-h-[200px]'
          )}
          aria-label="Message input"
        />
        <div className="flex items-center gap-1.5 pb-0.5">
          <button
            type="button"
            className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Attach file"
            disabled={disabled || isLoading}
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Add emoji"
            disabled={disabled || isLoading}
          >
            <Smile className="h-4 w-4" />
          </button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!message.trim() || disabled}
            className="h-8 w-8 p-0 rounded-lg"
            aria-label="Send message"
          >
            {!isLoading && <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      {isNearLimit && (
        <p
          className={clsx(
            'text-right text-xs',
            charsRemaining < 20 ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {charsRemaining} characters remaining
        </p>
      )}
      <p className="text-center text-xs text-muted-foreground">
        Press <kbd className="rounded border border-border px-1 font-mono text-xs">Enter</kbd> to
        send, <kbd className="rounded border border-border px-1 font-mono text-xs">Shift+Enter</kbd>{' '}
        for new line
      </p>
    </div>
  );
};
