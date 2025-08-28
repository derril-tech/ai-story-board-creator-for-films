'use client';

import { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface StylePreset {
  name: string;
  description: string;
  base_prompt: string;
  negative_prompt: string;
  parameters: any;
}

interface StylePresetSelectorProps {
  presets: StylePreset[];
  selectedStyle: string;
  onStyleChange: (style: string) => void;
}

export function StylePresetSelector({ presets, selectedStyle, onStyleChange }: StylePresetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedPreset = presets.find(preset => preset.name === selectedStyle);

  const getStyleIcon = (styleName: string) => {
    switch (styleName) {
      case 'sketch':
        return '✏️';
      case 'storyboard':
        return '🎬';
      case 'concept':
        return '🎨';
      case 'realistic':
        return '📷';
      default:
        return '🎨';
    }
  };

  const getStyleColor = (styleName: string) => {
    switch (styleName) {
      case 'sketch':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'storyboard':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'concept':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'realistic':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="relative">
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-4 py-3">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Artistic Style</h3>
          
          {/* Selected Style Display */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getStyleIcon(selectedStyle)}</span>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900 capitalize">
                  {selectedStyle.replace('_', ' ')}
                </div>
                {selectedPreset && (
                  <div className="text-xs text-gray-500">
                    {selectedPreset.description}
                  </div>
                )}
              </div>
            </div>
            <ChevronDownIcon 
              className={`h-5 w-5 text-gray-400 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`} 
            />
          </button>

          {/* Style Options Dropdown */}
          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
              <div className="py-1">
                {presets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      onStyleChange(preset.name);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 ${
                      selectedStyle === preset.name ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <span className="text-2xl">{getStyleIcon(preset.name)}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {preset.name.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {preset.description}
                      </div>
                    </div>
                    {selectedStyle === preset.name && (
                      <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Style Preview */}
        {selectedPreset && (
          <div className="px-4 pb-4 border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Base Prompt</h4>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-700 font-mono">
                    {selectedPreset.base_prompt}
                  </p>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Negative Prompt</h4>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-700 font-mono">
                    {selectedPreset.negative_prompt}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Parameters */}
            <div className="mt-4">
              <h4 className="text-xs font-medium text-gray-700 mb-2">Parameters</h4>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(selectedPreset.parameters).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded p-2">
                    <div className="text-xs font-medium text-gray-700 capitalize">
                      {key.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {typeof value === 'number' ? value.toFixed(1) : value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
