import React, { useState } from 'react';
import { useChatLogic } from '@/hooks/useChatLogic';
import ChatMessages from './ChatMessages';
import ToolsPanel from './ToolsPanel';
import ChatForm from './ChatForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Maximize2, MessageSquare, Stethoscope, Baby, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import VideoCall from './VideoCall';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const ChatInterface: React.FC = () => {
  const {
    input,
    setInput,
    messages,
    isTyping,
    showTools,
    showAISystem,
    messagesEndRef,
    handleSubmit,
    handleVoiceTranscription,
    toggleTools,
  } = useChatLogic();

  const { toast } = useToast();
  const [fullScreen, setFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);

  const toggleFullScreen = () => {
    setFullScreen(!fullScreen);
  };

  const handleVideoCall = () => setIsVideoCallOpen(true);
  const handleScanRx = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post('http://localhost:5000/api/scan-prescription', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        const medications = response.data.medications;
        const botMessage: Message = {
          id: messages.length + 1,
          text: "I've scanned your prescription. Here are the details:",
          isUser: false,
          attachments: [{
            type: 'prescription',
            data: {
              medications: medications.map((med: any) => ({
                name: med.name,
                dosage: med.dosage,
                frequency: med.frequency,
                startDate: '2025-05-01',
              })),
              doctor: 'Dr. Sarah Johnson',
              issueDate: '2025-05-01',
              notes: 'Take with food to minimize stomach upset.',
            },
          }],
        };
        setMessages((prev) => [...prev, botMessage]);
        toast({
          title: "Prescription Scanned",
          description: "Prescription details have been added to your chat.",
        });
      } else {
        throw new Error(response.data.error || 'Failed to scan prescription');
      }
    } catch (error) {
      toast({
        title: "Error Scanning Prescription",
        description: "Failed to scan the prescription. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewGrowth = () => {
    setInput('Show me my baby’s growth');
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const handleViewArticles = () => {
    setInput('Show me newborn care articles');
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  return (
    <div className={cn(
      "flex flex-col transition-all duration-300",
      fullScreen ? "h-[calc(100vh-120px)]" : "h-[600px]"
    )}>
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <Tabs
          defaultValue="chat"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-[80%]">
            <TabsTrigger value="chat" className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="maternal" className="flex items-center">
              <Stethoscope className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Maternal Health</span>
            </TabsTrigger>
            <TabsTrigger value="newborn" className="flex items-center">
              <Baby className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Newborn Health</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-grow flex flex-col">
            <ChatMessages
              messages={messages}
              isTyping={isTyping}
              showAISystem={showAISystem}
              messagesEndRef={messagesEndRef}
            />

            {showTools && (
              <ToolsPanel
                onVideoCall={handleVideoCall}
                onScanRx={() => document.getElementById('scan-rx-input')?.click()}
                onViewGrowth={handleViewGrowth}
                onViewArticles={handleViewArticles}
              />
            )}

            <input
              type="file"
              id="scan-rx-input"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleScanRx}
            />

            <ChatForm
              input={input}
              setInput={setInput}
              onSubmit={handleSubmit}
              showTools={showTools}
              toggleTools={toggleTools}
              onVideoCall={handleVideoCall}
              onScanRx={() => document.getElementById('scan-rx-input')?.click()}
              onViewGrowth={handleViewGrowth}
              onViewArticles={handleViewArticles}
            />
          </TabsContent>

          <TabsContent value="maternal" className="flex-grow overflow-auto p-4">
            <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
              <h3 className="font-medium text-lg mb-2">Maternal Health AI Assistant</h3>
              <p className="text-gray-600 mb-4">
                Specialized AI features for maternal health monitoring and support.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-health-blue font-medium">•</span>
                  <span>Fetal Movement Tracking with AI pattern recognition</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-health-blue font-medium">•</span>
                  <span>Nutritional recommendations based on your health profile</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-health-blue font-medium">•</span>
                  <span>Pregnancy symptom analysis and suggestions</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-health-blue font-medium">•</span>
                  <span>Digital health record sharing with your healthcare provider</span>
                </li>
              </ul>
              <Button className="mt-4 w-full bg-gradient-to-r from-health-blue to-health-light-blue">
                Connect with Maternal Health AI
              </Button>
            </div>
            <div className="text-center text-sm text-gray-500 mt-4">
              Try asking about "pregnancy nutrition", "managing back pain", or "preparing for labor"
            </div>
          </TabsContent>

          <TabsContent value="newborn" className="flex-grow overflow-auto p-4">
            <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
              <h3 className="font-medium text-lg mb-2">Newborn Health AI Assistant</h3>
              <p className="text-gray-600 mb-4">
                AI features specialized for monitoring and supporting newborn health.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-health-pink font-medium">•</span>
                  <span>Growth pattern analysis with milestone predictions</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-health-pink font-medium">•</span>
                  <span>Feeding and sleep schedule optimization</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-health-pink font-medium">•</span>
                  <span>Visual health check using your phone's camera</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-health-pink font-medium">•</span>
                  <span>Developmental milestone tracking with AI insights</span>
                </li>
              </ul>
              <Button className="mt-4 w-full bg-gradient-to-r from-health-pink to-health-light-pink">
                Connect with Newborn Health AI
              </Button>
            </div>
            <div className="text-center text-sm text-gray-500 mt-4">
              Try asking about "baby sleep patterns", "feeding schedule", or "developmental milestones"
            </div>
          </TabsContent>
        </Tabs>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullScreen}
          className="ml-2"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      <VideoCall isOpen={isVideoCallOpen} onClose={() => setIsVideoCallOpen(false)} />
    </div>
  );
};

export default ChatInterface;