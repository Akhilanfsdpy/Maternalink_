import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="max-w-[80%] p-3 rounded-2xl bg-gray-100 text-gray-800 rounded-tl-none">
      <div className="flex space-x-1">
        <div className="h-2 w-2 bg-gray-400 rounded-full animate-pulse" />
        <div className="h-2 w-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
        <div className="h-2 w-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  );
};

export default TypingIndicator;