'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, FilmIcon, SpeakerWaveIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';

interface AnimaticGeneratorProps {
  sceneId: number;
  onGenerate: (data: any) => void;
  onClose: () => void;
}

interface Format {
  id: string;
  name: string;
  description: string;
}

interface CaptionStyle {
  id: string;
  name: string;
  description: string;
}

export function AnimaticGenerator({ sceneId, onGenerate, onClose }: AnimaticGeneratorProps) {
  const [formats, setFormats] = useState<Format[]>([]);
  const [captionStyles, setCaptionStyles] = useState<CaptionStyle[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    format: 'mp4',
    includeCaptions: true,
    captionStyle: 'simple',
    audioTrack: 'dialogue_only',
    customMusicUrl: '',
    frameDuration: 3.0,
    transitionDuration: 0.5,
    resolution: '1920x1080',
    frameRate: 24,
  });

  useEffect(() => {
    fetchFormats();
    fetchCaptionStyles();
  }, []);

  const fetchFormats = async () => {
    try {
      const response = await fetch('/api/v1/animatics/formats');
      const data = await response.json();
      setFormats(data.formats || []);
    } catch (error) {
      console.error('Failed to fetch formats:', error);
    }
  };

  const fetchCaptionStyles = async () => {
    try {
      const response = await fetch('/api/v1/animatics/caption-styles');
      const data = await response.json();
      setCaptionStyles(data.styles || []);
    } catch (error) {
      console.error('Failed to fetch caption styles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onGenerate({
        sceneId,
        ...formData,
      });
    } catch (error) {
      console.error('Failed to generate animatic:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <FilmIcon className="h-6 w-6 text-purple-600" />
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                Generate Animatic
              </Dialog.Title>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Settings</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Output Format
                  </label>
                  <Select
                    value={formData.format}
                    onChange={(value) => handleInputChange('format', value)}
                  >
                    {formats.map((format) => (
                      <option key={format.id} value={format.id}>
                        {format.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution
                  </label>
                  <Select
                    value={formData.resolution}
                    onChange={(value) => handleInputChange('resolution', value)}
                  >
                    <option value="1920x1080">1920x1080 (Full HD)</option>
                    <option value="1280x720">1280x720 (HD)</option>
                    <option value="854x480">854x480 (SD)</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frame Rate
                  </label>
                  <Select
                    value={formData.frameRate.toString()}
                    onChange={(value) => handleInputChange('frameRate', parseInt(value))}
                  >
                    <option value="24">24 fps (Film)</option>
                    <option value="30">30 fps (Video)</option>
                    <option value="60">60 fps (Smooth)</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frame Duration (seconds)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    value={formData.frameDuration}
                    onChange={(e) => handleInputChange('frameDuration', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Captions */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">Captions</h3>
              </div>
              
              <Checkbox
                checked={formData.includeCaptions}
                onChange={(checked) => handleInputChange('includeCaptions', checked)}
                label="Include captions"
              />

              {formData.includeCaptions && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Caption Style
                  </label>
                  <Select
                    value={formData.captionStyle}
                    onChange={(value) => handleInputChange('captionStyle', value)}
                  >
                    {captionStyles.map((style) => (
                      <option key={style.id} value={style.id}>
                        {style.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>

            {/* Audio */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <SpeakerWaveIcon className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-medium text-gray-900">Audio</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Audio Track
                </label>
                <Select
                  value={formData.audioTrack}
                  onChange={(value) => handleInputChange('audioTrack', value)}
                >
                  <option value="dialogue_only">Dialogue Only</option>
                  <option value="dialogue_music">Dialogue + Music</option>
                  <option value="music_only">Music Only</option>
                  <option value="none">No Audio</option>
                </Select>
              </div>

              {formData.audioTrack === 'dialogue_music' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Music URL (optional)
                  </label>
                  <Input
                    type="url"
                    placeholder="https://example.com/music.mp3"
                    value={formData.customMusicUrl}
                    onChange={(e) => handleInputChange('customMusicUrl', e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Transitions */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Transitions</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transition Duration (seconds)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.transitionDuration}
                  onChange={(e) => handleInputChange('transitionDuration', parseFloat(e.target.value))}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <FilmIcon className="h-4 w-4" />
                    Generate Animatic
                  </>
                )}
              </Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
