import React, { useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from '../Common/Loader';
import { Message } from '../../types/chat';

interface ChatBoxProps {
  messages: Message[];
  isTyping?: boolean;
  className?: string;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ messages, isTyping = false, className }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (messages.length === 0 && !isTyping) {
    return (
      <div
        className={clsx(
          'flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center',
          className
        )}
      >
        <div className="rounded-full bg-primary/10 p-6">
          <svg
            className="h-12 w-12 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Start your financial wellness journey
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask me anything about budgeting, investing, debt management, or financial planning.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx('flex flex-1 flex-col overflow-y-auto px-4 py-6 space-y-4', className)}
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {messages.map((message, index) => (
        <ChatMessage
          key={message.id}
          message={message}
          isLastMessage={index === messages.length - 1}
        />
      ))}
      {isTyping && (
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <span className="text-xs font-semibold text-primary">AI</span>
          </div>
          <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
            <TypingIndicator />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};
