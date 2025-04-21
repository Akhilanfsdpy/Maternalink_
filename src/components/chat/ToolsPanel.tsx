import React from 'react';
import { Button } from '@/components/ui/button';
import { Video, Camera, Baby, FileText } from 'lucide-react';

interface ToolsPanelProps {
  onVideoCall: () => void;
  onScanRx: () => void;
  onViewGrowth: () => void;
  onViewArticles: () => void;
}

const ToolsPanel: React.FC<ToolsPanelProps> = ({
  onVideoCall,
  onScanRx,
  onViewGrowth,
  onViewArticles,
}) => {
  return (
    <div className="bg-white border-t p-3 grid grid-cols-4 gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="flex flex-col items-center justify-center h-16 rounded-lg"
        onClick={onVideoCall}
      >
        <Video className="h-5 w-5 mb-1 text-health-blue" />
        <span className="text-xs">Video Call</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="flex flex-col items-center justify-center h-16 rounded-lg"
        onClick={onScanRx}
      >
        <Camera className="h-5 w-5 mb-1 text-health-blue" />
        <span className="text-xs">Scan Rx</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="flex flex-col items-center justify-center h-16 rounded-lg"
        onClick={onViewGrowth}
      >
        <Baby className="h-5 w-5 mb-1 text-health-blue" />
        <span className="text-xs">Growth</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="flex flex-col items-center justify-center h-16 rounded-lg"
        onClick={onViewArticles}
      >
        <FileText className="h-5 w-5 mb-1 text-health-blue" />
        <span className="text-xs">Articles</span>
      </Button>
    </div>
  );
};

export default ToolsPanel;