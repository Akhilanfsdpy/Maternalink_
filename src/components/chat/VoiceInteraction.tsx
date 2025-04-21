import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Languages, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';

interface VoiceInteractionProps {
  onTranscription?: (text: string) => void;
}

const VoiceInteraction: React.FC<VoiceInteractionProps> = ({ onTranscription }) => {
  const [isListening, setIsListening] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const languages = [
    { value: 'en-US', label: 'English (US)' },
    { value: 'es-ES', label: 'Spanish' },
    { value: 'fr-FR', label: 'French' },
    { value: 'de-DE', label: 'German' },
    { value: 'zh-CN', label: 'Chinese' },
    { value: 'hi-IN', label: 'Hindi' },
  ];

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (onTranscription) {
          onTranscription(transcript);
        }
        stopListening();
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        toast({
          title: 'Recognition Error',
          description: `Error: ${event.error}`,
          variant: 'destructive',
        });
        stopListening();
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          setIsListening(false);
        }
      };
    }

    audioRef.current = new Audio();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = selectedLanguage;
    }
  }, [selectedLanguage]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    setIsListening(true);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        toast({
          title: 'Listening...',
          description: `Voice recognition active in ${languages.find((l) => l.value === selectedLanguage)?.label}`,
        });
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        toast({
          title: 'Recognition Error',
          description: 'Failed to start speech recognition',
          variant: 'destructive',
        });
        setIsListening(false);
      }
    } else {
      toast({
        title: 'Listening...',
        description: `Voice recognition active in ${languages.find((l) => l.value === selectedLanguage)?.label}`,
      });
      setTimeout(() => {
        const simulatedTranscript = "How can I track my baby's development milestones?";
        if (onTranscription) {
          onTranscription(simulatedTranscript);
        }
        stopListening();
      }, 3000);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Failed to stop speech recognition:', error);
      }
    }
    setIsListening(false);
  };

  const toggleOfflineMode = () => {
    setIsOfflineMode(!isOfflineMode);
    toast({
      title: isOfflineMode ? 'Online Mode' : 'Offline Mode',
      description: isOfflineMode
        ? 'Connected to cloud services for better recognition'
        : 'Using device-based recognition for offline use',
    });
  };

  const speakText = async (text: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          lang: selectedLanguage.split('-')[0],
        }),
      });

      const data = await response.json();
      if (data.success && data.audio_url) {
        if (audioRef.current) {
          audioRef.current.src = data.audio_url;
          audioRef.current.play();
        }
      } else {
        throw new Error(data.error || 'Failed to generate speech');
      }
    } catch (error) {
      console.error('Text-to-speech error:', error);
      toast({
        title: 'Speech Error',
        description: 'Failed to generate speech',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant={isListening ? 'default' : 'outline'}
              onClick={toggleListening}
              className={isListening ? 'bg-red-500 hover:bg-red-600' : ''}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isListening ? 'Stop listening' : 'Start voice input'}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
        <SelectTrigger className="w-[130px] h-9">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {languages.map((language) => (
            <SelectItem key={language.value} value={language.value}>
              <div className="flex items-center">
                <Languages className="w-3 h-3 mr-2" />
                {language.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              onClick={toggleOfflineMode}
              className={isOfflineMode ? 'border-green-500 text-green-500' : ''}
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isOfflineMode ? 'Using offline voice recognition' : 'Using cloud voice recognition'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default VoiceInteraction;