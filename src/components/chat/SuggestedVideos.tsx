import React from 'react';
import { Video } from 'lucide-react';

interface VideoItem {
  id: number;
  title: string;
  thumbnail: string;
  duration: string;
}

interface SuggestedVideosProps {
  videos: VideoItem[];
}

const SuggestedVideos: React.FC<SuggestedVideosProps> = ({ videos }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-3 border-b border-gray-100">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Video className="h-4 w-4 text-health-blue" />
          Suggested Videos
        </h4>
      </div>
      <div className="divide-y divide-gray-100">
        {videos.map((video) => (
          <div
            key={video.id}
            className="p-3 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-3"
            onClick={() => alert(`Playing video: ${video.title}`)}
          >
            <div className="relative flex-shrink-0">
              <img src={video.thumbnail} alt={video.title} className="w-20 h-12 object-cover rounded" />
              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                {video.duration}
              </div>
            </div>
            <div>
              <h5 className="text-sm font-medium">{video.title}</h5>
              <p className="text-xs text-gray-500 mt-1">Tap to watch</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestedVideos;