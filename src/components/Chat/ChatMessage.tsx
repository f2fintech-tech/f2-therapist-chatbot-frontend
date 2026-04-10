import React from 'react';
import { clsx } from 'clsx';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { Message } from '../../types/chat';
import { formatMessageTime } from '../../utils/formatters';
import { Avatar } from '../Common/Avatar';

interface ChatMessageProps {
  message: Message;
  isLastMessage?: boolean;
}

const statusIcons = {
  sending: <Clock className="h-3 w-3" />,
  sent: <Check className="h-3 w-3" />,
  delivered: <CheckCheck className="h-3 w-3" />,
  error: <AlertCircle className="h-3 w-3 text-destructive" />,
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div
      className={clsx(
        'flex animate-fade-in items-start gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      {isUser ? (
        <Avatar size="sm" name="You" className="shrink-0 mt-0.5" />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary mt-0.5">
          <span className="text-xs font-bold text-primary-foreground">AI</span>
        </div>
      )}

      {/* Message bubble */}
      <div
        className={clsx(
          'flex max-w-[70%] flex-col gap-1',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={clsx(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-muted text-foreground rounded-tl-sm',
            message.status === 'error' && 'border border-destructive/50'
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {/* Timestamp and status */}
        <div
          className={clsx(
            'flex items-center gap-1 text-xs text-muted-foreground',
            isUser ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          <time dateTime={message.timestamp}>{formatMessageTime(message.timestamp)}</time>
          {isUser && message.status && (
            <span
              className={clsx(
                'flex items-center',
                message.status === 'delivered' && 'text-primary',
                message.status === 'error' && 'text-destructive'
              )}
            >
              {statusIcons[message.status]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
