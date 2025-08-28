'use client';

import { useState } from 'react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';

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

interface FrameGeneratorProps {
  shots: Shot[];
  stylePresets: StylePreset[];
  selectedStyle: string;
  onGenerate: (shotId: string, generationParams: any) => void;
  onClose: () => void;
  isGenerating: boolean;
}

export function FrameGenerator({ 
  shots, 
  stylePresets, 
  selectedStyle, 
  onGenerate, 
  onClose, 
  isGenerating 
}: FrameGeneratorProps) {
  const [selectedShotId, setSelectedShotId] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [characters, setCharacters] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [actionDescription, setActionDescription] = useState<string>('');
  const [dialogue, setDialogue] = useState<string>('');

  const selectedShot = shots.find(shot => shot.id === selectedShotId);
  const selectedPreset = stylePresets.find(preset => preset.name === selectedStyle);

  const handleGenerate = () => {
    if (!selectedShotId) {
      alert('Please select a shot');
      return;
    }

    const generationParams = {
      shotMetadata: selectedShot?.metadata || {},
      characters: characters.split(',').map(c => c.trim()).filter(c => c),
      location: location || 'Unknown location',
      actionDescription: actionDescription || selectedShot?.description || '',
      dialogue: dialogue || undefined,
      customPrompt: customPrompt || undefined,
      negativePrompt: negativePrompt || undefined,
    };

    onGenerate(selectedShotId, generationParams);
  };

  const resetForm = () => {
    setSelectedShotId('');
    setCustomPrompt('');
    setNegativePrompt('');
    setCharacters('');
    setLocation('');
    setActionDescription('');
    setDialogue('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <PhotoIcon className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">Generate Frame</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Shot Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Shot *
            </label>
            <select
              value={selectedShotId}
              onChange={(e) => setSelectedShotId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose a shot...</option>
              {shots.map((shot) => (
                <option key={shot.id} value={shot.id}>
                  Shot {shot.shotNumber}: {shot.description}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Shot Details */}
          {selectedShot && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Shot Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Shot Number:</span>
                  <span className="ml-2 font-medium">{selectedShot.shotNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <span className="ml-2 font-medium">{selectedShot.duration}s</span>
                </div>
                <div>
                  <span className="text-gray-500">Shot Size:</span>
                  <span className="ml-2 font-medium">{selectedShot.shotSize}</span>
                </div>
                <div>
                  <span className="text-gray-500">Shot Angle:</span>
                  <span className="ml-2 font-medium">{selectedShot.shotAngle}</span>
                </div>
                <div>
                  <span className="text-gray-500">Camera Movement:</span>
                  <span className="ml-2 font-medium">{selectedShot.cameraMovement}</span>
                </div>
                <div>
                  <span className="text-gray-500">Lens Type:</span>
                  <span className="ml-2 font-medium">{selectedShot.lensType}</span>
                </div>
              </div>
              {selectedShot.description && (
                <div className="mt-3">
                  <span className="text-gray-500 text-sm">Description:</span>
                  <p className="text-sm text-gray-700 mt-1">{selectedShot.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Style Information */}
          {selectedPreset && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Selected Style: {selectedPreset.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{selectedPreset.description}</p>
              <div className="text-xs text-gray-500">
                <div className="font-medium mb-1">Base Prompt:</div>
                <div className="bg-white rounded p-2 font-mono">{selectedPreset.base_prompt}</div>
              </div>
            </div>
          )}

          {/* Generation Parameters */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Generation Parameters</h3>
            
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location/Setting
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Downtown office building, Night time"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Characters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Characters (comma-separated)
              </label>
              <input
                type="text"
                value={characters}
                onChange={(e) => setCharacters(e.target.value)}
                placeholder="e.g., John, Sarah, Detective"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Action Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action Description
              </label>
              <textarea
                value={actionDescription}
                onChange={(e) => setActionDescription(e.target.value)}
                placeholder="Describe the action happening in this shot..."
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Dialogue */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dialogue (optional)
              </label>
              <textarea
                value={dialogue}
                onChange={(e) => setDialogue(e.target.value)}
                placeholder="Any dialogue in this shot..."
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Custom Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Prompt Override (optional)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Override the default prompt..."
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Negative Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Negative Prompt (optional)
              </label>
              <textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="Elements to avoid in generation..."
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={resetForm}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Reset Form
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!selectedShotId || isGenerating}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Generate Frame'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
