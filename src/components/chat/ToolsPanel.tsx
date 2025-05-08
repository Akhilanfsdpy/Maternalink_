import React from 'react';
import { Button } from '@/components/ui/button';
import { Video, FileText, Baby, BookOpen } from 'lucide-react';

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
    <div className="p-4 border-t bg-white">
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="flex items-center justify-center space-x-2"
          onClick={onVideoCall}
        >
          <Video className="h-4 w-4" />
          <span>Video Call</span>
        </Button>
        <Button
          variant="outline"
          className="flex items-center justify-center space-x-2"
          onClick={onScanRx}
        >
          <FileText className="h-4 w-4" />
          <span>Scan Rx</span>
        </Button>
        <Button
          variant="outline"
          className="flex items-center justify-center space-x-2"
          onClick={onViewGrowth}
        >
          <Baby className="h-4 w-4" />
          <span>Growth</span>
        </Button>
        <Button
          variant="outline"
          className="flex items-center justify-center space-x-2"
          onClick={onViewArticles}
        >
          <BookOpen className="h-4 w-4" />
          <span>Articles</span>
        </Button>
      </div>
    </div>
  );
};

export default ToolsPanel;