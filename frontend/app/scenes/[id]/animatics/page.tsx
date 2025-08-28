'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AnimaticPreview } from '@/components/animatics/AnimaticPreview';
import { AnimaticGenerator } from '@/components/animatics/AnimaticGenerator';
import { TimelineViewer } from '@/components/animatics/TimelineViewer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PlayIcon, PlusIcon, ClockIcon, FilmIcon } from '@heroicons/react/24/outline';

interface Animatic {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  duration: number;
  format: string;
  createdAt: string;
  downloadUrl?: string;
}

interface TimelineData {
  sceneId: number;
  totalDuration: number;
  frames: Array<{
    frameId: number;
    startTime: number;
    endTime: number;
    duration: number;
    shotId: number;
    shotNumber: number;
  }>;
  captions: Array<{
    text: string;
    startTime: number;
    endTime: number;
    position: string;
    style: string;
  }>;
  audioSegments: Array<{
    dialogueId: number;
    startTime: number;
    endTime: number;
    text: string;
    audioUrl?: string;
  }>;
}

export default function AnimaticsPage() {
  const params = useParams();
  const sceneId = parseInt(params.id as string);
  
  const [animatics, setAnimatics] = useState<Animatic[]>([]);
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [selectedAnimatic, setSelectedAnimatic] = useState<Animatic | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnimatics();
    fetchTimeline();
  }, [sceneId]);

  const fetchAnimatics = async () => {
    try {
      const response = await fetch(`/api/v1/animatics?sceneId=${sceneId}`);
      const data = await response.json();
      setAnimatics(data.animatics || []);
    } catch (error) {
      console.error('Failed to fetch animatics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async () => {
    try {
      const response = await fetch(`/api/v1/animatics/scene/${sceneId}/timeline`);
      const data = await response.json();
      setTimeline(data);
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
    }
  };

  const handleGenerateAnimatic = async (generationData: any) => {
    try {
      const response = await fetch('/api/v1/animatics/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generationData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setShowGenerator(false);
        // Start polling for status
        pollAnimaticStatus(result.animatic_id);
      } else {
        throw new Error(result.message || 'Failed to generate animatic');
      }
    } catch (error) {
      console.error('Failed to generate animatic:', error);
    }
  };

  const pollAnimaticStatus = async (animaticId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/v1/animatics/${animaticId}/status`);
        const status = await response.json();
        
        if (status.status === 'completed') {
          fetchAnimatics(); // Refresh list
          return;
        } else if (status.status === 'failed') {
          console.error('Animatic generation failed:', status.message);
          return;
        }
        
        // Continue polling
        setTimeout(poll, 2000);
      } catch (error) {
        console.error('Failed to poll animatic status:', error);
      }
    };
    
    poll();
  };

  const handleDeleteAnimatic = async (animaticId: string) => {
    if (!confirm('Are you sure you want to delete this animatic?')) return;
    
    try {
      const response = await fetch(`/api/v1/animatics/${animaticId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchAnimatics();
      } else {
        throw new Error('Failed to delete animatic');
      }
    } catch (error) {
      console.error('Failed to delete animatic:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'processing': return 'blue';
      case 'pending': return 'yellow';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scene Animatics</h1>
          <p className="text-gray-600 mt-2">Generate and manage animatics for this scene</p>
        </div>
        <Button
          onClick={() => setShowGenerator(true)}
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Generate Animatic
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline Viewer */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ClockIcon className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Timeline</h2>
            </div>
            {timeline ? (
              <TimelineViewer timeline={timeline} />
            ) : (
              <div className="text-center py-8 text-gray-500">
                No timeline data available
              </div>
            )}
          </Card>
        </div>

        {/* Animatics List */}
        <div>
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FilmIcon className="h-5 w-5 text-purple-600" />
              <h2 className="text-xl font-semibold">Animatics</h2>
            </div>
            
            {animatics.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FilmIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No animatics generated yet</p>
                <Button
                  onClick={() => setShowGenerator(true)}
                  variant="outline"
                  className="mt-4"
                >
                  Generate First Animatic
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {animatics.map((animatic) => (
                  <div
                    key={animatic.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{animatic.title}</h3>
                      <Badge color={getStatusColor(animatic.status)}>
                        {animatic.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Format: {animatic.format.toUpperCase()}</p>
                      <p>Duration: {animatic.duration}s</p>
                      <p>Created: {new Date(animatic.createdAt).toLocaleDateString()}</p>
                    </div>
                    
                    {animatic.status === 'processing' && (
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${animatic.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{animatic.progress}% complete</p>
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-3">
                      {animatic.status === 'completed' && (
                        <>
                          <Button
                            onClick={() => setSelectedAnimatic(animatic)}
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            <PlayIcon className="h-4 w-4" />
                            Preview
                          </Button>
                          {animatic.downloadUrl && (
                            <Button
                              onClick={() => window.open(animatic.downloadUrl, '_blank')}
                              size="sm"
                              variant="outline"
                            >
                              Download
                            </Button>
                          )}
                        </>
                      )}
                      <Button
                        onClick={() => handleDeleteAnimatic(animatic.id)}
                        size="sm"
                        variant="outline"
                        color="red"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Animatic Generator Modal */}
      {showGenerator && (
        <AnimaticGenerator
          sceneId={sceneId}
          onGenerate={handleGenerateAnimatic}
          onClose={() => setShowGenerator(false)}
        />
      )}

      {/* Animatic Preview Modal */}
      {selectedAnimatic && (
        <AnimaticPreview
          animatic={selectedAnimatic}
          onClose={() => setSelectedAnimatic(null)}
        />
      )}
    </div>
  );
}
