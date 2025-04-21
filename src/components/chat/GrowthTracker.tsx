import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Baby, ArrowUp, Calendar, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface GrowthData {
  months: number[];
  weights: number[];
  heights: number[];
  percentile: number;
}

interface GrowthTrackerProps {
  data: GrowthData;
  showFullControls?: boolean;
}

const GrowthTracker: React.FC<GrowthTrackerProps> = ({ data, showFullControls = false }) => {
  const { toast } = useToast();

  const chartData = data.months.map((month, index) => ({
    month: `${month}m`,
    weight: data.weights[index],
    height: data.heights[index],
  }));

  const handleScheduleAppointment = () => {
    toast({
      title: 'Schedule Appointment',
      description: 'Redirecting to appointment scheduling...',
    });
    window.location.href = '/newborn-health?tab=appointments';
  };

  const handleAddGrowthData = () => {
    toast({
      title: 'Add Growth Data',
      description: 'Opening growth data form...',
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Baby className="h-4 w-4 text-health-blue" />
          Growth Trajectory
        </h4>
        <div className="flex items-center text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
          <ArrowUp className="h-3 w-3 mr-1" />
          <span>{data.percentile}th percentile</span>
        </div>
      </div>

      <div className="h-40 mb-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="weight"
              stroke="#4f46e5"
              activeDot={{ r: 8 }}
              name="Weight (kg)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2">
        <div>From {data.months[0]} to {data.months[data.months.length - 1]} months</div>
        <div>Weight: {data.weights[0]} kg → {data.weights[data.weights.length - 1]} kg</div>
      </div>

      {showFullControls && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="text-xs flex items-center" onClick={handleScheduleAppointment}>
            <Calendar className="h-3 w-3 mr-1" />
            Schedule Checkup
          </Button>
          <Button size="sm" variant="outline" className="text-xs flex items-center" onClick={handleAddGrowthData}>
            <ArrowUp className="h-3 w-3 mr-1" />
            Add New Measurement
          </Button>
          <Button size="sm" variant="outline" className="text-xs flex items-center">
            <QrCode className="h-3 w-3 mr-1" />
            Share via QR
          </Button>
        </div>
      )}
    </div>
  );
};

export default GrowthTracker;