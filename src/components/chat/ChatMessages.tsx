import React from 'react';
import { Message } from '@/types/chat';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface ChatMessagesProps {
  messages: Message[];
  isTyping: boolean;
  showAISystem: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isTyping,
  showAISystem,
  messagesEndRef,
}) => {
  return (
    <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
      <div className="space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            showAISystem={showAISystem}
          />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatMessages;