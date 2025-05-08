import { useState, useRef, useEffect } from 'react';
import { Message } from '@/types/chat';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

export const useChatLogic = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! I'm your assistant. Ask me anything!", isUser: false },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showAISystem, setShowAISystem] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleVoiceTranscription = (text: string) => {
    setInput(text);
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSubmit(fakeEvent);
    }, 500);
  };

  const toggleTools = () => {
    setShowTools(!showTools);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    const newUserMessage: Message = { id: messages.length + 1, text: input, isUser: true };
    setMessages([...messages, newUserMessage]);
    setInput('');
    setIsTyping(true);
    setShowTools(false);

    try {
      const response = await axios.post('http://localhost:5000/api/chat', {
        user_id: "default_user",
        question: input,
      });

      const { answer, attachments } = response.data;
      const formattedAnswer = Array.isArray(answer)
        ? answer.map((point: string) => `- ${point}`).join('\n')
        : `- ${answer}`;

      const botMessage: Message = {
        id: messages.length + 2,
        text: formattedAnswer,
        isUser: false,
        attachments: attachments || [],
      };

      setMessages((prevMessages) => [...prevMessages, botMessage]);
      setIsTyping(false);

      if (input.toLowerCase().includes('fetal movement') || input.toLowerCase().includes('baby kicking')) {
        toast({ title: "Feature", description: "Fetal tracking available in settings." });
      }
      if (input.toLowerCase().includes('prescription')) {
        toast({ title: "Success", description: "Prescription processed or upload an image." });
      }
    } catch (error) {
      const fallbackMessage: Message = {
        id: messages.length + 2,
        text: "- I’m sorry, I can’t answer that.\n- Try a different question.\n- I can help with health or cooking.",
        isUser: false,
        attachments: [],
      };
      setMessages((prevMessages) => [...prevMessages, fallbackMessage]);
      setIsTyping(false);
      toast({ title: "Error", description: "Try again later.", variant: "destructive" });
    }
  };

  return {
    input, setInput, messages, isTyping, showTools, showAISystem, messagesEndRef, handleSubmit, handleVoiceTranscription, toggleTools,
  };
};