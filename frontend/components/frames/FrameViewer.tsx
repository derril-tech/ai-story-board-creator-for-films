'use client';

import { useState } from 'react';
import { 
  ArrowPathIcon, 
  TrashIcon, 
  EyeIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

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

interface FrameViewerProps {
  frame: Frame;
  shot: Shot | undefined;
  onRegenerate: (generationParams: any) => void;
  onDelete: () => void;
}

export function FrameViewer({ frame, shot, onRegenerate, onDelete }: FrameViewerProps) {
  const [showOverlays, setShowOverlays] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [showPrompt, setShowPrompt] = useState(false);

  const handleRegenerate = () => {
    onRegenerate({
      shotId: frame.shotId,
      shotMetadata: shot?.metadata || {},
      characters: [],
      location: 'Unknown',
      actionDescription: shot?.description || '',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Shot {shot?.shotNumber} Frame
            </h3>
            <p className="text-sm text-gray-500">
              {shot?.shotSize} • {shot?.shotAngle} • {shot?.cameraMovement}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowOverlays(!showOverlays)}
              className={`p-2 rounded-md ${
                showOverlays 
                  ? 'bg-indigo-100 text-indigo-600' 
                  : 'bg-gray-100 text-gray-600'
              }`}
              title="Toggle overlays"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowPrompt(!showPrompt)}
              className={`p-2 rounded-md ${
                showPrompt 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-600'
              }`}
              title="Show prompt"
            >
              <Cog6ToothIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Frame Image */}
      <div className="relative">
        <div className="relative overflow-hidden bg-gray-100">
          {frame.imageUrl ? (
            <div className="relative">
              <img
                src={frame.imageUrl}
                alt={`Frame for shot ${shot?.shotNumber}`}
                className="w-full h-auto transition-transform duration-200"
                style={{ transform: `scale(${zoom})` }}
              />
              
              {/* Overlays */}
              {showOverlays && (
                <>
                  {/* Rule of Thirds Grid */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="grid grid-cols-3 grid-rows-3 h-full">
                      <div className="border-r border-white/30 border-b border-white/30"></div>
                      <div className="border-r border-white/30 border-b border-white/30"></div>
                      <div className="border-b border-white/30"></div>
                      <div className="border-r border-white/30 border-b border-white/30"></div>
                      <div className="border-r border-white/30 border-b border-white/30"></div>
                      <div className="border-b border-white/30"></div>
                      <div className="border-r border-white/30"></div>
                      <div className="border-r border-white/30"></div>
                      <div></div>
                    </div>
                  </div>

                  {/* Safe Zones */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-4 border border-red-500/50"></div>
                    <div className="absolute inset-8 border border-yellow-500/50"></div>
                  </div>

                  {/* Shot Info Overlay */}
                  <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                    <div className="font-medium">Shot {shot?.shotNumber}</div>
                    <div className="text-xs opacity-75">
                      {shot?.shotSize} • {shot?.shotAngle}
                    </div>
                  </div>

                  {/* Camera Info Overlay */}
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                    <div className="text-xs opacity-75">
                      {shot?.cameraMovement} • {shot?.lensType}
                    </div>
                    <div className="text-xs opacity-75">
                      {shot?.duration}s
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-400 text-6xl mb-4">🎬</div>
                <p className="text-gray-500">
                  {frame.status === 'generating' ? 'Generating frame...' : 'No image available'}
                </p>
                {frame.status === 'generating' && (
                  <div className="mt-4 w-32 mx-auto">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(frame.metadata?.progress || 0) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-4 left-4 flex space-x-2">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            className="bg-black/70 text-white p-2 rounded-full hover:bg-black/80"
            title="Zoom out"
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            className="bg-black/70 text-white p-2 rounded-full hover:bg-black/80"
            title="Zoom in"
          >
            <MagnifyingGlassIcon className="h-4 w-4 rotate-90" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="bg-black/70 text-white px-3 py-2 rounded text-sm hover:bg-black/80"
            title="Reset zoom"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Frame Details */}
      <div className="p-6 space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              frame.status === 'completed' ? 'bg-green-500' :
              frame.status === 'generating' ? 'bg-yellow-500' :
              frame.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
            }`} />
            <span className="text-sm font-medium capitalize">{frame.status}</span>
          </div>
          <div className="text-xs text-gray-500">
            {formatDate(frame.createdAt)}
          </div>
        </div>

        {/* Shot Description */}
        {shot?.description && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">Description</h4>
            <p className="text-sm text-gray-600">{shot.description}</p>
          </div>
        )}

        {/* Prompt */}
        {showPrompt && frame.promptUsed && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">Generation Prompt</h4>
            <div className="bg-gray-50 rounded p-3">
              <p className="text-sm text-gray-700 font-mono">{frame.promptUsed}</p>
            </div>
          </div>
        )}

        {/* Metadata */}
        {frame.metadata && Object.keys(frame.metadata).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">Metadata</h4>
            <div className="bg-gray-50 rounded p-3">
              <pre className="text-xs text-gray-700 overflow-auto">
                {JSON.stringify(frame.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleRegenerate}
            disabled={frame.status === 'generating'}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Regenerate
          </button>
          <button
            onClick={onDelete}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
