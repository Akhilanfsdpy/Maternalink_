import React from 'react';
import { cn } from '@/lib/utils';
import { Message } from '@/types/chat';
import SuggestedVideos from './SuggestedVideos';
import GrowthTracker from './GrowthTracker';
import EnhancedAISystem from './EnhancedAISystem';
import { FileText } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  showAISystem: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, showAISystem }) => {
  return (
    <div className="space-y-2">
      <div
        className={cn(
          'max-w-[80%] p-3 rounded-2xl animate-fade-in',
          message.isUser
            ? 'bg-primary text-white ml-auto rounded-tr-none'
            : 'bg-gray-100 text-gray-800 rounded-tl-none'
        )}
      >
        <p className="text-sm">{message.text}</p>
      </div>

      {message.attachments?.map((attachment, index) => (
        <div key={index} className="max-w-[80%] ml-auto mr-auto mt-2">
          {attachment.type === 'video' && <SuggestedVideos videos={attachment.data.suggestions} />}
          {attachment.type === 'growth' && <GrowthTracker data={attachment.data} showFullControls />}
          {attachment.type === 'article' && (
            <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
              <h4 className="font-medium text-sm">Suggested Articles</h4>
              {attachment.data.suggestions.map((article: any) => (
                <div key={article.id} className="flex gap-2 items-start py-2 border-t border-gray-100">
                  <FileText className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{article.title}</p>
                    <p className="text-xs text-gray-500">{article.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {attachment.type === 'ai' && showAISystem && <EnhancedAISystem />}
          {attachment.type === 'qr-code' && (
            <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
              <h4 className="font-medium text-sm">QR Code</h4>
              <p className="text-sm">{attachment.data.description}</p>
              <div className="w-20 h-20 bg-gray-200 flex items-center justify-center">
                <span>QR Placeholder</span> {/* Replace with actual QR code generation */}
              </div>
            </div>
          )}
          {attachment.type === 'prescription' && (
            <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
              <h4 className="font-medium text-sm">Prescription</h4>
              <p><strong>Doctor:</strong> {attachment.data.doctor}</p>
              <p><strong>Issue Date:</strong> {attachment.data.issueDate}</p>
              <p><strong>Notes:</strong> {attachment.data.notes}</p>
              <ul>
                {attachment.data.medications.map((med: any, idx: number) => (
                  <li key={idx} className="text-sm">
                    {med.name} - {med.dosage}, {med.frequency}, Started: {med.startDate}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MessageBubble;