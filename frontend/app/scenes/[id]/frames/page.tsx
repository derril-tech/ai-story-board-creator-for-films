'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  PhotoIcon, 
  PlusIcon, 
  TrashIcon, 
  ArrowPathIcon,
  EyeIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { FrameViewer } from '@/components/frames/FrameViewer';
import { FrameGenerator } from '@/components/frames/FrameGenerator';
import { BatchFrameGenerator } from '@/components/frames/BatchFrameGenerator';
import { StylePresetSelector } from '@/components/frames/StylePresetSelector';

interface Frame {
  id: string;
  shotId: string;
  imageUrl: string;
  promptUsed: string;
  metadata: any;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Shot {
  id: string;
  sceneId: string;
  shotNumber: number;
  description: string;
  shotSize: string;
  shotAngle: string;
  cameraMovement: string;
  lensType: string;
  duration: number;
  metadata: any;
}

interface StylePreset {
  name: string;
  description: string;
  base_prompt: string;
  negative_prompt: string;
  parameters: any;
}

export default function FramesPage() {
  const params = useParams();
  const sceneId = params.id as string;
  
  const [frames, setFrames] = useState<Frame[]>([]);
  const [shots, setShots] = useState<Shot[]>([]);
  const [stylePresets, setStylePresets] = useState<StylePreset[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string>('storyboard');
  const [showGenerator, setShowGenerator] = useState(false);
  const [showBatchGenerator, setShowBatchGenerator] = useState(false);

  useEffect(() => {
    fetchShots();
    fetchFrames();
    fetchStylePresets();
  }, [sceneId]);

  const fetchShots = async () => {
    try {
      const response = await fetch(`/api/v1/shots?sceneId=${sceneId}`);
      if (response.ok) {
        const data = await response.json();
        setShots(data);
      }
    } catch (error) {
      console.error('Failed to fetch shots:', error);
      toast.error('Failed to load shots');
    }
  };

  const fetchFrames = async () => {
    try {
      const response = await fetch(`/api/v1/frames`);
      if (response.ok) {
        const data = await response.json();
        // Filter frames for shots in this scene
        const sceneFrames = data.filter((frame: Frame) => 
          shots.some(shot => shot.id === frame.shotId)
        );
        setFrames(sceneFrames);
      }
    } catch (error) {
      console.error('Failed to fetch frames:', error);
      toast.error('Failed to load frames');
    }
  };

  const fetchStylePresets = async () => {
    try {
      const response = await fetch('/api/v1/frames/styles');
      if (response.ok) {
        const data = await response.json();
        setStylePresets(data);
      }
    } catch (error) {
      console.error('Failed to fetch style presets:', error);
      toast.error('Failed to load style presets');
    }
  };

  const handleGenerateFrame = async (shotId: string, generationParams: any) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/v1/frames/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shotId,
          style: selectedStyle,
          ...generationParams,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Frame generation started');
        
        // Poll for status
        pollFrameStatus(result.frameId);
      } else {
        const error = await response.json();
        toast.error(`Generation failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Frame generation error:', error);
      toast.error('Failed to start frame generation');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBatchGenerate = async (shotIds: string[], generationParams: any) => {
    setIsBatchGenerating(true);
    try {
      const response = await fetch('/api/v1/frames/batch-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shotIds,
          style: selectedStyle,
          batchSize: 5,
          ...generationParams,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Batch generation started for ${shotIds.length} frames`);
        
        // Poll for batch status
        pollBatchStatus(result.batchId);
      } else {
        const error = await response.json();
        toast.error(`Batch generation failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Batch generation error:', error);
      toast.error('Failed to start batch generation');
    } finally {
      setIsBatchGenerating(false);
    }
  };

  const pollFrameStatus = async (frameId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/v1/frames/${frameId}/status`);
        if (response.ok) {
          const status = await response.json();
          
          if (status.status === 'completed') {
            clearInterval(pollInterval);
            toast.success('Frame generated successfully');
            fetchFrames(); // Refresh frames list
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            toast.error(`Frame generation failed: ${status.error_message}`);
          }
        }
      } catch (error) {
        console.error('Status polling error:', error);
      }
    }, 2000); // Poll every 2 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 300000);
  };

  const pollBatchStatus = async (batchId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/v1/frames/batch/${batchId}/status`);
        if (response.ok) {
          const status = await response.json();
          
          if (status.status === 'completed') {
            clearInterval(pollInterval);
            toast.success('Batch generation completed');
            fetchFrames(); // Refresh frames list
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            toast.error(`Batch generation failed: ${status.error_message}`);
          }
        }
      } catch (error) {
        console.error('Batch status polling error:', error);
      }
    }, 5000); // Poll every 5 seconds

    // Stop polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 600000);
  };

  const handleDeleteFrame = async (frameId: string) => {
    if (!confirm('Are you sure you want to delete this frame?')) return;

    try {
      const response = await fetch(`/api/v1/frames/${frameId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Frame deleted successfully');
        setFrames(frames.filter(frame => frame.id !== frameId));
        if (selectedFrame?.id === frameId) {
          setSelectedFrame(null);
        }
      } else {
        const error = await response.json();
        toast.error(`Delete failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Delete frame error:', error);
      toast.error('Failed to delete frame');
    }
  };

  const handleRegenerateFrame = async (frameId: string, generationParams: any) => {
    try {
      const response = await fetch(`/api/v1/frames/${frameId}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          style: selectedStyle,
          ...generationParams,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Frame regeneration started');
        pollFrameStatus(result.frameId);
      } else {
        const error = await response.json();
        toast.error(`Regeneration failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Frame regeneration error:', error);
      toast.error('Failed to regenerate frame');
    }
  };

  const getShotForFrame = (frame: Frame) => {
    return shots.find(shot => shot.id === frame.shotId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Frame Management</h1>
              <p className="mt-2 text-gray-600">
                Generate and manage storyboard frames for Scene {sceneId}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowBatchGenerator(true)}
                disabled={isBatchGenerating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Batch Generate
              </button>
              <button
                onClick={() => setShowGenerator(true)}
                disabled={isGenerating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <PhotoIcon className="h-4 w-4 mr-2" />
                Generate Frame
              </button>
            </div>
          </div>
        </div>

        {/* Style Preset Selector */}
        <div className="mb-6">
          <StylePresetSelector
            presets={stylePresets}
            selectedStyle={selectedStyle}
            onStyleChange={setSelectedStyle}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Frames List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Generated Frames</h2>
                <p className="text-sm text-gray-500">
                  {frames.length} frame{frames.length !== 1 ? 's' : ''} generated
                </p>
              </div>
              
              {frames.length === 0 ? (
                <div className="p-12 text-center">
                  <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No frames</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by generating your first frame.
                  </p>
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {frames.map((frame) => {
                      const shot = getShotForFrame(frame);
                      return (
                        <div
                          key={frame.id}
                          className={`relative group cursor-pointer rounded-lg border-2 transition-all ${
                            selectedFrame?.id === frame.id
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedFrame(frame)}
                        >
                          <div className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center">
                            {frame.imageUrl ? (
                              <img
                                src={frame.imageUrl}
                                alt={`Frame for shot ${shot?.shotNumber}`}
                                className="w-full h-full object-cover rounded-t-lg"
                              />
                            ) : (
                              <div className="text-center">
                                <PhotoIcon className="mx-auto h-8 w-8 text-gray-400" />
                                <p className="text-xs text-gray-500 mt-1">
                                  {frame.status === 'generating' ? 'Generating...' : 'No image'}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  Shot {shot?.shotNumber}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {shot?.shotSize} • {shot?.shotAngle}
                                </p>
                              </div>
                              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRegenerateFrame(frame.id, {
                                      shotId: frame.shotId,
                                      shotMetadata: shot?.metadata || {},
                                      characters: [],
                                      location: 'Unknown',
                                      actionDescription: shot?.description || '',
                                    });
                                  }}
                                  className="p-1 text-gray-400 hover:text-indigo-600"
                                  title="Regenerate"
                                >
                                  <ArrowPathIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFrame(frame.id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                  title="Delete"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            
                            {frame.status === 'generating' && (
                              <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-1">
                                  <div
                                    className="bg-indigo-600 h-1 rounded-full transition-all duration-300"
                                    style={{ width: `${(frame.metadata?.progress || 0) * 100}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Frame Viewer */}
          <div className="lg:col-span-1">
            {selectedFrame ? (
              <FrameViewer
                frame={selectedFrame}
                shot={getShotForFrame(selectedFrame)}
                onRegenerate={(generationParams) => 
                  handleRegenerateFrame(selectedFrame.id, generationParams)
                }
                onDelete={() => handleDeleteFrame(selectedFrame.id)}
              />
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center">
                  <EyeIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No frame selected</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Select a frame from the list to view details and options.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {showGenerator && (
          <FrameGenerator
            shots={shots}
            stylePresets={stylePresets}
            selectedStyle={selectedStyle}
            onGenerate={handleGenerateFrame}
            onClose={() => setShowGenerator(false)}
            isGenerating={isGenerating}
          />
        )}

        {showBatchGenerator && (
          <BatchFrameGenerator
            shots={shots}
            stylePresets={stylePresets}
            selectedStyle={selectedStyle}
            onGenerate={handleBatchGenerate}
            onClose={() => setShowBatchGenerator(false)}
            isGenerating={isBatchGenerating}
          />
        )}
      </div>
    </div>
  );
}
