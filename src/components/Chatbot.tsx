import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ChatInterface from './chat/ChatInterface';

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Chatbot toggle button */}
      <Button
        onClick={toggleChatbot}
        className={cn(
          'fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg flex items-center justify-center transition-all duration-300',
          'bg-gradient-to-r from-health-blue to-health-light-blue hover:shadow-xl',
          isOpen ? 'translate-y-20 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        )}
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>

      {/* Chatbot window */}
      <div
        className={cn(
          'fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-xl z-50',
          'transition-all duration-500 ease-in-out transform',
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none',
          'flex flex-col border border-gray-200 overflow-hidden'
        )}
        style={{ maxHeight: 'calc(100vh - 100px)' }}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-health-blue to-health-light-blue text-white">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <h3 className="font-medium">Health Assistant</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleChatbot}
            className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ChatInterface />
      </div>
    </>
  );
};

export default Chatbot;