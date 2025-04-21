import React, { useState } from 'react';
import { Brain, Lightbulb, Database, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const EnhancedAISystem: React.FC = () => {
  const [activeModel, setActiveModel] = useState('gpt4');

  const models = [
    {
      id: 'gpt4',
      name: 'GPT-4',
      description: 'Advanced model for general healthcare insights',
      metrics: { accuracy: 92, reliability: 89, speed: 85 },
    },
    {
      id: 'llama',
      name: 'Llama',
      description: 'Specialized in maternal health information',
      metrics: { accuracy: 88, reliability: 92, speed: 94 },
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      description: 'Focused on pediatric development',
      metrics: { accuracy: 90, reliability: 87, speed: 91 },
    },
  ];

  const sources = [
    { name: 'Medical Journals', count: 213, color: 'bg-blue-500' },
    { name: 'Health Organizations', count: 78, color: 'bg-green-500' },
    { name: 'Clinical Guidelines', count: 156, color: 'bg-purple-500' },
    { name: 'Expert Reviews', count: 42, color: 'bg-orange-500' },
  ];

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-health-blue" />
            RAG-Enhanced AI System
          </CardTitle>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Active
          </Badge>
        </div>
        <CardDescription>Retrieval-Augmented Generation for reliable medical information</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="models" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="models">AI Models</TabsTrigger>
            <TabsTrigger value="sources">Knowledge Sources</TabsTrigger>
          </TabsList>

          <TabsContent value="models" className="space-y-4">
            {models.map((model) => (
              <div
                key={model.id}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  activeModel === model.id ? 'border-health-blue bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setActiveModel(model.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium flex items-center">
                      {model.name}
                      {activeModel === model.id && <Badge className="ml-2 bg-health-blue" variant="default">Active</Badge>}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{model.description}</p>
                  </div>
                  <Lightbulb
                    className={`h-5 w-5 ${activeModel === model.id ? 'text-health-blue' : 'text-gray-400'}`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Accuracy</div>
                    <div className="font-medium">{model.metrics.accuracy}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Reliability</div>
                    <div className="font-medium">{model.metrics.reliability}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Speed</div>
                    <div className="font-medium">{model.metrics.speed}%</div>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="sources">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-health-blue" />
                <span className="text-sm font-medium">Knowledge Base Statistics</span>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Total Sources</span>
                  <span className="font-bold">{sources.reduce((acc, src) => acc + src.count, 0)}</span>
                </div>

                <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden flex mb-3">
                  {sources.map((source, index) => (
                    <div
                      key={index}
                      className={`h-full ${source.color}`}
                      style={{ width: `${(source.count / sources.reduce((acc, src) => acc + src.count, 0)) * 100}%` }}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {sources.map((source, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${source.color}`} />
                      <div className="flex-1 flex justify-between">
                        <span className="text-xs">{source.name}</span>
                        <span className="text-xs font-medium">{source.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm border-t pt-3">
                <div className="flex items-center gap-1">
                  <PieChart className="h-4 w-4 text-health-blue" />
                  <span>RAG Confidence Score</span>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  94%
                </Badge>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EnhancedAISystem;