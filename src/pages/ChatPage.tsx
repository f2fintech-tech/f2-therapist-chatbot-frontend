import React, { useEffect, useState } from 'react';
import { ChatBox } from '../components/Chat/ChatBox';
import { ChatInput } from '../components/Chat/ChatInput';
import { ChatHeader } from '../components/Chat/ChatHeader';
import { ChatSidebar } from '../components/Chat/ChatSidebar';
import { Navbar } from '../components/Layout/Navbar';
import { useChat } from '../hooks/useChat';

const ChatPage: React.FC = () => {
  const {
    conversations,
    activeConversation,
    isLoadingConversations,
    isLoadingMessages,
    isSendingMessage,
    fetchConversations,
    selectConversation,
    createConversation,
    deleteConversation,
    sendMessage,
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleSendMessage = async (content: string) => {
    if (!activeConversation) {
      // Auto-create a new conversation if none is active
      await createConversation();
    }
    await sendMessage(content);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Navbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar for larger screens is inline; mobile is overlay */}
        <div className="hidden lg:flex">
          <ChatSidebar
            conversations={conversations}
            activeConversationId={activeConversation?.id}
            onSelectConversation={selectConversation}
            onNewConversation={createConversation}
            onDeleteConversation={deleteConversation}
            isLoading={isLoadingConversations}
          />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="lg:hidden">
            <div
              className="fixed inset-0 z-30 bg-black/40"
              onClick={() => setSidebarOpen(false)}
            />
            <ChatSidebar
              conversations={conversations}
              activeConversationId={activeConversation?.id}
              onSelectConversation={(id) => {
                selectConversation(id);
                setSidebarOpen(false);
              }}
              onNewConversation={() => {
                createConversation();
                setSidebarOpen(false);
              }}
              onDeleteConversation={deleteConversation}
              isLoading={isLoadingConversations}
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              className="fixed inset-y-0 left-0 z-40"
            />
          </div>
        )}

        {/* Main chat area */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <ChatHeader
            conversation={activeConversation}
            onDeleteConversation={
              activeConversation
                ? () => deleteConversation(activeConversation.id)
                : undefined
            }
          />
          <ChatBox
            messages={activeConversation?.messages || []}
            isTyping={isSendingMessage || isLoadingMessages}
            className="flex-1"
          />
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isSendingMessage}
            disabled={isLoadingMessages}
          />
        </main>
      </div>
    </div>
  );
};

export default ChatPage;
