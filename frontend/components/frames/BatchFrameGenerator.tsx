'use client';

import { useState } from 'react';
import { XMarkIcon, PhotoIcon, CheckIcon } from '@heroicons/react/24/outline';

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

interface BatchFrameGeneratorProps {
  shots: Shot[];
  stylePresets: StylePreset[];
  selectedStyle: string;
  onGenerate: (shotIds: string[], generationParams: any) => void;
  onClose: () => void;
  isGenerating: boolean;
}

export function BatchFrameGenerator({ 
  shots, 
  stylePresets, 
  selectedStyle, 
  onGenerate, 
  onClose, 
  isGenerating 
}: BatchFrameGeneratorProps) {
  const [selectedShotIds, setSelectedShotIds] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [characters, setCharacters] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [actionDescription, setActionDescription] = useState<string>('');

  const selectedPreset = stylePresets.find(preset => preset.name === selectedStyle);

  const handleShotToggle = (shotId: string) => {
    setSelectedShotIds(prev => 
      prev.includes(shotId) 
        ? prev.filter(id => id !== shotId)
        : [...prev, shotId]
    );
  };

  const handleSelectAll = () => {
    setSelectedShotIds(shots.map(shot => shot.id));
  };

  const handleSelectNone = () => {
    setSelectedShotIds([]);
  };

  const handleGenerate = () => {
    if (selectedShotIds.length === 0) {
      alert('Please select at least one shot');
      return;
    }

    const generationParams = {
      characters: characters.split(',').map(c => c.trim()).filter(c => c),
      location: location || 'Unknown location',
      actionDescription: actionDescription || '',
      customPrompt: customPrompt || undefined,
      negativePrompt: negativePrompt || undefined,
    };

    onGenerate(selectedShotIds, generationParams);
  };

  const resetForm = () => {
    setSelectedShotIds([]);
    setCustomPrompt('');
    setNegativePrompt('');
    setCharacters('');
    setLocation('');
    setActionDescription('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <PhotoIcon className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">Batch Generate Frames</h2>
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
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Select Shots ({selectedShotIds.length} selected)
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                >
                  Select All
                </button>
                <button
                  onClick={handleSelectNone}
                  className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Select None
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {shots.map((shot) => (
                <div
                  key={shot.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedShotIds.includes(shot.id)
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleShotToggle(shot.id)}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    selectedShotIds.includes(shot.id)
                      ? 'border-indigo-500 bg-indigo-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedShotIds.includes(shot.id) && (
                      <CheckIcon className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      Shot {shot.shotNumber}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {shot.description}
                    </div>
                    <div className="text-xs text-gray-400">
                      {shot.shotSize} • {shot.shotAngle} • {shot.duration}s
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
            <p className="text-sm text-gray-600">
              These parameters will be applied to all selected shots. Individual shot descriptions will be used if no action description is provided.
            </p>
            
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
                Action Description (optional - will use shot descriptions if not provided)
              </label>
              <textarea
                value={actionDescription}
                onChange={(e) => setActionDescription(e.target.value)}
                placeholder="Describe the action happening in these shots..."
                rows={3}
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
                placeholder="Override the default prompt for all frames..."
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

          {/* Summary */}
          {selectedShotIds.length > 0 && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Generation Summary</h3>
              <div className="text-sm text-gray-600">
                <p>• {selectedShotIds.length} frame{selectedShotIds.length !== 1 ? 's' : ''} will be generated</p>
                <p>• Style: {selectedPreset?.name || selectedStyle}</p>
                <p>• Location: {location || 'Unknown'}</p>
                <p>• Characters: {characters || 'None specified'}</p>
                {actionDescription && <p>• Action: {actionDescription}</p>}
              </div>
            </div>
          )}
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
              disabled={selectedShotIds.length === 0 || isGenerating}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating 
                ? `Generating ${selectedShotIds.length} frames...` 
                : `Generate ${selectedShotIds.length} Frame${selectedShotIds.length !== 1 ? 's' : ''}`
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
